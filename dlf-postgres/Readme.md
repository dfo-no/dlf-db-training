# Stackoverflow 2010 course database
The database is based on a 2010 export of Stackoverflow's database

## Init scripts
Init scripts are located under the docker-entrypoint-initdb.d folder.
Currently one for loading in the extensions we want to use and one for creating the Planet9 database.

## Expectations
Postgres expects to find the configuration file at /etc/postgresql/postgresql.conf
If it does not find the file it will crash. For use in K8s you can add it through a config map.

## Credits
The database is a dump from [StackOverflow.com's](https://stackoverflow.com/) and the database dump was constructed by Brent Ozar
If you're looking for more Postgres courses check out his [website](https://www.brentozar.com/archive/category/postgresql/)