import { ColumnDefinition } from "better-sqlite3";
import { ParsedSQLStatement, ResultSetColumn } from "../interfaces/parsed-sql-file";

export function getColumnTypesFromSQL(parsedSqlStatement: ParsedSQLStatement, columnDefinitions: ColumnDefinition[], allTableViewStatements: Map<string, ParsedSQLStatement>): ResultSetColumn[] {
    const resultSetColumns: ResultSetColumn[] = [];

    let lastJSDocCommentEndPosition: number = 0;
    columnDefinitions.forEach(c => {
        
        const resultSetColumn: ResultSetColumn = {
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
            if(resultSetColumn.sourceTable && allTableViewStatements.get(resultSetColumn.sourceTable)) {
                const tableDependency = allTableViewStatements.get(resultSetColumn.sourceTable);
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
                const dependencyColumn = dependency.resultSetColumns.find(col => col.columnName === c.name);
                naormTypeComment = naormTypeComment || dependencyColumn?.naormTypeComment || null;
                jsDocCommentText = jsDocCommentText || dependencyColumn?.jsDocComment || null;
            }
        }

        resultSetColumn.jsDocComment = jsDocCommentText;
        resultSetColumn.naormTypeComment = naormTypeComment;
        resultSetColumns.push(resultSetColumn);
    });
    return resultSetColumns;
}

function getNaormTypeComment(sql: string, columnName: string): string | null {
    // TODO: Make this more sophisticated
    // - Ensure match is not within quotes or comment
    // - Ensure match is not within parentheses (e.g. sub-query or CTE)
    const matches = sql.match(new RegExp(columnName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "\\\s*\\\/\\\*\\\s*(.+?)\\\s*\\\*\\\/"))
    if(matches && matches.length) {
        return matches[0]?.replace(columnName, '').replace(/\s+\/\*\s+/, '').replace('*/', '').trim();
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

