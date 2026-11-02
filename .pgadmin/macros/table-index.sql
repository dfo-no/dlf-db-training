SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = split_part('$SELECTION$', '.', 1)
  AND tablename = split_part('$SELECTION$', '.', 2)
ORDER BY indexname;