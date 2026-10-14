# Pilot Pages — round hiệu năng và vòng đời hai form tạo phiếu

Ngày: 14/10/2026. Worktree: `/Users/vup/.codex/worktrees/0cc0/coopfood-kph`.
Branch: `codex/github-pages-pwa`; baseline sạch và đồng bộ origin: `e0f093b`.

## Phát hiện đã tái hiện và sửa

- Batch ảnh await từng file nhưng không nhận biết form đóng, đổi loại/cửa hàng
  hoặc unmount. Kết quả/lỗi cũ có thể xuất hiện trong form mới; URL của ảnh mới
  chuẩn bị một phần cũng chưa được cleanup khi unmount.
- Hai sự kiện chọn ảnh sát nhau có thể chạy hai batch, tăng peak decode/memory
  và vượt cơ chế giới hạn tổng ảnh ở thời điểm bắt đầu.
- Hai submit có thể cùng vượt qua async validation trước khi state khóa nút
  được render. Lưu cũ hoàn thành sau khi đóng/mở lại có thể reset/đóng bản nháp
  mới hoặc đưa lỗi cũ vào form mới.
- Scanner/viewer có state riêng nên có thể còn mở khi form cha đóng.
- Hai nhóm lựa chọn render lại trên mỗi thay đổi field đang được watch. Phép đo
  icon CalendarClock: 20 lần đổi lựa chọn làm tổng render từ 1 thành 21 ở cả
  TPCN/TPTS, dù nhóm lựa chọn không đổi props.

## Patch giới hạn trong CreateRecordDialog

- Epoch của phiên form đổi khi open/kind/profile thay đổi hoặc unmount; cleanup
  timer trọng lượng/focus và URL đang chuẩn bị. Kết quả async chỉ cập nhật đúng
  phiên. Giữ batch đang decode làm busy cho tới khi nó kết thúc, không mở batch
  song song khi người dùng đóng/mở lại nhanh. Bỏ qua các file còn lại sau hủy.
- Ref khóa chọn ảnh/lưu ngay tại handler. Khóa submit bao trùm cả validation và
  storage; luôn nhả khóa trong finally. Transaction lưu đã bắt đầu vẫn hoàn tất,
  nhưng không reset/đóng form mới. Lỗi lưu của phiên hiện tại vẫn giữ bản nháp.
- Scanner và viewer chỉ mở khi form cha mở; hủy focus timer cũ.
- Memo nhóm lựa chọn với props ổn định: cùng phép đo 20 updates còn 1 render.
  Default form chỉ tính lần đầu thay vì mỗi render; tháng calendar lấy từ ngày
  phát hiện của bản nháp. Reset theo kind/profile/lưu thành công vẫn như trước.
- Giữ schema/validation, 1–3 ảnh và thứ tự, parser TPTS, số thập phân, rule ngày,
  persistence codec và CSS iOS đã ship. Không đổi API/DB/Pages configuration.

## Kiểm chứng

- Thêm 17 regression cases: close/reopen hai loại, đổi kind/profile, unmount
  giữa batch, picker chồng nhau, batch lỗi rồi retry, StrictMode, scanner/viewer
  đóng theo form, đóng trong validation, submit trùng hai loại, lưu cũ resolve/
  reject sau mở bản nháp mới, và render count cả hai loại.
- `npm --workspace @coopfood-kph/store-pwa test`: **253 tests / 24 files pass**.
- `npm run build`: pass; `npm --workspace @coopfood-kph/store-pwa run build --
  --base /coopfood-kph/`: pass. Cảnh báo chunk ExcelJS có sẵn vẫn còn.
- `npm run check:docs` và `git diff --check`: pass.
- Production preview riêng `127.0.0.1:5191/coopfood-kph/`, xác minh script
  candidate `index-D6UuMAi2.js`. TPTS `2912345612345` → `1.234 kg`; TPCN giữ EA,
  nhập `0,25` lưu `0.25 EA`; chọn ảnh PNG tổng hợp → JPEG stamped, lưu một phiếu
  mỗi loại, reload/mở PIN giữ cả hai phiếu và ảnh. Đổi lựa chọn Khác hoạt động.
  Không dùng hoặc sửa dữ liệu vận hành thật; fixture PNG ngoài Git.

## Giới hạn và bước tiếp theo

Không hủy được decode browser đã bắt đầu; patch chờ nó kết thúc rồi bỏ kết quả
cũ và dừng phần còn lại của batch. Không chứng minh hết lag trên iPhone iOS 18
thật hoặc đo throughput camera thật; regression scanner dùng test hiện có.
Bước nhỏ tiếp theo: thử đóng/mở nhanh trong lúc chọn ảnh trên thiết bị báo lỗi,
rồi xác nhận candidate trước khi deploy. Rollback revert riêng commit, không
reset IndexedDB hoặc quay về codec cũ.
