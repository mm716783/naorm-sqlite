import { NAORMColumnDefinition } from '../../interfaces/naorm-sql-statement.js';

export abstract class BaseDB {

    public abstract close(): void;
    public abstract processTable(sql: string, rawId: string): NAORMColumnDefinition[]
    public abstract processIndex(sql: string): NAORMColumnDefinition[]
    public abstract processDML(sql: string, stmtId: string): NAORMColumnDefinition[]

}