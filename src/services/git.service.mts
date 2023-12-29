import { execSync } from "child_process";
import { LoggerService } from "../services/logger.service.mjs"

export class GitService {

    private loggerService: LoggerService;

    constructor(
        loggerService: LoggerService,
    ) {
        this.loggerService = loggerService;
    }

    stash() {
        this.loggerService.info('git stash')
        execSync('git stash');
    }

    checkout(branch: string) {
        this.loggerService.info(`git checkout ${branch}`)
        execSync(`git checkout ${branch}`, {
            stdio: 'ignore'
        });
    }

    isRemote(branch: string): boolean {
        let isRemoteSource = true;
        try {
            execSync(`git ls-remote --exit-code --heads origin ${branch}`, {
                stdio: 'ignore'
            });
        } catch (e) {
            isRemoteSource = false;
        }

        return isRemoteSource;
    }

    pull(branch: string) {
        this.loggerService.info(`git pull ${branch}`)
        execSync(`git pull ${branch}`, {
            stdio: 'ignore'
        });
    }

    createFromCurrent(branch: string) {
        this.loggerService.info(`git checkout -b ${branch}`)
        execSync(`git checkout -b ${branch}`, {
            stdio: 'ignore'
        });
    }

    isLocalBranch(branchName: string): boolean {
        const result = execSync(`git branch --list ${branchName}`).toString();
        return result.includes(branchName);
    }

    resetConfig(location: 'local', section: string) {
        this.loggerService.info('Resetting  configuration');
        execSync(`git config --${location} --remove-section ${section}`)
    }
}