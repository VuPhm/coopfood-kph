# Coverage recovered26/10/2026

Revision1 source236ce91 is reusable: DATE/report catalog/notifications flat
recipes and revised KPH density gate are complete. Logs confirm5viewport,
actions390/1440,346tests/build and report selection/dock PASS. Owner acceptance
for these exact items is still pending. Main/remote freshness not fetched.

| Family | Existing coverage | Gap and bounded action |
| --- | --- | --- |
| KPH list | COMPACT02 accepted | Preserve; no redesign |
| DATE/report catalog/notifications | COMPACT03r1 technical PASS | Preserve; integrate regression |
| KPH detail | Fresh Soft summary cards, no Compact recipe | Flatten nested summaries/section boundaries, keep full fields/photos/approval actions |
| Report menu/personal rows/history | Large48/54px decorative faces and card shadows | Use compact functional rows,36px faces, lighter section treatment; retain titles/descriptions/counts/manage action |
| Shelf history | Main input is Compact; history retains boxed rows and11px captions | Flatten history rows, captions at least12px; preserve snapshot dates/status,20-entry history and recall |
| Account/settings | Switch works; store card and settings body retain independent rich blocks | Use flat store/settings rows and shared size roles; keep hero, switch semantics, storage/focus and account navigation |
| Home/header/nav | Accepted brand/module and navigation | Defer; preserve geometry and brand |
| Timeline/chart/photo/scanner | Domain or device-specific visuals | Outside pass; preserve |

This initial matrix is source-based. Baseline screenshots and measured results
are captured before implementation and linked from technical evidence. Prior
r1 evidence proves that checkpoint only; all affected secondary-surface gates
start pending for revision2.

## Final coverage and stop condition

All four previously uncovered families are covered by one opt-in Store-local
recipe file. KPH detail now uses flat44px rows with full-value wrap; report
menu/personal/history use functional rows and36px decorative faces; shelf
history is flat with12px captions and text-responsive columns; account/settings
body uses flat rows while keeping the hero and operational switch.

Technical source and evidence are pinned in plan.json/technical.md. Comfortable
geometry/content is retained; integrated r1 items/flows remain. The next step
is owner review of the integrated candidate, not another unrestricted audit.
Accepted Home/header/navigation, charts/timeline, images, login/legacy/Admin and
OS-specific scanner interaction stay deferred/out of this pass by design.
