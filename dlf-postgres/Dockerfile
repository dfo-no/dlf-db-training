FROM postgres:18.0-alpine3.22

USER root
RUN mkdir /var/pg_logs/
RUN chmod -R 764 /var/pg_logs/ && chown -R postgres:postgres /var/pg_logs/


COPY docker-entrypoint-initdb.d/ docker-entrypoint-initdb.d/

COPY startup-wrapper.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/startup-wrapper.sh

# Building on Windows adds line ends to bash script.
RUN sed -i 's/\r$//' /usr/local/bin/startup-wrapper.sh

ENTRYPOINT ["/usr/local/bin/startup-wrapper.sh"]