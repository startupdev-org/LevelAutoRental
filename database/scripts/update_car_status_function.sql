-- Helper function to get the correct Cars table name
CREATE OR REPLACE FUNCTION get_cars_table_name()
RETURNS TEXT 
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  -- Check if "Cars" (quoted, case-sensitive) exists
  IF EXISTS (SELECT 1 FROM information_schema.tables t WHERE t.table_schema = 'public' AND t.table_name = 'Cars') THEN
    RETURN '"Cars"';
  -- Check if "cars" (lowercase) exists
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables t WHERE t.table_schema = 'public' AND t.table_name = 'cars') THEN
    RETURN 'cars';
  ELSE
    -- Default to "Cars" if neither found (will error if table doesn't exist)
    RETURN '"Cars"';
  END IF;
END;
$$;

-- Function to update car status based on active rentals
-- This function checks if a car has any ACTIVE rentals and updates the car status accordingly
-- SECURITY DEFINER allows the function to bypass RLS policies
CREATE OR REPLACE FUNCTION update_car_status_from_rentals()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  car_id_to_check INTEGER;
  active_rentals_count INTEGER;
  old_car_id INTEGER;
  cars_table TEXT;
  update_sql TEXT;
BEGIN
  -- Get the correct table name
  cars_table := get_cars_table_name();
  
  -- Determine which car_id(s) to check
  IF TG_OP = 'DELETE' THEN
    car_id_to_check := OLD.car_id;
    old_car_id := NULL; -- No old car_id on delete
  ELSIF TG_OP = 'UPDATE' THEN
    -- On update, check both old and new car_id (in case car_id changed)
    car_id_to_check := NEW.car_id;
    old_car_id := OLD.car_id;
  ELSE
    -- INSERT
    car_id_to_check := NEW.car_id;
    old_car_id := NULL;
  END IF;

  -- If car_id changed on update, also update the old car
  IF TG_OP = 'UPDATE' AND old_car_id IS NOT NULL AND old_car_id != car_id_to_check THEN
    -- Count active rentals for the old car
    SELECT COUNT(*) INTO active_rentals_count
    FROM public."Rentals"
    WHERE car_id = old_car_id
      AND rental_status = 'ACTIVE';

    -- Update old car status using dynamic SQL
    IF active_rentals_count > 0 THEN
      update_sql := format('UPDATE public.%s SET status = %L, updated_at = NOW() WHERE id = %s', 
                          cars_table, 'booked', old_car_id);
    ELSE
      update_sql := format('UPDATE public.%s SET status = %L, updated_at = NOW() WHERE id = %s', 
                          cars_table, 'available', old_car_id);
    END IF;
    EXECUTE update_sql;
  END IF;

  -- Count active rentals for the current/new car
  SELECT COUNT(*) INTO active_rentals_count
  FROM public."Rentals"
  WHERE car_id = car_id_to_check
    AND rental_status = 'ACTIVE';

  -- Update car status based on active rentals count using dynamic SQL
  IF active_rentals_count > 0 THEN
    update_sql := format('UPDATE public.%s SET status = %L, updated_at = NOW() WHERE id = %s', 
                        cars_table, 'booked', car_id_to_check);
  ELSE
    update_sql := format('UPDATE public.%s SET status = %L, updated_at = NOW() WHERE id = %s', 
                        cars_table, 'available', car_id_to_check);
  END IF;
  EXECUTE update_sql;

  -- Return the appropriate record
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Error in update_car_status_from_rentals: % (cars_table: %)', SQLERRM, cars_table;
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_update_car_status_from_rentals_insert ON public."Rentals";
DROP TRIGGER IF EXISTS trigger_update_car_status_from_rentals_update ON public."Rentals";
DROP TRIGGER IF EXISTS trigger_update_car_status_from_rentals_delete ON public."Rentals";

-- Create trigger that fires after INSERT, UPDATE, or DELETE on Rentals table
CREATE TRIGGER trigger_update_car_status_from_rentals_insert
  AFTER INSERT
  ON public."Rentals"
  FOR EACH ROW
  EXECUTE FUNCTION update_car_status_from_rentals();

CREATE TRIGGER trigger_update_car_status_from_rentals_update
  AFTER UPDATE OF rental_status, car_id
  ON public."Rentals"
  FOR EACH ROW
  WHEN (OLD.rental_status IS DISTINCT FROM NEW.rental_status OR OLD.car_id IS DISTINCT FROM NEW.car_id)
  EXECUTE FUNCTION update_car_status_from_rentals();

CREATE TRIGGER trigger_update_car_status_from_rentals_delete
  AFTER DELETE
  ON public."Rentals"
  FOR EACH ROW
  EXECUTE FUNCTION update_car_status_from_rentals();

-- Optional: Function to update all car statuses (useful for initial setup or fixing inconsistencies)
CREATE OR REPLACE FUNCTION update_all_car_statuses_from_rentals()
RETURNS void 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cars_table TEXT;
  update_sql TEXT;
BEGIN
  -- Get the correct table name
  cars_table := get_cars_table_name();
  
  -- Build and execute the update query dynamically
  update_sql := format('
    UPDATE public.%s c
    SET 
      status = CASE 
        WHEN EXISTS (
          SELECT 1 
          FROM public."Rentals" r 
          WHERE r.car_id = c.id 
            AND r.rental_status = %L
        ) THEN %L
        ELSE %L
      END,
      updated_at = NOW()',
    cars_table, 'ACTIVE', 'booked', 'available');
  
  EXECUTE update_sql;
END;
$$ LANGUAGE plpgsql;

-- Run the function once to update all existing car statuses
SELECT update_all_car_statuses_from_rentals();

-- Test query to verify the function works
-- This will show which table name is being used
DO $$
DECLARE
  table_name TEXT;
BEGIN
  table_name := get_cars_table_name();
  RAISE NOTICE 'Using Cars table: %', table_name;
END $$;

-- Show cars with their current status and active rental count
-- This query uses the helper function to determine the correct table name
DO $$
DECLARE
  cars_table TEXT;
  query_result TEXT;
BEGIN
  cars_table := get_cars_table_name();
  RAISE NOTICE 'Cars table name: %', cars_table;
END $$;

-- Diagnostic query - shows cars with their current status and active rental count
-- Note: This uses lowercase 'cars' which PostgreSQL will resolve to the correct table
SELECT 
  c.id,
  c.make,
  c.model,
  c.status as current_car_status,
  COUNT(r.id) FILTER (WHERE r.rental_status = 'ACTIVE') as active_rentals_count,
  CASE 
    WHEN COUNT(r.id) FILTER (WHERE r.rental_status = 'ACTIVE') > 0 THEN 'booked'
    ELSE 'available'
  END as expected_status
FROM public.cars c
LEFT JOIN public."Rentals" r ON r.car_id = c.id
GROUP BY c.id, c.make, c.model, c.status
ORDER BY c.id;
