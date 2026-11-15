# KPHON04 evidence — revision1

Ngày15/11/2026; integrated candidate
`1ad090750bbc579554b4e685e97322f5157fc7e5`. Tất cả lệnh dưới chạy tại
worktree `kphon04-review-export` trên candidate này; sau đó chỉ cập nhật hồ sơ
trong thư mục cycle. Không dùng test agent trên SHA cũ thay kết quả tích hợp.

## Implementation và ownership

- Base reviewed `82191c20cd9026fcd071d4273e460d8416d40e26` (chứa `de74077`).
  Source nhánh KPHON03 sạch; không có untracked code bị bỏ sót.
- Backend agent `/root/backend`: `d24da84`, integrated `0b55658`, chỉ test KPH.
- Export agent `/root/export`: `e931c5f`, integrated `8d6631e`, helper+tests.
- E2E agent `/root/e2e`: `a87c3c8`, integrated `1ad0907`, một script browser.
- Root wiring/session adapter/component regression/docs: `56ca265`.
- Dispatch/scope checker PASS; ba scope độc lập. Root sở hữu shared contracts,
  generated API, UI/config, không team nào sửa ngoài allowed paths. Không thêm
  migration/API/dependency, không merge BE07/08 legacy. Remote không fetch vì
  không push/deploy; refs/worktree local đã kiểm.
- Sau prune metadata ba worktree `/private/tmp` không còn tồn tại (dry-run xác
  nhận), dispatch PASS. Không xóa nhánh hoặc file người dùng.

## Gate kỹ thuật trên candidate

1. `VITEST_MAX_WORKERS=1 npm run verify` — **PASS**, exit0.
   Contracts30 manifest resources/22 API fixtures; generated API không drift;
   TypeScript, tests, build và PWA PASS. Tổng420 tests: Admin27, Store350,
   API4, rules19, UI20. Log local:
   `.local/verification/kphon04-review-export/verify.log`.
   Vitest Store49 files/350tests, duration107.27s. Warnings về localStorage
   experimental, AJV password/int64 format và bundle size hiện có không là failure.
2. Backend candidate — **PASS14 tests**, HTTP10 + policy4,0failure/error/skipped:

   ```sh
   env JAVA_HOME=/Users/vup/Library/Java/JavaVirtualMachines/temurin-21.0.11/Contents/Home DOCKER_HOST=unix:///Users/vup/.orbstack/run/docker.sock ./backend/mvnw -q -o -f backend/pom.xml '-Dtest=KphHttpIntegrationTest,KphStoreAccessPolicyTest' test
   ```

   Java21/PostgreSQL17-alpine Testcontainers riêng; clean V1–V9 migrations PASS.
   HTTP44.614s, policy0.013s. Kiểm employee deny, manager downgrade cùng session,
   inherited region/chain allow, cross-store/cross-region/revoke deny, eligibility
   mixed type/store/duplicate/rejected/invalidated và atomic audit/order.
   Không thay production backend; không chạy full backend regression mới.
   Surefire XML tại `backend/target/surefire-reports/`; output local `backend.log`.
3. `STORE_URL=http://127.0.0.1:4176 node e2e/scripts/check-kphon04-review-export.cjs`
   — **PASS**, exit0 trên candidate. Script không mock business API/reset DB.
   Hai viewport390×844/1440×1024, Chromium headless, vi-VN/Asia/Ho_Chi_Minh,
   reduced motion. Ba kết quả PASS trong `results.json`:
   - APPROVED/REJECTED persisted và inherited reviewer trên UI thật.
   - D01 reset selection khi page/tab/filter; POST export chỉ selected APPROVED.
   - Workbook thực kiểm D9/R9, landscape và ảnh embedded SHA256 bằng stamped
     bytes từ private API. Helper tests còn kiểm thứ tự O:Q/approver formula safety.
   - Employee không có controls, forged403; downgrade next request403 cho cả
     review/export, không download; expiry gỡ detail; cross-region403/media401.
   - Không overflow/pageerror; desktop canvas/no slide và mobile sticky hero.
   Membership thử nghiệm được phục hồi role/active trong finally. Chỉ thêm
   phiếu/ảnh synthetic; không xóa hoặc reset dataset cũ.
   Output local `.local/verification/kphon04-review-export/` gồm `browser.log`,
   `results.json`, `mobile-reviewed.png`, `desktop-reviewed.png`,
   `mobile-exported.png`, `desktop-exported.png`, workbooks. Root xem ảnh390/1440.
4. `git diff --check` — **PASS**. Không diff runtime UI checkpoint:

   ```sh
   git diff de74077 -- apps/store-pwa/src/store-app-frame.tsx apps/store-pwa/src/store-app-header.tsx apps/store-pwa/src/store-desktop-chrome.css apps/store-pwa/src/store-page-hero.tsx apps/store-pwa/src/store-report-surface.tsx packages/ui apps/admin-web/src
   ```

   Output0lines. Chỉ thêm thao tác vào Fresh online KPH; không đổi CSS/chrome.
   `git diff --quiet 0c37581 HEAD -- backend/src/main` exit0: runtime8082 jar
   KPHON01 có source production trùng candidate; E2E dùng DB/media KPHON02 cũ.

## Build entry riêng

Sau verify, chạy tuần tự trên cùng candidate — **PASS**, exit0 cả hai:

```sh
VITE_STORE_APP_MOCK=false VITE_STORE_APP_ONLINE=true VITE_KPH_ONLINE=true npm run build -w @coopfood-kph/store-pwa
VITE_STORE_APP_MOCK=true VITE_STORE_APP_ONLINE=false npm run build -w @coopfood-kph/store-pwa
```

PWA precache online102 entries/mock123 entries. Logs local `build-online.log`
và `build-mock.log`. Không dùng mock build để chứng minh online behavior.
Probe cuối Store4176/Admin4175 đều HTTP200; backend8082 healthHTTP200.

## Review có giới hạn

Hai lượt. Lượt1 một blocker stale history khi revalidate trùng PUT đã commit;
root sửa invalidate theo captured scope, guard notices/downloads theo generation,
và same-scope401/403 vẫn refresh. Test delayed PUT/suspend/resume PASS. Lượt2
backend reviewer xác nhận không còn blocker. Lỗi test ban đầu (click control
trước query load, giả định route Home sau reload) đã sửa bằng chờ đúng trạng
thái; không tắt gate hoặc sửa semantics để cho test xanh.

## Giới hạn và acceptance

Đây là kiểm kỹ thuật local, chưa remote CI/thiết bị thật/production load hoặc
hai vòng cuối toàn app. Technical PASS không tự là owner acceptance. Gate owner
KPHON04 pending; KPHON03/UI còn pending theo owner muốn còn sửa `de74077`.
Không coi yêu cầu tiếp BE là sign-off UI; không merge main/push/deploy/Pages.
Xem [ba thao tác nghiệm thu](handoff.md). Dừng audit sau hai lượt; chỉ mở lại
blocker cụ thể khi có phản hồi.
