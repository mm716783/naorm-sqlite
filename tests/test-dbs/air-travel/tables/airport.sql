CREATE TABLE Airport (
    Id INT,
    IATACode /* NAORM-Type: TEXT */ UNIQUE CHECK(LENGTH(IATACode) = 3),
    Country NOT NULL -- NAORM-Type: TEXT
)