import { Logger } from "../../shared/types/Logger";
import { LogLevel } from "../../shared/types/LogLevel";
import { LogTag } from "../../shared/types/LogTag";
import { formatLog } from "../../shared/utils/formatLog";
import { getTimeStamp } from "../../shared/utils/getTimeStamp";

class ServerLogger implements Logger {
    public info(message: string): void {
        console.log(formatLog(getTimeStamp(), LogLevel.INFO, LogTag.SERVER, message));
    }
    public warn(message: string): void {
        console.warn(formatLog(getTimeStamp(), LogLevel.WARN, LogTag.SERVER, message));
    }
    public error(message: string): void {
        console.error(formatLog(getTimeStamp(), LogLevel.ERROR, LogTag.SERVER, message));
    }
}

export const serverLogger = new ServerLogger();