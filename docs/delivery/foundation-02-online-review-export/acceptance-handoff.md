# Integrated acceptance handoff

- Candidate SHA / plan revision: `40a6b17c6cbc5ab8f2991caad065a30922bc1e57` / `1`
- Preview mode: online Store PWA backed by the real Spring Boot API and a
  disposable PostgreSQL 17 database populated only with synthetic E2E data.
- Technical evidence: [technical-evidence.md](technical-evidence.md)

## Owner scenarios

1. Sign in as a store manager, open history and set **Từ ngày** / **Đến ngày**.
   Applying the filter shows only records whose detected date is within the
   inclusive range; an invalid reversed range shows an error, and **Xóa lọc**
   restores the full list.
2. Select **Đã duyệt** on a pending record. The status and reviewer persist after
   reload, and the action is available only to the active manager membership of
   that store.
3. Select approved records and export Excel. The server revalidates store scope,
   submitted state and approval before the client creates the workbook; the
   reviewer is written to column R.
4. Sign in as an employee. History and record creation remain available, while
   review and online export controls are absent. `CHAIN_ADMIN` has no implicit
   store-scope bypass.

## Remaining limitations and deferred items

- Offline synchronization/conflict resolution, production deployment and Admin
  catalog import/publish remain outside this cycle.
- No approval time window is enforced because no accepted business rule defines
  one.

Owner decision: **pending** as of `2026-09-15`.

Next action: owner runs or reviews the scenarios above and explicitly accepts or
requests a bounded correction. The cycle remains `AWAITING_ACCEPTANCE` until then.

