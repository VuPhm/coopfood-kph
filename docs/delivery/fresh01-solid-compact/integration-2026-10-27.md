# FRESH01 revision5 — neighboring UI integration and single push

27/10/2026. Owner directly requested after4368 DATE preview:
“merge các nhánh lân cận, cho phép1lần push”. This authorizes integration of the
current Store UI and one explicit push of main. It does not authorize Cloudflare,
a Pilot tag/release, protected Pages updates, unrelated backend/Pilot branches,
branch deletion or repeated pushes.

## Inventory and integration

- Main before integration: `f77034d9c14b88f5ae6359e31cfd23b4e3e6b0d8`, clean.
- Accepted current task: `268be70`; production source `699413a`.
- Fresh remote read: `git fetch origin main`27/10; origin/main
  `10aebda50200ca300cc340c1596746fb58afa903`, ancestor of local main (47commits
  ahead,0behind before this integration). No remote conflict or force required.
- `e4005f8`: normal octopus merge of FORM01/HEADER03 missing records.
- `157a22f`: explicitly preserve-current-tree merge of six accounted histories.
  Three branches are patch-equivalent to cherry-picked commits; three contain
  only old delivery heads whose later acceptance is already recorded on main.
  This prevents reintroducing the retired two-mode surface file or replacing
  CLOSED decisions with older pending records. No implementation was discarded.
- `ad85c666ef2ce7c7f495d7aba557ddedc06a67d5`: actual no-fast-forward merge into main.
  `git diff --exit-code 268be70 HEAD -- apps packages contracts backend e2e
  package.json package-lock.json .github` passed: runtime/test/config tree is
  exactly the reviewed candidate. Only branch history/delivery docs were added.

| Included branch | Exact head | Treatment |
| --- | --- | --- |
| `store-app/compact01-interface-density` | `e0054c7` | Ancestor of current candidate before consolidation |
| `store-app/compact02-kph-items` | `0b63982` | Ancestor of current candidate before consolidation |
| `store-app/compact03-date-report-items` | `c5a440b` | Ancestor of current candidate before consolidation |
| `store-app/compact03-r3-foundations` | `4046c24` | Patch-equivalent (git cherry: -); record ancestry, preserve later one-mode source |
| `store-app/compact03-r3-loading` | `2a3b574` | Ancestor of current candidate before consolidation |
| `store-app/compact03-r3-surfaces` | `5461c4d` | Patch-equivalent (git cherry: -); record ancestry, preserve later one-mode source |
| `store-app/compact03-r4-date-notifications` | `d7e86b3` | Patch-equivalent (git cherry: -); record ancestry, preserve later one-mode source |
| `store-app/form01-fresh-soft` | `3bd0131` | Normal merge of missing delivery documentation; runtime already present |
| `store-app/header03-context-nav` | `d1675d1` | Normal merge of missing delivery documentation; runtime already present |
| `store-app/header02-green-layer` | `6a99f7f` | Runtime already integrated on main; preserve newer closed acceptance records |
| `store-app/reports02-soft-surfaces` | `96bdbbe` | Runtime already integrated on main; preserve newer closed acceptance records |
| `store-app/shelf02-soft-utility` | `ee9f988` | Runtime already integrated on main; preserve newer closed acceptance records |

All12heads pass `git merge-base --is-ancestor <branch> main` after integration.
Older FORM01/HEADER03/Compact snapshots retain their historical gate statuses;
FRESH01 is the current integrated acceptance, not retroactive acceptance of
superseded two-density UI. No branches/worktrees were deleted.

## Verification on merged main

Checks are performed against main sourcead85c66, not an unmerged task build.
Final documentation/ledger commits contain no runtime changes.

All checks below passed on main; raw ignored artifacts are in
`.local/fresh01/merged/`. Browser preview <http://127.0.0.1:4370/#date> is built
from integrated main, with synthetic fixtures and service workers blocked.

| Command | Actual result |
| --- | --- |
| `VITEST_MAX_WORKERS=1 npm run verify` → verify-serial.log | exit0;347tests: Store294/Admin16/API2/rules19/UI16; docs/contracts/generated API/typecheck/all builds/PWA |
| `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build -- --outDir ../../.local/fresh01/merged/build --emptyOutDir` → mock-build.log | exit0,117precache |
| `STORE_PREVIEW_URL=http://127.0.0.1:4370 STORE_SOLID_OUTPUT=.local/fresh01/merged/solid node e2e/scripts/check-store-solid.cjs` | exit0,7routes×5viewports390/1440/320/900/844landscape, palette/cards/tags/focus/print/no-mode/no overflow |
| `STORE_PREVIEW_URL=http://127.0.0.1:4370 STORE_FEEDBACK_OUTPUT=.local/fresh01/merged/feedback node e2e/scripts/check-store-item-feedback.cjs` | exit0,3widths, mouse-held press/stable boxes/keyboard focus/disclosure/exact lot/nav/text150–200/system preferences |
| `STORE_PREVIEW_URL=http://127.0.0.1:4370 STORE_ACTIONS_OUTPUT=.local/fresh01/merged/actions node e2e/scripts/check-store-actions.cjs` | exit0,390/1440,1/7reminders, validation/photo/review/save/DATE→KPH, Excel/PDF/history/shelf |
| `STORE_PREVIEW_URL=http://127.0.0.1:4370 STORE_EFFECTS_OUTPUT=.local/fresh01/merged/effects node e2e/scripts/check-store-effects.cjs` | exit0,390/1440/320, warm/blue CTA states/contrast/stable boxes, correct forms, white fields and shared effects |
| `npm run check:docs`, `git diff --check` | pass after delivery documentation updates |

The initial2-worker verify stopped on one KPH filter test exceeding the unchanged
5000ms limit (5448ms);293other Store tests and all other workspace tests passed.
It is retained in verify.log. The serial full verification passed all347tests
with the same timeout and assertions; no test/source/config was altered to pass.
No remaining failure is waived. Existing schema/bundle warnings are unchanged.
Backend/online authority code is unchanged from already accepted main; this UI
integration does not claim a fresh Docker/backend/real-API browser run.

The broader revision4 native-scroll and reminder-group coverage is reused from
its recorded exact runtime because the integrated code tree is byte-identical.
This round also reruns the transaction and35screen cases on main. Technical gates
pass and the direct owner merge request supplies the integrated user decision.

## Push boundary

Exactly one push is authorized, after all integration gates pass:

`git -c push.followTags=false push origin refs/heads/main:refs/heads/main`

Only main is included; no force, tags or other refs. The command result and
subsequent read-only `git ls-remote --heads origin refs/heads/main` provide the
actual receipt in this chat and ignored `.local/fresh01/merged/` logs. This
pre-push record does not claim an upload already happened. A rejected/failed
attempt is not automatically retried under the one-push authorization.

Protected refs recorded before integration remain unchanged:
`codex/github-pages-pwa=2cb16a9fc84c70403b7ab052a8d058f33ca0c355`, annotated
`preserve/github-pages-pwa-2026-09-24-c789714^{commit}=c789714870eff5912e10fe89361bd845d9e3983d`.
Cloudflare continues to serve the earlier COMPACT03r4 mockup; no hosting action.

## Acceptance and limits

Owner's direct merge request accepts the current integrated Store UI for merge;
it does not certify real-device Safari, production backend wiring or durable
mock data. Synthetic mock/browser-local tests and existing reset/history limits
still apply. GitHub verification workflows use pull_request/workflow_dispatch,
and Pages release requires a pilot-v tag; this push itself is not a deployment
or a claim of remote CI success. No new visual scope is opened.
