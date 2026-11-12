# KPHON03 revision2 — green UI integration

12/11/2026. Owner chat UI đổi ý: “tích hợp luôn KPHON03, tôi đổi ý r”.
Nguồn request: [handoff UI](../admin02-fresh-dashboard/integration-r11.md),
coordination message sau checkpoint55f398e. Đây là request tích hợp local,
không tự thành acceptance UI/create/final combined workflow hoặc rollout.

Merge implementation59fbcb8: KPHON03 checkpoint9a6dfa6 (chỉ scope revision2)
+ source thực tếf005586. Ref được gửi ban đầu e8a2df7; nhánh đã tiến tới
f005586 trước merge, diff chỉ2 file tài liệu pin checkpoint, không runtime.
Không conflict code; CURRENT/NEXT auto-merge giữ tiến độ KPHON03 và cập nhật
lại phần UI “giữ riêng” thành tích hợp hoàn tất. Không dùng trạng thái UI cũ
để overwrite code/business/acceptance mới.

Giữ nguyên bytes các file create/session/online-kph/control/form so với55f398e;
backend/contracts/packages/api/root lockfile cũng không khác. Admin shell giữ
UserRoundCog/memberships/canMemberships; Vite giữ ADMIN_API_TARGET + adminPreviewCache;
Store header/hero giữ ngoại lệ focus .store-online-account. UI thêm desktop
green header/official logo/nav tokens/no decorative lines; shared fresh tokens
được integration owner root xử lý, không writer khác trên worktree này.

## Kiểm bản kết hợp

Final candidate ghi trong plan.json. Runtime ở candidate bằng merge59fbcb8;
các thay đổi tiếp theo chỉ cập nhật docs và checker URLs/lifecycle assertions.

```sh
npm run check -w @coopfood-kph/store-pwa
npm run test -w @coopfood-kph/store-pwa -- src/store-online-create.test.tsx src/store-online-app.test.tsx src/store-online-kph.test.tsx src/create-record-dialog.test.tsx src/store-create-review.test.tsx src/online-kph.test.ts src/store-session-api.test.ts src/app.online.test.tsx src/store-kph-workspace.test.tsx
npm run test -w @coopfood-kph/admin-web
npm run test -w @coopfood-kph/ui
npm run build -w @coopfood-kph/admin-web
npm run build -w @coopfood-kph/store-pwa
VITE_STORE_APP_MOCK=false VITE_STORE_APP_ONLINE=true VITE_KPH_ONLINE=true npm run build -w @coopfood-kph/store-pwa
node e2e/scripts/check-kphon03-create-media.cjs
ADMIN_PREVIEW_URL=http://127.0.0.1:4175 STORE_PREVIEW_URL=http://127.0.0.1:4173 GREEN_CHECK_OUTPUT=.local/verification/kphon03-r2-chrome node e2e/scripts/check-integrated-green-header.cjs
npm run check:docs
git diff --check
```

PASS **118 targeted tests**: Store77 (9files), Admin25 (3files), UI16 (7files).
TypeScript PASS. Admin, Store mock và online build/PWA PASS (mock94/online92
precache); warning ExcelJS chunk>500kB của mock giữ nguyên, không tắt check.
Docs/fixtures checker PASS. Không gọi đây là fullverify mới hoặc vòng test cuối.

Real-backend Playwright PASS390×844/1440×1024 qua Store4173:
KPHON03 create đầy đủ như evidence revision1, kèm desktop green gradient,
no header/sidebar border và official light logo. NOT_FOUND barcode giữ đúng,
TPCN FOUND snapshot đúng,3originals byte/hash/order giữ nguyên; stamped private
200/anonymous401/cross-region403; delayed discovery mask giữ draft/ảnh; mất response
sau commit retry cùngkey/cùngUUID/chỉ1record; đóng/gửi lặp bị chặn khi gửi;
revoke-before-send403 không có success hoặc record mới. Không business API mocks,
không seed/reset. Test records là synthetic. Browser pageerror rỗng.

Read-only chrome smoke PASS Store390/1440 session/scope/barcode/D01/account/focus
và Admin1440 memberships/green header. Script parameterized URLs để kiểm đúng
worktree đã gộp. Lượt đầu script nhập barcode trước route revalidation hoàn tất;
đã thêm chờ response discovery thật, assert visible/value rồi mới submit;
không force click hoặc tăng timeout/bỏ assertion. Lượt hoàn chỉnh PASS cả3cases.
Ảnh Store desktop/Admin memberships và create/form/verifying/retry đã được xem.

Backend/API/media source không đổi so với837720e/55f398e, nên reuse9 backend
HTTP/media tests PASS từ [revision1](evidence.md) với đúng coverage ban đầu;
không báo là backend suite mới ở revision2. Full384 tests/UI6Admin+3Storeviewports
của [nhánh UI](../admin02-fresh-dashboard/integration-r11.md) vẫn là evidence
nguồn cũ, không thay118 checks và real-backend checks mới của bản KPHON03.

## Runtime và artifacts

Store4173 và Admin4175 cùng source worktree KPHON03, backend8082/DB55434/private
media KPHON02 giữ nguyên. Ban đầu4175 thuộc task UI; không dừng process khác.
Dùng4180 tạm, sau task UI tự giải phóng4175 đã chuyển Admin combined sang4175
và dừng đúng process4180 của task này. Preview integration riêng4178/4179 không
được dùng thay evidence combined và không bị thay đổi.
Raw logs/results: `.local/verification/kphon03-r2/`; ảnh chrome:
`.local/verification/kphon03-r2-chrome/`; ảnh create/results:
`.local/verification/kphon03/`. Tất cả gitignored. Main/Pages không đổi,
không push/deploy và không tự mở milestone.

## Gate còn lại

Owner create và owner green UI vẫn pending riêng; một vòng test kỹ/tổ hợp và
một vòng UI/UX cuối tiếp tục deferred. Không tự mở review/export.
