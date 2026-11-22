# STOREUI01 · Store online

Từ candidate CHAIN01, nhân viên mở DATE để xem giao diện danh sách lô và có thể mở tra mã từ đó. DATE chưa có API lô, nên màn hình phải chỉ rõ tình trạng kết nối. Lookup dùng backend theo cửa hàng hiện tại.

Khi chuyển trang hoặc quay lại cửa sổ, giữ khung điều hướng qua lượt xác minh quyền. Dữ liệu riêng, dialog và thao tác của scope cũ vẫn được che và khóa. Kiểm chuyển Home → DATE → tra mã ở mobile và desktop, cùng ca giữ nháp/thu hồi quyền hiện có.

Bản giao có danh sách lô nhập trong phiên theo tài khoản và cửa hàng. Nhập SKU, tên hàng, NSX và HSD rồi lưu. Danh sách còn khi chuyển Home → DATE. Tải lại trang, rời cửa hàng hoặc kết thúc phiên sẽ giải phóng danh sách. Dữ liệu lô chưa đồng bộ backend.

TypeScript Store đạt. Hai file test session/create đạt 13 ca. Playwright trên preview 4777 dùng backend CHAIN01, kiểm ở 390×844 và 1440×1024. Đã nhập SKU 00123, quay Home rồi mở lại DATE thấy đúng SKU/HSD, mở tra mã, giữ request xác minh quyền để kiểm thanh điều hướng còn hiển thị, ô nhập bị che rồi khôi phục đúng bản nháp. Đã chụp danh sách ở hai viewport. Camera và iPhone thật còn chờ owner.
