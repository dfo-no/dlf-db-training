# pgAdminStack

Start with `deno task docker_up` from the repository root. Open
http://localhost:16081 and log in with `pgadmin@dfo.no` / `pgadmin`. The Stack
Overflow 2010 server is preconfigured, including its database password.

Settings come from the root `.env`: `PGADMIN_PORT`, `PGADMIN_PASSWORD`,
`POSTGRES_USER` and `POSTGRES_PASSWORD`. Saved pgAdmin files use a separate
named volume. `docker compose down` keeps this data.

With pgAdmin running, use these tasks from `.pgadmin`:

```sh
deno task import-macros
deno task generate-macros
```

The first imports the four shared macros; the second exports your macros back to
`macros/`. Select a table name such as `public.users` in the Query Tool and use
Ctrl+2 (top 100), Ctrl+3 (column definitions), Ctrl+4 (column list), or Ctrl+5
(indexes).
