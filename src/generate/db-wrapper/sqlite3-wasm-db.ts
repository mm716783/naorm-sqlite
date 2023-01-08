/* istanbul ignore file */
import betterSQLite3 from 'better-sqlite3';
import { BaseDB } from './base-db';

interface SQLiteTableInfoColumn {
    cid: number;
    name: string;
    dflt_value: string;
    notnull: number;
    pk: number;
    type: string;
}


export class SQLite3WASMDB extends BaseDB {

    /* eslint-disable @typescript-eslint/no-explicit-any */
    private db: any;

    constructor() {
        super();
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const SQLite3WASM = (global as any)['naormSQLite3WASM'];
        this.db = new SQLite3WASM.oo1.DB(":memory:",'c');
    }

    public close(): void {
        this.db.close();  
    }

    private getPragmaInfo(id: string) {
        const resultRows: SQLiteTableInfoColumn[] = [];

        /*  
        SQLite WASM does not currently support some of the C function for retrieving
        certain column information like the Source Table, Source Column, and Declared Type.
        The Declared Type is the most important one, we can get it using the table_info PRAGMA.
        */
        this.db.exec({
            sql: `PRAGMA table_info(${id})`,
            rowMode: 'object',
            resultRows: resultRows
        });

        const computedColumns = resultRows.map(s => {
            const c: betterSQLite3.ColumnDefinition = {
                name: s.name,
                type: s.type,
                column: null,
                table: null,
                database: null,
            };
            return c;
        });
        return computedColumns;
    }

    public processTable(sql: string, rawId: string): betterSQLite3.ColumnDefinition[] {
        const stmt = this.db.prepare(sql);
        stmt.stepFinalize();
        return this.getPragmaInfo(rawId);
    }

    public processIndex(sql: string): betterSQLite3.ColumnDefinition[] {
        this.db.prepare(sql).run();
        return [];
    }

    public processDML(sql: string, stmtId: string): betterSQLite3.ColumnDefinition[] {
        const stmt = this.db.prepare(sql);
        const columnCount = stmt.columnCount;
        stmt.finalize();
        if (columnCount === 0) {
            // If the statement returns no columns, then it's a regular 
            // INSERT, UPDATE, or DELETE with no RETURNING clause.
            return [];
        } 
        try {
            // If it's a regular SELECT statement, we can create a TEMP VIEW
            const stmt2 = this.db.prepare(`CREATE TEMP VIEW ${stmtId} AS ` + sql);
            stmt2.stepFinalize();
            // Then get the PRAGMA info
            const columns = this.getPragmaInfo(stmtId);
            // And drop the view
            const stmt3 = this.db.prepare(`DROP VIEW ${stmtId}`);
            stmt3.stepFinalize();
            return columns;
        } catch (e) {
            // If there was an error trying to create the TEMP VIEW, then 
            // it was almost certainly a statement with a RETURNING clause.
            // This isn't possible to get info for using PRAGMA, so return [] for now.
            return [];
        }
        
    }

}