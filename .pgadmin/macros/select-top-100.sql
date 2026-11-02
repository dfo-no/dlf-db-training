
DO $pgadmin_top100$
DECLARE
    raw_ref text := trim(both E' \n\r\t;' from '$SELECTION$');
    clean_ref text := replace(trim(both E' \n\r\t;' from '$SELECTION$'), '"', '');
    selected_schema text;
    selected_name text;
    rel_oid oid;
    schema_name text;
    table_name text;
    object_type text;
    columns_sql text;
BEGIN
    selected_schema :=
        CASE
            WHEN clean_ref LIKE '%.%' THEN split_part(clean_ref, '.', 1)
            ELSE NULL
        END;

    selected_name :=
        CASE
            WHEN clean_ref LIKE '%.%' THEN split_part(clean_ref, '.', 2)
            ELSE clean_ref
        END;

    /*
        First try PostgreSQL's normal resolver.
        This respects search_path when only table/view name is highlighted.
    */
    rel_oid := COALESCE(
        to_regclass(raw_ref),
        to_regclass(clean_ref)
    );

    /*
        Fallback:
        If to_regclass could not resolve it, search pg_class manually.
    */
    IF rel_oid IS NULL THEN
        SELECT c.oid
        INTO rel_oid
        FROM pg_class c
        JOIN pg_namespace n
            ON n.oid = c.relnamespace
        WHERE c.relkind IN ('r', 'p', 'v', 'm', 'f')
          AND c.relname = selected_name
          AND (
                selected_schema IS NULL
                OR n.nspname = selected_schema
              )
        ORDER BY
            CASE
                WHEN selected_schema IS NOT NULL THEN 0
                WHEN n.nspname = current_schema() THEN 1
                ELSE 2
            END,
            n.nspname,
            c.relname
        LIMIT 1;
    END IF;

    IF rel_oid IS NULL THEN
        RAISE EXCEPTION 'Could not resolve selected table/view: %', raw_ref;
    END IF;

    SELECT
        n.nspname,
        c.relname,
        CASE c.relkind
            WHEN 'r' THEN 'table'
            WHEN 'p' THEN 'partitioned table'
            WHEN 'v' THEN 'view'
            WHEN 'm' THEN 'materialized view'
            WHEN 'f' THEN 'foreign table'
            ELSE c.relkind::text
        END
    INTO
        schema_name,
        table_name,
        object_type
    FROM pg_class c
    JOIN pg_namespace n
        ON n.oid = c.relnamespace
    WHERE c.oid = rel_oid;

    /*
        PRINT equivalent.
        This appears in pgAdmin's Messages tab.
    */
    RAISE NOTICE 'Resolved object: %.% (%)', schema_name, table_name, object_type;

    /*
        Build explicit column list.
        Normal columns first, audit columns last.
    */
    SELECT string_agg(
        format('%I', a.attname),
        ', ' ORDER BY
            CASE
                WHEN a.attname IN (
                    'created_by',
                    'created_date',
                    'last_updated_by',
                    'last_updated_date'
                ) THEN 1
                ELSE 0
            END,
            CASE
                WHEN a.attname = 'created_by' THEN 1
                WHEN a.attname = 'created_date' THEN 2
                WHEN a.attname = 'last_updated_by' THEN 3
                WHEN a.attname = 'last_updated_date' THEN 4
                ELSE a.attnum
            END
    )
    INTO columns_sql
    FROM pg_attribute a
    WHERE a.attrelid = rel_oid
      AND a.attnum > 0
      AND NOT a.attisdropped;

    IF columns_sql IS NULL THEN
        RAISE EXCEPTION 'No selectable columns found for %.%', schema_name, table_name;
    END IF;

    EXECUTE 'DROP TABLE IF EXISTS pg_temp.pgadmin_top100';

    EXECUTE format(
        'CREATE TEMP TABLE pgadmin_top100 AS SELECT %s FROM %I.%I LIMIT 100',
        columns_sql,
        schema_name,
        table_name
    );
END
$pgadmin_top100$;

SELECT *
FROM pg_temp.pgadmin_top100;