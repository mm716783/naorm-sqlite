import { LexerToken } from "../interfaces/parsed-sql-file";
import { Lexer } from "./lexer";

test('Lexer SELECT', () => {
    const lexerInput: string = 'SELECT * FROM myTable;'
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
})

