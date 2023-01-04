import { camelCase } from 'camel-case';
import { writeFileSync } from 'fs';
import { basename, join } from 'path';
import { parseSQLFile } from '../parse-sql-file/parse-sql-file';
import { NAORMConfig, NAORMStatementOverride } from '../interfaces/naorm-config';
import { ParsedSQLStatement } from '../interfaces/parsed-sql-file';

export function analyzeSQLFiles(dbDir: string, sqlFiles: string[], config: NAORMConfig) {
    const allFileNames: string[] = [];
    const allStatementsByFileMap = new Map<string, ParsedSQLStatement[]>();
    const tableAndViewStatements = new Map<string, ParsedSQLStatement>();
    const indexStatements: ParsedSQLStatement[] = [];
    const otherStatements: ParsedSQLStatement[] = [];
    const allStatementOverrides = new Map<string, NAORMStatementOverride>();
    config.statementOverrides.forEach(o => allStatementOverrides.set(o.statementIdentifier, o));
    sqlFiles.forEach(s => {
        const fileNameBase = camelCase(basename(s, '.sql'));
        const sameFileNameCount = allFileNames.filter(f => f === fileNameBase).length;
        allFileNames.push(fileNameBase);
        const fileIdentifier = fileNameBase + (sameFileNameCount ? ('_' + sameFileNameCount) : '');
        const parsedFile = parseSQLFile(join(dbDir, s), fileIdentifier);
        parsedFile.sqlStatements.forEach(s => {
            const statementOverride = allStatementOverrides.get(s.statementIdentifier);
            if(statementOverride) { 
                s.skipStatementCompilation = statementOverride.skipStatementCompilation; 
            }
            if(s.skipStatementCompilation) {
                otherStatements.push(s);
            } else if(s.statementType === 'table' || s.statementType === 'view') {
                if(tableAndViewStatements.has(s.statementIdentifier as string)) {
                    const conflictingPath = tableAndViewStatements.get(s.statementIdentifier as string)?.fullFilePath;
                    throw new Error('Duplicate Identifier' + s.statementIdentifier + ' found in files: ' + conflictingPath + ' and ' + s.fullFilePath);
                } else {
                    tableAndViewStatements.set(s.statementIdentifier, s);
                }
            } else if(s.statementType === 'index') {
                indexStatements.push(s);
            } else {
                otherStatements.push(s);
            }
        });
        allStatementsByFileMap.set(fileIdentifier, parsedFile.sqlStatements);
    });


    const tableAndViewIdentifiers = Array.from(tableAndViewStatements.keys());
    const allTableAndViewStatements = Array.from(tableAndViewStatements.values());
    determineDependencies(tableAndViewIdentifiers, allTableAndViewStatements, allStatementOverrides);
    determineDependencies(tableAndViewIdentifiers, indexStatements, allStatementOverrides);
    determineDependencies(tableAndViewIdentifiers, otherStatements, allStatementOverrides);
    allTableAndViewStatements.sort((a, b) => {
        if(a.statementDependencies.includes(b.statementIdentifier) &&
            b.statementDependencies.includes(a.statementIdentifier)) {
                throw 'Circular dependency';
        }
        if(a.statementDependencies.includes(b.statementIdentifier)) { return 1; }
        if(b.statementDependencies.includes(a.statementIdentifier)) { return -1; }
        return 0;
    })
    const statementsToGenerate = [...allTableAndViewStatements, ...indexStatements, ...otherStatements]
    writeFileSync(join(dbDir, 'naorm-generated', 'naorm-output.json'), JSON.stringify(statementsToGenerate, null, '\t'));
    return { 
        tableAndViewStatements,
        indexStatements,
        otherStatements,
        statementsToGenerate,
        allStatementsByFileMap
    };
}


function determineDependencies(tableAndViewIdentifiers: string[], statementsToCheck: ParsedSQLStatement[], allStatementOverrides: Map<string, NAORMStatementOverride>) {
    
    statementsToCheck.forEach(parsedSQLStatement => {
        if(!parsedSQLStatement.skipStatementCompilation) {
            const dependencies: string[] = [];
            const statementOverride = allStatementOverrides.get(parsedSQLStatement.statementIdentifier);
            const additionalDependencies = new Set<string>();
            const excludedDependencies = new Set<string>();
            if(statementOverride) {
                statementOverride.dependentOn.forEach(d => additionalDependencies.add(d));
                statementOverride.notDependentOn.forEach(d => excludedDependencies.add(d));
            }
            tableAndViewIdentifiers.forEach(k => {
                if(checkStatementDependency(parsedSQLStatement, k)) {
                    if(!excludedDependencies.has(k)) {
                        dependencies.push(k);
                        additionalDependencies.delete(k)
                    }
                }
            });
            parsedSQLStatement.statementDependencies = [...dependencies, ...Array.from(additionalDependencies.values())];
        }
    })

}

function checkStatementDependency(parsedSQLStatement: ParsedSQLStatement, dependentStatementIdentifier: string) {
    const isDependent = parsedSQLStatement.possibleStatementDependencies.has(dependentStatementIdentifier);
    return isDependent;
}