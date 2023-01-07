import { existsSync, rmSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { DBWrapper } from '../db-wrapper/db-wrapper';
import { getColumnTypesFromSQL } from '../helpers/get-column-type-from-sql';
import { getFilesFromGlob } from '../helpers/get-files-from-glob';
import { NAORMConfig } from '../interfaces/naorm-config';
import { analyzeSQLFiles } from './analyze-sql-files';
import { generateTypeScript } from './generate-typescript';

export function generate(pathToConfigFile: string) {
    const dbDir = join(pathToConfigFile, '..');
    const config: NAORMConfig = JSON.parse(readFileSync(pathToConfigFile).toString());

    const outDir = join(dbDir, config.outDir);
    if(existsSync(outDir)) { rmSync(outDir, { recursive: true, force: true }) }
    mkdirSync(outDir);

    const sqlFiles = getFilesFromGlob(dbDir, config.include, config.exclude);
    const analyzedSQLStatements = analyzeSQLFiles(dbDir, sqlFiles, config);

    const db = new DBWrapper(join(outDir, config.dbName));
    analyzedSQLStatements.statementsToGenerate.forEach(s => {
        const computedColumns = db.processStatement(s);
        s.resultColumns = getColumnTypesFromSQL(s, computedColumns, analyzedSQLStatements.tableAndViewStatements);
    });
    db.close();
    analyzedSQLStatements.allStatementsByFileMap.forEach((f,k) => generateTypeScript(f, k, outDir, config));
    const barrel = Array.from(analyzedSQLStatements.allStatementsByFileMap.values()).map(f => `export * from './${f[0].fullFilePath.replace(/\\/g, '/').replace('.sql', '')}';`);
    writeFileSync(join(outDir, 'barrel.ts'), barrel.join('\n'));
}
