import { NAORMConfig } from "../interfaces/naorm-config";

export const DEFAULT_NAORM_CONFIG: NAORMConfig = {
    "dbName": "naorm-generated.db",
    "outDir": "naorm-generated",
    "include": ["**/*.sql"],
    "exclude": [],
    "barrelExportExtension": '.js',
    "conventionSets": [
        {
            "name": "Raw",
            "typescriptConstruct": "interface",
            "extends": null,
            "importStatements": [],
            "typeConventions": []
        },
        {
            "name": "Parsed",
            "typescriptConstruct": "interface",
            "extends": null,
            "importStatements": [],
            "typeConventions": [{
                "sqliteDeclaredType": "BOOLINT",
                "typescriptGeneratedType": "boolean"
            },{
                "sqliteDeclaredType": "NULLABLE_BOOLINT",
                "typescriptGeneratedType": "boolean | null"
            },{
                "sqliteDeclaredType": "DATE_TEXT",
                "typescriptGeneratedType": "Date"
            },{
                "sqliteDeclaredType": "DATETIME_TEXT",
                "typescriptGeneratedType": "Date"
            },{
                "sqliteDeclaredType": "NULLABLE_DATE_TEXT",
                "typescriptGeneratedType": "Date | null"
            },{
                "sqliteDeclaredType": "NULLABLE_DATETIME_TEXT",
                "typescriptGeneratedType": "Date | null"
            }]
        }
    ],
    "statementOverrides": []
};