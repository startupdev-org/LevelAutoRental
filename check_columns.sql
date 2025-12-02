SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'Cars' 
AND column_name LIKE 'price%'
ORDER BY column_name;



