# Compact restore — revision5,14/11/2026

Owner sau revision4: Admin không mở; Store gần đúng nhưng còn bản compact sau
này, item KPH/DATE thấp hơn và có nhóm hàng DATE. Yêu cầu tìm được rồi lập đội
inloop tối ưu. POLISH03 của revision4 là nguồn quá sớm, chưa được owner chấp nhận.

Candidate tích hợp đã kiểm: `3273e94d23ec0a8aeaac28810295a8531fec6152` trên
`store-app/kphon03-create-media`. Root worktree: `.local/worktrees/kphon03-create-media`.

## Nguồn xác định lại

- DATE07 `8538d82`, palette `e3f99f8`, checkpoint `f3b2a97`: dropdown nhóm
  thay tabs, một CTA, chọn nhóm hoặc Chưa phân loại; chip nhóm và16 màu.
- DATE08 `1dcc6c4`/`4c8c1ba`: tên KPH/DATE xuống dòng giảm một nấc và Fresh actions.
- UI04 `7a7dbe1`/`0762cf9`: shared search/tag strip, chạm tag không mở nhầm item.
- UI05 `ecb5215`, checkpoint `53122ae`: giữ login DOM khi focus/tab gây session
  retry, gom phép đo tên vào một batch mỗi frame, giảm layout lặp.

Chuỗi trên khớp cả ba dấu hiệu owner đưa. Không merge nguyên nhánh: backend
DATE V11–13, paired media upload và search q có contract riêng. Candidate giữ
KPHON03 originals/server-stamped private và D01 hiện hành. DATE groups được
phục hồi trong entry mock, không giả dữ liệu hoặc quyền backend DATE online.

## Target và cách làm

Giữ login mới, sidebar900 đồng bộ và hero mobile sticky/desktop static.
Item gọn nhưng không mất tên/ngày/số lượng/trạng thái/ảnh hoặc keyboard access;
text200% nở cao, trang không tràn ngang; tag cuộn riêng, detail đọc đầy đủ.
Nhóm DATE không suy từ catalog/tên/SKU; lô cũ Chưa phân loại, chọn nhóm explicit.
Giữ accepted workflow DATE mock; không tự thêm partial quantity hoặc API mới.

Ba Terra dùng worktree riêng từ `96bfd0c`, root tích hợp shared CSS/search/login.
KPH: `freshr5-kph`; DATE: `freshr5-date`; Admin: `freshr5-admin`.
Hai lượt: phục hồi/kiểm có mục tiêu, rồi review trên bản tích hợp.

Cycle dispatch checker không qua vì inventory Git còn worktree prunable
`/private/tmp/coopfood-kph-admin01` không tồn tại và checker realpath toàn bộ.
Không prune hoặc sửa metadata của task khác để làm xanh checker. Root kiểm
base/allowed paths của ba worktree active trực tiếp trước khi tích hợp.

## Admin runtime

Admin4175 HTML200 nhưng GET `/api/v1/auth/session`502; proxy sai target.
Backend8082 trả401 đúng với phiên chưa đăng nhập. Thay đúng process Admin4175
bằng `ADMIN_API_TARGET=http://127.0.0.1:8082 npm run dev -w @coopfood-kph/admin-web
-- --host 127.0.0.1 --port 4175`. Playwright xác nhận login hiện390×844/1440×1024.
Không reset DB/storage hoặc sửa policy bảo mật để vượt lỗi.

## Evidence

Baseline mobile390: KPH90px/item thường, DATE110px/item mẫu; desktop1440:
KPH56–57px, DATE74px. Đo trên entry mock trước integration composition; CSS
DATE shared padding đã về8px ở thời điểm đo. Log/ảnh ignored
`.local/verification/compact-r5/baseline*`; không coi chiều cao là yêu cầu cố định.

Các commit trả về đều nằm trong allowed paths: KPH `dca66e7` (5files),
DATE `14bd2e2` + `bb412c7` (12files), Admin `1be8477` (2files).
Root cung cấp hai dependency shared search/CSS cho worktree KPH/DATE để kiểm;
agent không commit chúng. Không đổi contracts/backend/packages API/migration.

- KPH mobile390 item thường90→66px; desktop56px. Fixture tên dài82px mobile/
  60px desktop, không cố ép bằng chiều cao item ngắn. Tăng riêng chữ tên hàng
  và line metrics gấp đôi vẫn không tràn trang; detail giữ nguyên tên đầy đủ.
- DATE mobile110→86px, desktop74→56.5px trên cùng lô mẫu. Dropdown nhóm,
  Chưa phân loại, chọn nhóm explicit trong form, nhóm chip và ngày vẫn đủ.
  NSX/HSD dùng CalendarInput, scanner dùng control hiện có; số lô optional.
  Thao tác tag pointer/keyboard không mở nhầm lô. Browser zoom200% không tràn.
- Root review vòng2 sửa full-name fixture/keyboard-scroll gate, mô tả truy cập
  DATE liên kết phần trăm HSD/ngày/trạng thái vào nút mở, và focus ring theo token.
  Không coi root rem-size đơn thuần là bằng chứng text200% toàn app.
- Login Store giữ cùng DOM/input khi retry session đang chờ và offline; reload
  xóa draft. Admin giữ regression revision4; Playwright revision5 đăng nhập thật.

Lệnh/kết quả trên runtime tích hợp:

- `node e2e/scripts/check-fresh-r5-kph.cjs`: PASS390/1440, actual overflowing
  strip với Home/End, tag không mở phiếu, chọn/mở đúng, tên dài và double text.
- `node e2e/scripts/check-fresh-r5-date.cjs`: PASS390×844/1440×1024, đủ nhóm,
  7lô cũ Chưa phân loại, tạo thử chọn nhóm, calendar/scanner và zoom200%.
- `node e2e/scripts/check-fresh-r5-admin.cjs`: PASS390/1440: HTTP401→login200→
  authenticated session200, Admin shell thật, draft tab/offline và reload.
- `node e2e/scripts/check-store-login-revalidation.cjs`: PASS390/1440, cùng DOM
  khi pending/offline, xóa username/password sau reload, không lưu password.
- KPHON02 + KPHON03 scripts: PASS390/1440 với backend8082, D01 metadata39phiếu
  lúc kiểm, private ảnh/order/hash, cross-region403 và retry không trùng;
  revoke-before-send403. Bài tạo thêm phiếu synthetic, không reset DB.
- Chrome alignment: PASS390/834/900/1440, desktopstatic/mobile sticky, same rail.
- Lượt unit Store đầu326pass/2fail do assertion DATE cũ; sửa truy cập/selector
  rồi hai file liên quan10/10 PASS. Final `VITEST_MAX_WORKERS=1 npm run test
  -w @coopfood-kph/store-pwa`: **48files/328tests PASS**, không tăng timeout
  hoặc bỏ test; log `store-unit-final.log`.
- Build Store + TypeScript PASS (cảnh báo chunk ExcelJS lớn đã có); docs và
  diff check PASS. Admin code không đổi từ revision4 nên reuse27unit/build
  tại `e3a49b2`; runtime/login/browser mới được kiểm lại qua backend thật.

Log/ảnh ignored `.local/verification/compact-r5/`, DATE ảnh
`.local/verification/freshr5-date/`; history/create ảnh ở
`.local/verification/fresh-restore/kphon02/` và `kphon03/`.

## Preview và giới hạn

- Admin: <http://127.0.0.1:4175/>; backend8082.
- Store online KPH: <http://127.0.0.1:4173/>.
- Store mẫu compact/nhóm DATE: <http://127.0.0.1:4180/#date>.

Launcher local: `node tooling/preview/fresh-review.mjs --store mock`; mặc định
Admin4175/Store4180, strictPort không chiếm cổng đang dùng; có --help và flags
đổi cổng/API loopback. Không start backend/DB, không tự kill process khác.

Nhóm DATE/intake ở bản mẫu mất khi reload. Online4173 không có DATE persistence,
quản lý nhóm toàn chuỗi, partial quantity hay search q; không render dữ liệu
mẫu vào context online. Nguyên bản source có các backend slice riêng cho chúng;
không nhập ngầm vào task khôi phục giao diện. Nghiệm thu owner còn pending;
hai vòng toàn app cuối, thiết bị thật/camera/bàn phím iPhone vẫn chưa chạy.
Bước nhỏ tiếp: owner xem compact/nhóm DATE ở4180 và Admin4175; tiếp token Admin
trên nguồn đã pin, không tự mở module hoặc rollout/Pages.

