# D01 revision 2 assignments

Baseline `6935138`: P04 accepted, P05 preserved, D01 contract ported and Contract Lock PASS.
Existing D01 `2109abf` is reusable implementation, not accepted or automatically merged.
Old O01 branch is deferred; planning/foundation branches are provenance only.
Remote freshness: not checked; this cycle uses local reviewed refs, no push/merge/deploy.

All teams: GPT-6 Luna high, separate worktree recorded in plan.json. Read AGENTS.md,
CURRENT_STATE, NEXT, principles, HISTORY_PAGING_CONTRACT, DOMAIN_RULES and accepted ADRs.
Reuse the D01-only diff `f308e0e..2109abf` only within allowed paths. Preserve P04/P05.
No subdelegation; no shared contract/migration/config edits. Request integrator changes.
Return actual commit, changed paths, commands/results and limitations. Two review rounds.

- backend: KPH implementation and tests only. Port record-first paging, filters/sorts/counts;
  test stable pages, bounds, inherited/cross-store authorization on PostgreSQL 17.
- frontend: Store PWA source only. Port paging and tests while preserving P05 change-password;
  test scope/filter/page cache, page-local selection, stale responses, Pilot isolation.
  Read UI/UX Pro Max skill, retain accepted UI DNA and accessible mobile paging.
- e2e: e2e only. Port paging seed/media and browser test; keep current P04/P05 seed/startup.
  Prepare regressions for real-backend desktop/mobile, no running shared preview concurrently.

Integrator runs full gates at integrated SHA and provides runnable synthetic preview.
Owner acceptance pending; previous revision 1 results are historical, not current PASS.
