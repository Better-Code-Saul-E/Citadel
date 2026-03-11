import { Logger } from "../../shared/types/Logger";
import { getTimeStamp } from "../../shared/utils/getTimeStamp";
import { TIMESTAMP_COLOR, colorizeLevel, colorizeTag } from "../../shared/utils/colorize";
import { LogLevel } from "../../shared/types/LogLevel";
import { LogTag } from "../../shared/types/LogTag";

class ClientLogger implements Logger {
    public info(message: string): void {
        console.log(this.format(LogLevel.INFO, LogTag.CLIENT, message));
    }
    public warn(message: string): void {
        console.warn(this.format(LogLevel.WARN, LogTag.CLIENT, message));
    }
    public error(message: string): void {
        console.error(this.format(LogLevel.ERROR, LogTag.CLIENT, message));
    }
    public system(message: string): void {
        console.log(this.format(LogLevel.SYSTEM, LogTag.CLIENT, message));
    }
    public message(username: string, text: string): void {
        console.log(`${username}: ${text}`);
    }

    private format(level: LogLevel, tag: LogTag, message: string): string {
        return `[${TIMESTAMP_COLOR(getTimeStamp())}] [${colorizeLevel(level)}] [${colorizeTag(tag)}] ${message}`;
    }
}

export const clientLogger = new ClientLogger();