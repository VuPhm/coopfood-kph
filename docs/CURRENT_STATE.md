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
ADMIN03 đã CLOSED theo owner ngày09/11/2026 (chấp nhận dựa trên evidence,
kiểm tổ hợp rộng giữ ở vòng cuối); chưa tích hợp main. Tạo người dùng, tạo
cửa hàng và cấp quyền vùng là các nhu cầu riêng trong [policy P01](product/PROVISIONING_POLICY.md).

## Ranh giới implementation

| Vùng | Đã có | Còn thiếu trước vận hành online bằng UI mới |
| --- | --- | --- |
| Store Fresh | UI mock đã tích hợp; KPHON01 candidate thêm Fresh online session/chọn store | Nối lookup/history/create/review/export trên context thật |
| KPH online | Backend, authorization, private media, duyệt/xuất và history D01 qua entry hiện có | Đưa luồng này vào UI mới; giữ hoặc chốt thay đổi contract explicit |
| Store/capability | Backend kiểm quyền store/region/chain; KPHON01 thêm GET /api/v1/kph/stores dùng cùng policy | Consumer KPH và owner acceptance/tổ hợp cuối |
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

ADMIN03 CLOSED theo [quyết định owner](delivery/admin03-store-membership/acceptance-2026-11-09.md)
ngày09/11/2026. Candidate `0bd2c47`: frontend358 tests/build/PWA, backend80 tests
và real-backend Playwright hai phiên đạt. Owner yêu cầu tiếp roadmap và giữ kiểm
tổ hợp toàn cục ở vòng cuối; không coi tổ hợp cuối đã chạy hoặc rollout đã duyệt.

**KPHON01 — effective context** đang là candidate trên nhánh
`store-app/kphon01-effective-context`, base accepted ADMIN03 `b6bd19a`.
Thêm GET `/api/v1/kph/stores`, fixture/client và Fresh online entry
`VITE_STORE_APP_MOCK=false VITE_STORE_APP_ONLINE=true`. Session và GET /stores
cũ vẫn membership-only; không tạo quyền giả cho quản lý vùng/chuỗi. Login,
explicit store selection, downgrade/revoke, expiry và offline dùng backend thật.
Các màn nghiệp vụ chưa nối hiện trạng thái rõ, không fallback mock.
Targeted checks đạt20 backend tests (discovery/policy/catalog/architecture),22
frontend tests (9 context/client mới,9 online cũ,4 API), builds Fresh online/mock
và real-backend Playwright390×844/1440×1024. Không phải full regression mới hoặc
kiểm tổ hợp cuối; owner context candidate còn pending.
[Contract context](product/STORE_KPH_CONTEXT_CONTRACT.md),
[kế hoạch](delivery/kphon01-effective-context/plan.json).

Runtime thử: Admin4175 giữ source ADMIN03; Store4173 chuyển sang Fresh context
KPHON01; backend8082 nâng lên KPHON01, cùng DB thử55434/media đã có, không reseed.
P03 cũ8081/55433 giữ nguyên. Không merge main, push, deploy hoặc chạm Pages/tag.
UI KPH lookup/history/create/review/export vẫn là slice kế; D01 giữ nguyên.

Toàn bộ checkpoint cũ được giữ tại
[lịch sử trạng thái đến 27/10](https://github.com/VuPhm/coopfood-kph/blob/04f7c4a4d9001901c3973e7e6bbf5a2118932ee7/docs/CURRENT_STATE.md).
Các pending cũ không mở lại acceptance đã được thay bằng quyết định mới hơn.

Xem [lộ trình và bước tiếp theo](NEXT.md).
