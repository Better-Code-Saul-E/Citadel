import net from 'net';
import readline from 'readline';
import { MessageType } from '../domain/enums/MessageType';
import { MessageEnvelope } from '../domain/types/MessageEnvelope';

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

function sendEnvelope(type: MessageType, payload: any) {
    const envelope: MessageEnvelope = {
        type,
        payload,
        timestamp: new Date().toISOString()
    };

    client.write(JSON.stringify(envelope) + '\n');
}

client.connect(PORT, HOST, () => {
    console.log(`Connected to the Citadel Server.\n`);
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
                console.log(`[SYSTEM]: ${envelope.payload.message}`);


                if (!isJoined && envelope.payload.message.includes("JOIN COMMAND")) {
                    rl.question('Enter your username: ', (name) => {
                        currentUsername = name.trim();

                        sendEnvelope(
                            MessageType.JOIN,
                            {
                                username: currentUsername
                            }
                        );
                    });
                }
                else if (!isJoined && envelope.payload.message.includes("Welcome,")) {
                    isJoined = true;
                    rl.prompt();
                }

            }
            else if (envelope.type === MessageType.MESSAGE) {
                console.log(`[${envelope.payload.username}]: ${envelope.payload.text}`);
            }
            else if (envelope.type === MessageType.ERROR) {
                console.log(`[ERROR - ${envelope.payload.code}]: ${envelope.payload.message}`);

                if (!isJoined && (envelope.payload.code === 'INVALID_USERNAME' || envelope.payload.code === 'DUPLICATE_USERNAME')) {
                    rl.question('Try a different username: ', (name) => {
                        currentUsername = name.trim();

                        sendEnvelope(
                            MessageType.JOIN,
                            {
                                username: currentUsername
                            }
                        );
                    });
                }
            }

            if (isJoined) {
                rl.prompt();
            }

        } catch (err) {
            console.error('Failed to parse incomming message:', rawData);
        }
    }
});

client.on('close', () => {
    console.log('\n Disonnected from server.');
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
        sendEnvelope(
            MessageType.JOIN,
            {
                username: requestedName
            }
        );
    }
    else if (isJoined) {
        sendEnvelope(
            MessageType.MESSAGE,
            {
                text
            }
        );
    }
    else {
        console.log(`[CLIENT]: You must type /join <username> to enter the chat.`);
    }

    rl.prompt();
});