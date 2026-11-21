# CHAIN01 · Người duyệt phiếu và phạm vi theo dõi

Quyết định nghiệp vụ của owner ngày 21/11/2026 trên baseline `2d1536f`.
Phần duyệt phiếu của ADR-0004 được thay bằng quyết định này. KPHON03–04 và hai
candidate CHAIN01 ban đầu ghi lại hành vi trước thay đổi.

| Vai trò | Phạm vi | Công việc trong luồng |
| --- | --- | --- |
| Nhân viên (`EMPLOYEE`) | Cửa hàng có membership active | Gửi phiếu có ảnh và xem kết quả. |
| Cửa hàng trưởng (`STORE_MANAGER`) | Đúng cửa hàng có membership cửa hàng trưởng active | Mở phiếu, duyệt hoặc không duyệt. |
| Admin vùng (`REGION_MANAGER`) | Các cửa hàng đang hoạt động trong vùng đang hoạt động được phân công | Xem danh sách, tổng, chi tiết và kết quả duyệt của các cửa hàng trong vùng. |
| Admin chuỗi (`CHAIN_ADMIN`) | Các cửa hàng đang hoạt động trong toàn chuỗi | Xem danh sách, tổng, chi tiết và kết quả duyệt toàn chuỗi. |

**Quy tắc ghi.** Backend chỉ nhận quyết định từ người có membership cửa hàng
trưởng đang hoạt động tại chính cửa hàng của phiếu. Tài khoản kiêm nhiệm chỉ
duyệt được tại cửa hàng có membership đó. Vùng/chuỗi tự thân chỉ cấp phạm vi
giám sát. Kiểm lại ở mỗi request, giữ giao dịch cập nhật trạng thái, reviewer
và audit hiện có. Discovery trả REVIEW theo cùng điều kiện. EXPORT là quyền
độc lập, tiếp tục theo policy xuất hiện hành. Màn hình Store dựa trên capability
của cửa hàng đã chọn. Màn hình tổng hợp Admin chỉ đọc.

**Quy tắc đọc.** Backend áp phạm vi chuỗi hoặc các vùng được giao trước bộ lọc
cửa hàng/ngày/trạng thái, phép đếm và phân trang. Chi tiết, ảnh minh chứng
và bộ chọn cửa hàng đều phải tôn trọng phạm vi. Store membership riêng của một
admin vùng ngoài vùng đó không mở rộng màn hình tổng hợp Admin. Sau khi thu
hồi quyền, request kế tiếp dùng scope mới.

**Bàn giao cho Luna.** Luna API sửa quyền ghi/discovery và truy vấn tổng hợp
trên candidate `be1360c`, giữ OpenAPI, examples, client cùng slice. Luna Admin
sửa candidate `832e234` thành màn hình chỉ đọc cho hai cấp admin, bỏ action
duyệt. Luna Store kiểm capability trên đường vào thực tế và phối hợp kiểm luồng.
Điều phối giữ spec, lockfile và review candidate chung. DATE/SKU ở backlog.

**Nghiệm thu.** Với A, B thuộc hai vùng, nhân viên A gửi một phiếu có ảnh.
Cửa hàng trưởng A quyết định trên đúng ID. Nhân viên A tải lại thấy kết quả,
admin vùng A thấy kết quả trong phạm vi của mình, admin chuỗi thấy cả A và B.
Ở lớp HTTP kiểm hai cấp admin thuần, nhân viên và cửa hàng trưởng B bị từ chối
khi duyệt phiếu A, kiểm tài khoản kiêm nhiệm, thu hồi quyền ở request kế tiếp
và tổng/danh sách không lộ B sang vùng A. Chạy một lượt liên ứng dụng trên dữ
liệu tổng hợp, dùng evidence hiện có cho gửi lại/ảnh/xuất khi hành vi tương
ứng còn tương thích. Dừng sau khi đạt tiêu chí và xử lý lỗi ảnh hưởng luồng.
