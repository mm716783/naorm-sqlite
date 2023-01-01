#!/usr/bin/env node

import { program } from 'commander';
import { generate  } from './generate/generate';
import { getPathToConfigFile } from './helpers/get-path-to-config-file';


program.command('generate')
    .argument('[path-to-config]', 'Path to NAORM Config file', '.')
    .action((pathArgument: string, options, command) => {
        console.log('start')
        console.time('Generation Complete')
        const pathToConfig = getPathToConfigFile(pathArgument);
        generate(pathToConfig);
        console.timeEnd('Generation Complete')
    }
)

program.parse();

export * from './interfaces/naorm-config';
export * from './interfaces/naorm-result-column';