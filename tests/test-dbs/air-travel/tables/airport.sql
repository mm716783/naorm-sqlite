CREATE TABLE Airport (
    Id INT,
    IATACode /* NAORM-Type: TEXT NOT NULL */ UNIQUE CHECK(LENGTH(IATACode) = 3),
    Country NOT NULL -- NAORM-Type: TEXT
)