# Trạng thái hiện tại

Ngày rà soát: 12/11/2026. Mốc đối chiếu trước khi chuẩn hóa tài liệu là `04f7c4a`.

## Candidate UI tích hợp riêng — 12/11/2026

Admin/Store desktop header xanh Fresh, bỏ line header/sidebar và logo chính
thức đã gộp với checkpoint KPHON02 `4bcbb48` trên
`store-app/ui08-green-header-integration`. Fullverify384tests và read-only
backend UI smoke đạt; owner đổi ý yêu cầu tích hợp luôn vào KPHON03 sau checkpoint của writer.
[Evidence và cách ghép vào KPHON03](delivery/admin02-fresh-dashboard/integration-r11.md).
Chưa merge main, không thay active KPHON03 hoặc final acceptance.

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
| Store Fresh | UI mock đã tích hợp; KPHON01 session/chọn store tạm đạt; KPHON02 lookup/history candidate | Nối create/review/export; nghiệm thu lookup/history và tổ hợp cuối |
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

**KPHON01 — effective context** được owner ghi nhận tạm đạt ngày09/11/2026,
đóng slice trong phạm vi context trên nhánh
`store-app/kphon01-effective-context`, base accepted ADMIN03 `b6bd19a`.
Thêm GET `/api/v1/kph/stores`, fixture/client và Fresh online entry
`VITE_STORE_APP_MOCK=false VITE_STORE_APP_ONLINE=true`. Session và GET /stores
cũ vẫn membership-only; không tạo quyền giả cho quản lý vùng/chuỗi. Login,
explicit store selection, downgrade/revoke, expiry và offline dùng backend thật.
Các màn nghiệp vụ chưa nối hiện trạng thái rõ, không fallback mock.
Targeted checks đạt20 backend tests (discovery/policy/catalog/architecture),22
frontend tests (9 context/client mới,9 online cũ,4 API), builds Fresh online/mock
và real-backend Playwright390×844/1440×1024. Không phải full regression mới hoặc
kiểm tổ hợp cuối. [Owner acceptance có giới hạn](delivery/kphon01-effective-context/acceptance-2026-11-09.md):
giữ một vòng test kỹ/tổ hợp, rồi một vòng UI/UX cho sau; hai vòng này chưa chạy.
Đây chưa phải nghiệm thu cuối toàn KPH/app; ADR0007 vẫn Proposed.
[Contract context](product/STORE_KPH_CONTEXT_CONTRACT.md),
[kế hoạch](delivery/kphon01-effective-context/plan.json).

**KPHON02 — lookup/history** trên nhánh `store-app/kphon02-lookup-history`,
base KPHON01 close `0c37581`. Nối lookup barcode FOUND/NOT_FOUND, nhập tay trống
chưa lưu, và history/chi tiết read-only theo D01 (page25, filter/sort/count
server, reset detail/group khi đổi tham số). Giữ barcode snapshot và private
stamped photos. Context revalidate che/khóa DOM và portal, giữ draft/scroll;
401/403 về boundary, đổi actor/mất scope đóng dữ liệu cũ.
[Evidence và giới hạn](delivery/kphon02-lookup-history/evidence.md),
[handoff](delivery/kphon02-lookup-history/handoff.md). Technical và owner acceptance
là hai gate riêng; owner chưa nghiệm thu KPHON02. Hai vòng cuối vẫn pending.

Runtime thử12/11: Store4173 source KPHON02, backend8082 dùng jar KPHON01
(backend source không đổi). Runtime cũ đã tắt; container ADMIN03 không còn,
nên tạo container `coopfood-kph-kphon02-acceptance` riêng ở55434, nạp fixture
synthetic có guard, không truncate hoặc reseed database khác. Media private
ở worktree KPHON02. Admin4175 chưa khôi phục trong lượt này. Không merge main,
push, deploy hoặc chạm Pages/tag. Bước sau là create/private media/idempotency.

Toàn bộ checkpoint cũ được giữ tại
[lịch sử trạng thái đến 27/10](https://github.com/VuPhm/coopfood-kph/blob/04f7c4a4d9001901c3973e7e6bbf5a2118932ee7/docs/CURRENT_STATE.md).
Các pending cũ không mở lại acceptance đã được thay bằng quyết định mới hơn.

Xem [lộ trình và bước tiếp theo](NEXT.md).
