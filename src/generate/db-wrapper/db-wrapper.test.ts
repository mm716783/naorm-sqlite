import { DBWrapper } from "./db-wrapper.js";
import { ParsedSQLStatement } from "../../interfaces/parsed-sql-file.js";
import { NAORMColumnDefinition } from "../../interfaces/naorm-sql-statement.js";

let db: DBWrapper;
beforeEach(() => {
    db = new DBWrapper(`:memory:`);
});
afterEach(() => {
    db.close();
});

test('DB Wrapper Instantiate WASM', () => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    (global as any)['naormSQLite3WASM'] = {};
    const initFn = () => new DBWrapper(`:memory:`); 
    expect(initFn).toThrow();
    /* eslint-disable @typescript-eslint/no-explicit-any */
    delete (global as any)['naormSQLite3WASM'];
});

function createTable() {
    const parsedSQLStatement: Partial<ParsedSQLStatement> = {
        statement: 'CREATE TABLE t(a TEXT NOT NULL, b INT);',
        statementType: 'table',
        statementIdentifier: 'T',
        rawStatementIdentifier: 't'
    };
    return db.processStatement(parsedSQLStatement as ParsedSQLStatement);
}

test('DB Wrapper CREATE TABLE', () => {
    const expectedComputedColumns: NAORMColumnDefinition[] = [
        { name: 'a', type: 'TEXT', column: 'a', table: 't', database: 'main', declaredNotNull: true },
        { name: 'b', type: 'INT', column: 'b', table: 't', database: 'main', declaredNotNull: false }
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
    const expectedComputedColumns: NAORMColumnDefinition[] = [];
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
    const expectedComputedColumns: NAORMColumnDefinition[] = [
        { name: 'a', type: 'TEXT', column: 'a', table: 't', database: 'main', declaredNotNull: false },
        { name: 'E', type: null, column: null, table: null, database: null, declaredNotNull: false }
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
    const expectedComputedColumns: NAORMColumnDefinition[] = [
        { name: 'a', type: 'TEXT', column: 'a', table: 't', database: 'main', declaredNotNull: false },
        { name: 'b', type: 'INT', column: 'b', table: 't', database: 'main', declaredNotNull: false },
        { name: 'E', type: null, column: null, table: null, database: null, declaredNotNull: false }
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
    const expectedComputedColumns: NAORMColumnDefinition[] = [];
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
    const expectedComputedColumns: NAORMColumnDefinition[] = [
        { name: 'a', type: 'TEXT', column: 'a', table: 't', database: 'main', declaredNotNull: false }
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
    const expectedComputedColumns: NAORMColumnDefinition[] = [];
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
    const expectedComputedColumns: NAORMColumnDefinition[] = [];
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