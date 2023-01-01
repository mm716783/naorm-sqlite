import { SplitResultItemRich } from "dbgate-query-splitter/lib/splitQuery";
import { NAORMResultColumn } from "./naorm-result-column";

export interface ParsedSQLFile {
    fileName: string;
    fullFilePath: string;
    fileIdentifier: string;
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
    resultColumns: NAORMResultColumn[];
}