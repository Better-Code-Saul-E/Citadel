import net from 'net';
import { MessageType } from '../domain/enums/MessageType';
import { MessageEnvelope } from '../domain/types/MessageEnvelope';
import { ErrorCode } from '../domain/errors/ErrorCode';
import { UserJoinUseCase } from '../application/useCases/UserJoinUseCase';
import { InMemoryUserRepository } from './repositories/InMemoryUserRepository';
import { User } from '../domain/entities/User';
import { createEnvelope } from '../shared/utils/createEnvelope';
import { serverLogger } from './logger/ServerLogger';
import { SendMessageUseCase } from '../application/useCases/SendMessageUseCase';
import { UserDisconnectUseCase } from '../application/useCases/UserDisconnectUseCase';
import { InMemoryRoomRepository } from './repositories/InMemoryRoomRepository';
import { JoinRoomUseCase } from '../application/useCases/JoinRoomUseCase';
import { LeaveRoomUseCase } from '../application/useCases/LeaveRoomUseCase';


const PORT = 4000;

const connectionMap = new Map<string, net.Socket>();
const socketToUserId = new Map<net.Socket, string>();
const userRepository = new InMemoryUserRepository();
const roomRepository = new InMemoryRoomRepository();

const userJoinUseCase = new UserJoinUseCase(userRepository);
const sendMessageUseCase = new SendMessageUseCase(userRepository);
const userDisconnectUseCase = new UserDisconnectUseCase(userRepository);
const joinRoomUseCase = new JoinRoomUseCase(userRepository, roomRepository);
const leaveRoomUseCase = new LeaveRoomUseCase(roomRepository);


function broadcastEnvelope(envelope: MessageEnvelope, senderUser: User) {
    for (const [userId, clientSocket] of connectionMap.entries()) {

        if (userId !== senderUser.id) {
            sendEnvelope(envelope, clientSocket);
        }
    }
}
function whisperEnvelope(envelope: MessageEnvelope, userId: string) {
    const socket = connectionMap.get(userId);

    if (socket) {
        sendEnvelope(envelope, socket);
    }
}

function sendEnvelope(envelope: MessageEnvelope, socket: net.Socket) {
    return socket.write(JSON.stringify(envelope) + '\n');
}

function requireAuth(socket: net.Socket): string | null {
    const userId = socketToUserId.get(socket);

    if (!userId) {
        const errorEnvelope: MessageEnvelope = createEnvelope(
            MessageType.ERROR,
            {
                code: ErrorCode.UNAUTHORIZED,
                message: "You must JOIN before sending messages."
            }
        );

        sendEnvelope(errorEnvelope, socket)

        return null;
    }

    return userId;
}


const server = net.createServer((socket) => {
    serverLogger.info(`New client connected from ${socket.remoteAddress}`);

    let buffer = '';

    const welcomeEnvelope: MessageEnvelope = createEnvelope(
        MessageType.SYSTEM,
        { message: "Welcome to the Citadel. Please send a JOIN command." }
    );

    sendEnvelope(welcomeEnvelope, socket)

    socket.on('data', (chunk) => {
        buffer += chunk.toString();

        const parts = buffer.split('\n');
        buffer = parts.pop() ?? '';

        for (const rawData of parts) {
            const trimmed = rawData.trim();

            if (!trimmed) {
                continue;
            }

            try {
                const parsedData = JSON.parse(rawData);

                if (!parsedData.type || !Object.values(MessageType).includes(parsedData.type)) {
                    throw new Error("Invalid or missing MessageType");
                }
                if (!parsedData.payload || typeof parsedData.payload !== 'object') {
                    throw new Error("Missing or invalid payload object");
                }
                if (!parsedData.timestamp || isNaN(Date.parse(parsedData.timestamp))) {
                    throw new Error("Missing or invalid ISO timestamp");
                }

                const envelope: MessageEnvelope = parsedData;

                if (envelope.type === MessageType.JOIN) {
                    try {
                        if (!envelope.payload.username) {
                            throw new Error("JOIN payload must contain a username");
                        }

                        const user = userJoinUseCase.execute(envelope.payload.username);
                        const username = user.username.value;


                        connectionMap.set(user.id, socket);
                        socketToUserId.set(socket, user.id);

                        serverLogger.info(`User joined with name: ${username}`);

                        const successEnvelope: MessageEnvelope = createEnvelope(
                            MessageType.SYSTEM,
                            { message: `Welcome, ${username}!` }
                        );

                        sendEnvelope(successEnvelope, socket)

                        const userJoinedEnvelope: MessageEnvelope = createEnvelope(
                            MessageType.SYSTEM,
                            { message: `${username} has entered the Citadel.` }
                        );
                        broadcastEnvelope(userJoinedEnvelope, user);

                    } catch (domainError: any) {
                        const errorCode = domainError.message === "Username is already taken"
                            ? ErrorCode.DUPLICATE_USERNAME
                            : ErrorCode.INVALID_USERNAME;

                        const errorEnvelope: MessageEnvelope = createEnvelope(
                            MessageType.ERROR,
                            {
                                code: errorCode,
                                message: domainError.message
                            },
                        );

                        sendEnvelope(errorEnvelope, socket);
                    }
                } else if (envelope.type === MessageType.MESSAGE) {
                    const userId = requireAuth(socket);

                    if (!userId) {
                        continue;
                    }

                    const sender = sendMessageUseCase.execute(userId, envelope.payload.text);
                    const targetRoomName = envelope.payload.room;

                    if (targetRoomName) {
                        const room = roomRepository.getByName(targetRoomName);

                        if (room && room.hasUser(userId)) {
                            serverLogger.info(`[${room.name}] Message from ${sender.username}: ${sender.text}`);

                            const messageEnvelope: MessageEnvelope = createEnvelope(
                                MessageType.MESSAGE,
                                {
                                    username: sender.username,
                                    text: sender.text,
                                    room: room.name
                                }
                            );

                            for (const member of room.members) {
                                if (member.id !== userId) {
                                    const memberSocket = connectionMap.get(member.id);
                                    if (memberSocket) {
                                        sendEnvelope(messageEnvelope, memberSocket);
                                    }
                                }
                            }
                        }
                    } else {
                        serverLogger.info(`[GLOBAL] Message from ${sender.username}: ${sender.text}`);

                        const messageEnvelope: MessageEnvelope = createEnvelope(
                            MessageType.MESSAGE,
                            {
                                username: sender.username,
                                text: sender.text
                            }
                        );

                        for (const [id, currentSocket] of connectionMap.entries()) {
                            const targetUser = userRepository.getById(id);

                            if (targetUser && targetUser.id !== userId && targetUser.currentRoomName === null) {
                                sendEnvelope(messageEnvelope, currentSocket);
                            }
                        }
                    }
                } else if (envelope.type == MessageType.WHISPER) {
                    const userId = requireAuth(socket);

                    if (!userId) {
                        continue;
                    }

                    const recipient = userRepository.getByUsername(envelope.payload.recipient);

                    if (!recipient) {
                        const errorEnvelope: MessageEnvelope = createEnvelope(
                            MessageType.ERROR,
                            {
                                code: ErrorCode.USER_NOT_FOUND,
                                message: "Recipient does not exists"
                            }
                        );

                        sendEnvelope(errorEnvelope, socket)
                        continue;
                    }

                    const sender = sendMessageUseCase.execute(userId, envelope.payload.text);

                    serverLogger.info(`Message from ${sender.username} to ${recipient.username}: ${sender.text}`);

                    const messageEnvelope: MessageEnvelope = createEnvelope(
                        MessageType.WHISPER,
                        {
                            username: sender.username,
                            text: sender.text
                        }
                    );

                    whisperEnvelope(messageEnvelope, recipient.id);
                } else if (envelope.type == MessageType.ROOM_JOIN) {
                    const userId = requireAuth(socket);

                    if (!userId) {
                        continue;
                    }

                    const user = userRepository.getById(userId);

                    try {
                        const room = joinRoomUseCase.execute(userId, envelope.payload.room, envelope.payload.limit);
                        serverLogger.info(`${user?.username.value} joined room: ${room.name}`);

                        const successEnvelope: MessageEnvelope = createEnvelope(
                            MessageType.SYSTEM,
                            {
                                message: `You have entered the room: ${room.name}`,
                                room: room.name
                            }
                        );

                        sendEnvelope(successEnvelope, socket);
                    }
                    catch (err: any) {
                        const errorEnvelope: MessageEnvelope = createEnvelope(
                            MessageType.ERROR,
                            {
                                code: ErrorCode.UNAUTHORIZED,
                                message: err.message
                            }
                        );

                        sendEnvelope(errorEnvelope, socket);
                    }

                } else if (envelope.type == MessageType.ROOM_LEAVE) {
                    const userId = requireAuth(socket);

                    if (!userId) {
                        continue;
                    }

                    const user = userRepository.getById(userId);

                    const roomToLeave = roomRepository.getByName(envelope.payload.room);

                    try {
                        leaveRoomUseCase.execute(userId, envelope.payload.room);

                        if (user) {
                            user.currentRoomName = null;
                        }

                        serverLogger.info(`${user?.username.value} has returned to the Citadel.`);

                        const successEnvelope: MessageEnvelope = createEnvelope(
                            MessageType.SYSTEM,
                            {
                                message: `You have left the room and returned to the Citadel.`
                            }
                        );

                        sendEnvelope(successEnvelope, socket);

                        if (roomToLeave) {
                            const departureEnvelope: MessageEnvelope = createEnvelope(
                                MessageType.SYSTEM,
                                { message: `${user?.username.value} has left the room.` }
                            );

                            for (const member of roomToLeave.members) {
                                if (member.id !== userId) {
                                    const memberSocket = connectionMap.get(member.id);
                                    if (memberSocket) {
                                        sendEnvelope(departureEnvelope, memberSocket);
                                    }
                                }
                            }
                        }

                    } catch (err: any) {
                        const errorEnvelope: MessageEnvelope = createEnvelope(
                            MessageType.ERROR,
                            {
                                code: ErrorCode.UNAUTHORIZED,
                                message: err.message
                            }
                        );

                        sendEnvelope(errorEnvelope, socket);
                    }

                }
            } catch (err: any) {
                serverLogger.warn(`Protocol violation: ${err.message}`);

                const errorEnvelope: MessageEnvelope = createEnvelope(
                    MessageType.ERROR,
                    {
                        code: ErrorCode.INVALID_PROTOCOL,
                        message: err.message || "Expected valid JSON MessageEnvelope"
                    }
                );

                sendEnvelope(errorEnvelope, socket);
            }
        }
    });

    socket.on('end', () => {
        const userId = socketToUserId.get(socket);

        if (userId) {
            const user = userDisconnectUseCase.execute(userId);

            connectionMap.delete(userId);
            socketToUserId.delete(socket);

            if (!user) {
                return;
            }

            const username = user.username.value;

            serverLogger.info(`${username} disconnected. Total users: ${connectionMap.size}`);

            const disconnectEnvelope: MessageEnvelope = createEnvelope(
                MessageType.SYSTEM,
                {
                    message: `${username} has left the Citadel.`
                }
            );

            broadcastEnvelope(disconnectEnvelope, user);
        }
    });

    socket.on('error', (err) => {
        serverLogger.error(`Socket error: ${err.message}`);
    });

});

server.listen(PORT, () => {
    serverLogger.info(`TCP Server engine fired up and listening on port ${PORT}...`);
});