import { ParsedSQLStatement } from '../../interfaces/parsed-sql-file';
import { SQLColumnAnalyzer } from './sql-column-analyzer';
import { DEFAULT_NAORM_CONFIG } from '../../init/default-config';
import { NAORMResultColumn } from '../../interfaces/naorm-sql-statement';
import { NAORMConfig, NAORMConventionSet, NAORMTypeConvention } from '../../interfaces/naorm-config';

test('Column Analyzer checkNotNull', () => {
    const statementMap = new Map<string, ParsedSQLStatement>();
    const columnAnalyzer = new SQLColumnAnalyzer(statementMap, DEFAULT_NAORM_CONFIG);
    expect(columnAnalyzer['checkNotNull'](null)).toEqual(false);
    expect(columnAnalyzer['checkNotNull']('TEXT')).toEqual(false);
    expect(columnAnalyzer['checkNotNull']('text not null')).toEqual(true);
    expect(columnAnalyzer['checkNotNull']('INT NOTNULL')).toEqual(true);
});


test('Column Analyzer getDefaultType', () => {
    const statementMap = new Map<string, ParsedSQLStatement>();
    const columnAnalyzer = new SQLColumnAnalyzer(statementMap, DEFAULT_NAORM_CONFIG);
    expect(columnAnalyzer['getDefaultType'](null)).toEqual('any');
    expect(columnAnalyzer['getDefaultType']('INT')).toEqual('number');
    expect(columnAnalyzer['getDefaultType']('int not null')).toEqual('number');
    expect(columnAnalyzer['getDefaultType']('BOOLINT')).toEqual('number');
    expect(columnAnalyzer['getDefaultType']('VARCHAR(10)')).toEqual('string');
    expect(columnAnalyzer['getDefaultType']('CHAR(20)')).toEqual('string');
    expect(columnAnalyzer['getDefaultType']('text')).toEqual('string');
    expect(columnAnalyzer['getDefaultType']('CLOB')).toEqual('string');
    expect(columnAnalyzer['getDefaultType']('DATE_TEXT')).toEqual('string');
    expect(columnAnalyzer['getDefaultType']('BLOB')).toEqual('Buffer');
    expect(columnAnalyzer['getDefaultType']('REAL')).toEqual('number');
    expect(columnAnalyzer['getDefaultType']('FLOA')).toEqual('number');
    expect(columnAnalyzer['getDefaultType']('double')).toEqual('number');
    expect(columnAnalyzer['getDefaultType']('DATE')).toEqual('any');
});


test('Column Analyzer applyColumnTypes', () => {
    const statementMap = new Map<string, ParsedSQLStatement>();
    const typeConventions: NAORMTypeConvention[] = [{
        sqliteDeclaredType: 'DATE_TEXT',
        typescriptGeneratedType: 'Date'
    }];
    const config: NAORMConfig = {
        ...DEFAULT_NAORM_CONFIG, 
        conventionSets: [
            { name: 'Parsed', typeConventions } as NAORMConventionSet,
            { name: 'Raw', typeConventions: [] as NAORMTypeConvention[] } as NAORMConventionSet
        ]
    };
    const columnAnalyzer = new SQLColumnAnalyzer(statementMap, config);

    const columnA: NAORMResultColumn = {
        columnName: 'a',
        sourceDatabase: 'main',
        sourceTable: 'tbl',
        sourceColumn: 'a',
        declaredType: 'DATE_TEXT',
        jsDocComment: null,
        naormTypeComment: null,
        isExplicitlyNotNull: false,
        computedTypeByConventionSet: {}
    };
    const expectedResultA: { [key: string]: string } = {
        'Parsed': 'Date',
        'Raw': 'string'
    };

    columnAnalyzer['applyColumnTypes'](columnA);
    expect(columnA.computedTypeByConventionSet).toEqual(expectedResultA);

    const columnB: NAORMResultColumn = {
        columnName: 'b',
        sourceDatabase: 'main',
        sourceTable: 'tbl',
        sourceColumn: 'b',
        declaredType: 'INT',
        jsDocComment: null,
        naormTypeComment: null,
        isExplicitlyNotNull: false,
        computedTypeByConventionSet: {}
    };
    const expectedResultB: { [key: string]: string } = {
        'Parsed': 'number',
        'Raw': 'number'
    };

    columnAnalyzer['applyColumnTypes'](columnB);
    expect(columnB.computedTypeByConventionSet).toEqual(expectedResultB);
});



test('Column Analyzer applyPropertiesFromDependencies', () => {
    const tableColumnA: Partial<NAORMResultColumn> = {
        columnName: 'a',
        sourceTable: 't',
        sourceColumn: 'a',
        jsDocComment: '/** JSDoc A */',
        naormTypeComment: '/** NAORM-TYPE: A */'
    };
    const tableColumnB: Partial<NAORMResultColumn> = {
        columnName: 'b',
        sourceTable: 't',
        sourceColumn: 'b',
        jsDocComment: null,
        naormTypeComment: null
    };
    const viewColumnB: Partial<NAORMResultColumn> = {
        columnName: 'b',
        sourceTable: 't',
        sourceColumn: 'b',
        jsDocComment: '/** JSDoc B */',
        naormTypeComment: '/** NAORM-TYPE: B */'
    }
    const viewColumnC: Partial<NAORMResultColumn> = {
        columnName: 'c',
        sourceTable: null,
        sourceColumn: null,
        jsDocComment: null,
        naormTypeComment: null
    }
    const viewColumnD: Partial<NAORMResultColumn> = {
        columnName: 'd',
        sourceTable: null,
        sourceColumn: null,
        jsDocComment: '/** JSDoc D */',
        naormTypeComment: '/** NAORM-TYPE: D */'
    }
    
    const tableStatement: Partial<ParsedSQLStatement> = {
        statementType: 'table',
        resultColumns: [
            tableColumnA as NAORMResultColumn,
            tableColumnB as NAORMResultColumn
        ]
    };
    const viewStatement: Partial<ParsedSQLStatement> = {
        statementType: 'view',
        resultColumns: [
            tableColumnA as NAORMResultColumn,
            viewColumnB as NAORMResultColumn,
            viewColumnC as NAORMResultColumn,
            viewColumnD as NAORMResultColumn,
        ]
    };
    
    const statementMap = new Map<string, ParsedSQLStatement>();
    statementMap.set('T', tableStatement as ParsedSQLStatement);
    statementMap.set('VW', viewStatement as ParsedSQLStatement);

    const statementDependencies = ['T', 'VW', 'NA'];
    
    const columnAnalyzer = new SQLColumnAnalyzer(statementMap, DEFAULT_NAORM_CONFIG);

    const columnA: Partial<NAORMResultColumn> = {
        columnName: 'a',
        sourceTable: 't',
        sourceColumn: 'a',
        jsDocComment: null,
        naormTypeComment: null
    };
    const columnA1: Partial<NAORMResultColumn> = {
        ...columnA,
        jsDocComment: '/* JS Doc A1 */'
    };
    const columnA2: Partial<NAORMResultColumn> = {
        ...columnA,
        naormTypeComment: '/** NAORM-TYPE: A2 */'
    };
    const columnA3: Partial<NAORMResultColumn> = {
        ...columnA,
        jsDocComment: '/* JS Doc A3 */',
        naormTypeComment: '/** NAORM-TYPE: A3 */'
    };
    columnAnalyzer['applyPropertiesFromDependencies'](statementDependencies, columnA as NAORMResultColumn);
    expect(columnA.jsDocComment).toEqual(tableColumnA.jsDocComment);
    expect(columnA.naormTypeComment).toEqual(tableColumnA.naormTypeComment);
    columnAnalyzer['applyPropertiesFromDependencies'](statementDependencies, columnA1 as NAORMResultColumn);
    expect(columnA1.jsDocComment).toEqual(columnA1.jsDocComment);
    expect(columnA1.naormTypeComment).toEqual(tableColumnA.naormTypeComment);
    columnAnalyzer['applyPropertiesFromDependencies'](statementDependencies, columnA2 as NAORMResultColumn);
    expect(columnA2.jsDocComment).toEqual(tableColumnA.jsDocComment);
    expect(columnA2.naormTypeComment).toEqual(columnA2.naormTypeComment);
    columnAnalyzer['applyPropertiesFromDependencies'](statementDependencies, columnA3 as NAORMResultColumn);
    expect(columnA3.jsDocComment).toEqual(columnA3.jsDocComment);
    expect(columnA3.naormTypeComment).toEqual(columnA3.naormTypeComment);

    const columnB: Partial<NAORMResultColumn> = {
        columnName: 'b',
        sourceTable: 't',
        sourceColumn: 'b',
        jsDocComment: null,
        naormTypeComment: null
    };
    columnAnalyzer['applyPropertiesFromDependencies'](statementDependencies, columnB as NAORMResultColumn);
    expect(columnB.jsDocComment).toEqual(viewColumnB.jsDocComment);
    expect(columnB.naormTypeComment).toEqual(viewColumnB.naormTypeComment);

    
    const columnC: Partial<NAORMResultColumn> = {
        columnName: 'c',
        sourceTable: null,
        sourceColumn: null,
        jsDocComment: null,
        naormTypeComment: null
    };
    columnAnalyzer['applyPropertiesFromDependencies'](statementDependencies, columnC as NAORMResultColumn);
    expect(columnC.jsDocComment).toEqual(viewColumnC.jsDocComment);
    expect(columnC.naormTypeComment).toEqual(viewColumnC.naormTypeComment);

    
    const columnD: Partial<NAORMResultColumn> = {
        columnName: 'd',
        sourceTable: null,
        sourceColumn: null,
        jsDocComment: null,
        naormTypeComment: null
    };
    columnAnalyzer['applyPropertiesFromDependencies'](statementDependencies, columnD as NAORMResultColumn);
    expect(columnD.jsDocComment).toEqual(viewColumnD.jsDocComment);
    expect(columnD.naormTypeComment).toEqual(viewColumnD.naormTypeComment);

    
    const columnE: Partial<NAORMResultColumn> = {
        columnName: 'e',
        sourceTable: 't',
        sourceColumn: 'e',
        jsDocComment: null,
        naormTypeComment: null
    };
    columnAnalyzer['applyPropertiesFromDependencies'](statementDependencies, columnE as NAORMResultColumn);
    expect(columnE.jsDocComment).toEqual(null);
    expect(columnE.naormTypeComment).toEqual(null);
});