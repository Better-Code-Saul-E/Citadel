import chalk, { ChalkInstance } from "chalk";

export const TIMESTAMP_COLOR = chalk.gray;

const LOG_LEVEL_COLORS: Record<string, ChalkInstance> = {
    "INFO": chalk.blue,
    "WARN": chalk.yellow,
    "ERROR": chalk.red,
    "SYSTEM": chalk.magenta
};
const TAG_COLORS: Record<string, ChalkInstance> = {
    "SERVER": chalk.cyan,
    "CLIENT": chalk.green
};


export function colorizeTag(tag: string){
    const colorFunc = TAG_COLORS[tag];

    if(colorFunc){
        return colorFunc(tag);
    }

    return tag;
}
export function colorizeLevel(tag: string){
    const colorFunc = LOG_LEVEL_COLORS[tag];

    if(colorFunc){
        return colorFunc(tag);
    }
    
    return tag;
}