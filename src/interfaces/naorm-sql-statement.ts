import { ColumnDefinition } from 'better-sqlite3';
export type NAORMColumnDefinition = ColumnDefinition & { declaredNotNull: boolean };

export interface NAORMSQLStatement {
    fileName: string;
    fileIdentifier: string;
    fullFilePath: string;
    preStatementJSDoc: string;
    preStatementFullComment: string;
    statement: string;
    statementCategory: 'create' | 'dml' | 'other';
    statementType: 'table' | 'view' | 'index' | 'dml' | 'other';
    statementIdentifier: string;
    rawStatementIdentifier: string;
    skipStatementCompilation: boolean;
    statementDependencies: string[];
    resultColumns: NAORMResultColumn[];
}

export interface NAORMResultColumn {
    columnName: string;
    sourceColumn: string | null;
    sourceTable: string | null;
    sourceDatabase: string | null;
    declaredType: string | null;
    jsDocComment: string | null;
    naormTypeComment: string | null;
    isDeclaredNotNull: boolean;
    isExplicitlyNotNull: boolean;
    computedTypeByConventionSet: { 
        [key: string]: string 
    };
}

export interface SQLiteTableInfoColumn {
    cid: number;
    name: string;
    dflt_value: string;
    notnull: number;
    pk: number;
    type: string;
    hidden: number;
}
