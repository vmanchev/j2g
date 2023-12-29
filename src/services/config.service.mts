import Configstore from 'configstore';
import { J2GConfig } from '../types/j2g-config.type';

export class ConfigService {

    private namespaceKey: string;
    private configKey = 'items';
    private store: Configstore;
    private static instance: ConfigService;

    private constructor(namespaceKey: string) {
        this.namespaceKey = namespaceKey;
        this.store = new Configstore(namespaceKey)
    }

    public static getInstance(namespaceKey: string): ConfigService {
        if (!ConfigService.instance || ConfigService.instance.namespaceKey !== namespaceKey) {
            ConfigService.instance = new ConfigService(namespaceKey);
        }

        return ConfigService.instance;
    }

    public getConfig(): J2GConfig[] {
        return this.store.get(this.configKey);
    }

    public setConfig(config: J2GConfig): void {
        this.store.set({
            [this.configKey]: [{
                ...config
            }]
        });
    }

    public appendConfig(config: J2GConfig): void {
        const existingConfig = this.getConfig();

        existingConfig.push({ ...config });

        this.store.set({
            [this.configKey]: [
                ...existingConfig
            ]
        });
    }

    public removeProject(projectPath: string): void {
        const existingConfig = this.getConfig();

        this.store.set({
            [this.configKey]: [
                ...existingConfig.map(ec => ({
                    ...ec,
                    projects: ec.projects.filter(p => p !== projectPath)
                }))
            ]
        });
    }

    public addProject(projectPath: string, jiraBoard: string): void {
        const existingConfig = this.getConfig();

        this.store.set({
            [this.configKey]: [...existingConfig.map(ec => {
                if (ec.url === jiraBoard) {
                    return {
                        ...ec,
                        projects: [
                            ...ec.projects,
                            projectPath
                        ]
                    }
                }

                return { ...ec }
            })]
        });
    }

    public findConfigByProject(projectPath: string): J2GConfig {
        return this.getConfig()?.find(config => config.projects.includes(projectPath));
    }

    public isExistingJira(url: string): boolean {
        return !!this.getConfig()?.map(config => config.url === url)?.some(item => item === true);
    }

    public reset(): void {
        this.store.clear();
    }

    public getJiraBoards(): string[] {
        return this.getConfig()?.map(config => config.url);
    }

    public updateTokenForBoard(jiraBoard: string, token: string): void {
        const existingConfig = this.getConfig();

        this.store.set({
            [this.configKey]: [...existingConfig.map(ec => {
                if (ec.url === jiraBoard) {
                    return {
                        ...ec,
                        token,
                    }
                }

                return { ...ec }
            })]
        });
    }
}