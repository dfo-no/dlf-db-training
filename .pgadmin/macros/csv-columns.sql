
DO $pgadmin_cols_with_alias$
DECLARE
    raw_sel text := trim(both E' \n\r\t;' from '$SELECTION$');

    table_part text;
    alias_part text;
    matches text[];

    clean_table text;
    rel_oid oid;

    schema_name text;
    table_name text;

    columns_sql text;
    use_alias boolean := true;
BEGIN
    /*
        Try parsing: table [AS] alias
    */
    matches := regexp_match(
        raw_sel,
        '^\s*(.+?)\s+(?:as\s+)?(\S+)\s*$',
        'i'
    );

    IF matches IS NOT NULL THEN
        table_part := trim(matches[1]);
        alias_part := replace(trim(matches[2]), '"', '');
    ELSE
        /*
            No alias → treat entire selection as table
        */
        table_part := raw_sel;
        alias_part := NULL;
        use_alias := false;
    END IF;

    clean_table := replace(table_part, '"', '');

    /*
        Resolve table/view
    */
    rel_oid := COALESCE(
        to_regclass(table_part),
        to_regclass(clean_table)
    );

    IF rel_oid IS NULL THEN
        SELECT c.oid
        INTO rel_oid
        FROM pg_class c
        JOIN pg_namespace n
            ON n.oid = c.relnamespace
        WHERE c.relkind IN ('r', 'p', 'v', 'm', 'f')
          AND (
                c.relname = clean_table
                OR (n.nspname || '.' || c.relname) = clean_table
              )
        ORDER BY
            CASE
                WHEN n.nspname = current_schema() THEN 0
                ELSE 1
            END,
            n.nspname
        LIMIT 1;
    END IF;

    IF rel_oid IS NULL THEN
        RAISE EXCEPTION 'Could not resolve object: %', table_part;
    END IF;

    SELECT n.nspname, c.relname
    INTO schema_name, table_name
    FROM pg_class c
    JOIN pg_namespace n
        ON n.oid = c.relnamespace
    WHERE c.oid = rel_oid;

    /*
        Build column list
        - Audit columns last
        - With or without alias
    */
    SELECT string_agg(
        CASE
            WHEN use_alias THEN format('%I.%I', alias_part, a.attname)
            ELSE format('%I', a.attname)
        END,
        ', '
        ORDER BY
            /* Push audit columns to the end */
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
        RAISE EXCEPTION 'No columns found for %.%', schema_name, table_name;
    END IF;

    /*
        Store result in temp table (copy-friendly)
    */
    EXECUTE 'DROP TABLE IF EXISTS pg_temp.pgadmin_cols';

    EXECUTE format(
        'CREATE TEMP TABLE pg_temp.pgadmin_cols AS SELECT %L AS columns_list',
        columns_sql
    );

END
$pgadmin_cols_with_alias$;

/*
    Output for easy copying
*/
SELECT columns_list
FROM pg_temp.pgadmin_cols;