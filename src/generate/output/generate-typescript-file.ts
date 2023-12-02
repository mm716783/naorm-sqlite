import { NAORMConfig, NAORMConventionSet } from "../../interfaces/naorm-config.js";
import { join } from 'path';
import { mkdirSync, writeFileSync } from 'fs';
import { ParsedSQLFile, ParsedSQLStatement } from "../../interfaces/parsed-sql-file.js";
import { NAORMResultColumn } from "../../interfaces/naorm-sql-statement.js";

export function generateTypeScriptFile(parsedSQLFile: ParsedSQLFile, config: NAORMConfig, outDir: string) {
    const parsedStatements = parsedSQLFile.sqlStatements;
    const outFilePath = join(outDir, parsedSQLFile.fullFilePath.replace('.sql', '.ts'));

    const importStatments = new Set<string>();
    const models: string[] = [];
    const columnDefinitionStrings: string[] = [];
    const sqlStatementStrings: string[] = [];
    const sqlStatementStringIds: string[] = [];

    for(const parsedStatement of parsedStatements) {
        const baseVarName = parsedStatement.statementIdentifier.replace(/\s/g, '_');

        if(parsedStatement.resultColumns.length) {
            config.conventionSets.forEach(c => {
                // Consolidated Import Statements
                c.importStatements.filter(s => !!s).forEach(s => importStatments.add(s));
                
                // TypeScript Model
                const varName: string = baseVarName + c.name;
                const tsModelString = generateOneTypeScriptModel(parsedStatement, c, varName);
                models.push(tsModelString);
                
                // Column Array
                const columnVarName: string = varName + 'Columns';
                const columnArrayString = generateColumnArrayString(parsedStatement, columnVarName);
                columnDefinitionStrings.push(columnArrayString);
            });
        }

        // Statement containing the SQL string
        const sqlVarName = `${baseVarName}SQL`;
        sqlStatementStringIds.push(sqlVarName);
        const sourceSQLStatement = generateSourceSQLStatement(parsedStatement, sqlVarName);
        sqlStatementStrings.push(sourceSQLStatement);
    }

    const batchArrayExport = getBatchArrayExport(parsedSQLFile.fileIdentifier, sqlStatementStringIds);
    const outFileContent = getFileOutput(importStatments, models, columnDefinitionStrings, sqlStatementStrings, batchArrayExport);
    mkdirSync(join(outFilePath, '..'), { recursive: true });
    writeFileSync(outFilePath, outFileContent);
}


function generateOneTypeScriptProperty(col: NAORMResultColumn, conventionSet: NAORMConventionSet) {
    const jsDocComment = col.jsDocComment ? `\t${col.jsDocComment.trim()}\n` : '';
    const computedType = col.computedTypeByConventionSet[conventionSet.name];
    const propertyName = `${col.columnName.replace(/\\"/g, '\\\\"').replace(/"/g, '\\"')}`;
    return `${jsDocComment}\t"${propertyName}": ${computedType};`;
}

function generateOneTypeScriptModel(parsedStatement: ParsedSQLStatement, conventionSet: NAORMConventionSet, varName: string): string {
    const resultColumns: string[] = parsedStatement.resultColumns.map(c => generateOneTypeScriptProperty(c, conventionSet));
    const extendsStr = conventionSet.extends || '';
    const jsDocComment = getJSDocComment(parsedStatement.preStatementJSDoc);
    const modelString = jsDocComment +
    `export ${conventionSet.typescriptConstruct} ${varName} ${extendsStr} {`
        + `\n${resultColumns.join('\n')}` + '\n};';
    return modelString;
}

function generateColumnArrayString(parsedStatement: ParsedSQLStatement, varName: string): string {
    const jsDocComment = getJSDocComment(parsedStatement.preStatementJSDoc);
    const columnsJSON = JSON.stringify(parsedStatement.resultColumns, null, '\t');
    const arrayString = `${jsDocComment}export const ${varName} = ${columnsJSON};`;
    return arrayString;
}

function generateSourceSQLStatement(parsedStatement: ParsedSQLStatement, sqlVarName: string) {
    const escapedSQLStatement = parsedStatement.statement.replace(/\\`/g, '\\\\`').replace(/`/g, '\\`');
    const jsDocComment = getJSDocComment(parsedStatement.preStatementJSDoc);
    const sourceSQLString = jsDocComment + 
        `export const ${sqlVarName} = \`${escapedSQLStatement}\`;`;
    return sourceSQLString;    
}

function getJSDocComment(preStatementJSDoc: string) {
    return preStatementJSDoc ? preStatementJSDoc.trim() + '\n' : '';
}

function getBatchArrayExport(fileIdentifier: string, sqlStatementStringIds: string[]) {
    const batchArrayExport = `export const ${fileIdentifier}Statements = [`
        + `\n\t${sqlStatementStringIds.join(',\n\t')}` 
        + "\n];";
    return batchArrayExport;
}

function getFileOutput(importStatments: Set<string>, models: string[],
    columnDefinitionStrings: string[], sqlStatementStrings: string[], batchArrayExport: string) {
    const importStatmentArray = Array.from(importStatments.values()).join('\n');
    const outFileContent = importStatmentArray + '\n\n\n'
        + models.join('\n\n') + '\n\n\n'
        + columnDefinitionStrings.join('\n\n') + '\n\n\n'
        + sqlStatementStrings.join('\n\n') + '\n\n\n'
        + batchArrayExport;
    return outFileContent;
}