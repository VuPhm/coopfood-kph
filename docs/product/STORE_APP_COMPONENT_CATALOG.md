# Danh mục component Store App

**Vật liệu/khối/viền — reference22/10/2026:**
[STORE_APP_SURFACE_STYLE](STORE_APP_SURFACE_STYLE.md) ghi recipe thật và số đo
Home, các token hiện có trong `store-glass.css`, cascade và cách áp có scope.
Dùng trước khi thêm card style khác. Không có primitive/card API mới ở lượt
hệ thống hoá này; các đề xuất refactor trong catalog vẫn là đề xuất.

Rà soát **12/10/2026**, nhánh `store-app/figma-mobile-implementation`, base
`c6d9fa5` và working tree có follow-up KPH/DATE ngày 11–12/10. Lượt này chỉ cập
nhật tài liệu để quản lý/tìm component; đề xuất bên dưới chưa triển khai.

**Kết luận:** primitive đã đủ cho màn hiện tại. Ưu tiên hoàn thiện Field
accessibility, gom nền token Fresh và tái sử dụng mẫu trình bày có consumer thật.
Chưa cần thêm thư viện UI hoặc component cho module chưa có requirement.

Authority: [contract](STORE_APP_CONTRACTS.md), [UI DNA](STORE_APP_UI_DNA.md),
[Co.op Fresh](STORE_APP_VISUAL_DNA.md), [ADR-0001](../adr/0001-foundation-stack.md)
và [ADR-0006](../adr/0006-store-app-evolution.md). Source là bằng chứng
implementation; test đạt không thay nghiệm thu owner.

FORM01 candidate24/10: presentation form dùng [Co.op Fresh Soft](STORE_APP_SURFACE_STYLE.md)
qua stylesheet local `store-form-soft.css`; tái dùng component/semantics hiện có,
không thêm primitive hay API form. [Scope/checks](../delivery/form01-fresh-soft/technical.md).

## Nơi quản lý

| Lớp | Nơi | Ranh giới |
| --- | --- | --- |
| Primitive | [packages/ui](../../packages/ui/src/index.ts) | Trình bày không biết KPH/DATE; Store + Admin dùng chung. Một integration owner quản lý API/export. |
| Mẫu Store | [apps/store-pwa/src](../../apps/store-pwa/src/store-app-frame.tsx) | Page kit/header/sheet/sort/loading trong Store; ở app khi chưa có consumer Admin thực. |
| Nghiệp vụ | KPH/DATE/tra hạn/account | Consumer giữ dữ liệu, validation, filter/reset, quyền và hành động. |
| Prototype/evidence | [UI DNA prototype](../../apps/store-pwa/src/ui-dna-prototype.tsx), docs/delivery | Tham khảo lịch sử, không mặc định là mẫu production/Fresh hiện hành. |

[`main.tsx`](../../apps/store-pwa/src/main.tsx) nạp `StoreApp` khi
`VITE_STORE_APP_MOCK=true`, còn `App` là online/Pilot path. `StoreAppFrame` là
frame Fresh trong mock; [`StoreAppShell`](../../apps/store-pwa/src/store-app-shell.tsx)
là composition seam online hiện có. Không nhập hai frame chỉ để giống hình ảnh.
DATE đang dùng dữ liệu mẫu trong phiên, chưa có API DATE.

## Primitive đã có

Follow-up 12/10: [cơ chế nhãn màu](LIST_LABEL_SYSTEM.md) đã có `ListLabel`
compose từ Tag và adapter riêng KPH. Triển khai trước Store Fresh KPH;
owner đã duyệt nhãn/choice/bar KPH, checkpoint `5fdfa3e`. Rollout cả hai lớp
đã áp dụng DATE, Tra hạn history, KPH online/Pilot và Admin identity/lifecycle/
catalog; chờ owner xem phần nhân rộng. DATE dùng [mốc Tra hạn](DATE_MILESTONE_MODEL.md).
[Bàn giao](../delivery/list-label-rollout/handoff.md).

“Đã có” ghi nhận source, không tuyên bố mọi biến thể đã nghiệm thu/accessibility PASS.

| Component / source | API, biến thể hiện có | Consumer / quyết định |
| --- | --- | --- |
| [Button](../../packages/ui/src/button.tsx) | `primary/secondary/danger/ghost`; size `default/icon/large`; `asChild`, native props | Store + Admin. Busy dùng label/disabled/ARIA ở caller, chưa có prop loading. CTA Fresh cam/xanh hiện do CSS Store bổ sung. |
| [Input](../../packages/ui/src/input.tsx) | Native props/ref; disabled/readOnly/aria-invalid | Store + Admin. Focus dựa vào stylesheet ứng dụng; gallery cần nạp CSS thật. |
| [Field](../../packages/ui/src/field.tsx) | label/htmlFor/hint/error/required/children | Store form + Admin. Có label và alert lỗi; cần nối description/error với input. |
| [Dialog family](../../packages/ui/src/dialog.tsx) | Root/Trigger/Close, Content/Header/Title/Description; closeTone/closeLabel, modal/non-modal | Store + Admin. Giữ Radix focus/dismiss/scroll, trả focus về ordinary opener. |
| [CloseButton](../../packages/ui/src/close-button.tsx) | neutral/inverse; native props/ref; default type button, label “Đóng” | Modal/viewer/PWA status. Vùng chạm 44 px/glyph 20 px. |
| [Tag](../../packages/ui/src/tag.tsx) | orange/green/red/blue/gray; sm/md; asChild | Consumer cũ/prototype; làm nền compose cho ListLabel. Feature quyết định mapping status; DATE dùng ListLabel. |
| [ListLabel](../../packages/ui/src/list-label.tsx) | neutral/info/process/warning/danger/success; icon/category/native span props | KPH Fresh/online/Pilot, DATE, lịch sử Tra hạn, Admin identity/lifecycle/catalog. Nhãn đọc chữ/icon/màu, wrap nội dung dài; adapter app giữ mapping. |
| [ListItemMarker](../../packages/ui/src/list-item-marker.tsx) | tone/variant/className; dot 18px/quầng + 8px/chấm, bar 4px bo tròn; aria-hidden | Các list nghiệp vụ Store/Admin; pattern card/cell dành gutter 28px, bar 3px/36px mobile/24px desktop, inset 12px. KPH giữ grid riêng và skeleton. App quyết định màu từ tình trạng, luôn kèm nhãn chữ. |
| [Card](../../packages/ui/src/card.tsx) | default/soft/attention; section props | Consumer ở prototype; không mặc định geometry là thẻ Fresh đã duyệt. |
| [SectionTitle](../../packages/ui/src/card.tsx) | title/description/action | Consumer ở prototype, chưa là heading chung KPH/DATE Fresh. |
| [BottomNavigation](../../packages/ui/src/card.tsx) | items/activeItem/onSelect/label; button + aria-current | Consumer ở prototype. Toolbar Fresh dùng link hash trong frame; giữ deep link khi thiết kế lại. |

[`cn`](../../packages/ui/src/cn.ts) là utility, `DismissableLayerBranch` là
helper cho calendar portal, không cần thiết kế hình ảnh riêng. Shared tests có
cho Button/Input/Dialog/CloseButton/Tag; chưa có file test riêng Field/Card/navigation.

## Mẫu và component trong Store

| Nhóm / source | Tái sử dụng và giới hạn |
| --- | --- |
| [Global frame](STORE_APP_FRAME.md) | Registry `store-app-routes.ts` cấp metadata cho AppHeader/Home/sidebar/mobile. Một page kit cho cả login/Home/Tra hạn/nghiệp vụ; AppHeader 72px, không mode rộng/gọn. CSS shared giữ root/hero/surface geometry. Loading/live dùng cùng StoreAccountTrigger từ profile. Avatar 44px/ảnh 40px, feature không override chrome. |
| [StoreNavigation](../../apps/store-pwa/src/store-navigation.tsx) + [Home](../../apps/store-pwa/src/store-home.tsx) | Đọc feature metadata từ registry chung, launcher bốn nút, sidebar desktop 248px/mobile ba ô Home/Thông báo/gần nhất; preference ID hợp lệ trong sessionStorage, storage failure vẫn dùng được. Loading/runtime cùng component. [Thiết kế](STORE_NAVIGATION_DESIGN.md); candidate 21/10 chờ owner. |
| [StoreNotifications](../../apps/store-pwa/src/store-notifications.tsx) | Empty state theo quyết định owner, hero compact/nắp trắng; chưa có API/badge/push. |
| [StorePageLayout/Hero/Surface](../../apps/store-pwa/src/store-page-hero.tsx) | Ba vị trí lắp chung: AppHeader, nội dung xanh, nội dung trắng. Layout100%/gradient/sticky/overlap 12/góc 24/gutter chung trong store-header.css; feature giữ nội dung, không density/title class/khung ngoài riêng. StoreReportPage compose kit cho menu; login cũng cùng kit, form một cột. [Quy tắc 22/10](STORE_APP_FRAME.md); owner cho merge, đã tích hợp main local ([hồ sơ](../delivery/header-style-rollout/merge-2026-10-22.md)). |
| [StoreSheet + Summary](../../apps/store-pwa/src/store-sheet.tsx) | Sheet modal mobile/centered desktop; `dl` nhãn/giá trị. Caller giữ state/action; Radix giữ focus/dismiss. |
| [StoreQuickSort + QuickSortButton](../../apps/store-pwa/src/store-quick-sort.tsx) | Đã dùng chung KPH/DATE và loading trigger. Non-modal, áp dụng ngay, Arrow/Home/End, Escape/outside/focus. [KPH adapter](../../apps/store-pwa/src/store-kph-sort.tsx) và DATE giữ options riêng. CSS chung còn ở file KPH. |
| [StoreStickyTabs](../../apps/store-pwa/src/store-sticky-tabs.tsx) + [CSS](../../apps/store-pwa/src/store-sticky-tabs.css) | Follow-up 15/10: KPH/DATE và loading KPH dùng chung lớp tab trắng, native sticky theo safe-area khi nắp lên đỉnh. Giữ group/aria-pressed của caller; focus reveal chỉ đo khi focus. DATE desktop neo trong cột list. [Evidence](../delivery/figma-mobile-implementation/sticky-tabs.md); owner chấp nhận preview bằng “pass, merge” ngày 16/10, chưa xác minh thiết bị thật. |
| Filter, count switch, choice KPH/DATE | Khung nhóm/check/badge/footer và hàng selected 44 px còn JSX/CSS lặp. KPH giữ ngày/approval/selection reset; DATE giữ status/query. `store-tabs` đang là group + aria-pressed, không phải ARIA tabs. |
| Tìm/quét | Có thể dùng lại phần trình bày có label/icon/vùng chạm. KPH search lọc phiếu nhưng nút scan mở tạo phiếu theo loại; DATE scan tìm lô. Không đồng nhất callback. |
| [ShelfLifeTimeline](../../apps/store-pwa/src/store-shelf-timeline.tsx) | Tra hạn và DATE detail dùng chung mốc/today/short-life/edge clamping. Component memo ở app; rule do caller tính. DATE dùng màu chữ Fresh, nhãn wrap ở khung hẹp; không dùng timeline trong list. |
| [CalendarInput](../../apps/store-pwa/src/calendar-input.tsx) | Nhập ngày/calendar portal, icon tùy chọn, readOnly/invalid/description. Giữ dd/mm/yyyy, keyboard/nested modal. Ở app vì phụ thuộc date rules và CSS Store. |
| [BarcodeScannerDialog](../../apps/store-pwa/src/barcode-scanner-dialog.tsx) | Camera/đổi camera/torch/recovery. Giữ identifier string/leading zero; caller phân biệt found/miss/service unavailable. |
| [EvidenceImageViewer](../../apps/store-pwa/src/image-viewer.tsx) | Dialog/overlay, index/count, previous/next/remove khi caller cung cấp. Caller giữ thứ tự 1–3 ảnh và quyền; viewer không quyết định private media authority. |
| [StoreKphList](../../apps/store-pwa/src/store-kph-list.tsx) | Mobile card/desktop table, chỉ mount một layout; skeleton dùng cùng list. UI revision5 đã duyệt ngày22/10 mặc định nhóm ngày, grouping trong lọc. Thu/mở cả khi Chọn; checkbox riêng44px, tick mixed theo tập đã tải; desktop click toàn hàng/chevron, OTHER title/ellipsis; mobile `KphTagStrip` cuộn ngang độc lập. `StoreKphMore` nối25 giữ chọn/tập đã tải; approval semantics giữ nguyên. [Phạm vi Store Fresh](KPH_COMPACT_HISTORY.md); online D01 riêng. |
| [Loading KPH](../../apps/store-pwa/src/store-kph-loading.tsx), [bootstrap](../../apps/store-pwa/src/store-loading-frame.tsx), [recovery](../../apps/store-pwa/src/feature-loading.tsx) | Geometry thật, busy/status/retry. Đổi control thật phải đổi loading tương ứng; không tạo record online giả để lấp khung. |
| [CreateRecordDialog](../../apps/store-pwa/src/create-record-dialog.tsx) | Form screen/dialog, review trước gửi, ảnh đúng thứ tự. Fresh host dùng embedded body để portal/chrome/focus không remount khi lazy/review; default online/Pilot dialog giữ riêng. Giữ RHF/Zod/lookup/media/review và authority. |
| [KphCreateButton](../../apps/store-pwa/src/store-kph-create-button.tsx) | Native CTA có kind TPCN/TPTS, accessible name/haspopup, PackagePlus/Leaf/chevron, same geometry live/skeleton; handler ở workspace. [Host/evidence 13/10](../delivery/figma-mobile-implementation/kph-create-panel.md) dùng panel mobile/modal desktop, khung nhẹ trước/form sau entrance; owner/device acceptance pending. |
| [ShelfLifeScreen](../../apps/store-pwa/src/store-shelf-life.tsx) + [history](../../apps/store-pwa/src/store-shelf-history.tsx) | Form/result dùng màn chính và popup; history chỉ màn chính, 20 lần hợp lệ trong phiên. Không nhập với [ExpiryWorkbench](../../apps/store-pwa/src/expiry-dialog.tsx) chỉ để đồng nhất visual. |
| [Account](../../apps/store-pwa/src/store-account-sheet.tsx) + [StoreLogin](../../apps/store-pwa/src/store-login.tsx) | Account control/sheet; login dùng ở online gateway. Giữ session/store authority, password nguyên vẹn, busy/error recovery; Admin có scope riêng. |

## Ưu tiên bổ sung

| Ưu tiên | Bằng chứng | Bước nhỏ / điều kiện hoàn tất |
| --- | --- | --- |
| 1. Field accessibility | Field render hint/error thành `p` không có ID; nhiều input create form chưa truyền aria-describedby/aria-invalid theo lỗi. Label vẫn có; alert không thay liên kết mô tả khi focus lại. | Cấp description/error ID, nối tại consumer, invalid/required phù hợp. Test lỗi đúng field và ID không trùng khi nhiều form; giữ validation. |
| 2. Nền token Fresh | KPH Fresh khai báo `--store-*` cho app/form/sheet/sort; DATE sheet lặp nhiều vai trò cùng giá trị. Home/login còn literal. Shared dialog CSS còn palette/motion riêng ảnh hưởng Admin. | Tách stylesheet nền Store, import sớm cho frame/loading và phủ portal ngoài `.store-app`. Giữ giá trị accepted; kiểm Store/Admin trước khi đổi token global. |
| 3. Filter/count switch | Filter group/footer và selected/check/badge lặp; QuickSort đã shared thực. | Đề xuất `StoreFilterSection`, `StoreFilterFooter`, `StoreCountSwitch` trong app. Nhận children/options/callback, không rule KPH/DATE; kiểm áp dụng ngay, query retained và selection reset riêng. Các tên này chưa có export. |
| 4. CSS mẫu chung | DATE dùng QuickSort nhưng phải nạp CSS trong `store-kph-fresh.css` qua frame. | Đưa CSS chung về mẫu Store sau bước token; giữ thứ tự cascade, focus và trigger/skeleton geometry. |
| 5. Catalog trực quan | Chưa có gallery/Storybook trong source rà soát; một số primitive test chỉ kiểm class. | Khi cần duyệt độc lập, gallery development dùng component/CSS thật + fixture tổng hợp, đủ default/selected/focus/disabled/busy/error/empty, mobile/desktop. Chưa cần thêm route nghiệp vụ/dependency. |

Điểm 2–5 là cải thiện quản lý, không phải kết luận runtime lỗi. Điểm 1 xác định
từ source, chưa thử screen reader thực tế. Lucide và Figma SVG Feather đã kiểm
cùng tồn tại; mapping mới cần kiểm từng slot, không thay icon toàn bộ tự động.

## Cách quản lý thiết kế tiếp theo

1. Tìm ở catalog trước; ghi consumer, trạng thái và contract bị tác động. Mẫu
   Store ở app; primitive dùng chung vào packages/ui với một integration owner.
2. Ghi biến thể theo action/status/density/viewport. Pastel module không thay
   status. Giữ vùng chạm 44 px, CTA 48 px khi mẫu đã chốt, focus/reduced motion/
   safe-area; không thu chữ để ép mật độ.
3. Có Figma assignment thì đọc đúng node/context/screenshot trước sửa. Proposal
   ở candidate riêng, không ghi đè frame accepted. Lượt này không sửa Figma hoặc
   xác minh parity với node mới.
4. Sửa component cùng consumer/loading/check liên quan. Playwright DOM/interaction/
   screenshot ở 390×844 và 1440×1024, thêm 320 px cho form/chữ dài; kiểm Admin
   khi đổi shared UI. Cập nhật catalog source/variants/consumer/evidence/acceptance.

Home/hướng Fresh và account/login có acceptance được ghi trong DNA, KPH r13 đã
duyệt. Follow-up KPH filter/sort và DATE bố cục mới vẫn pending owner; catalog
không chuyển các gate này sang accepted.

## Kiểm chứng 12/10/2026

| Lệnh | Kết quả |
| --- | --- |
| `npm --workspace @coopfood-kph/ui test` | PASS 13 tests / 5 files. |
| `npm --workspace @coopfood-kph/store-pwa test -- src/calendar-input.test.tsx src/store-kph-workspace.test.tsx src/store-date-workspace.test.tsx src/store-date-lookup.test.tsx src/create-record-dialog.test.tsx src/image-viewer.test.tsx src/barcode-scanner-dialog.test.tsx` | PASS 56 tests / 7 files. |
| `STORE_PREVIEW_URL=http://127.0.0.1:4213 STORE_KPH_COLORS_OUTPUT=.local/component-review/kph node e2e/scripts/check-kph-filter-sort.cjs` | PASS 390×844/1440×1024/320×844: sort/filter/reset, selection/date guard, keyboard/calendar/focus, touch/bounds/contrast. |
| `STORE_PREVIEW_URL=http://127.0.0.1:4213 STORE_KPH_COLORS_OUTPUT=.local/component-review/date node e2e/scripts/check-date-kph-reference.cjs` | PASS ba viewport: sort/filter sync, reset giữ query, keyboard/outside/focus, touch/bounds/contrast. |
| `npm run check:docs`, `git diff --check`, kiểm link relative trong ba tài liệu đổi | PASS; 52 link relative trỏ tới file/thư mục hiện có. |

Playwright headless chạy dev mock của working tree; sandbox chặn listen localhost
và Chromium SIGTRAP, chạy ngoài sandbox sau automatic approval đã thành công.
Evidence local `.local/component-review/kph` và `.local/component-review/date`
có screenshot/contrast JSON; đã xem ảnh filter KPH 390 px và DATE desktop.
Đây không phải gate toàn app/build production/real-backend/camera thật/owner
acceptance. Không chạy full build cho lượt tài liệu vì không đổi runtime.

**Bước nhỏ tiếp theo:** hoàn thiện Field description/error linkage trên một form
KPH và kiểm consumer Admin liên quan, rồi mới gom token/mẫu Fresh. Component
mới chỉ thêm khi consumer hoặc trạng thái thực tế cần.

Choice Fresh dùng [`KphChoiceContent`](../../apps/store-pwa/src/store-kph-choice.tsx)
chung với skeleton: icon/label/check; form giữ native radio, enum/default và OTHER.
Palette choice lấy từ tone của KPH_OPTIONS qua getKphChoicePresentation,
tách khỏi nhãn trạng thái record; layout hai cột với condition Khác ở hàng cuối.

Adapter nhân rộng: [DATE](../../apps/store-pwa/src/store-date-label.tsx),
[history Tra hạn](../../apps/store-pwa/src/store-shelf-label.tsx),
[Admin](../../apps/admin-web/src/list-labels.tsx);
[history KPH](../../apps/store-pwa/src/history-records.tsx) reuse adapter KPH.
Không đưa enum, permission hoặc state vào packages/ui.

## Candidate: Menu, lịch sử và mẫu báo cáo DATE — RPT01 revision 9

[ReportHub](../../apps/store-pwa/src/store-report-hub.tsx) tổ chức menu,
lịch sử và navigation nội bộ; [DateReportWorkspace](../../apps/store-pwa/src/store-date-report.tsx)
là composer/view snapshot. Reuse CalendarInput/StoreSheet/Button/Input/
DateConditionLabel/DateProcessingLabel/ShelfLifeTimeline. Checkbox native có
label touch riêng, không lồng vào nút mở chi tiết. Collection preset ID string
và mẫu tự tạo dùng cùng cấu hình, không business state trong packages/ui.
[Mock library](../../apps/store-pwa/src/store-report-library.ts) giữ lịch sử
và mẫu trên browser theo store; chỉ consumer mock, không authority online.
[Thiết kế](STORE_REPORTS_DESIGN.md), [bàn giao](../delivery/rpt01-report-design/handoff.md).

Follow-up revision 5: quản lý mẫu bằng StoreSheet, native input/select để đặt
tên, lưu cập nhật hoặc tạo bản mới; lịch sử có tìm, tháng chốt, đếm và Xem
thêm. `store-report-library.ts` giữ validation tên, copy/upsert theo ID và
query history; không thêm business API vào primitives.

Revision 6: tên sẵn dùng/holder trong các sheet báo cáo. StoreSheet thêm
`initialFocusRef` tùy chọn; consumer không truyền giữ autofocus hiện hành.
Report dùng Button asChild với native button ref, không sửa packages/ui.

Revision 7: Report reuse nhóm `store-date-filter`/`store-choices`, marker primitive
và adapter `getDatePhaseTone`, nhãn xử lý cả mobile/table. Các khối scope/form
và footer là composition local trong report, không thêm abstraction packages/ui.
Typography/control đối chiếu computed styles với DATE; Playwright ba viewport
và 150% chữ đạt. DATE/KPH chỉ là consumer tham chiếu, source không bị sửa lượt này.

### Dropdown và hành động tập hợp — RPT01 revision 8

- [Select](../../packages/ui/src/select.tsx) và [DropdownMenu](../../packages/ui/src/dropdown-menu.tsx)
  là primitive dùng chung; CSS `dropdown.css`. Select nhận value/onValueChange,
  options readonly (value/label/disabled), name, trigger props/contentClassName.
  Giá trị rỗng được ánh xạ nội bộ; named form submit value gốc, kể cả leading zero.
  Select dùng combobox/listbox; action menu dùng menu/menuitem. Không tráo
  semantics. Radix giữ focus, roving/typeahead, dismiss và collision positioning.
- Store Fresh áp theme cho cả trigger lẫn portal bằng `store-dropdown` trong
  [store-controls.css](../../apps/store-pwa/src/store-controls.css). Chưa đổi
  tất cả native select/sort trong Store/Admin; áp trước bốn vị trí Báo cáo.
- [StoreSelectionBar](../../apps/store-pwa/src/store-selection-bar.tsx): ID/tập
  eligible/visible + callback, itemLabel; master ba trạng thái và menu scope.
  Helper `store-selection.ts` không biết DATE/store/API. Consumer giữ bộ lọc,
  authorization và quy tắc selection online; không suy rộng sang cross-page.
- [StoreActionDock](../../apps/store-pwa/src/store-action-dock.tsx): children,
  summary, label, className; một bộ action, float/inline theo vị trí/chiều cao
  thật, nav/safe-area, tránh che control focus. Parent có một dock; slot nút
  tùy biến bằng `--store-action-columns` (mặc định 2). Report composer là consumer
  đầu; chỉ gắn ở tác vụ cần tiếp cận khi cuộn. Không tự neo mọi button/modal.

Radix Select 2.3.7 / DropdownMenu 2.1.24 tương thích đúng FocusScope và
DismissableLayer trong lock hiện có. Root lock chỉ nối dependency mới; không
nâng core cũ. Store 225 tests/UI 16 tests, typecheck Store/UI/Admin, mock build
và browser 390/1440/320 đạt; phần tương tác mới vẫn pending owner acceptance.

### ReportSurface — RPT01 revision 13 scope

[Source](../../apps/store-pwa/src/store-report-surface.tsx),
[CSS](../../apps/store-pwa/src/store-report-surface.css). Chỉ history/snapshot
còn dùng nắp/gesture trước đó. Composer không dùng component này; toolbar slot
r12 đã bỏ. Một active tree, cleanup listeners/RAF/timer, reduced motion; không
đưa thành primitive Admin hoặc thay Home/Login.

### ReportTemplatePicker và composer — RPT01 revision 13

[Picker](../../apps/store-pwa/src/store-report-template-picker.tsx),
[Workspace](../../apps/store-pwa/src/store-date-report.tsx),
[CSS](../../apps/store-pwa/src/store-report-composer.css). Composer là trang
trắng cuộn native. Props picker current/templates/onApply; chọn radio tạm,
search, Hủy/Escape giữ draft, Dùng mẫu mới áp dụng recipe và giữ kỳ.
StoreSheet/Radix giữ modal/focus; mở đầu sheet không auto-focus radio ở cuối
thư viện. 60 mẫu dài có search/empty state, không có thanh tab. Component tab
r12 đã xóa, không giữ nhánh fallback. Chưa có consumer Admin/packages/ui.

Kỳ/phạm vi là hai button rows; phạm vi mở modal DATE/xử lý. Chọn từng lô,
StoreSelectionBar và StoreActionDock giữ nghĩa dữ liệu và scope. Screen 40
rows/đợt, snapshot/Excel/print đủ tập; không render mọi lô trên màn hình.

### Store form controls — RPT01 revision 14 candidate

[API/ví dụ/contract](STORE_FORM_CONTROLS.md),
[SearchField](../../apps/store-pwa/src/store-search-field.tsx),
[SettingsGroup/Row](../../apps/store-pwa/src/store-settings-group.tsx),
[ChoiceSheet](../../apps/store-pwa/src/store-choice-sheet.tsx),
[CSS](../../apps/store-pwa/src/store-form-controls.css).

Search có ba consumer thật: report composer/template picker/history; Settings
là hai action kỳ/phạm vi; ChoiceSheet được ReportTemplatePicker ánh xạ recipe.
Không kéo business state/authorization/persistence vào control. Query/pending
chỉ tồn tại khi sheet mở, chỉ Apply phát ra ID. Native scrolling list giữ
search/header/footer trong viewport. Đã có test contract và browser gate;
chưa coi là primitive Admin hoặc rollout ngoài feature báo cáo.
