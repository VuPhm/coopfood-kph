# Nhãn màu cho các danh sách — v1 và nhân rộng

Thiết kế theo yêu cầu owner ngày **12/10/2026**: cơ chế nhất quán cho các list
hiện có, triển khai trước KPH. Đây là quy ước trình bày Co.op Fresh; không đổi
enum, rule, quyền hoặc trạng thái lưu trữ. Owner đã xác nhận thích phong cách nhãn v1 ngày 12/10/2026. Technical PASS
và nghiệm thu owner cho từng phần mở rộng giữ riêng. Màu nghiệp vụ ưu tiên hơn màu pastel nhận diện module.

## Cơ chế

Một nhãn gồm **chữ + icon + nền màu nhẹ**, viền nhẹ; không tô cả dòng. Chữ và
icon cho phép phân biệt khi khó nhận biết màu. Vị trí/kích thước giống nhau
trên thẻ và bảng; nhãn là thông tin đọc, không thêm một control để bấm.

Mỗi chiều thông tin được đặt tên rõ: tình trạng, biện pháp, trạng thái duyệt.
Tên chiều có trong tooltip và text cho trình đọc màn hình; chữ giá trị luôn
hiển thị đầy đủ. Nhãn dài được xuống dòng, không cắt mất nội dung “Khác”.

| Vai trò / tone | Chữ / nền | Contrast chữ | Ý nghĩa |
| --- | --- | --- | --- |
| Trung tính / `neutral` | `#475467` / `#f2f4f7` | 6,98:1 | Khác/chưa phân loại, không duyệt, biện pháp HỦY |
| Thông tin / `info` | `#175cd3` / `#eff8ff` | 5,57:1 | Loại hành động hoặc thông tin cần nhận biết, như ĐỔI |
| Luồng xử lý / `process` | `#6941c6` / `#f4f3ff` | 6,02:1 | Luồng riêng như XUẤT TRẢ, lịch đang chờ thực thi |
| Cần chú ý / `warning` | `#884312` / `#fff0e6` | 6,60:1 | Cận date, tình trạng cần xử lý, chờ duyệt |
| Lỗi/hết hạn / `danger` | `#b42318` / `#fef3f2` | 6,05:1 | Hết HSD hoặc lỗi được xác nhận trong dữ liệu |
| Hoàn tất / `success` | `#00724e` / `#e6f7f2` | 5,39:1 | Đã duyệt/đã xử lý/hợp lệ trong đúng chiều thông tin |

Contrast bảng tính trên cặp màu đặc, không làm tròn khi so ngưỡng; browser
kiểm màu render thực. Không dùng màu xanh “Đã duyệt” để khẳng định hàng an toàn.
Một phiếu Hết HSD đã duyệt vẫn có hai nhãn đỏ và xanh ở hai chiều riêng.
Tím và xanh dương phân biệt loại luồng; không khẳng định luồng đã hoàn tất.

## Triển khai KPH trước

| Chiều | Giá trị accepted | Nhãn |
| --- | --- | --- |
| Tình trạng | Cận date | Cam + đồng hồ |
| Tình trạng | Hết HSD | Đỏ + lịch có dấu X |
| Tình trạng | Rách bao bì, Xì chân không, Dập úng, Thối mốc | Cam + tam giác chú ý, giữ chữ tình trạng cụ thể |
| Tình trạng | Khác/nội dung tùy chọn | Xám + dấu hỏi |
| Biện pháp | HỦY | Xám + dấu cấm; là biện pháp ghi nhận, không phải nút xóa phiếu |
| Biện pháp | ĐỔI | Xanh dương + hai chiều |
| Biện pháp | XUẤT TRẢ | Tím + mũi tên quay lại |
| Biện pháp | KHÁC/nội dung tùy chọn | Xám + dấu hỏi |
| Duyệt | Chờ duyệt / Đã duyệt / Không duyệt | Cam/đồng hồ, xanh/check, xám/dấu trừ |

Đã áp dụng vào [`StoreKphList`](../../apps/store-pwa/src/store-kph-list.tsx)
mobile và desktop của Store Fresh, gồm skeleton dùng cùng list. Giữ ba nhãn
theo thứ tự tình trạng → biện pháp → duyệt. Desktop dùng ba cột sẵn có;
mobile giữ hàng wrap, chữ 12px và icon 14px. Selection/focus giữ màu và viền
riêng của control, không dùng nhãn để biểu diễn selection.

[`KphListLabel`](../../apps/store-pwa/src/store-kph-label.tsx) giữ mapping ở
app. Nhận dạng chính xác enum hoặc nhãn accepted, hỗ trợ case/trim/NFC, không
tìm từ khóa trong chi tiết OTHER. Giá trị chưa nhận dạng giữ nguyên chữ và
nhận neutral; không suy diễn trạng thái mới. Không đổi tone functions trong
`packages/kph-rules`, enum/default của form, API, workbook hay consumer online/Pilot.

## Mở rộng KPH: palette choice và thanh màu cạnh trái — 12/10/2026

Owner yêu cầu phát triển lại bộ màu choice đã có, thay việc dùng chung cam;
đổi dấu tròn thành nhãn cạnh trái dễ thấy hơn, vẫn cân nhắc Apple-like.
Thiết kế giữ thẻ trắng/viền nhẹ, thanh màu mảnh bo tròn, không tô cả dòng.
Bản dấu tròn và choice theo palette nhãn là mốc trước, đã được thay thế.

- `ListItemMarker variant="bar"` trong KPH rộng 3px, nằm ở rãnh riêng cách mép
  12px, cách chữ/control tối thiểu 12px. Mobile dài cố định 36px, theo khối
  tên/SKU (offset 20px); desktop dài 24px, căn giữa dòng và căn lề heading/body.
  Màu accent rõ hơn cặp ink, được
  kiểm contrast ≥3:1 trên nền thực. Khi chọn phiếu, bar vẫn ở cạnh trái ngoài
  checkbox, không lấn vùng bấm. Variant dot giữ cho consumer tùy chọn sau này.
- Bar lấy **tình trạng đã ghi nhận**: cam cần chú ý, đỏ Hết HSD, xám Khác/
  chưa nhận dạng. Approval vẫn là nhãn riêng; duyệt không đổi bar. Bar trang
  trí aria-hidden, không tab stop và luôn đi cùng nhãn tình trạng chữ/icon.
- Choice giữ lưới hai cột; tình trạng Khác ở hàng cuối chiếm toàn chiều ngang.
  Biện pháp dùng 2×2 ở TPCN hoặc một hàng ở TPTS. Giữ thứ tự, nhãn và default;
  OTHER vẫn giữ nội dung khi đổi lựa chọn.
- Palette choice **định danh option**, lấy trực tiếp tone trong `KPH_OPTIONS`:
  Cận date cam; Rách bao bì/Xì chân không/Dập úng/Thối mốc đỏ; Hết HSD/Khác
  xám. HỦY đỏ, ĐỔI xanh lá, XUẤT TRẢ xanh dương, KHÁC xám. Icon tình trạng
  đặc trưng là kiện hàng/gió/trái táo/biohazard, giữ chữ để diễn giải rõ.
- Palette choice khác palette trạng thái record: ví dụ choice Hết HSD xám
  theo bộ cũ nhưng phiếu Hết HSD có nhãn/bar đỏ; choice HỦY đỏ là radio ghi
  biện pháp, không phải nút xóa. Màu ĐỔI xanh lá không nói hàng an toàn/đã duyệt.
  Ba nhãn chữ/icon v1 trong list được giữ nguyên.
- Selected dùng nền pastel/viền theo option và check riêng; focus outline
  độc lập. Native radio/fieldset/legend, ô cao ít nhất 60px và chữ wrap giữ
  nguyên. `KphChoiceContent` chia sẻ form/skeleton, không giữ state/register.

Owner đã duyệt KPH bằng “đạt, checkp, nhân bản” ngày 12/10; checkpoint local
`5fdfa3e`. Các list nhân rộng có gate riêng; [bàn giao palette/bar](../delivery/figma-mobile-implementation/kph-choice-bars.md),
[tối ưu spacing hiện tại](../delivery/figma-mobile-implementation/kph-marker-spacing.md).

## DATE theo mốc Tra hạn — follow-up riêng 12/10/2026

Theo yêu cầu mới của owner, DATE dùng hai chiều nhãn: Chưa cảnh báo success,
Cảnh báo/Đến hạn lùi warning, Hết HSD danger, Chưa đến NSX info, Thiếu NSX
neutral, Ngày không hợp lệ danger. Xử lý dùng Mở warning, Đã ghi nhận info,
Đã xử lý success; lô hết hạn đã xử lý vẫn giữ nhãn đỏ. Timeline hạn dùng chỉ trong chi tiết,
dùng chung Tra hạn; danh sách không có progress/%. Yêu cầu nhân bản mới
“Toàn bộ nhãn màu và thanh nhãn” bổ sung thanh cạnh trái trang trí theo nhãn
DATE, không phụ thuộc trạng thái xử lý. Gate DATE riêng,
không thay nghiệm thu KPH. [Hướng product](DATE_MILESTONE_MODEL.md).

## Bản đồ nhân rộng — triển khai 12/10/2026, chờ owner xem

| List hiện có | Mapping khi triển khai lượt riêng | Bất biến |
| --- | --- | --- |
| KPH online/Pilot history | Dùng cùng mapping ba chiều; approval control vẫn là control có quyền/busy | Page-local selection, backend scope, Pilot authority riêng |
| Lịch sử tra hạn lùi | Nhãn theo snapshot kết quả đã tính, unknown neutral | Không tính lại lịch sử theo ngày hiện tại; giữ 20 lần trong phiên |
| Admin identity | Đang hoạt động success, Đã vô hiệu hóa neutral; role là thông tin info/process | Role/active label không tạo quyền, không tiết lộ scope ngoài response |
| Admin lifecycle | Đã lên lịch process, Đến hạn warning, Đã thực thi success, Đã hủy neutral | Guard/ngày đến hạn theo contract; không tự execute |
| Admin catalog batch/dòng | Hợp lệ success, Có lỗi danger, Đang xử lý process, Đã publish info | Staging hợp lệ không đồng nghĩa published; giữ lỗi dòng và khả năng đọc identifier |

Bảng phủ các nhóm list trong catalog hiện có, không tạo module hoặc route mới.
Admin/Pilot có gate riêng; bảng trên đã triển khai cả chữ/icon và bar.
Lịch sử Tra hạn giữ nhãn cũ An toàn/Sắp đến hạn lùi/Cần lùi hàng/Đã hết hạn sử dụng
và màu theo snapshot. Admin row đọc status API, không suy Hợp lệ từ thiếu message;
WARNING nhận nhãn Cảnh báo nếu xuất hiện trong response. Native select duyệt
online/Pilot giữ quyền/busy/callback, chỉ đổi palette; consumer read-only dùng ListLabel.
[Bàn giao và kiểm chứng](../delivery/list-label-rollout/handoff.md).

## Quản lý component

[`ListLabel`](../../packages/ui/src/list-label.tsx) compose từ `Tag`; props
`tone`, `icon`, `category`, children và native span props. Icon được ẩn khỏi
accessibility tree, category vẫn là text. Primitive không biết enum nghiệp vụ,
không có callback đổi state và không thêm tab stop. `Tag` cũ giữ nguyên API/màu.

[`list-label.css`](../../packages/ui/src/list-label.css) giữ các biến cục bộ
`--cf-label-surface/ink/border/accent` theo tone trong `ui-label-palette`, dùng chung
cho ListLabel, ListItemMarker và choice Fresh; không
thay token brand/status global. Khi thêm consumer, dùng cùng primitive; feature
giữ bảng mapping riêng và source truth hiện có. Không thêm tone cho từng SKU,
cửa hàng hoặc từng dòng. Tone mới cần lý do phân biệt thực tế và kiểm contrast.

Nguồn semantics: [contract index](STORE_APP_CONTRACTS.md),
[domain rules](DOMAIN_RULES.md), [history contract](HISTORY_PAGING_CONTRACT.md).
Nguồn presentation: [Visual DNA](STORE_APP_VISUAL_DNA.md).
Kiểm chứng/file bàn giao: [KPH nhãn màu](../delivery/figma-mobile-implementation/kph-list-labels.md).

Pattern CSS `ui-list-marker-card` / `ui-list-marker-cell` dành gutter trái
28px; bar rộng 3px, inset 12px, khoảng cách nội dung ≥12px. Card mobile dài
36px, desktop 24px; cell bảng 24px căn giữa. Card giữ padding chiều khác,
cho phép `--ui-list-marker-top` để canh khối tên. Không tự tô nền selection.
KPH Fresh giữ grid/checkbox đã accepted, API marker dot/bar không đổi.

## KPH Store Fresh — nhãn đã duyệt cùng revision5,22/10/2026

Mobile giữ nhãn12px/line16px/min22px/icon14px/bar28px, một strip cuộn ngang có
fade khi còn nội dung, ẩn scrollbar; trang không cuộn ngang. Desktop giữ nhãn26px/
icon14px/bar24px. Theo yêu cầu explicit, OTHER trên cả hai layout ellipsis;
mobile cap146px, desktop theo cột. Title native khi hover, DOM/accessible text
và chi tiết phiếu giữ nguyên văn. Nhãn chuẩn vẫn đầy đủ; không đổi mapping,
quyền, token shared, form choice hoặc dữ liệu. Grouping là tùy chọn mặc định bật theo feedback revision5; tắt nhóm thì ngày
căn trái trong cụm metadata mobile.
Xem [thiết kế/phạm vi](KPH_COMPACT_HISTORY.md) và [owner acceptance](../delivery/kph02-merge-2026-10-22.md).
