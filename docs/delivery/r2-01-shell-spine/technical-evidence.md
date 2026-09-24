# R2-01 technical evidence — revision 1

Candidate: `3799a30cdc64976f9eb77009d9dd49942e7038dc` on
`store-app/r2-01-shell-spine`; base:
`1855eff78cd91cdf6c83b8db30f99f9376e50e0d`.
All browser data is synthetic. `app.tsx` now composes an online-only
`StoreAppShell`; task callbacks, StoreContext, create dialog, history table/cards,
and D01 state stay at their existing owner. The shell uses the session's account
and listed store only. The selection control is navigation context, not an
authorization decision or inherited-store discovery.

## Commands and results

| Command | Runtime/result | Output evidence |
| --- | --- | --- |
| `node tooling/skills/delivery-cycle/scripts/cycle.mjs check --repo "$PWD" --plan docs/delivery/r2-01-shell-spine/plan.json --phase dispatch` | Node; PASS after plan-only commit `180b88c` | `PASS dispatch: r2-01-shell-spine revision 1` |
| `npm --workspace @coopfood-kph/store-pwa test -- src/app.online.identity.test.tsx` | Vitest; PASS, 12/12 | New shell entry and no-listed-store tests, existing online identity tests |
| `npm run verify` | Node/npm; PASS on candidate SHA, exit 0 | Docs check, Contract Lock 23 resources/15 API fixtures, generated API drift, TypeScript checks, 164 tests (Store PWA 122), all workspace builds |
| `VITE_KPH_ONLINE=true npm --workspace @coopfood-kph/store-pwa run build` | TypeScript/Vite; PASS, exit 0 | Online Store PWA build; existing large-chunk advisory remains |
| `R2_SHELL_URL=http://127.0.0.1:4175 R2_SHELL_USE_PREVIEW_API=1 node e2e/scripts/review-r2-01-shell.cjs` | Chromium against read-only fixture API; PASS 2/2 | Phone 390×844 and desktop 1440×1000: shell/context, TPCN/TPTS dialogs, History anchor, no page/dialog overflow, no browser errors. Phone footer was reachable after reducing viewport to 390×560. |
| `git diff --check` | Git; PASS | No whitespace defects |

Visual inspection of [phone](phone.png), [desktop](desktop.png),
[phone create](phone-create.png), and [desktop create](desktop-create.png):
phone shows task entry before history without a module stop; desktop retains
the ten-column history comparison table. The existing PWA status toast briefly
overlapped the create dialog during review; its stacking level was corrected so
the dialog/task footer remains foremost, and the browser review was rerun.

## Limits

- Docker/OrbStack was unavailable (`docker info`: daemon socket absent), so
  real-backend browser E2E was not rerun. The R2-01 shell changes no backend,
  API, migration, authorization, KPH rules, or D01 semantics.
- The preview API serves committed synthetic session/history/photo fixtures and
  rejects writes. It validates shell navigation and composition; it cannot
  validate real create/review/export outcomes.
- The 390×560 check reduces Chromium viewport height; it does not emulate a
  physical keyboard, camera, interruption, or real-device touch behavior.
- Inherited effective-store discovery for region/chain managers remains open.
  A session with no listed stores shows no store and disables create; the UI
  does not invent accessible stores.
- Approved final brand tokens/logo usage, future module routes, and R2-02
  composition remain deferred.
