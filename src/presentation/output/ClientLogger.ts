import { Logger } from "../../shared/types/Logger";
import { LogLevel } from "../../shared/types/LogLevel";
import { LogTag } from "../../shared/types/LogTag";
import { formatLog } from "../../shared/utils/formatLog";
import { getTimeStamp } from "../../shared/utils/getTimeStamp";
import { ChatLogger } from "./ChatLogger";

class ClientLogger implements ChatLogger {
    public info(message: string): void {
        console.log(formatLog(getTimeStamp(), LogLevel.INFO, LogTag.CLIENT, message));
    }
    public warn(message: string): void {
        console.warn(formatLog(getTimeStamp(), LogLevel.WARN, LogTag.CLIENT, message));
    }
    public error(message: string): void {
        console.error(formatLog(getTimeStamp(), LogLevel.ERROR, LogTag.CLIENT, message));
    }
    public system(message: string): void {
        console.log(formatLog(getTimeStamp(), LogLevel.SYSTEM, LogTag.CLIENT, message));
    }
    public message(username: string, text: string): void {
        console.log(`${username}: ${text}`);
    }
    public whisper(username: string, text: string): void {
        console.log(`[WHISPER from ${username}]: ${text}`);
    }
}

export const clientLogger = new ClientLogger();