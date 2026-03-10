import { Logger } from "../../shared/types/Logger";

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
        const date = new Date();
        return `[${date.toLocaleDateString()} ${date.toLocaleTimeString()}] [${level}] [SERVER] ${message}`;
    }  
}

export const serverLogger = new ServerLogger();