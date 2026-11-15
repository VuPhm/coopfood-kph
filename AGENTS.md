# Hướng dẫn cho coding agent

Áp dụng cho toàn bộ repository Co.op Food Store Operations App. Round 0 khóa
baseline; R2-01 shell spine đã được chấp nhận, UI Fresh đã tích hợp qua FRESH01.
KPH Fresh đã có candidate online đến KPHON04; DATE/report vẫn chưa nối backend.
Trạng thái hiện hành nằm ở `docs/CURRENT_STATE.md`, thứ tự công việc ở `docs/NEXT.md`.

## Đọc theo phạm vi

Đọc `docs/CURRENT_STATE.md` và `docs/NEXT.md` trước để xác định đúng checkpoint.
Trước khi sửa, đọc code/test thực tế và phần liên quan trong
`docs/product/STORE_APP_CONTRACTS.md`, contract feature và ADR accepted.
Đọc `docs/ENGINEERING_PRINCIPLES.md` và `docs/STORE_APP_BASELINE.md` khi cần quyết
định kiến trúc/baseline; không nạp toàn bộ hồ sơ lịch sử cho mỗi task nhỏ.
Contract nghiệp vụ và ADR accepted được ưu tiên. Dừng và ghi rõ mâu thuẫn nếu
không thể giải quyết an toàn.

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
  [Store App UI DNA](docs/product/STORE_APP_UI_DNA.md). Tài liệu
  [UI DNA Tool KPH](docs/product/UI_DNA.md) là evidence kế thừa.

## Cách làm

- Vertical slice nhỏ: contract/fixture -> backend và frontend song song -> E2E.
- Chia sẻ rule Java/TypeScript bằng fixture ngôn ngữ độc lập, không tạo runtime
  domain dùng chung xuyên stack.
- Không log secret, session, ảnh hoặc PII đầy đủ.
- Không commit dữ liệu vận hành thật, workbook thật hoặc ảnh thật.
- Không tắt test/bảo mật để làm CI xanh.

## Figma và kiểm tra UI Round 1R

- Với UI theo Figma, dùng đúng URL frame/node được giao; đọc structured context
  và lấy screenshot qua Figma MCP trước khi sửa code. Contract, authorization,
  API và test trong repo quyết định semantics; Figma quyết định hình ảnh và tương tác.
- Trước khi sửa, kiểm tra Store PWA, `packages/ui`, component, token và dependency
  hiện có; tái sử dụng phần phù hợp, giữ mobile-first và semantics đã xác nhận.
- Dùng Playwright mặc định cho tương tác và kiểm tra UI, chạy headless ở
  `390×844` và `1440×1024`; kiểm tra có mục tiêu bằng DOM, interaction và screenshot.
  Chưa dùng snapshot pixel rộng trong Round 1R.
- Chỉ dùng Computer Use khi Playwright không thể kiểm tra hành vi cần thiết
  (như quyền OS/browser, phần cứng hoặc thiết bị thật); nêu lý do trước khi dùng.
- Không ghi đè frame Figma đã được chấp nhận. Sau khi xác minh bằng Playwright,
  đặt đề xuất phát sinh từ implementation vào khu candidate riêng để owner duyệt.

## Test và chi phí cận biên

Repo chỉ giữ module [`tdd`](tooling/skills/tdd/SKILL.md) của Matt Pocock đã điều
chỉnh theo contract repo; dùng khi thêm/sửa hành vi hoặc tinh gọn test.
Theo [`docs/TEST_STRATEGY.md`](docs/TEST_STRATEGY.md): chọn kiểm tra nhỏ nhất
bắt được rủi ro của diff, giữ kiểm security/integrity bắt buộc, không lặp suite
trên cùng source khi không có thay đổi hay nghi vấn mới. Không nhắm số lượng
test/coverage tùy ý. Phần nghiệm thu hình ảnh, độ dễ dùng và thiết bị thật giao
owner với thao tác ngắn, kết quả mong đợi và trạng thái còn chờ.

## Bàn giao

Dùng `docs/DELIVERY_WORKFLOW.md` gọn; không tạo plan JSON hoặc gọi team mặc định.
Giữ checkpoint/evidence cũ làm provenance, không chuyển format hàng loạt.
Nêu outcome, file đổi, lệnh/kết quả, phần chưa kiểm và một bước nhỏ tiếp theo.
Technical PASS và owner acceptance là hai kết quả riêng; không tự merge/deploy.
