import { readFileSync } from 'fs';
import { basename } from 'path';
import { ParsedSQLFile } from '../interfaces/parsed-sql-file';
import { Lexer } from './lexer';
import { Parser } from './parser';

export function parseSQLFile(fullFilePath: string, fileIdentifier: string): ParsedSQLFile {
    const contents = readFileSync(fullFilePath).toString();
    const fileName = basename(fullFilePath);    
    const fileTokens = new Lexer(contents).lex();
    const sqlStatements = new Parser(fileTokens, fileName, fullFilePath, fileIdentifier).parse();

    let parsedSQLFile: ParsedSQLFile = {
        fileName,
        fullFilePath,
        fileIdentifier,
        contents,
        sqlStatements
    }
    return parsedSQLFile;
}