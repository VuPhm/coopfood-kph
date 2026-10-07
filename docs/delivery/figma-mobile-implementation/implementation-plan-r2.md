# Kế hoạch implementation Figma — revision 2

Ngày lập: 07/10/2026. Trạng thái: **PLANNING**.
Owner đã chọn **mobile + desktop, giữ mock** trong chat này.
Executor dự kiến: **GPT-6 Luna** (`gpt-6-luna`); chưa dispatch.
Đây là phần tiếp tục của cycle `figma-mobile-implementation`, không mở một cycle song song.

## Outcome và ranh giới

Cập nhật Store App mock theo file
[Figma aEDpXtz0IiEkPiVucqjQ3Q](https://www.figma.com/design/aEDpXtz0IiEkPiVucqjQ3Q),
gồm mobile, desktop, theme TPCN/TPTS và các trạng thái đã có ref.
Tái sử dụng rule, form, scanner, calendar, media và workbook đã kiểm.
Một writer thực hiện tuần tự; shared UI và config cũng thuộc writer đó.

Hoàn tất khi: UI thể hiện đúng các ref được giao; luồng tạo → xem lại → sửa/gửi/retry
giữ dữ liệu; filter/page/selection/export giữ contract; desktop có composition riêng;
technical gate đạt và owner có preview để nghiệm thu. Technical PASS chưa phải owner acceptance.

Ngoài scope: backend, API wiring, OpenAPI/generated client, schema/migration,
authorization mới, persistence/offline/sync, DATE production workflow, Admin redesign,
Figma writes, merge/push/deploy/cutover Pages. Không dựng lại UI DNA prototype.
Dữ liệu tổng hợp chỉ ở memory; production entry mặc định vẫn là online app hiện tại.

## Baseline và điều kiện giao Luna

- Branch/worktree thực tế: `store-app/figma-mobile-implementation`,
  `/Users/vup/Documents/coopfood-kph`.
- HEAD: `4fab6889f6cc6a7b66d25806262329cbf88ea024`.
  Đây là base commit, **không chứa candidate mobile chưa commit**.
- Code dirty/untracked gồm implementation và thay đổi có trước. Không reset,
  checkout đè, stash rồi bỏ, hoặc dùng riêng HEAD để bắt đầu.
- Rà local refs ngày 07/10; chưa fetch remote. Không suy remote freshness từ local ref.
- Tái sử dụng implementation 03/10 và repairs trong [review.md](review.md).
  Prototype source không active và tài liệu Figma `55DDRKrysV4PJXYGyRQdoC`
  là provenance; không lấy làm target lần này.
- CURRENT_STATE/NEXT còn ghi R2-01 chưa merge, trong khi Git local HEAD/main cho thấy
  merge R2-01. Khi checkpoint ghi Git thực tế cho base; chưa sửa lại toàn bộ lịch sử docs.
- Trước dispatch, integrator xác nhận writer trước đã dừng, kiểm working tree,
  tạo checkpoint có **đủ file tracked/untracked liên quan** sau kiểm tra nội dung.
  Không `git add .`. Giữ provenance cho thay đổi có trước.
- Nếu dispatch thành subagent: từ checkpoint thực tạo/attach worktree riêng,
  cập nhật base SHA/worktree/agent ID thật và allowed paths. Nếu chuyển model trong
  chat này: giữ nguyên task branch/worktree và chỉ một writer.
- Không tự tạo branch/worktree trong lượt lập kế hoạch. Chưa có candidate SHA mới.

## Bằng chứng đã đọc

Figma MCP: đọc inventory cả 5 pages; structured context kèm screenshot của
21 mobile screens, 10 desktop screens, theme contract và 5 component families.
Danh sách ID/kích thước/trạng thái đọc ở
[figma-ref-review-2026-10-07.json](figma-ref-review-2026-10-07.json).
Đã đọc semantic tokens/text styles và geometry desktop bằng script read-only;
[figma-token-reference-2026-10-07.json](figma-token-reference-2026-10-07.json)
lưu giá trị để đối chiếu, không phải token code đã đồng bộ.

Đã đối chiếu source StoreApp, KphWorkspace, DateWorkspace, ShelfLifeScreen,
CreateRecordDialog, entry mock, packages/ui, KPH_OPTIONS và tests/browser script.
Các screenshot `.local/figma-mobile/*` được xem là evidence cũ; chưa chạy lại app/browser
ngày 07/10. Con số 169 tests PASS là kết quả ghi ngày 03/10, không là gate revision 2.

## Kết luận review và cách xử lý

| Điểm lệch | Cách triển khai |
| --- | --- |
| Desktop hiện là mobile kéo giãn ở breakpoint 760px, max-width 960px | Từ 900px dùng rail 224px, utility topbar và workspace/table/modal theo desktop. 600–899 dùng intermediate layout, padding 24px. Mobile dưới 600 padding 16px. |
| Header hiện dùng icon tài khoản; Figma đã có avatar + tên + vai trò | Dùng Profile Identity Touch/Compact, mở context khi bấm; lấy mọi nhãn từ fixture duy nhất. Giữ đường về Home hiện có và browser back. |
| Create actions hiện có heading riêng và card trắng | Bỏ heading riêng trong mobile, dùng hai soft CTA “Tạo · …”, icon 15px trong holder 28px. |
| Figma mới có theme dry/fresh; form hiện đều xanh | Theme chỉ dựa trên `KphKind`; strong cho header/CTA, soft cho Create/Review/notice info. Không đổi enum, workflow hoặc quyền. |
| Filter icon hiện là funnel, pagination còn glyph ‹/› | Dùng asset Feather Sliders/ChevronLeft/ChevronRight đúng ref; không text glyph làm icon. |
| Shelf mode hiện là hai radio cards; screen hiện tại dùng manufacture toggle | Re-read leaf của screen 21:56, dùng binary switch accessible cho known/unknown. Giữ calculation/recovery. Component choice/radio còn tồn tại ở library; không áp nhầm vào mọi screen. |
| SAFE đang dùng nhãn chung “Ngày lùi hàng”; EXPIRED chưa có tag solid riêng | Map 4 nhãn đúng: An toàn / Sắp đến hạn lùi / Ngày lùi hàng / Đã hết hạn sử dụng. Dùng rules tính state; expired tag solid theo 73:9. |
| Chưa có quick shelf utility, mobile detail còn dạng sheet tổng quát | Dựng FAB 52px; mobile bottom panel, desktop anchored panel; detail screen theo 422:1797/531:2324, giữ thao tác duyệt accepted. |
| Desktop “Tra cứu” là product + lot workspace, khác shelf utility | Thêm mock LookupWorkspace riêng. Sidebar Tra cứu → lookup; tiện ích Tra hạn lùi hàng → utility. Mobile Home “Tra cứu lùi hàng” vẫn đi utility theo ref. |
| Desktop DATE là list/detail hai vùng | Dùng chung fixture/state với mobile; selection hiển thị detail pane trên desktop, sheet trên mobile. |

### Mâu thuẫn/ref chưa phủ và quyết định an toàn

1. **540:1685 TPTS desktop hiển thị option TPCN**. Có Rách bao bì/Xì chân không,
   Đổi/Xuất trả; trái `KPH_OPTIONS.TPTS`. Giữ geometry/theme của frame nhưng dùng
   option đúng: Dập úng, Thối mốc, Cận date, Hết HSD, Khác; xử lý Hủy/Khác.
   TPTS table 540:1469 cũng có sample Đổi/Xuất trả: seed mới dùng dữ liệu hợp lệ,
   không sửa rule để khớp sample. TPCN default Hủy theo code accepted,
   dù frame desktop minh họa Đổi được chọn.
2. **Derivative mobile cũ chưa theo ticket theme** (NOT_FOUND/unavailable/Khác/ảnh).
   Áp roles của foundation 537:2 xuyên Create/Review/retry. Viewer/scanner giữ
   neutral dark surface và accessible icons; không phủ theme lên evidence.
3. **Figma filter/pagination sample không quyết định semantics**:
   bộ lọc vẫn có ALL/REJECTED; select-all chỉ trang hiện tại, count thật.
   Page “26–50/86” hoặc badge “6 phiếu” không được hardcode.
   Previous arrow phải quay trái dù sample long-list đang dùng hai arrow phải.
4. **Foundation còn text cũ và leaf khác nhau**: single-choice guidance nói radio,
   screen shelf hiện dùng toggle; icon note nhắc stroke 2.35 trong khi variable
   `icon/stroke` và masters là 2. Dùng leaf/master đang áp ở assigned frame;
   không tự chỉnh Figma hoặc tạo icon family mới. Nếu leaf đọc lại vẫn mâu thuẫn,
   ghi concrete node và dừng phần phụ thuộc để owner quyết định.
5. **Tên theme soft**: foundation mô tả dry-soft/fresh-soft nhưng variable thực là
   `semantic/kph/create/dry-soft` và `.../fresh-soft`; dùng mapping tên thực,
   không tạo duplicate token vì tên prose khác.
6. **Desktop utility/full detail/filter/export/scanner/viewer không có tất cả ref**:
   dùng component và interaction đã có; ghi composition adaptation riêng.
   Không tuyên bố pixel parity cho màn chưa được thiết kế. Desktop reference cao
   900px; test 1440×1024 phải co giãn tự nhiên, không scale toàn bộ canvas.
7. **DATE “Thêm theo dõi”** có CTA nhưng chưa có form/state/API contract trong ref.
   Trong scope này dựng control disabled có giải thích “Chức năng chưa sẵn sàng
   trong bản dùng thử”; ghi backlog thiết kế workflow. Không báo fake success.
8. Barcode/KPH lookup giữ 0 hoặc 1, leading zero, NOT_FOUND và unavailable tách biệt.
   Không lấy sample DATE lot lookup để suy sản phẩm cho barcode miss.

## Hệ component và token

Tái sử dụng `packages/ui` Button/Input/Field/Dialog/Tag, Radix focus/portal;
CalendarInput, form RHF/Zod và rules tiếp tục dùng implementation hiện có.
Không tách DryForm/FreshForm; không dựng hai controller mobile/desktop.
Shared component generic ở packages/ui; KPH adapters/patterns ở app.
CSS scope rõ `.store-app` và dialogs của mock để không đổi online/Pilot/Admin ngầm.

| Figma | Code đích/tái sử dụng |
| --- | --- |
| Profile Identity 469:327 | ProfileIdentity trong packages/ui hoặc shell app nếu chỉ có consumer thật tại đây |
| Form Field 202:111; Textarea 478:3253 | Field/Input hiện có + density Touch/Compact, read-only và action slot |
| Choice 202:147; Unit Choice 202:126; Photo Action 202:161 | Tách presentational component từ form, state/register vẫn ở CreateRecordDialog |
| KPH Choice Icon 221:210; Icon Registry 25:13 | Module adapter theo condition/resolution; static SVG xuất đúng leaf |
| Primary Tabs 119:67; Filter Choice 138:114 | Tabs ngữ nghĩa cho content sets; radio/choice cho exclusive filters |
| Summary Row 277:244; Notice 277:286; Thumbnail 284:241 | Shared presentation cho Review/Detail, state/error vẫn của feature |
| KPH Type Accent 530:423; Create Choice 108:67 | KphTypeAccent/KphCreateActions dùng KphKind đã chọn |
| Result Summary 73:82; Tag 73:11; Timeline 55:47 | ShelfLifeResult và Timeline dùng result từ packages/kph-rules |
| Quick FAB 508:401; List Pagination 138:90 | App pattern, accessible names và current page state |

Token cần đối chiếu: dry `#8e555b`, fresh `#006633`,
dry-soft `#f4ebec`, fresh-soft `#eaf5ee`;
Home lookup `#2f6650`, KPH `#8e555b`, DATE `#8a6732`.
Typography Figma: Display 28/34, Title 22/28, Heading 17/22, Body 15/21,
Label 13/18, Caption 12/16. tokens.css hiện còn 26/32, 14/20, 12/16, 11/15.
Bổ sung mapping có scope; giữ compatibility aliases cho consumer cũ và test regression.
Desktop rail 224 khác token draft 240; không dùng token draft làm authority.

Icon: ưu tiên exact local asset nếu đã khớp registry/frame; còn thiếu lấy qua
Figma download_assets theo design context. Không dùng URL asset tạm trong code,
không substitute Lucide chỉ vì đã cài, không vẽ lại raw SVG. Lucide của path cũ
ngoài scope giữ nguyên. Manifest phải ghi node/slot/callsite/root size/render size;
không broad CSS `img { width:100%;height:100% }` cho icon.
Không tự thêm dependency/font. Profile có text SF Pro trong một số leaf;
nếu font không có local/approved asset, dùng font stack được repo hỗ trợ và
ghi deviation cụ thể cho owner; không tải font license không rõ.

## Thứ tự giao việc — một Luna writer

### S0 — checkpoint và baseline

Inputs: docs bắt buộc, review cũ, plan revision 2, inventory/token reference.
Integrator checkpoint candidate dirty như trên trước dispatch; Luna kiểm branch,
HEAD, writer/worktree và diff đúng checkpoint. Re-read node trước sửa từng slice;
nếu sparse phải đọc children + screenshot. Bật mock explicit:
`VITE_STORE_APP_MOCK=true npm run dev --workspace @coopfood-kph/store-pwa -- --host 127.0.0.1`.
Chạy baseline check/test; lỗi có trước ghi riêng, không tắt gate.
Output: actual base SHA, allowed paths, lệnh baseline và preview port thật.

### S1 — foundation/components/theme

Paths: packages/ui/src, DESIGN_SYSTEM.md; app CSS/assets và presentational KPH parts.
Audit token → primitive → component trước screen. Bổ sung density và theme roles,
giữ precedence error/warning/success/focus thắng theme; CTA “Xem lại/Gửi” theo type.
Chỉ tách component có consumer thật, không refactor cả app.tsx.
Checkpoint: dry/fresh × Touch/Compact; focus/error/read-only; geometry assets.
Test cần thiết: option matrix unchanged; theme không thay choice hoặc error tone;
packages/ui consumer regressions. Review component trước áp rộng.

### S2 — shell và Home mobile/desktop

Paths: store-app.tsx/css; có thể tách store-shell.tsx/profile-identity.tsx.
Dùng Home 21:3 và desktop 384:369. Rail 224 và topbar riêng >=900;
mobile header 72 và Profile Identity. Data store/account thống nhất từ mockProfile.
Home desktop 3 launcher + attention/utility panels; số cảnh báo/chờ duyệt từ
dataset đang dùng, không copy 4/2 khi dữ liệu không khớp.
Điều hướng Home/KPH/lookup/DATE/utility hoạt động, active state rõ; giữ browser back.
Resize không reset draft, selection hoặc filter.
Checkpoint Playwright: 390×844 / 1440×1024, nav/current context/no overflow.

### S3 — KPH browse/filter/paging/export/detail

Paths: store-kph-workspace.tsx và tests; có thể tách kph-ticket-card/table/detail.
Mobile card và desktop semantic table dùng cùng dataset/query state.
Desktop toolbar/search/scan/filter/export; search chỉ filter mock dataset,
không thêm full-text API. Filter trước page; sort product/supplier/ngày
theo labels, không ép enum order. Sort direction và tie-breaker xác định.
Page size 25 cho fixture đủ lớn; thay hardcode 4 và sửa test page-local selection.
Tab count từ date-filtered dataset độc lập approval/type; toolbar total từ active filter.
Selection reset khi type/filter/sort/search/page/context đổi. Click detail rồi quay lại
giữ filter/page; khi filter/page đổi đóng detail. Duyệt mock giữ cả APPROVED/REJECTED.
Export chỉ eligible của trang/type; summary excluded count đúng; download workbook thật.
Desktop selection/approval controls là adaptation của workflow accepted dù table ref
chưa vẽ đủ; không bỏ capability để khớp screenshot.
Detail mobile theo 422:1797/531:2324; desktop responsive detail composition được ghi rõ.
Checkpoint: dataset >25/type, mixed approval/date, long labels, leading zero,
first/middle/last page; exported .xlsx đúng selection, không chỉ assertion filename.

### S4 — KPH Create/Review và derivative states

Paths: create-record-dialog.tsx, scanner/viewer/calendar (chỉ styling/presentation)
và tests. Giữ form controller/validation/photo processing/idempotency hiện có.
Mobile full-screen 1 cột, sticky footer không che field; desktop modal tối đa 1180px,
3 cột theo 384:1072/540:1685, header/footer cố định, body scroll khi viewport thấp.
Review desktop 3 vùng theo 384:1416/540:2091. Không đơn giản đổi về
`presentation="dialog"`: hiện review chỉ chạy ở screen presentation;
phải tách review-enabled flow khỏi lựa chọn bố cục.
Date phát hiện read-only theo giờ Việt Nam, không dùng ngày fixture cố định cho create.
TPTS đúng option contract; Khác optional; 1–3 ảnh có originalFile và order,
edit/back giữ draft; review chưa save, submit once/retry cùng idempotency key.
State matrix cho cả 2 type: empty/found/miss/unavailable/Khác/1–3 ảnh/viewer/scanner/
review/edit/submitting/submit-error/retry. Draft-only remove photo; detail ảnh đã lưu
không có thao tác xóa. Resize khi form mở giữ focus hợp lý và toàn bộ draft.
Checkpoint component + browser ở cả viewport, dry/fresh theme và state precedence.

### S5 — shelf utility + quick panel

Paths: store-shelf-life.tsx và tests; có thể tách shelf-life-result/quick-panel.
Dùng cùng calculator/controller cho standalone và quick; share presentation/result
khi phù hợp, không nhân bản business formula.
FAB ở KPH và DATE; mobile bottom panel 510:2094, desktop anchored panel 515:3508
(406px reference, clamp theo viewport), không reset workspace nền khi đóng.
Quick panel không modal hóa desktop nếu leaf ref cho thấy background vẫn thao tác được;
keyboard focus vào panel khi mở, Escape đóng và trả focus về FAB, không backdrop giả.
Standalone desktop utility chưa có frame riêng: compose từ component/utility pattern,
ghi adaptation; không dùng product LookupWorkspace thay utility.
Known/unknown NSX; input days/months là alternative, không cộng cả hai;
sửa/clear anchor hoặc duration xóa derived date/result cũ.
Giữ shelfLife inclusive, HSD > NSX, threshold 9/10, round20/40, calendar/leap/end-month.
SAFE/WARNING/DANGER/EXPIRED, timeline today và endpoint trùng short shelf đều đọc được.
Checkpoint deterministic clock theo Asia/Ho_Chi_Minh; cảnh báo bằng nhãn + màu.

### S6 — product lookup + DATE mock workspace

Paths: store-date-workspace.tsx/mock; mới store-lookup-workspace.tsx và tests.
Fixture product/lot/alerts thống nhất, có IDs string và store context.
Lookup desktop 384:514: search/scan → product summary + tracked lots table;
fixture deterministic found/miss/unavailable; không fuzzy guess khi barcode miss.
Standalone product lookup chưa có mobile ref: mobile xếp summary/lots 1 cột,
ghi adaptation và không đổi Home utility route.
DATE mobile 21:144, desktop 384:897: list/detail, active row, status
open/acknowledged/resolved, counts/search/filter đều từ fixture.
Chỉ mock Ghi nhận/Đã xử lý; cập nhật counts/status/detail nhất quán, không báo server write.
“Thêm theo dõi” deferred như quyết định trên; không invent modal nghiệp vụ.
Checkpoint: tab/filter/search/scan/manual fallback, acknowledge/resolve, empty result,
selected lot ẩn do filter thì detail xử lý rõ; desktop không hiển thị stale lot.

### S7 — tích hợp, verification, preview và dừng

Chạy gate tích hợp trên actual candidate SHA; lưu output và screenshot paths.
Rà đúng scope/ref, một blocker list mỗi vòng, tối đa 2 vòng review.
Sửa blocker theo slice, không mở audit toàn repository.
Cập nhật technical-evidence-r2.md và acceptance-handoff-r2.md; owner dùng preview.
Sau technical PASS → AWAITING_ACCEPTANCE; owner feedback thật mới CLOSED.
Không tự nối API hoặc mở milestone tiếp.

## Gates kỹ thuật và nghiệm thu

Lệnh tích hợp hiện có:

```sh
npm run verify
git diff --check
STORE_APP_URL=http://127.0.0.1:<actual-port> node e2e/scripts/check-figma-mobile.cjs
node tooling/skills/delivery-cycle/scripts/cycle.mjs check --repo "$PWD" --plan docs/delivery/figma-mobile-implementation/plan.json --phase acceptance
```

Lệnh browser cần cập nhật script hiện có để kiểm composition mới; thêm file
check-figma-responsive.cjs nếu chia suite hợp lý, rồi ghi exact command đã chạy.
Không chạy nguyên placeholder port. Không có backend change thì không cần full
backend suite; npm verify vẫn giữ contracts/generated API drift và online/Pilot tests.

| Gate | Bằng chứng yêu cầu |
| --- | --- |
| T1 workspace integrity | verify PASS, không bỏ tests, API/schema diff rỗng; legacy entry default unchanged |
| T2 workflow/semantics | both kinds; defaults; draft/edit/retry; 1–3 photos/order; D01 reset/counts; real mock workbook content |
| T3 visual/interaction | headless 390×844 và 1440×1024; targeted DOM, keyboard/focus, screenshots đối chiếu exact refs |
| T4 responsive/assets | 599/600 và 899/900 smoke; reference 1440×900 screenshot cho desktop; no overflow; local non-empty assets + slot/root/render geometry |
| U1 owner | review mobile và desktop, nhận xét/decision thật trên candidate SHA; không reuse acceptance cũ cho scope mới |

Targeted Playwright thêm: modal/tab keyboard, Escape/return focus, resize khi có draft,
sticky footer không che focus, reduced motion, long product/supplier/profile name.
Table row mở detail có button/link keyboard reachable; sort aria-sort;
tabs/radios semantics đúng. Không dùng screenshot rộng làm pixel snapshots.

Owner scenarios:

1. Home/context → KPH, DATE, utility; desktop sidebar/attention panels đúng data.
2. Tạo TPCN và TPTS; kiểm theme nhưng choices vẫn đúng; thêm ảnh → xem lại →
   sửa → gửi; mô phỏng lỗi và retry vẫn giữ ảnh/draft.
3. Hơn một trang KPH; filter/sort/page/select-all; detail/quay lại; duyệt mock;
   export đúng loại, đúng các phiếu approved đã chọn.
4. Tra hạn lùi known/unknown, clear duration, 4 state; mở quick panel từ KPH/DATE
   rồi đóng vẫn giữ workspace.
5. Desktop Lookup product/lots và DATE list/detail; search/miss/acknowledge/resolve
   cập nhật UI nhất quán; reload reset memory như đã công bố.

## Allowed paths và điểm dừng

Luna sole writer: `apps/store-pwa/src/store-*.tsx` và tests cùng nhóm,
`store-app.css`, `figma-assets.ts`, `public/figma/**`;
`create-record-dialog.tsx`, `barcode-scanner-dialog.tsx`, `image-viewer.tsx`,
`calendar-input.tsx` và tests tương ứng cho presentation;
`packages/ui/src/**`, `packages/ui/DESIGN_SYSTEM.md`;
`e2e/scripts/check-figma-*.cjs`; delivery record và CURRENT_STATE/NEXT.
Danh sách glob ở prose để mô tả; plan.json dùng exact paths/prefix hợp checker.

`packages/ui/package.json`, store entry/vite/styles config chỉ sửa nếu cần export/
import/mock boundary, ghi lý do. Root package/lock/config do integrator giữ;
yêu cầu dependency mới phải chứng minh thiếu component thật.
Không sửa `app.tsx`/online-kph/controller cũ, packages/kph-rules, backend/contracts
để làm screenshot khớp. Không sửa AGENTS.md.

Risks: baseline dirty chưa checkpoint; tokens CSS chia sẻ Admin/Pilot nên cần scope;
asset variants/icon placeholder ở library chưa hoàn chỉnh; incomplete desktop ref;
DATE/Lookup chỉ presentation mock; camera OS/iPhone/HEIC chưa kiểm. Các lỗi ở
ref đã liệt kê được giải bằng contract hoặc leaf; bất kỳ mâu thuẫn nghiệp vụ mới
không giải được an toàn phải ghi node + rule và dừng đúng phần đó.

Bước nhỏ tiếp theo khi owner yêu cầu implement: integrator checkpoint candidate,
chốt actual SHA/worktree, chuyển giao [luna-6-handoff.md](luna-6-handoff.md);
Luna bắt đầu S0–S1, rồi đi tuần tự theo dependency.

## Danh mục screen refs giao Luna

Tất cả các ref dưới đây đã đọc structured context và screenshot ngày 07/10.
Re-read node được giao trước khi sửa; inventory không thay design context.

Kiểm chứng lượt lập kế hoạch 07/10: `node scripts/check-docs.mjs` PASS;
`git diff --check` PASS. Kiểm JSON/local references xác nhận 37 unique context
responses có screenshot, không sparse; hash 97 non-doc input files không đổi.
Không chạy lại `npm run verify`, application Playwright hoặc backend suite trong
lượt docs-only này. Dispatch/acceptance/close checker chưa chạy vì chưa có
checkpoint/candidate revision 2 và chưa có owner acceptance.

| Bản | Screen/state | Node | Kích thước |
| --- | --- | --- | --- |
| Mobile | Landmark/Home | [21:3](https://www.figma.com/design/aEDpXtz0IiEkPiVucqjQ3Q?node-id=21-3) | 390×844 |
| Mobile | Landmark/Shelf Life | [21:56](https://www.figma.com/design/aEDpXtz0IiEkPiVucqjQ3Q?node-id=21-56) | 390×844 |
| Mobile | Landmark/KPH | [21:91](https://www.figma.com/design/aEDpXtz0IiEkPiVucqjQ3Q?node-id=21-91) | 390×844 |
| Mobile | Landmark/Date Manager | [21:144](https://www.figma.com/design/aEDpXtz0IiEkPiVucqjQ3Q?node-id=21-144) | 390×844 |
| Mobile | Landmark/KPH · Filter open | [124:384](https://www.figma.com/design/aEDpXtz0IiEkPiVucqjQ3Q?node-id=124-384) | 390×844 |
| Mobile | Landmark/KPH · Export confirm | [124:445](https://www.figma.com/design/aEDpXtz0IiEkPiVucqjQ3Q?node-id=124-445) | 390×844 |
| Mobile | Landmark/KPH · Selection mode | [128:494](https://www.figma.com/design/aEDpXtz0IiEkPiVucqjQ3Q?node-id=128-494) | 390×844 |
| Mobile | Landmark/KPH · Long list pagination | [141:641](https://www.figma.com/design/aEDpXtz0IiEkPiVucqjQ3Q?node-id=141-641) | 390×844 |
| Mobile | KPH Create / TP khô & khác | [203:701](https://www.figma.com/design/aEDpXtz0IiEkPiVucqjQ3Q?node-id=203-701) | 390×1471 |
| Mobile | KPH Create / TP tươi sống | [203:847](https://www.figma.com/design/aEDpXtz0IiEkPiVucqjQ3Q?node-id=203-847) | 390×1419 |
| Mobile | KPH Create / TP tươi sống · Đã có ảnh | [209:895](https://www.figma.com/design/aEDpXtz0IiEkPiVucqjQ3Q?node-id=209-895) | 390×1509 |
| Mobile | KPH Create / Evidence Viewer | [215:1147](https://www.figma.com/design/aEDpXtz0IiEkPiVucqjQ3Q?node-id=215-1147) | 390×844 |
| Mobile | KPH Review / TP tươi sống | [279:1299](https://www.figma.com/design/aEDpXtz0IiEkPiVucqjQ3Q?node-id=279-1299) | 390×1067 |
| Mobile | KPH Create / Barcode Scanner | [279:1398](https://www.figma.com/design/aEDpXtz0IiEkPiVucqjQ3Q?node-id=279-1398) | 390×844 |
| Mobile | KPH Create / NOT_FOUND | [280:1377](https://www.figma.com/design/aEDpXtz0IiEkPiVucqjQ3Q?node-id=280-1377) | 390×1490 |
| Mobile | KPH Create / CATALOG_UNAVAILABLE | [280:1571](https://www.figma.com/design/aEDpXtz0IiEkPiVucqjQ3Q?node-id=280-1571) | 390×1490 |
| Mobile | KPH Create / Khác | [280:1773](https://www.figma.com/design/aEDpXtz0IiEkPiVucqjQ3Q?node-id=280-1773) | 390×1527 |
| Mobile | KPH Review / Gửi lỗi | [280:1915](https://www.figma.com/design/aEDpXtz0IiEkPiVucqjQ3Q?node-id=280-1915) | 390×1078 |
| Mobile | KPH Detail / KPH-260815-017 | [422:1797](https://www.figma.com/design/aEDpXtz0IiEkPiVucqjQ3Q?node-id=422-1797) | 390×1128 |
| Mobile | Landmark/KPH · Quick Shelf Life Bottom Panel | [510:2094](https://www.figma.com/design/aEDpXtz0IiEkPiVucqjQ3Q?node-id=510-2094) | 390×844 |
| Mobile | KPH Detail / KPH-260815-018 | [531:2324](https://www.figma.com/design/aEDpXtz0IiEkPiVucqjQ3Q?node-id=531-2324) | 390×1144 |
| Desktop | Screen | [384:369](https://www.figma.com/design/aEDpXtz0IiEkPiVucqjQ3Q?node-id=384-369) | 1440×900 |
| Desktop | Screen | [384:514](https://www.figma.com/design/aEDpXtz0IiEkPiVucqjQ3Q?node-id=384-514) | 1440×900 |
| Desktop | Screen | [384:683](https://www.figma.com/design/aEDpXtz0IiEkPiVucqjQ3Q?node-id=384-683) | 1440×900 |
| Desktop | Screen | [384:897](https://www.figma.com/design/aEDpXtz0IiEkPiVucqjQ3Q?node-id=384-897) | 1440×900 |
| Desktop | Screen | [384:1072](https://www.figma.com/design/aEDpXtz0IiEkPiVucqjQ3Q?node-id=384-1072) | 1440×900 |
| Desktop | Screen | [384:1416](https://www.figma.com/design/aEDpXtz0IiEkPiVucqjQ3Q?node-id=384-1416) | 1440×900 |
| Desktop | Screen / KPH · Quick Shelf Life | [515:3508](https://www.figma.com/design/aEDpXtz0IiEkPiVucqjQ3Q?node-id=515-3508) | 1440×900 |
| Desktop | Screen | [540:1469](https://www.figma.com/design/aEDpXtz0IiEkPiVucqjQ3Q?node-id=540-1469) | 1440×900 |
| Desktop | Screen | [540:1685](https://www.figma.com/design/aEDpXtz0IiEkPiVucqjQ3Q?node-id=540-1685) | 1440×900 |
| Desktop | Screen | [540:2091](https://www.figma.com/design/aEDpXtz0IiEkPiVucqjQ3Q?node-id=540-2091) | 1440×900 |
