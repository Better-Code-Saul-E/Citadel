import { Logger } from "../../shared/types/Logger";

class ClientLogger implements Logger {
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

export const clientLogger = new ClientLogger();