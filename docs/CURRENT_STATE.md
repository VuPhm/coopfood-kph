# Trạng thái hiện tại

Cập nhật17/11/2026. Owner nghiệm thu KPHON03–04; vòng kỹ thuật tổ hợp PASS.
Sau revision2 `fdcfd2f`, owner chốt “đủ để tiếp, tiếp”: kết thúc vòng UI local
ở mức đủ để đi tiếp DATE contract. iPhone vẫn pending; không suy rollout.
Baseline tích hợp gồm KPHON04 `1ad0907`, hồ sơ `089dd17` và QA01 `f2b1404`;
main ở `2d1536f`. Candidate KPHQA01 revision2 sửa feedback lỗi gửi, trạng thái
xác minh, logo/chrome và nối thêm/chọn đủ ngày theo feedback owner; chưa merge.
[Nghiệm thu và evidence hai vòng cuối](delivery/kphqa01-final-acceptance.md).

DATEON01 đã chốt trên nhánh `store-app/dateon01-durable-contract` từ checkpoint
`82b01b3`, chỉ chuẩn bị [contract DATE bền vững](product/DATE_DURABLE_CONTRACT.md).
Owner đã chốt: lượng đang theo dõi, không tồn kho; xử lý từng phần và giữ lượng
còn lại; lịch chung, chỉ quản lý sửa/hẹn. Contract có wire proposal, ADR0008
Proposed và fixture9 scenarios; chưa sửa OpenAPI, schema hoặc app. Bước tiếp là
DATEON02 lưu/xem/tạo/sửa entry với quyền/version/audit, không nhập BE/DATE cũ.

**Owner sửa ưu tiên17/11:** phải đưa UI danh sách DATE đã có lên trước backend.
DATEUI01 từ `60ba810` đã đưa lại `DateWorkspace` vào route online/Home Quản lý
DATE, dùng cùng chrome/list roles KPH hiện tại. [Checkpoint UI](delivery/dateui01-list-checkpoint.md).
Xem đủ7 fixture ở Store UI4184; online4183 giữ lookup thật, list unknown và
khóa DATE write vì chưa có backend. Chưa tiếp DATEON02; không suy mock thành
dữ liệu vận hành/persistence hoặc nghiệm thu partial KPH.

## Đã có trên baseline tích hợp

- FRESH01 revision5 CLOSED27/10: UI Fresh đã vào main; R2-01 shell spine accepted
  từ24/09. [Evidence FRESH01](delivery/fresh01-solid-compact/integration-2026-10-27.md).
- ADMIN03 cấp/thu hồi quyền cửa hàng đã CLOSED theo owner09/11 và nay được tích
  hợp cùng chuỗi KPH. [Quyết định](delivery/admin03-store-membership/acceptance-2026-11-09.md).
  Admin Web riêng: `npm --workspace @coopfood-kph/admin-web run dev`, cổng5174;
  dùng backend thật, chọn proxy theo môi trường, không lấy mock làm evidence quyền.
- KPHON01 session/effective stores, KPHON02 lookup/history, KPHON03 create/private
  media và KPHON04 review/export đã có trên Fresh online. KPHON01–02 được owner
  tạm chấp nhận có giới hạn; owner đã nghiệm thu KPHON03–04 ngày17/11.
  Owner cho đi tiếp sau UI revision2; gate thiết bị thật vẫn pending.
  [KPHON04 technical evidence](delivery/kphon04-review-export/evidence.md).
- QA01 bỏ delivery-cycle, giữ một module `tdd` của Matt Pocock, tinh gọn kiểm
  lặp và workflow. Owner đồng ý merge17/11; áp dụng [TEST_STRATEGY](TEST_STRATEGY.md)
  và [bàn giao gọn](DELIVERY_WORKFLOW.md). [Kết quả QA01](qa/QA01_LEAN_TESTS.md).

Quyền merge lần này không thay quyết định nghiệm thu feature/ADR hoặc cấp quyền
push/deploy. Các câu “chưa merge main” trong hồ sơ task cũ là checkpoint lịch sử.

## Ranh giới hiện hành

| Vùng | Đã có | Còn chờ |
| --- | --- | --- |
| Store Fresh online | KPHON03–04 owner accepted; kỹ thuật tổ hợp PASS; candidate revision2 giữ chrome khi xác minh, logo official, nối thêm giữ chọn và chọn đủ ngày explicit | Owner cho tiếp sau revision2; iPhone pending vì chưa có đường truy cập thiết bị |
| Admin Web | Lifecycle, user deactivation, credential self-service, catalog staging và store membership | UI nghiệm thu cuối trên bản tích hợp; provisioning/reset/bootstrap/recovery mở riêng |
| Store/capability | GET `/api/v1/kph/stores` dùng policy backend cho store/region/chain, không membership giả | ADR0007 vẫn Proposed; discovery acceptance cuối chưa suy ra từ merge |
| DATE/Thông báo/Báo cáo | Workspace DATE đã hiện lại ở candidate online; UI đầy đủ có preview fixture riêng4184 | Checkpoint UI trước DATEON02; persistence/partial quantity/audit/reminder/snapshot chưa có backend; không mock fallback online |
| Catalog | Lookup published/current và staging C01 | Chốt primary supplier/lookup current và publish C02 |
| Vận hành | Evidence kỹ thuật local theo slice | Thiết bị thật, restore, deployment profile/storage/retention và rollout |

Backend là authority cho identity, store scope, quyền và dữ liệu. D01 online
selection/nối thêm và chọn đủ ngày explicit đã được owner yêu cầu đổi17/11;
API D01 vẫn phân trang server. Xem HISTORY_PAGING_CONTRACT, không suy từ mock.
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
Evidence mới KPHQA01: full backend regression PASS92 tests/16 classes, không
fail/error/skipped; clean migrations V1–V9. Journey hai phiên nối Admin đổi
quyền → lookup → create3 ảnh/mất response/retry → review/export → revoke PASS.
Sau sửa feedback lỗi gửi:29 tests form/create, online build/PWA và browser
candidate4181 PASS; keyboard/focus/vùng cuộn được kiểm390×844/1440×1024.
Không chạy lại full frontend suite trên diff UX nhỏ ở revision1. Remote CI và
thiết bị thật chưa PASS; quyết định owner revision2 nằm ở đầu checkpoint. Technical PASS và owner acceptance riêng.

Revision2: profile KPH66 tests và real-backend browser390/1440 PASS cho append,
selection, review/export và revoke/expiry. Browser chọn đủ ngày tổng hợp26 phiếu
khi list mới tải25; báo rõ1 phiếu chưa hiển thị. Giữ kiểm DB quyền mỗi request,
không cache auth theo TTL hoặc trì hoãn mask private để che lỗi nháy trắng.
Full frontend `npm run verify` revision2 PASS425 tests (Admin27, Store355,
API4, rules19, UI20), TypeScript/build/PWA, contracts và generated API không
drift. Backend không đổi;92 tests cùng source ở revision1 không chạy lại.

Các URL preview4176/4175/4181/4182 là checkpoint lịch sử, không cam kết đang
chạy. Worktree KPHQA01 đã dọn sau khi kế thừa vào DATEUI01 và lưu evidence;
source/runtime mới tiếp tục từ worktree DATEUI01. Các kiểm trước revision2
vẫn là evidence theo source/ngày cũ.
Owner chọn giữ gate iPhone pending vì chưa có URL HTTPS/thiết bị kết nối;
không tự mở tunnel/deploy. Main4176 chưa có bản sửa feedback của candidate.

Không đổi nhánh `codex/github-pages-pwa` hoặc tag bảo tồn. Không push/deploy.
Checkpoint trước tích hợp đọc bằng `git show f2b1404:docs/CURRENT_STATE.md`;
[NEXT](NEXT.md) là bước tiếp hiện hành.

## Dọn và quyền push17/11

Owner yêu cầu “làm sạch rồi push” sau checkpoint DATEUI01 `e919aae`. Chỉ push
nhánh `store-app/dateui01-list-checkpoint`, không merge/push main, Pages hoặc tag.
Đã dọn hai worktree ancestor sạch KPHQA01/DATEON01 sau khi kiểm không có process/
dependency dùng; giữ branch provenance và worktree DATEUI01 cho bước tiếp.
Evidence KPHQA01/Surefire giữ local tại repo chính
`.local/verification/dateui01-cleanup-2026-11-17/`; DB/media KPHON02 và các
worktree khác không đổi. Ports4181–4184 không có listener lúc dọn; nếu review
lại phải start/probe preview đúng source/mode, không tái dùng URL như đang sống.
