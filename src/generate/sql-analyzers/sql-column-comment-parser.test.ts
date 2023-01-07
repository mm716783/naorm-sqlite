import { Lexer } from "../parse-sql-file/lexer";
import { SQLColumnCommentParser } from "./sql-column-comment-parser";

test('Column Comment Parser CREATE TABLE', () => {
    const lexerInput: string = `
    /** JSDoc Statement */
    CREATE TABLE Airport (
        /** JSDoc Id */
        Id INT,
        /** JSDoc IATACode */
        IATACode /* NAORM-Type: TEXT NOT NULL */ UNIQUE CHECK(LENGTH(IATACode) = 3),
        "Country" /* NAORM-Type: TEXT */ NOT NULL 
    )`;
    const tokens = new Lexer(lexerInput).lex();
    const columnNames = new Set<string>(['ID','IATACODE','COUNTRY']);
    const expectedResult = {
        'ID': { jsDocComment: '/** JSDoc Id */', naormTypeComment: null },
        'IATACODE': {
            jsDocComment: '/** JSDoc IATACode */',
            naormTypeComment: '/* NAORM-Type: TEXT NOT NULL */'
        },
        'COUNTRY': { jsDocComment: null, naormTypeComment: '/* NAORM-Type: TEXT */' }
    }
    const result = new SQLColumnCommentParser(tokens, '', columnNames).parse();
    const resultObj = Object.fromEntries(result);
    expect(resultObj).toEqual(expectedResult);
});


test('Column Comment Parser SELECT', () => {
    const lexerInput: string = `
    /** JSDoc Statement */
    SELECT 
        A."Id", B.*, 
        /** JSDoc C */
        add(1, 3) AS C /* NAORM-Type: INT NOT NULL */
    FROM A JOIN B`;
    const tokens = new Lexer(lexerInput).lex();
    const columnNames = new Set<string>(['ID','BCOL1','BCOL2','C']);
    const expectedResult = {
        'C': {
            jsDocComment: '/** JSDoc C */',
            naormTypeComment: '/* NAORM-Type: INT NOT NULL */'
        }
    }
    const result = new SQLColumnCommentParser(tokens, '/** JSDoc Statement */', columnNames).parse();
    const resultObj = Object.fromEntries(result);
    expect(resultObj).toEqual(expectedResult);
})


