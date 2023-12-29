import clipboard from 'clipboardy';

import { CONFIG_KEY } from "../constants/constants.mjs";
import { J2GCreateOptions } from '../types/j2g-config-options.type';
import { GitService } from '../services/git.service.mjs';
import { LogLevel } from "../enums/log-level.enum.mjs";
import { LoggerService } from '../services/logger.service.mjs';
import { JiraService } from '../services/jira.service.mjs';
import { ConfigService } from '../services/config.service.mjs';

const loggerService = new LoggerService(LogLevel.VERBOSE);
const jiraService = new JiraService(loggerService);
const configService = ConfigService.getInstance(CONFIG_KEY);

export async function branchCommand(code: string, options: J2GCreateOptions) {

    const config = configService.findConfigByProject(process.cwd());

    if (!config) {
        loggerService.error('No configuration found! Run `j2g config` to create one.');
        return;
    }

    const issue = await jiraService.getIssueData(code, config);

    if (!issue) {
        return;
    }

    const branchName = jiraService.generateBranchName(issue);

    if (options.copy) {
        clipboard.writeSync(branchName);
        loggerService.info('Branch name is copied to your clipboard')
    }

    if (!options.source) {
        process.exit();
    }

    const gitService = new GitService(loggerService)

    // stash
    gitService.stash();

    // checkout options.source branch
    try {
        gitService.checkout(options.source);
    } catch (e) {
        loggerService.error(`Branch ${options.source} does not exists`);
        return;
    }

    if (gitService.isRemoteBranch(options.source)) {
        gitService.pull(options.source)
    }

    // create a new branch with name branchName from options.source branch
    try {
        gitService.createFromCurrent(branchName)
    } catch (e) {
        loggerService.error(`Cannot create ${branchName} from ${options.source}`);
        if (gitService.isLocalBranch(branchName)) {
            loggerService.error(`Local branch ${branchName} already exists`);
        }
        return;
    }

    loggerService.info(`Branch created!`)
}
