#!/usr/bin/env node

import chalk from 'chalk';
import { cosmiconfigSync } from 'cosmiconfig';
import { generateService, GenerateServiceProps } from './index';

const explorerSync = cosmiconfigSync('openapi2ts');
const searchedFor = explorerSync.search();

async function run() {
  try {
    if (searchedFor?.config) {
      const configs: GenerateServiceProps[] = Array.isArray(searchedFor.config)
        ? searchedFor.config
        : [searchedFor.config];

      for (const config of configs) {
        await generateService(config);
      }
    } else {
      throw new Error('config is not found');
    }
  } catch (error) {
    console.log(chalk.red(error));
  }
}

run();
