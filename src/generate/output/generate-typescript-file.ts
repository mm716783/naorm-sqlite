import { NAORMConfig, NAORMConventionSet } from "../../interfaces/naorm-config";
import { join } from 'path';
import { mkdirSync, writeFileSync } from 'fs';
import { ParsedSQLFile, ParsedSQLStatement } from "../../interfaces/parsed-sql-file";
import { NAORMResultColumn } from "../../interfaces/naorm-sql-statement";

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
    const propertyName = `${col.columnName.replace(/"/g, '\"')}`;
    const type = `${computedType}${col.isExplicitlyNotNull ? '' : ' | null'}`;
    return `${jsDocComment}\t"${propertyName}": ${type};`
}

function generateOneTypeScriptModel(parsedStatement: ParsedSQLStatement, conventionSet: NAORMConventionSet, varName: string): string {
    const resultColumns: string[] = parsedStatement.resultColumns.map(c => generateOneTypeScriptProperty(c, conventionSet));
    const extendsStr = conventionSet.extends || '';
    let modelString = parsedStatement.preStatementJSDoc +
    `export ${conventionSet.typescriptConstruct} ${varName} ${extendsStr} {`
        + `\n${resultColumns.join('\n')}` + '\n};'
    return modelString;
}

function generateColumnArrayString(parsedStatement: ParsedSQLStatement, varName: string): string {
    const jsDocComment = parsedStatement.preStatementJSDoc ? parsedStatement.preStatementJSDoc.trim() + '\n' : '';
    const columnsJSON = JSON.stringify(parsedStatement.resultColumns, null, '\t')
    const arrayString = `${jsDocComment}export const ${varName} = ${columnsJSON};`;
    return arrayString;
}

function generateSourceSQLStatement(parsedStatement: ParsedSQLStatement, sqlVarName: string) {
    const escapedSQLStatement = parsedStatement.statement.replace(/`/g, "\\`");
    const sourceSQLString = parsedStatement.preStatementJSDoc + 
        `export const ${sqlVarName} = \`${escapedSQLStatement}\`;`;
    return sourceSQLString;    
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