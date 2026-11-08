# Công việc kế tiếp

Cập nhật 09/11/2026. Baseline: [CURRENT_STATE](CURRENT_STATE.md).
FRESH01 đã CLOSED; không có milestone implementation mới đang active.
Thứ tự dưới đây là đề xuất ưu tiên đã được ghi nhận trong lần chuẩn hóa tài liệu,
không phải nghiệm thu contract mới hoặc lệnh bắt đầu toàn bộ roadmap.

## Mốc Admin Web: cấp và thu hồi quyền cửa hàng

Đề xuất ưu tiên duyệt giao diện quản trị riêng. Bước nhỏ đầu tiên là owner mở
[Admin Web hiện có](CURRENT_STATE.md#admin-web-phần-quản-lý-đã-có) với tài khoản
mẫu theo vai trò, xác nhận tìm được các màn phù hợp và vị trí để quản lý quyền
cửa hàng. Sau đó chốt màn và API cho một luồng: chọn người dùng hiện có → chọn
cửa hàng → gán vai trò EMPLOYEE hoặc STORE_MANAGER → thu hồi có lý do.

**Điều kiện kỹ thuật.** Theo [P01](product/PROVISIONING_POLICY.md) và
[ADR-0004](adr/0004-scoped-management-hierarchy.md), quản trị chuỗi thao tác
toàn chuỗi, quản lý vùng chỉ trong vùng đang được giao. Kiểm từ backend việc
từ chối ID đúng nhưng sai vùng/cửa hàng, bảo vệ quản lý cửa hàng cuối cùng và
ghi audit khi thay đổi quyền. API, examples và client sinh từ OpenAPI đi cùng
một lần thay đổi.

**Điều kiện nghiệm thu.** Dùng hai phiên và dữ liệu mẫu: một phiên Admin gán
rồi thu hồi membership, phiên Store của người dùng thử truy cập KPH sau mỗi
thay đổi. Với người dùng chỉ có membership đó, request kế tiếp phải được phép
sau khi gán và bị từ chối sau khi thu hồi. Nếu người dùng còn quyền vùng/chuỗi
hợp lệ thì quyền kế thừa vẫn có hiệu lực. Ghi riêng kết quả backend/Playwright
với quyết định của owner về giao diện và luồng quản lý.

## Thứ tự phụ thuộc đề xuất

| Thứ tự | Outcome | Điều kiện/gate chính |
| --- | --- | --- |
| 1 | Admin Web theo vai trò và luồng cấp/thu hồi quyền cửa hàng | Nghiệm thu màn riêng và luồng hai phiên nêu trên |
| 2 | [KPH online trên UI Fresh](product/STORE_KPH_ONLINE_NEXT_SCOPE.md) | Effective context, D01, cross-store/cross-region, real-backend E2E và owner acceptance |
| 3 | DATE bền vững | Contract tạo/sửa lô, quantity/unit, ownership/audit, nhắc và transaction DATE→KPH |
| 4 | Thông báo và Báo cáo trên dữ liệu DATE | Nguồn dữ liệu bền vững; chốt unread/nhắc, snapshot/kỳ/quyền/retention; push chỉ khi có requirement |
| Trước rollout | A01 thiết bị thật, O01 backup/restore, O02 deployment profile | Camera/keyboard/interruption, restore thực, media storage/retention và host verification |

Thứ tự Admin trước Store là ưu tiên nghiệm thu. Có thể kiểm quyền KPH bằng backend hiện có; giao diện Fresh không phải điều kiện để kiểm luồng Admin.

C02 catalog là dependency riêng: chốt primary supplier và lookup current trước
publish. Nếu rollout cần catalog vận hành được publish qua Admin, phải khép C02
trước rollout. Không dùng dữ liệu staging làm published lookup.
Provisioning/reset/bootstrap/recovery còn lại mở bằng outcome riêng khi cần.

## Giới hạn

Không đổi business rule/API ngầm, không mang authority IndexedDB Pilot sang
online; không triển khai module tương lai, redesign rộng hoặc cutover Pages
trong slice KPH. Pages cutover phải có quyết định explicit và đường quay lại.
Technical PASS và owner acceptance là hai gate riêng.

[Lịch sử NEXT đến 27/10](https://github.com/VuPhm/coopfood-kph/blob/04f7c4a4d9001901c3973e7e6bbf5a2118932ee7/docs/NEXT.md) giữ nguyên provenance;
những mục “kế tiếp”, “pending”, quyền push và preview ở đó không phải kế hoạch active.
