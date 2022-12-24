CREATE VIEW vwFlightOrigins AS
SELECT A.*, F.*,
/** Test expression comment */
CASE WHEN F.FlightNumber = 1 THEN 3 ELSE 4 END AS expressionField /* INT */ 
FROM Airport AS A
JOIN Flight AS F
-- FROM Aircraft
ON F.OriginAirport = A.Id
