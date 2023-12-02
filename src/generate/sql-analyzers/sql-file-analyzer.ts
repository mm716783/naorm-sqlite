import { basename } from "path";
import camelCase from "just-camel-case";
import { NAORMConfig, NAORMStatementOverride } from "../../interfaces/naorm-config.js";
import { ParsedSQLFile, ParsedSQLStatement } from "../../interfaces/parsed-sql-file.js";

export class SQLFileAnalyzer {

    private fileBaseNameCounts = new Map<string, number>();

    // Helpful groupings of files and statements that will be used later
    public allStatementOverrides = new Map<string, NAORMStatementOverride>();
    public allParsedFilesByFileId = new Map<string, ParsedSQLFile>();
    public allStatementsByStatementId = new Map<string, ParsedSQLStatement>();
    public tableAndViewStatementMap = new Map<string, ParsedSQLStatement>();
    public indexStatements: ParsedSQLStatement[] = [];
    public otherStatements: ParsedSQLStatement[] = [];
    
    constructor(config: NAORMConfig) {
        config.statementOverrides.forEach(o => this.allStatementOverrides.set(o.statementIdentifier, o));
    }
    
    private ensureUniqueStatementId(stmtId: string, stmtPath: string) {
        const existingStatement = this.allStatementsByStatementId.get(stmtId);
        if(existingStatement) {
            const conflictingPath = existingStatement.fullFilePath;
            throw new Error('Duplicate Identifier' + stmtId + ' found in files: ' + conflictingPath + ' and ' + stmtPath);
        }
    }

    private sortStatement(s: ParsedSQLStatement) {
        const statementOverride = this.allStatementOverrides.get(s.statementIdentifier);
        if(statementOverride) { 
            s.skipStatementCompilation = statementOverride.skipStatementCompilation; 
        } 
        
        if(s.skipStatementCompilation) {
            this.otherStatements.push(s);
        } else {
            switch(s.statementType) {
            case 'table':
            case 'view':
                this.tableAndViewStatementMap.set(s.statementIdentifier, s);
                break;
            case 'index':
                this.indexStatements.push(s);
                break;
            case 'dml':
            case 'other':
                this.otherStatements.push(s);
                break;
            }
        }
    }

    getFileIdentifier(fileName: string) {
        const fileNameBase = camelCase(basename(fileName, '.sql'));
        const sameFileNameCount: number = this.fileBaseNameCounts.get(fileNameBase) || 0;
        if(sameFileNameCount === 0) {
            this.fileBaseNameCounts.set(fileNameBase, 1);
        } else {
            this.fileBaseNameCounts.set(fileNameBase, sameFileNameCount + 1);
        }
        const fileIdentifier = fileNameBase + (sameFileNameCount ? ('_' + sameFileNameCount) : '');
        return fileIdentifier;
    }

    addSQLFile(parsedFile: ParsedSQLFile) {
        this.allParsedFilesByFileId.set(parsedFile.fileIdentifier, parsedFile);
        parsedFile.sqlStatements.forEach(s => {
            this.ensureUniqueStatementId(s.statementIdentifier, s.fullFilePath);
            this.allStatementsByStatementId.set(s.statementIdentifier, s);
            this.sortStatement(s);
        });
    }
    
}