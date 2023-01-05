import { DBWrapper } from "./db-wrapper";
import { ColumnDefinition } from 'better-sqlite3';
import { ParsedSQLStatement } from "../interfaces/parsed-sql-file";

let db: DBWrapper;
beforeEach(() => {
    db = new DBWrapper(`:memory:`);
});
afterEach(() => {
    db.close();
});

test('DB Wrapper Instantiate WASM', () => {
    (global as any)['naormSQLite3WASM'] = {};
    const initFn = () => new DBWrapper(`:memory:`); 
    expect(initFn).toThrow();
    delete (global as any)['naormSQLite3WASM'];
});

function createTable() {
    const parsedSQLStatement: Partial<ParsedSQLStatement> = {
        statement: 'CREATE TABLE t(a TEXT, b INT);',
        statementType: 'table',
        statementIdentifier: 'T',
        rawStatementIdentifier: 't'
    };
    return db.processStatement(parsedSQLStatement as ParsedSQLStatement);
}

test('DB Wrapper CREATE TABLE', () => {
    const expectedComputedColumns: ColumnDefinition[] = [
        { name: 'a', type: 'TEXT', column: 'a', table: 't', database: 'main' },
        { name: 'b', type: 'INT', column: 'b', table: 't', database: 'main' }
    ];
    const columns = createTable();
    expect(columns).toEqual(expectedComputedColumns);
});

test('DB Wrapper CREATE INDEX', () => {
    createTable();
    const parsedSQLStatement: Partial<ParsedSQLStatement> = {
        statement: 'CREATE INDEX x ON T(b);',
        statementType: 'index',
        statementIdentifier: 'X',
        rawStatementIdentifier: 'x'
    };
    const expectedComputedColumns: ColumnDefinition[] = [];
    const columns = db.processStatement(parsedSQLStatement as ParsedSQLStatement);
    expect(columns).toEqual(expectedComputedColumns);
});

test('DB Wrapper CREATE VIEW', () => {
    createTable();
    const parsedSQLStatement: Partial<ParsedSQLStatement> = {
        statement: 'CREATE VIEW v AS SELECT a, NULL AS E FROM T;',
        statementType: 'view',
        statementIdentifier: 'V',
        rawStatementIdentifier: 'v'
    };
    const expectedComputedColumns: ColumnDefinition[] = [
        { name: 'a', type: 'TEXT', column: 'a', table: 't', database: 'main' },
        { name: 'E', type: null, column: null, table: null, database: null }
    ];
    const columns = db.processStatement(parsedSQLStatement as ParsedSQLStatement);
    expect(columns).toEqual(expectedComputedColumns);
});

test('DB Wrapper SELECT *', () => {
    createTable();
    const parsedSQLStatement: Partial<ParsedSQLStatement> = {
        statement: 'SELECT *, NULL AS E FROM T;',
        statementType: 'dml',
        statementIdentifier: 'S',
        rawStatementIdentifier: ''
    };
    const expectedComputedColumns: ColumnDefinition[] = [
        { name: 'a', type: 'TEXT', column: 'a', table: 't', database: 'main' },
        { name: 'b', type: 'INT', column: 'b', table: 't', database: 'main' },
        { name: 'E', type: null, column: null, table: null, database: null }
    ];
    const columns = db.processStatement(parsedSQLStatement as ParsedSQLStatement);
    expect(columns).toEqual(expectedComputedColumns);
});

test('DB Wrapper INSERT', () => {
    createTable();
    const parsedSQLStatement: Partial<ParsedSQLStatement> = {
        statement: "INSERT INTO T (a,b) VALUES ('x', 2)",
        statementType: 'dml',
        statementIdentifier: 'I',
        rawStatementIdentifier: ''
    };
    const expectedComputedColumns: ColumnDefinition[] = [];
    const columns = db.processStatement(parsedSQLStatement as ParsedSQLStatement);
    expect(columns).toEqual(expectedComputedColumns);
});

test('DB Wrapper DELETE RETURNING', () => {
    createTable();
    const parsedSQLStatement: Partial<ParsedSQLStatement> = {
        statement: "DELETE FROM T RETURNING a",
        statementType: 'dml',
        statementIdentifier: 'D',
        rawStatementIdentifier: ''
    };
    const expectedComputedColumns: ColumnDefinition[] = [
        { name: 'a', type: 'TEXT', column: 'a', table: 't', database: 'main' }
    ];
    const columns = db.processStatement(parsedSQLStatement as ParsedSQLStatement);
    expect(columns).toEqual(expectedComputedColumns);
});


test('DB Wrapper DROP', () => {
    createTable();
    const parsedSQLStatement: Partial<ParsedSQLStatement> = {
        statement: "DROP INDEX x",
        statementType: 'other',
        statementIdentifier: 'X',
        rawStatementIdentifier: ''
    };
    const expectedComputedColumns: ColumnDefinition[] = [];
    const columns = db.processStatement(parsedSQLStatement as ParsedSQLStatement);
    expect(columns).toEqual(expectedComputedColumns);
});

test('DB Wrapper PRAGMA', () => {
    createTable();
    const parsedSQLStatement: Partial<ParsedSQLStatement> = {
        statement: "PRAGMA foreign_keys;",
        statementType: 'other',
        statementIdentifier: 'P',
        rawStatementIdentifier: ''
    };
    const expectedComputedColumns: ColumnDefinition[] = [];
    const columns = db.processStatement(parsedSQLStatement as ParsedSQLStatement);
    expect(columns).toEqual(expectedComputedColumns);
});

test('DB Wrapper INVALID', () => {
    createTable();
    const parsedSQLStatement: Partial<ParsedSQLStatement> = {
        statement: "SELECT * FROM A",
        statementType: 'dml',
        statementIdentifier: '',
        rawStatementIdentifier: ''
    };
    const exexFn =  () => db.processStatement(parsedSQLStatement as ParsedSQLStatement);
    expect(exexFn).toThrow();
});