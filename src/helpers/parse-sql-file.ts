import { splitQuery, sqliteSplitterOptions } from "dbgate-query-splitter";
import { SplitResultItemRich } from 'dbgate-query-splitter/lib/splitQuery';
import { readFileSync } from 'fs';
import { basename } from 'path';
import { ParsedSQLFile, ParsedSQLStatement } from '../interfaces/parsed-sql-file';

export function parseSQLFile(filePath: string, fileIdentifier: string): ParsedSQLFile {
    const fileContents = readFileSync(filePath).toString();
    let parsedSQLFile: ParsedSQLFile = {
        fileName: basename(filePath),
        fullFilePath: filePath,
        fileIdentifier: fileIdentifier,
        contents: fileContents,
        sqlStatements: [],
        eofComment: ''
    }
    parsedSQLFile.sqlStatements = splitSQLFileIntoStatements(parsedSQLFile);
    if(parsedSQLFile.sqlStatements.length) {
        const lastStatement = parsedSQLFile.sqlStatements[parsedSQLFile.sqlStatements.length - 1];
        parsedSQLFile.eofComment = fileContents.slice(lastStatement.splitResultItem.trimEnd?.position);
    } else {
        console.log('Ignoring file containing no SQL statements at:', filePath)
    }
    return parsedSQLFile;
}

function splitSQLFileIntoStatements(parsedSQLFile: ParsedSQLFile): ParsedSQLStatement[] {
    const options = {
        ...sqliteSplitterOptions, 
        ignoreComments: true,
        returnRichInfo: true 
    };
    const statements = splitQuery(parsedSQLFile.contents, options);
    return statements.map((s, i) => parseSQLStatement(parsedSQLFile, s as SplitResultItemRich, i))
}

function parseSQLStatement(parsedSQLFile: ParsedSQLFile, splitResultItem: SplitResultItemRich, index: number): ParsedSQLStatement {
    const preStatementFullComment = parsedSQLFile.contents.slice(splitResultItem.start.position, splitResultItem.trimStart?.position);
    const preStatementJSDoc = getPreStatementJSDoc(preStatementFullComment);
    const preStatementComment = preStatementJSDoc 
        ? preStatementFullComment.replace(preStatementJSDoc, '') 
        : preStatementFullComment;
    const overrideIdentifier = preStatementFullComment.match(/NAORM-ID:\s+(\S+?)\s+/i)?.[1];
    const fallbackIdentifier = parsedSQLFile.fileIdentifier + (index ? '_' + index : '');
    const statementTypeResult = determineStatementType(splitResultItem.text, overrideIdentifier || fallbackIdentifier);
    const parsedSQLStatement: ParsedSQLStatement = {
        fileName: parsedSQLFile.fileName,
        fullFilePath: parsedSQLFile.fullFilePath,
        splitResultItem: splitResultItem,
        preStatementJSDoc: preStatementJSDoc,
        preStatementComment: preStatementComment,
        statement: splitResultItem.text,
        ...statementTypeResult,
        skipStatementCompilation: statementTypeResult.statementType === 'other',
        statementDependencies: [],
        resultColumns: []
    }

    return parsedSQLStatement;
}

function getPreStatementJSDoc(preStatementFullComment: string): string | null {
    const jsDocMatches = preStatementFullComment.match(/\/\*\*.+?\*\//gs);
    if(jsDocMatches && jsDocMatches.length) {
        return jsDocMatches[jsDocMatches.length - 1];
    }
    return null;
}

function determineStatementType(statementText: string, fallbackIdentifier: string): {
    statementType: 'table' | 'view' | 'index' | 'dml' | 'other',
    statementIdentifier: string,
} {
    // TODO: These aren't sophisticated enough to handle quoted identifiers or attached databases
    // TODO: Also, there are some edge cases at the end, such as no space before parantheses, no space between " and AS, etc. 
    if(statementText.slice(0, 6).toUpperCase() === 'CREATE') {
        const tableMatches = statementText.match(/^CREATE\s+(?:TEMP\s+)?(?:TEMPORARY\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(.+?)(?:\s|\()/i);
        if(tableMatches) { 
            return {
                statementType: 'table',
                statementIdentifier: tableMatches[1]
            }
        }
        
        const viewMatches = statementText.match(/^CREATE\s+(?:TEMP\s+)?(?:TEMPORARY\s+)?VIEW\s+(?:IF\s+NOT\s+EXISTS\s+)?(.+?)(?:\s|\()/i);
        if(viewMatches) { 
            return {
                statementType: 'view',
                statementIdentifier: viewMatches[1]
            } 
        }

        const indexMatches = statementText.match(/^CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?(.+?)(?:\sON)/i);
        if(indexMatches) {
            return {
                statementType: 'index',
                statementIdentifier: indexMatches[1]
            } 
        }
    }

    const dmlStartKeywords = ['SELECT', 'UPDATE', 'INSERT', 'REPLACE', 'DELETE', 'WITH'];
    const isDML = dmlStartKeywords.some(k => statementText.toUpperCase().startsWith(k));
    if(isDML) { 
        return {
            statementType: 'dml',
            statementIdentifier: fallbackIdentifier
        } 
    }

    return {
        statementType: 'other',
        statementIdentifier: fallbackIdentifier
    };
}