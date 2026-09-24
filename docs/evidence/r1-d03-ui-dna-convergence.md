# R1-D03 — Direction selection and UI DNA convergence

Status: **candidate for owner review**, 2026-09-24. Base `16ac888795304e0a09726c5d4c47a5464f08037b`; task branch `store-app/r1-d03-ui-dna-convergence`. This is a Round 1 design decision proposal, not approval to implement Round 2, change an API, extract a design system, or cut over Pages.

## A. Inputs and decision boundaries

The accepted [Store App baseline](../STORE_APP_BASELINE.md), [contract index](../product/STORE_APP_CONTRACTS.md), [ADR-0006](../adr/0006-store-app-evolution.md), [KPH domain rules](../product/DOMAIN_RULES.md), and [D01 history contract](../product/HISTORY_PAGING_CONTRACT.md) set the behavioral and authority boundaries. [R1-D01](r1-d01-ui-dna-audit.md) separates contract, current implementation, legacy evidence, and unresolved hypotheses. [R1-D02](r1-d02-evaluation-and-directions.md) and its [synthetic comparison board](r1-d02-direction-board.html) test A (task launchpad), B (capability workspace), and C (context/action surface) against the same entry, `NOT_FOUND` creation, and history decision scenarios. The board is a composition probe, not observed operator performance or an accessibility/device test.

**Convergence rule:** retain accepted outcomes and recognizable task landmarks; introduce only the shared structure needed for a Store App; make consequential context explicit at the point of action. Assess each element for task-entry speed, relearning, one-hand use, account/store clarity, capability growth, information density, state/error clarity, photo confidence, action safety, responsive coherence, brand character, and implementation risk. No whole direction wins. Current screens and the legacy [UI_DNA extraction](../product/UI_DNA.md) are migration evidence, not layout authority. A repository file search found no user guide or training file; external guidance remains **pending evidence** and its contents are not assumed.

The recommended composite is **direct KPH task entry inside a small shared capability shell, with compact context throughout and stronger context at consequential moments**. A contributes familiar entry and continuous work; B contributes a named KPH home and an expandable IA; C contributes precise account/store and selection context. This challenges each direction where it adds an unnecessary navigation step, a large persistent panel, or a new creation sequence.

## B. Continuity anchors

| Recognizable anchor | Why retain it | Freedom in the next UI |
| --- | --- | --- |
| Two visible **Tạo TPCN** / **Tạo TPTS** entries and their established meanings | Current primary task landmarks; type-specific fields/defaults are accepted KPH behavior. Hiding type behind a generic create action adds a new decision later. | Position, typography, and surface can change. Type remains visible and reversible before submission. |
| **Quét** beside manual barcode/SKU entry | Supports camera scanning and manual/keyboard fallback. A miss preserves the scanned code and permits rescan/manual input without guessing a product. | Scanner and lookup can occupy a screen or a well-managed dialog; preserve a nearby fallback and distinct `FOUND`, `NOT_FOUND`, and unavailable recovery. |
| Record details followed by **Ảnh minh chứng** | Staff can recognize the create sequence; 1–3 photos in order are part of the accepted record. | Sections, screen boundary, preview size, and viewer may change. Keep count, order, inspection, and the private original/stamped distinction understandable. |
| **Lịch sử** → filter → select → review/export | Existing task route and D01 page-local selection semantics. Users must be able to see review state and which selected records qualify before export. | Filter sheet, table/card composition, and action placement can change. Keep current filter/page visible and provide a clear return from details. |
| Acting account and current store near work | The action is scoped and audited; a multi-store actor needs to know which store is in effect. | A shared context control may replace the current membership dropdown. Backend authority, inherited scope, and inactive-scope denial remain unchanged. |
| KPH primary landmarks: create, history, record detail, photos, review, export | These names and transitions give returning users a route through a changed shell. | KPH stops being the whole application shell; desktop and mobile may compose the same landmarks differently. |

Preserving a landmark does **not** preserve the current long modal, membership-only selector, exact tab styling, compact hit targets, or Pilot local authority. The [R1-D01 audit](r1-d01-ui-dna-audit.md) identifies those as designable or unsuitable for the online target. External training may reveal other high-cost changes; owner review should compare this anchor list with that material before implementation acceptance.

## C. Element-by-element convergence from A/B/C

| Decision element | Carry forward | Why this choice / testable limit |
| --- | --- | --- |
| Signed-in entry | **A:** direct TPCN, TPTS, and history actions. **B:** label KPH as a capability within the Store App shell. **C:** show current account/store in a compact summary. | Returning staff reach common work without passing through a mandatory module overview. The shell can gain modules later. A KPH entry must stay obvious on both viewports even if a store overview exists. |
| Capability navigation | **B:** a small, stable KPH destination and place for other implemented capabilities; **A:** task shortcuts within KPH. | A task-only global navigation has no clear growth path; B's full sidebar and planned-module inventory consume space before a second capability exists. Add navigation weight when capability count justifies it. Future names, if shown, are clearly unavailable and never behave like working routes. |
| Account and store | **A/B:** compact persistent identity/current-store cue. **C:** repeat a stronger, explicit store/actor summary at create submission, review, and export confirmation. | Context is visible before work and unmistakable before a consequential action, without C's permanent large rail on a phone. A UI selector only navigates; it does not grant permission. Effective-scope discovery for inherited managers remains unresolved in the contract index. |
| KPH creation | **A/C:** continuous, recognizable type → lookup → details → photo flow, with a review/submission boundary. | Avoid B's mandatory three-screen wizard and its draft/back-state burden in the first slice. Use readable sections and progress cues inside the task. If a real-device test shows the continuous form fails, reconsider staging while preserving scan and photo recovery. |
| Lookup states | **A/C:** scan and manual input together; labeled match/miss/unavailable feedback near the field. | `FOUND` is one published/current product; `NOT_FOUND` keeps the code and offers rescan/manual; `CATALOG_UNAVAILABLE` offers retry and does not masquerade as a miss. This is a semantic distinction, not a color treatment. |
| Photos | **A/C:** numbered preview/inspection adjacent to record details; **B:** clear evidence grouping. | Show 1–3 slots/count and the actual order in create and review. Preserve private original/stamped handling and avoid implying the client stamp is audit truth. A permanent desktop photo pane is optional, not a requirement. |
| History on desktop | **A/B:** compact table with date, product, supplier/quantity, condition and review state; stable filters, counts, paging, and page-local selection toolbar. | Operators can compare records without opening each one. D01 totals reflect the scoped filtered set, while selected count belongs to the current page. Do not let a decorative shell or inspector squeeze the comparison columns. |
| History on mobile | **A/C:** focused cards or list with product/date/review state first, filter summary, page state, and a clear path to record details/actions. | Keep decision-critical facts and touch targets legible. A selected-record view must return to the same filter/page; selection resets when D01 says it must. Avoid assuming desktop table density fits a phone. |
| Review/export | **B/C:** selection and eligibility summary; confirmation names store, type, qualifying count, and the excluded/non-eligible state before export. | Consequential actions need explicit scope and outcome. Review stays tied to selected records and accepted authorization; export remains one type and only `SUBMITTED + APPROVED` records in scope. |
| Brand and tone | **A/B/C:** restrained operational surfaces with recognizable Co.op Food identity, clear hierarchy, and text plus semantic state. | The current logo and green field are evidence, not approved brand rules. Distinguish brand green from success/approval meaning and verify contrast before choosing tokens. |

The composite is intentionally asymmetric: KPH has direct entry, while the global shell has room to grow. This keeps a first-release path short without making future capabilities subordinate to a permanent KPH-only application.

## D. Ideas to reject from the target direction

| Idea | Reason |
| --- | --- |
| Select A, B, or C as a complete UI package | Each has a useful idea and a costly default; the representative board gives no operator evidence that would justify wholesale adoption. |
| A's task-only global IA as the permanent Store App | It hides capability ownership and makes later modules a flat list of shortcuts. |
| B's mandatory overview → KPH workspace → create path, and its fixed three-step creation wizard | Adds taps and draft/back-state complexity to the familiar KPH task before user evidence shows a benefit. |
| C's single generic **Tạo phiếu KPH** entry replacing the two type actions | Moves a familiar choice inside the form and weakens TPCN/TPTS recognition at entry. |
| C's always-expanded context panel or desktop selection inspector as a default | Uses scarce phone height/table width and duplicates details. Use compact context and open details when a decision needs them. |
| Persistent mobile action bars that cover keyboard, camera controls, photo controls, or system safe areas | Break one-hand completion and focus; any sticky action must respond to viewport/keyboard and not obscure fields or navigation. |
| Operable placeholders for receiving, inventory, stock/DATE, or reports | These are product directions, not implemented workflows or approved APIs. Disabled labels are optional IA probes, not a release feature promise. |
| Hue-only state badges, silent lookup error fallback, inferred product on a miss, or export from hidden/cross-page selection | Conflicts with state clarity or accepted KPH/D01 semantics and raises operational error risk. |
| Pilot profile/IndexedDB authority, trash/delete, and Pages packaging as Store App patterns | [ADR-0002](../adr/0002-local-only-pilot-pwa.md) and the [baseline](../STORE_APP_BASELINE.md) keep Pilot and Pages separate from online authority and release decisions. |

## E. Changes deferred from the first Store App slice

- A complete token palette, spacing/type scales, component APIs, `packages/ui` extraction, animation language, and official logo/icon replacement await brand evidence and use across more than one capability.
- A large module dashboard, full sidebar, global bottom navigation, persistent inspector, and fully specified routes for unbuilt capabilities await real capability scope and usage evidence.
- A new multistep KPH wizard, redesigned filters with unfamiliar terminology, and a wholesale history-card interaction await task testing that demonstrates a gain over the familiar sequence.
- Effective-store/capability discovery for inherited managers needs a separate contract and implementation outcome. R1-D03 specifies the **visible context need**, not an API shape or selector policy. Do not imply that membership-only session stores enumerate effective access.
- Catalog publishing/primary supplier, production HEIC policy, offline outbox, Pages cutover, and any future module workflow stay in their own decisions. They are not prerequisites for writing this direction document.

## F. Migration path from current KPH to Store App

| Layer | First vertical slice | Later evolution / guard |
| --- | --- | --- |
| Familiar workflow retained | Keep explicit TPCN/TPTS start, scan/manual lookup, record details then ordered photos, history/filter/select, review/export and their business labels. Preserve current KPH semantics and D01 paging/selection. | Adjust a step only with observed usability evidence and a migration/training note. |
| Shell and IA introduced | Put KPH in a small shared Store App shell; show account/current store; provide direct create/history entry on the signed-in surface and inside KPH. Preserve a predictable back route to KPH work. | Add capability destinations when they exist. Do not force a new overview stop for KPH users. |
| Visual DNA evolved | Clarify task hierarchy, text-labeled states, photo order, accessible touch/focus, responsive table/list relationship and context at decision points. | Validate against approved brand guidance and actual devices before selecting tokens or shared primitives. |
| Later changes deferred | Keep wizard conversion, rich module dashboard, full inspector, global navigation expansion and deeper brand system out of the first slice. | Introduce one change at a time with before/after task evidence and user guidance updates where needed. |

This can ship as a recognizable KPH workflow inside a new shell rather than a single-release UI reset. The external user guide/training material is an input to migration planning once supplied; no repository copy was found.

## G. Converged UI DNA candidates

These are **candidate principles for owner validation**, strengthened from [R1-D01's hypotheses](r1-d01-ui-dna-audit.md#e-ui-dna-hypotheses-for-later-validation), not color values, spacing tokens, or component specifications.

1. **Operational before ornamental.** The first view exposes the next likely task and its current context; decoration never pushes a task or state out of view.
2. **Familiar actions in an expandable home.** Keep direct KPH task landmarks while making KPH a named capability in a shared shell. Growth in modules must not add unnecessary steps to existing work.
3. **Density follows the decision.** Desktop history supports side-by-side comparison; mobile presents the facts needed to decide and a recoverable path to details. Both express the same scoped filter, page and selection state.
4. **Mobile work survives interruption.** Type, lookup, details and photos form a comprehensible path that works with one hand, keyboard, camera, back navigation and return from image inspection. Primary controls remain reachable without obscuring content.
5. **Context is compact until consequences rise.** Actor and current store remain findable; create submission, review and export repeat the relevant scope and outcome. The UI never claims to determine authorization.
6. **State is named and recoverable.** Match, miss, unavailable service, loading, review eligibility and failures use explicit words and next actions; color only reinforces the meaning. Focus and busy feedback are part of the state.
7. **Evidence is inspectable and ordered.** Photo count, 1–3 order and preview/inspection are clear at capture and review; original/stamped privacy and audit distinctions remain accurate.
8. **Brand supports the work.** Co.op Food identity should feel calm and credible on operational screens, with restrained emphasis and legible contrast. Exact palette, typography and asset use require an approved brand source.

## H. Round 2 vertical-slice implications

**Minimum validation slice, subject to owner acceptance of this direction:** a shared shell around the existing online KPH capability; signed-in entry with direct TPCN/TPTS and history; actor/current-store presentation using only data the accepted authority can actually support; a representative KPH create path with scan/manual and `FOUND`/`NOT_FOUND`/unavailable states plus ordered photo preview; history with filter/page state, page-local selection, review status, and export eligibility/confirmation. Include desktop and narrow-phone compositions of these same flows. This defines the test surface for future implementation, not an instruction to begin it now.

Round 2 should test whether a returning operator can start each KPH type promptly, resume after scanner/photo/keyboard transitions, identify account/store before submission and export, distinguish a lookup miss from service failure, and explain which selected page records will be reviewed or exported. Compare task steps and error/recovery observations with the current KPH path on real mobile devices and desktop; use synthetic data in review artifacts. Verify accepted contracts with existing backend/browser tests when code is changed, and validate inherited-scope context only after its separate discovery contract is settled. The [R1-D02 board](r1-d02-direction-board.html) alone cannot establish these outcomes.

## I. Open owner decisions and external evidence

1. **Approve or adjust the composite:** direct TPCN/TPTS and history entry in a small capability shell; continuous KPH creation; compact context plus consequential confirmation. This is the primary R1-D03 design decision.
2. **Provide representative user guidance/training material, if available.** Confirm which names, landmarks and steps carry the greatest retraining cost; absence of a repository guide is recorded, not filled with invented content.
3. **Confirm the desired context wording and review scenarios for multi-store/inherited actors.** The authority/discovery contract is still open; owner preference on UI copy cannot substitute for that separate technical decision.
4. **Provide approved Co.op Food brand/logo guidance or identify its owner.** Current assets and CSS show usage, not policy. Token and asset choices remain open.
5. **Choose the first real-device validation participants/devices and acceptable task-entry/recovery outcomes** before treating these candidate principles as final. The synthetic board does not measure operator performance, iPhone camera behavior, or accessibility.

R1-D03 is ready for owner review as a bounded convergence proposal. Approval would settle the direction and validation target; it would not approve unbuilt capabilities, a design system, API changes, Pages changes, or Round 2 implementation by itself.
