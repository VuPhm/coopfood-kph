# Tra lùi hàng theo Home Visual DNA

Ngày 11/10/2026. Technical PASS; owner visual acceptance pending.
Scope của chat tiện ích: màn Tra lùi hàng, quick panel và lịch sử. Nguồn style
là [Visual DNA đã nghiệm thu cho Home](../../product/STORE_APP_VISUAL_DNA.md),
không phải frame Figma mới. Không triển khai toàn rollout r6 hoặc thay kế hoạch
Home/login của task khác.

Branch `store-app/figma-mobile-implementation`, worktree
`/Users/vup/Documents/coopfood-kph`, base HEAD
`b1c772f4753ad13db1a7930a484ac7933b73b383`. Giữ tất cả thay đổi trước scope này,
chưa commit/merge/deploy. Writer trong chat này chỉ sửa component/style/gate
của shelf và tài liệu bàn giao này; không sửa lại shared CSS/StoreApp/Home/login.

## Implementation

- `apps/store-pwa/src/store-shelf-life.css` mới: presentation scoped cho
  `.store-app.store-screen-shelf` và quick panel có shelf. Dùng layout/component
  hiện có; màu chữ `#20344a` / `#596b7d`, brand `#008655`, mint `#e6f7f2`,
  peach `#fff0e6`. Header nghiệp vụ gọn, gradient xanh theo Home; phần xanh đậm
  trải đến 65% để chữ nhỏ ở bên trái đọc rõ. Context/tài khoản trên desktop có
  nền xanh đậm, mobile hẹp giữ avatar với accessible label hiện hành.
- Nhóm mode peach với icon tròn nhỏ; holder icon tròn; viền/result/history 20px;
  input nền sáng và focus xanh; action phụ mint; history header/Tra lại peach.
  Icon peach dùng màu nâu đậm để đọc rõ, không dùng orange sáng làm chữ nhỏ.
- Switch có hit box thực 44px, vẫn giữ track 24px. Nút đóng quick panel 44px.
  Ở 320px ẩn icon mode trang trí và giảm padding timeline bốn mốc xuống 8px,
  giữ cỡ chữ; timeline hai mốc giữ khoảng đệm cho nhãn Hạn lùi / HSD dài.
- `store-shelf-life.tsx`: import stylesheet và thêm icon mode trang trí dùng
  CalendarDays đã có; không thêm dependency/ảnh/JS resize/listener/animation.
- Không override màu semantic success/amber/danger: status, invalid/overdue,
  glow/motion, Hôm nay và cách biểu diễn ngày vẫn giữ. Palette peach chỉ nhận
  diện tiện ích; lịch sử vẫn chỉ ghi main, 20 mục trong phiên, Recall tính mới.

## Kiểm chứng

- `npm run verify`: PASS **216 tests**, TypeScript, docs/contracts, generated API
  drift và production build. Warning Excel import/chunk lớn đã có từ trước.
- Test targeted shelf/session: 28 PASS. Bản CSS cuối còn kiểm bằng gate bên dưới
  và `npm --workspace @coopfood-kph/store-pwa run build`.
- `node e2e/scripts/check-shelf-dna.cjs` mới: PASS 390×844, 1440×1024, 320×740,
  768×1024 và 1024×768; main/quick empty/result/invalid, semantic status, Recall,
  switch/close 44px, focus + keyboard picker, không tràn/chồng nhãn, scope Home.
- `check-shelf-auto.cjs`, `check-shelf-result.cjs`, `check-shelf-history.cjs`,
  `check-shelf-motion.cjs`: PASS mobile/desktop; result gồm 12 tình huống,
  13 vị trí Hôm nay và resize popup 375px.
- `STORE_PREVIEW_URL=http://127.0.0.1:5175 node e2e/scripts/check-home-scroll-layer.cjs`:
  PASS 5 viewport, giữ Home/header/lớp cuộn/tài khoản/route.
- Đã xem screenshot main mobile/desktop, holder/result quick và màn hẹp.
  Artifact tổng hợp ở `.local/shelf-dna/` (ignored), không dữ liệu vận hành thật.

Giới hạn: Chromium headless, Store App mock; chưa có API wiring hay thiết bị thật.
Không sửa packages/ui, domain/API, Figma, deployment baseline. Bước nhỏ tiếp theo:
owner xem `http://127.0.0.1:5175/#shelf` và popup từ `/#kph` để duyệt hình ảnh.
