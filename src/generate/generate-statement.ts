import betterSQLite3 from 'better-sqlite3';
import { NAORMConfig } from '../interfaces/naorm-config';
import { getColumnTypesFromSQL } from '../helpers/get-column-type-from-sql';
import { ParsedSQLStatement } from '../interfaces/parsed-sql-file';

export function generateStatement(parsedStatement: ParsedSQLStatement, allTableViewStatements: Map<string, ParsedSQLStatement>, db: betterSQLite3.Database) { 
    if(!parsedStatement.skipStatementCompilation) {
        if(parsedStatement.statementType === 'table' || parsedStatement.statementType === 'view') {
            db.exec(parsedStatement.statement);
            const preparedStatement = db.prepare('SELECT * FROM ' + parsedStatement.statementIdentifier);
            const computedColumns = preparedStatement.columns()
            parsedStatement.resultSetColumns = getColumnTypesFromSQL(parsedStatement, computedColumns, allTableViewStatements);
        } else if(parsedStatement.statementType === 'index') {
            db.exec(parsedStatement.statement);
        } else if(parsedStatement.statementType === 'dml') {
            const preparedStatement = db.prepare(parsedStatement.statement);
            if(preparedStatement.reader) {
                const computedColumns = preparedStatement.columns();
                parsedStatement.resultSetColumns = getColumnTypesFromSQL(parsedStatement, computedColumns, allTableViewStatements);
            } 
        }
    }  
}