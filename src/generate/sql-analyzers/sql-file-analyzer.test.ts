import { DEFAULT_NAORM_CONFIG } from "../../init/default-config";
import { NAORMConfig } from "../../interfaces/naorm-config";
import { ParsedSQLStatement } from "../../interfaces/parsed-sql-file";
import { SQLFileAnalyzer } from "./sql-file-analyzer";

test('ensureUniqueStatementId with unique', () => {
    const sqlFileAnalyzer = new SQLFileAnalyzer(DEFAULT_NAORM_CONFIG);
    sqlFileAnalyzer.allStatementsByStatementId = new Map<string, ParsedSQLStatement>(); 
    sqlFileAnalyzer.allStatementsByStatementId.set('TEST1', 
        { fullFilePath: 'test/test1.sql'} as ParsedSQLStatement);
    const fn = () => sqlFileAnalyzer['ensureUniqueStatementId']('TEST2', 'test/test1.sql');
    expect(fn).not.toThrow();
});

test('ensureUniqueStatementId with duplicate', () => {
    const sqlFileAnalyzer = new SQLFileAnalyzer(DEFAULT_NAORM_CONFIG);
    sqlFileAnalyzer.allStatementsByStatementId = new Map<string, ParsedSQLStatement>(); 
    sqlFileAnalyzer.allStatementsByStatementId.set('TEST1', 
        { fullFilePath: 'test/test1.sql'} as ParsedSQLStatement);
    const fn = () => sqlFileAnalyzer['ensureUniqueStatementId']('TEST1', 'test/test1.sql');
    expect(fn).toThrow();
});


test('sortStatement with override', () => {
    const config: NAORMConfig = {...DEFAULT_NAORM_CONFIG, statementOverrides: [{
        statementIdentifier: 'TEST1',
        skipStatementCompilation: true, 
        dependentOn: [],
        notDependentOn: []
    }]};
    const sqlFileAnalyzer = new SQLFileAnalyzer(config);
    const statement: Partial<ParsedSQLStatement> = {
        statementIdentifier: 'TEST1',
        statementType: 'table'
    };
    sqlFileAnalyzer['sortStatement'](statement as ParsedSQLStatement);
    expect(sqlFileAnalyzer.tableAndViewStatementMap.size).toBe(0);
    expect(sqlFileAnalyzer.indexStatements.length).toBe(0);
    expect(sqlFileAnalyzer.otherStatements.length).toBe(1);
    expect(sqlFileAnalyzer.otherStatements[0]).toBe(statement);
    expect(statement.skipStatementCompilation).toBe(true);
});

test('sortStatement table', () => {
    const sqlFileAnalyzer = new SQLFileAnalyzer(DEFAULT_NAORM_CONFIG);
    const statement: Partial<ParsedSQLStatement> = {
        statementIdentifier: 'TEST1',
        statementType: 'table'
    };
    sqlFileAnalyzer['sortStatement'](statement as ParsedSQLStatement);
    expect(sqlFileAnalyzer.tableAndViewStatementMap.size).toBe(1);
    expect(sqlFileAnalyzer.indexStatements.length).toBe(0);
    expect(sqlFileAnalyzer.otherStatements.length).toBe(0);
    expect(sqlFileAnalyzer.tableAndViewStatementMap.get('TEST1')).toBe(statement);
});

test('sortStatement view', () => {
    const sqlFileAnalyzer = new SQLFileAnalyzer(DEFAULT_NAORM_CONFIG);
    const statement: Partial<ParsedSQLStatement> = {
        statementIdentifier: 'TEST2',
        statementType: 'table'
    };
    sqlFileAnalyzer['sortStatement'](statement as ParsedSQLStatement);
    expect(sqlFileAnalyzer.tableAndViewStatementMap.size).toBe(1);
    expect(sqlFileAnalyzer.indexStatements.length).toBe(0);
    expect(sqlFileAnalyzer.otherStatements.length).toBe(0);
    expect(sqlFileAnalyzer.tableAndViewStatementMap.get('TEST2')).toBe(statement);
});

test('sortStatement index', () => {
    const sqlFileAnalyzer = new SQLFileAnalyzer(DEFAULT_NAORM_CONFIG);
    const statement: Partial<ParsedSQLStatement> = {
        statementIdentifier: 'TEST2',
        statementType: 'index'
    };
    sqlFileAnalyzer['sortStatement'](statement as ParsedSQLStatement);
    expect(sqlFileAnalyzer.tableAndViewStatementMap.size).toBe(0);
    expect(sqlFileAnalyzer.indexStatements.length).toBe(1);
    expect(sqlFileAnalyzer.otherStatements.length).toBe(0);
    expect(sqlFileAnalyzer.indexStatements[0]).toBe(statement);
});

test('sortStatement dml', () => {
    const sqlFileAnalyzer = new SQLFileAnalyzer(DEFAULT_NAORM_CONFIG);
    const statement: Partial<ParsedSQLStatement> = {
        statementIdentifier: 'TEST4',
        statementType: 'dml'
    };
    sqlFileAnalyzer['sortStatement'](statement as ParsedSQLStatement);
    expect(sqlFileAnalyzer.tableAndViewStatementMap.size).toBe(0);
    expect(sqlFileAnalyzer.indexStatements.length).toBe(0);
    expect(sqlFileAnalyzer.otherStatements.length).toBe(1);
    expect(sqlFileAnalyzer.otherStatements[0]).toBe(statement);
});

test('sortStatement other', () => {
    const sqlFileAnalyzer = new SQLFileAnalyzer(DEFAULT_NAORM_CONFIG);
    const statement: Partial<ParsedSQLStatement> = {
        statementIdentifier: 'TEST5',
        statementType: 'other'
    };
    sqlFileAnalyzer['sortStatement'](statement as ParsedSQLStatement);
    expect(sqlFileAnalyzer.tableAndViewStatementMap.size).toBe(0);
    expect(sqlFileAnalyzer.indexStatements.length).toBe(0);
    expect(sqlFileAnalyzer.otherStatements.length).toBe(1);
    expect(sqlFileAnalyzer.otherStatements[0]).toBe(statement);
});

test('getFileIdentifier with unique', () => {
    const sqlFileAnalyzer = new SQLFileAnalyzer(DEFAULT_NAORM_CONFIG);
    const f1 = sqlFileAnalyzer.getFileIdentifier('test-one.sql');
    const f2 = sqlFileAnalyzer.getFileIdentifier('test-two.sql');
    const f3 = sqlFileAnalyzer.getFileIdentifier('test-three.sql');
    expect(f1).toEqual('testOne');
    expect(f2).toEqual('testTwo');
    expect(f3).toEqual('testThree');
});


test('getFileIdentifier with duplicate', () => {
    const sqlFileAnalyzer = new SQLFileAnalyzer(DEFAULT_NAORM_CONFIG);
    const f1 = sqlFileAnalyzer.getFileIdentifier('test-one.sql');
    const f2 = sqlFileAnalyzer.getFileIdentifier('test-one.sql');
    const f3 = sqlFileAnalyzer.getFileIdentifier('test-three.sql');
    expect(f1).toEqual('testOne');
    expect(f2).toEqual('testOne_1');
    expect(f3).toEqual('testThree');
});

