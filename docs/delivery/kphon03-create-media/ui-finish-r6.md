# UI completion — revision6,14/11/2026

Owner: “tiếp, đặt goal để out task”. Goal được tạo cho vòng hoàn tất kỹ thuật
UI hiện có: đồng bộ chooser/account/password và control các workspace Admin,
preview mở được, kiểm mobile/desktop và checkpoint sạch. Đây không phải quyền
rollout hay sign-off tự động cho toàn app.

Candidate đã kiểm: `d6f750db377dff1b7568a9f1324c2a14660ab91e`.

## Target hoàn tất

- Giữ source compact UI05/DATE07/DATE08 của revision5; KPH/DATE không tăng mật độ
  vì style Admin. Giữ sidebar900, desktopstatic/mobile sticky.
- Store: chọn/đổi cửa hàng, tài khoản và quyền đọc rõ, action≥44px, tên dài wrap,
  close trả focus, scope revalidation vẫn che và khóa dữ liệu cũ đúng guard.
- Admin: Overview/identity/memberships/lifecycle/catalog dùng token Fresh cho
  heading/input/focus; control chính≥44px, input16px, table chỉ cuộn trong vùng
  riêng, không tràn trang. Không nới role/store/region hoặc đổi API.
- Đổi mật khẩu cùng component thật cho hai consumer; input50px/16px/400,
  radius12px, border token, action44px. Close explicit xóa draft/visibility;
  pending chặn đóng và double-submit; lỗi giữ draft; actor đổi thì remount.
  Password chỉ ở state, không trim/normalize/truncate, giữ15–64 codepoint.
- Có runtime local độc lập với foreground tool session và handoff có thể chạy lại.

## Thay đổi

- `packages/ui/src/password-change.tsx/.css/.test.tsx`: shared form, dùng Dialog
  hiện có; `dialog.tsx` thêm closeDisabled mặc định false, `index.ts` export.
  Hai `change-password-dialog.tsx` ở Store/Admin trở thành re-export.
- Store `store-online-app.tsx`, `store-account-sheet.tsx`, `store-utility-polish.css`:
  account navigation đồng đều, role/capability không suy thêm; key theo actor.
- Admin `admin-fresh-material.css`: heading/control/input/focus/reduced motion.
  Generic theme Admin không ghi đè shared password form; đây là xung đột token
  được tìm và sửa trong browser review. `app.tsx` key password form theo actor.
- `tooling/preview/fresh-review.mjs`: hỗ trợ --admin-port off để chỉ chạy Store,
  vẫn loopback/strictPort/proxy8082/probe401, không start DB hoặc kill port khác.
- Browser scripts revision6 cho Store,5 workspace Admin và shared password.

Tìm được lỗi cancel cũ: nút Quay lại gọi trực tiếp parent nên reset của Dialog
không chạy, mở lại còn mật khẩu. Shared close path sửa cả hai entry; unit regression
bao gồm cancel/reopen, whitespace/Unicode, pending/error và duplicate submission.

## Đội và review

Base `b39f3c7`, root là integration owner packages/ui và wrappers. Hai worktree
Terra độc lập: `freshr6-store` trả `5145f4d` (4files), `freshr6-admin` trả
`92c4097` (2files), đều đúng allowed paths. Root kiểm diff trước cherry-pick.
Cycle dispatch script còn lỗi inventory worktree prunable `/private/tmp/coopfood-kph-admin01`
không tồn tại, như revision5; không prune task khác để làm xanh. Hai scope active
được kiểm trực tiếp. Hai lượt: implementation, rồi browser integration sửa
xung đột border Admin và một viền lặp/weight chữ nhập. Không mở vòng audit rộng mới.

## Kiểm trên bản tích hợp

- `npm run check`: các workspace TypeScript PASS. Một option `exact` không hợp
  type Testing Library trong test mới được bỏ, giữ assertion bằng tên chính xác.
- UI unit20/20; Admin27/27; Store48files/328tests PASS trên bản tích hợp;
  log `unit.log` cuối. Tổng375tests của ba workspace liên quan.
  Không bỏ test/bảo mật hoặc tăng timeout.
- Build Store/Admin PASS; cảnh báo chunk ExcelJS lớn đã có, không đổi dependency.
- `node e2e/scripts/check-fresh-r6-password.cjs`: PASS390×844/1440×1024;
  đăng nhập bằng backend synthetic thật, form hai app cùng geometry/token,
  lỗi length, reveal, close/reopen clears, toàn dialog trong viewport.
  Không gửi đổi mật khẩu thật; pending/Unicode/error/retry kiểm bằng unit.
- `node e2e/scripts/check-fresh-r6-store.cjs`: PASS390/1440; chooser/account,
  action≥44, capabilities, focus return, change store và masked revalidation
  qua backend thật. Tên dài dùng text synthetic thay trong DOM, không sửa dữ liệu.
- `FRESH_ADMIN_URL=http://127.0.0.1:4175 node e2e/scripts/check-fresh-r6-admin.cjs`:
  PASS390/1440; chain/region login thật,5 workspace chain/3 region bằng fixture,
  membership/identity dialog, validation/error/empty/focus/sizing/reduced motion.
  Fixture UI không chứng minh authorization backend; không ghi membership/CSV thật.
- Reuse revision5 KPHON02/03 backend/browser tại `3273e94`: KPH/domain/API/media
  không đổi trong revision6; account/navigation được kiểm mới. Backend tests
  không cần chạy lại cho thay đổi CSS/shared form client này.

Log/ảnh ignored: `.local/verification/ui-finish-r6/`, `.local/verification/fresh-r6-store/`,
`.local/verification/fresh-r6-admin/`; unit UI đầu ở `compact-r5/r6-ui-unit.log`.

## Runtime và bàn giao

- Admin <http://127.0.0.1:4175/>.
- Store online <http://127.0.0.1:4173/>.
- Store mẫu nhóm DATE <http://127.0.0.1:4180/#date>.

Backend jar KPHON01 cũ, port8082, PostgreSQL container KPHON02/55434 và private
media KPHON02 được tái sử dụng, không reset/seed. Backend được spawn detached;
preview Admin+mock và Store online cũng spawn detached để không buộc foreground
chat còn chạy. PID/log local ở `.local/runtime/fresh-review/`; backend log ở
worktree `freshr6-store/.local/verification/fresh-r6-store/backend-detached.log`.
Đã xác minh PID12225/12226/13715 có PPID1 và health8082 UP sau smoke cuối.
Không có cam kết uptime nếu máy sleep/reboot. Có thể chạy launcher foreground:

```
node tooling/preview/fresh-review.mjs --store mock
node tooling/preview/fresh-review.mjs --admin-port off --store online --store-port 4173
```

Launcher cần backend8082 đã chạy và báo lỗi nếu port bận, không kill process.
Không ghi secret/session vào hồ sơ. Không merge main/push/deploy/Pages.

Đầu ra là technical-ready của vòng goal, owner UI acceptance riêng. DATE nhóm/
intake ở4180 chỉ trong phiên mẫu; online chưa có DATE persistence. Hai vòng test
kỹ/tổ hợp và UI/UX cuối toàn app vẫn pending, chưa coi đạt. Bước nhỏ tiếp là owner
xem checkpoint; review/export KPH là slice sau theo NEXT, không tự bắt đầu.

Goal hoàn tất ở mức kỹ thuật và bàn giao; không coi owner acceptance là PASS.
