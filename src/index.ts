import { program } from 'commander';
import { generate  } from './generate/generate';


program.command('generate')
    .argument('[path-to-db-directory]', 'Path to DB directory', '.')
    .option('-c, --config-file-name <path>', 'Name of JSON config file', 'naorm.config.json')
    .action((pathToDBDirectory: string, options, command) => {
        console.log('start')
        console.time('Generation Complete')
        generate(pathToDBDirectory, options.configFileName);
        console.timeEnd('Generation Complete')
    }
)

program.parse();