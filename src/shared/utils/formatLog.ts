import { LogLevel } from "../types/LogLevel";
import { LogTag } from "../types/LogTag";
import { colorizeLevel, colorizeTag, TIMESTAMP_COLORIZER } from "./colorize";

export function formatLog(timestamp: string, level: LogLevel, tag: LogTag, message: string): string {
    return `[${TIMESTAMP_COLORIZER(timestamp)}] [${colorizeLevel(level)}] [${colorizeTag(tag)}] ${message}`;
}