# Trạng thái hiện tại

Ngày rà soát: 09/11/2026. Mốc đối chiếu trước khi chuẩn hóa tài liệu là `04f7c4a`.

## Baseline đã chấp nhận

- FRESH01 revision5 CLOSED ngày 27/10/2026: UI Fresh hiện hành đã tích hợp vào
  main, gồm Home/header, KPH, DATE, Báo cáo, Thông báo và refinement liên quan.
  Runtime source `ad85c66`; các commit sau chỉ đóng hồ sơ.
  [Integration/acceptance và evidence](delivery/fresh01-solid-compact/integration-2026-10-27.md).
- Foundation KPH online, P02 scoped authorization, P03 lifecycle, P04 user
  deactivation, P05 credential self-service, D01 history và C01 catalog staging
  đã có implementation/acceptance. Nguồn semantics là
  [contract index](product/STORE_APP_CONTRACTS.md) và ADR accepted.
- R2-01 shell spine đã được owner chấp nhận ngày 24/09/2026 tại `3799a30`;
  commit này là ancestor của main hiện tại. Visual refinement của mốc đó đã
  được deferred, không phải final design system.
  [Quyết định lịch sử](delivery/r2-01-shell-spine/acceptance-handoff.md).

## Admin Web: phần quản lý đã có

Admin Web là [ứng dụng riêng](../apps/admin-web/src/app.tsx), dùng chung backend với Store PWA.
Chạy `npm --workspace @coopfood-kph/admin-web run dev` rồi mở `http://localhost:5174`.
Cần backend ở cổng 8081 để đăng nhập. Các workspace hiển thị theo quyền của tài khoản.

| Màn | Người dùng thực hiện được gì | Bằng chứng nghiệm thu |
| --- | --- | --- |
| Ngừng hoạt động vùng/cửa hàng | Quản lý chuỗi đặt, đổi, hủy hoặc thực thi lịch đến hạn. Quản lý vùng thao tác trong phạm vi cửa hàng được giao. | [P03](delivery/p03-scheduled-lifecycle/acceptance-handoff.md) |
| Tài khoản người dùng | Quản trị chuỗi xem danh sách và vô hiệu hóa tài khoản có lý do. | [P04](delivery/p04-user-deactivation/acceptance-handoff.md) |
| Đổi mật khẩu | Người dùng đổi mật khẩu của mình và đăng nhập lại. | [P05](delivery/p05-credential-self-service/acceptance-handoff.md) |
| Kiểm tra catalog CSV | Người có quyền CATALOG_ADMIN nhập CSV, xem lỗi từng dòng và lịch sử kiểm tra. Dữ liệu ở staging. | [C01](delivery/c01-catalog-staging/acceptance-handoff.md) |

Các mốc trên nghiệm thu từng chức năng. FRESH01 nghiệm thu giao diện Store.
Màn gán/thu hồi quyền tại cửa hàng chưa có trong Admin Web. Tạo người dùng, tạo
cửa hàng và cấp quyền vùng là các nhu cầu riêng trong [policy P01](product/PROVISIONING_POLICY.md).

## Ranh giới implementation

| Vùng | Đã có | Còn thiếu trước vận hành online bằng UI mới |
| --- | --- | --- |
| Store Fresh | UI/interaction đã tích hợp; entry `VITE_STORE_APP_MOCK=true` | Nối session, scope và dữ liệu thật; không lấy mock làm authority |
| KPH online | Backend, authorization, private media, duyệt/xuất và history D01 qua entry hiện có | Đưa luồng này vào UI mới; giữ hoặc chốt thay đổi contract explicit |
| Store/capability | Backend kiểm quyền store/region/chain | Contract khám phá effective stores/capabilities cho quyền kế thừa |
| DATE/Thông báo | Lô, xử lý, nhắc 1/7 ngày trong phiên mock | Contract lô, persistence, audit, nhắc bền vững; chưa có backend/push |
| Báo cáo DATE | UI, template/history mock trên browser | Số lượng/đơn vị, snapshot cuối kỳ, quyền/audit/retention |
| Catalog | Lookup và staging C01 | Primary supplier/lookup current và publish C02 |
| Vận hành | Evidence kỹ thuật theo từng cycle | Thiết bị thật, backup/restore, hosting/storage và rollout |

Kiểm chứng code: [entry](../apps/store-pwa/src/main.tsx),
[state mẫu](../apps/store-pwa/src/store-app.tsx),
[entry KPH hiện có](../apps/store-pwa/src/app.tsx).
Dữ liệu DATE trong phiên reset khi reload; UI mới không chứng minh tính bền vững online.

## Evidence và giới hạn

Integration ngày 27/10 ghi nhận `VITEST_MAX_WORKERS=1 npm run verify` PASS
347 tests cùng contracts/API/types/build/PWA; browser 7 màn × 5 viewport và
workflow/Excel/PDF đạt. Đây là kết quả lịch sử trên source đã tích hợp, không
phải test mới ngày 07/11; không chứng minh backend thật hoặc thiết bị thật.

Không có cycle triển khai mới được mở trong lần chuẩn hóa này. Không mở thêm
vòng visual diện rộng. Push/deploy/Cloudflare/Pages là thao tác riêng; không
kế thừa quyền push một lần từ bản ghi lịch sử. Pages và tag bảo tồn giữ nguyên.

Toàn bộ checkpoint cũ được giữ tại
[lịch sử trạng thái đến 27/10](https://github.com/VuPhm/coopfood-kph/blob/04f7c4a4d9001901c3973e7e6bbf5a2118932ee7/docs/CURRENT_STATE.md).
Các pending cũ không mở lại acceptance đã được thay bằng quyết định mới hơn.

Xem [lộ trình và bước tiếp theo](NEXT.md).
