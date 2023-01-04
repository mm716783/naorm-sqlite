import betterSQLite3 from 'better-sqlite3';

export abstract class BaseDB {

    constructor(pathToDB: string) {}

    public abstract processTable(sql: string, rawId: string): betterSQLite3.ColumnDefinition[]
    public abstract processIndex(sql: string): betterSQLite3.ColumnDefinition[]
    public abstract processDML(sql: string, stmtId: string): betterSQLite3.ColumnDefinition[]

}