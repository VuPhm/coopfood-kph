# Trạng thái hiện tại

Chuẩn hóa ngày 07/11/2026. Baseline kiểm tra: `main` tại
`04f7c4a4d9001901c3973e7e6bbf5a2118932ee7`; working tree sạch trước task tài liệu.
Ref local `origin/main` cùng SHA; đây không phải xác minh remote mới hoặc deploy.
Task tài liệu: `store-app/docs01-roadmap-normalization`, base SHA như trên,
worktree `/private/tmp/coopfood-kph-docs01`, một writer. Không đổi runtime/contract.

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

## Điểm quyết định tiếp theo

Ưu tiên chuẩn bị slice **UI mới + KPH online**, bắt đầu bằng contract effective
store/capability và ánh xạ history UI sang D01. Xem [NEXT](NEXT.md) và
[scope đề xuất](product/STORE_KPH_ONLINE_NEXT_SCOPE.md).

Toàn bộ checkpoint cũ được giữ tại
[lịch sử trạng thái đến 27/10](CURRENT_STATE_HISTORY_2026-10-27.md).
Các pending cũ không mở lại acceptance đã được thay bằng quyết định mới hơn.
