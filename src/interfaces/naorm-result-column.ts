export interface NAORMResultColumn {
    columnName: string;
    sourceColumn: string | null;
    sourceTable: string | null;
    sourceDatabase: string | null;
    declaredType: string | null;
    jsDocComment: string | null;
    naormTypeComment: string | null;
    isExplicitlyNotNull: boolean;
    computedTypeByConventionSet: { 
        [key: string]: string 
    };
}