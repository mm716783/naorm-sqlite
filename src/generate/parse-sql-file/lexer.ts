import { LexerToken } from "../../interfaces/parsed-sql-file.js";
import { SQLITE_KEYWORDS } from "./sqlite-keywords.js";

export class Lexer {

    private pos = 0;
    private input = '';
    private inputLength = 0;
    private tokens: LexerToken[] = [];

    constructor(sqlString: string) {
        this.input = sqlString.trim();
        this.inputLength = this.input.length;
    }

    private getNextToken() {
        const c = this.input.charAt(this.pos);

        // Special separator characters
        if(c === ';') {
            this.processOperator(c, 'semicolon');
        }
        else if(c === '.') {
            this.processOperator(c, 'dot');
        }

        // Comments
        else if(c === '/') {
            this.processForwardSlash(c);
        }
        else if(c === '-') {
            this.processDash(c);
        }

        // Quoted Identifier
        else if(c === "'" || c === '"' || c === '`' || c === '[') {
            this.processQuote(c);
        }

        // Identifiers and Keywords
        else if(this.isValidIdStartChar(c)) {
            this.processIdChar();
        }

        // Other SQL Operators
        else {
            this.processOperator(c);
        }
    }

    private isValidIdStartChar(c: string) {
        return (c >= 'a' && c <= 'z') ||
            (c >= 'A' && c <= 'Z') ||
            c === '_';
    }

    private isValidIdChar(c: string) {
        return (c >= 'a' && c <= 'z') ||
            (c >= 'A' && c <= 'Z') ||
            (c >= '0' && c <= '9') ||
            c === '_' || c === '$';
    }


    private processIdChar() {
        let endpos = this.pos + 1;
        while (endpos < this.inputLength &&
            this.isValidIdChar(this.input.charAt(endpos))) {
            endpos++;
        }
      
        const rawValue = this.input.substring(this.pos, endpos);
        const normalizedValue = rawValue.toUpperCase();
        const type = normalizedValue === 'AS' ? 'as' 
            : SQLITE_KEYWORDS.has(normalizedValue) ? 'keyword' : 'identifier';
        const token: LexerToken = { type, rawValue, normalizedValue };
        this.pos = endpos;
        this.tokens.push(token);
    }

    private processForwardSlash(c: string) {
        if(this.input.length > this.pos + 2 && this.input.charAt(this.pos + 1) === '*') {
            let commentType: 'cComment' | 'jsDocComment' = 'cComment';
            if(this.input.charAt(this.pos + 2) === '*') {
                commentType = 'jsDocComment';
            }

            let endpos = this.pos + 2;
            while (endpos < this.inputLength 
                &&  !(this.input.charAt(endpos) === '*'
                &&  this.input.charAt(endpos + 1) === '/')
            ) {
                endpos++;
            }
            endpos = endpos + 2;

            const value = this.input.substring(this.pos, endpos);
            const token: LexerToken = {
                type: commentType,
                rawValue: value,
                normalizedValue: value
            };
            this.pos = endpos;
            this.tokens.push(token);
        } else {
            this.processOperator(c);
        } 
    }

    private processDash(c: string) {
        if(this.input.length > this.pos + 1 && this.input.charAt(this.pos + 1) === '-') {
            let endpos = this.pos + 2;
            while (endpos < this.inputLength && this.input.charAt(endpos) !== '\n') {
                endpos++;
            }
            const value = this.input.substring(this.pos, endpos);
            const token: LexerToken = {
                type: 'dashComment',
                rawValue: value,
                normalizedValue: value
            };
            this.pos = endpos;
            this.tokens.push(token);
        } else {
            this.processOperator(c);
        } 
    }
    
    private processSingleQuoteRecursive(endpos: number): number {
        while (endpos < this.inputLength 
            && this.input.charAt(endpos) !== "'") {
            endpos++;
        }
        if(endpos < this.inputLength + 1 && this.input.charAt(endpos + 1) === "'") {
            return this.processSingleQuoteRecursive(endpos + 2);
        }
        return endpos;
    }

    private processQuote(c: string) {
        let endpos = this.pos + 1;
        const endQuote = c === '[' ? ']' : c;
        if(c === "'") {
            endpos = this.processSingleQuoteRecursive(endpos);
        } else {
            while (endpos < this.inputLength && this.input.charAt(endpos) !== endQuote) {
                endpos++;
            }
        }
        endpos++;

        const rawValue = this.input.substring(this.pos, endpos);
        let normalizedValue = rawValue.substring(1, rawValue.length - 1).toUpperCase();
        if(c === "'") {
            normalizedValue = normalizedValue.replace(/''/g, "'");
        }

        const token: LexerToken = {
            type: 'quotedIdentifier',
            rawValue,
            normalizedValue
        };
        this.pos = endpos;
        this.tokens.push(token);
    }

    private processOperator(c: string, overrideType?: 'semicolon' | 'dot') {
        this.tokens.push({
            type: overrideType || 'operator',
            rawValue: c,
            normalizedValue: c
        });
        this.pos++;
    }

    private skipWhiteSpace() {
        let ws = '';
        while (this.pos < this.inputLength) {
            const c = this.input.charAt(this.pos);
            if (c == ' ' || c == '\t' || c == '\r' || c == '\n' || c == '\f') {
                ws += c;
                this.pos++;
            } else {
                break;
            }
        }
        if(ws.length) {
            this.tokens.push({
                type: 'whitespace',
                rawValue: ws,
                normalizedValue: ''
            });
        } 
    }

    public lex() {
        this.pos = 0;

        while(this.pos < this.inputLength) {
            this.skipWhiteSpace();
            this.getNextToken();
        }
        return this.tokens;
    }
}