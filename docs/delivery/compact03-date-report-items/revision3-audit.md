# Revision3 — consolidated independent audits

Owner26/10 explicitly expands agent-loop work to default Co.op Fresh too.
Reviewed source2a3b574 (runtime2448481), frozen preview4350. Agents audited
source plus Playwright390×844/1440×1024, artifacts in `.local/compact03/r3/`.

| Priority | Confirmed issue | Assigned scope |
| --- | --- | --- |
|P2|KPH filter dates14px in both modes and desktop comfortable KPH form inputs14px, versus product16px role|foundations|
|P2|Caption10/11px in nav/context/helper/count/shelf history; Compact desktop history header still11px|foundations; preserve chrome outer geometry|
|P2|Desktop shelf CalendarInput hit40×40; mobile already has44px pseudo hit|foundations; targeted trigger only, not calendar-day grid|
|P2|Comfortable KPH detail200%/390 splits date value because nowrap row leaves113.6px for147.7px text|surfaces; share responsive full-value wrap but keep comfortable padding|
|P2|KPH lazy skeleton paints semantic label colors because CSS targets obsolete.store-chip|loading; preserve slots/aria|
|P3|Default DATE processing competes with primary phase; nested read-only/facts/settings boxes differ|surfaces; retain comfortable soft groups/spacing, not wholesale Compact copy|

Root/agents follow AGENTS and accepted contracts. No source was changed during
audit. Agent references: audit-fresh/findings.md and target-proof.json;
audit-density/findings.md/results.json/sort.json; token_audit measured input/
caption bindings and verified skill results. All use synthetic fixtures.

Implementation/review loop is bounded to these three independent scopes.
Shared imports/tokens/docs belong to root; no agent edits packages/ui, root
config or contracts. Other suggestions are deferred rather than restarting
a broad audit on every patch.
