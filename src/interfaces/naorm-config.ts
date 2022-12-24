export interface NAORMConfig {
    dbName: string,
    outDir: string,
    include: string[],
    exclude: string[],
    conventionSets: NAORMConventionSet[];
    statementOverrides: NAORMStatementOverride[];
}

export interface NAORMConventionSet {
    name: string;
    typescriptConstruct: 'class' | 'interface';
    extends: string;
    importStatements: string[];
    typeConventions: NAORMTypeConversion[];
}

export interface NAORMTypeConversion {
    sqliteDeclaredType: string;
    typescriptGeneratedType: string;
}


export interface NAORMStatementOverride {
    statementIdentifier: string;
    skipStatementCompilation: boolean;
    dependentOn: string[];
    notDependentOn: string[];
}