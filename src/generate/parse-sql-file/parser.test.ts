import { LexerToken, ParsedSQLFile, ParsedSQLStatement } from "../../interfaces/parsed-sql-file";
import { Lexer } from "./lexer";
import { Parser } from "./parser";

// These can be reused for all Parser tests
const [ fileName, fullFilePath, fileIdentifier ] = ['my-file.sql', 'my-dir/my-file.sql', 'myFile'];

function blankExpectedParsedSQLStatement(statement: string, tokens: LexerToken[]) {
    return {
        fileName,
        fullFilePath,
        fileIdentifier,
        statement: statement,
        statementTokens: tokens,
        skipStatementCompilation: false,
        statementDependencies: [],
        resultColumns: []
    };
}

test('Parser SELECT', () => {
    const statement = `SELECT * FROM myTable;`;
    const tokens: LexerToken[] = new Lexer(statement).lex();

    const possibleStatementDependenciesArray: string[] = ['MYTABLE'];
    const expectedParserOutput: ParsedSQLStatement[] = [{
        ...blankExpectedParsedSQLStatement(statement, tokens),
        preStatementJSDoc: '',
        preStatementFullComment: '',
        statementCategory: 'dml',
        statementType: 'dml',
        statementIdentifier: fileIdentifier,
        rawStatementIdentifier: '',
        possibleStatementDependencies: new Set<string>(possibleStatementDependenciesArray),
        possibleStatementDependenciesArray
    }];
    const parsedFile = new Parser(tokens, fileName, fullFilePath, fileIdentifier).parse();
    expect(parsedFile).toEqual(expectedParserOutput);
});

