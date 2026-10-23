# DATE03 — danh sách gọn, phần trăm là chính

Ngày23/10/2026, owner yêu cầu từ `630ec7b` trình bày lại item DATE gọn gàng,
nền chuẩn chỉ đổi khi select, không nhấn NSX/HSD, ưu tiên % còn lại.

- Base: `630ec7b06b369e566b3bd5c9326bebed82b22b72` trên main sạch.
- Nhánh: `store-app/date03-compact-list`.
- Worktree: `/Users/vup/.codex/worktrees/date03-compact-list/coopfood-kph`.
- Writer: chat DATE03 hiện tại; một writer, không delegation.
- Phạm vi: Store Fresh DATE list; reuse token/nhãn/marker hiện có. Không đổi
  packages/ui, root config/lockfile, API/backend, rule ngày, biểu đồ hay workflow.

## Kết quả

Tên/SKU/lô bên trái, “Còn” và phần trăm24px bên phải. Ngày phụ12px, bỏ bold
và holder xám. Hàng nhãn/hành động dùng flex, wrap tự nhiên khi chữ lớn; mỗi
item vẫn là một button mở chi tiết. Thẻ trắng khi nghỉ/hover; lô chọn mint +
viền xanh, expose `aria-pressed`, bỏ chọn trả về trắng. Badge/marker semantic
giữ nguyên, màu % theo phase đã tính, thiếu dữ liệu không suy %.

Tại390px, lô có đủ NSX/HSD trên ngày23/10: chiều cao ngoài154→128px (−26px).
Giữ tên hàng16px, label12px, không cắt chữ hay thêm progress bar. Chi tiết và
nhắc1/7ngày/DATE→KPH giữ nguyên.

File runtime: `store-date-workspace.tsx`, `store-date-fresh.css`; cập nhật
selector `store-date-lookup.test.tsx` theo accessible name sau khi tách markup
phần trăm, vẫn kiểm38%/13%/1%; thêm `e2e/scripts/check-date-list.cjs`.
Product hướng dẫn trong `docs/product/DATE_MILESTONE_MODEL.md`.

## Kiểm tra kỹ thuật

- `VITEST_MAX_WORKERS=2 npm run verify`: PASS docs/contracts/generated API drift/
  TypeScript/**327tests** (Store274/Admin16/API2/rules19/UI16), default build/PWA.
  Log `.local/date03/verify.log`.
- `VITE_STORE_APP_MOCK=true npm run build --workspace @coopfood-kph/store-pwa -- --outDir ../../.local/date03/build --emptyOutDir`:
  PASS,114 precache; log `.local/date03/mock-build.log`. Warning ExcelJS chunk lớn
  giữ từ baseline.
- `STORE_PREVIEW_URL=http://127.0.0.1:4281 STORE_DATE_OUTPUT=.local/date03/list-build node e2e/scripts/check-date-list.cjs`:
  PASS production390×844/1440×1024/320×844, nền nghỉ/hover/selected/reset,
  Enter/Escape/focus, phần trăm/NSX/HSD, không overflow/chữ150%, contrast.
  Screenshot/results/contrast JSON trong `.local/date03/list-build/`.
- `STORE_PREVIEW_URL=http://127.0.0.1:4281 STORE_DATE_OUTPUT=.local/date03/actions-build node e2e/scripts/check-date-actions.cjs`:
  PASS production390/1440/320, báo lại1/7ngày, đến hạn thông báo, TPCN/TPTS
  prefill/hủy/ảnh/review/gửi một phiếu PENDING/resolve giữ phase và %, loại
  chưa biết hỏi explicit. Evidence `.local/date03/actions-build/`.
- `STORE_PREVIEW_URL=http://127.0.0.1:4280 STORE_DATE_OUTPUT=.local/date03/refinement node e2e/scripts/check-date-refinement.cjs`:
  PASS390/1440/320 cho sáu phase/ratio/semantic color, thiếu NSX, detail
  trắng/xám, chữ150%, CTA/focus, viewport ngắn390×568.

Preview production: <http://127.0.0.1:4281/#date>. **Candidate chờ owner xem**;
chưa commit/merge/push/deploy. Main và Pages giữ nguyên. Prototype memory-only,
reload mất thay đổi; chưa kiểm thiết bị thật/backend/push. Technical PASS và
nghiệm thu owner giữ riêng. Bước nhỏ tiếp theo: owner xem danh sách và chọn lô
tại preview4281 ở mobile/desktop.
