# Hướng dẫn cho coding agent

Áp dụng cho toàn bộ repository Co.op Food Store Operations App. Round 0 khóa
baseline; Round 1 tiếp theo là UI/UX/Brand DNA, chưa phải triển khai shell.

## Thứ tự đọc bắt buộc

1. `docs/CURRENT_STATE.md`
2. `docs/NEXT.md`
3. `docs/ENGINEERING_PRINCIPLES.md`
4. `docs/STORE_APP_BASELINE.md` và `docs/product/STORE_APP_CONTRACTS.md`
5. Tài liệu product/contract của feature đang làm
6. ADR đã accepted trong `docs/adr/`

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
- Xem code/test thực tế trước khi đề xuất thay implementation; giữ contract
  nghiệp vụ, API, dữ liệu và bảo mật khi refactor.

## Git và Pages

- `main` là baseline tích hợp Store App đã chấp nhận. Việc mới dùng nhánh theo
  task (`store-app/<task-id>-<slug>`); thử nghiệm cần thiết dùng `exp/<task-id>-<slug>`.
  Tên nhánh xác định task, không xác định Codex hay Antigravity.
- Mỗi task có một worktree và một writer active; handoff giữ nguyên nhánh,
  worktree, base SHA và phạm vi sửa. Task song song chỉ làm trên scope độc lập.
- `codex/github-pages-pwa` là nhánh Pages đang được bảo vệ, không dùng cho Store
  App. Tag annotated `preserve/github-pages-pwa-2026-09-24-c789714` trỏ đến
  `c789714870eff5912e10fe89361bd845d9e3983d` và là mốc bảo tồn bất biến.
- Thay Pages là một cutover riêng, explicit và có đường quay lại; không suy ra
  quyền deploy từ việc tích hợp Store App. Xem [baseline](docs/STORE_APP_BASELINE.md).

## Ownership tránh conflict

- Chỉ một task được sửa `contracts/openapi/**` tại một thời điểm.
- Chỉ một schema migration active tại một thời điểm.
- Migration đã áp dụng chỉ được nối tiếp bằng migration mới, không sửa ngược.
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
- Quyền KPH kế thừa phải explicit: `STORE_MANAGER` đúng store,
  `REGION_MANAGER` có active assignment tới region chứa store, và `CHAIN_ADMIN`
  trên toàn chuỗi được duyệt/xuất trong scope tương ứng; luôn test cross-store/
  cross-region. Store PWA không cho xóa/vô hiệu hóa.
- Giữ workflow và interaction nghiệp vụ đã accepted; shell, navigation, IA,
  screen composition và visual tokens có thể đổi trong Round 1. Xem
  [contract index](docs/product/STORE_APP_CONTRACTS.md) và
  [UI DNA](docs/product/UI_DNA.md).

## Cách làm

- Vertical slice nhỏ: contract/fixture -> backend và frontend song song -> E2E.
- Chia sẻ rule Java/TypeScript bằng fixture ngôn ngữ độc lập, không tạo runtime
  domain dùng chung xuyên stack.
- Không log secret, session, ảnh hoặc PII đầy đủ.
- Không commit dữ liệu vận hành thật, workbook thật hoặc ảnh thật.
- Không tắt test/bảo mật để làm CI xanh.

## Bàn giao

Với milestone nhiều bước hoặc yêu cầu điều phối team, dùng
`tooling/skills/delivery-cycle/SKILL.md` và `docs/DELIVERY_WORKFLOW.md`.
Giữ kế hoạch hiện có khi resume; việc nhỏ không cần tạo hồ sơ đầy đủ. Phân biệt
kiểm tra kỹ thuật đạt và nghiệm thu thực của owner; đóng vòng rồi dừng.

Nêu file đã đổi, lệnh kiểm tra và kết quả, quyết định/giả định, rủi ro còn lại và
một bước nhỏ tiếp theo.
