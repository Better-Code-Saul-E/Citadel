import { Logger } from "../../shared/types/Logger";
import { getTimeStamp } from "../../shared/utils/getTimeStamp";

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
        return `[${getTimeStamp()}] [${level}] [SERVER] ${message}`;
    }  
}

export const serverLogger = new ServerLogger();