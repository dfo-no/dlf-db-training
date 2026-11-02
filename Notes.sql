-- #Notes

SELECT 0.1::float8 + 0.2::float8 as floattest;

SELECT uuidv7()

SELECT 2147483647::int + 1

SELECT 'epoch'::timestamptz
UNION ALL SELECT now()::timestamptz;

-- 26837
SELECT * 
FROM public.users
WHERE 1=1
	AND displayname like '%Brent%'
	AND id = 26837