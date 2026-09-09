# Foundation-01 Team C baseline review

Review target: `2c456ea23f690a9c0cb353331e934b54906b4019`<br>
Review date: 2026-09-09<br>
Review scope: browser acceptance harness and its integration inputs

The checkpoint contains the real backend session, store membership, catalog
lookup and KPH HTTP handlers, but it has no browser E2E package and the online
Store PWA has no login/store selection screen yet. The online adapter currently
reads the first session membership, so store-switch acceptance cannot run at
this checkpoint. These are expected integration blockers while Teams A and B
finish; they are not style findings.

Team C added a Playwright harness that waits for the integrated UI and runs
against the real backend. It covers:

- login, two-membership store selection and session expiry;
- exact barcode `FOUND` and `NOT_FOUND`/manual paths;
- TPCN and TPTS creation with one and three synthetic PNG photos;
- reload of store-scoped history and private stamped photo retrieval;
- desktop table and mobile card viewports;
- a response-loss retry after server commit, with idempotency-key equality and
  a one-record assertion;
- EMPLOYEE, STORE_MANAGER, unassigned `CHAIN_ADMIN`, unauthenticated and
  outside-membership authorization checks.

No official E2E pass is claimed from this baseline. The official result must
be recorded in `acceptance-template.md` after A/B integration, a fresh Flyway
database and the synthetic seed have been used.
