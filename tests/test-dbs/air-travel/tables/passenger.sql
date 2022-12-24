CREATE TABLE Passenger(
    FirstName TEXT,
    LastName TEXT,
    Name TEXT GENERATED ALWAYS AS (FirstName || ' ' || LastName) VIRTUAL,
    Name2 TEXT GENERATED ALWAYS AS (FirstName || '_' || LastName) STORED
)