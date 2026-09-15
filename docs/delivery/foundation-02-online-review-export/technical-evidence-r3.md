# Technical evidence — Foundation-02 revision 3

- Candidate: `d2fb72ebb6cba65018bacaef993c21163dfcce7c`
- Plan revision: `3`
- Verified: `2026-09-15`, timezone `Asia/Ho_Chi_Minh`

## Integrated checks

1. `npm run verify` — **PASS**
   - Documentation, Contract Lock and generated OpenAPI types passed.
   - All workspace typechecks passed.
   - 138 frontend/package tests passed: Admin Web 1, Store PWA 109, generated
     API 2, KPH rules 19 and UI 7.
   - Admin Web and Store PWA production builds passed.
2. `env E2E_APP_URL=http://127.0.0.1:4174 E2E_BACKEND_URL=http://127.0.0.1:8080 npm --prefix e2e test`
   against a clean Vite process, the real Spring Boot API and disposable
   PostgreSQL 17 — **PASS**
   - 6 applicable browser executions passed; 4 viewport-specific combinations
     were intentionally skipped.
   - Desktop verified automatic two-bound filtering, a `detectedFrom`-only
     request, approval and authorized Excel download.
   - Mobile verified both fields inside the existing filter dialog, automatic
     filtering, active-state feedback and the responsive card flow.
3. `node e2e/scripts/review-ui.cjs` with reduced motion — **PASS**
   - Verified desktop 1440×1000, tablet 768×1024, mobile 390×844, small
     320×740 and landscape 667×375 plus login states.
   - No horizontal overflow or browser runtime errors. Screenshots were
     inspected after the final responsive adjustment: the range remains one
     row through 390px/landscape and stacks with the arrow between fields at
     320px so complete dates remain operable.

## Reused unaffected evidence

Revision 3 changes Store PWA interaction/layout, frontend/browser tests and
product/cycle documentation only. OpenAPI, generated API, backend code and V5
migration are unchanged, so the 39-test backend suite recorded in
[technical-evidence.md](technical-evidence.md) remains applicable. The browser
suite exercised the unchanged backend authorization and date-query behavior.

## Known limitations

- Store PWA build retains the existing large-chunk warnings for the main bundle
  and ExcelJS; build and PWA precache complete successfully.
- Visual QA uses Chromium viewports, not a physical iPhone.
- This is local technical verification, not remote CI, production deployment or
  owner acceptance.
