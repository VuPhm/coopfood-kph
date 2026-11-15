# Test theo giá trị cận biên

Áp dụng từ QA01, base `1ad0907`, ngày15/11/2026. Mục tiêu là giảm công sức phát
hiện cùng một lỗi nhiều lần, giữ khả năng bắt lỗi gây mất dữ liệu/sai quyền.
Không có mục tiêu giảm số test hoặc đạt một tỷ lệ coverage tùy ý.

## Quyết định làm thêm hay dừng

Với bước kiểm tiếp theo t, xét **giá trị cận biên**:

`ΔV(t) = tổn thất kỳ vọng tránh được thêm − chi phí tăng thêm`.

Phần lợi ích chỉ tính lỗi chưa được evidence hiện có bao phủ, không tính lại
cùng lỗi cho từng viewport/tầng. Chi phí gồm thời gian chạy/chờ, token đọc log
và dựng context, duy trì fixture/test dễ vỡ, và thời gian owner. Không có số đo
thì mô tả định tính cao/vừa/thấp, không bịa xác suất hay dự báo tiết kiệm token.
Một probe rẻ để giải quyết nghi vấn cụ thể có thể đáng làm hơn một suite lớn.

Chạy tiếp khi diff mở failure mode mới, evidence hết hiệu lực, hoặc còn nghi
vấn có tác động đáng kể. Dừng khi không còn kiểm bắt buộc chưa làm và bước kế
chỉ lặp evidence: cùng source, cùng môi trường, không thay đổi hay lỗi mới.
Môi trường, fixture, config/build mode và thời gian cũng có thể làm evidence
hết hiệu lực; SHA giống nhau chưa đủ. Ghi rõ thiếu evidence, không đổi thành PASS.

Security/integrity là ràng buộc, không đem đổi lấy ít token: cross-store/region,
next-request revocation, CSRF/session, private media, idempotency, ngày nghiệp
vụ, formula injection và clean migration vẫn giữ khi thay đổi ảnh hưởng chúng.
Chỉ chuyển vị trí/tần suất sau khi xác định test giữ lại bắt cùng failure mode.

## Chọn lớp kiểm nhỏ nhất

| Diff/rủi ro | Kiểm có giá trị trước | Khi nào mở rộng |
| --- | --- | --- |
| Chỉ prose/skill | Docs/fixture validity, link và skill validation | Không chạy app/backend nếu không đổi executable/config |
| Pure date/domain rule | Fixture độc lập, unit tại các mốc biên | Java/TS parity nếu rule chung bị ảnh hưởng |
| Fresh KPH UI/state/gateway | File Vitest bị ảnh hưởng; `npm run test:kph` cho nhiều phần online cùng đổi | Browser nếu wiring, race, selection hoặc interaction thay đổi |
| Quyền/HTTP/persistence | Backend integration đúng policy và request; DB tổng hợp | Browser hai phiên khi cần chứng minh stale UI và request kế tiếp |
| Shared UI/layout | Component liên quan; thao tác/overflow390×844 và1440×1024 | Owner đánh giá hình ảnh; thêm viewport khi có breakpoint/lỗi thực |
| API/schema/runtime/dependency | Contract/examples/generated, affected tests | Full gate tương ứng, clean migration/restore khi bị ảnh hưởng |

`npm run test:kph` chọn7 file: session gateway, context boundary, lookup,
history/review, create, workbook export và online API adapter. Dùng một file
trong lúc sửa, profile này khi thay nhiều phần; không chạy cả hai mặc định.
Profile không bao gồm toàn bộ rule/UI/Admin/backend. `npm run verify` vẫn là
gate frontend tổng hợp; backend `./backend/mvnw -f backend/pom.xml verify` với
Docker và browser real-backend vẫn riêng. Không thay CI bằng profile chọn lọc.
Tại checkpoint tích hợp đã hẹn, chạy các gate cần thiết một lần trên source cuối.
Sau sửa lỗi chỉ kiểm lại phần ảnh hưởng; mở rộng khi còn nghi vấn liên tầng.

## Tinh gọn ngay tại KPHON04

`STORE_URL=http://127.0.0.1:<port> npm run test:kph:browser` chạy script hiện có
với backend/DB tổng hợp thật, Fresh online đúng source. Script tạo phiếu/xuất và
tạm đổi membership có restore; xác minh runtime trước, không dùng DB vận hành.
Không seed/reset lại runtime đang dùng chỉ để chạy test.

- Giữ duyệt/không duyệt, reload, selection reset và tải workbook thật ở cả
  mobile390×844 và desktop1440×1024: hai composition có thể hỏng độc lập.
- Review/export cross-region403 và stamped-media anonymous401 dùng cùng các
  endpoint ở hai viewport, không phụ thuộc layout: kiểm một lần. Giảm từ6 xuống3 request deny, bốn
  lần đọc session phục vụ chúng xuống hai, và bỏ một anonymous context.
- Giữ employee forged requests và stale review/export sau downgrade: đây là
  failure mode khác cross-region; không gộp chỉ vì đều trả403.
- Thay assert gradient, margin, display/position CSS bằng control nhìn thấy,
  workspace và overflow. Screenshot vẫn được xuất để owner xem hình ảnh.
- Giữ unit race ở từng await, backend authorization/audit và workbook byte/
  formula checks. Browser chứng minh wiring; các lớp này bắt lỗi khác nhau.

Các script visual lịch sử `e2e/scripts/check-*` là evidence theo task, không
phải một suite cần quét hết mỗi lần. Chỉ chạy script liên quan khi source/layout
còn phù hợp; không xóa hàng loạt test chưa chứng minh trùng. Suite Foundation
hiện dùng entry online cũ, không tự chứng minh Fresh KPHON04. Hai vòng tổ hợp
và UI/UX cuối còn chờ theo NEXT; QA01 không tự mở hoặc đánh dấu chúng đã đạt.

## Chia việc với owner

| Máy/agent giữ | Owner làm khi đến gate |
| --- | --- |
| Rule, quyền, API, race/retry, persistence, workbook structure/bytes, overflow, keyboard/focus tự động | Nhìn bố cục/chữ/mật độ có dễ dùng; thử nhịp thao tác của cửa hàng |
| Kiểm file Excel tải được, chọn đúng phiếu, tên người duyệt/ảnh và formula protection | Mở một file tổng hợp trong Excel thực, xem đọc/in có hợp nhu cầu |
| Browser mô phỏng camera/keyboard theo fixture | Camera, quyền OS, bàn phím, safe area và gián đoạn trên iPhone thật |

Một lượt owner ngắn: xem KPH mobile/desktop → duyệt một phiếu, không duyệt một
phiếu → chọn phiếu hợp lệ và tải/mở Excel. Chỉ ghi điểm gây khó thao tác hoặc
sai kết quả nhìn thấy; không phải tự kiểm mã trạng thái/security matrix.
Agent cung cấp URL/mode/source thực đang chạy khi giao lượt đó; không tái sử
dụng URL lịch sử chưa xác minh. Chưa phản hồi nghĩa là còn chờ, không là accepted.
