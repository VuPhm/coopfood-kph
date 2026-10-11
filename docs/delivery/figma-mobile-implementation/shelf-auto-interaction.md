# Tra lùi hàng — holder, session state và tự động tra

Ngày thực hiện: 09/10/2026. Owner ACCEPTED ngày 10/10/2026: “đạt, thu dọn”.

Branch: `store-app/figma-mobile-implementation`.
Worktree: `/Users/vup/Documents/coopfood-kph`.
Base HEAD: `b1c772f4753ad13db1a7930a484ac7933b73b383`.
Writer: Codex trong chat sửa tương tác tiện ích. Không commit/merge/deploy.

## Kiểm tra trước khi sửa

Đã đọc state/next, engineering principles, baseline, contract index, domain rules,
accepted ADR và implementation/test hiện tại. Đối chiếu `ExpiryWorkbench` trong
`apps/store-pwa/src/expiry-dialog.tsx` và cùng file tại tag read-only
`preserve/github-pages-pwa-2026-09-24-c789714`: bản cũ dùng `liveState` để tự tính
và giữ component state khi đóng tiện ích. Bản mới chỉ tính khi submit, đồng thời
panel unmount khiến state mất.

Working tree đã có thay đổi kết quả/timeline, test và script regression chưa
commit trước task này. Giữ nguyên những thay đổi đó và sửa nối tiếp; không coi
chúng là toàn bộ diff do task này tạo ra.

## Implementation và file thay đổi

- [store-shelf-life.tsx](../../../apps/store-pwa/src/store-shelf-life.tsx): tách
  state/handlers hiện có thành `useShelfLifeLookup`; cả tự động và submit gọi cùng
  calculation/validation hiện có. Giữ section kết quả từ lần mở đầu; holder empty/invalid có composition
  riêng, không hiển thị ngày, facts hoặc timeline giả. Kết quả cập nhật trong
  cùng section.
- [store-app.tsx](../../../apps/store-pwa/src/store-app.tsx): StoreApp sở hữu
  hook của quick panel. Đóng/unmount hoặc đổi route không reset input, mode,
  ngày, lỗi hay kết quả. State memory-only, không lưu qua reload; màn tra chính
  tiếp tục có instance riêng theo implementation hiện hành.
- [calendar-input.tsx](../../../apps/store-pwa/src/calendar-input.tsx): callback
  báo nguồn `picker` optional khi chọn ngày; consumer hiện có dùng một tham số
  tiếp tục hoạt động.
- [store-app.css](../../../apps/store-pwa/src/store-app.css): holder riêng theo state, glow và spacing compact theo owner;
  chi tiết implementation cuối tại [UI đã nghiệm thu](shelf-empty-state.md).
- [store-shelf-life.test.tsx](../../../apps/store-pwa/src/store-shelf-life.test.tsx):
  holder node, debounce, timer cancellation, picker, modes, days/months,
  incomplete/invalid, Reset; giữ regression domain/status hiện có.
- [store-app.test.tsx](../../../apps/store-pwa/src/store-app.test.tsx): giữ state
  qua đóng/mở, Escape, route KPH → Home → DATE, đóng khi debounce đang chờ và Reset.
  Khởi tạo hash bằng history.replaceState để tránh hashchange đến muộn trong test.
- [check-shelf-auto.cjs](../../../e2e/scripts/check-shelf-auto.cjs): 7 tiêu chí
  nghiệm thu, hình học holder/panel và screenshot ở hai viewport.
- [check-shelf-result.cjs](../../../e2e/scripts/check-shelf-result.cjs): script
  regression đã tồn tại trong working tree; đổi expectation invalid sang holder EMPTY.
- Tài liệu bàn giao này.

Nhập liệu debounce 350 ms. Chọn picker hoặc đổi mode tính ngay sau cập nhật
state. Mỗi lần sửa hủy timer cũ và xóa kết quả cũ ngay; effect cleanup hủy lượt
chờ, submit và Reset cũng hủy timer. Calculation đồng bộ nên không có response
bất đồng bộ ghi đè. Revision trigger xử lý cả chọn lại cùng ngày. Reset duy nhất
đưa mode và các giá trị về ban đầu; đóng panel không gọi Reset.

## Kiểm chứng

- `npm run verify`: PASS — docs/contracts, generated API drift, TypeScript,
  **210 tests** và build. Có warning chunk/import Vite hiện hữu ngoài scope.
- `node e2e/scripts/check-shelf-auto.cjs`: PASS **390×844 / 1440×1024**.
  Cả 7 tiêu chí đạt; cùng node section, chênh lệch x/y/width/height holder và
  panel giữa empty/result dưới 1 px; không horizontal overflow/runtime error.
  Đóng bằng nút Đóng/Escape ở cả hai viewport, FAB toggle thêm ở desktop.
- `node e2e/scripts/check-shelf-result.cjs`: PASS hai viewport, mỗi viewport
  11 tình huống trạng thái/ngày, 9/10 ngày, reset/validation, unknown NSX,
  quick panel và kiểm tra hẹp 375 px; không nhãn chồng/overflow/runtime error.
- `git diff --check`: PASS.
- Screenshot đã xem: `.local/shelf-auto/holder-{390,1440}.png`; ảnh Reset cùng
  thư mục, regression tại `.local/shelf-result/` (ignored local artifacts).

Không đổi package domain, API, backend hoặc Figma. Pages branch vẫn tại
`ef629e77891769e344eb137ed6beb208317492a9`; tag bảo tồn vẫn trỏ
`c789714870eff5912e10fe89361bd845d9e3983d`.

Giới hạn: kiểm bằng Chromium headless và dữ liệu tổng hợp, chưa kiểm thiết bị
thật. Owner đã nghiệm thu phạm vi tiện ích; xem [ghi nhận và thu dọn](shelf-empty-state.md).
Phạm vi này đã đóng, không tự merge/deploy hay tiếp tục mở scope mới.
