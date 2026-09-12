# Foundation-01 browser E2E

This package runs the browser acceptance slice against a real Store PWA build,
the Spring Boot backend and an ephemeral PostgreSQL 17 database. It does not
mock API calls. The only controlled network failure is the retry test, where
the first committed response is discarded before the browser receives it.

The database seed is synthetic and local-only. It creates two store managers,
one employee, one unassigned `CHAIN_ADMIN`, three stores and one current
published catalog with a primary supplier. The backend itself has no demo-user
bootstrap path.

## Run

Use three terminals from the repository root. The commands below intentionally
use a separate database name, port and Docker container so an existing local
database is not selected by accident.

```bash
docker run --rm --name coopfood-kph-foundation-01-postgres -e POSTGRES_DB=coopfood_kph_e2e -e POSTGRES_USER=kph_e2e -e POSTGRES_PASSWORD=local-e2e-only -p 55432:5432 postgres:17-alpine
```

Wait for PostgreSQL to report ready, then start the backend. Flyway creates the
schema on first boot.

```bash
env KPH_DATABASE_URL=jdbc:postgresql://127.0.0.1:55432/coopfood_kph_e2e KPH_DATABASE_USERNAME=kph_e2e KPH_DATABASE_PASSWORD=local-e2e-only KPH_MEDIA_ROOT=/tmp/coopfood-kph-foundation-01-media ./backend/mvnw -f backend/pom.xml spring-boot:run
```

After the health endpoint is available, seed the database:

```bash
./e2e/scripts/seed-foundation-01.sh
```

Start the online Store PWA on the origin configured by the integration owner.
The Vite dev server must proxy `/api` to `http://127.0.0.1:8080`, or the final
build must provide the equivalent same-origin/API-base configuration.

```bash
VITE_KPH_ONLINE=true npm --workspace @coopfood-kph/store-pwa run dev -- --host 127.0.0.1 --port 4173
```

Install the E2E package dependencies without changing the root lockfile, then
run both Chromium viewports:

```bash
npm ci --prefix e2e --ignore-scripts
npx --prefix e2e playwright install chromium
E2E_APP_URL=http://127.0.0.1:4173 E2E_BACKEND_URL=http://127.0.0.1:8080 npm --prefix e2e test
```

The suite runs a desktop table project and a 390×844 mobile card project. The
retry test records the two request headers and verifies that the same
idempotency key produces exactly one server record after the first response is
lost. Playwright traces, screenshots and the HTML report are written below
`e2e/artifacts/` and are disposable evidence.

The fixed seed credentials are only for this local database:

| Username | Password | Membership |
| --- | --- | --- |
| `manager.e2e` | `manager-e2e-password` | `0001` and `0002`, `STORE_MANAGER` |
| `employee.e2e` | `employee-e2e-password` | `0001`, `EMPLOYEE` |
| `chain-admin.e2e` | `admin-e2e-password` | no store membership; `CHAIN_ADMIN` |

Re-run the seed script before a fresh acceptance run. It truncates the
Foundation-01 tables only after the script's loopback E2E URL guard passes.
Do not point it at a shared, staging or production database.

If the host has no `psql`, use the client inside the disposable container after
Flyway has created the schema:

```bash
docker exec -i coopfood-kph-foundation-01-postgres psql -U kph_e2e -d coopfood_kph_e2e -v ON_ERROR_STOP=1 < e2e/seed/foundation-01.sql
```

On machines with multiple JDKs, set `JAVA_HOME` to a Java 21 installation before
running Maven. To keep a stable browser preview while `npm run verify` rebuilds
its default output, build online into a separate directory and preview that output:

```bash
VITE_KPH_ONLINE=true npm --workspace @coopfood-kph/store-pwa run build -- --outDir "$PWD/.local/online-dist"
npm --workspace @coopfood-kph/store-pwa exec -- vite preview --host 127.0.0.1 --port 4173 --strictPort --outDir "$PWD/.local/online-dist"
```

The default suite has five applicable cases: two desktop creation flows, one mobile card flow and
one membership/session case repeated across both projects (five executions in total).
Three project/case combinations are intentionally skipped by viewport. This is
Chromium viewport coverage, not real-device iPhone acceptance.

## Visual review with fixtures

For a UI-only review, start the online Vite server above, then run from the repo
root: `node e2e/scripts/review-ui.cjs`. Override `UI_REVIEW_URL` for another local
preview origin. This separate script mocks API responses from synthetic OpenAPI
examples; it does not replace the real-backend suite or owner acceptance.
It checks login isolation, keyboard entry, browser errors, page/dialog overflow
and form dismissal, and saves six viewport screenshots plus form views under
`.local/verification/ui-after-*.png` for visual inspection.
