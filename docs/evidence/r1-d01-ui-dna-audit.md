# R1-D01 — UI/UX evidence and DNA audit

Status: candidate for owner review, 2026-09-24. Base `edd26abff525be120d0ea37a26f08f43f0818981`; task branch `store-app/r1-d01-ui-dna-audit`. This records evidence and questions for Round 1 exploration. It approves no new UI direction, token, component boundary, or Pages cutover.

## Reading rule and layers

Authority descends from accepted business contracts and ADRs to executable tests, current implementation, screenshots, and extracted legacy observations. A screenshot proves a rendered state at one viewport with synthetic data; it does not prove authorization, device behavior, or brand approval. `docs/product/UI_DNA.md` preserves Tool KPH extraction, including historical parity language; it is not final Store App UI DNA.

| Layer | Evidence in this repository | What is settled here |
| --- | --- | --- |
| Brand identity | Bitmap Co.op Food logo, PWA icons, logo wording, workbook company/footer provenance | Actual assets and labels exist; official usage, licensing, and approval are unverified. |
| UI DNA | Legacy observations, current screenshots, workflow affordances | Hypotheses below, to validate in later exploration. |
| Tokens | Current CSS `@theme` values and legacy extracted values | Observed implementation values only; no Round 1 token contract. |
| Primitives | `packages/ui/src` Button, Dialog, Field, Input, Tag | Working source primitives; reuse or replacement is a later design decision. |
| Components | StoreContext, scanner, create dialog, history rows/cards, image viewer, expiry utility | Current code boundaries and behavior evidence. |
| Patterns | Two type entry actions, desktop table/mobile cards, selection toolbar, conditional fields, confirmations | Interaction evidence; layout and navigation remain designable. |
| Screens | Login, KPH workspace, create, filter, viewer, export confirmation; Pilot settings/trash | Current screen/state inventory, not a target IA. |

## A. Evidence ledger

`Contract` means accepted authority; `current` means implementation or test at this base; `legacy/Pilot` means provenance only for the online Store App. Reliability describes the claim each source can support.

| Source | Proves / limits | Authority and status |
| --- | --- | --- |
| [STORE_APP_BASELINE](../STORE_APP_BASELINE.md), [STORE_APP_CONTRACTS](../product/STORE_APP_CONTRACTS.md), [ADR-0006](../adr/0006-store-app-evolution.md) | Unified Store App direction, online/Pilot boundary, protected Pages, changeable shell/IA. No final UI is specified. | Accepted product/architecture baseline; **contract**, current. |
| [DOMAIN_RULES](../product/DOMAIN_RULES.md), [PROVISIONING_POLICY](../product/PROVISIONING_POLICY.md), [ADR-0004](../adr/0004-scoped-management-hierarchy.md) | KPH/date/catalog/photo/export semantics and effective KPH scope, including region/chain inheritance and cross-scope denial. | Accepted business/security authority; **contract**, current. |
| [HISTORY_PAGING_CONTRACT](../product/HISTORY_PAGING_CONTRACT.md) | Server filtering/sorting before page, 1-based page, page-local selection, counts, reset and busy rules. | Accepted D01 authority; **contract**, current. |
| [SOURCE_MANIFEST](../SOURCE_MANIFEST.md) | IDs and hashes for extracted Tool KPH/platform sources; labels old repositories read-only. The cited local Tool KPH checkout is absent in this worktree environment. | Provenance manifest; **legacy**, reliable for origin, not current UI acceptance. |
| [BEHAVIOR_INVENTORY](../product/BEHAVIOR_INVENTORY.md), [SCREEN_MAP](../product/SCREEN_MAP.md), [UI_DNA](../product/UI_DNA.md) | Trace IDs, prior affordances, screen states and historical parity proposals. Some text predates online scope/paging and cannot override contracts. | Extracted observations; **legacy**, lower authority. |
| [app.tsx](../../apps/store-pwa/src/app.tsx), [store-context.tsx](../../apps/store-pwa/src/store-context.tsx), [styles.css](../../apps/store-pwa/src/styles.css) | KPH-centric shell, account/store block, two create actions, tabs, filters, desktop table/mobile cards, selection, and current visual values. `onlineStores` comes from `session.user.stores`; `canManageOnline` tests `role === STORE_MANAGER`, so inherited managers are not fully represented in this UI. | Direct source; **current implementation**, high for what is rendered, not authority for effective scope or target design. |
| [online-kph.ts](../../apps/store-pwa/src/online-kph.ts), [create-record-dialog.tsx](../../apps/store-pwa/src/create-record-dialog.tsx), [barcode-scanner-dialog.tsx](../../apps/store-pwa/src/barcode-scanner-dialog.tsx) | API mapping, idempotent create attempt, lookup `FOUND`/`NOT_FOUND`, retry message on lookup error, scanner/camera and manual affordance, type-dependent form. An unavailable catalog is caught as an error and shown with retry; distinct presentation is not established. | Direct source; **current implementation**, high for client behavior. |
| [image-processing.ts](../../apps/store-pwa/src/image-processing.ts), [image-viewer.tsx](../../apps/store-pwa/src/image-viewer.tsx), [history-records.tsx](../../apps/store-pwa/src/history-records.tsx), [record-view.ts](../../apps/store-pwa/src/record-view.ts), [excel-export.ts](../../apps/store-pwa/src/excel-export.ts) | Photo stamp and inspection affordance, row/card projections, approval labels, workbook mapping and image order. Online original upload/private storage is established by contract/backend, not by the viewer screenshot. | Direct source; **current implementation**, medium to high for UI mechanics. |
| [packages/ui/src](../../packages/ui/src/index.ts) | Five source primitives with Radix dialog, CVA variants and current utility classes. Their boundaries and variants are implementation, not a Store App design system. | Direct source; **current implementation**. |
| [brand assets](../../apps/store-pwa/public/brand/coopfood-logo.png), [PWA icons](../../apps/store-pwa/public/icons/android-chrome-192x192.png), [manifest](../../apps/store-pwa/public/manifest.webmanifest) | Actual bitmap marks, app icon family, KPH name/short name and manifest colors. Asset approval is not recorded. | Direct files; **current assets**, not official brand policy. |
| [foundation browser tests](../../e2e/tests/foundation-01.spec.ts), [E2E README](../../e2e/README.md) | Executable online scenarios for found/not-found, photos, store isolation, responsive cards, paging, review/export. README distinguishes real backend from mock visual review. | Executable source; **current test evidence**, stronger for checked outcomes than screenshots. |
| [review-ui.cjs](../../e2e/scripts/review-ui.cjs), [2026-09-12 UI review](foundation-01/ui-review-2026-09-12.md) | Historical visual capture method and prior owner rejection/iteration. The checked-in script's array history mock predates D01's page response. | Synthetic render/historical note; **current script + historical review**, limited. |
| Preserved Pages commit `c789714870eff5912e10fe89361bd845d9e3983d`, tag `preserve/github-pages-pwa-2026-09-24-c789714` | Read-only `git show` confirms KPH manifest/assets, IndexedDB store profile/records, local approval/trash/export and the single-purpose workspace. Its logo blob matches current HEAD. | Immutable **Pilot** provenance, not online Store App authority. |

The current [OpenAPI lookup operation](../../contracts/openapi/kph.openapi.yaml) says lookup requires active store membership and returns 503 when catalog/primary supplier is unavailable, while accepted KPH scope inherits region/chain access. This is an explicit contract/interface tension for a later outcome; this audit does not choose an API shape or broaden lookup rights.

## B. Three contract-aware workflow maps

Classification is for each **step/state**, not the surrounding component. `INVARIANT` means preserve the semantic outcome; `DESIGNABLE` means UI composition may change; `LEGACY_ONLY` must not become online authority; `UNKNOWN` needs validation or a separate decision.

### 1. App shell and account/store context

| Step/state | Class | Evidence / design implication |
| --- | --- | --- |
| Login, session, actor identity and self password change | INVARIANT | Session and credential authority remain backend; [contract index](../product/STORE_APP_CONTRACTS.md), current login/account actions. |
| Active store scope and KPH capability, including region/chain inherited scope | INVARIANT | Backend policy and audit; selector/visibility cannot grant or deny authorization. |
| Identify the acting account and effective/current operational store scope before consequential store-scoped work | INVARIANT | The user must know whose authority and which store apply before create, review or export; current StoreContext and accepted scope contract support this outcome. |
| Present account and store context | DESIGNABLE | Placement, hierarchy, selector/control and shell composition can change; UI controls do not determine backend scope. |
| KPH-only header/workspace, account buttons and membership dropdown | DESIGNABLE | Current shell is one feature's composition, not the unified module shell. |
| Self-entered Pilot store/person, per-device IndexedDB | LEGACY_ONLY | [ADR-0002](../adr/0002-local-only-pilot-pwa.md), preserved Pages. No online authority. |
| Discovery/presentation of effective stores and capabilities for inherited managers | UNKNOWN | Current membership-only session list and `canManageOnline` do not express accepted KPH scope. API shape is outside R1-D01. |

### 2. Scan/manual lookup → KPH create → 1–3 photos

| Step/state | Class | Evidence / design implication |
| --- | --- | --- |
| Choose TPCN/TPTS; apply type-specific condition, resolution and defaults | INVARIANT | [domain rules](../product/DOMAIN_RULES.md), current form/options. Separate prominent actions are useful evidence; their exact layout is designable. |
| Scan or type barcode; `FOUND` is one published/current product, `NOT_FOUND` preserves barcode and permits rescan/manual input without inferred product | INVARIANT | Lookup contract, current client and browser test. |
| `CATALOG_UNAVAILABLE`/503 is an unavailable service, not a product miss | INVARIANT | OpenAPI/server error semantics; the exact recovery copy and presentation remain to validate. |
| Scanner dialog, inline lookup copy, five numbered form sections and modal scroll/footer | DESIGNABLE | Current interaction evidence; no required dialog/screen boundary. |
| Business date `dd/mm/yyyy` in `Asia/Ho_Chi_Minh`, positive quantity, snapshot, idempotent create | INVARIANT | [domain rules](../product/DOMAIN_RULES.md), fixtures/tests, current request mapping. |
| Add/remove 1–3 photos while preserving selection order; retain private online original and stamped derivative | INVARIANT | Contract plus current picker/preview order. Viewer/thumbnail/lens composition is designable. |
| Pilot-only HEIC conversion and stamped-only local persistence | LEGACY_ONLY | [ADR-0002](../adr/0002-local-only-pilot-pwa.md); online HEIC/production media policy is a separate unresolved outcome. |
| Distinct unavailable-state UX, real camera/iPhone behavior and image upload progress quality | UNKNOWN | Current mock review cannot establish these; no media-policy decision here. |

### 3. History/filter/select → review/export

| Step/state | Class | Evidence / design implication |
| --- | --- | --- |
| Query only authorized store; filter/sort whole scoped set before 1-based paging; stable count/ordering | INVARIANT | [D01](../product/HISTORY_PAGING_CONTRACT.md), online gateway and browser test. |
| Date/type/approval filter, page-local selection and reset on user/store/tab/filter/sort/page | INVARIANT | D01; prevents hidden or cross-page actions. |
| Desktop table/mobile expandable cards, filter dialog/panel, tabs and batch toolbar | DESIGNABLE | Current usable interaction evidence; not mandated composition. |
| `PENDING`/`APPROVED`/`REJECTED` review with audit and correct inherited store scope | INVARIANT | Domain/security contract; current approval control is only one expression. |
| Export one type, selected `SUBMITTED + APPROVED` records in scope, audit, ordered images and BM-331.CF outcome | INVARIANT | Domain contract and current export mapping. Summary-before-download is useful interaction evidence. |
| Pilot trash/restore, local approval and per-device export log | LEGACY_ONLY | Preserved Pages and ADR-0002; online Store PWA has no delete/invalidate action. |
| How review/export should sit among future Store App modules | UNKNOWN | No accepted unified IA or representative non-KPH module implementation. |

## C. Current UI pattern audit

These labels evaluate evidence value, not approve a future design.

| Current pattern | Audit call | Reason |
| --- | --- | --- |
| Visible store/actor beside work, server/local data source copy | RETAIN AS EVIDENCE | Gives operational context and scope awareness; current selector model has inherited-scope gap. |
| Immediate TPCN/TPTS create actions and type-specific choices | RETAIN AS EVIDENCE | Fast entry and low ambiguity; preserve semantic type choice. |
| Scanner plus manual keyboard fallback, found/miss feedback | RETAIN AS EVIDENCE | Avoids camera dead ends and prevents product guessing. Validate unavailable recovery separately. |
| 1–3 ordered photo previews, remove, full viewer, export summary | RETAIN AS EVIDENCE | Helps evidence inspection and consequential export review. Exact viewer/confirmation form is designable. |
| Semantic labels with colored condition/resolution/approval cues | RETAIN AS EVIDENCE | Redundant text helps distinguish states; colors need brand/semantic review and contrast validation. |
| KPH as entire app shell; expiry utility floating in the workspace | RECONSIDER | KPH access remains, but global module hierarchy and utility placement have no accepted target. |
| Five-section create modal and nested scanner/viewer/dialog sequence | RECONSIDER | Long mobile operation, keyboard/camera transitions and draft recovery need design exploration. |
| Wide desktop table plus compact mobile cards and small batch controls | RECONSIDER | Data density is useful; mobile selection/review hierarchy and some small targets need device validation. |
| CSS `@theme`, local variables, literal colors, radii and `packages/ui` variants | RECONSIDER | Working visual implementation, not a token/primitives contract; duplicated semantic values are visible. |
| Membership-only store dropdown and `STORE_MANAGER` UI capability check | RECONSIDER | Does not cover accepted inherited KPH access; preserve backend scope regardless of future UI/API shape. |
| Pilot store settings as online identity, local IndexedDB authority, trash/restore/delete and demo fallback | DISCARD FROM TARGET | ADR-0002 exception only; online authority and lifecycle differ. |
| PWA manifest naming the whole app “Phiếu KPH” / “KPH” | RECONSIDER | Accurately names current/Pilot experience but conflicts with unified Store App direction. Pages cutover remains separate. |

## D. Brand inventory and provenance

| Found asset/value | Observation and provenance | Confidence / gap |
| --- | --- | --- |
| `apps/store-pwa/public/brand/coopfood-logo.png` | 1024×550 transparent RGBA bitmap: white Co.op Food wordmark, green/lime/orange/red produce mark and Vietnamese tagline. Added in repository commit `61641a4` (2026-08-25); exact Git blob matches preserved Pages. | Actual used asset; approval/original design file/license unknown. White lettering requires suitable background. |
| `apps/store-pwa/public/icons/` | PNGs at 16, 32, 180, 192 and 512 px. Inspected 192 px: glossy green circular badge with clock/calendar and small Co.op Food mark. Added in `8f1feb4` (2026-08-26). | Actual PWA icon family; branded composition is implementation, not a confirmed logo rule. |
| `manifest.webmanifest` | `name: Co.op Food · Phiếu KPH`, `short_name: KPH`, standalone, `theme_color: #006633`, `background_color: #f4f6f4`; 192/512 files listed for `any` and `maskable`. Same manifest appears in preserved Pages. | Accurate current/Pilot app packaging, not target Store App naming. Maskable suitability not visually/device verified. |
| `styles.css` and legacy `UI_DNA.md` | Current primary `#006633`, lime `#93c11f`, warning orange `#f29200`, danger red `#e20514`, pale green canvas/surfaces; current `--font-sans` is system UI. Legacy extraction reports Montserrat in an older bundle. | Observed UI color/type values, no official palette or type specification. |
| Lucide source icons; Excel output | Current components use Lucide SVG icons. Excel code uses Times New Roman and BM-331.CF footer under workbook contract. | Lucide is an implementation choice; Excel typography is an export requirement, not UI typography. |

No separate approved brand manual, vector master, packaged UI font, or logo-use guidance was found in the inspected Store PWA assets. Do not infer brand rules from CSS hex values or the legacy extracted table.

## E. UI DNA hypotheses for later validation

1. **Operational density:** staff may need a compact first view with clear next actions rather than dashboard ornament. Validate on real store tasks and screen sizes.
2. **Persistent context:** effective store and actor may need stronger visibility around consequential create/review/export actions, especially for multi-store managers.
3. **Fast mobile entry:** scan/manual fallback, type defaults and one-hand photo capture may matter more than keeping the current modal shape.
4. **Semantic states over hue:** lookup miss vs unavailable, approval, expiry and upload progress should remain distinguishable in text and accessible status, with color as reinforcement.
5. **Evidence confidence:** ordered photos, original/stamped distinction and quick inspection may need a prominent place in create and review.
6. **Two scales of history:** high-density desktop comparison and focused mobile record/action views may need related but different compositions.
7. **Calm brand character:** the observed green/neutral field can support operational clarity, but its exact palette, typography and decoration need brand validation.
8. **Unified shell with task access:** KPH should stay quick to reach while the shell can eventually host other store capabilities without claiming those modules already exist.

## F. Tensions and gaps

| Tension / gap | Evidence and later question |
| --- | --- |
| KPH-centric workspace vs multi-module shell | Current whole screen and manifest are KPH-specific; [baseline](../STORE_APP_BASELINE.md) calls for a shared Store App shell. Explore hierarchy without inventing future module flows. |
| Brand green vs semantic green/red/orange | Logo and CSS use green while success/approval also uses green; condition/resolution use orange/red/blue. Validate distinctions, contrast and wording before tokens. |
| Modal-heavy create/filter/viewer vs mobile navigation | Screenshots show long create dialog, nested scanner/viewer and a separate mobile filter dialog; test draft continuity, keyboard/camera transitions and back behavior. |
| Desktop table heritage vs mobile operational work | Table displays many fields; card compresses metadata and places selection/review controls close together. Validate speed and error risk on devices. |
| Accepted KPH scope vs membership-derived client | Backend inheritance is accepted; current session-driven store/capability UI cannot express all effective access. Discovery API/capability shape stays outside this audit. |
| Lookup miss vs catalog unavailable | `NOT_FOUND` allows manual continuation; 503 signals unavailable catalog/primary supplier. Current catch/retry text does not establish a distinct UX policy. |
| Current visual capture vs live use | Mock Chromium captures are current-state evidence only. Real iPhone camera/HEIC, low connectivity, varied photo content and owner brand approval remain open. |

## G. Candidate screen/state set for the next exploration

Compare three representative compositions at mobile ~390×844 and desktop ~1440×1000, using synthetic data:

1. **Signed-in Store App entry:** acting account, effective/current store context and a clear KPH entry. Include a multi-store or inherited-scope variant as an unresolved context question, without specifying an API.
2. **KPH creation in progress:** type choice, scan/manual lookup outcome and ordered photo evidence in one consequential task. Use `NOT_FOUND` as the primary comparison state; annotate `FOUND` and unavailable behavior without multiplying screens.
3. **History decision:** filtered, page-local selection with review status and export eligibility/confirmation. Compare how desktop density and mobile action focus serve the same contract.

This is a direction-comparison set, not a state catalogue or acceptance suite. A future module may appear only as an IA placeholder, not as a promised implemented workflow.

## Disposable visual evidence and verification

- Built the online Store PWA into `.local/verification/online-dist` with `VITE_KPH_ONLINE=true`; build passed. Started only a loopback preview at `127.0.0.1:4174`, then stopped it. No deployment or protected branch write occurred.
- Adapted a **disposable copy** of `review-ui.cjs` under `.local/verification/` to return the accepted `contracts/fixtures/api/kph-page.json` page object; the checked-in review script still has a pre-D01 array mock. Added a short render-settle delay after an initial screenshot caught an animation before the workspace painted. Seven synthetic Chromium scenarios passed: login desktop/mobile, workspace desktop 1440×1000, tablet, mobile 390×844, small mobile and landscape. Additional approved-record desktop/mobile selection/export-confirmation captures passed.
- Representative image filenames under `.local/verification/`: `ui-after-desktop.png`, `ui-after-mobile.png`, `ui-after-form-desktop.png`, `ui-after-form-mobile.png`, `ui-after-form-end-mobile.png`, `ui-after-filter-mobile.png`, `ui-approved-selected-mobile.png`, `ui-approved-export-desktop.png`. They are ignored/disposable and use synthetic fixtures. A PWA offline-ready toast appears in captures; it is a current UI state, not a claim that online KPH mutations work offline.
- The referenced `/Users/vup/Documents/tool-kph` checkout was unavailable, so legacy assessment uses the source manifest, extracted documents and immutable Pages commit. No real-backend suite or physical-device test was rerun for this documentation task; accepted test sources and prior evidence are cited above.

Owner review should validate the source authority/classifications, choose which hypotheses to test in R1-D02, and identify any missing brand approval source. Stop after R1-D01 acceptance decision; no implementation is implied here.
