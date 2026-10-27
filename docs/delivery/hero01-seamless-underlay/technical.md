# HERO01 — technical receipt,27/10/2026

Candidate `565dde25979bc43966ec6df525e9d23158ccdd0b`, revision1; technical PASS, owner visual pending.
Branch `store-app/hero01-seamless-underlay`, worktree
`/Users/vup/.codex/worktrees/hero01-seamless-underlay/coopfood-kph`.
Base `82d7a5e` giữ SEARCH01 + LIST01; không suy acceptance SEARCH01 hoặc quyền
merge/push từ yêu cầu bố cục mới. Root sole writer, không dispatch agent.
Remote freshness không kiểm vì đây là local UI slice, không tích hợp/deploy.

Preview <http://127.0.0.1:4380/#home>, dev4379. Không đổi main/Pages/Cloudflare.

## Quyết định và kết quả

- `store-header.css`: một gutter16/36, gap8, khoảng nghỉ12 trước trắng,
  measure800 cho slot; giữ bar72/overlap12/radius24. Gradient90° cùng palette
  theo trục ngang nên chiều cao nội dung không đổi màu giữa các lớp.
- Dọn spacing/cover recipe trùng ở `store-kph-fresh.css`, `store-date-fresh.css`,
  `store-functional-layout.css`, `store-mobile-refinements.css`; page kit sở hữu
  seam/geometry, feature chỉ sở hữu nội dung/gap/padding bên trong.
- `store-page-hero.tsx`, `store-app-header.tsx`: bỏ hai owner reset scroll về0.
  Account/portal giữ anchor; control đã lộ không cuộn, control bị cover che chỉ
  cuộn đủ để lộ +8px. Một recheck RAF có guard focus, không listener cuộn trang.
- `store-app.tsx`, `store-report-hub.tsx`, `store-date-report.tsx`: reset route/
  report view trong layout effect trước paint; focus title preventScroll.
- Home lời chào hai hàng, login bỏ br cứng và thu gọn context; giữ logo, nội
  dung, tài khoản, form và bốn màu Home. `store-home.css` giới hạn focus xanh
  cho phần trắng, header giữ focus trắng trên xanh.
- `store-report-surface.tsx/css`, `store-report-hub.tsx`, `store-date-report.tsx`,
  `store-report-soft.css`: title/Back dùng một header, xanh chỉ chứa context;
  bỏ khung metadata lồng và entry animation tự chạy. Giữ pull-to-dismiss/
  settling/keyboard close đã có; không tạo gesture hoặc animation engine mới.
- `store-date-workspace.tsx/css`: feedback tìm miss/lỗi vào trắng; reserve nhãn
  Tìm/Tìm… bằng grid overlay text để busy không đổi độ rộng action. Giữ live
  filter/lookup/scan/Enter/clear, NOT_FOUND/recovery và exact lot.

Mốc mobile390px: cap Home138, KPH180, DATE128; màn chỉ header84. Chiều cao
không bị ép đồng loạt; tự nở khi text/content thật cần thêm chỗ.

Giữ API/quyền/rules/date/selection, list/search recipe, status colors, chart và
export data. Không dependency/asset/root config/packages/ui mới.

## Kiểm tra

1. `npm run check --workspace @coopfood-kph/store-pwa` — PASS.
2. `npm run test --workspace @coopfood-kph/store-pwa -- --maxWorkers=2` — PASS
   41files/294tests. Lần chạy parallel mặc định đầu có một timeout5s khi cùng
   browser, rerun giới hạn workers PASS; không tăng timeout/tắt test. Test focus
   được đổi từ ép scroll0 sang uncovered/no-scroll và covered/minimum48px.
   Selector approval print cũ `.store-ticket-quick` từ LIST01 cập nhật đúng
   `.store-ticket-foot`; vẫn test đủ ba nhãn và phục hồi row.
3. Sau sửa feedback/busy DATE và dọn CSS: `npm run test --workspace
   @coopfood-kph/store-pwa -- src/store-date-lookup.test.tsx
   src/store-date-workspace.test.tsx src/store-screen-layout.test.tsx
   src/store-app-frame.test.tsx --maxWorkers=2` — PASS24tests. Phần còn lại của
   suite294 ở cùng revision giữ bằng chứng vì chỉ các file DATE/CSS được sửa
   sau đó và đã được gate browser/build kiểm lại; không sửa rules/workflow khác.
4. `VITE_STORE_APP_MOCK=false npm run build --workspace @coopfood-kph/store-pwa`
   — PASS92precache; mock true — PASS118precache. Build cuối sau dọn background
   metadata là mock; file CSS đó ngoài graph online. Warning Excel chunk lớn
   kế thừa, không thuộc thay đổi này.
5. `STORE_PREVIEW_URL=http://127.0.0.1:4379 node
   e2e/scripts/check-store-page-kit.cjs` — PASS7màn×7viewport:
   390×844/1440×1024/1920×1080/2560×1440/320×740/768×1024/844×390;
   bar/account/back/white seam, native scroll/minimum reveal, skip/account,
   report back và login. Gate thay gradient115° stale bằng90° và thay yêu cầu
   focus phải về0 bằng yêu cầu control thực sự lộ trước cover.
6. `STORE_PREVIEW_URL=http://127.0.0.1:4379 STORE_REPORT_OUTPUT=/tmp/hero01/report-management
   node e2e/scripts/check-report-management.cjs` — PASS390/1440/320: create/name,
   saved history/reuse/custom template/rename/copy/update/search/month/large text,
   focus/selection. Sửa helper hit target chỉ xét active UI (không tính template
   button36px của nền aria-hidden/inert bên dưới modal); ngưỡng44px không đổi.
7. Candidate565dde2 production: `STORE_PREVIEW_URL=http://127.0.0.1:4380
   STORE_UNDERLAY_OUTPUT=/tmp/hero01/final STORE_UNDERLAY_LOADING=true node
   e2e/scripts/check-store-underlay.cjs` — PASS. Đây là gate mới có mục đích:
   7routes×5viewport (390/1440/320/900/844landscape), native scroll trace có
   `abs(capY+scrollY-initialCapY)<=1px`, heroY0; exposed focus giữ scroll20,
   hidden focus reveal tối thiểu còn scroll>0; modal giữ scroll/width. History/
   document chỉ một title/Back, print DOM còn metadata; DATE text200/no overflow,
   lookup miss/clear không dịch cap; reduced-motion không entry animation.
   Chặn chunk KPH ở390/1440: loading→ready hero/cap delta0.
8. `npm run check:docs`, `git diff --check` — PASS.

Log production lưu tại [production.log](production.log); metrics native trace
và geometry tại [browser-results.json](browser-results.json). Screenshot local
`/tmp/hero01/final/`, page kit `.local/store-page-kit/`, report workflow tại
`/tmp/hero01/report-management/`. Đã xem Home/KPH/DATE/history/document/200%.

## Giới hạn và nghiệm thu

Đây là local mock/synthetic browser, không chứng minh camera OS, iOS Safari,
keyboard thiết bị thật, FPS thực hoặc backend/production. Print kiểm DOM/
metadata; không claim đã render QA PDF hoặc tải Excel trong gate browser này.
Full Store unit suite vẫn kiểm export data; slice không đổi exporter.

Owner cần xem Home→KPH→DATE, cuộn và focus search, đổi Báo cáo→history/document,
đóng popup/tải lại và chữ lớn tại4380. Chờ quyết định thực; chưa đóng cycle.
Một bước tiếp: owner xác nhận nhịp xanh/trắng và cảm giác chuyển màn.
