import chalk from 'chalk';
import { LogLevel } from "../enums/log-level.enum.mjs";

export class LoggerService {

    private logLevel = LogLevel.SILENT;

    constructor(logLevel?: LogLevel) {
        if (logLevel) {
            this.logLevel = logLevel;
        }
    }

    info(message: string) {
        if (this.cannotLog()) {
            return;
        }
        console.log(chalk.bgBlack.green(`[info] ${message}`));
    }

    error(message: string) {
        if (this.cannotLog()) {
            return;
        }
        console.log(chalk.bgRed.white(`[error] ${message}`));
    }

    table(data: any) {
        if (this.cannotLog()) {
            return;
        }
        console.table(data);
    }

    private cannotLog(): boolean {
        return this.logLevel === LogLevel.SILENT;
    }
}