# COMPACT02 — candidate item KPH

Ngày25/10/2026; sole writer: chat hiện tại. Owner yêu cầu “ok thử đi” ngay
sau đề xuất thử một candidate item KPH trước khi mở rộng list khác.
Feedback tiếp: “đối với đã hoặc không duyệt nếu hết chỗ thì chỉ hiện icon hoặc
nhãn màu là được, không quan trọng”. Áp fallback này, ưu tiên định danh/số
lượng, giữ Chờ duyệt có chữ. Đây là slice nhỏ, dùng hồ sơ bàn giao này; không dispatch agent hoặc mở
milestone nhiều team. **Technical PASS, owner chưa nghiệm thu hình ảnh.**

## Baseline và phạm vi

- Worktree: `/Users/vup/Documents/coopfood-kph/.local/worktrees/compact02-kph-items`.
- Branch: `store-app/compact02-kph-items`; base`e0054c7` từ COMPACT01 đã chốt
  tạm (runtime`ca543e6`). Một writer, worktree COMPACT01 giữ nguyên.
- Main vẫn`f77034d`; task stacked có FORM01d4f9d17/header816 theo baseline
  COMPACT01, không suy nghiệm thu FORM01 hoặc quyền merge main/push/deploy.
- Chỉ KPH Compact. Không đổi API/domain/data, packages/ui, root config/lock,
  default comfortable, shell, DATE/report/notifications hoặc Pages.

## Candidate thực

`store-kph-list.tsx`: mobile chuyển approval khỏi strip sang dòng định danh/
số lượng; không có nhãn duyệt trùng. Condition/resolution vẫn ở vùng cuộn độc
lập để swipe không mở phiếu. Toggle/print dùng density hook hiện có, không
remount workspace hoặc đổi selection/grouping. ResizeObserver đo lại strip
khi composition đổi. Metadata có ResizeObserver để so tổng độ rộng nội dung
với chỗ thực tế: chỉ Đã/Không duyệt rút còn icon khi thiếu chỗ, hiện lại chữ
khi rộng hơn. Không có listener cuộn trang; không thay dữ liệu trạng thái.

`store-kph-label.tsx`: thêm id tùy chọn để nối approval với aria-describedby
của button mở. Giữ category, title, full text, tone và icon mapping.

`store-kph-items.css`: chỉ screen Compact; giữ nền chip cho condition, bỏ
vỏ pill của resolution/approval, resolution weight500. Duyệt giữ màu và
icon; riêng bảng900–1099px Đã/Không duyệt chỉ còn icon màu, Chờ duyệt
giữ chữ và lược icon trang trí. Text cuối không bị xóa khỏi accessibility tree.
Dùng size/spacing tokens hiện có; không giảm tên14px/SKU12px hoặc vùng bấm44px.

Quyết định thiết kế theo [đề xuất đã trình owner](compact01-interface-density/list-items-next.md)
và [Apple HIG Lists and tables](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables).
Skill ui-ux-pro-max query `badge chip label wraps --domain ux` trả đúng
Compact Label Overflow: giới hạn giá trị khó dự đoán và giữ đường đọc đầy đủ
cho touch/keyboard. OTHER giữ accessible text/detail; không dựa riêng hover.

## Kiểm tra

- `VITEST_MAX_WORKERS=2 npm run verify` (log`verify-final.log`): PASS346tests (Store293/Admin16/API2/
  rules19/UI16), docs/contracts/generated API/types/build/PWA. Lần đầu bị thiếu
  link dependency Admin trong worktree mới; đã nối đúng dependency cài sẵn và
  chạy lại PASS, không thay dependency manifest/lock hoặc source Admin.
- `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build --
  --outDir ../../.local/compact02/build --emptyOutDir`: PASS117precache.
  Final build sau điều chỉnh900px có log riêng`build-final.log`.
- `STORE_PREVIEW_URL=http://127.0.0.1:4345 STORE_KPH_COMPACT_OUTPUT=.local/compact02/history-comfortable
  node e2e/scripts/check-kph-compact-history.cjs`: PASS390/1440/320; gate cũ
  không đổi, gồm partial-day selection, append/unique/focus, OTHER, touch/
  keyboard, xuất theo trạng thái duyệt và filter ngày với fixture tổng hợp.
- `STORE_KPH_ITEMS_SYNTHETIC_ROUTE=true STORE_PREVIEW_URL=http://127.0.0.1:4345
  STORE_BASELINE_URL=http://127.0.0.1:4344 STORE_KPH_ITEMS_OUTPUT=.local/compact02/dev-final
  node e2e/scripts/check-kph-item-density.cjs`: PASS5viewport + stress390/320: tên
  dài, cả hai OTHER dài, UPC/nhập tay, chữ approval không nằm trong strip,
  swipe không mở detail, keyboard strip, chọn25/30 rồi nối thêm có mixed state.
  Kiểm final-status icon khi hẹp, trả chữ khi resize rộng, Chờ duyệt giữ chữ
  và accessible description vẫn đủ trong chế độ icon.
- `STORE_PREVIEW_URL=http://127.0.0.1:4346 STORE_BASELINE_URL=http://127.0.0.1:4344
  STORE_KPH_ITEMS_OUTPUT=.local/compact02/production-final node e2e/scripts/check-kph-item-density.cjs`:
  PASS390×844/1440×1024/320×844/900×650/844×390. Comfortable và print
  geometry/content parity trên25hàng; đủ ba meaning, chọn/thu mở/toggle,
  nối thêm/focus/OTHER; touch44px, không tràn ngang, text150/200 trên mobile.
  Contrast chữ thấp nhất5.30:1 ở vùng list. Chụp và xem screenshot có mục tiêu,
  không dùng snapshot pixel rộng.

Logs/artifacts trong `.local/compact02/` (ignored); browser test dùng dữ liệu
tổng hợp. Full verify, final mock build và production gate được chạy lại sau feedback
icon của owner; không suy baseline geometry hoặc readability từ số token.

## Số đo cùng fixture và viewport

| Viewport | Item đầu ở4344 | Candidate4346 |
| --- | ---: | ---: |
|390×844|95px|91px|
|320×844|95px|91px|
|1440×1024|56px|56px|
|900×650|128px|56px|
|844×390|95px|91px|

Lợi ích chính là phân cấp và trạng thái duyệt không bị đẩy ra ngoài strip.
900px bớt wrap ở nhãn phụ, không đại diện cho mọi hàng; tên dài/chữ lớn vẫn
được nở cao. Không dùng số mẫu này làm cam kết nén mọi item.

## Owner xem và giới hạn

Preview production <http://127.0.0.1:4346/#kph>; dev4345; bản chốt trước4344.
Origin4346 mới có thể đang mặc định tắt: Tài khoản → Cài đặt → Giao diện →
Chế độ gọn. So TPTS/TPCN, nhãn dài, Chọn/nhóm ngày, tắt lại để so comfortable.

Không phải backend wiring hoặc nghiệm thu thiết bị thật/Safari/Windows.
Mock memory-only/browser-local và warning chunk ExcelJS lớn vẫn giữ. Không
claim WCAG certification toàn app. Chưa có acceptance item mới; bước nhỏ
tiếp theo là owner quyết định candidate KPH trước khi mở rộng list khác.
