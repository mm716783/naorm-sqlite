import { LexerToken } from "../../interfaces/parsed-sql-file";
import { Lexer } from "./lexer";

test('Lexer SELECT', () => {
    const lexerInput = 'SELECT * FROM myTable;';
    const expectedTokens: LexerToken[] = [
        { type: 'keyword', rawValue: 'SELECT', normalizedValue: 'SELECT' },
        { type: 'whitespace', rawValue: ' ', normalizedValue: '' },
        { type: 'operator', rawValue: '*', normalizedValue: '*' },
        { type: 'whitespace', rawValue: ' ', normalizedValue: '' },
        { type: 'keyword', rawValue: 'FROM', normalizedValue: 'FROM' },
        { type: 'whitespace', rawValue: ' ', normalizedValue: '' },
        { type: 'identifier', rawValue: 'myTable', normalizedValue: 'MYTABLE' },
        { type: 'semicolon', rawValue: ';', normalizedValue: ';' }
    ];
    const tokens = new Lexer(lexerInput).lex();
    expect(tokens).toEqual(expectedTokens);
});


test('Lexer multiple statements', () => {
    const lexerInput = 'SELECT * FROM myTable; delete FROM myTable;';
    const tokens = new Lexer(lexerInput).lex();
    const semicolonTokens = tokens.filter(t => t.type === 'semicolon');
    expect(semicolonTokens.length).toEqual(2);
});

test('Lexer JSDoc', () => {
    const lexerInput = '/** JSDoc*/SELECT * FROM myTable;';
    const tokens = new Lexer(lexerInput).lex();
    expect(tokens[0].type).toEqual('jsDocComment');
});


test('Lexer Operator Slash', () => {
    const lexerInput = 'SELECT a / b FROM myTable;';
    const tokens = new Lexer(lexerInput).lex();
    const operatorTokens = tokens.filter(t => t.type === 'operator');
    expect(operatorTokens.length).toEqual(1);
    expect(operatorTokens[0].normalizedValue).toEqual('/');
});

test('Lexer Operator Minus ', () => {
    const lexerInput = 'SELECT a - b FROM myTable;';
    const tokens = new Lexer(lexerInput).lex();
    const operatorTokens = tokens.filter(t => t.type === 'operator');
    expect(operatorTokens.length).toEqual(1);
    expect(operatorTokens[0].normalizedValue).toEqual('-');
});


test('Lexer Dash Comment', () => {
    const lexerInput = 'SELECT a FROM myTable --comment ;';
    const tokens = new Lexer(lexerInput).lex();
    const operatorTokens = tokens.filter(t => t.type === 'operator');
    const semicolonTokens = tokens.filter(t => t.type === 'semicolon');
    const lastToken = tokens[tokens.length - 1];
    expect(operatorTokens.length).toEqual(0);
    expect(semicolonTokens.length).toEqual(0);
    expect(lastToken.type).toEqual('dashComment');
});


test('Lexer Dot', () => {
    const lexerInput = 'CREATE INDEX main.X ON T(Id)';
    const tokens = new Lexer(lexerInput).lex();
    const dotIndex = tokens.findIndex(t => t.type === 'dot');
    const dotTokens = tokens.filter(t => t.type === 'dot');
    const preDot = tokens[dotIndex - 1];
    const postDot = tokens[dotIndex + 1];
    expect(dotTokens.length).toEqual(1);
    expect(preDot.normalizedValue).toEqual('MAIN');
    expect(postDot.normalizedValue).toEqual('X');
});

test('Lexer AS', () => {
    const lexerInput = 'SELECT a AS B FROM myTable;';
    const tokens = new Lexer(lexerInput).lex();
    const asTokens = tokens.filter(t => t.type === 'as');
    expect(asTokens.length).toEqual(1);
});



test('Lexer Bracket Identifier', () => {
    const lexerInput = 'SELECT a FROM [my+Table]';
    const tokens = new Lexer(lexerInput).lex();
    const operatorTokens = tokens.filter(t => t.type === 'operator');
    const quotedIdentifierToken = tokens.find(t => t.type === 'quotedIdentifier');
    expect(operatorTokens.length).toEqual(0);
    expect(quotedIdentifierToken?.rawValue).toEqual('[my+Table]');
    expect(quotedIdentifierToken?.normalizedValue).toEqual('MY+TABLE');
});

test('Lexer Double Quote Identifier', () => {
    const lexerInput = `SELECT a FROM "my'Table"`;
    const tokens = new Lexer(lexerInput).lex();
    const quotedIdentifierToken = tokens.find(t => t.type === 'quotedIdentifier');
    expect(quotedIdentifierToken?.rawValue).toEqual(`"my'Table"`);
    expect(quotedIdentifierToken?.normalizedValue).toEqual(`MY'TABLE`);
});


test('Lexer Backtick Identifier', () => {
    const lexerInput = 'SELECT a FROM `my;Table`';
    const tokens = new Lexer(lexerInput).lex();
    const semicolonTokens = tokens.filter(t => t.type === 'semicolon');
    const quotedIdentifierToken = tokens.find(t => t.type === 'quotedIdentifier');
    expect(semicolonTokens.length).toEqual(0);
    expect(quotedIdentifierToken?.rawValue).toEqual("`my;Table`");
    expect(quotedIdentifierToken?.normalizedValue).toEqual(`MY;TABLE`);
});


test('Lexer Single Quote Identifier Recursive', () => {
    const lexerInput = `SELECT a FROM '''my''Tab''le'''`;
    const tokens = new Lexer(lexerInput).lex();
    const quotedIdentifierToken = tokens.find(t => t.type === 'quotedIdentifier');
    expect(quotedIdentifierToken?.rawValue).toEqual(`'''my''Tab''le'''`);
    expect(quotedIdentifierToken?.normalizedValue).toEqual(`'MY'TAB'LE'`);
});
