#!/bin/bash
set -euo pipefail
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" --set=app_password="$JARVIS_DB_PASSWORD" <<'SQL'
CREATE ROLE jarvis_app LOGIN PASSWORD :'app_password';
GRANT CONNECT ON DATABASE jarvis TO jarvis_app;
GRANT USAGE ON SCHEMA public TO jarvis_app;
ALTER DEFAULT PRIVILEGES FOR ROLE jarvis_owner IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO jarvis_app;
ALTER DEFAULT PRIVILEGES FOR ROLE jarvis_owner IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO jarvis_app;
SQL
