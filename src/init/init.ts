import { prompt } from 'enquirer';
import { existsSync, lstatSync, writeFileSync, appendFileSync } from 'fs';
import { join, relative, sep, posix } from 'path';
import { DEFAULT_NAORM_CONFIG } from './default-config';

function validateDir(input: string): string | boolean {
    try {
        if(!input) { return true; }
        if(existsSync(input)) {
            if(lstatSync(input).isDirectory()) {
                return true;
            } else {
                return 'Could not resolve directory ' + input;
            }
        } else {
            return 'Could not resolve directory ' + input;
        }
    } catch(e) {
        return 'Could not resolve directory ' + input;
    }
}

export async function init() {
    console.log('');
    console.log('Welcome to Not an ORM for SQLite. NAORM (pronounced "norm") is a Command Line Interface for generating TypeScript from SQLite files in your code base.', '\n');

    const { configDir } = await prompt({ 
            name: 'configDir', 
            type: 'input', 
            message: 'Please specify your database directory, or leave blank to use CWD: ', 
            validate: validateDir,
            initial: () => process.cwd()
    }) as any;
        
    const { useRecommended } = await prompt(
        { name: 'useRecommended', type: 'confirm', message: 'Use recommended Custom Type Conventions?', initial: true }
    ) as any;
    
    const { gitIgnore } = await prompt(
        { name: 'gitIgnore', type: 'confirm', message: 'Add naorm-generated directory to gitignore?', initial: true }
    ) as any;

    const schemaFilePath = join(__dirname, '..', 'naorm-config.schema.json');
    const outFile = join(configDir, 'naorm-config.json');
    const outFileContent = {
        $schema: `.${posix.sep}${relative(configDir, schemaFilePath).split(sep).join(posix.sep)}`,
        ...DEFAULT_NAORM_CONFIG
    };
    if(!useRecommended) { outFileContent.conventionSets = []; }
    writeFileSync(outFile, JSON.stringify(outFileContent, null, '\t'));

    if(gitIgnore) {
        const gitIgnoreFile = join(configDir, '.gitignore');
        appendFileSync(gitIgnoreFile, '\nnaorm-generated');
    }

    const relativeConfigDir = relative(process.cwd(), configDir);
    
    console.log('');
    console.log(`Setup complete. You can generate TypeScript using the following command: npx naorm generate ${relativeConfigDir}`, '\n');
    console.log('For more information, check out the project README at https://github.com/mm716783/naorm-sqlite', '\n');
}