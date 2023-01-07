# Not an ORM (NAORM) for SQLite

[![Coverage Status](https://coveralls.io/repos/github/mm716783/naorm-sqlite/badge.svg?branch=develop)](https://coveralls.io/github/mm716783/naorm-sqlite?branch=develop) [![Node.js CI](https://github.com/mm716783/naorm-sqlite/actions/workflows/node.js.yml/badge.svg)](https://github.com/mm716783/naorm-sqlite/actions/workflows/node.js.yml) [![MIT License](https://img.shields.io/apm/l/atomic-design-ui.svg?)](https://img.shields.io/github/license/mm716783/naorm-sqlite) ![npm (tag)](https://img.shields.io/npm/v/naorm-sqlite/latest)

A Command Line Interface for generating TypeScript from SQLite files in your code base.

Many [TypeScript](https://www.typescriptlang.org/) projects use [SQLite](https://www.sqlite.org/index.html), but maintaining SQL in a TypeScript code base is challenging and fraught with pitfalls. And while using an Object-Relational Mapping (ORM) tool can solve certain problems, it also comes with learning curves and limitations for SQL developers. Not an ORM (NAORM - pronounced "norm") allows SQLite projects to leverage the benefits of TypeScript with a SQL-first approach. 

### Key Features:

1. Develop [SQLite code](https://www.sqlite.org/lang.html) in SQL files, use it within TypeScript
2. Generate [TypeScript models](https://www.typescriptlang.org/docs/handbook/typescript-tooling-in-5-minutes.html#interfaces) for any SQL table, view, or query result
3. Write [JSDoc comments](https://jsdoc.app/about-getting-started.html#adding-documentation-comments-to-your-code) in SQL, see them in VS Code's [IntelliSense](https://code.visualstudio.com/docs/languages/typescript#_intellisense)
4. Accommodate dates, booleans, BigInts, JSON, and more with type safety

![Screen capture of a SQL view being edited in VS Code, with the corresponding TypeScript model updating automatically.](/img/NAORM.gif?raw=true "Develop SQLite in SQL Files, and NAORM will generate the appropriate TypeScript.")

### Contents:
* [Getting Started](#getting-started)
* [How it Works](#how-it-works)
* [SQL Dependency Analysis](#sql-dependency-analysis)
* [JSDoc Annotations](#jsdoc-annotations)
* [SQLite Nuances](#sqlite-nuances)
* [Custom Type Conventions](#custom-type-conventions)
* [Limitations](#limitations)


*For more on NOARM, check out the [author's blog](https://medium.com/@mm716783) on Medium.*

# Getting Started

Install the `naorm-sqlite` CLI
```
npm i -D naorm-sqlite
```

Run the Not an ORM initializer and follow the prompts to set up your configuration
```
npx naorm init
```

Generate your TypeScript
```
npx naorm generate
```

# How it Works

Not an ORM lets you develop all kinds of SQLite statements in SQL files, then use these statements in your TypeScript application. This allows you to leverage the ecosystem available for SQLite development, such as [alexcvzz's VS Code extension](https://marketplace.visualstudio.com/items?itemName=alexcvzz.vscode-sqlite) and the standalone tool [DB Browser for SQLite](https://sqlitebrowser.org/). No more maintaining SQL in JS/TS strings! And though it is "Not an ORM", it can generate TypeScript classes or interfaces for any SQLite table, view, or query result.

Not an ORM is generally compatible with most ways of using SQLite and TypeScript together, including within Node.js applications, hybrid web apps, and the browser. Behind the scenes, Not an ORM utilizes [`better-sqlite3`](https://www.npmjs.com/package/better-sqlite3). However, your application can use any SQLite plugin or library that you choose.

Not an ORM does not directly interact with your application's SQLite database, nor does it have any components for your application's runtime. Rather, Not an ORM uses `better-sqlite3` to maintain a copy of your database's schema in your development environment, which it then utilizes to generate TypeScript models and metadata that you can use in your project.

Not an ORM handles three main categories of SQLite statements:
* [`CREATE TABLE` and `CREATE VIEW` statements](#create-table-and-create-view-statements)
* [Data Manipulation Language (DML) statements](#data-manipulation-language-dml-statements) (e.g. `SELECT`, `INSERT`, etc.)  
* [All other SQLite statements](#all-other-sqlite-statements)

## `CREATE TABLE` and `CREATE VIEW` Statements

To generate TypeScript for a database table, add a SQL file containing a [`CREATE TABLE` statement](https://www.sqlite.org/lang_createtable.html) such as the one below to your database directory. 

```
CREATE TABLE Airport (
    Id INT,
    IATACode TEXT,
    Country TEXT
);
```

After running `npx naorm generate`, a TypeScript file will be generated with an interface representing the model of a record in the table, a constant array of column definitions, and a constant string containing the SQL statement from the source file. 
```
export interface Airport  {
	"Id": number | null;
	"IATACode": string | null;
    "Country": string | null;
}

export const AirportColumns = [
	{
        "columnName": "Id",
        "sourceColumn": "Id",
        "sourceTable": "Airport",
        "sourceDatabase": "main",
        "declaredType": "INT",
        "naormTypeComment": null,
        "typeScriptTypeAnnotation": "number | null",
        "jsDocComment": null
	},
	{
        "columnName": "IATACode",
        "sourceColumn": "IATACode",
        "sourceTable": "Airport",
        "sourceDatabase": "main",
        "declaredType": "TEXT",
        "naormTypeComment": null,
        "typeScriptTypeAnnotation": "string | null",
        "jsDocComment": null
	},
	{
        "columnName": "Country",
        "sourceColumn": "Country",
        "sourceTable": "Airport",
        "sourceDatabase": "main",
        "declaredType": "TEXT",
        "naormTypeComment": null,
        "typeScriptTypeAnnotation": "string | null",
        "jsDocComment": null
	}
]

export const AirportSQL = `CREATE TABLE Airport (
    Id INT,
    IATACode TEXT,
    Country TEXT
)`;
```

The same approach can be used for  [`CREATE TABLE....AS` statements](https://www.sqlite.org/lang_createtable.html#create_table_as_select_statements), and for [`CREATE VIEW` statements](https://www.sqlite.org/lang_createview.html) such as the one below. Note that tables created in [attached databases](https://www.sqlite.org/lang_attach.html), as well as all [`CREATE VIRTUAL TABLE` statements](https://www.sqlite.org/lang_createvtab.html), are not currently supported. See the [Limitations](#limitations) section for more details.


```
CREATE VIEW vwFlightOrigin AS
SELECT F.*, A.IATACode
FROM Flight AS F
JOIN Airport AS A
ON F.OriginAirportId = A.Id
```
After running `npx naorm generate`, a similar TypeScript file will be generated. 

```
export interface vwFlightOrigin  {
	"Id": number | null;
    "OriginAirportId": number | null;
    "DestinationAirportId": number | null;
	"IATACode": string | null;
}

export const vwFlightOriginColumns = [
	{
        "columnName": "Id",
        "sourceColumn": "Id",
        "sourceTable": "Flight",
        "sourceDatabase": "main",
        "declaredType": "INT",
        "naormTypeComment": null,
        "typeScriptTypeAnnotation": "number | null",
        "jsDocComment": null
	},
	{
        "columnName": "OriginAirportId",
        "sourceColumn": "OriginAirportId",
        "sourceTable": "Flight",
        "sourceDatabase": "main",
        "declaredType": "INT",
        "naormTypeComment": null,
        "typeScriptTypeAnnotation": "number | null",
        "jsDocComment": null
	},
	{
        "columnName": "DestinationAirportId",
        "sourceColumn": "DestinationAirportId",
        "sourceTable": "Flight",
        "sourceDatabase": "main",
        "declaredType": "INT",
        "naormTypeComment": null,
        "typeScriptTypeAnnotation": "number | null",
        "jsDocComment": null
	},
	{
        "columnName": "IATACode",
        "sourceColumn": "IATACode",
        "sourceTable": "Airport",
        "sourceDatabase": "main",
        "declaredType": "TEXT",
        "naormTypeComment": null,
        "typeScriptTypeAnnotation": "string | null",        
        "jsDocComment": null
	}
]

export const vwFlightOriginSQL = `CREATE VIEW vwFlightOrigin AS
SELECT F.*, A.IATACode
FROM Flight AS F
JOIN Airport AS A
ON F.OriginAirportId = A.Id`;
```

All columns from the table or view's resulting column set will be included in the generated interface and list of columns, even if the query uses `*` syntax instead of explicitly specifying column names. This is possible  because Not an ORM does not obtain column names or types by parsing your SQL statements. Instead,  Not an ORM uses `better-sqlite3` to execute your `CREATE` statement in an empty database, then obtains the column metadata from the updated database file. 

When creating tables and views, the order of execution is important, since certain tables and views depend on others. In the example above, the view `vwFlightOrigin` depends on the tables `Flight` and `Airport`. These tables, as well as the columns referenced, must be defined elsewhere in your database directory for the generation to succeed. To determine the order in which to execute the `CREATE` statements, Not an ORM analyzes your SQL files for dependencies. For more information on how this works, as well as the limitations to the process, see the [SQL Dependency Analysis](#sql-dependency-analysis) section.


## Data Manipulation Language (DML) statements 

In SQLite, the types of Data Manipulation Language (DML) statements are [`SELECT`](https://www.sqlite.org/lang_select.html), [`INSERT`](https://www.sqlite.org/lang_insert.html), [`REPLACE`](https://www.sqlite.org/lang_replace.html), [`UPDATE`](https://www.sqlite.org/lang_update.html), and [`DELETE`](https://www.sqlite.org/lang_delete.html). While a `SELECT` statement will [always return columns (though not necessarily rows)](https://www.sqlite.org/c3ref/column_count.html), the remaining statement types may or may not return columns, depending on whether or not the [`RETURNING`](https://www.sqlite.org/lang_returning.html) clause is utilized. 

Unlike `CREATE TABLE` and `CREATE VIEW` statements, DML statements in SQLite can contain [parameters](https://www.sqlite.org/lang_expr.html#varparam). Not an ORM does not need to know how the parameters will be used in order to calculate the resulting columns. However, all tables, views, and columns referenced in the DML statement must be defined elsewhere in your database directory, so that it can compile successfully.

To generate TypeScript for a DML statement, add a SQL file containing the statement to your database directory, such as the one below, which is placed in a file called `query-flights.sql`.
```
SELECT Id FROM Flights WHERE FlightNumber = ?;
```

For DML statements that return columns, Not an ORM will generate TypeScript similar to what is generated for tables and views. Since DML statements don't have natural identifiers akin to a table or view name, the name of the file containing the statement is used to determine the name of the interface and constants in the TypeScript file.

```
export interface queryFlights  {
	"Id": number | null;
}

export const queryFlightsColumns = [
	{
        "columnName": "Id",
        "sourceColumn": "Id",
        "sourceTable": "Flight",
        "sourceDatabase": "main",
        "declaredType": "INT",
        "naormTypeComment": null,
        "typeScriptTypeAnnotation": "number | null",
        "jsDocComment": null
	}
]

export const queryFlightsSQL = `SELECT Id FROM Flights WHERE FlightNumber = ?`;
```

If you prefer to specify how the TypeScript interface and constants will be named, you can add a [SQL comment](https://www.sqlite.org/lang_comment.html) above the statement with the syntax `NAORM-ID: <your-variable-name>`. 

```
-- NAORM-ID: deleteFlight
DELETE FROM Flight WHERE FlightNumber = ? RETURNING Id;
```

Not an ORM will recognize the comment and use the value within the generated TypeScript.

```
export interface deleteFlight  {
	"Id": number | null;
}

export const deleteFlightColumns = [
	{
        "columnName": "Id",
        "sourceColumn": "Id",
        "sourceTable": "Flight",
        "sourceDatabase": "main",
        "declaredType": "INT",
        "naormTypeComment": null,
        "typeScriptTypeAnnotation": "number | null",
        "jsDocComment": null
	}
]

export const deleteFlightSQL = `DELETE FROM Flight WHERE FlightNumber = ? RETURNING Id;`;
```

Not an ORM will also process DML Statements that do not return columns. The statement must still be able to compile, meaning that all tables, views, and columns referenced in the statement must be defined elsewhere in your database directory.

```
/* NAORM-ID: updateFlight */
UPDATE Flight SET DestinationAirport = ? WHERE Id = ?;
```

The generated TypeScript file will only contain the SQL statement from the source file.

```
export const updateFlightSQL = `UPDATE Flight SET DestinationAirport = ? WHERE Id = ?;`;
```

## All other SQLite statements

All SQL statements other than `CREATE TABLE`, `CREATE VIEW`, and DML statements are treated by Not an ORM as strings. Not an ORM will not attempt to compile or otherwise validate them, however, they can still be used to generate TypeScript constants.

```
-- NAORM-ID: createAirportIndex
CREATE UNIQUE INDEX Airport_IX1 ON Airport(Id);
```

The generated TypeScript file will only contain the string constant with the SQL statement from the source file.

```
export const createAirportIndexSQL = `CREATE UNIQUE INDEX Airport_IX1 ON Airport(Id);`;
```

[Multiple SQLite statements](https://www.sqlite.org/lang.html) can be included in the same file, separated by semi-colons, and Not an ORM will still process them. In the example below, the two statements are placed in a file named `create-aiport-indices.sql`.

```
CREATE UNIQUE INDEX Airport_IX1 ON Airport(Id);
CREATE UNIQUE INDEX Airport_IX2 ON Airport(IATACode);
```

If alternate statement identifiers are not specified using the `NAORM-ID` syntax, then the generated TypeScript will append indices to ensure uniqueness. Additionally, an array will be exported containing the all of the statements, in the same order in which they were defined in the source file, so that your application can easily execute them as a batch, if desired.

```
export const createAirportIndicesSQL = `CREATE UNIQUE INDEX Airport_IX1 ON Airport(IATACode);`;
export const createAirportIndices_1SQL = `CREATE UNIQUE INDEX Airport_IX2 ON Airport(Id);`;

export const createAirportIndicesSQLStatements = [
    createAirportIndicesSQL,
    createAirportIndices_1SQL
];
```

SQLite statements of any type, including `CREATE TABLE` and `CREATE VIEW` statements, DML statements, and other statements, can all be included in the same file. Not an ORM will process each of the statements accordingly and include all of the output for each statement in the generated TypeScript file.

Finally, all TypeScript generated by Not an ORM is exported via a barrel file, so that your application can easily import it, as below.
```
import { vwFlightOrigin, deleteFlightColumns, createAirportIndex } from '<path-to>/naorm-barrel.ts';
```


# SQL Dependency Analysis

Since Not an ORM learns your database's schema by running your `CREATE TABLE` and `CREATE VIEW` statements, each of these must be able to compile and execute without error. Similarly, Not an ORM must be able to compile, though not execute, each of your DML statements to determine the columns that would be returned. This means that Not an ORM needs to process each of these statements in the correct order such that none fail because a referenced table, view, or column does not exist in the database.

To acheive this, Not an ORM analyzes dependencies between your SQL statements. Note that this analysis is performed at the level of each statement within each SQL file, rather than for the files themselves. Dependencies are not analyzed for statements other than `CREATE TABLE`, `CREATE VIEW`, and DML statements, because Not an ORM will not attempt to compile these.

When running the `generate` command, Not an ORM will attempt to identify dependencies before compiling any SQLite statements. Following this, a list of all statements and their identified  dependencies, in the order to be followed for compilation and execution, is saved to the `naorm-dependencies.json` file within the generated output directory. If two statements are found to directly or indirectly depend on each other, Not an ORM will throw a `Circular Dependency` error. 

## Overriding Dependencies

Not an ORM's dependency identification process is not perfect - it tends to err on the side of identifying too many dependencies, rather than too few. This usually has little noticable effect, unless it causes a circular dependency to be mis-identified.

In this scenario, or in any other scenario where Not an ORM mis-identifies a dependency, you can specify overrides in `naorm-config.json`. If the `skipStatementCompilation` property is set to `true` for any statement, it will be excluded from the entire chain of dependencies, and the generated TypeScript will not contain an interface or list of columns for it.

```
"statementOverrides": [{
    "statementIdentifier": "Passenger",
    "skipStatementCompilation": true,
    "dependentOn": [],
    "notDependentOn": []
},{
    "statementIdentifier": "vwFlightOrigins",
    "skipStatementCompilation": false,
    "dependentOn": ["Flight", "Airport"],
    "notDependentOn": []
},{
    "statementIdentifier": "queryFlights_1",
    "skipStatementCompilation": false,
    "dependentOn": [],
    "notDependentOn": ["Passenger"]
}];
```


# JSDoc Annotations

One great advantage of developing in TypeScript is the ability to use [JSDoc comments](https://jsdoc.app/about-getting-started.html#adding-documentation-comments-to-your-code) to enhance your code editing experience, communicate with other developers, and [generate API documentation](https://jsdoc.app/about-getting-started.html#generating-a-website). Normally, when generating TypeScript, this ability is lost. However, Not an ORM provides a mechanism to maintain JSDoc comments within your SQL files and have them appear in your generated TypeScript, where they will be recognized by [VS Code's IntelliSense feature](https://code.visualstudio.com/docs/languages/typescript#_intellisense).

To use this feature with SQL columns, place a JSDoc comment (beginning with `/**`) in your SQL file before the column that it is describing.

```
CREATE TABLE Airport (
    Id INT,
    /** 3-letter International Air Transport Association's (IATA) Location Identifier */
    IATACode TEXT,
    /** 2-letter ALPHA-2 Country Code from ISO 3166 */
    Country TEXT
)
```

This will generate a TypeScript model with the JSDoc comment included above the property, where it can be picked up by VS Code's IntelliSense.
```
export interface Airport  {
	"Id": number;
    /** 3-letter International Air Transport Association's (IATA) Location Identifier */
	"IATACode": string;
    /** 2-letter ALPHA-2 Country Code from ISO 3166 */
    "Country": string;
}
...
```

JSDoc Comments added to a column definition within a `CREATE TABLE` statement will automatically pass through to any TypeScript interface where the column is returned by the source statement. However, the comment can be overridden in the statement returning the column.
```
CREATE VIEW vwFlightOrigin AS
SELECT F.Id AS FlightId, 
/** The IATA Code for the flight's origin airport */
A.IATACode,
A.Country
FROM Flight AS F
JOIN Airport AS A
ON F.OriginAirportId = A.Id
```

In this example, the JSDoc comment for `Country` comes from the source table definition, while the comment for `IATACode` comes from the `CREATE VIEW` statement.

```
export interface vwFlightOrigin  {
	"FlightId": number;
    /** The IATA Code for the flight's origin airport */
	"IATACode": string;
    /** 2-letter ALPHA-2 Country Code from ISO 3166 */
    "Country": string;
}
```

You can also add a JSDoc comment before an entire SQL statement.

```
/** A view for flights, with information about their origin airport */
CREATE VIEW vwFlightOrigin AS
SELECT F.Id AS FlightId, F.FlightNumber, A.IATACode, A.Country
FROM Flight AS F
JOIN Airport AS A
ON F.OriginAirportId = A.Id
```

This will cause the comment it to appear in the generated TypeScript above both the interface and the string containing the SQL.
```
/** A view for flights, with information about their origin airport */
export interface vwFlightOrigin  {
...
...
...
/** A view for flights, with information about their origin airport */
export const vwFlightOriginSQL = `CREATE VIEW vwFlightOrigin AS
...
```

This feature can be used in combination with the ability to specify variable names using `NAORM-ID:` syntax, which can be placed either inside the JSDoc comment, or in a separate comment.

```
/** NAORM-ID: airportIdIndex
    Command to create a unique index on the Airport Id 
*/
CREATE UNIQUE INDEX Airport_IX1 ON Airport(Id);

-- NAORM-ID: airportIATACodeIndex
/** Command to create a unique index on the Airport IATACode */
CREATE UNIQUE INDEX Airport_IX2 ON Airport(IATACode);
```


```
/** NAORM-ID: airportIdIndex
    Command to create a unique index on the Airport Id 
*/
export const airportIdIndexSQL = `CREATE UNIQUE INDEX Airport_IX1 ON Airport(IATACode);`;

/** Command to create a unique index on the Airport IATACode */
export const airportIATACodeIndexSQL = `CREATE UNIQUE INDEX Airport_IX2 ON Airport(IATACode);`;

export const createAirportIndicesSQLStatements = [
    airportIdIndexSQL,
    airportIATACodeIndexSQL
];
```


# SQLite Nuances

The SQL language, and SQLite's implementation in particular, contain some nuances that present challenges for generating TypeScript, particularly when it comes to determining the names and types of columns in a statement's resulting column set.

## Duplicate Column Names

In SQLite, it is perfectly valid to include two columns with the same name in a statement.
```
SELECT A.Id, F.Id 
FROM Airport AS A 
INNER JOIN Flight AS F 
ON F.OriginAirportId = A.Id;
```

It's even valid to include the same exact column twice.
```
SELECT Id, Id FROM Airport;
```

Of course, a TypeScript interface or class requires unique property names. Different SQLite plugins for JavaScript/TypeScript may handle this problem differently. The easiest, best, and most universal way to solve for this is by using a [column alias](https://www.sqlite.org/syntax/result-column.html) in your SQL statement.
```
SELECT A.Id, F.Id AS FlightId
FROM Airport AS A 
INNER JOIN Flight AS F 
ON F.OriginAirportId = A.Id;
```

Adding a column alias to any column with an ambiguous name will ensure consistent results. Additionally, it prevents you from having to rely on SQLite's automatically generated column names, use of which is explicitly discouraged in the SQLite [documentation](https://www.sqlite.org/lang_createview.html).

## Expression Columns

In SQLite, it is common to use [Expressions](https://www.sqlite.org/lang_expr.html) in DML statements.
```
SELECT COUNT(*) FROM Airport;
```

It is possible to have a TypeScript property named `Count(*)`, and Not an ORM will not prevent you from trying to create one. However, this is not ideal, as it would only be accessible with [bracket notation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Property_accessors#bracket_notation). For expressions, it is best to use a column alias, as descried in the last section.

```
SELECT COUNT(*) AS AirportCount FROM Airport;
```

However, even with column aliases, SQL expressions remain problematic for generating TypeScript due to nature of SQLite's [flexible typing system](https://www.sqlite.org/datatype3.html). SQLite does not assign either a [Declared Type](https://www.sqlite.org/datatype3.html#determination_of_column_affinity) or a [Type Affinity](https://www.sqlite.org/datatype3.html#affinity) to expression columns, even straightforward ones like `COUNT(*)`, except in [certain circumstances](https://www.sqlite.org/datatype3.html#affinity_of_expressions). Without additional information, Not an ORM will by default assign a type of `any` to any expression columns within your generated TypeScript interface.

To solve for this, you can add a C-style comment in your SQL statement containing the SQLite Declared Type that you would like to associate to the expression, using the syntax `NAORM-TYPE: <your-declared-type>`. Such a comment must be placed directly after the column alias - it must be before any comma, parentheses, or other non-whitespace characters. Not an ORM will recognize the comment and use it to calculate the type for your TypeScript model.  
```
SELECT 
    COUNT(*) AS FlightCount /* NAORM-TYPE: INT */,
    AVERAGE(Capacity) AS AverageCapacity /* NAORM-TYPE: REAL */,
    SUM(Capacity) AS TotalCapacity /* NAORM-TYPE: INT */
FROM Flight;
```

## Untyped Column Definitions

In SQLite, it is possible to [define a column without a Declared Type](https://www.sqlite.org/quirks.html#the_datatype_is_optional). In this case, a `NAORM-TYPE:` comment can be placed directly after the column name, before any constraints, and it will be used when generating TypeScript.
```
CREATE TABLE Airport (
    Id INT,
    IATACode /* NAORM-TYPE: TEXT */ UNIQUE CHECK(LENGTH(IATACode) = 3),
    Country /* NAORM-TYPE: TEXT */
)
```

It is also possible to add comments using the `NAORM-TYPE:` syntax to override the Declared Type that was specified in a column definition.
```
CREATE VIEW vwAirportId AS
SELECT Id /* NAORM-TYPE: TEXT */ FROM Airport;
```
In this scenario, the value in the comment will be utilized instead of the table column's Declared Type.

```
export interface vwAirportId  {
	"Id": string | null;
}

export const vwFlightOriginColumns = [
	{
        "columnName": "Id",
        "sourceColumn": "Id",
        "sourceTable": "Flight",
        "sourceDatabase": "main",
        "declaredType": "INT",
        "naormTypeComment": "TEXT",
        "typeScriptTypeAnnotation": "string | null",
        "jsDocComment": null
	}
]
...
```

## `NOT NULL` Constraints

[`NOT NULL` constraints](https://www.sqlite.org/lang_createtable.html#notnullconst) are used in SQLite to prevent columns from containing null values. These are commonly used in combination with a [default value](https://www.sqlite.org/lang_createtable.html#dfltval), [autoincrement](https://www.sqlite.org/autoinc.html), or [trigger](https://www.sqlite.org/lang_createtrigger.html) that operates at the database level to populate non-null data into such a column.

This may mean that your application needs to work with models that allow null values for properties corresponding to columns with `NOT NULL` constraints. By default, Not an ORM will not consider `NOT NULL` constraints, and will generate TypeScript interfaces that [allow null values](https://www.typescriptlang.org/docs/handbook/migrating-from-javascript.html#strict-null--undefined-checks) for all properties by using a [union type](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types) such as `string | null`.

If desired, you can explicitly indicate `NOT NULL` within a `NAORM-TYPE:` comment immediately after the column name.
```
CREATE TABLE Airport (
    Id /* NAORM-TYPE: INT NOT NULL */ INT NOT NULL
);
```

This will generate TypeScript models that do not contain the union type containing  `null` for the property.
```
export interface Airport  {
	"Id": number;
}

export const AirportColumns = [
	{
        "columnName": "Id",
        "sourceColumn": "Id",
        "sourceTable": "Airport",
        "sourceDatabase": "main",
        "declaredType": "INT",
        "naormTypeComment": "INT NOT NULL",
        "typeScriptTypeAnnotation": "number",
        "jsDocComment": null
	}
]
```
TypeScript will treat this interface differently depending on your TS version and [configuration settings](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html#handbook-content) such as the [`strictNullChecks` option](https://www.typescriptlang.org/tsconfig#strictNullChecks).



# Custom Type Conventions

Unlike other SQL implementations, SQLite [does not enforce static, rigid typing](https://www.sqlite.org/quirks.html#flexible_typing). Instead, it implements its own unique [flexible typing system](https://www.sqlite.org/datatype3.html) with a limited set of [Storage Classes](https://www.sqlite.org/datatype3.html#storage_classes_and_datatypes) and [Type Affinities](https://www.sqlite.org/datatype3.html#type_affinity). While this architecture has [many advantages](https://www.sqlite.org/flextypegood.html), it presents challenges in mapping to TypeScript - after all, SQLite [does not even have a dedicated type for boolean values](https://www.sqlite.org/quirks.html#no_separate_boolean_datatype). Similarly, while many data elements such as dates, timestamps, and other complex structures can be stored safely in `TEXT` or `BLOB` format, it is valuable to have TypeScript models that represent your data model in their most useful form for your application, rather than representing only the form used for persistance.

To solve these problems, Not an ORM defines a concept called a Type Convention. This is the mechanism by which Not an ORM determines which type to assign to a property in a generated TypeScript class or interface. Type Conventions operate based on the [Declared Type](https://www.sqlite.org/datatype3.html#determination_of_column_affinity) of a column in SQLite, rather than its [Type Affinity](https://www.sqlite.org/datatype3.html#affinity), and are completely customizable within your project. This greatly expands the options available for model generation, and can be extended to handle JavaScript [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) objects, [BigInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt) objects, structured [JSON](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON) data, and more.

The TypeScript snippets in the examples above were all generated using Not an ORM's default Type Conventions, which map the Declared Types of SQL columns to TypeScript types using rules similar to [the ones used by SQLite to map Declared Types to Type Affinities](https://www.sqlite.org/datatype3.html#determination_of_column_affinity). Custom Type Conventions can be defined in the `naorm-config.json` file. The concepts utilized in these configurations are described sequentially in the sections below by way of example.

* [Custom Type Conventions for Booleans](#custom-type-conventions-for-booleans)
* [Custom Type Conventions for Dates](#custom-type-conventions-for-dates)
* [Custom Type Conventions for Complex Types](#custom-type-conventions-for-complex-types)
* [Multiple Custom  Type Conventions Sets](#multiple-custom-type-convention-sets)

**IMPORTANT:** *Not an ORM does not convert or cast any data within your application's runtime. Not an ORM is a Command Line Interface which should only be used to generate TypeScript prior to your application's TS compilation. NAORM generates TypeScript interfaces following the configured conventions, so that you can implement type conversion logic within your application in a type-safe way. Your application is responsible for converting types at runtime.*

## Type Conventions for Booleans

A classic type-handling issue arises with booleans in TypeScript, which are [typically stored in SQLite in `INTEGER` columns with value `0` or `1`](https://www.sqlite.org/datatype3.html#boolean_datatype). However, using an alternate Declared Type when defining a column will allow Not an ORM to reference it later and generate a TypeScript interface with a boolean type.

For example, the `CREATE TABLE` statement below defines a column, `IsCancelled`, with a Declared Type of `BOOLINT`.

```
CREATE TABLE Flight (
    IsCancelled BOOLINT
)
```

Of course, `BOOLINT` is not a standard SQL data type in any major SQL implementation, but SQLite does not require it to be. SQLite will assign a Type Affinity of `INT` to this column, following its [rules for doing so](https://www.sqlite.org/datatype3.html#determination_of_column_affinity).

In the Custom Type Convention Set below, the Declared Type of `BOOLINT` is configured to map to a TypeScript `boolean`. 

```
...
"customTypeConventionSets": [
    {
        "name": "",
        "typescriptConstruct": "interface",
        "extends": null,
        "importStatements": [],
        "typeConventions": [{
            "sqliteDeclaredType": "BOOLINT",
            "typescriptGeneratedType": "boolean"
        }]
    }
]
...
```

After running `npx naorm generate` with the above configuration, the generated TypeScript interface contains the `IsCancelled` property with a type of `boolean`, rather than `number`. Note that when using Custom Type Conventions, Not an ORM will not automatically assign an union type containing a null type to a property.

```
export interface Flight  {
	"IsCancelled": boolean;
}
```


However, it is also sometimes useful to have a nullable boolean column, which can be accomplished with a separate Declared Type.
```
CREATE TABLE Flight (
    IsCancelled BOOLINT NOT NULL,
    IsDelayed NULLABLE_BOOLINT
)
```
Within the Custom Type Convention, the union type `boolean | null` is specified as a string. 
```
...
"customTypeConventionSets": [
    {
        "name": "",
        "typescriptConstruct": "interface",
        "extends": null,
        "importStatements": [],
        "typeConventions": [{
            "sqliteDeclaredType": "BOOLINT",
            "typescriptGeneratedType": "boolean"
        },{
            "sqliteDeclaredType": "NULLABLE_BOOLINT",
            "typescriptGeneratedType": "boolean | null"
        }]
    }
]
...
```

If you are using [SQLite's `STRICT` mode](https://www.sqlite.org/stricttables.html) for your table, you will not be able to define a column with a Declared Type other than the ones allowed. However, you can still use a `NAORM-TYPE:` comment, as below.
```
CREATE TABLE Flight (
    IsCancelled /* NAORM-TYPE: BOOLINT */ INT NOT NULL,
    IsDelayed  /* NAORM-TYPE: NULLABLE_BOOLINT */ INT 
) STRICT;
```

When using  `CREATE TABLE...STRICT` statements, Not an ORM will always use the `NAORM-TYPE:` comment.
```
export interface Flight  {
	"IsCancelled": boolean;
	"IsDelayed": boolean | null;
}
```


## Type Conventions for Dates
Another type-handling issue arises with date and date/time values, since [SQLite does not have a dedicated type for either](https://www.sqlite.org/quirks.html#no_separate_datetime_datatype). The JavaScript [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) object contains date, time, and time zone information, which can be properly [stored and queried in SQLite](https://www.sqlite.org/datatype3.html#date_and_time_datatype) as `TEXT`, `INT`, or `REAL`. There is no concept of a date-only value in JavaScript, however, you may want to store one in SQLite, using a format such as a date-only ISO string (e.g. `2022-12-20`).

The `CREATE TABLE` statement below defines three columns with Declared Types ending in `TEXT`, so that [SQLite will assign a Type Affinity of `TEXT` to these columns](https://www.sqlite.org/datatype3.html#determination_of_column_affinity).

```
CREATE TABLE Flight (
    DepartureTime DATETIME_TEXT,
    ArrivalTime DATETIME_OFFSET_TEXT,
    InspectionDate DATE_TEXT
)
```

In the Custom Type Convention Set below, all three of the Declared Types are configured to map to a `Date` within the generated TypeScript model. 

```
...
"customTypeConventionSets": [
    {
        "name": "",
        "typescriptConstruct": "interface",
        "extends": null,
        "importStatements": [],
        "typeConventions": [{
            "sqliteDeclaredType": "DATETIME_TEXT",
            "typescriptGeneratedType": "Date"
        },{
            "sqliteDeclaredType": "DATETIME_OFFSET_TEXT",
            "typescriptGeneratedType": "Date"
        },{
            "sqliteDeclaredType": "DATE_TEXT",
            "typescriptGeneratedType": "Date"
        }]
    }
]
...
```

After running `npx naorm generate` with the above configuration, the generated TypeScript interface contains all three properties with a type of `Date`. Your application can then decide how to convert these properties to and from your desired `TEXT` form when saving and retrieving data.

```
export interface Flight  {
	"DepartureTime": Date;
	"ArrivalTime": Date;
	"InspectionDate": Date;
}
```


You may want to use a library like [Moment.js](https://momentjs.com/) or [Luxon](https://moment.github.io/luxon/#/) to work with dates and times in your TypeScript application, and you can specify your own Declared Types to facilitate this. 
```
CREATE TABLE Flight (
    DepartureTime LUXON_DATETIME_TEXT
)
```

In the Custom Type Convention Set below, the `LUXON_DATETIME_TEXT` is mapped to Luxon's [`DateTime` type](https://moment.github.io/luxon/api-docs/index.html#datetime), which, unlike a JavaScript `Date`, is not natively recognized by TypeScript. The type must be imported from Luxon's library, which is accomplished by adding the appropriate import statement to the convention set.

```
...
"customTypeConventionSets": [
    {
        "name": "",
        "typescriptConstruct": "interface",
        "extends": null,
        "importStatements": ['import { DateTime } from "luxon";'],
        "typeConventions": [{
            "sqliteDeclaredType": "LUXON_DATETIME_TEXT",
            "typescriptGeneratedType": "DateTime"
        }]
    }
]
...
```

After running `npx naorm generate` with the above configuration, the generated TypeScript file contains the import statement as well as the interface.

```
import { DateTime } from "luxon";

export interface Flight  {
	"DepartureTime": DateTime;
}
```

## Type Conventions for Complex Types
There may be instances where you would like to [store a JSON string](https://www.sqlite.org/json1.html), representing some data with a complex type in your application, as `TEXT` in SQLite. This can be acheived with a similar approach to dates, by defining a column with your own custom Declared Type.

```
CREATE TABLE Flight (
    FlightPlan FLIGHT_PLAN_TEXT
)
```

In this scenario, your `FlightPlan` type is probably defined somewhere within your code base, rather than in another library, so you may need to use a relative path in your import statement. This is possible by defining the path relative to the directory containing your `naorm-config.json` file. 

```
...
"customTypeConventionSets": [
    {
        "name": "",
        "typescriptConstruct": "interface",
        "extends": null,
        "importStatements": ['import { FlightPlan } from "<path-to>/flight-plan.ts";'],
        "typeConventions": [{
            "sqliteDeclaredType": "FLIGHT_PLAN_TEXT",
            "typescriptGeneratedType": "FlightPlan"
        }]
    }
]
...
```

After running `npx naorm generate` with the above configuration, the generated TypeScript file contains the import statement, with the appropriate relative path, as well as the interface utilizing the type.

```
import { FlightPlan } from "../../<path-to>/flight-plan.ts";

export interface Flight  {
	"FlightPlan": FlightPlan;
}
```

## Multiple Custom Type Convention Sets
There may be instances where it is helpful to generate multiple TypeScript models for the same set of columns in SQLite. In the above example of the complex data structure, your application's user interface, search algorithm, etc. may prefer to work with the data in its parsed form, but the same data may need to be sent to another application or database in its raw string form. NAORM allows you to generate a TypeScript model for each scenario.

```
CREATE TABLE Flight (
    FlightPlan FLIGHT_PLAN_TEXT
)
```

The configuration file below contains two Custom Type Convention Sets, each with a unique value specificed for `name`. 

```
...
"customTypeConventionSets": [
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
        "importStatements": ['import { FlightPlan } from "../helpers/flight-plan.ts";'],
        "typeConventions": [{
            "sqliteDeclaredType": "FLIGHT_PLAN_TEXT",
            "typescriptGeneratedType": "FlightPlan | null"
        }]
    }
]
...
```

After running `npx naorm generate` with the above configuration, the generated TypeScript file contains two interfaces, each with the name of the convention set appended to the statement identifier. The two constants containing the columns follow the same approach.

```
import { FlightPlan } from "../../../../helpers/flight-plan.ts";

export interface FlightRaw  {
	"FlightPlan": string;
}

export interface FlightParsed  {
	"FlightPlan": FlightPlan;
}

export const FlightRawColumns = [
	{
        "columnName": "FlightPlan",
        "sourceColumn": "FlightPlan",
        "sourceTable": "Airport",
        "sourceDatabase": "main",
        "declaredType": "FLIGHT_PLAN_TEXT",
        "naormTypeComment": null,
        "typeScriptTypeAnnotation": "string | null",
        "jsDocComment": null
	}
]

export const FlightParsedColumns = [
	{
        "columnName": "FlightPlan",
        "sourceColumn": "FlightPlan",
        "sourceTable": "Airport",
        "sourceDatabase": "main",
        "declaredType": "FLIGHT_PLAN_TEXT",
        "naormTypeComment": null,
        "typeScriptTypeAnnotation": "FlightPlan | null",
        "jsDocComment": null
	}
]

export const FlightSQL = `SELECT FlightPlan /* FLIGHT_PLAN_TEXT */ FROM Flights WHERE FlightNumber = ?`;
```

# Limitations

Not an ORM does not solve every problem facing TypeScript + SQLite developers. It is meant to be a lightweight tool that accomplishes a few key tasks. It is not, after all, an ORM library.

Below are some examples of items that Not an ORM, by design, does not do:

* Not an ORM generates TypeScript, not SQL - it is not a query builder. However, it aims to be compatible with query builders such as [SQL Bricks](https://www.npmjs.com/package/sql-bricks) and [Knex](https://www.npmjs.com/package/knex). One strategy for using these in combinaiton would be to maintain complex `SELECT` statements in SQL files, utilizing Not an ORM to generate TypeScript models, but leaving certain clauses like `WHERE` and `ORDER BY` to be dynamically generated by a query builder at runtime.

* Not an ORM does not convert or cast data from one type to another within your application's runtime - your application is responsible for this. Not an ORM simply makes it possible to do so in a type-safe way.

* Not an ORM does not attempt to parse or otherwise understand the content of your SQL statements, except in a few limited ways that are necessary in order to carry out its functions. A full parsing algorithm, such as [the one used by SQLite itself](https://www.sqlite.org/lemon.html), would need to be quite sophisticated, and is beyond the scope of this tool.


Besides these, there are also certain limitations when it comes to Not an ORM's intended functionality:

* Not an ORM does not currently compile statements other than `CREATE TABLE`, `CREATE VIEW`, and DML statements. Therefore, you could write invalid SQL in a different type of statement, and Not an ORM will not throw an error or complain. As such, you may not realize something is wrong until your application tries to run the statement. In a future enhancement, it may become possible to compile a such statements, or perhaps a subset of them, as an additional validation mechanism.

* Not an ORM does not currently support [virtual tables]((https://www.sqlite.org/lang_createvtab.html)), nor any View or DML statement that depends on a virtual table. This may be possible in a future enhancement.

* Not an ORM does not support [attached databases](https://www.sqlite.org/lang_attach.html), and is unlikely to do so in the near future.
