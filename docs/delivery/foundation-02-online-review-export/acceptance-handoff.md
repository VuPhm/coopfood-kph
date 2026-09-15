# Integrated acceptance handoff

- Candidate SHA / plan revision: `ba95608ae468bd85c98f3ea94cc9411912308e4c` / `2`
- Preview mode: online Store PWA backed by the real Spring Boot API and a
  disposable PostgreSQL 17 database populated only with synthetic E2E data.
- Technical evidence: [technical-evidence-r2.md](technical-evidence-r2.md)

## Owner scenarios

1. Sign in as a store manager and open history. On desktop/tablet, confirm the
   date range is a compact single row. At `<=700px`, open **Lọc & sắp xếp** and
   confirm **Từ ngày** / **Đến ngày** are inside that dialog with no standalone
   date block above the list.
2. Apply an inclusive range. A reversed range keeps the dialog open and shows an
   inline error; a valid range closes the mobile dialog and marks its filter
   trigger active. **Xóa lọc ngày** restores the full list.
3. Select **Đã duyệt** on a pending record. The status and reviewer persist after
   reload, and the action is available only to the active manager membership of
   that store.
4. Select approved records and export Excel. The server revalidates store scope,
   submitted state and approval before the client creates the workbook; the
   reviewer is written to column R.
5. Sign in as an employee. History and record creation remain available, while
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
