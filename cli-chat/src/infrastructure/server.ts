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

const PORT = 4000;

const connectionMap = new Map<string, net.Socket>();
const userRepository = new InMemoryUserRepository();
const userJoinUseCase = new UserJoinUseCase(userRepository);
const sendMessageUseCase = new SendMessageUseCase(userRepository);
const userDisconnectUseCase = new UserDisconnectUseCase(userRepository);

function serializeEnvelope(envelope: MessageEnvelope) {
    return JSON.stringify(envelope) + '\n';
}

function broadcastEnvelope(envelope: MessageEnvelope, senderUser: User) {
    for (const [userId, clientSocket] of connectionMap.entries()) {

        if (userId !== senderUser.id) {
            clientSocket.write(serializeEnvelope(envelope));
        }
    }
}

function sendEnvelope(envelope: MessageEnvelope, socket: net.Socket) {
    return socket.write(serializeEnvelope(envelope));
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
                    const entry = [...connectionMap.entries()].find(([userId, s]) => s === socket);

                    if (!entry) {
                        const errorEnvelope: MessageEnvelope = createEnvelope(
                            MessageType.ERROR,
                            {
                                code: ErrorCode.UNAUTHORIZED,
                                message: "You must JOIN before sending messages."
                            }
                        );

                        sendEnvelope(errorEnvelope, socket)

                        continue;
                    }

                    const [userId] = entry;
                    const sender = sendMessageUseCase.execute(userId, envelope.payload.text);

                    serverLogger.info(`Message from ${sender.username}: ${sender.text}`);

                    const messageEnvelope: MessageEnvelope = createEnvelope(
                        MessageType.MESSAGE,
                        {
                            username: sender.username,
                            text: sender.text
                        }
                    );

                    broadcastEnvelope(messageEnvelope, sender.user);
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
        const entry = [...connectionMap.entries()].find(([id, s]) => s === socket);

        if (entry) {
            const [userId] = entry;

            const user = userDisconnectUseCase.execute(userId);
            connectionMap.delete(userId);

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