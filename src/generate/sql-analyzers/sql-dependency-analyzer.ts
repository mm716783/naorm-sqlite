import { NAORMStatementOverride } from "../../interfaces/naorm-config.js";
import { ParsedSQLStatement } from "../../interfaces/parsed-sql-file.js";

export class SQLDependencyAnalyzer {
    
    private readonly tableAndViewIdentifiers;
    private readonly unsortedStatements;
    constructor(private readonly tableAndViewStatementMap: Map<string, ParsedSQLStatement>, 
        private allStatementOverrides: Map<string, NAORMStatementOverride>) {
        this.tableAndViewIdentifiers = Array.from(this.tableAndViewStatementMap.keys());
        this.unsortedStatements = Array.from(this.tableAndViewStatementMap.values());
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

    private checkStatementDependencyRecursive(statementId: string, visitedStatements: Set<string>, 
        dependentIds: Set<string>, statementMap: Map<string, ParsedSQLStatement>, results: ParsedSQLStatement[]) {
        if(dependentIds.has(statementId)) {
            throw 'Circular dependency';
        }
      
        if (visitedStatements.has(statementId)) {
            return;
        }
        visitedStatements.add(statementId);

        const statement = statementMap.get(statementId)!;
        const dependencies = statement.statementDependencies;
        dependentIds.add(statementId);
        dependencies.forEach((dependencyId) => {
            this.checkStatementDependencyRecursive(dependencyId, visitedStatements, dependentIds, statementMap, results);
        });
        results.push(statement);
    }
    
    public getStatementExecutionOrder(): ParsedSQLStatement[] {
        const statementMap = new Map<string, ParsedSQLStatement>();
        this.unsortedStatements.forEach(statement => {
            statement.statementDependencies = this.determineStatementDependencies(statement);
            statementMap.set(statement.statementIdentifier, statement);
        });
        const sortedStatements: ParsedSQLStatement[] = []; 
        const visitedStatements = new Set<string>();
        this.unsortedStatements.forEach(statement => {
            this.checkStatementDependencyRecursive(statement.statementIdentifier, visitedStatements, new Set(), statementMap, sortedStatements);
        });

        return sortedStatements;
    }
}