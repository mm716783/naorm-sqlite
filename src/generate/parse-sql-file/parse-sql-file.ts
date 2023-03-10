import { readFileSync } from 'fs';
import { basename, sep, posix } from 'path';
import { ParsedSQLFile } from '../../interfaces/parsed-sql-file.js';
import { Lexer } from './lexer.js';
import { Parser } from './parser.js';

export function parseSQLFile(filePath: string, fileIdentifier: string): ParsedSQLFile {
    const contents = readFileSync(filePath).toString();
    const fullFilePath = filePath.split(sep).join(posix.sep);
    const fileName = basename(fullFilePath);    
    const fileTokens = new Lexer(contents).lex();
    const sqlStatements = new Parser(fileTokens, fileName, fullFilePath, fileIdentifier).parse();

    const parsedSQLFile: ParsedSQLFile = {
        fileName,
        fullFilePath,
        fileIdentifier,
        contents,
        sqlStatements
    };
    return parsedSQLFile;
}