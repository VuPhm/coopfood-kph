# KPHON03 — hướng dẫn thử

Cập nhật13/11/2026: owner báo UI sai/hao hụt ở cả Store/Admin và ưu tiên
SW/trang cũ trước. [Cache repair](cache-repair-r3.md). Reload thường Store4173
và Admin4175 để worker cũ được thay. Không cần Clear site data/xóa IndexedDB.
Bố cục chưa sửa trong lượt cache; owner UI rejection vẫn mở.

Ngày12/11/2026, cập nhật revision2 sau owner yêu cầu ghép UI green chrome.
[Evidence bản kết hợp](integration-r2.md). Admin từ cùng worktree ở4175; Store4173.
Technical evidence riêng với owner acceptance; chưa có owner
sign-off cho create mới. [Evidence](evidence.md). Không tự mở slice review.

Preview http://127.0.0.1:4173, source worktree KPHON03. Nếu preview dừng:
`node e2e/scripts/start-kphon03-store.mjs`. Backend8082, DB synthetic55434/media
KPHON02 giữ nguyên. Tài khoản `region.admin03` / `admin-e2e-password` (synthetic).

1. Chọn001 → Phiếu KPH → Tạo TPTS. Ngày/người phát hiện lấy context thật,
   read-only. Mã `0000000000000` cho NOT_FOUND, điền tên/NCC thủ công.
2. Chọn1–3 ảnh JPEG/PNG theo thứ tự, đổi focus ra/vào cửa sổ: form và ảnh còn
   sau xác minh hợp lệ. Scope lỗi hoặc bị thu hồi đóng dữ liệu cũ.
3. Xem lại chưa lưu. Chỉnh sửa giữ nội dung/ảnh. Gửi phiếu mới tạo thật; trong
   lúc gửi không đóng form hoặc gửi thêm request. Khi lỗi có thể retry;
   cùng payload giữ key để không tạo trùng khi response mất sau commit.
4. Thành công về history D01 đúng loại/trang1, không nối trang. Mở phiếu thấy
   catalog snapshot/barcode và ảnh stamped riêng tư theo thứ tự.
5. Chuyển TPCN → tạo với barcode `0890123456789`: lookup SKU000042/NCC000007.
   Backend quyết catalog/store/actor snapshot; frontend không là authority.

Revision2 thêm official logos/green header/sidebar tokens và Admin shell từ
source UI, giữ memberships/Admin API proxy/cache và focus ngoại lệ online.
Các file create/session/idempotency/media ở dưới không đổi qua merge.

Files chính: `store-session-api.ts`, `store-online-app.tsx`, `store-online-kph.tsx`,
`store-kph-create-control.tsx`, `create-record-dialog.tsx`, `online-kph.ts`, CSS
masking tương ứng; unit tests, launcher/Playwright checker; CURRENT/NEXT/context docs.
Không đổi backend/API/migration/dependency/lockfile.

## UI debt và giới hạn

Owner đã nói còn vài điểm tối ưu, đặc biệt giao diện, nhưng cho tiếp. Không có
frame Figma mới được giao; giữ form Fresh; revision2 chỉ ghép phần green chrome/official logos đã bàn giao. Mang feedback
này vào đúng vòng UI/UX sau. Quan sát screenshot retry: thông báo lỗi/điểm neo
cuộn dưới sticky header và copy mạng “Failed to fetch” cần refinement trong
vòng đó. Không coi đây là final visual acceptance.

Chưa kiểm camera/OS/keyboard trên thiết bị thật. Browser dùng ảnh PNG tổng hợp,
backend tests có EXIF/timestamp/stamp/rollback. Chưa nối review/export, chưa chạy
một vòng test kỹ/tổ hợp toàn luồng hoặc vòng UI/UX cuối; không merge/push/deploy.
Bước nhỏ kế tiếp: review theo scope, rồi export eligibility/audit.
