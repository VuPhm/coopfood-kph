# Quy trình giao việc và nghiệm thu

Dùng cho các milestone nhiều bước của Co.op Food KPH. Nguồn quy trình dùng lại:
[`delivery-cycle`](../tooling/skills/delivery-cycle/SKILL.md). Không biến sửa lỗi nhỏ
thành một dự án quản lý quy trình.

## Cách yêu cầu lần tới

- “Dùng $delivery-cycle, rà nhánh và lên kế hoạch đóng [mục tiêu].”
- “Điều chỉnh kế hoạch: [yêu cầu]; giữ các phần đang làm không bị ảnh hưởng.”
- “Triển khai kế hoạch bằng [số team/model nếu có yêu cầu].”
- “Cho tôi dùng thử và nghiệm thu bản tích hợp.”
- “Tiếp tục từ checkpoint; chỉ xử lý các blocker còn lại.”

Lập kế hoạch không tự khởi chạy team. Khi đã được yêu cầu triển khai, agent tiếp
tục trong phạm vi đó, không hỏi lại mỗi bước. Nghiệm thu là quyết định thực của
owner; không tự coi việc chạy hết tests là đã được người dùng chấp nhận.

## Hồ sơ tối thiểu cho một vòng

Một `docs/delivery/<id>/plan.json` giữ scope/revision/ownership/gates; evidence
nằm cùng thư mục. Tham khảo format trong skill. Chỉ một milestone active theo
NEXT. Các bản kế hoạch cũ giữ làm provenance; không chuyển sang format mới chỉ
để đồng nhất. Foundation-01 tiếp tục dùng kế hoạch đang có và các commit A/B/C.

```sh
node tooling/skills/delivery-cycle/scripts/cycle.mjs inspect --repo "$PWD"
node tooling/skills/delivery-cycle/scripts/cycle.mjs init --repo "$PWD" --id delivery-02
```

Điền mục tiêu, exclusions, gate kỹ thuật/người dùng, base SHA, owner, phạm vi
team và dependencies; checkpoint file kế hoạch trước khi kiểm dispatch. Script
không tự gọi agent hoặc chạy các lệnh chứa trong hồ sơ.

Với dự án này integration owner giữ `contracts/openapi/**`, examples/generated
API, migration, `packages/ui/**`, root config/lockfile. Team có worktree riêng,
không nhận cả shared path lẫn feature path chồng nhau. Model kế thừa cấu hình;
chỉ đặt Luna max khi yêu cầu hiện hành chỉ định.

## Trước khi đưa người dùng thử

- Ghi candidate SHA và revision; tích hợp các commit team trước khi gọi là bản mới.
- Kiểm tra relevant, sau đó gate tích hợp cần thiết. Các lệnh có sẵn gồm
  `npm run verify`, online build và backend `./mvnw verify` có Docker.
- Browser E2E dùng backend/database thật với fixture tổng hợp; component mock,
  local test và remote CI là các loại bằng chứng khác nhau.
- Gửi URL thực đang chạy, mode Pilot/online, thao tác thử và kết quả mong đợi.
  Không dùng bản Pilot để chứng minh acceptance online; không nhập dữ liệu thật.
- Chờ quyết định nếu cần owner acceptance. Khi có phản hồi, phân loại lỗi trong
  phạm vi hoặc yêu cầu mở rộng, cập nhật revision và chỉ giao lại phần bị ảnh hưởng.

Đạt gate kỹ thuật → AWAITING_ACCEPTANCE. Owner chấp nhận các gate yêu cầu → CLOSED.
Còn lỗi chặn → sửa có giới hạn hoặc BLOCKED có owner/next action. Hai vòng review
là mặc định có thể điều chỉnh có lý do; không dùng giới hạn đó để bỏ test/sai nghiệp vụ.

## Ngắt và lặp lại

Khi gần hết usage: ghi SHA/worktree/agent ID, test đã chạy, process dùng thử và
bước dở; không mở thêm việc. Resume từ hồ sơ, không gọi lại team đã hoàn tất.
Đóng vòng thì cập nhật CURRENT_STATE/NEXT, bàn giao evidence và dừng. Vòng mới
bắt đầu theo yêu cầu mới; chỉ sửa workflow khi có lỗi lặp thực tế.

## Kiểm tra bộ công cụ

```sh
node --test tooling/skills/delivery-cycle/scripts/cycle.test.mjs
```

Script chỉ xác minh dữ liệu hồ sơ, ownership và Git/evidence freshness. Người
review vẫn phải đọc kết quả test và đối chiếu nguồn chấp nhận; PASS không phải
quyền merge/deploy và không chứng minh kết quả do người ghi là đúng.
