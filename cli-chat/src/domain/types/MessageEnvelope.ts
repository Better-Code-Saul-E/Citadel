import { MessageType } from '../enums/MessageType';
import { SystemEvent } from '../enums/SystemEvent';
import { ErrorCode } from '../errors/ErrorCode';

export interface JoinPayload { username: string; }
export interface MessagePayload { text: string; username?: string; room?: string; }
export interface WhisperPayload { username: string; recipient?: string; text: string; }
export interface RoomJoinPayload { username: string; room: string; limit: number; }
export interface RoomLeavePayload { username: string; room: string; }
export interface SystemPayload { message: string; room?: string; event?: SystemEvent }
export interface ErrorPayload { code: ErrorCode | string; message: string; }

export type MessageEnvelope =
    | { type: MessageType.JOIN; payload: JoinPayload; timestamp?: string }
    | { type: MessageType.MESSAGE; payload: MessagePayload; timestamp?: string }
    | { type: MessageType.WHISPER; payload: WhisperPayload; timestamp?: string }
    | { type: MessageType.ROOM_JOIN; payload: RoomJoinPayload; timestamp?: string }
    | { type: MessageType.ROOM_LEAVE; payload: RoomLeavePayload; timestamp?: string }
    | { type: MessageType.SYSTEM; payload: SystemPayload; timestamp?: string }
    | { type: MessageType.ERROR; payload: ErrorPayload; timestamp?: string };

    