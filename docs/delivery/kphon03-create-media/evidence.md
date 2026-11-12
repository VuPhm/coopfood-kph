# KPHON03 — technical evidence

12/11/2026, revision1. Candidate `837720e60924a1eb24429d391077d91999e952c6`; base `4bcbb48`.
Branch `store-app/kphon03-create-media`, worktree
`/Users/vup/Documents/coopfood-kph/.local/worktrees/kphon03-create-media`.
Sole writer root. Plan checkpoint `bd39061`; dispatch record check PASS before
implementation, no delegation. Owner continuation of KPHON02 is scoped/provisional
with UI debt, not acceptance of this new create code.

## Implementation and bounded review

Reuse current Fresh CreateRecordDialog/KphCreateControl with authoritative profile,
capability CREATE, existing lookup/create gateway and current backend multipart.
No BE06 branch merge: its broad UI and paired-upload/API/backend changes remain
superseded provenance. Original JPEG/PNG bytes upload to backend; backend resolves
catalog/store/actor snapshot and saves private originals plus stamped JPEG.
No backend/API/migration/dependency/lockfile edits in this slice.

Profile memoization uses authoritative scalars so ordinary scope refetch cannot
reset form/images. Suspended control keeps mounted form/files, masks old content,
blocks interaction and hides nested scanner/viewer; live verification status remains
inside modal. Lost scope unmounts and revokes local preview object URLs. Existing
review-before-send, edit-back and idempotency key behavior preserved. Sending locks
close/Escape and duplicate submission; success resets history filters/page/detail
and invalidates current actor/store D01 query, only then reports a known saved result.
401/403 revalidate context; network errors keep form/ordered originals for retry.

Create gateway captures session epoch + CSRF before async file preparation, uses a
client bound to that token, clears pending key state on actor change and refuses old
actor work before POST or on late response. Unit tests exercise both actor races;
backend still authorizes every request and remains the authority.

Review1: inspect accepted form/gateway/backend and add stable context, guard and
session-race coverage. Review2: verify real media/retry/revoke plus focused regression
on final runtime code. Initial unit failure was duplicate hidden/visible error text;
selector now targets visible alert. Initial browser navigation changed hash before
selection settled; checker now waits for explicit selection to finish. No assertion
removed or forced click/timeout increase to bypass behavior.

## Commands and results

```sh
npm ci --offline --ignore-scripts
npm ci --offline --ignore-scripts --prefix e2e
npm run check -w @coopfood-kph/store-pwa
npm run test -w @coopfood-kph/store-pwa -- src/store-online-create.test.tsx src/store-online-app.test.tsx src/store-online-kph.test.tsx src/create-record-dialog.test.tsx src/store-create-review.test.tsx src/online-kph.test.ts src/store-session-api.test.ts src/app.online.test.tsx src/store-kph-workspace.test.tsx
npm run build -w @coopfood-kph/store-pwa
VITE_STORE_APP_MOCK=false VITE_STORE_APP_ONLINE=true VITE_KPH_ONLINE=true npm run build -w @coopfood-kph/store-pwa
node e2e/scripts/check-kphon03-create-media.cjs
git diff --check
```

Node26.0.0, existing lockfile. TypeScript PASS. Frontend **9 files/77 tests PASS**,
0 failures (15.05s): real context/form retention/revoke, review/retry/success,
lookup/history D01, idempotency/original bytes/session races, legacy online and
mock Fresh workspace regression. This is focused coverage, not full npm verify.
Mock + online production builds/PWA PASS; online90 precache entries. Tests/build
ran final runtime source before checkpoint; only prose/handoff/script refinements
followed, no runtime/test changes between those checks and candidate. Final browser
script executed unchanged at checkpoint. No broader repeat needed for prose changes.

Backend command on same unchanged backend tree:

```sh
env JAVA_HOME=/Users/vup/Library/Java/JavaVirtualMachines/temurin-21.0.11/Contents/Home \
 DOCKER_HOST=unix:///Users/vup/.orbstack/run/docker.sock \
 ./backend/mvnw -q -o -f backend/pom.xml \
 '-Dtest=KphHttpIntegrationTest#createsStoreScopedSnapshotAndPrivateStampedPhoto+replaysSameRequestButConflictsOnChangedPayloadAndRejectsCrossStoreMutation+preservesMissingBarcodeAndManualSnapshotWithoutGuessingCatalogProduct+cleansBothMediaFilesWhenTheDatabaseTransactionRollsBack,LocalPrivateMediaStorageTest' test
```

**9 PASS,0 failure/error/skipped**:4 HTTP integration cases +5 private media tests.
Testcontainers/PostgreSQL17 isolated from acceptance DB. Covers original bytes and
hash, EXIF/orientation/fallback timestamp/server stamp, catalog snapshot, missing
barcode, replay/conflict/cross-store, rollback cleanup. Backend/contracts/packages
content unchanged from base and candidate; this is new targeted evidence, not a new
full backend verify. Raw Surefire summaries copied under local verification.

## Real backend Playwright

Chromium headless390×844 and1440×1024, vi-VN/Asia_Ho_Chi_Minh, reduced motion.
Real backend8082, new Fresh preview4173, synthetic DB/media from KPHON02 retained.
No business API mocks. Controlled discovery delay forwards the real server response;
controlled network loss aborts the first real create response only after commit.

Both viewports PASS:

- Region manager without synthetic store membership creates with actual actor/store;
  date and actor read-only; NOT_FOUND barcode `0000000000000` retained without guessing.
- 1–3 original images; test selects3 distinct generated PNGs in order. Holds scope
  discovery during focus refresh: old form hidden, verification visible, DOM/fields/
  all3 images retained after valid verification. Screenshots viewed.
- Review does not create. Hold committed response: sending disabled; close/Escape
  do not dismiss. Drop response, no false success. Retry same key returns same UUID,
  exactly one additional record in server count.
- Read DB photo rows (UUID validated) and private filesystem in synthetic runtime:
  original bytes/hash match each uploaded PNG in ordinal1/2/3; stamped files are JPEG.
  Stamped endpoint authenticated200/private cache, anonymous401, cross-region403.
- Create TPCN via real published barcode `0890123456789`, snapshot SKU000042/NCC000007.
  Saved TPTS appears in history, no horizontal overflow, no browser pageerror.
- Separate employee case: Admin API grants synthetic membership, employee reviews
  draft; revoke before send makes next POST403. Scope closes, no success/new record.
  Membership left revoked; no database reset/truncate.

Runtime services remain local exec processes: Store4173 now KPHON03,
backend8082 unchanged KPHON01 jar and media under KPHON02 worktree; PostgreSQL
container `coopfood-kph-kphon02-acceptance`, loopback55434. No reseed, no other
container reset. Admin4175 still not restored. Generated test records/images are
synthetic only, kept outside Git. Raw results/screenshots/logs:
`.local/verification/kphon03/`. Latest result IDs are local synthetic UUIDs.

## Acceptance, deferred work and limits

Candidate technically ready; owner create gate pending. [Try scenarios](handoff.md).
UI optimization requested by owner remains deferred, with observed retry notice/scroll
anchor/network copy noted in handoff. No new Figma frame supplied and no broad
redesign. Actual camera/OS/keyboard/interruptions require real-device evidence.
Review/export not wired yet. One thorough combined test round then one UI/UX round
remain pending before final acceptance. Main/Pages untouched; no merge/push/deploy.
