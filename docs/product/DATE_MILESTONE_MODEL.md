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

Hai chiều **tình trạng DATE** và **trạng thái xử lý** độc lập. Follow-up owner
23/10: DATE chỉ có Mở/Đã ghi nhận; bỏ nhóm và bộ lọc Đã xử lý vì phiếu thuộc
KPH. Chỉ gửi KPH thành công mới đặt resolved/kphRecordId, lô rời cả Cảnh báo,
Theo dõi DATE và Thông báo. Dữ liệu nguồn vẫn giữ cho liên kết/báo cáo, không
xóa lô và không đổi mốc/phase/ngày. Hủy/lỗi gửi vẫn giữ lô DATE. Xem
[Thông báo DATE](STORE_NOTIFICATIONS_DESIGN.md).

## Giao diện được triển khai

Theo yêu cầu owner23/10/2026, danh sách thay số ngày còn/quá bằng phần trăm
HSD còn lại; vẫn không có progress bar. Follow-up DATE03 ngày23/10 từ
`630ec7b`: danh sách ưu tiên phần trăm24px bên phải, tên hàng/SKU/lô bên trái.
NSX/HSD là dòng chữ phụ12px, không in đậm hay có khối nền riêng; nhãn DATE
và xử lý giữ chữ/icon/màu. Thẻ nghỉ/hover trắng, chỉ lô đang chọn nền mint với
viền xanh và `aria-pressed`; đóng chi tiết/lọc mất lô trả về trắng. Owner đã
cho phép merge23/10; xem [bàn giao DATE03](../delivery/date03-compact-list.md). Phần trăm = ceil((HSD − hôm nay + 1) / shelfLife ×100),
giới hạn0–100; tính cả ngày hôm nay nên trong hạn tối thiểu1%, sau HSD là0%.
Đây chỉ là cách trình bày: màu theo phase DATE đã tính bằng mốc thật, không
suy lại phase từ phần trăm làm tròn. Trước NSX tối đa100% với nhãn Chưa đến NSX.
Thiếu NSX/ngày lỗi hiện Chưa đủ dữ liệu/Kiểm tra ngày, không suy phần trăm kể cả
khi biết HSD đã qua. Chi tiết giữ số ngày và thêm phần trăm để đối chiếu. Dùng [ListLabel](LIST_LABEL_SYSTEM.md), màu kèm chữ/icon, không
thêm target riêng vào thẻ. Theo yêu cầu mới “Toàn bộ nhãn màu và thanh nhãn”
ngày 12/10/2026, thêm bar cạnh trái 3px trang trí theo nhãn DATE, tách biệt với
timeline hạn dùng; đổi xử lý không đổi màu bar. Đây là cập nhật cho hướng
bỏ progress bar trước đó. Theo dõi DATE xem lô chưa chuyển sang KPH; Cảnh báo chỉ đưa
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

## Ghi nhận và xử lý — prototype theo owner23/10/2026

**Ghi nhận** mở lựa chọn báo lại sau1ngày hoặc1tuần (7ngày lịch), hiển thị ngày
cụ thể theo Asia/Ho_Chi_Minh. Chỉ bấm Hẹn báo lại mới cập nhật acknowledged +
remindOn; Hủy giữ nguyên lô. Có thể đổi lịch của lô đã ghi nhận; lô resolved
không hẹn tiếp. Đến ngày hẹn, lô trở lại Mở trong Cảnh báo dù phase vẫn an toàn,
hiện trong Thông báo và nhắc một lần khi ứng dụng đang hiển thị. Nhắc không
thay tình trạng DATE hoặc mốc biểu đồ. Một đồng hồ calendar cấp Store cập nhật
qua nửa đêm HCM và khi ứng dụng/tab hoạt động lại, không timer cho từng lô.

**Xử lý** mở form KPH đang có, chưa đổi trạng thái lô. Loại TPCN/TPTS lấy từ
metadata explicit của catalog mẫu; thiếu loại thì hỏi người dùng, không suy
loại từ tên/SKU. Điền tên/SKU/barcode/NCC/đơn vị đã biết; ghi lô, NSX/HSD vào
ghi chú. Hết HSD gợi ý EXPIRED, cảnh báo/đến hạn lùi gợi ý NEAR_EXPIRY; các
trường hợp khác giữ default form, cho người dùng xác nhận. Không tạo field
ngày mới ngoài contract KPH. Ngày phát hiện/người/ảnh/review và lựa chọn xử lý
của KPH giữ nguyên. SKU khác nguồn bị chặn lưu liên kết.

Chỉ sau Gửi phiếu thành công mới lưu record KPH vào cùng phiên, đặt resolved
và kphRecordId của lô. Phiếu mới PENDING, chưa tự duyệt. Hủy, lỗi lưu hoặc đổi
sai mã hàng không resolve lô; retry giữ idempotency key. DATE condition/percent/
biểu đồ không đổi sau resolve. Không tự tạo ảnh, số lượng tồn hoặc sản phẩm.

Các luồng này vẫn **memory-only của prototype Store Fresh**: reload mất lịch
nhắc và dữ liệu mẫu; chưa có API DATE, scheduler backend, push khi đóng app hay
persistence. Báo cáo DATE vẫn là snapshot theo ngày chốt; không rollout UI báo
cáo trong slice này. Backend authority/authorization chưa được thay bằng state
browser. Không thêm queue/Redis/microservice hoặc migration.

## Mở rộng sau — chưa triển khai

- Lịch nhắc bền vững trên backend, push/nhận biết đã đọc, audit/quyền và retention.
- Thống kê theo tình trạng, lô, sản phẩm, cửa hàng và lịch sử xử lý.
- API/tạo/sửa lô và định nghĩa số lượng/tồn cần contract riêng trước backend.

Nghiệm thu owner và technical PASS giữ riêng; xem
[bàn giao DATE02](../delivery/date02-soft-detail/technical.md) và
[evidence kế thừa](../delivery/figma-mobile-implementation/date-compact-detail.md).

## Revision7 — DATE đồng dạng KPH, candidate26/10/2026

Theo owner, hai tab lớn Cảnh báo/Theo dõi DATE được thay bằng **TP khô & khác /
TP tươi sống**. Bộ chọn dùng chung component với KPH live/loading. Mặc định
TPTS khi có dữ liệu, fallback loại có dữ liệu; counts trên tập unresolved, không
đổi theo filter. Loại lấy từ catalog metadata explicit theo SKU duy nhất, cùng
lookup dùng cho seed KPH. Không suy loại từ tên/mã/đơn vị. Lô thiếu metadata
ở mục phụ Chưa phân loại, vẫn tìm/mở/nhắc và chọn loại phiếu KPH được.

Mặc định hiện tất cả lô chưa resolved trong loại; Mở/Đã ghi nhận và phase là
filter độc lập. Cần chú ý là shortcut lô Mở có phase cần chú ý hoặc đã đến lịch
nhắc; không đổi ngày/phase/trạng thái khi chỉ lọc. Exact SKU/barcode/lot lookup
chọn đúng loại hoặc Chưa phân loại; tìm tên một phần theo nhóm đang chọn như
KPH. Notification target tự mở đúng loại/lô, không bị tab mặc định che mất.

Dùng lại sort/sticky tabs/sheet và list/table roles của KPH. Mobile card giữ tên,
SKU/lô, NSX/HSD, phase/processing/reminder và24px%HSD; chỉ chevron để báo mở
chi tiết. Desktop bảng toàn chiều ngang → cùng sheet chi tiết, bỏ cột detail
trống cạnh list. Timeline vẫn cùng component/thuật toán/màu, tự co theo sheet
mới; không giữ pixel-width của cột cũ. Ghi nhận1/7ngày, cancel/retry, DATE→KPH
và resolved semantics giữ nguyên. CTA Thêm theo dõi chưa triển khai được bỏ
khỏi toolbar; không tạo chức năng thêm lô giả hoặc bulk/export mới.

Không còn big tabs Cảnh báo/Theo dõi, nút status ngoài list hoặc master-detail
CSS. [Scope/kiểm chứng](../delivery/compact03-date-report-items/plan.json).
