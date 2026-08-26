# Hướng dẫn cho coding agent

Áp dụng cho toàn bộ repository Co.op Food KPH.

## Thứ tự đọc bắt buộc

1. `docs/CURRENT_STATE.md`
2. `docs/NEXT.md`
3. `docs/ENGINEERING_PRINCIPLES.md`
4. Tài liệu product/contract của feature đang làm
5. ADR đã accepted trong `docs/adr/`

Nếu tài liệu mâu thuẫn, contract nghiệp vụ và ADR accepted được ưu tiên. Dừng
và ghi rõ mâu thuẫn nếu không thể giải quyết an toàn.

## Ranh giới hệ thống

- Một Spring Boot modular monolith, một PostgreSQL trung tâm.
- Store PWA và Admin Web là hai entry point, dùng chung OpenAPI contract.
- Backend quyết định authorization, store scope và toàn vẹn dữ liệu.
- Frontend được phát triển bằng contract/examples và mock, không cần chờ backend.
- Không tạo microservice, Redis, queue, search engine hoặc platform abstraction
  khi chưa có requirement thực và ADR.
- Hai repository cũ chỉ là nguồn provenance read-only; không chỉnh sửa chúng từ
  repository này.

## Ownership tránh conflict

- Chỉ một task được sửa `contracts/openapi/**` tại một thời điểm.
- Chỉ một schema migration active tại một thời điểm.
- `packages/ui`, root lockfile và root config có một integration owner.
- Feature agent chỉ sửa allowed paths được giao.
- API đổi phải cập nhật OpenAPI, examples và generated client trong cùng slice.

## Hợp đồng không được đổi ngầm

- Ngày `dd/mm/yyyy`, timezone `Asia/Ho_Chi_Minh`; backend dùng date/`LocalDate`.
- `shelfLife = HSD - NSX + 1`; `HSD <= NSX` là lỗi.
- Dưới 10 ngày: hạn lùi bằng HSD. Từ 10 ngày: offset hạn lùi `round(20%)`,
  cảnh báo bắt đầu tại `round(40%)` trước HSD.
- Barcode, SKU, mã NCC là chuỗi. Lookup barcode trả `0 hoặc 1`.
- Not-found cho phép scan lại hoặc nhập tay với trạng thái `NOT_FOUND`, không
  suy diễn sản phẩm.
- KPH giữ catalog snapshot, 1-3 ảnh theo thứ tự, original và stamped đều private.
- Chỉ `STORE_MANAGER` đúng membership được duyệt/xuất phiếu trong scope hiện
  tại; Store PWA không cho xóa/vô hiệu hóa và `CHAIN_ADMIN` không bypass ngầm.
- UI giữ UI DNA và interaction đã accepted; cải tiến accessibility không được
  đổi nghiệp vụ.

## Cách làm

- Vertical slice nhỏ: contract/fixture -> backend và frontend song song -> E2E.
- Chia sẻ rule Java/TypeScript bằng fixture ngôn ngữ độc lập, không tạo runtime
  domain dùng chung xuyên stack.
- Không log secret, session, ảnh hoặc PII đầy đủ.
- Không commit dữ liệu vận hành thật, workbook thật hoặc ảnh thật.
- Không tắt test/bảo mật để làm CI xanh.

## Bàn giao

Nêu file đã đổi, lệnh kiểm tra và kết quả, quyết định/giả định, rủi ro còn lại và
một bước nhỏ tiếp theo.
