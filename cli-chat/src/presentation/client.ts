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
                clientLogger.info(`[SYSTEM]: ${envelope.payload.message}`);


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
                }

            }
            else if (envelope.type === MessageType.MESSAGE) {
                clientLogger.info(`[${envelope.payload.username}]: ${envelope.payload.text}`);
            }
            else if (envelope.type === MessageType.ERROR) {
                clientLogger.error(`[ERROR - ${envelope.payload.code}]: ${envelope.payload.message}`);

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
                }
            }

            if (isJoined) {
                rl.prompt();
            }

        } catch (err) {
            clientLogger.error(`Failed to parse incomming message: ${rawData}`);
        }
    }
});

client.on('close', () => {
    clientLogger.warn('\n Disonnected from server.');
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
    else if (isJoined) {
        const messageEnvelope: MessageEnvelope = createEnvelope(
            MessageType.MESSAGE,
            {
                text
            }
        );
        sendEnvelope(messageEnvelope);
    }
    else {
        clientLogger.warn(`[CLIENT]: You must type /join <username> to enter the chat.`);
    }

    rl.prompt();
});