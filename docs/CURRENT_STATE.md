# Trạng thái hiện tại

Ngày rà soát: 13/11/2026. Mốc đối chiếu trước khi chuẩn hóa tài liệu là `04f7c4a`.

## Store và Admin đăng nhập — 13/11/2026

Hai entry dùng chung `SignIn` trong packages/ui, logo chính thức và token Fresh mobile.
Màn hình chỉ hiện tiêu đề theo ứng dụng, thông tin đăng nhập, nút gửi và phản hồi theo trạng thái.
Store mẫu có thêm lối vào dùng thử. Kiểm bằng `node e2e/scripts/check-fresh-sign-in.cjs`
trên Store4173 và Admin4175 ở 390×844 và 1440×1024.

## Sửa SW/trang cũ — 13/11/2026

Owner báo UI cả Store/Admin bị sai và hao hụt; sau clarification yêu cầu
“fix lỗi bị neo sw hoặc trang cũ trước”. Chưa coi UI được nghiệm thu hoặc
quy kết toàn bộ lỗi layout cho cache. Tạm chưa sửa bố cục, chưa mở review/export.
Đã phục hồi đúng preview4173/4175 và backend8082/DB synthetic cũ, không seed/reset.
Cache repair áp dụng riêng Vite dev/preview: retirement worker cho root/custom
script URL, no-store HTML, cleanup registration trên HTML mới và tránh Store
preview đăng ký lại worker. Không xóa browser storage/cache/cookie hoặc đổi SW
production/Pilot. [Evidence cache repair](delivery/kphon03-create-media/cache-repair-r3.md).
Sau reload để lấy đúng trang hiện hành mới tiếp đối chiếu UI thiếu/sai.

## UI green chrome đã ghép vào KPHON03 — 12/11/2026

Theo owner đổi ý “tích hợp luôn KPHON03”, đã merge --no-ff nhánh
`store-app/ui08-green-header-integration` vào KPHON03 tại `59fbcb8`.
Source thực tế `f005586` (sau `e8a2df7` chỉ thêm tài liệu pin checkpoint).
Header desktop xanh Fresh, sidebar trắng/official light logo, dark logo trên
xanh, bỏ decorative lines; giữ Admin memberships và focus ngoại lệ online.
Create/session/idempotency/media và backend/API không đổi so với `55f398e`.
[Kiểm bản kết hợp](delivery/kphon03-create-media/integration-r2.md).
Technical integration, owner UI và nghiệm thu tổ hợp cuối là các gate riêng.
Không merge main, push/deploy hoặc tự mở milestone tiếp.

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
| Store Fresh | UI mock đã tích hợp; KPHON01 session/chọn store tạm đạt; KPHON02 lookup/history tạm đạt; KPHON03 create candidate | Nối review/export; nghiệm thu create và tổ hợp cuối |
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
là hai gate riêng. Owner cho tiếp ngày12/11 với các điểm tối ưu giao diện
để sau: [quyết định có giới hạn](delivery/kphon02-lookup-history/acceptance-2026-11-12.md).
KPHON02 CLOSED provisional-scoped; hai vòng cuối vẫn pending.

**KPHON03 — create/private media/idempotency** trên nhánh
`store-app/kphon03-create-media`, base KPHON02 close `4bcbb48`.
Tái sử dụng form/control Fresh: actor/ngày read-only, lookup thật,1–3 ảnh,
xem lại trước khi gửi. Gửi originals qua API hiện hành; backend giữ original
private và sinh stamped JPEG theo contract, không nhập paired-upload từ BE06 cũ.
Context hợp lệ revalidate vẫn giữ draft/ảnh; submit gắn với phiên đang soạn,
chặn đóng/gửi lặp lúc đang gửi; mất response retry cùng key chỉ có một phiếu.
Thành công refresh history D01;401/403 xác minh scope, không success giả.
[Evidence](delivery/kphon03-create-media/evidence.md),
[hướng dẫn thử và UI debt](delivery/kphon03-create-media/handoff.md).
KPHON03 chờ owner; chưa phải nghiệm thu cuối KPH/app.

Runtime thử12/11: Store4173 source KPHON03; backend8082 vẫn jar KPHON01
(backend/API source không đổi), container synthetic KPHON02 ở55434 và media
private trong worktree KPHON02 được tái sử dụng, không seed/reset.
Admin4175 đã chuyển sang cùng worktree KPHON03 sau khi task UI tự dừng process cũ. Không merge main/push/deploy hoặc chạm Pages/tag.
Bước sau là review/export đúng scope, sau đó hai vòng cuối đã hẹn.

Toàn bộ checkpoint cũ được giữ tại
[lịch sử trạng thái đến 27/10](https://github.com/VuPhm/coopfood-kph/blob/04f7c4a4d9001901c3973e7e6bbf5a2118932ee7/docs/CURRENT_STATE.md).
Các pending cũ không mở lại acceptance đã được thay bằng quyết định mới hơn.

Xem [lộ trình và bước tiếp theo](NEXT.md).
