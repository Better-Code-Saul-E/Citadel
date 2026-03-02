import { MessageType } from "../enums/MessageType";

export interface MessageEnvelope {
    type: MessageType;
    payload: any;
    timestamp: string;
}