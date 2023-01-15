import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { generate } from '../generate';

function e2eGenerate(pathToConfigFileFromRoot: string, relativePathToExpectedOutput: string, module: 'commonjs' | 'esm') {
    
    const rootDir = process.cwd();
    const tsConfigPath = path.join(rootDir, 'tsconfig.json');
    const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath).toString());

    const dbDir = path.join(rootDir, pathToConfigFileFromRoot);
    const configPath = path.join(dbDir, 'naorm-config.json');
    const originalConfigString = fs.readFileSync(configPath).toString();
    const originalConfig = JSON.parse(originalConfigString);
    originalConfig.barrelExportExtension = module === 'commonjs' ? null : '.js';
    fs.writeFileSync(configPath, JSON.stringify(originalConfig, null, '\t'));

    const outDir = path.join(dbDir, 'naorm-generated');
    const outTSConfigPath = path.join(outDir, 'tsconfig.json');
    tsConfig.files = ['barrel.ts'];
    delete tsConfig.include;
    delete tsConfig.exclude;
    if(module === 'commonjs') {
        tsConfig.compilerOptions.moduleResolution = "Node";
        tsConfig.compilerOptions.module = "commonjs";
    }

    if(!fs.existsSync(outDir)) { fs.mkdirSync(outDir); }
    generate(configPath);
    fs.writeFileSync(outTSConfigPath, JSON.stringify(tsConfig, null, '\t'));
    fs.writeFileSync(configPath, originalConfigString);

    const outJSONPath = path.join(outDir, 'naorm-output.json');
    const outJSONContent = JSON.parse(fs.readFileSync(outJSONPath).toString().replace(/\\r\\n/g, '\\n'));
    const expectedOutJSONPath = path.join(__dirname, relativePathToExpectedOutput);
    const expectedOutJSONContent = JSON.parse(fs.readFileSync(expectedOutJSONPath).toString().replace(/\\r\\n/g, '\\n'));
    
    expect(outJSONContent).toEqual(expectedOutJSONContent);
    const tsc = `npx tsc --project ` + outDir;
    expect(() => execSync(tsc)).not.toThrow();
}


test('Generate TS (ESM) from Air Travel DB', () => {
    e2eGenerate('tests/test-dbs/air-travel', 'air-travel-expected.json', 'esm');
});

test('Generate TS (CommonJS) from Air Travel DB', () => {
    e2eGenerate('tests/test-dbs/air-travel', 'air-travel-expected.json', 'commonjs');
});