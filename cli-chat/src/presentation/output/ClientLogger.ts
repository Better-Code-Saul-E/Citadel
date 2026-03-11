import { Logger } from "../../shared/types/Logger";
import { getTimeStamp } from "../../shared/utils/getTimeStamp";
import { TIMESTAMP_COLOR, colorizeLevel } from "../../shared/utils/colorize";

class ClientLogger implements Logger {
    public info(message: string): void {
        console.log(this.format("INFO", message));
    }
    public warn(message: string): void {
        console.warn(this.format("WARN", message));
    }
    public error(message: string): void {
        console.error(this.format("ERROR", message));
    }
    public system(message: string): void {
        console.log(this.format("SYSTEM", message));
    }
    public message(username: string, text: string): void {
        console.log(`${username}: ${text}`);
    }

    private format(level: string, message: string): string {
        const date = new Date();
        return `[${TIMESTAMP_COLOR(getTimeStamp())}] [${colorizeLevel(level)}] ${message}`;
    }
}

export const clientLogger = new ClientLogger();