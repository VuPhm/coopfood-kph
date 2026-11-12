# KPHON02 — bàn giao để thử

Ngày12/11/2026. Technical verification riêng với owner acceptance; chưa có
quyết định nghiệm thu của owner cho slice này. Chưa tự mở slice create.

Preview http://127.0.0.1:4173 — chạy `node e2e/scripts/start-kphon02-store.mjs`
trong worktree KPHON02 nếu preview dừng. Backend thật8082, DB synthetic riêng55434.
Tài khoản thử `region.admin03`, mật khẩu synthetic `admin-e2e-password`;
chỉ store001. `manager.admin03` có001/002 (002 trống).

1. Chọn001 → Tra mã hàng → barcode `0890123456789`: FOUND, SKU000042/NCC000007.
2. Barcode `0000000000000`: NOT_FOUND → Nhập tay: trường trống, chưa lưu.
   Nhập tên rồi đổi focus ra/vào cửa sổ: dữ liệu còn sau xác minh hợp lệ.
3. KPH:30 phiếu,25/trang. Trang sau có5; đổi lọc/sắp xếp về trang1,
   không nối trang. Lọc APPROVED ra0; lọc ngày đúng dd/mm/yyyy, chặn khoảng ngược.
4. Mở phiếu: barcode, catalog snapshot, người/ngày/tình trạng và stamped photo.
   Chỉ đọc; chưa có tạo, duyệt hoặc xuất. Đăng xuất/hết phiên không giữ dữ liệu cũ.
5. Đổi cửa hàng: phải chọn lại; store002 không mang dữ liệu001 theo.

Files chính: `store-online-app.*`, `store-session-api.ts`, `online-kph.ts`,
`store-barcode-lookup.*`, `store-online-kph.*`; guard focus trong header/hero;
Playwright launcher/check và guarded synthetic fixture; CURRENT/NEXT/context docs.
Không đổi API, migration hoặc dependency/lockfile.

Kiểm camera/keyboard/thiết bị thật chưa làm trong browser headless. Nhập tay chỉ
là draft lookup chưa lưu; create/private media/idempotency là bước nhỏ tiếp theo.
Một vòng test kỹ/tổ hợp rồi một vòng UI/UX còn pending trước nghiệm thu cuối.
Không merge main, push/deploy hoặc cutover Pages.
