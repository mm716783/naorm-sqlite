PRAGMA table_info(Airport);
DELETE FROM Flight WHERE FlightNumber = ? RETURNING Id;