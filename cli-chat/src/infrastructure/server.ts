import net from 'net';
import { MessageType } from '../domain/enums/MessageType';
import { MessageEnvelope } from '../domain/types/MessageEnvelope';
import { ErrorCode } from '../domain/errors/ErrorCode';
import { Username } from '../domain/valueObjects/Username';

const PORT = 4000;

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

    socket.write(JSON.stringify(welcomeMessage) + '\n');

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
                        if(!envelope.payload.username){
                            throw new Error("JOIN payload must contain a username");
                        }

                        const username = new Username(envelope.payload.username);

                        console.log(`User joined with name: ${username.getValue()}`);

                        const successResponse: MessageEnvelope = {
                            type: MessageType.SYSTEM,
                            payload: {
                                message: `Welcome, ${username.getValue()}!`
                            },
                            timestamp: new Date().toISOString()
                        }

                        socket.write(JSON.stringify(successResponse) + '\n');

                    } catch (domainError: any) {
                        const errorResponse: MessageEnvelope = {
                            type: MessageType.ERROR,
                            payload: {
                                code: ErrorCode.INVALID_USERNAME,
                                message: domainError.message
                            },
                            timestamp: new Date().toISOString()
                        }

                        socket.write(JSON.stringify(errorResponse) + '\n');
                    }
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

                socket.write(JSON.stringify(errorResponse) + '\n');
            }
        }
    });

    socket.on('end', () => {
        console.log('Client disconnected');
    });

    socket.on('error', (err) => {
        console.error('Socket error:', err.message);
    });

});

server.listen(PORT, () => {
    console.log(`TCP Server engine fired up and listening on port ${PORT}...`);
});