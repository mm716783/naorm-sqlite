import { Lexer } from "../parse-sql-file/lexer.js";
import { SQLColumnCommentParser } from "./sql-column-comment-parser.js";

test('Column Comment Parser CREATE TABLE', () => {
    const lexerInput = `
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
    };
    const parser = new SQLColumnCommentParser(tokens, '', columnNames);
    const result = parser.parse();
    const resultObj = Object.fromEntries(result);    
    expect(resultObj).toEqual(expectedResult);
    expect(parser.getColumnResult('Id', 'jsDocComment')).toEqual(expectedResult.ID.jsDocComment);
    expect(parser.getColumnResult('Id', 'naormTypeComment')).toEqual(expectedResult.ID.naormTypeComment);
    expect(parser.getColumnResult('IATACode', 'jsDocComment')).toEqual(expectedResult.IATACODE.jsDocComment);
    expect(parser.getColumnResult('IATACode', 'naormTypeComment')).toEqual(expectedResult.IATACODE.naormTypeComment);
    expect(parser.getColumnResult('Country', 'jsDocComment')).toEqual(expectedResult.COUNTRY.jsDocComment);
    expect(parser.getColumnResult('Country', 'naormTypeComment')).toEqual(expectedResult.COUNTRY.naormTypeComment);
});


test('Column Comment Parser SELECT', () => {
    const lexerInput = `
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
    };
    const parser = new SQLColumnCommentParser(tokens, '/** JSDoc Statement */', columnNames);
    const result = parser.parse();
    const resultObj = Object.fromEntries(result);
    expect(resultObj).toEqual(expectedResult);
    expect(parser.getColumnResult('C', 'jsDocComment')).toEqual(expectedResult.C.jsDocComment);
    expect(parser.getColumnResult('C', 'naormTypeComment')).toEqual(expectedResult.C.naormTypeComment);
    expect(parser.getColumnResult('Id', 'jsDocComment')).toEqual(null);
    expect(parser.getColumnResult('Id', 'naormTypeComment')).toEqual(null);
});
