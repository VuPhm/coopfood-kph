# P03 integrated review

Revision 1, review round 2/2, 2026-09-21. Solo integration owner `/root`.

P02 closed at its accepted candidate; no P02 gate is reopened. Existing branch
`codex/p02-scoped-authorization` at `57b20f8` was reused as the base. No remote
fetch, merge, push or PR was performed; remote freshness is not asserted.

## Consolidated bounded repair

Round 1 produced `6b1cb83` (backend/API/Admin vertical slice). Before handoff,
round 2 found and repaired:

- Admin dev/preview had no API forwarding; added local backend proxy on 8081.
- Logout/session expiry needed cache isolation and real-browser verification;
  queries are user-keyed, logout/401 remove scoped data and return to login.
- Action dialogs retained dismissed drafts and could not clear their date;
  unmount on dismissal and explicit date state fix both, with regressions.
- Cross-region terminal schedule status could be disclosed before scope check;
  check scope first. Reschedule also rechecks active target state.
- Polymorphic schedule targets needed referential integrity; generated nullable
  region/store keys now reference their respective tables. V7 is new and has not
  been deployed; only disposable test databases used the earlier V7 checksum.
- Last-manager execution guard now takes shared row locks on active manager
  memberships/users until the deactivation transaction finishes.
- Lifecycle 422 response did not match the generic Problem emitted by backend;
  specialized response plus all four mutation paths are synchronized with client.
- Product copy is Vietnamese and explains manual execution explicitly; no
  infrastructure jargon in operation messages. Existing UI DNA preserved.
- Fixture browser review corrected login keyboard expectation and updates the
  cancelled card state. Separate no-mock real-backend E2E added.

Verification runtime/scripts/seed and Vite config are explicitly in sharedPaths.
They support the same acceptance outcome; no product scope/revision change.
No broad review beyond round 2. Any new blocker needs a bounded repair decision.

## Decisions and limits

- Specialized manual execute when due, not automatic/background scheduling.
  This is visible in UI and still requires owner acceptance.
- Server date is authoritative; UI date is a Vietnam-time hint, not validation
  authority. Display dd/mm/yyyy, contract date ISO, minimum calendar date +30.
- Dedicated PostgreSQL 17 runtime on 55433, backend 8081 and Admin 4174; loopback
  only, synthetic accounts, no production/default admin seed in migrations.
- Credential lifecycle/provisioning, notifications, scheduler, production and
  physical-device acceptance stay out of scope.
