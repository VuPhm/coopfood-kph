# Công việc kế tiếp

Cập nhật 07/11/2026. Baseline: [CURRENT_STATE](CURRENT_STATE.md).
FRESH01 đã CLOSED; không có milestone implementation mới đang active.
Thứ tự dưới đây là đề xuất ưu tiên đã được ghi nhận trong lần chuẩn hóa tài liệu,
không phải nghiệm thu contract mới hoặc lệnh bắt đầu toàn bộ roadmap.

## Bước nhỏ kế tiếp: chuẩn bị UI mới + KPH online

Chốt [scope và gate](product/STORE_KPH_ONLINE_NEXT_SCOPE.md) trước khi mở cycle:

1. Effective-store/capability discovery cho employee, store manager, region
   manager và chain admin; backend quyết định quyền, không suy từ membership-only.
2. Giữ D01 page-local selection/reset/count/busy semantics cho online. Mock
   “Hiển thị thêm 25, giữ lựa chọn” không tự trở thành contract online.
3. Chọn luồng kiểm chứng đầy đủ: đăng nhập → chọn store → lookup → tạo KPH
   với ảnh → history → duyệt/xuất. Dùng backend thật và fixture tổng hợp.

Khi bắt đầu milestone, dùng delivery-cycle và DELIVERY_WORKFLOW; tạo task
worktree từ main, ghi base SHA/allowed paths/owner/gates. Một owner cho OpenAPI,
examples/generated client, migration và shared config. Chưa tạo plan triển khai
hoặc dispatch team trong task chuẩn hóa tài liệu này.

## Thứ tự phụ thuộc đề xuất

| Thứ tự | Outcome | Điều kiện/gate chính |
| --- | --- | --- |
| 1 | Contract scope và KPH online trên UI mới | Effective context, D01, cross-store/cross-region, real-backend E2E và owner acceptance |
| 2 | DATE bền vững | Contract tạo/sửa lô, quantity/unit, ownership/audit, nhắc và transaction DATE→KPH |
| 3 | Thông báo và Báo cáo trên dữ liệu DATE | Nguồn dữ liệu bền vững; chốt unread/nhắc, snapshot/kỳ/quyền/retention; push chỉ khi có requirement |
| Trước rollout | A01 thiết bị thật, O01 backup/restore, O02 deployment profile | Camera/keyboard/interruption, restore thực, media storage/retention và host verification |

C02 catalog là dependency riêng: chốt primary supplier và lookup current trước
publish. Nếu rollout cần catalog vận hành được publish qua Admin, phải khép C02
trước rollout. Không dùng dữ liệu staging làm published lookup.
Provisioning/reset/bootstrap/recovery còn lại mở bằng outcome riêng khi cần.

## Giới hạn

Không đổi business rule/API ngầm, không mang authority IndexedDB Pilot sang
online; không triển khai module tương lai, redesign rộng hoặc cutover Pages
trong slice KPH. Pages cutover phải có quyết định explicit và đường quay lại.
Technical PASS và owner acceptance là hai gate riêng.

[Lịch sử NEXT đến 27/10](NEXT_HISTORY_2026-10-27.md) giữ nguyên provenance;
những mục “kế tiếp”, “pending”, quyền push và preview ở đó không phải kế hoạch active.
