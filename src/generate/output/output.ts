import { writeFileSync } from 'fs';
import { join } from 'path';
import { NAORMConfig } from "../../interfaces/naorm-config";
import { NAORMSQLStatement } from '../../interfaces/naorm-sql-statement';
import { ParsedSQLFile, ParsedSQLStatement } from "../../interfaces/parsed-sql-file";
import { generateTypeScriptFile } from './generate-typescript-file';

export function generateTypeScript(allParsedFilesByFileId: Map<string, ParsedSQLFile>, config: NAORMConfig, outDir: string) {
    allParsedFilesByFileId.forEach((f) => generateTypeScriptFile(f, config, outDir));
}

export function writeBarrelFile(allParsedFilesByFileId: Map<string, ParsedSQLFile>, outDir: string) {
    const barrelFile = join(outDir, 'barrel.ts');
    const barrelStatements: string[] = [];
    allParsedFilesByFileId.forEach(f => { 
        const importPath = f.fullFilePath.replace(/\\/g, '/').replace('.sql', '');
        const barrelStatement = `export * from './${importPath}';`;
        barrelStatements.push(barrelStatement);
    });
    writeFileSync(barrelFile, barrelStatements.join('\n'));
}

export function writeOutputFile(sequencedStatements: ParsedSQLStatement[], outDir: string) {
    const outFile = join(outDir, 'naorm-output.json');
    const outputStatements: NAORMSQLStatement[] = sequencedStatements.map((s) => { 
        /* eslint-disable @typescript-eslint/no-unused-vars */
        const outputStatement: NAORMSQLStatement = (({ 
            statementTokens, 
            possibleStatementDependencies,
            possibleStatementDependenciesArray, 
            ...o  // Remove the extra properties not needed for export
        }) => o)(s);
        return outputStatement;
    });
    writeFileSync(outFile, JSON.stringify(outputStatements, null, '\t'));
}