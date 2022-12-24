CREATE TABLE Flight(
    'Id' TEXT,
    AirlineId TEXT,
    /** Test pass-through comment */
    FlightNumber INT,
    ScheduledDepartDateTime DATETIME_TEXT,
    ScheduledArrivalDateTime DATETIME_TEXT,
    ActualDepartDateTime DATETIME_TEXT,
    ActualArrivalDateTime DATETIME_TEXT,
    OriginAirport TEXT,
    DestinationAirport TEXT,
    IsCancelled TINYINT
)