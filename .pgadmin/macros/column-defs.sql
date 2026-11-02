
WITH selected AS (
    SELECT
        trim(both E' \n\r\t;' from '$SELECTION$') AS raw_ref,
        replace(trim(both E' \n\r\t;' from '$SELECTION$'), '"', '') AS clean_ref
),

parsed AS (
    SELECT
        raw_ref,
        clean_ref,
        CASE WHEN clean_ref LIKE '%.%' THEN split_part(clean_ref, '.', 1) END AS selected_schema,
        CASE
            WHEN clean_ref LIKE '%.%' THEN split_part(split_part(clean_ref, '.', 2), '(', 1)
            ELSE split_part(clean_ref, '(', 1)
        END AS selected_name,
        CASE
            WHEN clean_ref LIKE '%(%)'
                THEN regexp_replace(substring(clean_ref from '\((.*)\)$'), '\s+', '', 'g')
        END AS selected_args
    FROM selected
),

resolved_relation AS (
    SELECT
        c.oid,
        n.nspname AS schema_name,
        c.relname AS object_name,
        c.relkind
    FROM parsed p
    JOIN pg_class c ON c.relname = p.selected_name
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind IN ('r','p','v','m','f')
      AND (p.selected_schema IS NULL OR n.nspname = p.selected_schema)
    ORDER BY
        CASE
            WHEN p.selected_schema IS NOT NULL THEN 0
            WHEN n.nspname = current_schema() THEN 1
            ELSE 2
        END
    LIMIT 1
),

resolved_routine AS (
    SELECT
        pr.oid,
        n.nspname AS schema_name,
        pr.proname AS object_name,
        pg_get_function_identity_arguments(pr.oid) AS arguments,
        pr.prorettype,
        pr.proretset,
        pr.proallargtypes,
        pr.proargmodes,
        pr.proargnames,
        pr.proargtypes
    FROM parsed p
    JOIN pg_proc pr ON pr.proname = p.selected_name
    JOIN pg_namespace n ON n.oid = pr.pronamespace
    WHERE (p.selected_schema IS NULL OR n.nspname = p.selected_schema)
      AND (
            p.selected_args IS NULL
         OR regexp_replace(pg_get_function_identity_arguments(pr.oid), '\s+','','g') = p.selected_args
         OR regexp_replace(pg_catalog.oidvectortypes(pr.proargtypes), '\s+','','g') = p.selected_args
      )
    ORDER BY
        CASE
            WHEN p.selected_schema IS NOT NULL THEN 0
            WHEN n.nspname = current_schema() THEN 1
            ELSE 2
        END
    LIMIT 1
),

-- ✅ INPUT (FINAL FIX HERE)
routine_input_args AS (
    SELECT
        rr.oid,
        format('%I.%I(%s)', rr.schema_name, rr.object_name, rr.arguments) AS object_name,
        i AS ordinal_position,
        COALESCE(NULLIF(argnames[i], ''),'arg_'||i) AS column_name,
        format_type(argtypes[i]::regtype, NULL) AS data_type,
        'IN' AS direction,
        '[NA]' AS is_nullable,
        '[NA]' AS is_primary_key,
        '[NA]' AS column_default,
        1 AS audit_sort,
        i AS column_sort
    FROM resolved_routine rr
    CROSS JOIN LATERAL (
        SELECT
            COALESCE(rr.proargnames, ARRAY[]::text[]) AS argnames,
            string_to_array(
                replace(pg_catalog.oidvectortypes(rr.proargtypes), ',', ''),
                ' '
            ) AS argtypes
    ) s
    CROSS JOIN generate_subscripts(s.argtypes,1) AS i
),

routine_out_args AS (
    SELECT
        rr.oid,
        format('%I.%I(%s)', rr.schema_name, rr.object_name, rr.arguments) AS object_name,
        x.ord AS ordinal_position,
        COALESCE(NULLIF(x.arg_name,''),'column_'||x.ord) AS column_name,
        format_type(x.arg_type,NULL) AS data_type,
        CASE x.arg_mode
            WHEN 'o' THEN 'OUT'
            WHEN 'b' THEN 'INOUT'
            WHEN 't' THEN 'TABLE'
        END AS direction,
        '[NA]' AS is_nullable,
        '[NA]' AS is_primary_key,
        '[NA]' AS column_default,
        2 AS audit_sort,
        x.ord AS column_sort
    FROM resolved_routine rr
    JOIN LATERAL (
        SELECT *
        FROM unnest(
            rr.proallargtypes,
            rr.proargmodes,
            COALESCE(rr.proargnames, ARRAY[]::text[])
        ) WITH ORDINALITY
    ) x(arg_type,arg_mode,arg_name,ord) ON true
    WHERE rr.proallargtypes IS NOT NULL
      AND x.arg_mode IN ('o','b','t')
),

routine_composite_return AS (
    SELECT
        rr.oid,
        format('%I.%I(%s)', rr.schema_name, rr.object_name, rr.arguments) AS object_name,
        a.attnum AS ordinal_position,
        a.attname AS column_name,
        format_type(a.atttypid,a.atttypmod) AS data_type,
        'RETURN' AS direction,
        '[NA]' AS is_nullable,
        '[NA]' AS is_primary_key,
        '[NA]' AS column_default,
        3 AS audit_sort,
        a.attnum AS column_sort
    FROM resolved_routine rr
    JOIN pg_type t ON t.oid=rr.prorettype
    JOIN pg_class c ON c.oid=t.typrelid
    JOIN pg_attribute a ON a.attrelid=c.oid
    WHERE t.typtype='c' AND a.attnum>0 AND NOT a.attisdropped
),

routine_scalar_return AS (
    SELECT
        rr.oid,
        format('%I.%I(%s)', rr.schema_name, rr.object_name, rr.arguments) AS object_name,
        1 AS ordinal_position,
        'return_value' AS column_name,
        format_type(rr.prorettype,NULL) AS data_type,
        'RETURN' AS direction,
        '[NA]' AS is_nullable,
        '[NA]' AS is_primary_key,
        '[NA]' AS column_default,
        3 AS audit_sort,
        1 AS column_sort
    FROM resolved_routine rr
    WHERE rr.prorettype <> 'pg_catalog.void'::regtype
      AND NOT EXISTS (SELECT 1 FROM routine_out_args x WHERE x.oid=rr.oid)
      AND NOT EXISTS (SELECT 1 FROM routine_composite_return x WHERE x.oid=rr.oid)
      AND NOT EXISTS (SELECT 1 FROM routine_input_args x WHERE x.oid=rr.oid)
),

relation_columns AS (
    SELECT
        rr.oid,
        format('%I.%I', rr.schema_name, rr.object_name) AS object_name,
        a.attnum AS ordinal_position,
        a.attname AS column_name,
        format_type(a.atttypid,a.atttypmod) AS data_type,
        'COLUMN' AS direction,
        CASE WHEN a.attnotnull THEN 'NO' ELSE 'YES' END AS is_nullable,
        CASE
            WHEN EXISTS (
                SELECT 1 FROM pg_constraint con
                WHERE con.conrelid=rr.oid AND con.contype='p'
                  AND a.attnum=ANY(con.conkey)
            ) THEN 'YES' ELSE 'NO'
        END AS is_primary_key,
        COALESCE(pg_get_expr(ad.adbin,ad.adrelid),'[NA]') AS column_default,
        0 AS audit_sort,
        a.attnum AS column_sort
    FROM resolved_relation rr
    JOIN pg_attribute a ON a.attrelid=rr.oid
    LEFT JOIN pg_attrdef ad ON ad.adrelid=a.attrelid AND ad.adnum=a.attnum
    WHERE a.attnum>0 AND NOT a.attisdropped
)

SELECT
    object_name,
    column_name,
    data_type,
    direction,
    is_nullable,
    is_primary_key,
    column_default
FROM (
    SELECT object_name, column_name, data_type, direction, is_nullable, is_primary_key, column_default, audit_sort, column_sort FROM relation_columns
    UNION ALL
    SELECT object_name, column_name, data_type, direction, is_nullable, is_primary_key, column_default, audit_sort, column_sort FROM routine_input_args
    UNION ALL
    SELECT object_name, column_name, data_type, direction, is_nullable, is_primary_key, column_default, audit_sort, column_sort FROM routine_out_args
    UNION ALL
    SELECT object_name, column_name, data_type, direction, is_nullable, is_primary_key, column_default, audit_sort, column_sort FROM routine_composite_return
    UNION ALL
    SELECT object_name, column_name, data_type, direction, is_nullable, is_primary_key, column_default, audit_sort, column_sort FROM routine_scalar_return
) x
ORDER BY object_name, audit_sort, column_sort;