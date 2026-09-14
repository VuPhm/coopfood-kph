# Technical evidence — Foundation-02 online review/export

- Candidate: `40a6b17c6cbc5ab8f2991caad065a30922bc1e57`
- Plan revision: `1`
- Verified: `2026-09-15`, timezone `Asia/Ho_Chi_Minh`

## Integrated checks

1. `npm run verify` — **PASS**
   - Documentation and fixture checks passed.
   - Contract lock passed with 14 manifest resources and 7 API fixtures.
   - Generated OpenAPI TypeScript schema was clean at the candidate.
   - Type checks passed for all workspaces.
   - 138 frontend/package tests passed: Admin Web 1, Store PWA 109,
     generated API 2, KPH rules 19 and UI 7.
   - Production builds passed for Admin Web and Store PWA.
2. `env DOCKER_HOST=unix:///Users/vup/.orbstack/run/docker.sock ./mvnw -q test`
   from `backend/` — **PASS**
   - 39 tests passed, 0 failures, 0 errors, 0 skipped.
   - Flyway was verified both from an empty database and as a V1-to-V5 upgrade.
   - PostgreSQL-backed integration tests covered inclusive date filtering,
     invalid ranges, manager-only review/export, idempotent review, history and
     audit events, and denial for unauthorized roles/store scopes.
3. `env E2E_APP_URL=http://127.0.0.1:4173 E2E_BACKEND_URL=http://127.0.0.1:8080 npm --prefix e2e test`
   against a disposable PostgreSQL 17 database and the real Spring Boot backend
   — **PASS**
   - 6 applicable browser scenarios passed; 4 scenarios were intentionally
     skipped on the non-applicable desktop/mobile project.
   - The new desktop scenario created a record, filtered it using an inclusive
     detected-date range, hid it with an out-of-range lower bound, cleared the
     filter, approved the record and downloaded the authorized workbook.
   - Permission scenarios confirmed that `EMPLOYEE` cannot approve and an
     unassigned `CHAIN_ADMIN` cannot export for the store.

## Visual verification

`node e2e/scripts/review-ui.cjs` passed at 1440x1000, 768x1024, 390x844,
375x812 and 320x740, including the online history date controls. The date fields
remain readable and stacked at narrow widths. A pre-existing fixed expiry action
can transiently overlap content at 320 px; this change did not introduce or
worsen that behavior.

## Known limitations

- Store PWA production build still reports the existing large-chunk warnings
  (main bundle and ExcelJS); build output is valid and the PWA precache succeeds.
- This evidence is local technical verification. It does not prove remote CI,
  production deployment or owner acceptance.

