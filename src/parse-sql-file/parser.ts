import { LexerToken, ParsedSQLStatement } from "../interfaces/parsed-sql-file";

export class Parser {

    private fileStatements: ParsedSQLStatement[] = [];
    private unidentifiedStatementIndex: number = 0;
    private tokenCount: number = 0;
    private pos: number = 0;

    private preStatementJSDoc: string = '';
    private preStatementFullComment: string = '';
    private statement: string = '';
    private statementCategory: 'create' | 'dml' | 'other' | null = null;
    private statementType: 'table' | 'view' | 'index' | 'dml' | 'other' | null = null;
    private statementIdentifier: string = '';
    private rawStatementIdentifier: string = '';
    private possibleStatementDependencies: Set<string> = new Set<string>();
    private possibleStatementDependenciesArray: string[] = [];
    private lastTokenEndPos: number = 0;
    private isStatementCommentOnly: boolean = true;

    constructor(private tokens: LexerToken[], 
        private fileName: string, 
        private fullFilePath: string, 
        private fileIdentifier: string) {
            this.tokenCount = tokens.length;
        }

    private processToken() {
        const t = this.tokens[this.pos];
        this.statement += t.rawValue;
        
        // If we encounter any identifiers, put them into the possible statement dependencies 
        if(t.type === 'identifier' || t.type === 'quotedIdentifier') {
            // These will be used later to see which statements depend on each other
            this.possibleStatementDependencies.add(t.normalizedValue);   
            this.possibleStatementDependenciesArray.push(t.normalizedValue);     
        }

        // If it's the end of the statement, then process it and reset the state
        if(t.type === 'semicolon' || this.pos === this.tokens.length - 1) {
            this.newStatement();
            this.resetNextStatement();
        } 

        // If we haven't determined the statement category yet
        else if(!this.statementCategory) {
            // Add any comments found before the statement starts to the string of pre-statement comments
            if(t.type === 'whitespace' || t.type === 'cComment' || t.type === 'dashComment' || t.type === 'jsDocComment') {
                this.preStatementFullComment += `\n${t.rawValue}`;
                if(t.type === 'jsDocComment') {
                    // Just like in JSDoc, we only consider the latest comment
                    this.preStatementJSDoc = t.rawValue;
                }
            } 
            
            // Determine the statement category by looking at the first keyword in the statement
            else if(t.type === 'keyword') {
                this.isStatementCommentOnly = false;
                switch(t.normalizedValue) {
                    case 'CREATE':
                        this.statementCategory = 'create';
                        break;
                    case 'WITH':
                    case 'SELECT':
                    case 'INSERT':
                    case 'REPLACE':
                    case 'UPDATE':
                    case 'DELETE':
                        this.statementCategory = 'dml';
                        this.statementType = 'dml';
                        break;
                    default:
                        this.statementCategory = 'other';
                        this.statementType = 'other';
                        break;
                }
            } else {
                this.isStatementCommentOnly = false;
            }
        }

        // If we haven't determined the statement type yet
        else if(this.statementCategory === 'create' && !this.statementType) {
            if(t.type === 'keyword') {
                // Then stop when we find the keyword telling us what type of statement it is
                switch(t.normalizedValue) {
                    case 'TABLE':
                        this.statementType = 'table';
                        break;
                    case 'VIEW':
                        this.statementType = 'view';
                        break;
                    case 'INDEX':
                        this.statementType = 'index';
                        break;
                    case 'VIRTUAL':
                    case 'TRIGGER':
                        // For now, we treat Virtual Tables and Triggers as "Other" statements
                        this.statementCategory = 'other';
                        this.statementType = 'other';
                        break;
                }
            }
        } 
        
        // If we know it's a CREATE statement and we know the type
        else if(this.statementCategory === 'create' && this.statementType  && !this.statementIdentifier) {
            // Then the next identifier is the statement identifier
            // e.g. CREATE TABLE (IF NOT EXISTS) <statement-identifier>
            if(t.type === 'identifier' || t.type === 'quotedIdentifier') {
                // UNLESS it is a fully qualified identifier using the schema name
                if(this.tokens.length <= this.pos + 1) {
                    throw new Error('Unexpected end of SQL Input, could not identify statement');
                }
                const nextToken = this.tokens[this.pos + 1];
                // Which would be apparent if the next token is a dot
                if(nextToken?.type !== 'dot') {
                    this.statementIdentifier = t.normalizedValue;
                    this.rawStatementIdentifier = t.rawValue;
                }
            }
        }

        this.pos++;
    }

    private resetNextStatement() {
        this.preStatementJSDoc = '';
        this.preStatementFullComment = '';
        this.statement = '';
        this.statementCategory = null;
        this.statementType = null;
        this.statementIdentifier = '';
        this.rawStatementIdentifier = '';
        this.possibleStatementDependencies = new Set<string>();
        this.possibleStatementDependenciesArray = [];
        this.lastTokenEndPos = this.pos;
        this.isStatementCommentOnly = true;
    }

    private getStatementIdentifier() {
        // If the statement has a natural SQL identifier, like a CREATE statement, then use that
        if(this.statementIdentifier) {
            return this.statementIdentifier;
        }
        // If the user has specified a NAORM-ID comment, then use that
        else {
            const match = this.preStatementFullComment.match(/NAORM-ID:\s*(.+?)\s/i);
            if(match) {
                return match[0];
            } else {
                // Otherwise use the file identifier, and append an index if needed
                let identifier = this.fileIdentifier;
                if(this.unidentifiedStatementIndex > 0) {
                    identifier += `_${this.unidentifiedStatementIndex}`;
                }
                this.unidentifiedStatementIndex++;
                return identifier;
            }
        }
    }
        
    private newStatement() {
        const statementTokens = this.tokens.slice(this.lastTokenEndPos, this.pos + 1);
        // If there are comments but no other tokens
        if(this.isStatementCommentOnly) {
            // Then this is a comment at the end of the file or an extra semicolon, do nothing
            // this.eofComment = this.tokens.map(t => t.rawValue).join('\n');
            return;
        }

        // Else if the statement category or statement type could not be found
        if(!this.statementCategory || !this.statementType) {
            // Then there is some invalid SQL where we couldn't identify the type of statement
            throw new Error('Unexpected end of SQL Input, could not identify statement type for statement: ' + statementTokens.map(t => t.rawValue).join(''));
        }

        // Else if the statement identifier could not be found for a CREATE statement
        if(this.statementCategory === 'create' && !this.statementIdentifier) {
            // Then there is some invalid SQL where we couldn't find the statement identifier
            throw new Error(`Unexpected end of SQL Input, could not find statement identifier for ${this.statementCategory} ${this.statementType} statement`);   
        }
        
        // Otherwise, we have valid SQL input, so push  it into the array of statements
        const statement: ParsedSQLStatement = {
            fileName: this.fileName,
            fullFilePath: this.fullFilePath,
            fileIdentifier: this.fileIdentifier,
            preStatementJSDoc: this.preStatementJSDoc,
            preStatementFullComment: this.preStatementFullComment,
            statement: this.statement,
            statementTokens: statementTokens,
            statementCategory: this.statementCategory,
            statementType: this.statementType,
            statementIdentifier: this.getStatementIdentifier(),
            rawStatementIdentifier: this.rawStatementIdentifier,
            possibleStatementDependencies: this.possibleStatementDependencies,
            possibleStatementDependenciesArray: this.possibleStatementDependenciesArray,
            skipStatementCompilation: false,
            statementDependencies: [],
            resultColumns: []
        };
        this.fileStatements.push(statement);
    }

    public parse() {
        this.pos = 0;
        while(this.pos < this.tokenCount) {
            this.processToken();
        }

        return this.fileStatements;
    }

}
