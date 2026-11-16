# Công việc kế tiếp

Cập nhật17/11/2026. [CURRENT_STATE](CURRENT_STATE.md). QA01 được owner đồng ý
merge và dọn; giữ checkpoint KPHON04 cùng chiến lược test mới làm nền tiếp tục.
Không có feature implementation mới tự khởi chạy trong lần tích hợp này.

## Bước nhỏ kế tiếp: owner xem candidate UI/UX cuối

Owner đã chốt17/11: “Đạt KPHON03–04, tiếp vòng kỹ thuật tổ hợp”. Vòng kỹ thuật
tổ hợp đã PASS; [evidence/candidate KPHQA01](delivery/kphqa01-final-acceptance.md).
Owner phản hồi tiếp17/11: trắng toàn màn khi xác minh, logo cũ/nhãn Store–Admin
và phân trang cắt ngày/chọn theo trang gây phiền. Candidate revision2 đã xử lý:
giữ chrome công khai và che riêng private khi xác minh; wordmark official không
gắn nhãn Store–Admin; nối thêm giữ chọn và checkbox ngày chọn đủ ngày explicit.
[Contract D01 đã cập nhật theo yêu cầu](product/HISTORY_PAGING_CONTRACT.md).

Store candidate <http://127.0.0.1:4181/#kph>, online cùng backend8082/DB tổng hợp;
Admin candidate <http://127.0.0.1:4182/>. Main4176/Admin4175 giữ bản vừa được
nghiệm thu, chưa có patch UX. Agent phải probe lại URL/mode/source khi bàn giao,
không dùng mock. Owner xem đổi Home↔KPH/đổi focus, wordmark mobile/sidebar, rồi
Chọn → checkbox một ngày → Hiển thị thêm: lựa chọn giữ và số phiếu chưa tải rõ.
Không cần lặp security matrix hoặc Excel.
Gate iPhone **pending theo owner**: chưa có URL HTTPS/runtime hoặc thiết bị đã
kết nối. Khi có, thử camera/quyền OS, bàn phím/safe area và chuyển ứng dụng rồi
quay lại form. Không coi Chromium mobile là thiết bị thật; không tự mở tunnel/
deploy để thay gate này. Chưa merge candidate main hoặc triển khai.

## Hai vòng đã hẹn trước nghiệm thu cuối

Sau khi chốt feedback KPH đã nối, giữ thứ tự:

1. **Technical PASS17/11**, một vòng trên source cuối: luồng Admin/session/scope →
   lookup/history → create/media/retry → review/export; real backend và fixture
   tổng hợp. Chọn gate theo diff/evidence còn thiếu, không chạy lại mọi script
   visual lịch sử hoặc mọi tổ hợp viewport cho cùng một kiểm HTTP.
2. **Agent kiểm scoped PASS, owner/device pending**, một vòng UI/UX cuối:
   owner quyết định bố cục/nhịp thao tác, camera, quyền OS,
   keyboard/safe area/gián đoạn trên iPhone thật. Agent sửa blocker xác định và
   chỉ kiểm lại phần ảnh hưởng.

Không mở thêm vòng audit/polish khi chưa có blocker cụ thể.
Áp dụng [TEST_STRATEGY](TEST_STRATEGY.md): mỗi kiểm tiếp theo
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
