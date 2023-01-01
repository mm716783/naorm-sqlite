import { ColumnDefinition } from "better-sqlite3";
import { ParsedSQLStatement } from "../interfaces/parsed-sql-file";
import { NAORMResultColumn } from "../interfaces/naorm-result-column";

export function getColumnTypesFromSQL(parsedSqlStatement: ParsedSQLStatement, columnDefinitions: ColumnDefinition[], allTableViewStatements: Map<string, ParsedSQLStatement>): NAORMResultColumn[] {
    const resultColumns: NAORMResultColumn[] = [];

    let lastJSDocCommentEndPosition: number = 0;
    columnDefinitions.forEach(c => {
        
        const resultColumn: NAORMResultColumn = {
            columnName: c.name,
            sourceDatabase: c.database,
            sourceTable: c.table,
            sourceColumn: c.column,
            declaredType: c.type,
            naormTypeComment: null,
            jsDocComment: null,
            typeScriptTypeAnnotation: null,
        }
        let naormTypeComment = getNaormTypeComment(parsedSqlStatement.statement, c.name);
        let jsDocComment = getJsDocComment(parsedSqlStatement.statement, c.name, c.type, lastJSDocCommentEndPosition);
        let jsDocCommentText = jsDocComment?.text || null;
        if(jsDocComment?.endPosition) { lastJSDocCommentEndPosition = jsDocComment?.endPosition };

        if(!jsDocComment?.text || !naormTypeComment) {
            const dependecies: ParsedSQLStatement[] = [];
            if(resultColumn.sourceTable && allTableViewStatements.get(resultColumn.sourceTable)) {
                const tableDependency = allTableViewStatements.get(resultColumn.sourceTable);
                if(tableDependency) { dependecies.push(tableDependency); };
            }
            parsedSqlStatement.statementDependencies.forEach(d => {
                const dependency = allTableViewStatements.get(d);
                if(dependency && dependency.statementType === 'view') {
                    dependecies.push(dependency);
                }
            })

            for(const dependency of dependecies) {
                if(jsDocComment?.text && naormTypeComment) { break; }
                const dependencyColumn = dependency.resultColumns.find(col => col.columnName === c.name);
                naormTypeComment = naormTypeComment || dependencyColumn?.naormTypeComment || null;
                jsDocCommentText = jsDocCommentText || dependencyColumn?.jsDocComment || null;
            }
        }

        resultColumn.jsDocComment = jsDocCommentText;
        resultColumn.naormTypeComment = naormTypeComment;
        resultColumns.push(resultColumn);
    });
    return resultColumns;
}

function getNaormTypeComment(sql: string, columnName: string): string | null {
    const regex = new RegExp(columnName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "\\\s*\\\/\\\*\\\s*NAORM-TYPE:(.+?)\\\s*\\\*\\\/", 'is');
    const matches = sql.match(regex)
    if(matches && matches.length) {
        const result = matches[0]?.replace(columnName, '').replace(/\s*\/\*\s*NAORM-TYPE:/i, '').replace('*/', '').trim();
        return result;
    }
    return null;
}


function getJsDocComment(sql: string, columnName: string, declaredType: string | null, lastJSDocCommentEndPosition: number) {
    // TODO: Make this more sophisticated
    // - Ensure match is not within quotes or comment
    // - Ensure match is not within parentheses (e.g. sub-query or CTE)

    const remainingSQL = sql.slice(lastJSDocCommentEndPosition)
    const jsDocRegexString = "\\\s*\\\/\\\*\\\*\\\s*.+?\\\s*\\\*\\\/";
    const afterCommentPattern = declaredType ? "\\\s+?" : ".+?AS\\\s+";
    const regexString = jsDocRegexString + afterCommentPattern + columnName.replace(/[.*+?^${}()|[\]\\]/, '\\$&');
    const matches = remainingSQL.match(new RegExp(regexString, 'mis'))
    if(matches && matches.length) {
        const commentMatch = matches[0].match(new RegExp(jsDocRegexString, 'ms'));
        if(commentMatch?.[0]) {
            return { 
                text: commentMatch?.[0].trim(),
                endPosition: (matches?.['index'] || 0) + (matches?.[0].length || 0) + lastJSDocCommentEndPosition
            };
        }
    }
    return null;
}

