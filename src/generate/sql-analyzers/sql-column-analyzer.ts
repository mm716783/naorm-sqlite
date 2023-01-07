import { ParsedSQLStatement } from "../../interfaces/parsed-sql-file";
import { ColumnDefinition } from "better-sqlite3";
import { NAORMResultColumn } from "../../interfaces/naorm-sql-statement";
import { NAORMConfig } from "../../interfaces/naorm-config";
import { SQLColumnCommentParser } from "./sql-column-comment-parser";

export class SQLColumnAnalyzer {

    constructor(private readonly tableAndViewStatementMap: Map<string, ParsedSQLStatement>,
        private readonly config: NAORMConfig
    ) {}
    
    private checkNotNull(naormTypeComment: string | null): boolean {
        if(naormTypeComment) {
            if(naormTypeComment.includes('NOT NULL') || naormTypeComment.includes('NOTNULL')) {
                return true;
            } else {
                return false;
            }
        }
        return false;
    }

    private getDefaultType(type: string | null): string {
        if(type === null) { return 'any'; }
        if(type.includes('INT')) { return 'number'; }
        if(type.includes('CHAR')) { return 'string'; }
        if(type.includes('CLOB')) { return 'string'; }
        if(type.includes('TEXT')) { return 'string'; }
        if(type.includes('BLOB')) { return 'Buffer'; }
        if(type.includes('REAL')) { return 'number'; }
        if(type.includes('FLOA')) { return 'number'; }
        if(type.includes('DOUB')) { return 'number'; }
        return 'any';
    }    
    
    private applyColumnTypes(columnDefinition: NAORMResultColumn) {
        const results: { [key: string]: string } = {};
        const typeToCheck = columnDefinition.naormTypeComment || columnDefinition.declaredType;
        columnDefinition.isExplicitlyNotNull = this.checkNotNull(columnDefinition.naormTypeComment);
        let defaultType = this.getDefaultType(typeToCheck);
        
        this.config.conventionSets.forEach(conventionSet => {
            const matchingTypeConvention = conventionSet.typeConventions.find(t => {
                t.sqliteDeclaredType === typeToCheck;
            });
            results[conventionSet.name] = matchingTypeConvention 
                ? matchingTypeConvention.typescriptGeneratedType
                : defaultType;
        });
        
        columnDefinition.computedTypeByConventionSet = results;
    }

    private applyPropertiesFromDependencies(statement: ParsedSQLStatement, resultColumn: NAORMResultColumn) {
        if(!resultColumn.naormTypeComment || !resultColumn.jsDocComment) {
            return;
        }

        if(resultColumn.sourceTable && this.tableAndViewStatementMap.get(resultColumn.sourceTable)) {
            const tableDependency = this.tableAndViewStatementMap.get(resultColumn.sourceTable);
            if(tableDependency) {
                const dependencyColumn = tableDependency.resultColumns.find(col => col.sourceColumn === resultColumn.sourceColumn);
                resultColumn.naormTypeComment = resultColumn.naormTypeComment || dependencyColumn?.naormTypeComment || null;
                resultColumn.jsDocComment  = resultColumn.jsDocComment || dependencyColumn?.jsDocComment || null;    
            };
        }
        
        const viewDependencies = statement.statementDependencies.map(d => {
            return this.tableAndViewStatementMap.get(d);
        }).filter(d => d?.statementType === 'view');
        for(const dependency of viewDependencies) {
            if(resultColumn.naormTypeComment && resultColumn.jsDocComment) {
                break;
            }
            const dependencyColumn = dependency?.resultColumns.find(col => col.columnName === resultColumn.columnName);
            resultColumn.naormTypeComment = resultColumn.naormTypeComment || dependencyColumn?.naormTypeComment || null;
            resultColumn.jsDocComment  = resultColumn.jsDocComment || dependencyColumn?.jsDocComment || null;
        }
    };

    public getColumnMetadata(statement: ParsedSQLStatement, computedColumns: ColumnDefinition[]): NAORMResultColumn[] {
        const resultColumns: NAORMResultColumn[] = [];
    
        const columnNames = new Set(computedColumns.map(c => c.name.toUpperCase()));
        const columnComments = new SQLColumnCommentParser(statement.statementTokens, statement.preStatementJSDoc, columnNames).parse();

        computedColumns.forEach(c => {
            const resultColumn: NAORMResultColumn = {
                columnName: c.name,
                sourceDatabase: c.database,
                sourceTable: c.table,
                sourceColumn: c.column,
                declaredType: c.type,
                jsDocComment: columnComments.get(c.name.toUpperCase())?.jsDocComment || null,
                naormTypeComment: columnComments.get(c.name.toUpperCase())?.naormTypeComment || null,
                isExplicitlyNotNull: false,
                computedTypeByConventionSet: {}
            };
            this.applyPropertiesFromDependencies(statement, resultColumn);
            this.applyColumnTypes(resultColumn);
            resultColumns.push(resultColumn);
        });
        return resultColumns;
    }
}