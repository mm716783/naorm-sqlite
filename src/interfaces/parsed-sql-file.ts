import { SplitResultItemRich } from "dbgate-query-splitter/lib/splitQuery";

export interface ParsedSQLFile {
    fileName: string;
    fullFilePath: string;
    contents: string;
    sqlStatements: ParsedSQLStatement[]
    eofComment: string;
}

export interface ParsedSQLStatement {
    fileName: string;
    fullFilePath: string;
    splitResultItem: SplitResultItemRich;
    preStatementJSDoc: string | null;
    preStatementComment: string;
    statement: string;
    statementType: 'table' | 'view' | 'index' | 'dml' | 'other';
    statementIdentifier: string;
    skipStatementCompilation: boolean;
    statementDependencies: string[];
    resultSetColumns: ResultSetColumn[];
}

export interface ResultSetColumn {
    columnName: string;
    sourceColumn: string | null;
    sourceTable: string | null;
    sourceDatabase: string | null;
    declaredType: string | null;
    naormTypeComment: string | null;
    typeScriptTypeAnnotation: string | null;
    jsDocComment: string | null;
}