import { LexerToken } from "../../interfaces/parsed-sql-file.js";

interface ColumnComments {
    jsDocComment: string | null,
    naormTypeComment: string | null
}

export class SQLColumnCommentParser {

    private pos = 0;
    private tokenCount = 0;

    private resultComments = new Map<string, ColumnComments>();

    constructor(private statementTokens: LexerToken[], 
        private statementJSDoc: string,
        private columnNames: Set<string>
    ) {
        this.tokenCount = statementTokens.length;
        this.pos = statementTokens.length - 1;
    }

    private addResult(columnName: string, commentType: keyof ColumnComments, value: string) {
        const existingResult = this.resultComments.get(columnName);
        if(existingResult) {
            existingResult[commentType] = value;
            this.resultComments.set(columnName, existingResult);
        } else {
            const newResult: ColumnComments = {
                jsDocComment: null,
                naormTypeComment: null
            };
            newResult[commentType] = value;
            this.resultComments.set(columnName, newResult);
        }
    }

    private processIdentifier(t: LexerToken) {
        let startPos = this.pos - 1;
        const colName = t.normalizedValue;

        if(this.columnNames.has(colName)) {
            let parenthesesStack = 0;
            while(startPos >= 0) {
                const precedingToken = this.statementTokens[startPos];
                if(parenthesesStack === 0 && precedingToken.type === 'operator' && precedingToken.rawValue === ',') {
                    // If we encounter a comma, then we've reached the previous column in the expression list
                    this.pos = startPos - 1;
                    break;
                }
                // But we don't want to count commas within parentheses, so keep track of them
                if(precedingToken.type === 'operator' && precedingToken.rawValue === ')') {
                    parenthesesStack++;
                }
                if(precedingToken.type === 'operator' && precedingToken.rawValue === '(') {
                    parenthesesStack--;
                }
                // A NAORM-TYPE comment might be nested within this area that we are searching
                if(precedingToken.type === 'cComment') {
                    this.processComment(precedingToken, startPos);
                }
                // Make sure we haven't gone too far and grabbed the JSDoc comment at the beginning of the statement
                if(precedingToken.type === 'jsDocComment' && precedingToken.rawValue !== this.statementJSDoc) {
                    this.addResult(colName, 'jsDocComment', precedingToken.rawValue);
                    this.pos = startPos - 1;
                    break;
                }
                startPos--;
            }
        }
    }

    private processComment(t: LexerToken, pos: number) {
        if(t.rawValue.toUpperCase().includes('NAORM-TYPE:')) {
            if(pos > 0) {
                let identifierPrecedingComment: LexerToken = this.statementTokens[pos - 1];
                if(identifierPrecedingComment.type === 'whitespace' && pos > 1) {
                    identifierPrecedingComment = this.statementTokens[pos - 2];
                }
                if(identifierPrecedingComment.type === 'identifier' 
                    || identifierPrecedingComment.type === 'quotedIdentifier') {
                    const colName = identifierPrecedingComment.normalizedValue;
                    if(this.columnNames.has(colName)) {
                        this.addResult(colName, 'naormTypeComment', t.rawValue);
                    }
                }
            } 
        }
    }

    private getNextColumnComments() {
        const t: LexerToken = this.statementTokens[this.pos];

        if(t.type === 'cComment') {
            this.processComment(t, this.pos);
        }

        if(t.type === 'identifier' || t.type === 'quotedIdentifier') {
            this.processIdentifier(t);
        }

        this.pos--;
    }

    
    public parse() {
        this.pos = this.tokenCount - 1;
        // For finding comments, we parse right-to-left
        while(this.pos >= 0) {
            this.getNextColumnComments();
        }

        return this.resultComments;
    }
    
    public getColumnResult(columnName: string, commentType: keyof ColumnComments): string | null {
        const columnResult = this.resultComments.get(columnName.toUpperCase());
        return columnResult?.[commentType] || null;
    }
}