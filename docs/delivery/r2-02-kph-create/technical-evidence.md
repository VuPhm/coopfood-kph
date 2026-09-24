# R2-02 technical evidence

Status: candidate technically ready for owner review, revision 1. Candidate:
`1e6c8102c983b5654aa6f596fa6756e36dd94529`. Base:
`4fab6889f6cc6a7b66d25806262329cbf88ea024`, the merge of accepted R2-01
into `main` (also pushed to `origin/main`) before R2-02 application edits.

## Implemented boundary

- Online TPCN/TPTS create retains the continuous form and existing scanner/media
  infrastructure. Barcode lookup now exposes distinct busy, `FOUND`, `NOT_FOUND`,
  `CATALOG_UNAVAILABLE`, and generic error/retry states. A found product's name
  and supplier are read-only because the backend uses the catalog snapshot.
- Online review appears inside the form after validation. It names account,
  store, type, lookup result, details, and ordered 1–3 photos; inspection opens
  the existing viewer. Review does not POST. Editing invalidates review; explicit
  “Gửi phiếu” submits. A catalog outage on submit returns to recovery. Pilot's
  existing direct save path remains available.
- No OpenAPI, generated client, backend, migration, KPH rules, `packages/ui`,
  shell, or Pages changes.

## Commands and results

| Check | Result |
| --- | --- |
| `node tooling/skills/delivery-cycle/scripts/cycle.mjs check --repo "$PWD" --plan docs/delivery/r2-02-kph-create/plan.json --phase dispatch` | PASS before application edits, plan checkpoint `34b81e5` |
| `npm --workspace @coopfood-kph/store-pwa run test -- --run create-record-dialog.test.tsx app.online.identity.test.tsx` | PASS, 33 focused/component tests |
| `npm run verify` | PASS on candidate tree: docs, 23-resource/15-example Contract Lock, generated API drift, TypeScript, 173 tests (14 Admin, 131 Store PWA, 2 API, 19 rules, 7 UI), and builds |
| `VITE_KPH_ONLINE=true npm --workspace @coopfood-kph/store-pwa run build` | PASS after candidate commit; online preview build |
| `node e2e/scripts/review-r2-02-create.cjs` | PASS phone 390×844 and desktop 1440×1000 against synthetic API responses; no page errors or horizontal page overflow |
| `node --check e2e/scripts/review-r2-02-create.cjs` and `node --check e2e/scripts/serve-r2-02-synthetic-api.cjs`; `git diff --check` | PASS |

The browser script checks scanner-to-manual recovery, `FOUND`, catalog outage
then `NOT_FOUND` retry, type-specific review, inspectable photo rendering,
ordered 1/3-photo multipart names, the no-POST-before-review boundary, and the
POST after explicit submit. Screenshots: [phone FOUND](phone-found-review.png),
[phone NOT_FOUND](phone-not-found-review.png),
[desktop FOUND](desktop-found-review.png), and
[desktop NOT_FOUND](desktop-not-found-review.png).

An interactive synthetic preview also passed a Chromium smoke check of shell,
lookup, and submit at <http://127.0.0.1:4177/>. It serves fixture session and
catalog data and stores newly created synthetic records only in memory. Start it
after an online build with `node e2e/scripts/serve-r2-02-synthetic-api.cjs` from
the repository root. Restart the server to reset the one-time
`UNAVAILABLE-CREATE` response.

## Limits and risk

Docker was unavailable (`docker info`: cannot connect to the OrbStack socket),
so this candidate has no newly run real-backend/PostgreSQL browser E2E. The
existing real-backend Foundation browser spec was updated for the new review
boundary but not rerun. The running Java process on port 8080 belongs to another
checkout and was not used or mutated. Browser camera permission and interruption
behavior on a physical device, real photo upload/private derivatives, and HEIC
remain separate acceptance evidence. Existing backend authority, store scope,
private media, and idempotency code was not changed; this run does not replace
their backend integration evidence. The existing large bundle warning remains.

Technical readiness means this bounded UI/browser candidate is ready for owner
task review. Owner acceptance has not been inferred.
