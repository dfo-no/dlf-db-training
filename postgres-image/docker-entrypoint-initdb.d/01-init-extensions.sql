-- Keep this extension in the maintenance database until the training dump has
-- replaced its public schema, even if POSTGRES_DB is stackoverflow2010.
\connect postgres
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
