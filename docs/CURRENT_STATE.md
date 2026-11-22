# Trạng thái hiện tại

Cập nhật ngày 22/11/2026. Baseline main đã tích hợp QA01 ngày 17/11.
Baseline tích hợp gồm KPHON04 `1ad0907`, hồ sơ `089dd17` và QA01 `f2b1404`;
production source không thay đổi trong lần tích hợp này.

## Candidate CHAIN01 · 22/11/2026

Trên nhánh `store-app/plan01-store-chain`, phần ứng dụng tại `3163a91` đã qua
kiểm tích hợp với PostgreSQL 17 và dữ liệu tổng hợp. Nhân viên A gửi phiếu có
ảnh, cửa hàng trưởng B nhận 403 khi duyệt phiếu A, cửa hàng trưởng A duyệt rồi
nhân viên A tải lại thấy đúng ID và người duyệt. Admin vùng A trên 390×844 thấy
1 phiếu. Admin chuỗi trên 1440×1024 thấy 2 phiếu thuộc hai vùng. Cả hai mở được
ảnh trong scope và chỉ xem kết quả.

Luna API đã kiểm 18 ca liên quan tới policy, HTTP, discovery và membership.
Luna Admin kiểm 23 ca trong app.test.tsx. Store kiểm capability EXPORT khi thiếu
REVIEW. TypeScript Admin đạt trên source chung. [Spec CHAIN01](product/KPH_APPROVAL_SCOPE.md)
ghi quy tắc mới. Các checkpoint KPHON03–04 dưới đây mô tả baseline lịch sử.
Nghiệm thu thao tác của owner, Excel thực và iPhone thật còn chờ.

## Đã có trên baseline tích hợp

- FRESH01 revision5 CLOSED27/10: UI Fresh đã vào main; R2-01 shell spine accepted
  từ24/09. [Evidence FRESH01](delivery/fresh01-solid-compact/integration-2026-10-27.md).
- ADMIN03 cấp/thu hồi quyền cửa hàng đã CLOSED theo owner09/11 và nay được tích
  hợp cùng chuỗi KPH. [Quyết định](delivery/admin03-store-membership/acceptance-2026-11-09.md).
  Admin Web riêng: `npm --workspace @coopfood-kph/admin-web run dev`, cổng5174;
  dùng backend thật, chọn proxy theo môi trường, không lấy mock làm evidence quyền.
- KPHON01 session/effective stores, KPHON02 lookup/history, KPHON03 create/private
  media và KPHON04 review/export đã có trên Fresh online. KPHON01–02 được owner
  tạm chấp nhận có giới hạn; KPHON03–04 và UI cuối chưa có nghiệm thu cuối.
  [KPHON04 technical evidence](delivery/kphon04-review-export/evidence.md).
- QA01 bỏ delivery-cycle, giữ một module `tdd` của Matt Pocock, tinh gọn kiểm
  lặp và workflow. Owner đồng ý merge17/11; áp dụng [TEST_STRATEGY](TEST_STRATEGY.md)
  và [bàn giao gọn](DELIVERY_WORKFLOW.md). [Kết quả QA01](qa/QA01_LEAN_TESTS.md).

Quyền merge lần này không thay quyết định nghiệm thu feature/ADR hoặc cấp quyền
push/deploy. Các câu “chưa merge main” trong hồ sơ task cũ là checkpoint lịch sử.

## Ranh giới hiện hành

| Vùng | Đã có | Còn chờ |
| --- | --- | --- |
| Store Fresh online | Session, chọn effective store, lookup FOUND/NOT_FOUND, history D01/detail, create/retry, review và xuất Excel với ảnh stamped private | Owner KPHON03–04, một vòng kỹ thuật tổ hợp và một vòng UI/UX cuối |
| Admin Web | Lifecycle, user deactivation, credential self-service, catalog staging và store membership | UI nghiệm thu cuối trên bản tích hợp; provisioning/reset/bootstrap/recovery mở riêng |
| Store/capability | GET `/api/v1/kph/stores` dùng policy backend cho store/region/chain, không membership giả | ADR0007 vẫn Proposed; discovery acceptance cuối chưa suy ra từ merge |
| DATE/Thông báo/Báo cáo | Prototype/mock theo contract hiện có | Persistence, quantity/unit, audit, nhắc bền vững và snapshot kỳ chưa có backend; Fresh online không fallback dữ liệu mock |
| Catalog | Lookup published/current và staging C01 | Chốt primary supplier/lookup current và publish C02 |
| Vận hành | Evidence kỹ thuật local theo slice | Thiết bị thật, restore, deployment profile/storage/retention và rollout |

Backend là authority cho identity, store scope, quyền và dữ liệu. D01 online
selection chỉ trang hiện tại; không áp hành vi grouping mock ngầm cho API.
[Contract index](product/STORE_APP_CONTRACTS.md), [baseline/Pages](STORE_APP_BASELINE.md).

## Chạy và đọc evidence

Fresh online dùng `VITE_STORE_APP_MOCK=false VITE_STORE_APP_ONLINE=true`;
mock chỉ để thử UI, không chứng minh vận hành online. Launcher hiện có:

```sh
node tooling/preview/fresh-review.mjs --admin-port 4175 --store online --store-port 4176 --api http://127.0.0.1:8082
```

Lệnh cần backend8082/DB tổng hợp đã chạy; không start/reset DB. URL chỉ là cách
khởi động, không cam kết preview đang sống. Khi bàn giao owner phải probe lại
URL/mode/source. Giữ runtime/media tại worktree KPHON02 nếu còn tái sử dụng;
không dọn dữ liệu local đó như workspace test thông thường.

Evidence trên `1ad0907`: root verify420 tests/build/PWA, backend targeted14 tests
(clean migrations), real-backend browser hai viewport; QA01 có61 targeted tests
và browser script tinh gọn PASS. Đây là evidence ngày15/11, không đổi ngày thành
kết quả mới. Kết quả tích hợp17/11 và việc dọn nằm ở [QA01](qa/QA01_LEAN_TESTS.md).
Full backend regression, remote CI, thiết bị thật và hai vòng cuối vẫn chưa được
coi là PASS. Technical PASS và owner acceptance riêng.

Không đổi nhánh `codex/github-pages-pwa` hoặc tag bảo tồn. Không push/deploy.
Checkpoint trước tích hợp đọc bằng `git show f2b1404:docs/CURRENT_STATE.md`;
[NEXT](NEXT.md) là bước tiếp hiện hành.
