import { Logger } from "../../shared/types/Logger";

class ServerLogger implements Logger {
    public info(message: string): void {
        console.log(message);
    }
    public warn(message: string): void {
        console.warn(message);
    }
    public error(message: string): void {
        console.error(message);
    }
}

export const serverLogger = new ServerLogger();