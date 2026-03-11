import chalk, { ChalkInstance } from "chalk";
import { LogLevel } from "../types/LogLevel";
import { LogTag } from "../types/LogTag";

export const TIMESTAMP_COLOR = chalk.gray;

const LOG_LEVEL_COLORS: Record<LogLevel, ChalkInstance> = {
    [LogLevel.INFO]: chalk.blue,
    [LogLevel.WARN]: chalk.yellow,
    [LogLevel.ERROR]: chalk.red,
    [LogLevel.SYSTEM]: chalk.magenta
};
const TAG_COLORS: Record<LogTag, ChalkInstance> = {
    [LogTag.SERVER]: chalk.cyan,
    [LogTag.CLIENT]: chalk.green,
};


export function colorizeTag(tag: LogTag) {
    const colorFunc = TAG_COLORS[tag];

    if (colorFunc) {
        return colorFunc(tag);
    }

    return tag;
}
export function colorizeLevel(level: LogLevel) {
    const colorFunc = LOG_LEVEL_COLORS[level];

    if (colorFunc) {
        return colorFunc(level);
    }

    return level;
}