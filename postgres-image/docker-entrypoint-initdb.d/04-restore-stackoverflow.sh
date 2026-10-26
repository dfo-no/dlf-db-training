#!/bin/sh
set -eu

restore_jobs="${POSTGRES_RESTORE_JOBS:-4}"
case "$restore_jobs" in
    ''|*[!0-9]*|0*)
        echo 'ERROR: POSTGRES_RESTORE_JOBS must be a positive integer.' >&2
        exit 1
        ;;
esac

echo 'Restoring Stack Overflow 2010 tables and data without indexes or foreign keys.'
# This runs only during initialization; replace the default public schema with
# the schema defined in the archive. Skip post-data objects so students can
# create indexes and foreign keys themselves. Primary-key and unique constraints
# are also omitted because they would create indexes automatically.
pg_restore \
    --username="$POSTGRES_USER" \
    --dbname=stackoverflow2010 \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges \
    --section=pre-data \
    --section=data \
    --exit-on-error \
    --verbose \
    --jobs="$restore_jobs" \
    /opt/seed/stackoverflow2010.dump

psql \
    --username="$POSTGRES_USER" \
    --dbname=stackoverflow2010 \
    --set=ON_ERROR_STOP=1 \
    --command='CREATE EXTENSION IF NOT EXISTS pg_stat_statements;' \
    --command='ANALYZE;'

echo 'Stack Overflow 2010 database restore completed.'
