# Công việc kế tiếp

Cập nhật09/11/2026. [CURRENT_STATE](CURRENT_STATE.md). FRESH01 và ADMIN03 CLOSED;
owner chấp nhận ADMIN03 qua chat, giữ kiểm tổ hợp rộng ở vòng cuối.
[Quyết định](delivery/admin03-store-membership/acceptance-2026-11-09.md).

## KPHON01 — nền session và effective store context

Nhánh `store-app/kphon01-effective-context`, từ checkpoint ADMIN03 accepted
`b6bd19a`, không merge các nhánh BE cũ hoặc main. [Plan](delivery/kphon01-effective-context/plan.json).
Bước hiện tại: GET /api/v1/kph/stores + Fresh login/chọn store, kiểm scope thật,
không mock fallback. [Contract](product/STORE_KPH_CONTEXT_CONTRACT.md).

Slice kế tiếp: nối lookup barcode và history KPH trên context này, giữ D01
filter/sort/count trước pagination và page-local selection/reset. Sau đó nối
create/private media/idempotency, review/export rồi kiểm tổ hợp trọn KPH. Giữ
quyết định accepted, không đổi load-more semantics hoặc ngày/rule ngầm.

DATE/report/notification chưa có backend trong entry này phải hiện rõ chưa
kết nối, không render mock operational data. C02 supplier/lookup publish và
rollout vẫn outcome riêng. Kiểm authorization/integrity có mục tiêu ở mỗi slice;
không thay kiểm tổ hợp cuối bằng việc ký nhận các tổ hợp con.

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
