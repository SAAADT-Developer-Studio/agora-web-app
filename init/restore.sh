#!/bin/bash
set -e

# Wait for the postgres server to be ready
echo "Restoring dump into database $POSTGRES_DB..."
pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" /docker-entrypoint-initdb.d/prod_dump.dump

pg_restore --dbname="postgresql://myuser:mypass@localhost:5432/mydb" --no-owner init/prod_dump.dump