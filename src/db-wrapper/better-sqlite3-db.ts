import betterSQLite3 from 'better-sqlite3';
import { BaseDB } from './base-db';

export class BetterSQLite3DB extends BaseDB {

    private db: betterSQLite3.Database;

    constructor(pathToDB: string) {
        super(pathToDB);
        this.db = new betterSQLite3(pathToDB);
    }

    public processTable(sql: string, rawId: string): betterSQLite3.ColumnDefinition[] {
        this.db.prepare(sql).run();
        const preparedStatement = this.db.prepare('SELECT * FROM ' + rawId);
        const computedColumns = preparedStatement.columns();
        return computedColumns;
    }

    public processIndex(sql: string): betterSQLite3.ColumnDefinition[] {
        this.db.prepare(sql).run();
        return [];
    }

    public processDML(sql: string, stmtId: string): betterSQLite3.ColumnDefinition[] {
        const preparedStatement = this.db.prepare(sql);
        if(preparedStatement.reader) {
            return preparedStatement.columns();
        } else {
            return [];
        }
    }

}