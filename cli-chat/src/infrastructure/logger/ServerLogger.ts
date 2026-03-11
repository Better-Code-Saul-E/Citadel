import { Logger } from "../../shared/types/Logger";
import { getTimeStamp } from "../../shared/utils/getTimeStamp";
import { TIMESTAMP_COLOR, colorizeLevel, colorizeTag } from "../../shared/utils/colorize";

class ServerLogger implements Logger {
    public info(message: string): void {
        console.log(this.format("INFO", message));
    }
    public warn(message: string): void {
        console.warn(this.format("WARN", message));
    }
    public error(message: string): void {
        console.error(this.format("ERROR", message));
    }

    private format(level: string, message: string): string {
        return `[${TIMESTAMP_COLOR(getTimeStamp())}] [${colorizeLevel(level)}] [${colorizeTag("SERVER")}] ${message}`;
    }  
}

export const serverLogger = new ServerLogger();