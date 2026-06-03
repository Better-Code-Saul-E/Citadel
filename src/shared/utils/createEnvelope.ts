import { MessageType } from "../../domain/enums/MessageType";
import { MessageEnvelope, JoinPayload, MessagePayload, WhisperPayload, RoomJoinPayload, RoomLeavePayload, SystemPayload, ErrorPayload, AdminPayload, MutePayload } from '../../domain/types/MessageEnvelope';


type PayloadRegistry = {
    [MessageType.JOIN]: JoinPayload;
    [MessageType.MESSAGE]: MessagePayload;
    [MessageType.WHISPER]: WhisperPayload;
    [MessageType.ROOM_JOIN]: RoomJoinPayload;
    [MessageType.ROOM_LEAVE]: RoomLeavePayload;
    [MessageType.SYSTEM]: SystemPayload;
    [MessageType.ERROR]: ErrorPayload;
    [MessageType.ADMIN]: AdminPayload;
    [MessageType.MUTE]: MutePayload;
};

export function createEnvelope<T extends keyof PayloadRegistry>
    (type: T, payload: PayloadRegistry[T]):
    Extract<MessageEnvelope, { type: T }> {

    return {
        type,
        payload,
        timestamp: new Date().toISOString()
    } as Extract<MessageEnvelope, { type: T }>;
}
