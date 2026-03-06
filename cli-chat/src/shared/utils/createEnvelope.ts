import { MessageType } from "../../domain/enums/MessageType";
import { MessageEnvelope } from "../../domain/types/MessageEnvelope";

export function createEnvelope(type: MessageType, payload: any): MessageEnvelope {
    const response: MessageEnvelope = {
        type,
        payload,
        timestamp: new Date().toISOString()
    }

    return response;
}