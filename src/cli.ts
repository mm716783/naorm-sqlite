#!/usr/bin/env node

import { program } from 'commander';
import { generate  } from './generate/generate.js';
import { getPathToConfigFile } from './generate/helpers/get-path-to-config-file.js';
import { init } from './init/init.js';


program.command('generate')
    .argument('[path-to-config]', 'Path to NAORM Config file', '.')
    .action((pathArgument: string) => {
        console.log('Not an ORM for SQLite');
        console.time('Not an ORM for SQLite - Completed');
        const pathToConfig = getPathToConfigFile(pathArgument);
        console.log('Using config file at ', pathToConfig);
        generate(pathToConfig);
        console.timeEnd('Not an ORM for SQLite - Completed');
    }
    );

program.command('init')
    .action(async () => {
        await init();
    }
    );

program.parse();