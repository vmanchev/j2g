import inquirer from 'inquirer';
import { J2GConfig } from '../types/j2g-config.type';
import { CONFIG_KEY } from '../constants/constants.mjs';
import { J2GConfigOptions } from '../types/j2g-config-options.type';
import { LoggerService } from '../services/logger.service.mjs';
import { LogLevel } from '../enums/log-level.enum.mjs';
import { JiraService } from '../services/jira.service.mjs';
import { ProjectFoundInConfig } from '../enums/project-found-in-config.enum.mjs';
import { JiraBoard } from '../enums/jira-board.enum.mjs';
import { ConfigService } from '../services/config.service.mjs';
import CliTable3 from 'cli-table3';
import * as EmailValidator from 'email-validator';

const emailQuestion = {
  type: 'input',
  name: 'email',
  message: 'Your Jira email:',
  validate: EmailValidator.validate,
};

const tokenQuestion = {
  type: 'password',
  name: 'token',
  message: 'Jira access token:',
  validate: (value: string) => !!value.length,
};

const newUrlQuestion = {
  type: 'input',
  name: 'url',
  message: 'Base Jira board url (e.g. https://jira.example.org):',
  validate: (url: string) => /^https:\/\//.test(url),
};

const projectFoundInConfigQuestion = {
  type: 'list',
  name: 'existingConfigAction',
  message:
    'In your existing configuration, this project is assigned to {jira_url} Jira board. What you want to do?',
  choices: [
    {
      name: 'Leave it as is and exit',
      value: ProjectFoundInConfig.LEAVE,
    },
    {
      name: 'Remove it and exit',
      value: ProjectFoundInConfig.REMOVE,
    },
  ],
  validate: (value: string) => !!value.length,
};

const projectNotFoundInConfigurationsQuestions = [
  {
    type: 'list',
    name: 'existingJiraBoard',
    message: 'Select Jira board',
    choices: [
      {
        name: 'Not listed, add a new one',
        value: JiraBoard.NOT_LISTED as string,
      },
    ],
    validate: (value: string) => !!value.length,
  },
  {
    ...newUrlQuestion,
    when: (answers) => answers.existingJiraBoard === JiraBoard.NOT_LISTED,
  },
  {
    ...tokenQuestion,
    when: (answers) => answers.existingJiraBoard === JiraBoard.NOT_LISTED,
  },
];

const resetQuestion = {
  type: 'confirm',
  name: 'reset',
  default: false,
  message:
    'This will reset j2g global configuration for all Jira boards and all projects. Are you sure you want to continue?',
};

const jiraBoardsQuestion = {
  type: 'list',
  name: 'url',
  message: 'Select a Jira board:',
  validate: (value: string) => !!value.length,
};

const loggerService = new LoggerService(LogLevel.VERBOSE);
const configService = ConfigService.getInstance(CONFIG_KEY);

export async function configCommand(options?: J2GConfigOptions) {
  if (options?.print) {
    await printConfig();
  } else if (options?.reset) {
    await resetConfig();
  } else if (options?.token) {
    setNewToken();
  } else {
    await startConfig();
  }
}

async function printConfig() {
  const config = configService.getConfig();

  if (!config) {
    loggerService.error(
      'No configuration found! Run `j2g config` to create one.'
    );
  } else {
    config.forEach((c) => {
      const table = new CliTable3();
      table.push(
        { 'Jira Board': c.url },
        { Projects: c.projects.length ? c.projects.join('\n') : '-' }
      );
      console.log(table.toString());
    });
  }
}

async function startConfig() {
  // get existing configuration
  const exisingConfig = configService.getConfig();
  const projectPath = process.cwd();

  // When there are no configurations at all
  if (!exisingConfig) {
    // Ask user to provide Jira URL and token
    const newConfig = await inquirer.prompt([
      newUrlQuestion,
      emailQuestion,
      tokenQuestion,
    ]);

    if (!(await verifyJiraConnection(newConfig))) {
      return;
    }

    // Add current dir and store configuration
    configService.setConfig({
      ...newConfig,
      projects: [projectPath],
    });

    loggerService.info('Configuration created');
    return;
  }

  // When current project is already a part of configuration
  const existingProject = configService.findConfigByProject(projectPath);
  if (existingProject) {
    // ask the user what they want to do
    const { existingConfigAction } = await inquirer.prompt([
      {
        ...projectFoundInConfigQuestion,
        message: projectFoundInConfigQuestion.message.replace(
          '{jira_url}',
          existingProject.url
        ),
      },
    ]);

    if (existingConfigAction === ProjectFoundInConfig.REMOVE) {
      configService.removeProject(projectPath);
      loggerService.info(
        'Current project is not part of any j2g configuration'
      );
    }
    return;
  }

  // When current project is not part of any of the existing configuratiosn
  exisingConfig.forEach((ec) => {
    projectNotFoundInConfigurationsQuestions[0].choices.unshift({
      name: ec.url,
      value: ec.url,
    });
  });

  const projectNotFoundInConfigurationsAnswers = await inquirer.prompt(
    projectNotFoundInConfigurationsQuestions
  );

  if (
    projectNotFoundInConfigurationsAnswers.existingJiraBoard ===
    JiraBoard.NOT_LISTED
  ) {
    if (
      configService.isExistingJira(projectNotFoundInConfigurationsAnswers.url)
    ) {
      loggerService.error(
        `Configuraton for ${projectNotFoundInConfigurationsAnswers.url} already exists!`
      );
      return;
    }

    if (
      !(await verifyJiraConnection({
        ...projectNotFoundInConfigurationsAnswers,
      }))
    ) {
      return;
    }

    // add new Jira board configuration
    configService.appendConfig({
      url: projectNotFoundInConfigurationsAnswers.url,
      token: projectNotFoundInConfigurationsAnswers.token,
      email: projectNotFoundInConfigurationsAnswers.email,
      projects: [projectPath],
    });

    loggerService.info(
      `Configuration for ${projectNotFoundInConfigurationsAnswers.url} was created`
    );
    loggerService.info(
      `Current project was assigned to ${projectNotFoundInConfigurationsAnswers.url} configuration`
    );
  } else {
    configService.addProject(
      projectPath,
      projectNotFoundInConfigurationsAnswers.existingJiraBoard
    );
    loggerService.info(
      `Current project was assigned to ${projectNotFoundInConfigurationsAnswers.existingJiraBoard} configuration`
    );
  }
}

async function setNewToken() {
  const jiraBoards = configService.getJiraBoards();

  if (!jiraBoards?.length) {
    loggerService.error('No Jira boards were found!');
    return;
  }

  const answers = await inquirer.prompt([
    {
      ...jiraBoardsQuestion,
      choices: configService.getJiraBoards(),
    },
    {
      ...emailQuestion,
    },
    {
      ...tokenQuestion,
    },
  ]);

  if (!(await verifyJiraConnection(answers))) {
    return;
  }

  configService.updateTokenForBoard(answers.url, answers.email, answers.token);
  loggerService.info('Configuration updated');
}

async function resetConfig() {
  const answers = await inquirer.prompt([resetQuestion]);

  if (answers.reset) {
    configService.reset();
    loggerService.info('Global j2g configration removed');
  } else {
    loggerService.info('Global j2g configration is still available');
  }
}

async function verifyJiraConnection(config: J2GConfig): Promise<boolean> {
  const jiraService = new JiraService(new LoggerService(LogLevel.VERBOSE));
  const canConnect = await jiraService.verifyJiraConnection(config);

  if (canConnect) {
    loggerService.info('Connection to Jira confirmed');
    return true;
  }

  loggerService.error('Cannot connect to Jira');
  loggerService.error('Check the configuration and try again.');
  return false;
}
