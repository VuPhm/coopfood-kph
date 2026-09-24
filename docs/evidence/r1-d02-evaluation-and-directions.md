# R1-D02 — Representative workflow and UI direction exploration

Status: evaluation framework and written direction concepts accepted; interactive board revision pending owner review. Base: `65d73cbf20d664b132e9847abda8f2b489d3f889` (`main`). Task branch: `store-app/r1-d02-workflow-ui-directions`. This artifact compares composition and interaction hypotheses; it does not approve a design system, tokens, components, production implementation, API change, or Pages cutover.

Interactive synthetic comparison: [R1-D02 direction board](r1-d02-direction-board.html). Resize the page around 390×844 and 1440×1000; use the direction and scenario controls to compare the same three workflows. The HTML is a disposable design probe, not app code.

## A. Evaluation framework (defined before directions)

Use these questions to reveal trade-offs in owner review. Do not total, score, or mechanically rank directions.

| Criterion | Review question |
| --- | --- |
| Task-entry speed | How many choices and navigation transitions separate sign-in from the common KPH action? Can a returning operator resume a likely task quickly? |
| Workflow continuity / relearning cost | How much of the existing operational mental model remains recognizable? Can current users transfer learned terminology, task sequence, and landmarks without relearning the whole application? Which changes imply retraining or major user-guide changes? |
| Mobile one-hand use | Can primary actions, scan/manual fallback, photo capture, and back/continue controls be reached and understood on a narrow phone? Are controls spaced for touch? |
| Account/store clarity | Before store-scoped work, is the acting account and effective/current store unmistakable? Can a multi-store or inherited-scope actor understand the current context without implying that a UI choice grants access? |
| Capability scalability | Can the shell accommodate future capability names without presenting unbuilt modules as available workflows or burying KPH? |
| Information density | Does history retain useful comparison fields and filter/page state on desktop? Does mobile preserve the information needed for the next decision? |
| Error and state clarity | Are `FOUND`, `NOT_FOUND`, and `CATALOG_UNAVAILABLE` distinguishable by text and recovery action, without relying on color? |
| Evidence/photo confidence | Can staff see photo count and order, inspect image evidence, and understand that the original and stamped derivative are retained privately? |
| Consequential-action safety | Are store context, page-local selection, review status, eligible export count, and confirmation visible before actions that affect records or create an export? |
| Desktop/mobile coherence | Do both layouts retain the same concepts and contract while using compositions suited to each viewport? |
| Visual/brand character | Does the direction feel calm and operationally legible using observed assets and a restrained provisional treatment, without claiming undocumented brand rules? |
| Complexity and implementation risk | How much new navigation state, responsive behavior, draft state, or duplicated presentation would the direction require? What source/contract gaps could block it? |

### Shared guardrails for comparison

- Compare exactly the three primary scenarios below. All example names, record values, counts, and imagery are synthetic.
- Use the same content and outcomes across directions: TPCN/TPTS creation, primary `NOT_FOUND`, related `FOUND` and `CATALOG_UNAVAILABLE` notes, 1–3 ordered photos, filtered history, page-local selection, review status, and export eligibility/confirmation.
- Prefer incremental interaction evolution over a one-release UI reset. Preserve proven workflow sequence and recognizable task anchors, including valid business terminology, landmarks, primary operational actions, and workflow mental models, unless they conflict with the unified Store App architecture, correct semantics, or a clearly identified UX problem.
- Existing user guidance/training material is migration evidence for continuity and retraining cost, not a UI contract. No user-guide file was found in this repository for a path reference. The legacy shell, navigation/IA, screen/modal boundaries, responsive composition, hierarchy, and visual DNA remain designable.
- Show an acting account and a current effective store scope before consequential work. Inherited/multi-store scope is represented as a context concept only; no API, selector policy, or permission behavior is invented.
- Preserve the accepted KPH rules, private ordered evidence, server-side scope authority, filter-before-page behavior, 1-based paging, and selection reset/page-local behavior.
- Visual treatment is intentionally provisional. The observed logo/colors are evidence, not official brand standards. Future capabilities are labeled as planned placeholders where shown.

## B. Direction A — Task launchpad

**Core idea.** Put common store tasks at the first decision point. Keep navigation shallow for operators who arrive to do one job, and make KPH creation a direct action.

**Shell and IA.** A compact task launchpad is the landing workspace. KPH, product lookup, and other future capability labels can be grouped by task frequency; future modules remain unavailable placeholders. Desktop keeps only small Start, History, and Account shortcuts; mobile keeps direct TPCN/TPTS task entry visible. Store/account context is persistent but compact.

**Mobile composition.** Entry uses a vertically ordered action list with two direct KPH create choices. Create is a continuous full-height task sheet: type, scan/manual lookup, record details, and ordered photos share one canvas without step navigation. A bottom review action remains reachable. History is a filter summary followed by action-oriented record cards; selecting records opens a bottom action bar.

**Desktop composition.** Entry uses a narrow shortcut rail beside a broad task launchpad. KPH create uses one focused sheet with a compact context summary above it. History uses a compact, sortable table with filters above it and a selection action strip; confirmation summarizes eligible records.

| Scenario | Treatment and exposed trade-off |
| --- | --- |
| Signed-in entry | Primary “Tạo phiếu KPH” choices shorten the path. Actor and current store sit in a persistent compact bar; a scope-detail affordance can explain a multi-store context. Task-first prominence may make future module discovery less explicit. |
| KPH creation | TPCN/TPTS are distinct start actions. Barcode field offers scan and manual entry together. `NOT_FOUND` preserves the scanned barcode and offers rescan/manual continuation without a guessed product; `FOUND` shows one catalog result; `CATALOG_UNAVAILABLE` has service-retry copy distinct from a miss. Photo slots are numbered 1–3 and their stored order is visible. The focus sheet speeds the task but could feel long if every field is exposed at once. |
| History decision | Date/type/review filters summarize above results. Desktop keeps comparison columns; mobile cards lead with product, date, and review state, then reveal details. Page-local selection and export eligibility are repeated in confirmation. Dense desktop controls may need careful grouping; mobile decisions require more opening/tapping. |

**Trade-offs to test.** Whether fast task entry compensates for a weaker sense of one unified multi-capability workspace; whether the persistent context bar is sufficiently noticeable at create/review/export moments; whether the full-height task sheet keeps the long form legible.

## C. Direction B — Capability workspace

**Core idea.** Make the Store App an explicit set of named workspaces. KPH remains one prominent capability, while the shared shell carries identity, store context, and the route between current and future work.

**Shell and IA.** Desktop has a persistent capability sidebar, selected workspace header, and account/store area. Mobile uses a compact workspace switcher with a small bottom navigation for the most-used destinations. Planned capabilities are visibly marked “Dự kiến” and are not given fake screens or actions.

**Mobile composition.** The KPH workspace begins with tabs for create/history and an always-visible context strip. Create is a sequence of short screens (type → lookup → details/evidence), with back/continue controls and a reviewable progress label. History uses a filter sheet above a page of records; review and export live in a dedicated action view for selected page records.

**Desktop composition.** A fixed navigation column frames a roomy workspace. Creation presents a step rail next to the current form panel, with numbered evidence visible in the active details step. History occupies the workspace with persistent filter controls, counts, a dense table, and a bottom/pinned selection toolbar.

| Scenario | Treatment and exposed trade-off |
| --- | --- |
| Signed-in entry | KPH is one clearly named workspace in the shared capability list. The workspace home presents current tasks and actor/store context. Multi-store/inherited scope is summarized as current effective scope with a separate context inspection affordance. Explicit navigation improves scale but adds a destination choice before common work. |
| KPH creation | Type, lookup, and evidence/details are staged. Scan/manual are parallel entry methods. `NOT_FOUND` keeps the code and enables manual details/rescan; `FOUND` shows the single match; `CATALOG_UNAVAILABLE` stops product confirmation and offers retry. Ordered photo slots stay visible in the step rail/tray. Short screens improve focus but increase transitions and draft/back-state complexity. |
| History decision | Filters, status tabs/counts, page number, and page-local select-all have stable places. Desktop maximizes comparison and visible selection state. Mobile opens records in a focused review/action view with a sticky selection/export summary. This makes the contract legible but can make small-screen return-to-list navigation slower. |

**Trade-offs to test.** Whether the module shell earns its persistent space with only one implemented workspace; whether staged creation improves completion or interrupts scan/photo rhythm; whether desktop's stable filters and navigation leave enough table width.

## D. Direction C — Context and action surface

**Core idea.** Keep the current effective store and actor close to the work, then adapt the main surface to the active task. Navigation is progressive: task surfaces stay focused, while workspace destinations remain one step away.

**Shell and IA.** A persistent context header names the acting account and current effective store; a context drawer explains “this action will use…” without declaring how scope is resolved. A task switcher surfaces Start, KPH, and future placeholders. Desktop uses a thin context rail and task canvas; mobile uses a context strip, one primary task surface, and a compact bottom task switcher.

**Mobile composition.** Entry shows current context and a prominent KPH action, with recent/other capabilities below. Create is a guided single canvas: type selector, lookup panel, core details, then numbered evidence tray; context stays pinned and the primary continue/save action stays at the bottom. History begins with the active filter and “selected on this page” summary. A focused record action surface prioritizes review; export confirmation repeats scope, type, status, count, and page.

**Desktop composition.** Entry pairs an action canvas with a persistent scope panel. Create uses a two-column layout: form and lookup on the main canvas, ordered evidence and context summary in a side pane. History uses a dense result list/table on the left and a selected-record decision inspector on the right; export eligibility stays visible with page selection.

| Scenario | Treatment and exposed trade-off |
| --- | --- |
| Signed-in entry | Account/current store context leads the page and KPH is the primary capability action. Multi-store/inherited scope can be described as “current effective store” with a list/detail affordance, leaving scope discovery/API unresolved. Persistent context strengthens awareness but consumes more mobile height and desktop width. |
| KPH creation | TPCN/TPTS selector, scan/manual lookup, fields, and numbered photos share one guided canvas. `NOT_FOUND` remains the primary state with code retained and safe manual path; `FOUND` and `CATALOG_UNAVAILABLE` use distinct labeled panels and recovery. Photo thumbnails expose sequence and count. The persistent action footer helps continuation but can compete with the keyboard or photo controls. |
| History decision | Desktop selection opens a record inspector without losing filter/page context; table stays dense. On mobile, the inspector becomes a focused decision surface with a clear return to filtered results and bottom review/export action. Export confirmation restates the selected page, eligibility, current store, and outcome. Split desktop views may duplicate detail or require a clear selected-row relationship. |

**Trade-offs to test.** Whether strong context visibility offsets the reserved screen area; whether a split history inspector improves desktop decisions without weakening row-to-selection clarity; whether a guided canvas is easier to recover than a multi-step sequence.

## E. Contract/state coverage across directions

All directions intentionally preserve the same semantics. This table is a coverage check, not a ranking.

| State/contract | A: Task launchpad | B: Capability workspace | C: Context/action surface |
| --- | --- | --- | --- |
| Actor and current effective store before consequential task | Compact persistent bar; detail affordance | Shared header and workspace context strip | Persistent, prominent context header/panel |
| Scope inheritance | Conceptual current-scope summary; no inferred API | Context inspection within workspace; no API shape | Context drawer says which effective context applies; source unresolved |
| TPCN/TPTS | Distinct direct task actions | Type step within KPH workflow | Type selector at top of task canvas |
| `NOT_FOUND` | Keep barcode; rescan/manual options | Keep barcode in lookup step; rescan/manual options | Keep barcode in lookup panel; rescan/manual options |
| `FOUND` / `CATALOG_UNAVAILABLE` | One match / distinct service recovery note | One match / unavailable blocks confirmation and offers retry | Distinct labeled panels and recovery actions |
| Ordered 1–3 private photos | Numbered slots in task sheet | Ordered evidence tray alongside steps | Sequence visible in persistent evidence tray |
| Filter / paging / selection | Filter summary, page cards/table, page-local bar | Stable filters/counts/page and page-local toolbar | Context-preserving list/inspector, page-local selection summary |
| Review and export | Action strip and eligibility confirmation | Dedicated selected-record action view | Inspector and confirmation repeat scope/status/count |
| Desktop/mobile coherence | Same quick-task model, different controls | Same module map, responsive destinations | Same context and task, responsive canvas/inspector |

## F. Review prompts and limits

Use the evaluation questions in section A to discuss what each direction makes easier and what it makes harder. No direction is preferred by this document. In particular, decide whether launch speed, explicit workspace navigation, or persistent context deserves more validation in the next round.

Before further design work, owner review should clarify how the effective current store is communicated for inherited/multi-store users using the existing authority; identify any approved brand manual/logo guidance; and say which direction elements should move to a higher-fidelity prototype. These questions do not block this comparison because it avoids inventing the missing API and brand rules.

Evidence anchors: [Store App baseline](../STORE_APP_BASELINE.md), [R1-D01 audit](r1-d01-ui-dna-audit.md), [contract index](../product/STORE_APP_CONTRACTS.md), [KPH domain rules](../product/DOMAIN_RULES.md), [history paging contract](../product/HISTORY_PAGING_CONTRACT.md), and [provisioning policy](../product/PROVISIONING_POLICY.md).
