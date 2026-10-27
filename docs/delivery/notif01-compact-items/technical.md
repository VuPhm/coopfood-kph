# NOTIF01 — candidate28/10/2026

Preview mock/synthetic <http://127.0.0.1:4386/#notifications>.
Branch `store-app/notif01-compact-items`, worktree
`/Users/vup/.codex/worktrees/notif01-compact-items/coopfood-kph`, base
`c9dbbbad0d30d583617c96d30cccac01475e3899`. Root sole writer; task nhỏ nên dùng
receipt này, không tạo cycle/team mới. Remote freshness không kiểm cho local UI.

Owner đã nghiệm thu MOTION01 tại4384: “giao diện ổn, tiếp tục phần thông báo”.
Đã ghi owner gate và CLOSED cycle đó; yêu cầu mới chưa là nghiệm thu NOTIF01.
Không merge/push/deploy.

## File và kết quả

- `apps/store-pwa/src/store-notifications.tsx`: tên + %/chevron hàng trên;
  SKU, nhãn phase và HSD gom metadata hàng dưới, tự wrap. Mã lô/prefix SKU
  giữ accessible text, bấm item vẫn truyền đúng lot ID. HSD giúp phân biệt các
  lô cùng sản phẩm khi mã lô không còn chiếm chỗ trực quan. Lịch báo lại giữ
  dòng riêng và ngày đầy đủ. Không suy % cho trường hợp thiếu dữ liệu.
- `store-notifications.css`: cùng tên14/20 và %14px như DATE; bỏ %24px và chữ
  Còn trực quan. Item mẫu390px92→62px (−33%); metadata không bị ép một dòng
  khi hẹp/chữ lớn. Header nhóm min44, hướng dẫn đi cùng dòng khi đủ chỗ;
  module count plain “4 lô”, vẫn giữ hierarchy/date module và icon hiện có.
- `store-notifications.test.tsx`: kiểm HSD đầy đủ cùng identity/exact-lot đã có.
- `e2e/scripts/check-store-notifications-layout.cjs`: geometry/identity, hit
  target44, long-name/text200, hover/focus không đổi kích thước, native nhóm,
  route tối đa hai effect và reduced-motion.
- Chuyển trang kế thừa MOTION01 đã accepted; không thêm animation theo từng
  item, listener, dependency hoặc root config. Build gzip JS+67byte/CSS−39byte
  so với build accepted4384. Không đổi model nhóm, clock/ngày, nhắc/resolved,
  API/quyền, workflow DATE/KPH hoặc empty-state semantics.

## Kiểm tra

- `npm run check --workspace @coopfood-kph/store-pwa` — PASS.
- `npm run test --workspace @coopfood-kph/store-pwa -- src/store-notifications.test.tsx
  src/store-notifications-model.test.ts src/store-date-workflow.test.tsx --maxWorkers=2`
  — PASS3files/10tests.
- `VITE_STORE_APP_MOCK=true npm run build --workspace @coopfood-kph/store-pwa`
  — PASS118precache; warning Excel chunk lớn kế thừa. Worktree mới dùng symlink
  dependency cài sẵn của repo; không đổi package/lockfile. Lượt đầu thiếu link
  nên tsc không tìm thấy; đã sửa setup và chạy lại đạt.
- `STORE_PREVIEW_URL=http://127.0.0.1:4386 STORE_NOTIFICATIONS_OUTPUT=/tmp/notif01/workflow
  node e2e/scripts/check-store-notifications.cjs` — PASS390×844/1440×1024/320×844:
  warning/withdrawal/missing/expired/reminder, keyboard thu/mở, mở đúng lô,
  chọn đúng loại thực phẩm/selection, hẹn ẩn→đến lịch→không lặp; contrast và
  text150. DATE không có nhóm completed giả; không thay rule nghiệp vụ.
- `STORE_PREVIEW_URL=http://127.0.0.1:4386 STORE_NOTIFICATIONS_OUTPUT=/tmp/notif01/layout
  node e2e/scripts/check-store-notifications-layout.cjs` — PASS390×844/1440×1024/
  320×740/844×390: font/alignment/HSD, hit target44, không overflow với tên dài
  và chữ200%, hover/focus không đổi bounds, native keyboard, reduced-motion,
  arrival max2 và cleanup. Gate bổ sung ban đầu dùng selector Home cũ; sửa đúng
  `.store-home-page`, không nới assertion hoặc timeout.
- `npm run check:docs`, `git diff --check` — PASS.

[Log](verification-output.txt), [layout](layout-results.json),
[workflow](workflow-results.json). Screenshots local `/tmp/notif01/after-*`,
`/tmp/notif01/layout/`, `/tmp/notif01/workflow/`; đã xem390/1440 và chữ200%320.

## Giới hạn và bước tiếp

Chỉ local mock/browser, dữ liệu tổng hợp, chưa thiết bị thật/backend/push. Không
claim nghiệm thu owner của NOTIF01 hoặc benchmark FPS mới; route motion giữ
implementation đã đo của MOTION01. Receipt nhỏ này xác nhận phần presentation
và workflow liên quan, không chạy lại toàn bộ backend/root suite không bị sửa.

Technical PASS, owner visual pending. Bước nhỏ tiếp: xem list Thông báo ở4386,
thu/mở nhóm và mở một lô để kiểm độ dễ quét/đối chiếu HSD.

Candidate source `942b31c95bfb78b78519bf45490da51cbbd70aab`. Các kiểm tra trên chạy với working tree runtime
được commit nguyên trạng tại SHA này; sau đó chỉ ghi receipt, không đổi runtime.
