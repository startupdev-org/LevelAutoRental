-- Replace single price_per_day column with price range columns
-- First add the new price range columns

ALTER TABLE public."Cars"
ADD COLUMN IF NOT EXISTS price_2_4_days numeric(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS price_5_15_days numeric(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS price_16_30_days numeric(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS price_over_30_days numeric(10, 2) DEFAULT 0;

-- Add comments to explain the new columns
COMMENT ON COLUMN public."Cars".price_2_4_days IS 'Price per day for rentals of 2-4 days';
COMMENT ON COLUMN public."Cars".price_5_15_days IS 'Price per day for rentals of 5-15 days';
COMMENT ON COLUMN public."Cars".price_16_30_days IS 'Price per day for rentals of 16-30 days';
COMMENT ON COLUMN public."Cars".price_over_30_days IS 'Price per day for rentals over 30 days';

-- Migrate existing price_per_day values to the new price ranges (set all ranges to the same value)
-- Only do this if price_per_day exists and has values
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Cars' AND column_name = 'price_per_day') THEN
        -- Copy existing price_per_day values to all new price range columns
        UPDATE public."Cars"
        SET
            price_2_4_days = COALESCE(price_per_day, 0),
            price_5_15_days = COALESCE(price_per_day, 0),
            price_16_30_days = COALESCE(price_per_day, 0),
            price_over_30_days = COALESCE(price_per_day, 0)
        WHERE price_per_day IS NOT NULL AND price_per_day > 0;
    END IF;
END $$;

-- Now drop the old price_per_day column
ALTER TABLE public."Cars" DROP COLUMN IF EXISTS price_per_day;

-- Create indexes for performance if needed (optional)
-- CREATE INDEX IF NOT EXISTS idx_cars_price_ranges ON public."Cars" (price_2_4_days, price_5_15_days, price_16_30_days, price_over_30_days);
