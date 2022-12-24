import betterSQLite3 from 'better-sqlite3';
import fs from 'fs-extra';
import path from 'path';
import { getFilesFromGlob } from '../helpers/get-files-from-glob';
import { NAORMConfig } from '../interfaces/naorm-config';
import { analyzeSQLFiles } from './analyze-sql-files';
import { generateStatement } from './generate-statement';
import { generateTypeScript } from './generate-typescript';

export function generate(dbDir: string, configFileName: string) {
    const configFilePath = path.join(dbDir, configFileName)
    const config: NAORMConfig = JSON.parse(fs.readFileSync(configFilePath).toString());

    const outDir = path.join(dbDir, config.outDir);
    if(fs.existsSync(outDir)) { fs.removeSync(outDir) }
    fs.mkdirSync(outDir);
    console.log('glob')

    const sqlFiles = getFilesFromGlob(dbDir, config.include, config.exclude);
    console.log('analzying')
    const analyzedSQLStatements = analyzeSQLFiles(dbDir, sqlFiles, config);

    const db = new betterSQLite3(path.join(outDir, config.dbName));
    console.log('done analysis, generating')
    analyzedSQLStatements.statementsToGenerate.forEach(s => generateStatement(s, analyzedSQLStatements.tableAndViewStatements, db));
    analyzedSQLStatements.allStatementsByFile.forEach(f => generateTypeScript(f, outDir, config));
    const barrel = analyzedSQLStatements.allStatementsByFile.map(f => `export * from './${f[0].fullFilePath.replace(/\\/g, '/').replace('.sql', '')}';`);
    fs.writeFileSync(path.join(dbDir, 'generated', 'barrel.ts'), barrel.join('\n'));
}
