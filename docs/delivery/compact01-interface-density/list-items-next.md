# Item list — đánh giá kế tiếp sau COMPACT01

Ngày24/10/2026. Theo owner: “cân nhắc tiếp cho các item list”. Đây là đề xuất
sau khi rà component/CSS và contract hiện có; chưa có thay đổi runtime,
chưa có prototype hoặc nghiệm thu hình ảnh mới. Giữ COMPACT01 đã chốt tạm.

## Hướng thiết kế

Giảm số lớp bao, mức nhấn cạnh tranh và thông tin lặp trước khi giảm khoảng
trống. Giữ tên/định danh giúp nhận đúng hàng, dữ kiện quyết định tác nghiệp
và trạng thái cần đọc nhanh. Nội dung dài được đọc đầy đủ trong chi tiết;
không dồn trạng thái nghiệp vụ vào một icon hoặc chỉ biểu đạt bằng màu.

Apple khuyên giữ nội dung hàng dễ quét, chọn row style phù hợp với dữ liệu
và phân biệt feedback chọn/navigating. Đây là tham khảo nguyên tắc, không
phải một mẫu Apple cố định phải sao chép cho web:
[Apple HIG — Lists and tables](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables).
Token kích thước tác nghiệp vẫn theo [Store size roles](../../product/STORE_APP_SIZE_TOKENS.md).

## Đề xuất theo loại

| Loại | Nhận xét source hiện tại | Candidate nên thử |
| --- | --- | --- |
| KPH mobile | Tên + SKU/số lượng + strip ba nhãn; cả ba nhãn cùng kiểu chip nên cạnh tranh | Giữ tên chính, SKU/số lượng cùng dòng phụ. Tình trạng là tín hiệu chính; phương án xử lý và duyệt có mức nhấn khác nhau, vẫn hiện chữ và đủ ba meaning. Thử bỏ vỏ pill ở thông tin phụ; không ép một hàng nếu làm khó đọc. Giữ strip cuộn riêng và OTHER đầy đủ qua accessible text/detail. |
| KPH desktop | Đã là bảng7/8cột, Compact thực tế56px; có ích khi so nhiều phiếu | Giữ cột và header để so sánh. Ưu tiên căn số lượng/nhãn, giảm vỏ chip phụ; không gộp cột hoặc ép chiều cao thấp hơn để giống mobile. |
| Báo cáo mobile | Card có nhãn, sau đó khối HSD/Tồn riêng; Tồn hiện chưa có dữ liệu | Bỏ khung con HSD/Tồn, chuyển thành một dòng dữ kiện có thể wrap; giữ HSD, Tồn và trạng thái thiếu dữ liệu. Checkbox vẫn là vùng độc lập44px cạnh vùng mở chi tiết. |
| DATE | Đã có tên, SKU/lô, NSX/HSD, %HSD và footer trạng thái/báo lại | Giữ %HSD làm điểm chính. Chỉ thử gom footer và giảm vỏ nhãn; giữ NSX/HSD, phase, xử lý và ngày báo lại. Không chuyển các dữ kiện này vào gesture/tooltip. |
| Thông báo | Nhóm có title/description; từng item nhắc lại phase và %HSD | Tinh gọn phần lặp trong header nhóm, căn lại dòng SKU/lô và ngày báo lại. Giữ nhãn phase của item và mở đúng lô; chưa bỏ thông tin chỉ vì group title đang giống nó. |

Những điều chỉnh trên chỉ dành cho Compact trong candidate đầu; comfortable
vẫn là mốc so sánh. Không thêm tùy chọn mật độ thứ ba hoặc tự thu nhóm.

## Slice nhỏ tiếp theo đề nghị

Làm **KPH mobile trước** trong vòng riêng: cùng dữ liệu, dựng một candidate
phân cấp nhãn khác nhau; so cạnh bản hiện tại ở390×844 và1440×1024. Đo số dòng,
chiều cao với tên ngắn/dài và số phiếu đọc được trong cùng vùng danh sách.
Chỉ giảm chiều cao khi thông tin còn quét nhanh; mục tiêu không phải một tỷ
lệ nén cố định. Tên dài và chữ lớn được nở cao.

Giữ contract [KPH compact history](../../product/KPH_COMPACT_HISTORY.md):
nhóm ngày; checkbox ngày tách thu/mở; chọn đúng tập đã tải; nối25 và trả focus;
không mở nhầm phiếu khi vuốt tags; fallback SKU/UPC/Nhập tay; đủ condition/
resolution/approval; ngày vẫn hiện khi không nhóm; OTHER không mất nội dung.
Không sửa enum, số lượng, trạng thái duyệt hoặc workflow chi tiết.

Khi triển khai mới cần Playwright có mục tiêu cho chọn/bỏ chọn, nhóm/ngắt
nhóm/thu mở, Hiển thị thêm, nhãn dài/vuốt ngang, mở/Escape/trả focus;320px,
chữ150/200% và touch44px. Kiểm comfortable/state preservation khi bật/tắt.
Chưa cần mở rộng DATE/Báo cáo/Thông báo trước khi đánh giá xong item KPH.

## Source đã rà

`apps/store-pwa/src/store-kph-list.tsx`, `store-density.css`,
`store-date-workspace.tsx`, `store-date-report.tsx`, `store-date-report.css`,
`store-notifications.tsx`; contracts KPH/DATE/Reports/Notifications hiện hành.
Đây là đánh giá source và evidence COMPACT01 hiện có, không phải một lượt
Playwright mới hay xác nhận trên thiết bị thật. Không khởi chạy cycle mới.
