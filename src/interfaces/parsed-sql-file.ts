import { NAORMSQLStatement } from "./naorm-sql-statement.js";

export interface ParsedSQLFile {
    fileName: string;
    fullFilePath: string;
    fileIdentifier: string;
    contents: string;
    sqlStatements: ParsedSQLStatement[]
}

export interface ParsedSQLStatement extends NAORMSQLStatement {
    // These properties are only used internally
    statementTokens: LexerToken[];
    possibleStatementDependencies: Set<string>;
    possibleStatementDependenciesArray: string[];
}

export interface LexerToken {
    type: 'jsDocComment' | 'cComment' | 'dashComment' | 'keyword' | 'dot' | 'as'
        | 'operator' | 'identifier' | 'quotedIdentifier' | 'semicolon' | 'whitespace';
    rawValue: string;
    normalizedValue: string;
}

