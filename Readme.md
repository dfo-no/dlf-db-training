# DLF database training

```sh
deno task docker_up
```

Requires Deno, Docker Compose and Azure CLI. Sign in once, or when expired:

```sh
az login --tenant 58394619-30dc-4e7e-8fa0-469bb91815ec
```

Postgres is pulled from Azure; the backend and frontend are built locally. The
first database restore can take a while.

React opens to: `http://localhost:3000` 
It uses the backends `GET /users` endpoint. 

`http://localhost:5001/health` checks the API and database connection. Stop with
`docker compose down` (database data is kept).

pgAdmin starts with the stack at `http://localhost:16081`. Log in with
`pgadmin@dfo.no` / `pgadmin`; the training server is preconfigured. See
[.pgadmin/pgadmin.md](.pgadmin/pgadmin.md) for the shared SQL macros.

For another database client, connect with:
| Setting              | Default             |
| -------------------- | ------------------- |
| Host                 | `localhost`         |
| Port                 | `5432`              |
| Maintenance database | `stackoverflow2010` |
| Username             | `postgres`          |
| Password             | `postgres`          |

