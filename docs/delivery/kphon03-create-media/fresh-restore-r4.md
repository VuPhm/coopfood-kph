# Fresh restore — revision 4, 14/11/2026

Owner yêu cầu tiếp phiên bị ngắt, tìm đúng Fresh sau compact/polish, đồng bộ
sidebar Store/Admin, bỏ nền trượt desktop và giữ mobile; cho chỉnh nhẹ token
và dùng Terra nhỏ. Đây là sửa candidate KPHON03, chưa phải vòng UI/UX cuối toàn app.

Candidate đã kiểm: `e3a49b2f3ef217cd9b02e1ed815de86ca0707beb` trên `store-app/kphon03-create-media`.

## Nguồn và phạm vi

BE06 handoff chỉ đúng POLISH03 `c7cc939`, PUB01 `41febf6`; wiring online tham
khảo `a6872f2`. Không nhập cả nhánh BE06: API media vẫn nhận originals và backend
sinh stamped private. Giữ SignIn `1ea1937`, freshness repair `7908aca`/`8af2ad2`.

Khôi phục Home, tài khoản, Tra hạn, scanner, create CTA, history nhóm ngày,
lọc/sắp xếp và chi tiết/ảnh của Fresh. Online giữ server D01 count/filter/sort,
page25, scope revalidation và idempotency. DATE/report/notification persistence
vẫn chưa nối; Home tra mã chỉ lookup. Tra hạn là phép tính thuần đã có.
Admin form không unmount khi lần kiểm tra phiên nền lỗi mạng; mật khẩu ở state,
hard reload xóa, không thêm lưu trữ password.

## Target UI/UX của vòng này

- Có đủ composition Fresh ở Home/KPH/tài khoản/tra hạn, không danh sách quyền
  kỹ thuật trần trên Home; quyền xem được trong tài khoản theo store thật.
- Hai sidebar desktop có cùng geometry/token, cùng breakpoint900; Admin vẫn
  thu gọn thủ công. Hero desktop cuộn cùng trang, mobile giữ sticky.
- Điều khiển nhập16px và vùng chạm chính44px trở lên; focus không mất sau đóng
  dialog; không tràn ngang trang. Nhãn KPH chuẩn đọc đủ; tag strip cuộn riêng,
  OTHER giữ accessible text và chi tiết theo contract đã duyệt.
- Login giữ draft khi đổi tab/kiểm phiên lỗi mạng; refresh thật xóa draft.
- Không đổi business/API/quyền hoặc đưa dữ liệu mock vào history online.

## Kiểm có mục tiêu

Runtime: worktree `.local/worktrees/kphon03-create-media`, Store4173,
Admin4175, backend8082, PostgreSQL synthetic hiện có; không reset/seed.
KPH tests thêm phiếu synthetic và thu hồi quyền employee trong scenario.

- `npm run check -w @coopfood-kph/store-pwa`: PASS.
- Store unit: online-app/online-create/online-kph/create-record-dialog/
  store-create-review/store-login/store-shelf-life: 72/72 PASS trước refinement
  cuối quyền Home và tag strip; các file đổi sau được kiểm lại riêng.
- Final `VITEST_MAX_WORKERS=1 npm run test -w @coopfood-kph/store-pwa`: toàn
  bộ46 files/326 tests PASS. Lượt parallel ban đầu19 lỗi: selector login/CTA/
  footer cũ được cập nhật, giữ assertion identity/selection/print; các timeout
  còn lại không tái hiện ở targeted và toàn suite một worker. Không tăng timeout
  hoặc sửa production để che lỗi.
- Admin unit27/27 và TypeScript: PASS.
- Build Store và Admin: PASS; Store vẫn có cảnh báo chunk ExcelJS lớn đã có.
- `node e2e/scripts/check-kphon02-lookup-history.cjs`: PASS390×844/1440×1024
  với metadata server thực (39 phiếu lúc kiểm); lookup FOUND/NOT_FOUND,
  D01 filtering/paging/detail/private photos.
- `node e2e/scripts/check-kphon03-create-media.cjs`: PASS390×844/1440×1024,
  originals hash/order, stamped private, anonymous401/cross-region403,
  dropped-response retry cùng key chỉ một phiếu; revoke-before-send403.
- `node e2e/scripts/check-admin-login-revalidation.cjs`: PASS390×844/1440×1024,
  chuyển tab, lỗi network ở GET session thứ hai, draft giữ; hard reload xóa.
  Headless dùng thêm visibilitychange explicit; không thay kiểm browser thật.
- `node e2e/scripts/fresh-restore-home.cjs`: PASS390×844/1440×1024 với
  session/backend thật: Home, account và Tra hạn30 ngày →24/01/2027; không
  tràn trang hoặc lỗi console. Quyền đúng store trong sheet tài khoản.
- Tag strip320/390: nhãn chuẩn đủ, OTHER146px ellipsis/title/detail đầy đủ;
  native keyboard scroll được kiểm với strip thu hẹp có chủ đích để có overflow.
- `node e2e/scripts/check-fresh-chrome-alignment.cjs`: PASS390/834/900/1440,
  sidebar geometry/token bằng nhau ở desktop, collapse/manual menu và scroll;
  forced-colors Store và reduced-motion. Admin dùng session fixture, không
  chứng minh API Admin trong bài chrome này.

Log/ảnh cục bộ: `.local/verification/fresh-restore/`, gồm kphon02/, kphon03/,
integrated-store-tests.log, final-store-serial.log, home-smoke.log,
admin-login-revalidation.log, chips-contract* và
{admin,store}-chrome-*.png. Dữ liệu/log synthetic không commit.

## Bàn giao và giới hạn

Technical checks và owner visual acceptance riêng. Preview để xem Home → KPH →
Lọc → chi tiết/ảnh → tạo/xem lại; tài khoản → Tra hạn; so sidebar desktop/mobile;
Admin nhập password → đổi tab → trở về. Chưa nghiệm thu owner cho revision4.
Chưa chạy hai vòng cuối toàn app hoặc kiểm camera/keyboard/safe area trên iPhone
thật. Bước nhỏ tiếp theo là owner xem candidate, rồi tiếp nhóm token Admin theo
NEXT; không tự mở review/export hay merge main/push/deploy/Pages.
