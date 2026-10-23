# Thông báo cửa hàng — nhóm DATE, 23/10/2026

Theo owner: bỏ phần Đã xử lý của DATE vì đã là KPH; triển khai Thông báo theo
nhóm, đầu tiên cho cảnh báo DATE và để thêm nguồn thông báo khác ở lượt sau.
UI prototype Store Fresh; authority ngày theo [DATE](DATE_MILESTONE_MODEL.md).

## Nhóm và nguồn

Trang dùng page kit/header hiện có, một vùng các nhóm module. Module đầu là
**DATE**, đếm lô cần chú ý. Bên trong có các nhóm đang có dữ liệu, theo thứ tự:

| Nhóm | Điều kiện |
| --- | --- |
| Hết HSD | Phase EXPIRED |
| Đến hạn lùi | Phase DANGER |
| Cảnh báo | Phase WARNING |
| Cần kiểm tra ngày | Phase MISSING hoặc INVALID |
| Đến lịch báo lại | Có remindOn ≤ ngày nghiệp vụ, kể cả phase còn an toàn |

Mỗi lô một thông báo hiện tại. Lô đến lịch ưu tiên vào nhóm báo lại, vẫn hiển
thị nhãn phase thật; không lặp ở nhóm phase. Resolved luôn bị loại. Đã ghi nhận
chưa tới lịch (hoặc fixture cũ chưa có lịch) chưa xuất hiện. Không tạo thông báo
cho SAFE/BEFORE_NSX trừ khi có lịch nhắc đến hạn. Nhóm ngày dùng cùng phép tính
Tra hạn; không suy phase từ % làm tròn. Không có unread/timestamp sự kiện giả.

Nhóm thu/mở native details/summary, mở mặc định; giữ keyboard/focus, count và
chữ/icon cùng màu semantic. Item trắng, tên/SKU/lô và nhãn, % nếu đủ dữ liệu.
Thiếu NSX/ngày lỗi không suy %. Thứ tự trong nhóm theo HSD hoặc ngày báo lại,
tie theo ID. Mỗi item một button; mở DATE với query/selection chính xác của lô,
mobile sheet/desktop detail. Query target chỉ dùng cho lần mở này, không bám
sang lần điều hướng DATE bình thường tiếp theo.

Ghi nhận chọn1/7ngày: xác nhận mới ẩn thông báo đến ngày hẹn. Hủy giữ thông báo.
Gửi KPH thành công: phiếu PENDING ở KPH, lô rời DATE/Thông báo; lỗi/hủy giữ lô.
Đổi ngày qua midnight/resume dùng đồng hồ calendar hiện có. Empty chỉ khi không
còn nhóm cần chú ý; loading có trạng thái tải riêng, không lóe empty giả.

## Thêm nhóm sau và ranh giới

Container module có thể thêm section ngang cấp DATE khi có yêu cầu/nguồn dữ
liệu thật. Chưa có nhóm KPH/tồn kho/vận hành giả, generic notification platform,
API/schema/outbox/scheduler/Redis hoặc queue. Chưa có push khi app đóng, unread/
retention/audit hay bền vững qua reload. State tiếp tục memory-only, backend scope
và authorization giữ nguyên. Báo cáo DATE dùng dữ liệu nguồn/snapshot hiện có,
không xóa resolved khỏi nguồn khi thu danh sách tác nghiệp.

Source: [model](../../apps/store-pwa/src/store-notifications-model.ts),
[view](../../apps/store-pwa/src/store-notifications.tsx),
[tests](../../apps/store-pwa/src/store-notifications-model.test.ts),
[browser gate](../../e2e/scripts/check-store-notifications.cjs).
Candidate chờ owner xem; [bàn giao](../delivery/date03-notifications.md).
