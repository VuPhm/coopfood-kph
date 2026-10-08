# Setup sửa focus StoreSheet — revision 6

Ngày 09/10/2026. Owner yêu cầu “setup để sửa tiếp”, sau khi xác nhận task khác đang sửa worktree gốc. Lượt này chuẩn bị môi trường và kế hoạch; chưa sửa code ứng dụng hoặc đánh dấu technical/owner repair acceptance.

- Worktree riêng: `/Users/vup/.codex/worktrees/store-sheet-focus/coopfood-kph`.
- Branch: `store-app/qa-20261009-sheet-focus`.
- Reviewed base: `b1c772f4753ad13db1a7930a484ac7933b73b383` (r5 application candidate `ef80ed0`, thêm cycle evidence).
- Writer: `/root`, không dispatch agent hoặc tạo chat mới.
- Preview mock độc lập: <http://127.0.0.1:5177/#kph>; Vite session `33127`.
- Cycle giữ identity `figma-mobile-implementation`; [plan r6](plan.json) ở PLANNING. [Plan r5](plan-r5.json) và evidence cũ được giữ nguyên làm lịch sử. CURRENT_STATE/NEXT từ base là trạng thái r5 trước setup; chưa ghi trạng thái repair readiness hoặc acceptance vào chúng.

## Tách ownership

Không sao chép bản nháp Tra hạn lùi của task kia, không thay nhánh/worktree gốc `/Users/vup/Documents/coopfood-kph`, không dùng chung node_modules. Dependencies cài từ lockfile/cache bằng `npm ci --offline --no-audit --no-fund` tại root (608 packages) và e2e (4 packages), giữ lockfile/dependency versions. Workspace package links trỏ nội bộ worktree mới.

Allowed future paths: `apps/store-pwa/src/store-app.tsx`, `apps/store-pwa/src/store-app.test.tsx`, `e2e/scripts/check-store-sheet-focus.cjs`, và tài liệu cùng cycle. CSS, shelf result component/tests/script, packages/ui, root config/lockfile, API/backend/Pilot và Figma writes nằm ngoài scope. Mỗi task một writer; chưa merge/cherry-pick sang nhánh writer kia hoặc push/deploy.

## Finding và hướng sửa nhỏ

Bộ lọc KPH và Tài khoản dùng StoreSheet controlled Dialog, không có DialogTrigger hoặc handler trả focus. Sau Escape hoặc nút Đóng, activeElement trở thành BODY; Tab tiếp theo tới link Đến nội dung. Tám case (2 dialog × 2 cách đóng × 2 viewport) đã tái hiện độc lập trên base sạch. Nested calendar Escape vẫn đúng: chỉ đóng picker, giữ quick panel và trả focus calendar trigger.

Hướng triển khai tiếp theo: trong StoreSheet ghi nhận opener trước khi auto-focus vào dialog; `onCloseAutoFocus` phục hồi opener nếu còn connected, dùng fallback nội dung phù hợp khi route unmount opener. Giữ semantics/focus của nested calendar, tránh timer tạo focus race khi mở dialog khác. Kiểm tra component/Dialog hiện có trước sửa; đọc structured Figma context/screenshot của các surface liên quan trước code change theo AGENTS. Không đổi visual tokens/layout hoặc shared UI.

Checks cho lượt sửa: Escape, nút Đóng, overlay click trả focus đúng; account/filter/detail/export có opener khác nhau; đóng để chuyển route không focus node đã unmount; lịch lồng dialog chỉ tiêu thụ Escape tại layer phù hợp. Playwright headless 390×844 / 1440×1024 với actual document.activeElement, keyboard Tab và screenshot. Thêm test meaningful cho opener lifecycle; chạy targeted tests, TypeScript, `npm run verify`, browser focus gate cùng regression gate đã có. Mọi gate repair phải gắn candidate mới; setup baseline không thay technical PASS.

## Setup verification

- Node v26.0.0, Playwright 1.62.0; Chromium dùng cache đã có, không cài thêm browser.
- `npm run check --workspace @coopfood-kph/store-pwa` — PASS.
- `npm test --workspace @coopfood-kph/store-pwa -- src/store-app.test.tsx` — PASS 2 tests / 1 file.
- `node .local/qa-ui-2026-10-09/focus-check.cjs` — hoàn tất exit0 ở hai viewport; ghi 8 case `restored:false`, BODY → Tab → Đến nội dung; no pageerror. Đây là reproduction baseline, không phải PASS của repair. Artifact local trong worktree này: `focus-results.json`, screenshot `filter-after-close-{390,1440}.png`, `account-after-close-{390,1440}.png`.
- `git diff --exit-code b1c772f -- apps packages e2e package.json package-lock.json` — PASS: toàn bộ code/config/dependency tracked còn nguyên so với base.
- `npm run check:docs`, `git diff --check` và cycle dispatch consistency sẽ được chạy sau khi lưu checkpoint tài liệu. Dispatch checker chỉ kiểm tra tính nhất quán setup, không khởi chạy agent hoặc implementation.

Preview vẫn là mock memory-only; scope này không chứng minh production API/persistence/security hoặc thiết bị thật. **Bước nhỏ tiếp theo:** bắt đầu sửa focus trong worktree trên khi owner yêu cầu tiếp tục triển khai; giữ một round bounded và nghiệm thu owner pending.
