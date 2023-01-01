export interface NAORMResultColumn {
    columnName: string;
    sourceColumn: string | null;
    sourceTable: string | null;
    sourceDatabase: string | null;
    declaredType: string | null;
    naormTypeComment: string | null;
    typeScriptTypeAnnotation: string | null;
    jsDocComment: string | null;
}