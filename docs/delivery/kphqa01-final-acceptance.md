# KPHQA01 — preview nghiệm thu và hai vòng cuối

Ngày17/11/2026. Base/source preview `2d1536f6a9bed90acd72a1d21cfa8614b62ec61e`
trên main. Hồ sơ ở nhánh `store-app/kphqa01-final-acceptance`, worktree
`.local/worktrees/kphqa01-final-acceptance`; một writer. Candidate sửa nhỏ
feedback lỗi gửi ở form KPH, không đổi API/schema/dependency; không merge/push/
deploy hoặc thay Pages. Main4176 giữ source đã được owner nghiệm thu.

## Preview đã xác minh

- Store: <http://127.0.0.1:4176/#kph>, Fresh online, không mock.
- Admin: <http://127.0.0.1:4175/>, cùng backend8082.
- Hai URL HTTP200; module `/src/main.tsx` phục vụ từ repo main, env thực
  `VITE_STORE_APP_MOCK=false`, `VITE_STORE_APP_ONLINE=true`.
- Khởi động OrbStack và container `coopfood-kph-kphon02-acceptance` đã dừng;
  giữ nguyên DB tổng hợp55434 và private media trong worktree KPHON02.
  Không seed/reset. Backend dùng jar KPHON01 có production source trùng main
  (`git diff 0c37581 HEAD -- backend/src/main` rỗng); health UP, schema V9
  validated, không migration mới. Launcher `tooling/preview/fresh-review.mjs`
  chạy từ main, không từ worktree feature cũ.
- Tài khoản tổng hợp `region.admin03` / `admin-e2e-password`, cửa hàng001.
  Không dùng dữ liệu/ảnh vận hành thật.

## Evidence mới trước lượt owner

`STORE_URL=http://127.0.0.1:4176 npm run test:kph:browser` — PASS, exit0.
Chromium headless390×844 và1440×1024 trên backend/DB thật:
duyệt/không duyệt persisted, selection reset, chỉ xuất phiếu đã duyệt được
chọn; workbook BM-331.CF có người duyệt cộtR và bytes ảnh stamped private đúng.
Cross-region review/export403, anonymous media401; employee forged requests
và stale manager sau downgrade403, không download sai scope; expiry gỡ detail.
Không overflow/pageerror. Membership tạm đổi được restore trong finally.

Smoke bổ sung `node .local/verification/kph-final-2026-11-17/preview-smoke.cjs`
ở repo main — PASS, exit0: tạo TPTS bằng UI mobile với PNG tổng hợp, gửi201,
mở lại detail và đọc ảnh stamped200; Admin đăng nhập/dashboard ở cả390/1440,
không overflow/pageerror. Phiếu `573425fe-023c-4d3d-95a7-41faec710c5b` còn chờ
duyệt để owner có thể thử. Lượt đầu harness đổi route trước khi store context
sẵn sàng nên timeout; thêm chờ control Tài khoản rồi chạy lại đạt, không sửa
code sản phẩm. Đây chưa là evidence lost-response/retry mới.

Artifact local ở repo main `.local/verification/kph-final-2026-11-17/`
và `.local/verification/kphon04-review-export/`: log, results JSON, screenshot,
`mobile.xlsx` và `desktop.xlsx`. Không đưa binary/dữ liệu local vào Git.
Đây là kiểm preview KPH, chưa phải vòng kỹ thuật tổ hợp toàn luồng.
Không lặp root verify: source frontend trùng baseline đã PASS ngày17/11.
Hồ sơ mới qua `npm run check:docs` và `git diff --check`.

## Gate owner và thứ tự tiếp

Owner thử ngắn mobile/desktop: tạo phiếu có ảnh tổng hợp rồi mở lại → duyệt
một phiếu, không duyệt một phiếu → chọn/xuất phiếu hợp lệ và mở workbook bằng
Excel thực, xem đọc/in. Agent đã cung cấp URL/mode/source và workbook mới.
Owner phản hồi17/11/2026: **“Đạt KPHON03–04, tiếp vòng kỹ thuật tổ hợp”**.
KPHON03–04 đã được owner nghiệm thu trên bản tích hợp; không mở rộng quyết định
này thành nghiệm thu UI/UX cuối, thiết bị thật, ADR0007 hoặc quyền merge/deploy.

## Vòng kỹ thuật tổ hợp — PASS

- JDK21/OrbStack PostgreSQL17 Testcontainers riêng:
  `env JAVA_HOME=/Users/vup/Library/Java/JavaVirtualMachines/temurin-21.0.11/Contents/Home DOCKER_HOST=unix:///Users/vup/.orbstack/run/docker.sock ./backend/mvnw -q -o -f backend/pom.xml verify`
  — exit0, **92 tests/16 classes,0fail/error/skipped**, clean V1–V9 migrations.
  Gồm identity/session/CSRF, scope/discovery, membership concurrency, catalog,
  lifecycle, KPH review/export/idempotency và original/private media.
- `KPH_SYNTHETIC_ACCEPTANCE=1 STORE_URL=http://127.0.0.1:4181 ADMIN_URL=http://127.0.0.1:4175 NODE_PATH=/Users/vup/Documents/coopfood-kph/e2e/node_modules node e2e/scripts/check-kph-integrated.cjs`
  — exit0. Một phiên Admin desktop1440×1024 và một phiên Store mobile390×844:
  UI Admin nâng quyền → cùng phiên Store cập nhật capabilities; lookup FOUND
  giữ SKU/NCC leading zero; create NOT_FOUND giữ barcode,3 ảnh đúng thứ tự,
  focus revalidation giữ draft. Mất response sau commit thật → retry cùng key/
  id, tổng history chỉ tăng1. Quản lý vùng mở/duyệt, reload persisted rồi xuất
  đúng phiếu/3 ảnh stamped private theo thứ tự và SHA256, approverR.
  UI Admin revoke → stale review403, đóng scope/detail, private media403;
  trạng thái APPROVED không đổi. Finally xác minh role/active membership đã
  restore. Phiếu final `333856d2-5986-41cc-bea8-a77a28d3f13c`.
- Journey PASS trên main trước vòng UI; chạy lại đúng candidate sau patch UX
  vì form/retry bị ảnh hưởng. Không lặp backend regression sau patch frontend.
  Probe đầu của harness gọi GET detail riêng không tồn tại; đã sửa sang history
  API hiện có, không sửa production API để làm test đạt.
- Tái dùng KPHON04 browser đầu phiên cho REJECTED, selection reset và layout
  hai viewport; HTTP security có backend/full journey, không lặp theo viewport.

## Vòng UI/UX — phần agent PASS, owner/device pending

Blocker xác định: sau lỗi mạng ở cuối review, notice ở đầu vùng cuộn ngoài
viewport, người dùng chỉ thấy nút Gửi trở lại; raw “Failed to fetch” không hướng
dẫn recovery. Sửa `create-record-dialog.tsx`: focus notice sau lỗi và revalidation
hợp lệ; focus handler hiện có đưa notice dưới header. TypeError online có copy
tiếng Việt trung tính về việc chưa nhận xác nhận; nội dung/ảnh và key không đổi.
Không đổi CSS/layout, workflow hoặc authority dữ liệu/quyền.

- Regression có bước RED `toHaveFocus`, rồi GREEN:
  `VITEST_MAX_WORKERS=1 npm --workspace @coopfood-kph/store-pwa test -- src/store-online-create.test.tsx src/create-record-dialog.test.tsx`
  — **29 tests PASS**, exit0, gồm retry same key/history, giữ draft qua scope
  và403. Dependency task cài riêng bằng `npm ci --offline --no-audit --no-fund`.
- `VITE_STORE_APP_MOCK=false VITE_STORE_APP_ONLINE=true npm --workspace @coopfood-kph/store-pwa run build`
  — exit0, TypeScript/build/PWA102 entries PASS; warning bundle size hiện có.
- `NODE_PATH=/Users/vup/Documents/coopfood-kph/e2e/node_modules STORE_URL=http://127.0.0.1:4181 node .local/verification/kphqa01-final/final-ui.cjs`
  — exit0, Chromium headless390×844/1440×1024, reduced motion, native scrollbar:
  keyboard mở/trap/Escape/return focus; field cuối không bị sticky footer che;
  viewer trở về form; lỗi mạng focus, đủ trong viewport và không bị header che;
  Chỉnh sửa giữ nội dung/ảnh; filter trả focus; không overflow/pageerror.
  Fault này abort POST trước khi tới server, không giả business success.
  Root đã xem screenshot lỗi mobile/desktop. Journey final còn kiểm mất response
  sau commit thật và alert trong viewport trước retry.

Artifact task `.local/verification/kphqa01-final/`: backend/build/unit/browser
logs, results, screenshots và `integrated-three-photos.xlsx`; Surefire XML trong
`backend/target/surefire-reports`. Không đưa workbook/ảnh vào Git.
`node --check e2e/scripts/check-kph-integrated.cjs`, docs và diff checks PASS.
Không lặp full frontend suite: diff UX nhỏ đã có form tests/build/browser;
root verify420 trên baseline là evidence cũ, không đổi thành lần chạy mới.

Candidate Store <http://127.0.0.1:4181/#kph> từ worktree này, online không mock;
Admin4175 từ main cùng backend8082. Source candidate = base2d1536f + patch trong
task, không phải patch đã vào main4176. Dùng tài khoản tổng hợp ở trên.
Owner xem bố cục/nhịp thao tác candidate, chỉ mở lại blocker cụ thể.
Owner chọn17/11: **“Chưa có — giữ gate iPhone pending”** vì chưa có đường HTTPS
tới runtime tổng hợp/thiết bị kết nối. Camera, quyền OS, bàn phím, safe area và
gián đoạn trên iPhone thật chưa kiểm; không tự mở tunnel/deploy. Remote CI và
rollout chưa kiểm. UI/UX cuối chưa được coi accepted; không tự tiếp DATE/C02.
