#!/bin/sh
# Start PostgreSQL with config file
if [ -f "/etc/postgresql/postgresql.conf" ]; then
    exec docker-entrypoint.sh postgres -c config_file=/etc/postgresql/postgresql.conf
else
    echo "ERROR: Config file not found at /etc/postgresql/postgresql.conf"
    exit 1
fi