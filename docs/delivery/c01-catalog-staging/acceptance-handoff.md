# C01 — nghiệm thu catalog staging/validation

Candidate: `7c73a13dabbc8bd63439b0705b249aa724551d88`, branch
`codex/c01-catalog-staging`, revision 1. P03 đã CLOSED và không mở lại. C01 chỉ
staging/validation; chưa publish catalog.

C01 được owner chấp nhận ngày 21/09/2026 với các hành vi và giới hạn bên dưới;
quyết định được ghi tại [acceptance decision](acceptance-decision.md).

## Mở bản chạy thử

- URL local: <http://127.0.0.1:4174>.
- Tài khoản: `catalog.c01`.
- Mật khẩu **chỉ cho dữ liệu tổng hợp local**: `admin-e2e-password`.
- Backend 8081, PostgreSQL 17 ở 55434, chỉ bind loopback. Không phải deployment.
- Preview hiện đã reset sạch, chưa có batch nào.

Nếu preview chưa chạy, từ repository root, với Docker/OrbStack đang hoạt động:

```sh
./e2e/scripts/start-c01-acceptance.sh
```

Script dùng macOS `launchctl`, không tự ghi đè runtime hoặc dừng process chiếm
port. Dừng/tạo lại sẽ xóa **database tổng hợp C01**, gồm các batch vừa thử, nhưng
không tác động runtime/dữ liệu khác:

```sh
./e2e/scripts/stop-c01-acceptance.sh
./e2e/scripts/start-c01-acceptance.sh
```

Log local: `/tmp/coopfood-kph-c01-acceptance/`; SHA chạy thật nằm ở file
`revision` trong thư mục đó.

## Kịch bản ngắn cho owner

1. Đăng nhập rồi chọn
   `contracts/fixtures/catalog/valid-identifiers.csv`. Bấm **Tải lên và kiểm
   tra**. Kỳ vọng batch “Hợp lệ”, 3 dòng/0 lỗi; NCC `0007` và UPC
   `000123456789012` vẫn giữ leading zero.
2. Chọn lại đúng file đó. Kỳ vọng UI báo file đã được kiểm tra trước đó và mở
   lại cùng batch; không tạo bản sao.
3. Chọn `contracts/fixtures/catalog/conflicting-barcode.csv`. Kỳ vọng batch “Có
   lỗi”, cả 2 dòng đều chỉ ra UPC bị lặp. Batch hợp lệ trước đó vẫn còn nguyên.
4. Thu nhỏ cửa sổ: kết quả chuyển từ table sang card, không tràn ngang; các nút
   và thông báo vẫn dùng được. Nút **Lifecycle** minh họa điều hướng đa vai trò;
   tài khoản catalog-only sẽ bị backend từ chối lifecycle rõ ràng và có thể quay
   lại Catalog.

## Những gì đã đổi

- `backend/.../catalog/**`, `V8__catalog_staging_actor.sql`: parser UTF-8 CSV,
  validation theo dòng, checksum idempotency, actor/audit và batch immutable.
- `contracts/openapi/kph.openapi.yaml`, API fixtures, Contract Lock và generated
  client: list/detail/upload multipart cùng pagination row detail.
- `apps/admin-web/src/**`: workspace catalog, upload, batch summary, table/card,
  feedback/focus lỗi và chuyển workspace theo capability.
- `e2e/scripts/*c01*`, `review-admin-catalog.cjs`, `e2e/seed/c01-catalog.sql`:
  preview tổng hợp và kiểm chứng có thể chạy lại. Xem
  [technical evidence](technical-evidence.md).

## Giới hạn cần chấp nhận

- File hợp lệ vẫn chỉ là `VALIDATED`; không tạo catalog version, supplier,
  product/barcode published và không xuất hiện trong lookup cửa hàng.
- Chỉ CSV UTF-8 với header cố định; tối đa 5 MiB/50.000 dòng. Chưa hỗ trợ XLSX,
  mapping cột tùy ý, background job hay object storage.
- Chỉ `CATALOG_ADMIN` có quyền; `CHAIN_ADMIN` không ngầm có quyền catalog.
- Chưa chốt primary supplier hoặc publish/retire; đây là boundary bắt buộc trước
  khi mở C02.
- Không có production rollout, dữ liệu thật, remote CI, PR/push hay nghiệm thu
  trên thiết bị vật lý trong vòng này.

Owner xác nhận “pass, xem xét pr hoặc tiếp tục xem xét các candidate” trong Codex
task hiện tại ngày 21/09/2026. Technical pass và owner acceptance là hai gate
riêng biệt; cả hai đã pass và C01 đã CLOSED.
