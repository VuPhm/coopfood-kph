# UI audit/repair — revision 7

Owner authorization on 09/10/2026: “còn rất nhiều lỗi, cứ rà và sửa”. Continue the isolated worktree/branch from r6 setup; sole writer /root, no delegates. Scope and exact checkpoint in plan.json. Two bounded review passes: reproduce/repair the first consolidated defect set, then verify the resulting screens and repair remaining concrete regressions. Owner acceptance stays pending.

Confirmed before edits: StoreSheet close loses focus; account Escape also closes quick panel and discards its draft; account dialog remains over a changed hash route; DATE search fails with surrounding whitespace; Lookup advertised name search misses a unique partial name and retains old product while the input changes. Verify screen scanner/create/image viewer focus too. No API behavior change, no inferred catalog products on barcode miss. Name search may resolve only a unique local fixture, with ambiguous input requiring a more precise query.

Figma structured contexts/screenshots read on 09/10/2026 from aEDpXtz0IiEkPiVucqjQ3Q nodes 21:91 (KPH), 21:144 (DATE), 384:514 (lookup). Existing assets/tokens/primitives inspected. Preserve static assets and semantics; any geometry fix must follow observed reference dimensions, with touch hit areas separate from visual size. No Figma writes.

Allowed paths are recorded in plan.json. Shared stylesheet ownership in this task is restricted to header/tabs/navigation/DATE/lookup selectors; shelf result/form/timeline/quick shelf geometry selectors are excluded because another writer owns that change. Keep original worktree intact. Run meaningful lifecycle/request tests, TypeScript, npm run verify, targeted headless Playwright and existing aggregate/calendar/QA gates against port 5177, plus screenshot review at both viewports. Commit local candidate and evidence; no merge/push/deploy.

Two review passes completed. Browser integration added route-aware focus, nested scanner Escape handling, visible Search/FileText roles and DATE action-row cascade fixes. Desktop DATE 384:897 was read before that row fix. Gates now run against the resulting tree; shelf remains excluded.
