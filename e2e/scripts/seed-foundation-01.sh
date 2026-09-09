#!/usr/bin/env bash
set -euo pipefail

script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
seed_file="${script_dir}/../seed/foundation-01.sql"

e2e_database_url="${E2E_DATABASE_URL:-postgresql://kph_e2e:local-e2e-only@127.0.0.1:55432/coopfood_kph_e2e}"

case "${e2e_database_url}" in
  postgresql://kph_e2e:local-e2e-only@127.0.0.1:55432/coopfood_kph_e2e|\
  postgresql://kph_e2e:local-e2e-only@localhost:55432/coopfood_kph_e2e)
    ;;
  *)
    printf '%s\n' "Refusing to seed an unapproved database URL. Use the documented local E2E PostgreSQL." >&2
    exit 2
    ;;
esac

command -v psql >/dev/null 2>&1 || {
  printf '%s\n' "psql is required to seed Foundation-01." >&2
  exit 1
}

psql "${e2e_database_url}" -v ON_ERROR_STOP=1 -f "${seed_file}"
