export interface NAORMConfig {
    dbName: string,
    dbDir?: string,
    outDir: string,
    include: string[],
    exclude: string[],
    barrelExportExtension: string;
    conventionSets: NAORMConventionSet[];
    statementOverrides: NAORMStatementOverride[];
}

export interface NAORMConventionSet {
    name: string;
    typescriptConstruct: 'class' | 'interface';
    extends: string | null;
    importStatements: string[];
    typeConventions: NAORMTypeConvention[];
}

export interface NAORMTypeConvention {
    sqliteDeclaredType: string;
    typescriptGeneratedType: string;
}


export interface NAORMStatementOverride {
    statementIdentifier: string;
    skipStatementCompilation: boolean;
    dependentOn: string[];
    notDependentOn: string[];
}