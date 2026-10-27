# DATE04 — chuẩn bị nhập theo dõi DATE,28/10/2026

Yêu cầu: “chuẩn bị cho phần nhập theo dõi date mới để nhập sản phẩm date vào theo dõi”.
Deliverable: [đề xuất luồng/trường/rules/slice và acceptance](../../product/DATE_INTAKE_PROPOSAL.md).
Đây là preparation docs, không phải chức năng tạo lô đã chạy hoặc contract API accepted.

- Branch `store-app/date04-intake-prep`; base `c4c7da23bf622a95cfeb82c0416d7d332ac451cf`.
- Worktree `/Users/vup/.codex/worktrees/date04-intake-prep/coopfood-kph`.
- Root sole writer; không dispatch agent. Không kiểm remote freshness cho docs local.
- Tái dùng NOTIF01 candidate; không suy owner đã nghiệm thu NOTIF01. MOTION01
  giữ owner acceptance đã ghi trong cycle. Không merge/push/deploy.

Đã đối chiếu CURRENT/NEXT, engineering/baseline/contract index, DATE model,
DateWorkspace/StoreApp/MockDateLot/date-actions/assessment/date rules, barcode
OpenAPI, CalendarInput/form RHF-Zod, accepted ADR0001–0006 và delivery workflow.

Tìm thấy các khoảng trống thật: chưa có API tạo DATE/tìm SKU; ID mẫu đang kiêm mã
lô, kind lấy từ fixture catalog; chưa có quantity/snapshot; dữ liệu phiên chưa
bền vững. Đề xuất không che các khoảng trống đó bằng model/API/persistence giả.

File đổi: `docs/product/DATE_INTAKE_PROPOSAL.md`, link ở DATE model/contract index,
`docs/CURRENT_STATE.md`, `docs/NEXT.md` và receipt này. Không đổi runtime/schema/
OpenAPI/client/dependency. Validation bằng docs checker/diff; không chạy UI tests
hoặc tạo screenshot vì chưa sửa giao diện. Backend/runtime tests không áp dụng
cho docs-only preparation.

Bước tiếp: owner chốt các lựa chọn V1 trong bảng quyết định (ưu tiên NSX, quantity,
trùng lô), rồi dựng form mock nhập từng lô; frontend không cần đợi backend. Việc
chưa dựng runtime là đúng phạm vi “chuẩn bị”, không phải đang bị chặn quyền/tool.

Kiểm tra thực28/10/2026: `npm run check:docs` PASS (Docs/fixtures foundation
hợp lệ); `git diff --check` PASS. Diff chỉ thuộc `docs/**`, runtime không đổi
so với base c4c7da2. Không dùng kết quả docs checker làm bằng chứng tính đúng
của chức năng nhập chưa được triển khai.
