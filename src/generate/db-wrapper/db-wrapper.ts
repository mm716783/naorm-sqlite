import betterSQLite3 from 'better-sqlite3';
import { ParsedSQLStatement } from '../../interfaces/parsed-sql-file';
import { BaseDB } from './base-db';
import { BetterSQLite3DB } from './better-sqlite3-db';
import { SQLite3WASMDB } from './sqlite3-wasm-db';

/**
 * Wrapper class to encapsulate the database logic. Currently supports two DB engines:
 * - BetterSQLite3, for normal usage within the CLI
 * - SQLite3's WASM subproject (not bundled), for use on Stackblitz
 */
export class DBWrapper {

    private isWASM = false;
    private db: BaseDB;

    constructor(pathToDB: string) {
        // If running on Stackblitz, the naormSQLite3WASM property will have been set.
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const SQLite3WASM = (global as any)['naormSQLite3WASM'];
        this.isWASM = !!SQLite3WASM;
        if(this.isWASM) {
            // This tells us that we should use the WASM DB
            this.db = new SQLite3WASMDB();
        } else {
            // Otherwise, use the BetterSQLite3 DB
            this.db = new BetterSQLite3DB(pathToDB);
        }
        // Both DB classes have the same interface
    }

    public close() {
        this.db.close();
    }

    public processStatement(parsedStatement: ParsedSQLStatement): betterSQLite3.ColumnDefinition[] {
        try{ 
            const sql = parsedStatement.statement;
            const rawId = parsedStatement.rawStatementIdentifier;
            const stmtId = parsedStatement.statementIdentifier;
            switch(parsedStatement.statementType) {
            case 'table':
            case 'view':
                return this.db.processTable(sql, rawId);
            case 'index':
                return this.db.processIndex(sql);
            case 'dml':
                return this.db.processDML(sql, stmtId);
            default:
                return [];
            }
        } catch(e) {
            console.log('Error processing statement: ', parsedStatement.statement);
            throw e;
        }
    }
}