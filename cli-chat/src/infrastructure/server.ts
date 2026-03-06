import net from 'net';
import { MessageType } from '../domain/enums/MessageType';
import { MessageEnvelope } from '../domain/types/MessageEnvelope';
import { ErrorCode } from '../domain/errors/ErrorCode';
import { JoinUserUseCase } from '../application/useCases/JoinUserUseCase';
import { InMemoryUserRepository } from './repositories/InMemoryUserRepository';
import { User } from '../domain/entities/User';

const PORT = 4000;

const connectionMap = new Map<string, net.Socket>();
const userRepository = new InMemoryUserRepository();
const joinUserUseCase = new JoinUserUseCase(userRepository);

function convertEnvelopeToJson(envelope: MessageEnvelope) {
    return JSON.stringify(envelope) + '\n';
}

function broadcast(envelope: MessageEnvelope, senderUser: User) {
    for (const [userId, clientSocket] of connectionMap.entries()) {
        const user = userRepository.getById(userId);

        if (userId !== senderUser.id) {
            clientSocket.write(convertEnvelopeToJson(envelope));
        }
    }
}

function sendMessage(envelope: MessageEnvelope, socket: net.Socket) {
    return socket.write(convertEnvelopeToJson(envelope));
}


const server = net.createServer((socket) => {
    console.log(`New client connected from ${socket.remoteAddress}`);

    let buffer = '';

    const welcomeMessage: MessageEnvelope = {
        type: MessageType.SYSTEM,
        payload: {
            message: "Welcome to the Citadel. Please send a JOIN command."
        },
        timestamp: new Date().toISOString()
    };

    sendMessage(welcomeMessage, socket)

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

                        const user = joinUserUseCase.execute(envelope.payload.username);
                        const username = user.username.value;


                        connectionMap.set(user.id, socket);
                        console.log(`User joined with name: ${username}`);

                        const successResponse: MessageEnvelope = {
                            type: MessageType.SYSTEM,
                            payload: {
                                message: `Welcome, ${username}!`
                            },
                            timestamp: new Date().toISOString()
                        }

                        sendMessage(successResponse, socket)

                        broadcast({
                            type: MessageType.SYSTEM,
                            payload: {
                                message: `${username} has entered the Citadel.`
                            },
                            timestamp: new Date().toISOString()
                        }, user);

                    } catch (domainError: any) {
                        const errorCode = domainError.message === "Username is already taken"
                            ? ErrorCode.DUPLICATE_USERNAME
                            : ErrorCode.INVALID_USERNAME;

                        const errorResponse: MessageEnvelope = {
                            type: MessageType.ERROR,
                            payload: {
                                code: errorCode,
                                message: domainError.message
                            },
                            timestamp: new Date().toISOString()
                        }

                        sendMessage(errorResponse, socket);
                    }
                } else if (envelope.type === MessageType.MESSAGE) {
                    const entry = [...connectionMap.entries()].find(([userId, s]) => s === socket);

                    if (!entry) {
                        const errorResponse: MessageEnvelope = {
                            type: MessageType.ERROR,
                            payload: {
                                code: ErrorCode.UNAUTHORIZED,
                                message: "You must JOIN before sending messages."
                            },
                            timestamp: new Date().toISOString()
                        }

                        sendMessage(errorResponse, socket)

                        continue;
                    }


                    const [userId] = entry;
                    const senderUser = userRepository.getById(userId);
                    if (!senderUser) {
                        continue;
                    }

                    const username = senderUser.username.value;

                    if (!envelope.payload.text) {
                        throw new Error("MESSAGE payload must contain 'text'.");
                    }

                    console.log(`[${username}]: ${envelope.payload.text}`);

                    const broadcastMessage: MessageEnvelope = {
                        type: MessageType.MESSAGE,
                        payload: {
                            username: username,
                            text: envelope.payload.text
                        },
                        timestamp: new Date().toISOString()
                    }

                    broadcast(broadcastMessage, senderUser);
                }

            } catch (err: any) {
                console.error(`Protocol violation: ${err.message}`);

                const errorResponse: MessageEnvelope = {
                    type: MessageType.ERROR,
                    payload: {
                        code: ErrorCode.INVALID_PROTOCOL,
                        message: err.message || "Expected valid JSON MessageEnvelope"
                    },
                    timestamp: new Date().toISOString()
                }
                sendMessage(errorResponse, socket);
            }
        }
    });

    socket.on('end', () => {
        const entry = [...connectionMap.entries()].find(([id, s]) => s === socket);

        if (entry) {
            const [userId] = entry;

            const user = userRepository.getById(userId);
            const username = user?.username.value

            connectionMap.delete(userId);
            userRepository.remove(userId);

            console.log(`${username} disconnected. Total users; ${connectionMap.size}`);

            const disonnectMessage: MessageEnvelope = {
                type: MessageType.SYSTEM,
                payload: {
                    message: `${username} has left the Citadel.`
                },
                timestamp: new Date().toISOString()
            }

            if (user) {
                broadcast(disonnectMessage, user);
            }

        }
    });

    socket.on('error', (err) => {
        console.error('Socket error:', err.message);
    });

});

server.listen(PORT, () => {
    console.log(`TCP Server engine fired up and listening on port ${PORT}...`);
});