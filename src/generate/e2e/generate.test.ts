import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { generate } from '../generate';

function e2eGenerate(pathToConfigFileFromRoot: string, relativePathToExpectedOutput: string) {
    
    const rootDir = process.cwd();
    const tsConfigPath = path.join(rootDir, 'tsconfig.json');
    const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath).toString());

    const dbDir = path.join(rootDir, pathToConfigFileFromRoot);
    const configPath = path.join(dbDir, 'naorm-config.json');
    generate(configPath);

    const outDir = path.join(dbDir, 'naorm-generated');
    const outTSConfigPath = path.join(outDir, 'tsconfig.json');
    tsConfig.files = ['barrel.ts'];
    delete tsConfig.include;
    delete tsConfig.exclude;
    fs.writeFileSync(outTSConfigPath, JSON.stringify(tsConfig, null, '\t'));

    const outJSONPath = path.join(outDir, 'naorm-output.json');
    const outJSONContent = JSON.parse(fs.readFileSync(outJSONPath).toString().replace(/\r\n/g, '\n').replace(/\t/g, '    '));
    
    const expectedOutJSONPath = path.join(__dirname, relativePathToExpectedOutput);
    const expectedOutJSONContent = JSON.parse(fs.readFileSync(expectedOutJSONPath).toString().replace(/\r\n/g, '\n').replace(/\t/g, '    '));
    
    expect(outJSONContent).toEqual(expectedOutJSONContent);
    const tsc = `npx tsc --project ` + outDir;
    expect(() => execSync(tsc)).not.toThrow();
}


test('Generate TS from Air Travel DB', () => {
    e2eGenerate('tests/test-dbs/air-travel', 'air-travel-expected.json')
});