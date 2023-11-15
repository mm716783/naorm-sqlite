import betterSQLite3 from 'better-sqlite3';
import { BaseDB } from './base-db.js';
import { NAORMColumnDefinition, SQLiteTableInfoColumn } from '../../interfaces/naorm-sql-statement.js';

export class BetterSQLite3DB extends BaseDB {

    private db: betterSQLite3.Database;

    constructor(pathToDB: string) {
        super();
        this.db = new betterSQLite3(pathToDB);
    }
    
    public close(): void {
        this.db.close();  
    }

    public processTable(sql: string, rawId: string): NAORMColumnDefinition[] {
        this.db.prepare(sql).run();
        const preparedStatement = this.db.prepare('SELECT * FROM ' + rawId);
        const declaredColumns = preparedStatement.columns();
        const pragmaInfoRows: SQLiteTableInfoColumn[] = this.db.prepare(`PRAGMA table_xinfo(${rawId})`).all();
        const pragmaInfoMap = new Map<string, SQLiteTableInfoColumn>();
        pragmaInfoRows.forEach(p => {
            pragmaInfoMap.set(p.name, p);
        });
        const computedColumns: NAORMColumnDefinition[] = declaredColumns.map(d => {
            const pragmaInfo = pragmaInfoMap.get(d.name);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const declaredNotNull = pragmaInfo!.notnull === 1; 
            return { ...d, declaredNotNull };
        });
        return computedColumns;
    }

    public processIndex(sql: string): NAORMColumnDefinition[] {
        this.db.prepare(sql).run();
        return [];
    }

    public processDML(sql: string): NAORMColumnDefinition[] {
        const preparedStatement = this.db.prepare(sql);
        if(preparedStatement.reader) {
            return preparedStatement.columns().map(c => { 
                return { ...c, declaredNotNull: false };
            });
        } 
        return [];
        
    }

}