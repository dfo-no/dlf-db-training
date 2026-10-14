CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Database initialization completed successfully';
END $$;