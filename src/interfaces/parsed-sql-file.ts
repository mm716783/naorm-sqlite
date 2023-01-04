import { NAORMResultColumn } from "./naorm-result-column";

export interface ParsedSQLFile {
    fileName: string;
    fullFilePath: string;
    fileIdentifier: string;
    contents: string;
    sqlStatements: ParsedSQLStatement[]
}

export interface ParsedSQLStatement {
    fileName: string;
    fileIdentifier: string;
    fullFilePath: string;
    preStatementJSDoc: string;
    preStatementFullComment: string;
    statement: string;
    statementTokens: LexerToken[];
    statementCategory: 'create' | 'dml' | 'other';
    statementType: 'table' | 'view' | 'index' | 'dml' | 'other';
    statementIdentifier: string;
    rawStatementIdentifier: string;
    skipStatementCompilation: boolean;
    possibleStatementDependencies: Set<string>;
    possibleStatementDependenciesArray: string[];
    statementDependencies: string[];
    resultColumns: NAORMResultColumn[];
}

export interface LexerToken {
    type: 'jsDocComment' | 'cComment' | 'dashComment' | 'keyword' | 'dot' | 'as'
        | 'operator' | 'identifier' | 'quotedIdentifier' | 'semicolon' | 'whitespace';
    rawValue: string;
    normalizedValue: string;
}