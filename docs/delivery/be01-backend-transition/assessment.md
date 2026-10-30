# BE01 — Bắt đầu chuyển sang backend

Ngày: 30/10/2026. Owner yêu cầu “bắt đầu chuyển dần sang làm backend”.
Đây là assessment và thứ tự triển khai, chưa là acceptance contract API mới.

## Checkpoint và ownership

- Base main: `04f7c4a4d9001901c3973e7e6bbf5a2118932ee7`, clean trước khi bắt đầu.
- Branch: `store-app/be01-backend-transition`.
- Worktree: `/Users/vup/Documents/coopfood-kph/.local/worktrees/be01-backend-transition`.
- Writer: root duy nhất; không dispatch agent. Remote freshness chưa kiểm.
- Chỉ sửa docs trong bước assessment. Không merge/push/deploy hoặc thay Pages.

## Bằng chứng từ implementation

Backend hiện có session/CSRF, effective KPH authorization, catalog lookup/staging,
KPH create/history/review/export/private media và lifecycle. Giữ implementation,
migration V1–V9 và các test này thay vì dựng backend mới.

`apps/store-pwa/src/main.tsx` chọn `StoreApp` khi `VITE_STORE_APP_MOCK=true`;
entry còn lại là `App` có online gateway cũ. Bật `VITE_KPH_ONLINE` đơn thuần
không nối dữ liệu thật vào StoreApp mới. `store-app.tsx` vẫn lấy profile,
phiếu và lô DATE từ mock, giữ state trong phiên.

`StoreController.listMyStores` trả `principal.user().stores()` (membership),
trong khi `KphStoreAccessPolicy` đã cho quản lý vùng và toàn chuỗi quyền kế thừa.
Online gateway còn chọn store từ session membership. Vì vậy cần discovery
đúng effective scope trước khi đưa shell mới sang online cho đủ nhóm user.
Đây là khoảng trống discovery, không phải bằng chứng backend thiếu guard KPH.

## Thứ tự triển khai từng slice

| Slice | Outcome | Gate chính |
| --- | --- | --- |
| BE02 | Chốt contract effective stores/capabilities; backend + fixture + generated client | Membership, vùng, chain, scope hợp, inactive/revoke, anonymous; không membership giả |
| BE03 | Đăng nhập/session/chọn store trong StoreApp đã duyệt | Session thật, CSRF, hết phiên, đổi store xóa state cũ, không fallback mock |
| BE04 | Tra cứu barcode bằng API hiện có | Identifier string, 0/1 kết quả, NOT_FOUND và nhập tay, scope đúng |
| BE05 | KPH list/detail/create rồi review/export từng phần | Ảnh private, idempotency, snapshot, quyền và cross-store/region; E2E backend thật |
| Sau BE05 | Contract DATE, nhắc và báo cáo rồi mới persistence | Quantity/unit, lot identity, audit, quyền, retention và snapshot phải rõ |

Không mở C02 publish khi primary supplier chưa chốt. Không kéo thay đổi từ
nhánh DATE/UI khác vào baseline chỉ vì tồn tại trong worktree inventory.
D01 online đang phân trang và reset selection; UI mock mới nối25/giữ chọn.
BE05 phải quyết định contract interaction này explicit trước wiring, không âm
thầm thay D01 theo hành vi mock.

## Đề xuất BE02 để triển khai kế tiếp

Ưu tiên endpoint read-only mới, ví dụ `GET /api/v1/me/store-access`, giữ nguyên
session và `/api/v1/stores` để không đổi semantics consumer cũ. Tên/path là đề
xuất, chưa được đưa vào OpenAPI. Mỗi item chứa store id/code/name và capabilities
KPH view/create/review/export do server tính; không gán STORE_MANAGER giả cho
quyền vùng/chain. Chỉ trả store+region active có scope hiệu lực, deduplicate
scope hợp, thứ tự ổn định. Không cấp capability DATE/report khi chưa có contract.

Mỗi request đọc quyền hiện hành; discovery chỉ phục vụ navigation, mọi endpoint
nghiệp vụ vẫn authorize riêng. Test revoke membership/assignment/role và
store/region inactive từ request kế tiếp, user không scope nhận danh sách rỗng,
anonymous nhận 401. Nếu cần phân trang discovery, chốt trước schema thay vì
thêm sau khi frontend đã phụ thuộc danh sách đầy đủ.

Một slice API phải sửa đồng thời OpenAPI, examples, generated client, backend
và test HTTP; không migration nếu schema hiện có đủ. Root sở hữu shared paths.
Sau backend gate, wiring mới chạy Playwright headless 390×844 và 1440×1024.

## Verification

Java 21.0.12 và Maven toolchain chạy được. Docker socket OrbStack không tồn tại:
`docker info` lỗi kết nối `unix:///Users/vup/.orbstack/run/docker.sock`.
Do đó chưa xác minh PostgreSQL integration, clean migration hoặc real-backend
E2E; không gọi baseline full PASS. Không tự bật runtime hệ điều hành.

Lệnh unit/architecture baseline:

```sh
cd backend
./mvnw -B -Dtest=ArchitectureTest,PasswordPolicyTest,IdentityServiceTest,KphStoreAccessPolicyTest,CatalogCsvParserTest test
```

Kết quả: BUILD SUCCESS, 16 tests, 0 failures/errors/skipped (30/10/2026). Assessment không sửa runtime,
không có preview mới và không yêu cầu owner nghiệm thu UI.

Bước nhỏ tiếp: phục hồi Docker/OrbStack, chạy `./mvnw verify`, rồi triển khai
contract BE02 cùng test allow/deny trên PostgreSQL disposable dữ liệu tổng hợp.

## Follow-up 31/10/2026

Owner yêu cầu “bắt đầu”; BE02 triển khai trên cùng worktree/branch, root sole
writer. OrbStack đã khởi động, PostgreSQL Testcontainers chạy được; giới hạn
Docker nêu ở assessment ngày30/10 là lịch sử. Xem
[BE02 handoff](../be02-store-access/handoff.md) cho kết quả hiện hành.
