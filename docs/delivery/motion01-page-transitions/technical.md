# MOTION01 — candidate28/10/2026

Branch `store-app/motion01-page-transitions`; worktree
`/Users/vup/.codex/worktrees/motion01-page-transitions/coopfood-kph`.
Base `2692c28`; root sole writer, không dispatch agent. Remote freshness không
kiểm vì đây là local UI slice. Giữ bản xanh sau COLOR01 rejected/reverted;
không suy quyền merge/push/deploy hoặc nghiệm thu từ các vòng trước.

Preview mock/synthetic <http://127.0.0.1:4384/#home>, dev4383.
Technical evidence đang hoàn thiện; owner motion pending.

## Recipe và file

- `apps/store-pwa/src/store-page-motion.tsx`: một route clock cấp cho loading
  và ready. Vào feature, nắp trắng đi lên16px/220ms; về Home đi xuống10px/280ms;
  Home lần đầu đi lên16px. Ease-out `cubic-bezier(.2,.8,.2,1)`;
  cover trượt giữ trắng đặc, hero content opacity94→100%/160ms. Tối đa hai effect hữu hạn, chỉ transform/opacity.
- `store-app-frame.tsx` cấp context không thêm DOM; `store-page-hero.tsx` dùng
  hook trên canvas hiện có và giữ ref của consumer. Header/navigation/FAB không
  trượt; không giữ trang cũ hoặc trì hoãn route để đợi animation.
- Lazy page thay skeleton tiếp tục mốc thời gian cũ. Tải lâu hơn220/280ms thì
  nội dung ready vào ngay, không replay. Không replay khi account/filter/form
  rerender cùng route. Không thêm package, per-frame JS hoặc will-change thường trực.
- Wheel/touch/scroll/focus control ưu tiên thao tác và dừng decoration; hidden/
  print/reduced-motion dừng ngay, reduced-motion hoặc thiếu WAAPI vào thẳng resting
  state. Listener chỉ tồn tại trong thời gian effect; cleanup cancel effect.
- Surface có `.store-action-anchor` chỉ fade, không transform ancestor làm đổi
  containing block của fixed dock/probe. Pull-to-dismiss Báo cáo giữ implementation
  và semantics cũ; route arrival không là gesture mới.
- `store-shelf-life.tsx`: reserve24×24 cho hai icon SVG Tra cứu/Làm mới,
  bằng kích thước intrinsic hiện tại; tránh layout shift trước khi ảnh decode.
- `e2e/scripts/check-store-motion.cjs`: gate riêng cho motion, interruptions,
  lazy clock, fixed dock, fallback và số đo lab. Không đổi rules/API/date/store
  scope, search/list recipe hoặc exporter.

Sửa hiệu năng có mục tiêu: bản fade cả cover cho p95 desktop CPU1≈33.3ms;
bỏ opacity của cover đang trượt, giữ hero fade và fallback fade-only cho fixed
dock. Kiểm lại cùng host CPU1: p95 cũ/mới16.8/16.8ms, first-frame16.5/16.3ms;
không suy đây là FPS trên thiết bị thật. Không thêm layer thường trực.

## Kiểm tra

- `npm run check --workspace @coopfood-kph/store-pwa` — PASS.
- `npm run test --workspace @coopfood-kph/store-pwa -- --maxWorkers=2` — PASS
  41files/294tests,45.14s. Không tăng timeout hoặc tắt test.
- Sau reserve icon: targeted `store-shelf-life/store-app-frame/store-screen-layout`
  — PASS35tests; online build — PASS92precache.
- `VITE_STORE_APP_MOCK=true npm run build --workspace @coopfood-kph/store-pwa`
  — PASS118precache. Warning Excel chunk lớn kế thừa.
- `STORE_PREVIEW_URL=http://127.0.0.1:4384 node e2e/scripts/check-store-page-kit.cjs`
  — PASS7routes×7viewports, gồm390×844/1440×1024; geometry/anchors/focus/scroll/
  login/report. Reduced-motion là một phần gate này.
- `STORE_PREVIEW_URL=http://127.0.0.1:4384 STORE_UNDERLAY_OUTPUT=/tmp/motion01/underlay
  STORE_UNDERLAY_LOADING=true node e2e/scripts/check-store-underlay.cjs` — PASS
  7routes×5viewports390/1440/320/900/844landscape; native scroll trace, minimum
  focus reveal, modal anchor, report history/document/print DOM, text200, DATE
  lookup/clear. Loading→ready hero/cap delta0 ở390/1440.
- `STORE_PREVIEW_URL=http://127.0.0.1:4384 STORE_REPORT_OUTPUT=/tmp/motion01/reports
  node e2e/scripts/check-report-management.cjs` — PASS390/1440/320; create/name,
  history/reuse/template/filter/selection/focus. Gate không tải Excel/render PDF.

## Số đo và giới hạn

Đo Chromium headless local, mock, chặn service worker; so với HERO01 production
4380 trên cùng host, viewport390/1440, CPU throttle4x. Đây là bằng chứng lab,
không là cam kết60fps hay kiểm iOS/Android thiết bị thật. Rendering danh sách KPH
có long task kế thừa ở cả hai bản; animation không loại bỏ chi phí dựng nội dung.

Lần gate đầu yêu cầu CLS tuyệt đối0 đã bắt0.0008845; đối chiếu cùng trace bản cũ
cũng0.0008845, từ nhãn gần nhất/mobile nav và nút Tra hạn đổi độ rộng. Desktop
sau đó lộ cùng shift nút Tra hạn với tần suất paint khác nhau; không nới budget
CLS. Sửa reserve kích thước hai icon, giữ resting geometry. Gate cuối yêu cầu
CLS không tăng so baseline; không claim toàn app CLS0 vì nhãn nav đổi theo route. Lần đo
đồng thời browser khác có max long task353ms so197ms; không dùng lượt nhiễu đó
để kết luận. Gate cuối chạy riêng, bốn vòng40route, xét p95 frame/median long task
và vẫn ghi max/heap/DOM; giữ ngưỡng max task500ms, không che outlier.

Owner thử Home→KPH→DATE→Báo cáo→Home, đổi nhanh, cuộn/focus ngay khi vừa vào.
Kỳ vọng nhịp nhẹ, dùng được ngay, toolbar/FAB đứng yên. Chờ quyết định thật;
không tự đóng cycle. Bước tiếp nhỏ: owner xem cảm giác chuyển màn trên4384.
