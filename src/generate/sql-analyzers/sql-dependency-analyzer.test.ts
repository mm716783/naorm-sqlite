import { NAORMStatementOverride } from '../../interfaces/naorm-config';
import { ParsedSQLStatement } from '../../interfaces/parsed-sql-file';
import { SQLDependencyAnalyzer } from './sql-dependency-analyzer';

test('Dependency Analyzer Circular', () => {
    // A depends on B depends on C
    // C depends on B depends on A

    const statementMap = new Map<string, ParsedSQLStatement>();
    const a: Partial<ParsedSQLStatement> = {
        statementIdentifier: 'A',
        possibleStatementDependencies: new Set(['B']),
        statementDependencies: []
    }
    const b: Partial<ParsedSQLStatement> = {
        statementIdentifier: 'B',
        possibleStatementDependencies: new Set(['C', 'A']),
        statementDependencies: []
    }
    const c: Partial<ParsedSQLStatement> = {
        statementIdentifier: 'C',
        possibleStatementDependencies: new Set(['B']),
        statementDependencies: []
    }
    statementMap.set('A', a as ParsedSQLStatement);
    statementMap.set('B', b as ParsedSQLStatement);
    statementMap.set('C', c as ParsedSQLStatement);
    
    const statementOverrides = new Map<string, NAORMStatementOverride>(); 
    const analyzer = new SQLDependencyAnalyzer(statementMap, statementOverrides);

    const fn = () => analyzer.getStatementExecutionOrder();
    expect(fn).toThrow();
});



test('Dependency Analyzer Overrides', () => {
    // A depends on B depends on C
    // C depends on B depends on A
    // D depends on A
    // Override A to depend on C
    // Override B not to depend on A
    // Override C not to depend on B

    const statementMap = new Map<string, ParsedSQLStatement>();
    const a: Partial<ParsedSQLStatement> = {
        statementIdentifier: 'A',
        possibleStatementDependencies: new Set(['B']),
        statementDependencies: []
    }
    const b: Partial<ParsedSQLStatement> = {
        statementIdentifier: 'B',
        possibleStatementDependencies: new Set(['C', 'A']),
        statementDependencies: []
    }
    const c: Partial<ParsedSQLStatement> = {
        statementIdentifier: 'C',
        possibleStatementDependencies: new Set(['B']),
        statementDependencies: []
    }
    const d: Partial<ParsedSQLStatement> = {
        statementIdentifier: 'D',
        possibleStatementDependencies: new Set(['C']),
        statementDependencies: []
    }
    statementMap.set('D', d as ParsedSQLStatement);
    statementMap.set('C', c as ParsedSQLStatement);
    statementMap.set('A', a as ParsedSQLStatement);
    statementMap.set('B', b as ParsedSQLStatement);
    
    const statementOverrides = new Map<string, NAORMStatementOverride>(); 
    statementOverrides.set('A', {
        statementIdentifier: 'A',
        skipStatementCompilation:  false,
        dependentOn: ['C'],
        notDependentOn: []
    });
    statementOverrides.set('B', {
        statementIdentifier: 'B',
        skipStatementCompilation:  false,
        dependentOn: [],
        notDependentOn: ['A']
    });
    statementOverrides.set('C', {
        statementIdentifier: 'C',
        skipStatementCompilation:  false,
        dependentOn: [],
        notDependentOn: ['B']
    });

    const analyzer = new SQLDependencyAnalyzer(statementMap, statementOverrides);

    const results = analyzer.getStatementExecutionOrder();
    expect(results[0]).toBe(c);
    expect(results[1]).toBe(d);
    expect(results[2]).toBe(b);
    expect(results[3]).toBe(a);
})



test('Dependency Analyzer Skip', () => {
    // B depends on A
    // Skip compilation for B

    const statementMap = new Map<string, ParsedSQLStatement>();
    const a: Partial<ParsedSQLStatement> = {
        statementIdentifier: 'A',
        possibleStatementDependencies: new Set(),
        statementDependencies: []
    }
    const b: Partial<ParsedSQLStatement> = {
        skipStatementCompilation: true,
        statementIdentifier: 'B',
        possibleStatementDependencies: new Set(['A']),
        statementDependencies: []
    }
    statementMap.set('A', a as ParsedSQLStatement);
    statementMap.set('B', b as ParsedSQLStatement);
    
    const statementOverrides = new Map<string, NAORMStatementOverride>(); 
    const analyzer = new SQLDependencyAnalyzer(statementMap, statementOverrides);

    const results = analyzer.getStatementExecutionOrder();
    expect(results[0]).toBe(a);
    expect(results[1]).toBe(b);
    expect(results[1].statementDependencies).toEqual([]);
});

