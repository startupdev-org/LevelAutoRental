
CREATE OR REPLACE FUNCTION get_user_favorite_car(p_user_id text)
RETURNS TABLE (
    car_id integer,
    rental_count bigint,
    last_rental timestamp
)
LANGUAGE sql
AS $$
    SELECT car_id, COUNT(*) AS rental_count, MAX(start_date) AS last_rental
    FROM "Rentals"
    WHERE user_id = p_user_id
    GROUP BY car_id
    ORDER BY rental_count DESC, last_rental DESC
    LIMIT 1;
$$;

SELECT *
FROM get_user_favorite_car('6a8d8a87-60cb-49e9-8af4-80cb995f031c')

