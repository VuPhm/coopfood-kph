# ADR 0002 — Local-only pilot PWA

Status: Accepted — 2026-08-27

## Bối cảnh

Nhánh `codex/github-pages-pwa` cần chạy thí điểm trước khi backend và đồng bộ
được triển khai. Phạm vi thí điểm chỉ gồm tự khai báo thông tin hàng KPH, quản
lý phiếu cục bộ, thùng rác có thể khôi phục và xuất Excel gửi CHT. Một cửa hàng
có thể dùng nhiều thiết bị, nhưng dữ liệu giữa các thiết bị chưa cần hợp nhất.

Các nguyên tắc foundation chọn PostgreSQL làm source of truth và không cho
browser storage làm authority. Quyết định này tạo ngoại lệ có thời hạn cho bản
pilot local-only; không thay đổi topology đích của hệ thống chính.

## Quyết định

- IndexedDB là source of truth trên từng browser profile trong giai đoạn pilot.
- Context cửa hàng/người dùng được tự thiết lập và lưu trong `settings` của
  IndexedDB trên từng thiết bị. Tên cửa hàng và mã cửa hàng 4 chữ số là bắt
  buộc; vai trò Nhân viên/CHT, họ tên và mã nhân viên là tùy chọn. Context này
  chỉ phục vụ hiển thị, đóng tem ảnh và Excel; không tạo authorization.
- Không tạo API giả, offline outbox, background sync hoặc cơ chế merge giữa
  thiết bị. Mỗi thiết bị là một data island độc lập.
- Phiếu, trạng thái duyệt, trạng thái thùng rác và lịch sử tạo file Excel được
  ghi transactionally vào IndexedDB. ID dùng UUID phía client.
- Xóa trong pilot là soft delete có thể khôi phục; không có thao tác xóa vĩnh
  viễn trong Store PWA.
- Ảnh được resize không upscale trong `1280×720`, nén JPEG có chủ đích và đóng
  tem trước khi lưu. Pilot chỉ persist bản đã đóng tem; file camera gốc không
  được giữ sau khi lưu để kiểm soát dung lượng thiết bị.
- Cache Storage chỉ giữ app shell và static assets qua service worker; không
  dùng Cache Storage hoặc localStorage để lưu phiếu/ảnh.
- App xin persistent storage khi trình duyệt hỗ trợ, theo dõi usage/quota và
  vẫn coi việc người dùng xóa site data hoặc mất thiết bị là rủi ro vận hành.
- Excel là artefact bàn giao cho CHT trong pilot. App ghi nhận lần tạo file,
  không tuyên bố đã gửi hoặc đã nhận vì browser không xác minh được bước đó.
- Dữ liệu demo chỉ tồn tại trong development/test; production pilot khởi tạo
  database rỗng.

## Trade-off và hệ quả

Pilot vận hành được không cần backend và giữ dữ liệu qua reload/đóng app, nhưng
không có multi-device consistency, central backup, tenant authorization hoặc
server audit truth. PWA phải nói rõ dữ liệu chỉ nằm trên thiết bị hiện tại.

Việc chỉ giữ ảnh stamped giảm mạnh dung lượng và đủ cho Excel pilot, nhưng không
đáp ứng evidence-original của hệ thống đích. Không được tái sử dụng quyết định
này cho online MVP nếu chưa có xác nhận nghiệp vụ mới.

## Điều kiện vận hành

- Mỗi cửa hàng chỉ định thiết bị/browser profile chịu trách nhiệm cho từng tập
  phiếu; không dùng private browsing và không xóa site data.
- Nếu dùng nhiều thiết bị, CHT chịu trách nhiệm gom các file Excel độc lập.
- Cấu hình store self-service là context local theo thiết bị, không được hiểu là
  membership hoặc quyền truy cập của topology online.

## Xem xét lại khi

- Mở backend KPH hoặc cần đồng bộ giữa thiết bị.
- Cần audit/retention ảnh gốc, central backup hoặc authorization thật.
- Dung lượng/hiệu năng trên thiết bị pilot không đạt kiểm thử thực tế.
