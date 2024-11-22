#!/usr/bin/env -S node --no-warnings

import { Command } from 'commander';

import { branchCommand } from './commands/branch.mjs';
import { configCommand } from './commands/config.mjs';
import {
  J2GConfigOptions,
  J2GCreateOptions,
} from './types/j2g-config-options.type';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const packageJson = require('../package.json');

const program = new Command();
program.name('j2g').usage('[command] [options]');
program.version(packageJson.version).description(packageJson.description);

program
  .command('create', { isDefault: true })
  .description('Create new branch name')
  .argument('<ticket-code>', 'Jira ticket code, e.g. ABC-123')
  .option(
    '-s, --source <source-branch>',
    'Also create a git branch from source-branch'
  )
  .option('-c, --copy', 'Copy branch name to clipboard')
  .action((code: string, options: J2GCreateOptions) =>
    branchCommand(code, options)
  );

program
  .command('config')
  .description('Configure configuration for this repo')
  .option('-p, --print', 'Display configuration')
  .option('-r, --reset', 'Reset configuration')
  .option('-t, --token', 'Set new token')
  .action((opt: J2GConfigOptions) => configCommand(opt));

program.parse();
