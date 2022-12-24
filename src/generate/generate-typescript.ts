import { NAORMConfig, NAORMConventionSet } from "../interfaces/naorm-config";
import path from 'path';
import fs from 'fs';
import { ParsedSQLStatement, ResultSetColumn } from "../interfaces/parsed-sql-file";

export function generateTypeScript(parsedStatements: ParsedSQLStatement[], outDir: string, config: NAORMConfig) {
    const outFilePath = path.join(outDir, parsedStatements[0].fullFilePath.replace('.sql', '.ts'));

    const importStatments = new Set();
    const models: string[] = [];
    const columnDefinitionStrings: string[] = [];
    const sqlStatementStrings: string[] = [];
    for(const parsedStatement of parsedStatements) {
        const sourceSQLString = `export const ${parsedStatement.statementIdentifier}SQL = \`${parsedStatement.statement}\`;`;
        sqlStatementStrings.push(`${(parsedStatement.preStatementJSDoc || '') + '\n'}${sourceSQLString}`.trim());
        if(parsedStatement.resultSetColumns.length) {
            config.conventionSets.forEach(c => {
                c.importStatements.forEach(s => importStatments.add(s.trim()));
                models.push(generateOneTypeScriptModel(parsedStatement, c));
                columnDefinitionStrings.push(`${(parsedStatement.preStatementJSDoc || '') + '\n'}export const ${parsedStatement.statementIdentifier}${c.name || ''}Columns = ${JSON.stringify(parsedStatement.resultSetColumns, null, '\t')}`.trim());
            });
        }
    } 
    const outFileContent = `${Array.from(importStatments.values()).join('\n')}\n\n${models.join('\n\n')}\n\n${columnDefinitionStrings.join('\n')}\n\n${sqlStatementStrings.join('\n')}`.trim();
    fs.mkdirSync(path.join(outFilePath, '..'), { recursive: true });
    fs.writeFileSync(outFilePath, outFileContent);
}

function generateOneTypeScriptModel(parsedStatement: ParsedSQLStatement, conventionSet: NAORMConventionSet): string {
    let modelString = `${(parsedStatement.preStatementJSDoc || '') + '\n'}export ${conventionSet.typescriptConstruct} ${parsedStatement.statementIdentifier}${conventionSet.name || ''} ${conventionSet.extends || ''} {
${parsedStatement.resultSetColumns.map(c => generateOneTypeScriptFieldName(c, conventionSet)).join('\n')}\n}`.trim();
    return modelString;
}

function generateOneTypeScriptFieldName(columnDefinition: ResultSetColumn, conventionSet: NAORMConventionSet) {
    const typeToCheck = columnDefinition.naormTypeComment || columnDefinition.declaredType;
    const type = conventionSet.typeConventions.find(t => t.sqliteDeclaredType === typeToCheck)?.typescriptGeneratedType || getDefaultType(typeToCheck) || 'any';
    return (columnDefinition.jsDocComment ? `\t${columnDefinition.jsDocComment.trim()}\n` : '') + `\t"${columnDefinition.columnName}": ${type};`
}

function getDefaultType(type: string | null) {
    if(type === null) { return null; }
    if(type.includes('INT')) { return 'number'; }
    if(type.includes('CHAR')) { return 'string'; }
    if(type.includes('CLOB')) { return 'string'; }
    if(type.includes('TEXT')) { return 'string'; }
    if(type.includes('BLOB')) { return 'Buffer'; }
    if(type.includes('REAL')) { return 'number'; }
    if(type.includes('FLOA')) { return 'number'; }
    if(type.includes('DOUB')) { return 'number'; }
    return null;
}