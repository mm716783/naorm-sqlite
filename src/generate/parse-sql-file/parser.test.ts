import { LexerToken, ParsedSQLFile, ParsedSQLStatement } from "../../interfaces/parsed-sql-file";
import { Lexer } from "./lexer";
import { Parser } from "./parser";

// These can be reused for all Parser tests
const [ fileName, fullFilePath, fileIdentifier ] = ['my-file.sql', 'my-dir/my-file.sql', 'myFile'];

function blankExpectedParsedSQLStatement(statement: string, tokens: LexerToken[]) {
    return {
        fileName,
        fullFilePath,
        fileIdentifier,
        statement: statement,
        statementTokens: tokens,
        skipStatementCompilation: false,
        statementDependencies: [],
        resultColumns: []
    };
}

test('Parser SELECT', () => {
    const statement = `SELECT * FROM myTable;`;
    const tokens: LexerToken[] = new Lexer(statement).lex();

    const possibleStatementDependenciesArray: string[] = ['MYTABLE'];
    const expectedParserOutput: ParsedSQLStatement[] = [{
        ...blankExpectedParsedSQLStatement(statement, tokens),
        preStatementJSDoc: '',
        preStatementFullComment: '',
        statementCategory: 'dml',
        statementType: 'dml',
        statementIdentifier: fileIdentifier,
        rawStatementIdentifier: '',
        possibleStatementDependencies: new Set<string>(possibleStatementDependenciesArray),
        possibleStatementDependenciesArray
    }];
    const parsedFile = new Parser(tokens, fileName, fullFilePath, fileIdentifier).parse();
    expect(parsedFile).toEqual(expectedParserOutput);
});


test('Parser MULTIPLE SELECT', () => {
    const statement = `SELECT 1; SELECT 2`;
    const tokens: LexerToken[] = new Lexer(statement).lex();

    const expectedParserOutput: ParsedSQLStatement[] = [{
        ...blankExpectedParsedSQLStatement('SELECT 1;', tokens.slice(0,4)),
        preStatementJSDoc: '',
        preStatementFullComment: '',
        statementCategory: 'dml',
        statementType: 'dml',
        statementIdentifier: fileIdentifier,
        rawStatementIdentifier: '',
        possibleStatementDependencies: new Set<string>(),
        possibleStatementDependenciesArray: []
    },{
        ...blankExpectedParsedSQLStatement(' SELECT 2', tokens.slice(3)),
        preStatementJSDoc: '',
        preStatementFullComment: ' ',
        statementCategory: 'dml',
        statementType: 'dml',
        statementIdentifier: fileIdentifier + '_1',
        rawStatementIdentifier: '',
        possibleStatementDependencies: new Set<string>(),
        possibleStatementDependenciesArray: []
    }];
    const parsedFile = new Parser(tokens, fileName, fullFilePath, fileIdentifier).parse();
    expect(parsedFile).toEqual(expectedParserOutput);
});

test('Parser SELECT with Comments', () => {
    const statement = '/** JSDoc 1*/'
    + '\n/** JSDoc 2 */'
    + '\n-- NAORM-ID: TEST'
    + '\nSELECT * FROM myTable;';
    const tokens: LexerToken[] = new Lexer(statement).lex();

    const possibleStatementDependenciesArray: string[] = ['MYTABLE'];
    const expectedParserOutput: ParsedSQLStatement[] = [{
        ...blankExpectedParsedSQLStatement(statement, tokens),
        preStatementJSDoc: '/** JSDoc 2 */',
        preStatementFullComment: '/** JSDoc 1*/' + '\n/** JSDoc 2 */' + '\n-- NAORM-ID: TEST\n',
        statementCategory: 'dml',
        statementType: 'dml',
        statementIdentifier: 'TEST',
        rawStatementIdentifier: '',
        possibleStatementDependencies: new Set<string>(possibleStatementDependenciesArray),
        possibleStatementDependenciesArray
    }];
    const parsedFile = new Parser(tokens, fileName, fullFilePath, fileIdentifier).parse();
    expect(parsedFile).toEqual(expectedParserOutput);
});


test('Parser CTE', () => {
    const statement = `WITH C AS (SELECT * FROM myTable) DELETE FROM myTable;`;
    const tokens: LexerToken[] = new Lexer(statement).lex();

    const possibleStatementDependenciesArray: string[] = ['C', 'MYTABLE'];
    const expectedParserOutput: ParsedSQLStatement[] = [{
        ...blankExpectedParsedSQLStatement(statement, tokens),
        preStatementJSDoc: '',
        preStatementFullComment: '',
        statementCategory: 'dml',
        statementType: 'dml',
        statementIdentifier: fileIdentifier,
        rawStatementIdentifier: '',
        possibleStatementDependencies: new Set<string>(possibleStatementDependenciesArray),
        possibleStatementDependenciesArray
    }];
    const parsedFile = new Parser(tokens, fileName, fullFilePath, fileIdentifier).parse();
    expect(parsedFile).toEqual(expectedParserOutput);
});





test('Parser CREATE TABLE with schema name', () => {
    const statement = `CREATE TABLE IF NOT EXISTS "main"."t1" AS SELECT`;
    const tokens: LexerToken[] = new Lexer(statement).lex();
    const possibleStatementDependenciesArray: string[] = ['MAIN'];
    const expectedParserOutput: ParsedSQLStatement[] = [{
        ...blankExpectedParsedSQLStatement(statement, tokens),
        preStatementJSDoc: '',
        preStatementFullComment: '',
        statementCategory: 'create',
        statementType: 'table',
        statementIdentifier: 'T1',
        rawStatementIdentifier: '"t1"',
        possibleStatementDependencies: new Set<string>(possibleStatementDependenciesArray),
        possibleStatementDependenciesArray
    }];
    const parsedFile = new Parser(tokens, fileName, fullFilePath, fileIdentifier).parse();
    expect(parsedFile).toEqual(expectedParserOutput);
});

test('Parser CREATE TABLE', () => {
    const statement = `CREATE TABLE "t1" AS (Id)`;
    const tokens: LexerToken[] = new Lexer(statement).lex();

    const possibleStatementDependenciesArray: string[] = ['ID'];
    const expectedParserOutput: ParsedSQLStatement[] = [{
        ...blankExpectedParsedSQLStatement(statement, tokens),
        preStatementJSDoc: '',
        preStatementFullComment: '',
        statementCategory: 'create',
        statementType: 'table',
        statementIdentifier: 'T1',
        rawStatementIdentifier: '"t1"',
        possibleStatementDependencies: new Set<string>(possibleStatementDependenciesArray),
        possibleStatementDependenciesArray
    }];
    const parsedFile = new Parser(tokens, fileName, fullFilePath, fileIdentifier).parse();
    expect(parsedFile).toEqual(expectedParserOutput);
});


test('Parser CREATE VIEW', () => {
    const statement = `CREATE VIEW "v1" AS (SELECT Id)`;
    const tokens: LexerToken[] = new Lexer(statement).lex();

    const possibleStatementDependenciesArray: string[] = ['ID'];
    const expectedParserOutput: ParsedSQLStatement[] = [{
        ...blankExpectedParsedSQLStatement(statement, tokens),
        preStatementJSDoc: '',
        preStatementFullComment: '',
        statementCategory: 'create',
        statementType: 'view',
        statementIdentifier: 'V1',
        rawStatementIdentifier: '"v1"',
        possibleStatementDependencies: new Set<string>(possibleStatementDependenciesArray),
        possibleStatementDependenciesArray
    }];
    const parsedFile = new Parser(tokens, fileName, fullFilePath, fileIdentifier).parse();
    expect(parsedFile).toEqual(expectedParserOutput);
});


test('Parser CREATE INDEX', () => {
    const statement = `CREATE INDEX "x1" ON t1(Id)`;
    const tokens: LexerToken[] = new Lexer(statement).lex();

    const possibleStatementDependenciesArray: string[] = ['T1','ID'];
    const expectedParserOutput: ParsedSQLStatement[] = [{
        ...blankExpectedParsedSQLStatement(statement, tokens),
        preStatementJSDoc: '',
        preStatementFullComment: '',
        statementCategory: 'create',
        statementType: 'index',
        statementIdentifier: 'X1',
        rawStatementIdentifier: '"x1"',
        possibleStatementDependencies: new Set<string>(possibleStatementDependenciesArray),
        possibleStatementDependenciesArray
    }];
    const parsedFile = new Parser(tokens, fileName, fullFilePath, fileIdentifier).parse();
    expect(parsedFile).toEqual(expectedParserOutput);
});


test('Parser CREATE VIRTUAL TABLE', () => {
    const statement = `CREATE VIRTUAL TABLE "t1" USING fs`;
    const tokens: LexerToken[] = new Lexer(statement).lex();

    const possibleStatementDependenciesArray: string[] = ['T1', 'FS'];
    const expectedParserOutput: ParsedSQLStatement[] = [{
        ...blankExpectedParsedSQLStatement(statement, tokens),
        preStatementJSDoc: '',
        preStatementFullComment: '',
        statementCategory: 'other',
        statementType: 'other',
        statementIdentifier: fileIdentifier,
        rawStatementIdentifier: '',
        possibleStatementDependencies: new Set<string>(possibleStatementDependenciesArray),
        possibleStatementDependenciesArray
    }];
    const parsedFile = new Parser(tokens, fileName, fullFilePath, fileIdentifier).parse();
    expect(parsedFile).toEqual(expectedParserOutput);
});


test('Parser DROP TRIGGER', () => {
    const statement = `DROP TRIGGER t1`;
    const tokens: LexerToken[] = new Lexer(statement).lex();

    const possibleStatementDependenciesArray: string[] = ['T1'];
    const expectedParserOutput: ParsedSQLStatement[] = [{
        ...blankExpectedParsedSQLStatement(statement, tokens),
        preStatementJSDoc: '',
        preStatementFullComment: '',
        statementCategory: 'other',
        statementType: 'other',
        statementIdentifier: fileIdentifier,
        rawStatementIdentifier: '',
        possibleStatementDependencies: new Set<string>(possibleStatementDependenciesArray),
        possibleStatementDependenciesArray
    }];
    const parsedFile = new Parser(tokens, fileName, fullFilePath, fileIdentifier).parse();
    expect(parsedFile).toEqual(expectedParserOutput);
});

test('Parser Missing Identifier', () => {
    const statement = `CREATE TABLE IF NOT EXISTS`;
    const tokens: LexerToken[] = new Lexer(statement).lex();

    const parse = () => new Parser(tokens, fileName, fullFilePath, fileIdentifier).parse();
    expect(parse).toThrow();
});


test('Parser Missing After Identifier', () => {
    const statement = `CREATE TABLE IF NOT EXISTS t1`;
    const tokens: LexerToken[] = new Lexer(statement).lex();

    const parse = () => new Parser(tokens, fileName, fullFilePath, fileIdentifier).parse();
    expect(parse).toThrow();
});

test('Parser garbage', () => {
    const statement = `+`;
    const tokens: LexerToken[] = new Lexer(statement).lex();

    const parse = () => new Parser(tokens, fileName, fullFilePath, fileIdentifier).parse();
    expect(parse).toThrow();
});




test('Parser Comment Only', () => {
    const statement = `-- comment only comment`;
    const tokens: LexerToken[] = new Lexer(statement).lex();
    const parsedFile = new Parser(tokens, fileName, fullFilePath, fileIdentifier).parse();
    expect(parsedFile).toEqual([]);
});


test('Parser EOF Comment', () => {
    const statement = `SELECT * FROM myTable; -- eof comment`;
    const tokens: LexerToken[] = new Lexer(statement).lex();
    const parse = () => new Parser(tokens, fileName, fullFilePath, fileIdentifier).parse();
    expect(parse).not.toThrow();
});