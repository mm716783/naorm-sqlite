import betterSQLite3 from 'better-sqlite3';
import { getColumnTypesFromSQL } from '../helpers/get-column-type-from-sql';
import { ParsedSQLStatement } from '../interfaces/parsed-sql-file';

export function generateStatement(parsedStatement: ParsedSQLStatement, allTableViewStatements: Map<string, ParsedSQLStatement>, db: betterSQLite3.Database) { 
    if(!parsedStatement.skipStatementCompilation) {
        try{ 
            if(parsedStatement.statementType === 'table' || parsedStatement.statementType === 'view') {
                db.prepare(parsedStatement.statement).run();
                const preparedStatement = db.prepare('SELECT * FROM ' + parsedStatement.rawStatementIdentifier);
                const computedColumns = preparedStatement.columns()
                parsedStatement.resultColumns = getColumnTypesFromSQL(parsedStatement, computedColumns, allTableViewStatements);
            } else if(parsedStatement.statementType === 'index') {
                db.prepare(parsedStatement.statement).run();
            } else if(parsedStatement.statementType === 'dml') {
                const preparedStatement = db.prepare(parsedStatement.statement);
                if(preparedStatement.reader) {
                    const computedColumns = preparedStatement.columns();
                    parsedStatement.resultColumns = getColumnTypesFromSQL(parsedStatement, computedColumns, allTableViewStatements);
                } 
            }
        } catch(e) {
            console.log(parsedStatement.statement);
            throw e;
        }
    }  
}