import { existsSync, rmSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, relative } from 'path';
import { DBWrapper } from './db-wrapper/db-wrapper';
import { getFilesFromGlob } from './helpers/get-files-from-glob';
import { NAORMConfig } from '../interfaces/naorm-config';
import { ParsedSQLFile } from '../interfaces/parsed-sql-file';
import { parseSQLFile } from './parse-sql-file/parse-sql-file';
import { SQLFileAnalyzer } from './sql-analyzers/sql-file-analyzer';
import { generateTypeScript } from './generate-typescript';
import { SQLColumnAnalyzer } from './sql-analyzers/sql-column-analyzer';
import { SQLDependencyAnalyzer } from './sql-analyzers/sql-dependency-analyzer';

export function generate(pathToConfigFile: string) {

    // Step 1 - Some File System setup, gather the inputs and prep the output directory
    const dbDir = relative(process.cwd(), join(pathToConfigFile, '..'));
    const config: NAORMConfig = JSON.parse(readFileSync(pathToConfigFile).toString());
    const outDir = join(dbDir, config.outDir);
    const sqlFiles = getFilesFromGlob(dbDir, config.include, config.exclude);
    if(existsSync(outDir)) { rmSync(outDir, { recursive: true, force: true }) }
    mkdirSync(outDir);

    // Step 2 - Identify, parse, and analyze each SQL File into SQL Statements
    const sqlFileAnalyzer = new SQLFileAnalyzer(config);
    sqlFiles.forEach(f => {
        const fileIdentifier = sqlFileAnalyzer.getFileIdentifier(f);
        const parsedSQLFile: ParsedSQLFile = parseSQLFile(join(dbDir, f), fileIdentifier);
        sqlFileAnalyzer.addSQLFile(parsedSQLFile);
    });

    // Step 3 - Analyzing statements dependencies etermine the execution order
    const sqlDependencyAnalyzer = new SQLDependencyAnalyzer(
        sqlFileAnalyzer.tableAndViewStatementMap, 
        sqlFileAnalyzer.allStatementOverrides
    );
    const sequencedTableViewStatements = sqlDependencyAnalyzer.getStatementExecutionOrder();
    const sequencedStatements = [
        ...sequencedTableViewStatements, 
        ...sqlFileAnalyzer.indexStatements, 
        ...sqlFileAnalyzer.otherStatements
    ];

    // Step 4 - Execute the statements and determine the result colums associated to each
    const db = new DBWrapper(join(outDir, config.dbName));
    const sqlColumnAnalyzer = new SQLColumnAnalyzer(sqlFileAnalyzer.tableAndViewStatementMap, config);
    sequencedStatements.forEach(s => {
        const computedColumns = db.processStatement(s);
        s.resultColumns = sqlColumnAnalyzer.getColumnMetadata(s, computedColumns);
    });
    db.close();

    // Step 5 - Generate the TypeScript and write the output
    sqlFileAnalyzer.allParsedFilesByFileId.forEach((f) => generateTypeScript(f, config, outDir));
    const barrel = Array.from(sqlFileAnalyzer.allParsedFilesByFileId.values()).map(f => `export * from './${f.fullFilePath.replace(/\\/g, '/').replace('.sql', '')}';`);
    writeFileSync(join(outDir, 'barrel.ts'), barrel.join('\n'));
    writeFileSync(join(dbDir, 'naorm-generated', 'naorm-output.json'), JSON.stringify(sequencedStatements.map(s => { s.statementTokens = []; return s}), null, '\t'));
}
