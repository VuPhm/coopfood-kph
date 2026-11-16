# Công việc kế tiếp

Cập nhật17/11/2026. [CURRENT_STATE](CURRENT_STATE.md). QA01 được owner đồng ý
merge và dọn; giữ checkpoint KPHON04 cùng chiến lược test mới làm nền tiếp tục.
Không có feature implementation mới tự khởi chạy trong lần tích hợp này.

## Bước nhỏ kế tiếp: chốt KPHON03–04 trên main

Agent xác minh hoặc khởi động một Fresh online + Admin từ main bằng runtime/DB
fixture tổng hợp, đưa URL/mode/source còn sống. Owner thử ngắn:

1. Xem mobile/desktop, tạo một phiếu có ảnh rồi mở lại.
2. Duyệt một phiếu, không duyệt một phiếu; chọn và xuất một phiếu hợp lệ.
3. Mở Excel tổng hợp trong Excel thực để xem độ dễ đọc/in và báo điểm gây khó dùng.

Agent giữ kiểm quyền, race/retry, persistence và cấu trúc/bytes workbook; không
bắt owner lặp security matrix. [Handoff KPHON04](delivery/kphon04-review-export/handoff.md)
là nguồn scenarios, URL trong đó là lịch sử phải xác minh lại.
Owner cho merge QA01 chưa tự trở thành nghiệm thu KPHON03–04 hoặc UI cuối.

## Hai vòng đã hẹn trước nghiệm thu cuối

Sau khi chốt feedback KPH đã nối, giữ thứ tự:

1. Một vòng kỹ thuật tổ hợp trên source cuối: luồng Admin/session/scope →
   lookup/history → create/media/retry → review/export; real backend và fixture
   tổng hợp. Chọn gate theo diff/evidence còn thiếu, không chạy lại mọi script
   visual lịch sử hoặc mọi tổ hợp viewport cho cùng một kiểm HTTP.
2. Một vòng UI/UX cuối: owner quyết định bố cục/nhịp thao tác, camera, quyền OS,
   keyboard/safe area/gián đoạn trên iPhone thật. Agent sửa blocker xác định và
   chỉ kiểm lại phần ảnh hưởng.

Cả hai còn pending. Áp dụng [TEST_STRATEGY](TEST_STRATEGY.md): mỗi kiểm tiếp theo
phải giảm thêm rủi ro đáng kể; giữ test bắt buộc, dừng khi evidence đủ. Không coi
root verify khi merge là thay thế cho hai vòng này hoặc sign-off thiết bị thật.

## Sau khi khép KPH

| Thứ tự | Outcome | Cần chốt trước implementation |
| --- | --- | --- |
| 1 | DATE bền vững | Contract lô, quantity/unit, ownership/audit, transaction DATE→KPH và nhắc bền vững |
| 2 | Thông báo/Báo cáo trên DATE thật | Unread/lịch nhắc, snapshot cuối kỳ, quyền/audit/retention; push chỉ khi có requirement |
| Riêng | C02 catalog publish | Primary supplier và lookup current; staging không phải nguồn published |
| Trước rollout | A01 thiết bị, O01 restore, O02 deployment profile | Camera/keyboard/interruption, restore thực, host/storage/retention; bootstrap/recovery nếu vận hành cần |

Các nhánh BE/DATE cũ là provenance, không tự merge thành feature đã chốt.
Store PWA không thêm quyền xóa/vô hiệu hóa. OpenAPI/examples/generated client đi
cùng slice khi API đổi; ADR0007 vẫn Proposed đến khi có quyết định thật.
Push/deploy/Pages cutover vẫn là việc riêng có yêu cầu explicit và đường quay lại.

Checkpoint NEXT trước tích hợp: `git show f2b1404:docs/NEXT.md`.
