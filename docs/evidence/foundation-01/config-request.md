# Foundation-01 E2E integration request

Team C has prepared the browser harness at `e2e/` from checkpoint
`2c456ea23f690a9c0cb353331e934b54906b4019`. The following inputs are required
from the integration owner before the official run:

1. Integrate the final Team A and Team B commits into one SHA, then send that
   SHA to Team C. Acceptance must be reported against that SHA; the checkpoint
   and mock/component tests are not an acceptance substitute.
2. Keep the runtime matrix at Java 21, PostgreSQL 17 and jOOQ OSS 3.20.17. Run
   Flyway against a fresh database before applying
   `e2e/seed/foundation-01.sql`.
3. Provide a same-origin browser path from the Store PWA origin to the backend
   `/api` routes. The harness defaults to `http://127.0.0.1:4173` for the app
   and `http://127.0.0.1:8080` for direct evidence requests. If the integrated
   frontend uses a different origin, set `E2E_APP_URL` and `E2E_BACKEND_URL` and
   keep the browser API calls authenticated by the `KPH_SESSION` cookie.
4. Build the online frontend with `VITE_KPH_ONLINE=true`. The login UI must
   expose accessible username/password fields and a login action; a session
   with two memberships must expose a store picker so the test can move between
   `0001` and `0002`.
5. Install `@playwright/test` 1.62.0 and the Chromium browser in the `e2e`
   package. Do not add it to the root workspace or root lockfile as part of
   Team C's slice.
6. Give the backend a disposable local `KPH_MEDIA_ROOT` and keep the seed
   credentials limited to the synthetic E2E database. No production account or
   real image/data may be added.

The seed supplies `FOUND` barcode `0890123456789`, `NOT_FOUND` barcode
`0000000000000`, manager memberships in stores `0001`/`0002`, an employee in
`0001`, and an unassigned `CHAIN_ADMIN` for the authorization checks.
