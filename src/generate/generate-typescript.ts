import { NAORMConfig, NAORMConventionSet } from "../interfaces/naorm-config";
import { join } from 'path';
import { mkdirSync, writeFileSync } from 'fs';
import { ParsedSQLStatement } from "../interfaces/parsed-sql-file";
import { NAORMResultColumn } from "../interfaces/naorm-result-column";

export function generateTypeScript(parsedStatements: ParsedSQLStatement[], fileIdentifier: string, outDir: string, config: NAORMConfig) {
    const outFilePath = join(outDir, parsedStatements[0].fullFilePath.replace('.sql', '.ts'));

    const importStatments = new Set();
    const models: string[] = [];
    const columnDefinitionStrings: string[] = [];
    const sqlStatementStrings: string[] = [];
    const sqlStatementStringIds: string[] = [];
    for(const parsedStatement of parsedStatements) {
        sqlStatementStringIds.push(`${parsedStatement.statementIdentifier.replace(/\s/g, '_')}SQL`);
        const sourceSQLString = `export const ${parsedStatement.statementIdentifier.replace(/\s/g, '_')}SQL = \`${parsedStatement.statement.replace(/`/g, "\\`")}\`;`;
        sqlStatementStrings.push(`${(parsedStatement.preStatementJSDoc || '') + '\n'}${sourceSQLString}`.trim());
        if(parsedStatement.resultColumns.length) {
            config.conventionSets.forEach(c => {
                c.importStatements.forEach(s => importStatments.add(s.trim()));
                models.push(generateOneTypeScriptModel(parsedStatement, c));
                columnDefinitionStrings.push(`${(parsedStatement.preStatementJSDoc || '') + '\n'}export const ${parsedStatement.statementIdentifier.replace(/\s/g, '_')}${c.name || ''}Columns = ${JSON.stringify(parsedStatement.resultColumns, null, '\t')}`.trim());
            });
        }
    }
    const batchArrayExport = `export const ${fileIdentifier}Statements = [\n\t${sqlStatementStringIds.join(',\n\t')}\n];`;
    const outFileContent = `${Array.from(importStatments.values()).join('\n')}\n\n${models.join('\n\n')}\n\n${columnDefinitionStrings.join('\n')}\n\n${sqlStatementStrings.join('\n')}\n\n${batchArrayExport}`.trim();
    mkdirSync(join(outFilePath, '..'), { recursive: true });
    writeFileSync(outFilePath, outFileContent);
}

function generateOneTypeScriptModel(parsedStatement: ParsedSQLStatement, conventionSet: NAORMConventionSet): string {
    let modelString = `${(parsedStatement.preStatementJSDoc || '') + '\n'}export ${conventionSet.typescriptConstruct} ${parsedStatement.statementIdentifier.replace(/\s/g, '_')}${conventionSet.name || ''} ${conventionSet.extends || ''} {
${parsedStatement.resultColumns.map(c => generateOneTypeScriptFieldName(c, conventionSet)).join('\n')}\n}`.trim();
    return modelString;
}

function generateOneTypeScriptFieldName(columnDefinition: NAORMResultColumn, conventionSet: NAORMConventionSet) {
    const typeToCheck = columnDefinition.naormTypeComment || columnDefinition.declaredType;
    const applicableTypeConvention = conventionSet.typeConventions.find(t => t.sqliteDeclaredType === typeToCheck)?.typescriptGeneratedType;
    const type = applicableTypeConvention || (getDefaultType(typeToCheck) + checkNotNull(columnDefinition.naormTypeComment)) || 'any';
    return (columnDefinition.jsDocComment ? `\t${columnDefinition.jsDocComment.trim()}\n` : '') + `\t"${columnDefinition.columnName.replace(/"/g, '\"')}": ${type};`
}

function checkNotNull(naormTypeComment: string | null): string {
    return naormTypeComment ? (naormTypeComment.includes('NOT NULL') ? '' : ' | null') : ' | null';
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