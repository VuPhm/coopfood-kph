# Technical evidence — Foundation-02 revision 2

- Candidate: `ba95608ae468bd85c98f3ea94cc9411912308e4c`
- Runtime/UI commit: `7f58a80746af89855204fe10d6886fce0b577e2a`
- Plan revision: `2`
- Verified: `2026-09-15`, timezone `Asia/Ho_Chi_Minh`

## Integrated checks

1. `npm run verify` on the runtime/UI commit — **PASS**
   - Documentation, fixture and Contract Lock checks passed with 14 manifest
     resources and 7 API fixtures.
   - Generated OpenAPI types were clean; every workspace typecheck passed.
   - 138 frontend/package tests passed: Admin Web 1, Store PWA 109, generated
     API 2, KPH rules 19 and UI 7.
   - Admin Web and Store PWA production builds passed.
2. `env E2E_APP_URL=http://127.0.0.1:4173 E2E_BACKEND_URL=http://127.0.0.1:8080 npm --prefix e2e test`
   on the exact runtime/UI commit, using a disposable PostgreSQL 17 database and the
   real Spring Boot backend — **PASS**
   - 6 applicable browser scenarios passed; 4 project-specific scenarios were
     intentionally skipped.
   - Desktop retained inclusive date filtering, approval and authorized Excel
     download.
   - Mobile confirmed that the standalone date block is hidden, both date fields
     are present in the existing “Lọc & sắp xếp” dialog, applying the range
     closes the dialog, marks the filter trigger active and preserves the record.
3. `node e2e/scripts/review-ui.cjs` with reduced motion — **PASS**
   - Verified 1440x1000, 768x1024, 390x844, 375x812, 320x740 and mobile
     landscape 667x375, plus login states.
   - No page or dialog horizontal overflow and no browser runtime errors.
   - Screenshots were manually inspected: desktop/tablet use one compact row;
     mobile/small/landscape place the date range first in the scrollable filter
     dialog with readable labels, 44 px date fields and an explicit apply action.
4. `npm run check:docs` on final candidate
   `ba95608ae468bd85c98f3ea94cc9411912308e4c` — **PASS**
   - The final candidate differs from the verified runtime/UI commit only in
     `docs/CURRENT_STATE.md` and `docs/NEXT.md`, which record the completed
     verification and awaiting-acceptance status. Runtime and test sources are
     byte-identical.

## Reused unaffected evidence

The revision 2 diff changes only Store PWA layout/tests and product/cycle docs;
OpenAPI, generated API, backend code and V5 migration are unchanged from revision
1 candidate `40a6b17c6cbc5ab8f2991caad065a30922bc1e57`. Therefore the 39-test backend
suite recorded in [technical-evidence.md](technical-evidence.md) remains applicable.
The exact revision 2 candidate also booted the real backend, applied migrations
V1–V5 to a clean PostgreSQL database and exercised role/store checks through E2E.

## Known limitations

- Store PWA build retains the existing large-chunk warnings for the main bundle
  and ExcelJS; build and PWA precache complete successfully.
- The product currently has a light-only visual baseline; dark-mode parity is not
  introduced by this bounded layout correction.
- This is local technical verification, not remote CI, production deployment or
  owner acceptance.
