# Tích hợp RPT01 — 20/10/2026

Owner trực tiếp yêu cầu “tạm, merge”, chấp nhận tạm candidate r14 để tích hợp.
Xem [bàn giao merge](merge-2026-10-20.md) cho kiểm chứng và giới hạn hiện hành.
Các ghi chú pending/không merge bên dưới ghi trạng thái lịch sử trước yêu cầu này.

---

# RPT01 — Tối ưu và thành phần tham khảo: revision 14

Ngày 18/10/2026. User yêu cầu tiếp tục tối ưu và có thể tái dựng thành phần
để vùng chức năng khác tham khảo. Một writer trong worktree
`/Users/vup/.codex/worktrees/rpt01-report-design/coopfood-kph`, branch
`store-app/rpt01-report-design`, base `5fdfa3ecfcd54b92aaca5a98c140b56421d094df`.
Preview <http://127.0.0.1:5173/#reports>; r14 candidate chờ owner xem.

## Kết quả / file

- `store-search-field.tsx`: controlled value/onValueChange, nhãn/input 48,
  clear 44 trả focus, không submit form, không chiếm Escape của dialog.
  Dùng thật trong composer, chọn mẫu và lịch sử; không giữ query nghiệp vụ.
- `store-settings-group.tsx`: group + row button label/value/icon/count,
  mobile dọc/desktop tùy chọn hai cột; giá trị xuống dòng. Hai consumer action
  thật là kỳ và phạm vi. Row không biết DATE hoặc cách cập nhật filter.
- `store-choice-sheet.tsx`: StoreSheet/Radix, search/count cố định, chỉ list
  cuộn, Hủy/Apply luôn trong viewport. Pending/query sống khi mở; Cancel hoặc
  Escape không commit, Apply chỉ với giá trị đang thấy và khác value hiện tại.
  Radio native có useId riêng; ban đầu focus vùng tìm để không mở bàn phím.
- Choice list có ResizeObserver/RAF guard giữ focus khi resize hoặc phóng
  chữ: giữ trọn hàng nếu vừa, nếu quá cao thì giữ radio. Cleanup khi đóng,
  không setState/đọc layout theo từng touchmove hoặc kéo page phía sau.
- `store-form-controls.css`: cùng Fresh roles, explicit portal surface thay
  phụ thuộc `store-date-sheet`; focus/touch/contrast dùng cùng quy tắc app.
  Footer button height auto, nhãn hai dòng không cắt ở 320 px/150%.
- `store-report-template-picker.tsx`: chỉ còn adapter report recipe → lựa chọn
  ID/label/description; generic sheet không biết filter/lot IDs/persistence.
- `store-date-report.tsx`, `store-report-hub.tsx`, `store-report-composer.css`:
  dùng control mới, gom Đổi mẫu/Info lên navigation, title có đủ chiều ngang;
  giữ page trắng, không tab/vuốt ẩn, giữ period và draft khi cancel như r13.
- `store-choice-sheet.test.tsx`: ba contract tests: pending/cancel/apply,
  lựa chọn bị query che không được apply, clear focus và không submit form cha.
- Header/management gates thêm test footer/search cố định sau cuộn 63 mục,
  phóng chữ 150%, viewport cao 620, focus resize, clear tìm lịch sử reset đúng
  query/paging và không cắt nhãn nút. Các gate cũ nhận style/selector mới.
- [Mẫu component/API/ví dụ/token/giới hạn](../../product/STORE_FORM_CONTROLS.md)
  là tài liệu tham khảo. CURRENT/NEXT, component/contract index, UI DNA/design
  cập nhật. Checkpoint trước sửa `.local/reports-design/revision-13`.

Không thay packages/ui, root lockfile, global shell, DATE/KPH accepted UI,
OpenAPI/schema/rule/auth, storage hoặc Pages. Chưa rollout các component sang
feature khác; đây là Store PWA local components có consumer thực trong báo cáo.
Mẫu/history vẫn mock/browser-local, chưa backend hoặc dữ liệu tồn thật.

## Kiểm chứng

Browser dùng STORE_PREVIEW_URL=http://127.0.0.1:5173, evidence-r14.

| Lệnh | Kết quả |
| --- | --- |
| `npm --workspace @coopfood-kph/store-pwa test -- --maxWorkers=2` | PASS 229 tests / 33 files (bao gồm 3 contract tests mới). |
| `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build` | PASS TypeScript/build/PWA; warning ExcelJS lazy 929 kB có sẵn. |
| `node e2e/scripts/check-report-header.cjs` | PASS 390/1440/320: cancel/giữ kỳ, 63 choices, scroll riêng/footer/search/close hit-test, 150%/620px focus và nhãn nút không overflow. |
| `node e2e/scripts/check-report-fresh.cjs` | PASS ba viewport: controls/type/filter/labels/150% chữ theo Fresh DATE. |
| `node e2e/scripts/check-report-surface.cjs` | PASS ba viewport: composer native/no gesture, giữ selection; history gesture hồi quy. |
| `STORE_REPORT_OUTPUT=.local/reports-design/evidence-r14/regression node e2e/scripts/check-date-report.cjs` | PASS ba viewport + storage failure; item/template/frozen history/Excel/PDF. |
| `node e2e/scripts/check-report-selection-dock.cjs` | PASS ba viewport: selection/menu/nested select, dock floating/inline/resize/focus/large text. |
| `node e2e/scripts/check-report-management.cjs` | PASS ba viewport: rename/copy/update, lịch sử search/month/paging, clear shared search giữ focus/reset query. |
| `node e2e/scripts/check-report-default-names.cjs` | PASS ba viewport: default/holder/blank/collision/Enter/focus/reload. |
| `npm run check:docs`, `git diff --check` | PASS. |

Gate mở rộng đã bắt focus của Đổi mẫu rơi về màu mặc định sau khi gom toolbar;
đã giữ Fresh ring. Resize/chữ lớn làm radio cuối mất khỏi viewport; đã thêm
bounded scroll guard. Visual QA bắt nút Dùng mẫu bị cắt chữ hai dòng, đã sửa
height auto và thêm assertion scrollHeight<=clientHeight. Không hạ ngưỡng hoặc
bỏ test. Disabled Apply được kiểm geometry, không hit-test một control cố ý
pointer-events:none. Đã xem page/picker 390, 63 choices cuối list, 320/150% và
lịch sử với clear button; kiểm thiết bị thật vẫn pending.

Hiệu năng và kết quả cuối bổ sung bên dưới. R14 technical không phải owner
acceptance. Bước nhỏ tiếp: owner xem các cụm mới và chọn một vùng chức năng
cụ thể để áp dụng sau khi duyệt mẫu. Không push/merge/deploy hoặc sửa original.

## Hiệu năng và kiểm tra cuối

`STORE_REPORT_OUTPUT=.local/reports-design/evidence-r14/performance node e2e/scripts/check-report-surface-performance.cjs`: PASS.

- 390×844, CPU 4×/1.000 lô: mở 1892 ms, 1569 DOM nodes, in đủ 1.000 dòng 4071 ms; heap sau 6 vòng +265008 B.
- 1440×1024, CPU 4×/1.000 lô: mở 2224 ms, 1623 DOM nodes, in đủ 1.000 dòng 3871 ms; heap sau 6 vòng +222224 B.

Screen 40→80, search/full snapshot/full print/return-to-40 đạt; child mutation
và long task khi native pull bằng 0. Giữ budget <3s mở/<3.500 DOM/<+6 MiB
heap, không diễn giải headless thành FPS thiết bị thật. Final header gate có
assert nhãn nút không overflow đạt cả ba viewport; final unit 229/33 và build/
PWA đạt sau resize-focus guard. Evidence ở `.local/reports-design/evidence-r14`.

---

# RPT01 — Bỏ round tab, dựng lại composer: revision 13

Ngày 18/10/2026. Owner loại bỏ r12 vì lỗi và xấu; đây là thiết kế candidate
mới, không coi kết quả test là nghiệm thu UI. Một writer tại worktree
`/Users/vup/.codex/worktrees/rpt01-report-design/coopfood-kph`, branch
`store-app/rpt01-report-design`, base `5fdfa3ecfcd54b92aaca5a98c140b56421d094df`.
Preview <http://127.0.0.1:5173/#reports>, tải lại tab hiện có.

## Thay đổi / quyết định r13

- Xóa `store-report-template-tabs.tsx`, bỏ CSS tab/hero composer r12; khôi phục
  `store-report-surface.tsx/css` trước toolbar slot r12. ReportSurface chỉ còn
  dùng cho history/snapshot; composer không có cap/sticky/transform/pull.
- `store-date-report.tsx`, `store-report-composer.css`: trang trắng native,
  điều hướng về menu + Info, title/Đổi mẫu và search; kỳ/phạm vi là group hai
  hàng, phạm vi mở modal DATE/xử lý. Không để select lọc trùng trên trang.
  Danh mục có count/checkbox/nhãn trạng thái riêng; giữ dock save/create.
- `store-report-template-picker.tsx` mới: StoreSheet/Radix có search, radio
  chọn tạm, Dùng mẫu/Hủy. Hủy/Escape không thay draft. Search rỗng có empty
  state, không apply một mục đang ẩn bởi query. Mở sheet ở đầu bằng focus
  group, không tự focus radio cuối thư viện hoặc mở soft keyboard. Focus
  keyboard chỉ một ring trên hàng radio; title đầy đủ không cắt trong picker.
- `store-report-hub.tsx`: bỏ UUID key cho mỗi lần chọn template. R12 unmount
  Workspace theo key đó, reset period về tháng mặc định và bỏ selection ngay
  khi bấm tab. R13 dùng key composer ổn định, áp recipe chỉ sau Dùng mẫu:
  cập nhật filter/selected IDs, xóa search, giữ period. Chuyển document vẫn
  key theo snapshot ID; vào lại từ menu vẫn là draft mới như trước.
- Header/surface/Fresh/selection/management/default-names/regression/perf gates
  chuyển sang control mới, không bỏ kiểm nghiệp vụ. Gate responsive dock
  đợi geometry qua ResizeObserver bằng poll, không kiểm kích thước cũ ở ngay
  tick resize. Surface đợi lazy menu đủ ba mục trước đọc màu.
- CURRENT/NEXT, design, component/contract index và UI DNA ghi r12 đã bị bỏ.

Giữ menu solid, mẫu/history browser-local, DATA DATE authoritative assessment,
selection scope, naming defaults, Excel/PDF/full snapshot và store scope cũ.
Không sửa API/schema/authorization, Home/Login/global shell, packages/ui hoặc
lockfile trong lượt này. Checkpoint r12 ở `.local/reports-design/revision-12`.

## Kiểm chứng r13

Browser dùng STORE_PREVIEW_URL=http://127.0.0.1:5173, evidence r13.

| Lệnh | Kết quả |
| --- | --- |
| `npm --workspace @coopfood-kph/store-pwa test -- --maxWorkers=2` | PASS 226 tests / 32 files. |
| `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build` | PASS TypeScript/build/PWA; ExcelJS lazy 929 kB warning có sẵn. |
| `node e2e/scripts/check-report-header.cjs` | PASS 390/1440/320: không tab/cap, chọn tạm bằng keyboard, Hủy giữ search/selection/kỳ, Dùng mẫu giữ kỳ 01–20/10, 60 mẫu dài/search/empty state/close ở đầu sheet, calendar, 150% chữ/contrast. |
| `node e2e/scripts/check-report-fresh.cjs` | PASS ba viewport: typography/controls so DATE, filter/modal/150% chữ/mốc. |
| `node e2e/scripts/check-report-surface.cjs` | PASS ba viewport: composer không touch/pointer listener, pull không đóng/không mất selection, native scroll; history gesture/mouse/reduced motion hồi quy. |
| `STORE_REPORT_OUTPUT=.local/reports-design/evidence-r13/regression node e2e/scripts/check-date-report.cjs` | PASS ba viewport + storage failure; lô/mẫu/frozen history/Excel/PDF. |
| `node e2e/scripts/check-report-selection-dock.cjs` | PASS ba viewport: scoped selection/mixed/menu, keyboard/focus, dock floating/inline/resize/150%/short viewport. |
| `node e2e/scripts/check-report-management.cjs` | PASS ba viewport: rename/copy/update, history query/month/paging/freeze. |
| `node e2e/scripts/check-report-default-names.cjs` | PASS ba viewport: holder/default/blank/Enter/focus/reload. |
| `npm run check:docs`, `git diff --check` | PASS. |

Đã xem composer 390/1440, hộp chọn mẫu và long custom 320 ở 150%. Gate đã bắt
portal picker thiếu token Fresh, placeholder nhạt và chữ Hủy chưa đủ contrast;
đã gắn store-date-sheet và chỉnh theo token, chạy lại đủ ngưỡng đạt. Không tắt
assertions. Auto approval review một lần hết deadline khi chạy local gate; retry
một lần được duyệt, không có công việc còn bị chặn bởi approval.

Hiệu năng/final build bổ sung dưới đây. Không có nghiệm thu UI thiết bị thật;
mock/browser-local vẫn là giới hạn hiện tại. Bước nhỏ tiếp là owner xem bản
trang trắng và thao tác đổi mẫu tại preview. Không push/merge/deploy, không
reset dirty files hoặc sửa original workspace; Pages không đổi.

## Hiệu năng và kiểm tra cuối r13

`STORE_REPORT_OUTPUT=.local/reports-design/evidence-r13/performance node e2e/scripts/check-report-surface-performance.cjs`: PASS.

- 390×844, CPU 4×/1.000 lô: mở 979 ms, 1567 nodes, screen 40 rows/đợt, in đủ 1.000 dòng 2423 ms; heap sau 6 vòng +252764 B.
- 1440×1024, CPU 4×/1.000 lô: mở 966 ms, 1621 nodes, screen 40 rows/đợt, in đủ 1.000 dòng 1799 ms; heap sau 6 vòng +235268 B.

Tìm cuối tập, 40→80, snapshot/full print/return-to-40 đạt; native pull không
child mutation/long task. Giới hạn <3s mở/<3.500 DOM/<+6 MiB heap đạt. Không
diễn giải số đo headless thành FPS hoặc SLO thiết bị thật. Header gate chạy
lại sau sửa focus đạt cả ba viewport; build/PWA cuối PASS. Evidence r13 gồm
header/fresh/surface/regression/selection-dock/management/default-names/performance.

---

# RPT01 — Tên/tìm trên xanh, tab mẫu và composer tối giản: revision 12

Ngày 18/10/2026. Owner yêu cầu tối giản các vùng chức năng, hero xanh chỉ tên
mẫu/tìm kiếm; khi đang mở mẫu dùng tab giới hạn + Xem thêm, hướng Apple-like
và UI/UX app hiện có. Tiếp tục candidate trong worktree, giữ checkpoint r11,
không reset các thay đổi trước hoặc mở thêm writer. Một writer tại
`/Users/vup/.codex/worktrees/rpt01-report-design/coopfood-kph`, branch
`store-app/rpt01-report-design`, base `5fdfa3ecfcd54b92aaca5a98c140b56421d094df`.
Preview <http://127.0.0.1:5173/#reports>. R12 candidate, chờ owner xem.

## Kết quả / file r12

- `store-date-report.tsx`: hero chỉ tên đầy đủ + Info và search/clear. Không
  trigger chọn mẫu/nhãn dữ liệu thừa ở hero. Kỳ/lọc/nhóm DATE gom thành một
  toolbar; ngày chốt vẫn trong Info/tạo báo cáo và metadata bản đã tạo.
- `store-report-template-tabs.tsx` mới: nút về menu, hai điểm đến nhanh tối đa
  và Xem thêm; dưới 360 px chỉ một mục hiện tại. Button navigation dùng
  aria-current=page, không tạo ARIA tab giả. Mẫu thứ ba/custom ở Radix menu
  cuộn, tên đầy đủ qua accessible name/heading và tooltip; nhãn tab ellipsis.
- `store-report-surface.tsx/css`: thêm toolbar slot cho tab ở nắp trắng.
  Composer hero relative để input focus/cuộn không nằm sau cap sticky. Giữ
  pullToDismiss=false, không tạo lại cơ chế vuốt ẩn. History/snapshot giữ r11.
- `store-date-report.css`: bỏ khung vùng danh mục/toolbar lồng nhau, count cùng
  hàng tiêu đề; danh sách mobile là hàng trắng/hairline, không khung xanh trên
  từng lô, giữ checkbox/nhãn/thanh trạng thái DATE. Desktop giữ bảng. Giữ
  Fresh token/font/touch size, không thêm glass/blur/font/dependency mới.
- Browser gates header/surface/Fresh/selection/default names/management cập
  nhật selector/vị trí theo composition mới, evidence r12; không bỏ assertions
  về scope, history, export, keyboard, contrast hay gesture guard.
- CURRENT/NEXT, design, UI DNA, component catalog/contract index cập nhật.

Menu đầu giữ thẻ solid r11. Không đổi API/rule DATE/KPH, storage/retention,
selection semantics, tên gợi ý, Excel/PDF, global shell/Home/Login, packages/ui
hoặc root lockfile trong r12; các dirty diff cũ vẫn giữ. Mẫu/history mock trên
browser, không giả lập tồn thật hoặc snapshot quá khứ.

## Kiểm chứng r12

Browser dùng STORE_PREVIEW_URL=http://127.0.0.1:5173 và evidence r12.

| Lệnh | Kết quả |
| --- | --- |
| `npm --workspace @coopfood-kph/store-pwa test -- --maxWorkers=2` | PASS 226 tests / 32 files. |
| `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build` | PASS TypeScript/build/PWA; warning ExcelJS lazy 929 kB có sẵn. |
| `node e2e/scripts/check-report-header.cjs` | PASS 390/1440/320: tên/search trên xanh, không selector hero, tab hữu hạn, 60 custom mẫu dài, keyboard/End/Escape/focus, clear search giữ selection, calendar, 150% chữ/reflow/contrast. |
| `node e2e/scripts/check-report-fresh.cjs` | PASS ba viewport: Fresh type/control/filter/label/150% chữ, composer/period/create/history. |
| `node e2e/scripts/check-report-surface.cjs` | PASS ba viewport: không pull listener composer, vuốt giữ selection, native scroll, explicit back; history gesture/reduced motion. |
| `STORE_REPORT_OUTPUT=.local/reports-design/evidence-r12/regression node e2e/scripts/check-date-report.cjs` | PASS ba viewport + storage failure; item/mẫu/history/frozen snapshot/Excel/PDF. |
| `node e2e/scripts/check-report-selection-dock.cjs` | PASS ba viewport: selection scope/keyboard/menu, dock floating/inline/resize/focus. |
| `node e2e/scripts/check-report-default-names.cjs` | PASS ba viewport: holder/default/blank fallback/collision/Enter/focus/reload. |
| `node e2e/scripts/check-report-management.cjs` | PASS ba viewport: rename/copy/update IDs/history search/month/page/freeze. |
| `npm run check:docs`, `git diff --check` | PASS. |

Đã xem ảnh compact 390/desktop, long custom 320 ở 150%, popup End với 60 mẫu.
Đầu tiên chỉ hiện tối đa hai mục nhanh dù thư viện có 63 mục; menu chứa đủ
mục và có scroll, tab không kéo dài. Hàng đầu composer chuẩn lên trước y=600
ở cả ba viewport. Test hành vi thật/DOM/screenshot, không snapshot pixel rộng.

Kết quả hiệu năng 1.000 lô/CPU 4× bổ sung bên dưới. Các số đo headless không
thay nghiệm thu FPS/gesture trên thiết bị thật. R12 chờ owner xem; bước nhỏ
kế tiếp là xác nhận hierarchy tên/tìm/tab và độ gọn toolbar trên preview.
Không push/merge/deploy hoặc sửa original workspace; Pages không đổi.

## Hiệu năng r12

`STORE_REPORT_OUTPUT=.local/reports-design/evidence-r12/performance node e2e/scripts/check-report-surface-performance.cjs`: PASS.

- 390×844, CPU 4×/1.000 lô: mở 2845 ms, 1573 nodes, in đủ 1.000 dòng 3401 ms; heap sau 6 vòng +325028 B.
- 1440×1024, CPU 4×/1.000 lô: mở 1981 ms, 1627 nodes, in đủ 1.000 dòng 4068 ms; heap sau 6 vòng +330688 B.

Cả hai viewport: screen 40→80, search toàn tập, snapshot/print đủ 1.000,
quay về 40 sau in; không child mutation/long task khi kéo. Giới hạn mở <3s,
DOM <3.500, heap <+6 MiB đạt; giữ số đo thay vì diễn giải thành FPS thực.

---

# RPT01 — Thẻ mẫu solid; bỏ vuốt ẩn khi khai báo: revision 11

Ngày 18/10/2026. Owner phản hồi r10 chưa đạt: mẫu báo cáo cần solid hơn như
item Home và bỏ vuốt xuống để ẩn mẫu đang khai báo. Một writer tại worktree
`/Users/vup/.codex/worktrees/rpt01-report-design/coopfood-kph`, branch
`store-app/rpt01-report-design`, base `5fdfa3ecfcd54b92aaca5a98c140b56421d094df`.
Preview <http://127.0.0.1:5173/#reports>. R11 technical PASS, chờ owner xem.

## Thay đổi r11

- `store-date-report.css`: thẻ preset/custom nền màu liền khối rõ hơn,
  mint/peach/sky/lilac; radius 18, không viền mảnh, icon tròn 54 màu đậm/chữ
  trắng như Home. Hover có nền riêng. Caption dùng ink để đạt contrast cả
  nền thường/hover. Giữ tên, mô tả, collection và custom management.
- `store-report-surface.tsx/css`: prop pullToDismiss; false không đăng ký
  touch/pointer listener, không grip/transform/entry animation. Thay grip
  bằng nút Chọn mẫu khác/ArrowLeft, 44 px, click/Enter và focus ring.
- `store-date-report.tsx`: composer đặt pullToDismiss=false; history và bản
  snapshot giữ gesture riêng. Bố cục hero xanh/cap trắng/kỳ không đổi.
  Chọn lô và dữ liệu khai báo giữ nguyên khi kéo xuống; cuộn native.
- `check-report-surface.cjs`: thay kỳ vọng composer vuốt để đóng bằng kiểm
  listener rỗng, kéo dài hai vùng không đóng và selection giữ nguyên, cap
  không có style/children mutations. Giữ gate cuộn native, dropdown, nguồn,
  explicit back/Enter, reduced motion, history pull/cancel/mouse và contrast.
- Header/management gate dùng output r11 để không ghi đè evidence cũ.
- CURRENT/NEXT, design, contract/component index, UI DNA và handoff cập nhật.

Không thêm dependency, đổi Home, API, rules DATE/KPH, storage, selection,
đặt tên, xuất Excel/PDF hay Pages. Mẫu/history vẫn mock và browser-local.
Checkpoint source/docs trước sửa ở `.local/reports-design/revision-10`.

## Kiểm chứng r11

Tất cả browser gate dùng STORE_PREVIEW_URL=http://127.0.0.1:5173.

| Lệnh | Kết quả |
| --- | --- |
| `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build` | PASS TypeScript/build/PWA bản cuối; ExcelJS lazy 929 kB warning có sẵn. |
| `node e2e/scripts/check-report-surface.cjs` | PASS 390×844/1440×1024/320×844: solid/hover contrast, không listener kéo ở composer, selection không mất, cuộn và nút back; history gesture hồi quy. |
| `node e2e/scripts/check-report-header.cjs` | PASS ba viewport: kỳ/calendar/keyboard/150% chữ. |
| `node e2e/scripts/check-report-management.cjs` | PASS ba viewport: custom mẫu/rename/copy/update/query/history. |
| `STORE_REPORT_OUTPUT=.local/reports-design/evidence-r11/regression node e2e/scripts/check-date-report.cjs` | PASS ba viewport + storage failure; chọn lô/mẫu/frozen history/Excel/PDF/large text/contrast. |
| `STORE_REPORT_OUTPUT=.local/reports-design/evidence-r11/performance node e2e/scripts/check-report-surface-performance.cjs` | PASS 1.000 lô/CPU 4×, 40→80/search/snapshot/in đủ tập, 6 vòng mở đóng và heap. |
| `npm run check:docs`, `git diff --check` | PASS. |

Stress: 390 mở 1516 ms/1582 nodes, print 2852 ms, heap +313164 B; 1440 mở
1561 ms/1636 nodes, print 3139 ms, heap +317528 B. Native pull không làm
children mutate hoặc tạo long task; max frame gap 16,7/16,8 ms. Đây là số đo
headless CPU throttle, không coi là nghiệm thu FPS trên thiết bị thật.

Gate đầu so selection dùng innerText với toHaveText gây khác whitespace;
đã sửa so textContent. Gate regression bắt caption mẫu cá nhân tím chỉ 4,27:1;
đã đổi sang ink tối và chạy lại surface/hover/regression đạt. Không nới ngưỡng
contrast hoặc bỏ test. Unit/domain giữ kết quả trước vì không đổi rules;
hành vi listener/gesture kiểm qua Chromium thật và CDP.

Evidence `.local/reports-design/evidence-r11/{surface,header,management,regression,performance}`.
Đã xem menu 390, composer 390, preset + hai mẫu cá nhân và ảnh live đầu trang;
DOM xác nhận header visible/scrollY=0. Kiểm tra thiết bị thật vẫn pending.
Bước nhỏ tiếp: owner xem màu thẻ và cuộn trang khai báo ở preview. Không
push/merge/deploy hoặc sửa original workspace.

---

# RPT01 — Chọn kỳ lên nắp trắng, điều khiển mẫu trên xanh: revision 10

Ngày 14/10/2026. Theo yêu cầu “bộ đọc ngày đưa lên lớp trên; chọn mẫu báo cáo
nền xanh tăng tính function”, hiểu bộ đọc ngày là bộ chọn kỳ của composer.
Đưa kỳ/ngày chốt vào đầu nắp trắng, cùng lớp danh mục. Mẫu đang dùng giữ trên
nền xanh, thêm nhãn/icon/viền, phản hồi mở/hover và chevron xoay. Giữ dropdown
hệ thống. Không thay loại báo cáo, rule DATE, selection, history hay export.

Worktree `/Users/vup/.codex/worktrees/rpt01-report-design/coopfood-kph`, branch
`store-app/rpt01-report-design`, base `5fdfa3ecfcd54b92aaca5a98c140b56421d094df`.
Một writer; không sửa workspace original. Preview hiện tại
<http://127.0.0.1:5173/#reports> (cổng đang xem của owner, thay cổng 4221 cũ).

## Thay đổi và kiểm chứng r10

- `store-date-report.tsx`: chuyển section kỳ khỏi hero vào cap; trigger mẫu có
  FileChartColumn, nhãn, tên 20 px. `store-report-surface.css`: chrome và state
  của trigger, reduced motion. Không thêm scroll listener/state/portal mới.
- `check-report-header.cjs`: mới, kiểm vị trí kỳ trong cap/hit-test, khung mẫu,
  keyboard menu, áp cấu hình mẫu, chọn ngày, nhập ngày, Escape hai cấp, trả
  focus, reflow 150%, contrast, lỗi runtime ở 390×844/1440×1024/320×844.
- `check-report-surface.cjs`: kiểm vị trí kỳ mới, evidence r10. Hai gate
  regression/performance nhận output env và mặc định evidence r10.
- CURRENT/NEXT, design, UI DNA, component/contract index cập nhật vị trí mới.
- `npm --workspace @coopfood-kph/store-pwa run check`: PASS.
- `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build`:
  PASS TypeScript/build/PWA; warning ExcelJS lazy 929 kB có sẵn.
- `STORE_PREVIEW_URL=http://127.0.0.1:5173 node e2e/scripts/check-report-header.cjs`:
  PASS ba viewport, keyboard/calendar/150%/contrast.
- `STORE_PREVIEW_URL=http://127.0.0.1:5173 node e2e/scripts/check-report-surface.cjs`:
  PASS ba viewport, vuốt/scroll/reduced motion, 0 child changes khi kéo.
- `STORE_PREVIEW_URL=http://127.0.0.1:5173 node e2e/scripts/check-date-report.cjs`:
  PASS ba viewport + storage failure; mẫu/lịch sử/chọn lô/snapshot/Excel/PDF.
- `STORE_PREVIEW_URL=http://127.0.0.1:5173 node e2e/scripts/check-report-surface-performance.cjs`:
  PASS 1.000 lô/CPU 4×, 40→80/search/cuộn/snapshot/in/6 vòng mở đóng.

Số đo r10: 390 mở 2648 ms/1578 nodes, in 5691 ms, heap +320152 B;
1440 mở 2608 ms/1632 nodes, in 6322 ms, heap +325188 B. Drag cả hai:
child changes 0, long task 0; frame gap max 349,9/266,6 ms. Headless CPU
throttle có tải đồng thời; đây là gate budget (<3s mở, <3500 nodes, <150ms
long task lúc drag), không kết luận FPS thiết bị thật hay so tốc độ r9/r10.

Evidence `.local/reports-design/evidence-r10/{header,surface,performance,regression}`.
Đã xem ảnh header 390/320 và calendar 390; popup lịch portal z100 nằm trên
modal z50 từ trước, không cần tăng z toàn hero. Lần đầu gate header sai nhãn
Intl của ngày (dùng “năm” trong khi browser dùng dấu phẩy); đã sửa selector
và chạy lại toàn gate đạt. Unit/domain giữ kết quả r9, không viết test mirror
cho thay đổi composition/CSS; kiểm bằng browser có mục tiêu.

R10 technical PASS, chờ owner xem. Vẫn mock/browser-local; thao tác vuốt trên
thiết bị thật chưa nghiệm thu. Bước nhỏ tiếp: owner xem vị trí bộ chọn kỳ và
độ rõ điều khiển mẫu ở preview. Không push/merge/deploy; Pages không đổi.

---

# RPT01 — Nền xanh, nắp trượt và hiệu năng: revision 9

Ngày 14/10/2026. Owner tạm đạt r8, yêu cầu gom vùng chọn lên xanh, loại đang
thao tác trên xanh, nắp trắng như Login/Home; áp dụng lịch sử, kéo xuống về
menu trắng, mục loại có màu và cover hiệu năng. Nhánh giữ
`store-app/rpt01-report-design`, worktree
`/Users/vup/.codex/worktrees/rpt01-report-design/coopfood-kph`, base
`5fdfa3ecfcd54b92aaca5a98c140b56421d094df`. Một writer; không sửa original.

## Outcome / files

- `store-report-surface.tsx/css`: page composition hero xanh + nắp trắng overlap
  24/radius 26 theo Home/Login. Grip 44 px là button/click/Enter và vùng kéo;
  body chỉ bắt pull-down khi page ở đầu. Không phải modal, không trap focus.
  Khóa dọc sau 12, dismiss >=120 hoặc flick >=48 với velocity >=0,65 px/ms;
  ngắn/horizontal/cancel không đóng. Không chiếm input/combobox/modal/popup;
  prevent click sau drag, hỗ trợ pointer capture mouse/pen và touch một ngón.
- `store-date-report.tsx`: loại hiện tại là heading/dropdown 20 px trên xanh;
  period/as-of ở hero. Danh mục/filter/selection/dock ở cap. Bản snapshot vẫn
  có back history riêng, grip đóng về menu. Tên heading có aria-label riêng.
- `store-report-hub.tsx`: history cùng cap, menu vẫn trắng; preset mint/peach/
  sky, custom lilac. Chỉ mount một active page, không giữ menu trùng phía sau.
- `store-date-report.css`: màu loại, menu trắng đủ viewport, phân đợt row và
  giữ layout/print. Không thay nghĩa màu tình trạng DATE.
- `store-action-dock.tsx`: tránh ghi lại clearance CSS khi giá trị không đổi.
  Khi cap transform, floating dock ẩn tạm để không bị đổi fixed containing
  block; khi cap nghỉ transform none, dock trở lại như r8.
- `store-report-surface.test.ts`: ngưỡng kéo/flick nhỏ không dismiss.
- `check-report-surface.cjs` mới: colors/hero/cap, chuyển loại, normal scroll,
  short/horizontal/pull dismiss/report/history, kéo từ body đầu trang, mouse desktop, popup guard, button/keyboard,
  reduced motion, contrast và DOM probe. 0 child changes trong lúc kéo; một
  thay đổi sau đó là unmount hợp lệ khi về menu.
- `check-report-surface-performance.cjs` mới: 1.000 lô mẫu/CPU 4×, mở dưới 3s,
  DOM dưới 3.500, 40→80, tìm cuối tập, snapshot/print đủ 1.000, screen về 40,
  long-task lúc drag dưới 150ms, 6 vòng mở/đóng với heap dưới +6 MiB và node
  count không tăng. Dữ liệu stress chỉ inject vào response module browser.
- Năm browser gate report cũ: evidence r9 và đợi cap resting trước assertions/
  screenshot. Không bỏ kiểm selection/history/names/exports.
- CURRENT/NEXT, report design, contract/component indexes và UI DNA cập nhật.

Preview <http://127.0.0.1:4221/#reports>; tải lại tab hiện có.
[Thiết kế](../../product/STORE_REPORTS_DESIGN.md).

## Bảo vệ hiệu năng và toàn vẹn dữ liệu

Baseline r8 mobile, 1.000 lô/CPU 4×: mở 8.940 ms, 65.498 DOM nodes vì dựng cả
card và table. R9 chỉ mount layout đang dùng, screen 40 rows/đợt. Memoize
assessment/filter/selection và dùng Set thay ID tìm lồng nhau. Master checkbox
áp dụng đúng rows đang render; menu toàn danh mục vẫn trên toàn eligible.
Search tìm cả tập và giữ lựa chọn ngoài query. History giữ phân đợt 10.

Snapshot/Excel không dùng rowLimit. Print dùng `useSyncExternalStore` cho media,
`beforeprint/afterprint` và flushSync trước window.print; dựng toàn snapshot.
Bảng print dùng text trạng thái, không control/marker/SVG. Sau print screen trở
về phân đợt. Gate stress có timeout 15s riêng cho dựng bản in 1.000 dòng trên
CPU 4×, không nới budget mở trang/gesture. Có lần gate cũ 5s chưa ổn định; đã
đồng bộ media state và giảm DOM print trước kiểm cuối.

Move không setState, không dựng lại list hoặc đọc layout mỗi touchmove. Chỉ
ghi transform trực tiếp qua một RAF đang chờ; không dùng CSS variable kế thừa
cho tọa độ, không animate height/top/left/blur. will-change chỉ trong phase
moving, idle transform none. Cleanup timer/RAF/listeners khi unmount, reduced
motion không có animation settle/enter. Không thêm animation/gesture dependency.

Số đo cuối ở `.local/reports-design/evidence-r9/performance/results.json`:

| Viewport | Mở | DOM nodes | Print 1.000 dòng | Giữ heap sau 6 vòng | Long task lúc kéo | Frame gap lớn nhất |
| --- | --- | --- | --- | --- | --- | --- |
| 390×844 | 1106 ms | 1570 | 2447 ms | +308.9 KiB | 0.0 ms | 66.6 ms |
| 1440×1024 | 1148 ms | 1624 | 1829 ms | +305.6 KiB | 0.0 ms | 183.4 ms |

Frame gap headless/CPU throttle bao gồm raster/scheduling và CDP; được ghi
nguyên số đo, không diễn giải thành FPS thiết bị thật. Không cam kết 60fps/
INP trên iPhone. Long-task budget/DOM/render không đổi là gate chủ đích.

## Kiểm chứng

| Lệnh | Kết quả |
| --- | --- |
| `npm --workspace @coopfood-kph/store-pwa test -- --maxWorkers=2` | PASS 226 tests / 32 files. |
| `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build` | PASS TypeScript/build/PWA; warning ExcelJS lazy 929 kB có sẵn. |
| `node e2e/scripts/check-report-surface.cjs` | PASS 390×844, 1440×1024, 320×844: cap/gesture/scroll/buttons/reduced motion/contrast/DOM probe. |
| `node e2e/scripts/check-report-surface-performance.cjs` | PASS 390/1440, 1.000 lô, CPU 4×, selection/search/full snapshot/print/leak/gesture budgets. |
| `node e2e/scripts/check-date-report.cjs` | PASS ba viewport + storage failure; chọn lô/template/history/frozen snapshot/Excel/PDF/large text/contrast. |
| `node e2e/scripts/check-report-selection-dock.cjs` | PASS ba viewport; selector keyboard/modal, scoped selection, dock/inline/resize/large text/focus. |
| `node e2e/scripts/check-report-default-names.cjs` | PASS ba viewport; names/holder/fallback/Enter/focus/reload. |
| `node e2e/scripts/check-report-management.cjs` | PASS ba viewport; rename/copy/update IDs, history query/month/pagination/freeze. |
| `node e2e/scripts/check-report-fresh.cjs` | PASS ba viewport; Fresh/filter/live sync/scope/focus/150% chữ. |
| `npm run check:docs`, `git diff --check` | PASS. |

Evidence `.local/reports-design/evidence-r9`: initial/surface/performance và
năm gate regression. Đã xem report 390, menu màu 390 và history 320/1440.
Source/docs trước sửa lưu `.local/reports-design/revision-8`. Kết quả trước
khi sửa media print hoặc cascade chữ không được tính là gate cuối đạt.

## Ranh giới / bước nhỏ tiếp

R8 tạm đạt theo owner; R9 technical đạt, chờ owner xem bố cục và cảm nhận vuốt.
Mock/browser-local như trước; chưa API/tồn thật/server snapshots. Không đổi
Home/Login, shared packages/ui/lockfile trong lượt r9, rule DATE/KPH,
authorization/schema/OpenAPI hoặc Pages. Không commit/push/merge/deploy. Giữ
các dirty baseline mượn của task khác.

Vuốt đủ ngưỡng/nút về menu có semantics như Back trước đây: không tự lưu draft
hoặc tạo history; kéo chưa đủ giữ nguyên state trong cap. Không nhân đôi DOM
để giữ draft phía sau. Keyboard OS, cảm giác cuộn/overscroll iOS và thiết bị
thật chưa xác minh; không coi headless touch/CDP là nghiệm thu các phần đó.

Bước nhỏ tiếp: owner xem menu màu → mở tổng hợp → vuốt ngắn/đủ ngưỡng → lịch
sử, kiểm cap trên điện thoại thật trước khi nhân rộng pattern sang feature khác.
