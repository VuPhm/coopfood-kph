# Foundation-01 browser acceptance evidence

Status: `PENDING — waiting for integrated Team A + Team B SHA`

Integrated SHA: `<record after A/B integration>`<br>
Run date/time: `<Asia/Ho_Chi_Minh>`<br>
Browser/runtime: `<Playwright version, Chromium version, OS>`<br>
Backend runtime: `Java 21 / Spring Boot / PostgreSQL 17 / jOOQ 3.20.17`<br>
Database: `fresh local PostgreSQL 17 + synthetic seed`<br>
Frontend URL: `<E2E_APP_URL>`<br>
Backend URL: `<E2E_BACKEND_URL>`

## Commands

```text
<database start command>
<backend command>
./e2e/scripts/seed-foundation-01.sh
<frontend command with VITE_KPH_ONLINE=true>
<npm --prefix e2e test command>
```

## Browser results

| Case | Desktop table | Mobile card | Result | Evidence |
| --- | --- | --- | --- | --- |
| Login and membership store selection | pending | pending | pending | |
| `FOUND` lookup → TPCN → one photo → reload | pending | pending | pending | |
| `NOT_FOUND` lookup → manual TPTS → three photos → reload | pending | pending | pending | |
| Lost committed response → same idempotency key → one record | pending | pending | pending | |
| Store switch clears old history and restores scoped history | pending | n/a | pending | |
| Session expiry returns to login | pending | pending | pending | |
| EMPLOYEE/STORE_MANAGER/CHAIN_ADMIN membership matrix | API | API | pending | |
| Stamped photo authenticated private response | API | API | pending | |

## Contract/security/data-integrity review

- [ ] UI date is `dd/mm/yyyy`; API date is current `Asia/Ho_Chi_Minh` date.
- [ ] Found lookup stores the current catalog/supplier snapshot.
- [ ] Not-found keeps the scanned barcode and manual values without a guessed
      catalog product.
- [ ] Original bytes and ordered stamped photo metadata are preserved by the
      integrated backend; stamped access is authenticated and `private,
      no-store`.
- [ ] Store and actor data come from the server session; cross-store requests
      return the contract authorization error.
- [ ] Retry does not create a second record or second set of photo metadata.
- [ ] No session, credential, full PII or image bytes appear in logs/evidence.

## Limits and blockers

Record device/format limits that were not tested here, the exact reproducible
command for every failure, the owner and the next action. Style comments belong
in a follow-up backlog and do not block this acceptance gate.
