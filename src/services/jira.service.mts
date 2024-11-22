import fetch from 'node-fetch';
import boxen from 'boxen';
import { Buffer } from 'buffer';
import { IssueData } from '../types/issue-data.type';
import { J2GConfig } from '../types/j2g-config.type';
import { JiraIssue } from '../types/jira-issue.type';
import { LoggerService } from './logger.service.mjs';
import { JIRA_API_VERSION } from '../constants/constants.mjs';

export class JiraService {
  private loggerService: LoggerService;

  constructor(loggerService: LoggerService) {
    this.loggerService = loggerService;
  }

  async verifyJiraConnection(config: J2GConfig): Promise<boolean> {
    let response: any;

    try {
      response = await fetch(
        `${config.url}/rest/api/${JIRA_API_VERSION}/myself`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: this.createAuthHeader(config.email, config.token),
          },
        }
      );
    } catch (e) {}

    return response?.status === 200;
  }

  async getIssueData(code: string, config: J2GConfig): Promise<IssueData> {
    let response: any;

    try {
      response = await fetch(
        `${config.url}/rest/api/${JIRA_API_VERSION}/issue/${code}?fields=summary,issuetype`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: this.createAuthHeader(config.email, config.token),
          },
        }
      );
    } catch (e) {
      this.loggerService.error('Cannot connect to Jira');
      return;
    }

    if (response.status !== 200) {
      switch (response.status) {
        case 401:
          this.loggerService.error('Expoired token!');
          break;
        case 404:
          this.loggerService.error('Wrong Jira ticket code!');
          break;
      }
      return;
    }

    const data: JiraIssue = await response.json();

    return {
      title: data.fields.summary,
      type: data.fields.issuetype.name.toLowerCase(),
      code,
    };
  }

  generateBranchName(issue: IssueData): string {
    const type = issue.type === 'bug' ? 'bugfix' : 'feature';
    const title = issue.title
      .toLowerCase()
      .replace(/[^a-z0-9]/gi, ' ')
      .trim()
      .replace(/\s+/g, '-');

    const branchName = `${type}/${issue.code}-${title}`;

    console.log(
      boxen(branchName, {
        padding: 1,
        title: 'branch name:',
        titleAlignment: 'left',
        borderColor: 'green',
      })
    );

    return branchName;
  }

  private createAuthHeader(username: string, apiToken: string): string {
    // Concatenate username and API token with a colon
    const credentials = `${username}:${apiToken}`;

    // Encode the credentials to Base64
    const base64Credentials = Buffer.from(credentials).toString('base64');

    // Return the full Authorization header
    return `Basic ${base64Credentials}`;
  }
}
