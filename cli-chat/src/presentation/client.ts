import net from 'net';
import readline from 'readline';
import { MessageType } from '../domain/enums/MessageType';
import { MessageEnvelope } from '../domain/types/MessageEnvelope';
import { createEnvelope } from '../shared/utils/createEnvelope';
import { clientLogger } from './output/ClientLogger';

const PORT = 4000;
const HOST = '127.0.0.1';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> '
});

const client = new net.Socket();
let buffer = '';
let currentUsername = '';
let currentRoom: string | undefined = undefined;
let isJoined = false;

function sendEnvelope(envelope: MessageEnvelope) {
    client.write(JSON.stringify(envelope) + '\n');
}

client.connect(PORT, HOST, () => {
    clientLogger.info(`Connected to the Citadel Server.\n`);
});

client.on('data', (chunk) => {
    buffer += chunk.toString();
    const parts = buffer.split('\n');
    buffer = parts.pop() ?? '';

    for (const rawData of parts) {
        if (!rawData.trim()) {
            continue;
        }

        try {
            const envelope: MessageEnvelope = JSON.parse(rawData);

            if (envelope.type === MessageType.SYSTEM) {
                clientLogger.system(envelope.payload.message);


                if (!isJoined && envelope.payload.message.includes("JOIN COMMAND")) {
                    rl.question('Enter your username: ', (name) => {
                        currentUsername = name.trim();

                        const joinEnvelope: MessageEnvelope = createEnvelope(
                            MessageType.JOIN,
                            {
                                username: currentUsername
                            }
                        );

                        sendEnvelope(joinEnvelope);
                    });
                }
                else if (!isJoined && envelope.payload.message.includes("Welcome,")) {
                    isJoined = true;
                    rl.prompt();
                } else if (isJoined && envelope.payload.message.includes("entered the room")){
                    currentRoom = envelope.payload.room;
                } else if (isJoined && envelope.payload.message.includes("returned")){
                    currentRoom = undefined;
                }

            }
            else if (envelope.type === MessageType.MESSAGE) {
                if (envelope.payload.room) {
                    clientLogger.message(`[${envelope.payload.room}] ${envelope.payload.username ?? 'Unknown'}`, envelope.payload.text ?? '');
                } else {
                    clientLogger.message(envelope.payload.username ?? 'Unknown', envelope.payload.text ?? '');
                }
            }
            else if (envelope.type === MessageType.WHISPER) {
                clientLogger.whisper(envelope.payload.username, envelope.payload.text);
            }
            else if (envelope.type === MessageType.ERROR) {
                clientLogger.error(`${envelope.payload.code}: ${envelope.payload.message}`);

                if (!isJoined && (envelope.payload.code === 'INVALID_USERNAME' || envelope.payload.code === 'DUPLICATE_USERNAME')) {
                    rl.question('Try a different username: ', (name) => {
                        currentUsername = name.trim();

                        const joinErrorEnvelope: MessageEnvelope = createEnvelope(
                            MessageType.JOIN,
                            {
                                username: currentUsername
                            }
                        )

                        sendEnvelope(joinErrorEnvelope);
                    });
                } else if (envelope.type == MessageType.ERROR) {
                    if (envelope.payload.code === 'ROOM_FULL' || envelope.payload.code === 'ALREADY_IN_ROOM') {
                        clientLogger.warn(envelope.payload.message);
                    }
                    else {
                        clientLogger.error(`${envelope.payload.code}: ${envelope.payload.message}`);
                    }
                }
            }

            if (isJoined) {
                rl.prompt();
            }

        } catch (err) {
            clientLogger.error(`Failed to parse incoming message: ${rawData}`);
        }
    }
});

client.on('close', () => {
    clientLogger.warn("Disconnected from server.");
    process.exit(0);
});

rl.on('line', (input) => {
    const text = input.trim();

    if (!text) {
        rl.prompt();
        return;
    }

    if (text.startsWith('/join ')) {
        const requestedName = text.substring(6).trim();
        currentUsername = requestedName;

        const joinEnvelope: MessageEnvelope = createEnvelope(
            MessageType.JOIN,
            {
                username: requestedName
            }
        )
        sendEnvelope(joinEnvelope);
    }
    else if (isJoined && text.startsWith('/whisper ')) {
        const payloadText = text.substring(9).trim();
        const divider = payloadText.indexOf(' ');

        if (divider === -1) {
            clientLogger.warn("Invalid format. Use: /whisper <username> <message>");
        } else {
            const whisperEnvelope: MessageEnvelope = createEnvelope(
                MessageType.WHISPER,
                {
                    username: currentUsername,
                    recipient: payloadText.slice(0, divider),
                    text: payloadText.slice(divider + 1)
                }
            );
            sendEnvelope(whisperEnvelope);
        }
    }
    else if (isJoined && text.startsWith('/room ')) {
        const roomDetails = text.substring(6).trim().split(" ");

        let roomName = roomDetails[0];
        let roomLimit = parseInt(roomDetails[1]) || 10;

        const roomEnvelope: MessageEnvelope = createEnvelope(
            MessageType.ROOM_JOIN,
            {
                username: currentUsername,
                room: roomName,
                limit: roomLimit
            }
        );

        sendEnvelope(roomEnvelope);
    }
    else if (isJoined && text.startsWith('/leave ')){
        const roomDetails = text.substring(7).trim().split(" ");

        let roomName = roomDetails[0];

        const roomEnvelope: MessageEnvelope = createEnvelope(
            MessageType.ROOM_LEAVE,
            {
                username: currentUsername,
                room: roomName
            }
        );

        sendEnvelope(roomEnvelope);
    }
    else if (isJoined) {
        const messageEnvelope: MessageEnvelope = createEnvelope(
            MessageType.MESSAGE,
            {
                text,
                room: currentRoom
            }
        );
        sendEnvelope(messageEnvelope);
    }
    else {
        clientLogger.warn("You must type /join <username> to enter the chat.");
    }

    rl.prompt();
});