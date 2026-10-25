# COMPACT03 — item DATE/Báo cáo/Thông báo

Ngày25/10/2026. Owner gửi trực tiếp “ổn, tiếp” sau candidate KPH4346; ghi
nhận chấp nhận KPH runtime`c3f05c5`, tiếp tục theo đề xuất item list đã trình.
Đây là slice trình bày có giới hạn, một writer (chat hiện tại), không dispatch
agent. **Technical PASS; candidate COMPACT03 chờ owner xem hình ảnh.**

## Mốc và phạm vi

- Branch: `store-app/compact03-date-report-items`.
- Worktree: `/Users/vup/Documents/coopfood-kph/.local/worktrees/compact03-date-report-items`.
- Base`0b639825be9d158d2d89e108e99a3164f59de573`: đúng COMPACT02 được owner
  chấp nhận + ghi quyết định.4346 giữ nguyên để so, production mới4348/dev4347.
- Main giữ`f77034d`; baseline stacked có FORM01d4f9d17/header816 từ COMPACT01,
  không suy nghiệm thu/tích hợp FORM01 hoặc quyền merge main/push/deploy/Pages.
- Chỉ style screen Compact của ba nhóm item; không đổi DOM/business handlers,
  API/authorization/data, packages/ui, root config/lock hoặc backend.

## Thay đổi và lý do

`store-app-frame.tsx` import `store-record-items.css`, recipe Store-local dùng
size/spacing tokens hiện có. Không thêm wrapper, component hoặc JS đo layout.

DATE: giữ phase chip và %HSD24px là trọng tâm. Processing giữ chữ/icon/màu,
bỏ vỏ pill cạnh phase để hai chiều thông tin không cạnh tranh. Giữ đủ tên,
SKU/lô, NSX/HSD, lịch nhắc và target mở lô. Detail/timeline không nhận style này.

Báo cáo: HSD/Tồn thành dòng dữ kiện không khung nền; processing dạng chữ/icon
trong card và bảng. Không bỏ Tồn — hoặc suy ra0. Giữ selected tint, checkbox
44px, scope selection, snapshot và dữ liệu xuất.

Thông báo: bỏ khung bo nhóm và gutter lặp trong nhóm; separator phân nhóm.
Giữ header/count/description, phase chip/% và details/summary native; không
ẩn phase vì group title trùng hoặc đổi cơ chế mở đúng lô.

Chỉ `@media screen` + `html[data-store-density="compact"] .store-app`;
comfortable, login, portal chi tiết, chart/print/output và KPH không nhận rule.
Hướng phân cấp theo [đề xuất item list](compact01-interface-density/list-items-next.md),
[Apple HIG Lists and tables](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables)
và skill ui-ux-pro-max (Compact Label Overflow); không sao chép size nativept
sang CSSpx hoặc tuyên bố chứng nhận WCAG toàn app.

## Kiểm tra và evidence

- `VITEST_MAX_WORKERS=2 npm run verify`: PASS346tests — Store293/Admin16/API2/
  rules19/UI16; docs/contracts/generated API/types/build/PWA. Log`verify.log`.
- `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build --
  --outDir ../../.local/compact03/build --emptyOutDir`: PASS117precache, log`build.log`.
- `node .local/compact03/check-items.cjs`: PASS390×844/1440×1024/320×844/
  900×650/844×390, hai mật độ với cùng fixture/clock6Oct2026. So tất cả item
  text/label và comfortable geometry với4346; report print geometry/content
  parity, checkbox không mở detail, đúng detail, native group keyboard và
  thông báo mở đúng DATE lot. Chữ150/200 trên item ở390/320/1440, không tràn
  ngang, target44px. Contrast chữ vùng kiểm thấp nhất5.06:1. Log`items-final.log`,
  số đo/screenshot`items/results.json`. Không pixel snapshot rộng hoặc test
  unit mới chỉ kiểm lại CSS. Probe là artifact ignored, gate repo giữ riêng.
- `STORE_PREVIEW_URL=http://127.0.0.1:4348 STORE_BASELINE_URL=http://127.0.0.1:4346
  STORE_DENSITY_OUTPUT=.local/compact03/density-final node e2e/scripts/check-store-density.cjs`:
  PASS5viewport và workflow390/1440: real switch/persistence, anchor/query/
  selection/collapse, print/reflow; reminder1/7ngày, TPCN/TPTS tạo phiếu,
  report/history/Excel/PDF và Tra hạn. Log`density-final.log`.
- `STORE_PREVIEW_URL=http://127.0.0.1:4348 STORE_REPORT_OUTPUT=.local/compact03/selection-dock
  node e2e/scripts/check-report-selection-dock.cjs`: PASS390/1440/320 — selection
  scope, flex dock/bounds, query/hidden selection và các trạng thái đã có.

Tất cả log/artifact trong `.local/compact03/` (ignored), dùng dữ liệu tổng hợp.
Không thêm ảnh/workbook vận hành thật. Full verify/build chạy trên runtime cuối;
sau đó chỉ chỉnh assertion E2E và tài liệu, không đổi CSS/app.

### Điều chỉnh phép kiểm có căn cứ

Gate density cũ đòi mọi item KPH≥90% chiều cao comfortable. Ở900px, KPH đã
được duyệt trong COMPACT02 giảm wrapping từ132 xuống56px; ngưỡng118.8px vì
thế đã lỗi thời ngay trên4346. Thay assertion tỷ lệ bằng floor desktop56px/
mobile88px cho readable row; giữ so font và check thực tế44px của các control.
Không sửa KPH/runtime để thỏa tỷ lệ cũ, không bỏ workflow hoặc print gates.

Probe print landscape ban đầu so một trang vừa auto-scroll để mở card với
trang baseline chưa cuộn, lệch vị trí115px. Đã chờ sheet đóng và đưa cả hai
trang về cùng vị trí trước print; toàn bộ5viewport PASS, không đổi app để né
kiểm. Log ban đầu giữ ở`items.log`/`density.log` để đối chiếu.

## Số đo cùng fixture ở390×844

| Item mẫu |4346|4348|
| --- | ---: | ---: |
|DATE đầu danh sách|124px|120px|
|Báo cáo mobile đầu danh sách|145px|129px|
|Thông báo đầu danh sách|96px cao,316px rộng|96px cao,346px rộng|

Ở320px, report168→152px; thông báo119→96px nhờ thêm30px vùng đọc, không
thu font hoặc ép chiều cao. Ở1440px bảng report vẫn69px; DATE124→120px.
Tên dài/chữ lớn được nở cao; không cam kết mọi item giảm cùng tỷ lệ.

## Owner xem và giới hạn

Production <http://127.0.0.1:4348/#date> → Tài khoản → Cài đặt → Chế độ gọn.
So DATE/%/Mở–Đã ghi nhận; Báo cáo/checkbox/HSD/Tồn; Thông báo/thu mở/đúng lô.
Tắt lại để so comfortable. KPH đã duyệt vẫn ở cùng bản tích hợp.

Mock memory-only/browser-local; chưa backend, Safari/Windows hoặc thiết bị
thật. Warning chunk ExcelJS lớn là baseline. Owner chưa chấp nhận candidate
COMPACT03; bước nhỏ tiếp là xem ba list trước khi chốt. Chưa merge/push/deploy.

## Resume26/10/2026

Owner yêu cầu tiếp đoạn bị ngắt và vào vòng tối ưu đồng nhất vùng chưa cover.
Thu hồi đúng worktree này, xác nhận cả ba browser gates đã hoàn tất PASS;
chưa có owner acceptance riêng cho COMPACT03. Checkpoint source hiện tại
trước khi mở rộng; tiếp cùng task thành revision2 với ledger có giới hạn
cho các vùng phụ chưa cover, không tạo cycle chỉ vì mất context.
