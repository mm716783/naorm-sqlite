import { NAORMStatementOverride } from "../../interfaces/naorm-config.js";
import { ParsedSQLStatement } from "../../interfaces/parsed-sql-file.js";

export class SQLDependencyAnalyzer {
    
    private readonly tableAndViewIdentifiers;
    private readonly sequencedStatements;
    constructor(private readonly tableAndViewStatementMap: Map<string, ParsedSQLStatement>, 
        private allStatementOverrides: Map<string, NAORMStatementOverride>) {
        this.tableAndViewIdentifiers = Array.from(this.tableAndViewStatementMap.keys());
        this.sequencedStatements = Array.from(this.tableAndViewStatementMap.values());
    }

    private determineStatementDependencies(parsedSQLStatement: ParsedSQLStatement) {
        if(parsedSQLStatement.skipStatementCompilation) {
            return [];
        }
        const dependencies: string[] = [];
        const statementOverride = this.allStatementOverrides.get(parsedSQLStatement.statementIdentifier);
        const additionalDependencies = new Set<string>();
        const excludedDependencies = new Set<string>();
        if(statementOverride) {
            statementOverride.dependentOn.forEach(d => additionalDependencies.add(d));
            statementOverride.notDependentOn.forEach(d => excludedDependencies.add(d));
        }
        this.tableAndViewIdentifiers.forEach(k => {
            const isDependent = parsedSQLStatement.possibleStatementDependencies.has(k);
            if(isDependent && !excludedDependencies.has(k)) {
                dependencies.push(k);
                additionalDependencies.delete(k);
            }
        });
        return [...dependencies, ...Array.from(additionalDependencies.values())];
    }

    public getStatementExecutionOrder(): ParsedSQLStatement[] {
        this.sequencedStatements.forEach(statement => {
            statement.statementDependencies = this.determineStatementDependencies(statement);
        });
        this.sequencedStatements.sort((a, b) => {
            if(a.statementDependencies.includes(b.statementIdentifier) &&
                b.statementDependencies.includes(a.statementIdentifier)) {
                throw 'Circular dependency';
            }
            if(a.statementDependencies.includes(b.statementIdentifier)) { return 1; }
            if(b.statementDependencies.includes(a.statementIdentifier)) { return -1; }
            return 0;
        });
        return this.sequencedStatements;
    }

}