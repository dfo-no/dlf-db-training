\echo 'Creating Stack Overflow 2010 database.'
\connect postgres
-- The official entrypoint may already have created this via POSTGRES_DB.
SELECT 'CREATE DATABASE stackoverflow2010'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'stackoverflow2010')
\gexec
