# Figma mobile implementation — review handoff

Date: 03/10/2026. Technical verification PASS; owner visual acceptance pending.

## Candidate and ownership

- Branch: `store-app/figma-mobile-implementation`.
- Worktree: `/Users/vup/Documents/coopfood-kph`; root is the sole writer.
- Base HEAD: `4fab6889f6cc6a7b66d25806262329cbf88ea024`.
- Candidate is the **uncommitted working tree**, not that baseline commit. The
  pre-existing dirty changes remain, including UI tokens/package exports,
  expiry workbench and the inactive UI DNA prototype source. Do not attribute
  those earlier changes to this implementation or discard them on handoff.
- No agent dispatch, merge, push, deployment or protected Pages change.

## What was implemented

Source: [03 Screens](https://www.figma.com/design/aEDpXtz0IiEkPiVucqjQ3Q?node-id=18-99).
Structured context and screenshots were read for Home `21:3`, Shelf Life
`21:56`, KPH `21:91`, DATE `21:144`; KPH filter/export/selection/paging
`124:384`, `124:445`, `128:494`, `141:641`; creation `203:701`, `203:847`,
`209:895`, viewer `215:1147`, review `279:1299`, scanner `279:1398`;
not-found/unavailable/other/send-error `280:1377`, `280:1571`, `280:1773`,
`280:1915`. No Figma frames were changed.

The Store App has module navigation, shelf-life calculation, KPH creation and
review/edit/send, lookup/manual fallback, scanner, evidence viewer, history
filter/selection/page controls, detail/review and actual Excel download. DATE
search/tabs/filter/acknowledge/resolve use synthetic lots. Back navigation was
added to module headers so the web implementation has a direct Home action.
Header text is allowed to fit instead of copying Figma's clipped text containers.
Rejected approval remains available because it is an accepted business state.

The accepted form validation, KPH option matrix, read-only business date,
photo cap/order, calendar, scanner and workbook builder are reused. The new
`presentation="screen"` option adds full-screen mobile composition and a review
step; the existing dialog presentation retains its behavior. A send failure
keeps the draft/photos and retry idempotency key.

Mock data is memory-only. `npm run dev --workspace @coopfood-kph/store-pwa`
opens the new UI by default, with no API writes. Set `VITE_STORE_APP_MOCK=false`
to use the existing online app. Production builds default to the existing online
entry; a mock build requires explicit `VITE_STORE_APP_MOCK=true`. This is an
implementation with a temporary fixture boundary; the old `/ui-dna-prototype`
entry is no longer rendered. Desktop is responsive composition pending the
owner's desktop designs, not a claim of desktop Figma parity.

## Icon follow-up

Owner direction received through the review chat requested replacing placeholder
square artwork with functional icons. `lucide-react` already installed in the
repo supplies `UserRound` for account, `Search` for DATE search and `ScanLine`
for DATE scan. Calendar fields reuse the existing `CalendarDays`. These use
outline/round-stroke semantics compatible with the Feather design registry.
The module/create/choice/filter/reset/viewer icons supplied by Figma remain local
SVG assets. No new icon dependency, font or hand-drawn icon was introduced.
The colored module icon surfaces and sheet handle remain layout elements.

The account and DATE placeholders were replaced in `store-app.tsx`,
`store-date-workspace.tsx` and `store-app.css`. All buttons retain accessible
names and decorative artwork is hidden from assistive technology.

## Changed implementation paths

- `apps/store-pwa/src/main.tsx`, `apps/store-pwa/vite.config.ts`: entry and explicit
  mock environment boundary.
- `apps/store-pwa/src/store-app.tsx`, `store-app.css`, `store-app-mock.ts`:
  composition, shared screen surfaces and synthetic session/catalog/record data.
- `apps/store-pwa/src/store-kph-workspace.tsx`, `store-shelf-life.tsx`,
  `store-date-workspace.tsx`: module screens and interactions.
- `apps/store-pwa/src/create-record-dialog.tsx`, `barcode-scanner-dialog.tsx`,
  `image-viewer.tsx`: optional screen presentation, review and image navigation.
- `apps/store-pwa/src/figma-assets.ts`, `apps/store-pwa/public/figma/**`: local
  artwork and asset lookup. Root SVG dimensions recorded in `assets.json`.
- `apps/store-pwa/src/store-create-review.test.tsx`,
  `e2e/scripts/check-figma-mobile.cjs`: retry/draft regression and browser gates.
- `docs/delivery/figma-mobile-implementation/**`, `CURRENT_STATE.md`, `NEXT.md`:
  scope, evidence and continuation point.

## Checks

- `npm run check`: PASS all workspaces.
- `npm test`: PASS **164 tests**, including **122 Store PWA tests**. Existing
  Pilot/online regressions remain green. New review test verifies no save at
  review, preservation on edit, and retry of the same idempotency key after error.
- `npm run build`: PASS Admin Web + Store PWA. Existing large-chunk warnings
  remain; the static and dynamic imports of the workbook module also produce
  an ineffective-dynamic-import warning. No threshold was disabled.
- `node scripts/check-docs.mjs`: PASS.
- `node scripts/check-contracts.mjs`: PASS 23 resources / 15 API fixtures.
- `node e2e/scripts/check-figma-mobile.cjs`: PASS Chromium headless at
  **390×844** and **1440×1024**. Navigation, approval filter, selection, actual
  `.xlsx` download, lookup found/miss/unavailable, scanner manual fallback,
  image viewer, review/edit/send, shelf rule and DATE action were exercised.
  Screenshots wait for finite animations and loaded visible images, and assert
  no horizontal document overflow. No broad pixel snapshot suite was added.
- 66 local SVG files are non-empty; root width/height/viewBox metadata checked.
  Browser screenshots were visually inspected against the requested frames.

Preview: <http://127.0.0.1:5175/>. To rerun browser gate on another port:
`STORE_APP_URL=http://127.0.0.1:5173 node e2e/scripts/check-figma-mobile.cjs`.
Local screenshots: `.local/figma-mobile/{home,kph,create,review,shelf,date,scanner,viewer}-{390,1440}.png`.

## Limits and next step

This pass verifies fixtures, not backend integration or production authorization.
DATE API and production data lifecycle are not implemented. Seed KPH cards do
not contain operational photos; added evidence is held in memory for the session.
No physical camera/iPhone, HEIC or real-backend E2E run was claimed. Session
reload resets mock changes. Owner visual acceptance is pending.

The implementation writer stops here. The next small step is for the chat
“Review và sửa UI theo Figma” to review this working tree and preview, especially
mobile form spacing and the intentional icon replacements. It may continue on
the same branch/worktree once this writer has stopped. No message was sent to
another chat from this task.
