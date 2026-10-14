# DATE quản lý theo mốc Tra hạn — hướng triển khai 12/10/2026

Owner yêu cầu bỏ bar trong danh sách và chuyển DATE thành kết quả Tra hạn gắn
thêm mã hàng, sản phẩm và lô để quản lý. Đây là hướng product cho prototype
Store Fresh; không tự tạo contract API DATE hoặc đổi rule đã accepted.

## Mô hình hiện tại

Mỗi lô giữ SKU dạng chuỗi (kể cả số 0 đầu), tên hàng, mã lô, NSX/HSD và trạng
thái xử lý. NSX → cảnh báo → hạn lùi → HSD dùng đúng `calculateShelfLife`
của Tra hạn, authority [DOMAIN_RULES](DOMAIN_RULES.md). Ngày hiển thị
`dd/mm/yyyy`, ngày nghiệp vụ `Asia/Ho_Chi_Minh`; `HSD <= NSX` là lỗi.

`shelfLife = HSD - NSX + 1`. Dưới 10 ngày không có cảnh báo riêng và hạn lùi
bằng HSD. Từ 10 ngày, cảnh báo bắt đầu tại HSD trừ `round(40% × shelfLife)`;
hạn lùi bằng HSD trừ `round(20% × shelfLife)`. Không suy mốc từ phần trăm đồ họa.

| Thời điểm/dữ liệu | Nhãn tình trạng DATE | Trình bày |
| --- | --- | --- |
| Trước NSX hợp lệ | Chưa đến NSX | Thông tin xanh dương |
| Từ NSX, chưa tới cảnh báo/hạn lùi | Chưa cảnh báo | Xanh |
| Từ mốc cảnh báo tới trước hạn lùi | Cảnh báo | Cam |
| Từ hạn lùi tới hết ngày HSD | Đến hạn lùi | Cam |
| Sau ngày HSD | Hết HSD | Đỏ |
| Thiếu NSX, HSD chưa qua | Thiếu NSX | Xám; giữ HSD, không tự suy NSX hoặc timeline |
| Thiếu NSX nhưng HSD đã qua | Hết HSD | Đỏ; thiếu NSX vẫn được giải thích, không vẽ timeline |
| Ngày lỗi hoặc HSD không lớn hơn NSX | Ngày không hợp lệ | Đỏ; không vẽ timeline hoặc suy tình trạng khác |

Hai chiều **tình trạng DATE** và **trạng thái xử lý** độc lập. Mở/Đã ghi nhận/
Đã xử lý giữ workflow prototype hiện có. Lô Hết HSD đã xử lý vẫn giữ nhãn
Hết HSD; đổi trạng thái xử lý không sửa ngày hay điều kiện thời hạn.

## Giao diện được triển khai

Danh sách không có progress bar hoặc %: tên hàng → SKU/lô → NSX/HSD → nhãn DATE và
nhãn xử lý. Dùng [ListLabel](LIST_LABEL_SYSTEM.md), màu kèm chữ/icon, không
thêm target riêng vào thẻ. Theo yêu cầu mới “Toàn bộ nhãn màu và thanh nhãn”
ngày 12/10/2026, thêm bar cạnh trái 3px trang trí theo nhãn DATE, tách biệt với
timeline hạn dùng; đổi xử lý không đổi màu bar. Đây là cập nhật cho hướng
bỏ progress bar trước đó. Theo dõi DATE xem toàn bộ lô; Cảnh báo chỉ đưa
lô cần chú ý (cảnh báo, đến hạn lùi, hết HSD, thiếu/lỗi dữ liệu) vào các nhóm
xử lý. Bộ lọc thêm tình trạng DATE, giữ tìm SKU/barcode/tên/lô và sắp xếp cũ.

Chi tiết lô dùng chung `ShelfLifeTimeline` với Tra hạn: vị trí hôm nay, tên
mốc trên rail và ngày đầy đủ ở bảng hai cột. Tên/SKU/lô ở hai hàng ngắn; nhãn
và HSD còn/quá cùng vùng. Không có summary năm hàng, ngày phóng lớn, ngày ngắn
lặp trên rail hoặc đoạn hướng dẫn/ghi chú triển khai dưới nút. Ngày hạn lùi
hay HSD được nhấn weight/màu trong bảng mốc; giữ cỡ chữ và CTA 48 px.

Thông tin catalog trên vùng tìm thu thành hàng tên/SKU/UPC, mở nhóm hàng/
NCC/đơn vị/cửa hàng bằng native disclosure khi cần. Đổi sản phẩm reset đóng.
Lô thiếu/ngày lỗi vẫn hiện dữ liệu và giải thích cụ thể, không có holder.
Timeline dưới 10 ngày gộp hạn lùi/HSD; tăng chữ 150% được phép wrap. Khung
nhập/quét/Tìm và trọng số danh sách đã accepted giữ nguyên. “Thêm theo dõi”
tiếp tục disabled theo phạm vi prototype hiện tại.

Tính một lần theo lô/ngày trong `useMemo`, dùng lại khi tìm/lọc/mở popup;
timeline `memo` dùng cùng implementation Tra hạn. CSS tĩnh, không thư viện
chart, timer hoặc vòng animation JS. Đây là lựa chọn cấu trúc cho dữ liệu mẫu,
chưa là benchmark hiệu năng dữ liệu lớn/thiết bị cửa hàng.

## Mở rộng sau — chưa triển khai

- Theo dõi ngày thực liên tục, cập nhật qua nửa đêm và khi app hoạt động lại.
- Thông báo khi lô qua mốc, quy tắc nhận/thừa nhận/chống lặp và scope cửa hàng.
- Thống kê theo tình trạng, lô, sản phẩm, cửa hàng và lịch sử xử lý.

Prototype hiện tính nhãn theo ngày HCM khi view render; không đăng ký đồng
hồ cập nhật ngày, không gửi thông báo, không tạo thống kê hoặc persistence.
API, tạo/sửa lô, quyền/store scope, nguồn ngày, dữ liệu lịch sử và định nghĩa
thống kê cần contract riêng trước khi làm backend. Không thêm queue/Redis/
scheduler hay migration từ hướng product này. Không sửa nguồn provenance cũ.

Nghiệm thu owner và technical PASS giữ riêng; xem
[bàn giao](../delivery/figma-mobile-implementation/date-compact-detail.md).
