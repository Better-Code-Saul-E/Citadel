import { Logger } from "../../shared/types/Logger";

export interface ChatLogger extends Logger {
    system(message: string): void;
    message(username: string, text: string): void
    whisper(username: string, text: string): void
}