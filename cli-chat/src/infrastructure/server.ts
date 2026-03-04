import net from 'net';
import { MessageType } from '../domain/enums/MessageType';
import { MessageEnvelope } from '../domain/types/MessageEnvelope';
import { ErrorCode } from '../domain/errors/ErrorCode';
import { Username } from '../domain/valueObjects/Username';

const PORT = 4000;

const connectedClients = new Map<net.Socket, string>();

function convertEnvelopeToJson(envelope: MessageEnvelope){
    return JSON.stringify(envelope) + '\n';
}

function broadcast(envelope: MessageEnvelope, senderSocket?: net.Socket) {
    for (const [clientSocket, _] of connectedClients.entries()) {
        if (clientSocket !== senderSocket) {
            clientSocket.write(convertEnvelopeToJson(envelope));
        }
    }
}

function sendMessage(envelope: MessageEnvelope, socket: net.Socket){
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

        let boundary = buffer.indexOf('\n');

        while (boundary !== -1) {
            const rawData = buffer.substring(0, boundary).trim();
            buffer = buffer.substring(boundary + 1);
            boundary = buffer.indexOf('\n');


            if (!rawData) {
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

                        const username = new Username(envelope.payload.username);
                        const nameString = username.getValue()

                        for (const existingName of connectedClients.values()) {
                            if (existingName === nameString) {
                                throw new Error("Username is already taken.");
                            }
                        }

                        connectedClients.set(socket, nameString);
                        console.log(`User joined with name: ${username.getValue()}`);

                        const successResponse: MessageEnvelope = {
                            type: MessageType.SYSTEM,
                            payload: {
                                message: `Welcome, ${username.getValue()}!`
                            },
                            timestamp: new Date().toISOString()
                        }

                        sendMessage(successResponse, socket)

                        broadcast({
                            type: MessageType.SYSTEM,
                            payload: {
                                message: `${nameString} has entered the Citadel.`
                            },
                            timestamp: new Date().toISOString()
                        }, socket);

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
                    const senderName = connectedClients.get(socket);

                    if (!senderName) {
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

                    if (!envelope.payload.text) {
                        throw new Error("MESSAGE payload must contain 'text'.");
                    }

                    console.log(`[${senderName}]: ${envelope.payload.text}`);

                    const broadcastMessage: MessageEnvelope = {
                        type: MessageType.ERROR,
                        payload: {
                            code: senderName,
                            message: envelope.payload.text
                        },
                        timestamp: new Date().toISOString()
                    }

                    broadcast(broadcastMessage, socket);
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
        const name = connectedClients.get(socket);

        if (name) {
            connectedClients.delete(socket);

            console.log(`${name} disconnected. Total users; ${connectedClients.size}`);

            const disonnectMessage: MessageEnvelope = {
                type: MessageType.ERROR,
                payload: {
                    message: `${name} has left the Citadel.`
                },
                timestamp: new Date().toISOString()
            }

            broadcast(disonnectMessage, socket);
        }
    });

    socket.on('error', (err) => {
        console.error('Socket error:', err.message);
    });

});

server.listen(PORT, () => {
    console.log(`TCP Server engine fired up and listening on port ${PORT}...`);
});