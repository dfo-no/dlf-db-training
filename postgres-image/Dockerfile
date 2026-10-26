FROM postgres:18.0-alpine3.22

USER root
RUN mkdir -p /var/pg_logs/ \
    && chmod 764 /var/pg_logs/ \
    && chown postgres:postgres /var/pg_logs/

# Keep the seed outside PGDATA so it travels with the image, even when the
# database directory is mounted as an empty volume on another machine.
COPY data/dump-stackoverflow2010-202408101013.sql /opt/seed/stackoverflow2010.dump
COPY docker-entrypoint-initdb.d/ /docker-entrypoint-initdb.d/
COPY postgresql.conf /etc/postgresql/postgresql.conf

# Normalize shell scripts created on Windows.
RUN find /docker-entrypoint-initdb.d -name '*.sh' -exec sed -i 's/\r$//' {} \; \
    && chmod +x /docker-entrypoint-initdb.d/*.sh

# The temporary initialization server only accepts Unix socket connections.
# TCP readiness therefore waits for the full restore and ANALYZE to finish.
HEALTHCHECK --interval=10s --timeout=5s --start-period=30m --retries=5 \
    CMD pg_isready -h 127.0.0.1 -p "${PGPORT:-5432}" -U "${POSTGRES_USER:-postgres}" -d stackoverflow2010

# Preserve the official entrypoint (including password-file support and command
# overrides) while providing a usable default configuration inside the image.
CMD ["postgres", "-c", "config_file=/etc/postgresql/postgresql.conf"]
