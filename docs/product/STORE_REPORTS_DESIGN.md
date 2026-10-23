# Báo cáo DATE — RPT01 revision 14

## RPT02 — Co.op Fresh khối mềm, đã duyệt23/10/2026

Owner yêu cầu áp giao diện mới cho vùng Báo cáo, từ main3b0da6c đã có
HEADER02/DATE03. Giữ toàn bộ semantics bên dưới: chọn lô, đổi/lưu/quản lý mẫu,
kỳ/phạm vi, snapshot độc lập, lịch sử theo store, Excel và in/PDF.

- Menu preset/mẫu cá nhân dùng pastel nhẹ + sheen/bóng thấp theo Home,
  viền trong suốt1px/radius18, icon48px mobile/54px desktop.
- Trang khai báo giữ page kit; thiết lập, danh mục mobile và lịch sử dùng holder
  trắng/viền `#dfe5e9`, dates/summary xám nhẹ. Chọn vẫn checkbox/radio explicit,
  tint mint nhẹ; nhãn DATE/xử lý và màu timeline giữ nguyên.
- Popup kỳ/phạm vi/tạo/lưu mẫu/chi tiết và picker đồng bộ holder; ô nhập giữ
  viền đủ tương phản/focus rõ. Không thêm blur hoặc thư viện/animation.
- Khi dock trở về inline, tiện ích Tra hạn tiếp tục tránh vùng hành động gần
  đáy màn. Reuse scroll/resize measurement hiện có, không thêm listener.
- Vật liệu mới chỉ áp ở screen; bản in giữ table/header/snapshot nguyên trạng.
  Sáu màn khác không nhận các rule của report.

Source CSS riêng `store-report-soft.css`, scope report/portal rõ ràng; recipe
Home tại [Visual DNA](STORE_APP_VISUAL_DNA.md). Owner đã cho phép merge đúng
0757b6d cùng UI02 bằng “merge với `0757b6d`”;
[scope/checks](../delivery/reports02-soft-surfaces/technical.md),
[nghiệm thu/tích hợp](../delivery/reports02-soft-surfaces/merge-2026-10-23.md).

Ngày 14/10/2026. Owner tạm chấp nhận bố cục trang riêng revision 3, yêu cầu
thêm menu loại báo cáo, lịch sử, chọn item và tạo/dùng lại template.
Follow-up: owner chọn ưu tiên hoàn thiện mẫu và lịch sử; revision 5 bổ sung
quản lý mẫu, tên báo cáo và truy vấn lịch sử, chưa mở slice tồn online.
**Owner tạm chấp nhận revision 14 và yêu cầu merge ngày 20/10/2026.**
Phạm vi vẫn mock/browser-local; backend báo cáo và dữ liệu tồn thật chưa có.

## Follow-up header compact cho mẫu đang mở — 20/10/2026

Owner yêu cầu áp cùng tinh chỉnh compact cho trang mở từng mẫu. Composer dùng
một StorePageHero: tên mẫu làm h1, subtitle Báo cáo DATE, Back về tất cả mẫu,
avatar theo anchor chung. Tìm kiếm/Đổi mẫu/Info cùng hàng trên nền xanh; dưới
360px Đổi mẫu hiện chevron có accessible name/title, tên mẫu vẫn đọc đầy đủ.
Tên dài/chữ lớn wrap và tăng chiều cao tự nhiên, không cắt title.

Kỳ/phạm vi, chọn lô, danh mục và CTA ở nắp trắng cuộn lên phủ cả hero. Cuộn
native, không pull-to-dismiss/listener gesture hoặc tab mẫu; focus vào tìm/đổi
mẫu đưa trang về đầu. Đây là thay đổi trình bày mới thay mô tả composer trắng
r13/r14 bên dưới; giữ toàn bộ semantics mẫu/kỳ/selection/history/snapshot/export.
Technical PASS không thay owner visual acceptance.
[Bàn giao](../delivery/header-style-rollout/handoff.md).

## Luồng

`#reports` mở menu nhỏ, không vào danh mục ngay. Ba preset ban đầu:
Báo cáo tổng hợp (mọi lô), Hàng cần chú ý (rule DATE attention), Hàng đã xử lý
(processing resolved). Nút Lịch sử mở các bản đã tạo; mẫu người dùng xuất hiện
trong Mẫu của bạn. Đây là collection ID string có thể mở rộng, không enum API
hoặc danh mục nghiệp vụ đã chốt. Phạm vi vẫn DATE, không thêm KPH/doanh thu/
chất lượng dữ liệu thành báo cáo khác.

Tổng hợp mở composer hiện có: kỳ, điều kiện DATE/xử lý, danh mục và CTA.
Các preset chỉ là cấu hình khởi đầu của cùng composer. Tổng hợp đổi điều kiện
sang attention/resolved và chọn lô sẽ tái tạo phạm vi của các preset tương ứng;
Lưu thành mẫu cho phép đặt tên phạm vi khác chưa có trong menu.

## Component tham khảo — revision 14

Theo yêu cầu tiếp tục tối ưu: giữ composer trang trắng, gom Đổi mẫu/Info lên
hàng điều hướng để tiêu đề đủ bề ngang. Search dùng chung trong composer,
picker và history, xóa giữ focus và không submit form cha. Kỳ/phạm vi dùng
StoreSettingsGroup/Row; không đưa nghiệp vụ DATE vào component.

Template picker thành adapter cho StoreChoiceSheet. Nội dung chọn có ba vùng:
search/count, list cuộn riêng và footer Hủy/Dùng mẫu. Chọn tạm/cancel/apply và
lỗi giữ kỳ được bảo vệ như r13; header/footer không bị đẩy đi khi list dài.
Portal có role Fresh riêng, không phụ thuộc CSS DATE. Native radio/useId,
focus ring rõ, không thêm gesture hoặc dependency.

[Hướng dẫn sử dụng/API/token/giới hạn](STORE_FORM_CONTROLS.md) là mẫu tham khảo
cho vùng chức năng khác. Component nằm local Store PWA, chưa chuyển vào shared
package hoặc thay hàng loạt UI cũ. R14 candidate chờ owner xem.

## Composer dựng lại — revision 13, thay thế round tab

Owner phản hồi r12 lỗi/xấu và yêu cầu bỏ để dựng lại. Đã xóa component tab và
CSS của r12. Composer là trang trắng cuộn thông thường dưới shell chung; không
ReportSurface/hero/cap/sticky/transform hoặc gesture kéo. Tiêu đề và tìm kiếm
nằm cùng header trắng. Nút về Tất cả mẫu và Info riêng, đổi mẫu qua sheet.
Menu thẻ solid, history/snapshot và nghiệp vụ đã có vẫn giữ.

Mẫu được chọn tạm bằng radio trong hộp tìm kiếm, chỉ đổi khi Dùng mẫu. Hủy/
Escape không sửa period, filter, search hoặc selection của draft. Hộp mở ở đầu,
không tự focus radio cuối thư viện/không tự mở bàn phím, luôn thấy ô tìm/đóng.
Search thư viện 60 mẫu dài, giữ tên đầy đủ và empty state. Native radio có
keyboard/focus; sheet/focus restoration dùng StoreSheet/Radix hiện có.

Lỗi lifecycle của r12: đổi mẫu sinh key UUID mới, unmount toàn Workspace và
khởi tạo lại kỳ tháng mặc định. R13 bỏ key động cho compose; handler áp mẫu
cập nhật recipe filter/selected IDs và xóa query, giữ period. Chuyển sang bản
snapshot vẫn remount theo ID để bảo vệ snapshot. Không thay API/data rules.

Thiết lập kỳ và phạm vi gộp một group hai hàng; phạm vi mở modal DATE/xử lý
hiện có, không thêm select trùng trên trang. Danh mục giữ count/checkbox/menu
chọn có scope, nhãn DATE/xử lý và nút neo. Không dùng lượng tồn giả. Kỳ vẫn là
snapshot tại ngày chốt, không lọc HSD hoặc giả lập lịch sử cuối kỳ.

R13 là candidate mới. Các mô tả r12 bên dưới chỉ là lịch sử đã bị loại bỏ.

## Composer tối giản, tên/tìm và tab — follow-up revision 12

Theo yêu cầu owner ngày 18/10/2026: nền xanh chỉ tên mẫu và tìm trong danh mục,
bỏ khung chọn mẫu lớn/nhãn nguồn lặp; thông tin nguồn vẫn qua nút Info. Hero
composer cuộn tự nhiên, tránh search ở lớp sau bị nắp che khi focus từ cuối
trang. Tìm kiếm có nút xóa, trả focus vào input; không xóa selection ngoài query.

`ReportTemplateTabs` nằm đầu phần trắng, gồm nút về menu, tối đa hai điểm đến
nhanh và Xem thêm. Dưới 360 px chỉ hiện mẫu đang dùng; không nhồi toàn bộ thư
viện vào tab. Các button là navigation, aria-current=page; menu Radix xử lý
keyboard/Escape/focus, có thể cuộn với 60 mẫu dài. Tên đầy đủ luôn ở hero và
accessible name; nhãn tab chuẩn rút gọn, tên dài có ellipsis. Dropdown chỉ
mount danh sách khi mở. Không thêm package hoặc primitive chung.

Kỳ và lọc trên một hàng; nhóm DATE ở hàng dưới trên mobile, cùng hàng trên
desktop. Ngày chốt nằm trong modal tạo/Info và bản snapshot, không lặp ở
composer. Giữ semantics kỳ là snapshot ngày chốt, không biến thành lọc HSD.
Danh mục bỏ container lồng và khung xanh quanh mỗi lô: hàng trắng/hairline,
checkbox vẫn chỉ trạng thái chọn, giữ thanh màu tình trạng và nhãn riêng.
Bố cục dùng token/typography/Fresh control hiện có, không thêm blur/glass,
font hoặc animation mới. Menu ban đầu vẫn giữ thẻ solid r11; history/snapshot
và quy tắc không vuốt ẩn khai báo giữ nguyên.

Gate browser ba viewport: hero/search không có trigger chọn mẫu, tab hữu hạn
với 60 mẫu, điều hướng/popup dài, clear search/selection, lịch, focus khi cuộn,
150% chữ, contrast/reflow và hồi quy tạo/lưu mẫu/history/export/nút neo.

## Thẻ mẫu solid và cuộn khai báo — follow-up revision 11

Owner phản hồi r10 chưa đạt ngày 18/10/2026. Thẻ preset/mẫu cá nhân dùng nền
màu liền khối mint/peach/sky/lilac rõ hơn, bỏ viền mảnh, radius 18 và icon tròn
54 px màu đậm/chữ trắng theo item Home. Chữ mô tả dùng ink tối để đạt tương
phản trên cả nền thường/hover. Giữ tên/mô tả, không thêm loại báo cáo.

Composer (mẫu đang khai báo) đặt `pullToDismiss=false`: không đăng ký listener
kéo/vuốt, không transform/animation và không có grip. Nắp trắng vẫn giữ cách
xếp lớp; cuộn trang native. Nút “Chọn mẫu khác” thay grip, hỗ trợ pointer và
Enter, gọi navigation rõ ràng. Các lô đã chọn không đổi khi vuốt xuống. History
và bản snapshot giữ gesture riêng trước đó. Không đổi nghiệp vụ lưu mẫu,
selection, snapshot, Excel/PDF, DATE hoặc phần Home.

Browser gate kiểm không có listener touch/pointer trên cap của composer,
pull-down dài không đóng hoặc đổi selection, cuộn tự nhiên, dropdown/kỳ và
nút điều hướng; kiểm contrast/reflow ở 390/1440/320, gồm mẫu cá nhân.

## Điều khiển mẫu và kỳ — follow-up revision 10

Bộ chọn kỳ và ngày chốt chuyển vào đầu nắp trắng, cùng lớp danh mục, để không
bị nắp phủ như vị trí hero r9. Nền xanh chỉ giữ loại/mẫu đang dùng: control có
icon báo cáo, nhãn “Mẫu báo cáo”, tên 20 px, viền và nền phản hồi khi mở/hover;
chevron đổi trạng thái. Dùng DropdownMenu hiện có, không thêm loại báo cáo.
Thông tin nguồn giữ nút riêng. Lịch ngày tiếp tục dùng portal z=100 trên modal
z=50; không nâng z-index toàn hero hoặc thay gesture. Escape đóng lịch trước
modal, chọn ngày trả focus về nút mở lịch. Tôn trọng reduced motion.

Browser gate riêng kiểm vị trí DOM/lớp hit-test, chọn ngày/nhập dd/mm/yyyy,
Escape/focus, chọn mẫu bằng phím và chuột, 150% chữ, contrast ở 390/1440/320.
Các số đo r9 bên dưới là baseline; kết quả r10 ở bàn giao.

## Nắp trượt và hiệu năng — follow-up revision 9

Owner tạm đạt revision 8 và yêu cầu nền xanh/nắp trắng như Home/Login:

- Trang chọn loại giữ nền trắng. Ba preset có nền mint/peach/sky; mẫu cá nhân
  dùng lilac. Màu phân loại module, không thay tình trạng DATE.
- Loại đang thao tác trở thành heading/dropdown 20 px trên nền xanh; đổi loại
  qua menu dùng collection preset/custom hiện có. Kỳ/ngày chốt nằm cùng hero.
  Danh mục lọc/chọn và nút neo nằm trong nắp trắng overlap 24/radius 26.
- Lịch sử dùng cùng ReportSurface: tiêu đề/đếm trên xanh, tìm/tháng/list trong
  nắp trắng. Bản snapshot cũng dùng nắp, giữ nút Về lịch sử riêng.
- Vuốt xuống trên grip, hoặc trên nội dung khi page ở đầu, sẽ kéo nắp. Kéo đủ
  120 px, hoặc flick >=48 px với tốc độ xuống >=0,65 px/ms, thu về menu loại.
  Vuốt ngắn trả lại vị trí; cuộn lên và cuộn nội dung khi chưa ở đầu vẫn native.
  Grip cũng là button 44 px, click/Enter không cần gesture. Bản báo cáo thu về
  menu bằng grip; back riêng vẫn về history. Không tự lưu/tạo khi đóng.
- Touch một ngón, khóa theo trục dọc sau 12 px; không chiếm input/combobox hoặc
  popup/modal. Drag ngăn click rơi vào row/control. Cancel/multitouch trả nắp.
  Pointer mouse/pen trên grip dùng capture; touch dùng native listeners scope
  cap, chỉ preventDefault khi đã nhận drag. Không dùng gesture library mới.
- Transform/opacity 160–180 ms, reduced motion bỏ chuyển động settle/enter.
  Mỗi frame chỉ ghi translate; không setState trong move, không animate layout,
  không backdrop blur. will-change chỉ trong lúc chuyển; cleanup RAF/timer và
  listeners khi unmount. Menu và cap không đồng thời giữ hai cây nội dung.
- Dock nổi ẩn trong lúc ancestor đang transform để tránh fixed containing
  block đổi vị trí; hiện lại khi cap nghỉ. Node nút vẫn chỉ một bộ như r8.

Kiểm 1.000 lô/CPU chậm 4× cho thấy baseline r8 mở ~8,94 s, 65.498 DOM nodes.
R9 memoize đánh giá/lọc/tập chọn, dùng Set thay tìm ID lồng nhau, chỉ mount card
hoặc table theo media. Danh sách screen đầu 40, thêm 40 mỗi lần; master đang
xem tác động đúng số lô đã render, menu toàn danh mục vẫn trên toàn eligible.
Search tìm cả tập, lựa chọn ngoài query vẫn giữ. Lịch sử giữ phân đợt 10 như r8.

Bản tạo/Excel dùng toàn tập được chọn, không cắt theo rowLimit. Print chuyển
đồng bộ qua media store + beforeprint/afterprint, dựng toàn snapshot; bảng in
chỉ text trạng thái, không control/SVG trang trí. Sau in về 40 trên screen.
Gate stress kiểm snapshot và print đủ 1.000, tìm lô ngoài đợt đầu, 40→80,
0 thay đổi child tree lúc kéo, long task budget 150 ms lúc gesture, và 6 vòng
mở/đóng với DOM ổn định/retained heap dưới 6 MiB. [Số đo](../delivery/rpt01-report-design/handoff.md)
là evidence Chromium mock, không bảo đảm FPS/INP/keyboard trên thiết bị thật.

## Dropdown, chọn lô và nút neo — follow-up revision 8

- Shared `Select` dùng cho nhóm DATE, tháng chốt và hai lựa chọn lưu mẫu.
  Cùng trigger 48/radius 14, menu option 44, check/selected, collision/scroll,
  Arrow/Home/End/typeahead/Enter/Escape/focus do Radix giữ. Menu hành động dùng
  `DropdownMenu` riêng semantics nhưng cùng presentation. Giá trị rỗng ở app
  vẫn hợp lệ; field có name submit raw value, không mất leading zero.
- `StoreSelectionBar` có master checkbox unchecked/mixed/checked cho **các lô
  đang hiển thị**. Chọn/bỏ chọn master chỉ tác động kết quả hiện tại. Menu có
  chọn, bỏ chọn và đảo lựa chọn đang xem; nhóm riêng chọn toàn danh mục hoặc
  bỏ chọn toàn bộ. “Toàn danh mục” là tập phù hợp điều kiện DATE/xử lý, không
  vượt filter/store và không mở cơ chế chọn xuyên trang cho KPH online.
- Lựa chọn ngoài query được giữ; toolbar đếm tổng + phạm vi đang xem. Action
  không có tác dụng bị disabled. Helper `updateSelection` xử lý ID thuần trong
  Store; null vẫn có nghĩa theo toàn tập phù hợp, [] là không chọn gì.
- `StoreActionDock` giữ **một bộ nút DOM**. Khi vị trí tự nhiên ở ngoài màn,
  dock fixed theo bề ngang nội dung và trên nav +12; khi tới cuối danh sách,
  trở về inline trong placeholder giữ đúng chiều cao. Summary đếm lô và nút
  “Lưu mẫu”/“Tạo báo cáo” luôn nhìn thấy, không chọn lô thì disabled.
- ResizeObserver/resize/scroll cập nhật vị trí và chiều cao, không dùng hai bộ
  nút hoặc height cố định. Focus dưới dock được cuộn ra vùng trống; hỗ trợ
  safe-area/reflow/print. Khi phát hiện bàn phím qua visualViewport + input,
  dock floating ẩn tạm; nhánh này chưa xác minh trên bàn phím OS thật.
- Notice lưu mẫu rút gọn, xóa khi phạm vi/lựa chọn thay đổi; không báo một
  cấu hình đã sửa là vừa lưu. Giữ holder/default names và snapshot lịch sử.

Chuẩn được tách ở packages/ui (Select/Menu) và app (selection/dock). Lượt này
áp dụng ở Báo cáo; các consumer KPH/DATE/Admin cũ không bị đổi semantics hàng
loạt. [Quy ước sử dụng](../../packages/ui/DESIGN_SYSTEM.md) và
[catalog](STORE_APP_COMPONENT_CATALOG.md) ghi API/ranh giới để áp dụng tiếp.

## Đồng bộ giao diện Fresh — follow-up revision 7

Dùng hệ thống hiện có làm chuẩn, chưa tạo thư viện hoặc theme riêng:

- Tiêu đề 17/24/650 như DATE/KPH; tìm kiếm 48 px, radius 14 và token Fresh.
- Bộ lọc reuse `store-date-filter`, nhóm tình trạng/xử lý, lựa chọn có check,
  selected xanh, badge số điều kiện, reset và Xong cùng hàng. Thay đổi áp dụng
  ngay, select nhóm trên trang đồng bộ; giữ query tìm và lựa chọn lô.
- List dùng `ListItemMarker` + `getDatePhaseTone`, bar 3×36 mobile/3×24 desktop,
  gutter 28/inset 12. Có cả nhãn DATE và xử lý. Checkbox 20 trong target 44,
  selected border/background giống KPH; chi tiết vẫn là nút riêng.
- Sheet tạo bản có khối Summary kỳ/ngày chốt/số lô; chọn kỳ và lưu mẫu nhóm
  trong nền canvas, chân xác nhận tách bằng border và giữ vùng chạm 48 px.
  Kỳ preset có trạng thái selected; quản lý mẫu có check như choice Fresh.
- Thẻ lịch sử dùng cùng khung icon/thẻ menu. Lỗi tên liên kết với input bằng
  `aria-describedby`; heading nhận focus khi điều hướng nhưng không vẽ viền
  native quanh cả hàng, control vẫn giữ focus ring.

Chỉ sửa ba file report hub/composer/CSS. Không đổi StoreSheet, packages/ui,
DATE/KPH source hoặc rule. Gate `check-report-fresh.cjs` đối chiếu computed
styles với DATE thật, kiểm flow/filter/select/focus và 150% chữ. Đây là
candidate implementation, không tuyên bố owner đã nghiệm thu.

## Tên sẵn dùng — follow-up revision 6

Owner yêu cầu các chỗ đặt tên có holder vì đa số không cần đổi. Tên được
**điền sẵn thật**, có placeholder cùng gợi ý khi xóa, không chỉ chữ mờ bắt
người dùng nhập lại. Bỏ trống/whitespace rồi lưu sẽ dùng tên gợi ý:

- Báo cáo: tên mẫu + khoảng kỳ; giới hạn 120 ký tự. Dùng lại báo cáo không
  lặp suffix kỳ tự sinh cũ, mà thay bằng kỳ mới.
- Mẫu mới: tình trạng DATE/xử lý, thêm số lô nếu giữ ID cụ thể. Mẫu theo điều
  kiện không đóng số lô vào tên. Trùng thì thêm (2), (3),… không ghi đè.
- Cập nhật/đổi tên mẫu: giữ tên hiện tại nếu không thay. Nhân bản có tên bản
  sao duy nhất như trước; xóa tên vẫn dùng holder bản sao.

Đổi kiểu lưu danh mục chỉ cập nhật tên tự sinh chưa được sửa; giữ tên người
dùng đã gõ. Tên tùy chỉnh trùng mẫu khác vẫn báo lỗi. Các sheet tên ban đầu
focus nút Lưu/Tạo; Enter chấp nhận mặc định, muốn sửa vẫn focus/nhập bình
thường. Không tự đổi tên hoặc dữ liệu báo cáo/mẫu đã lưu.

## Chọn item

Item ở revision này là **từng lô**, không phải từng cột hay một SKU gộp nhiều
lô. Mặc định chọn toàn bộ lô phù hợp điều kiện. Có checkbox riêng từng lô,
checkbox tổng cho kết quả đang xem và menu chọn theo phạm vi, cùng đếm Đã chọn / tổng lô. Không chọn lô nào thì
không tạo/lưu mẫu. Chọn checkbox không mở modal; chi tiết là nút riêng.

Nhóm DATE/xử lý xác định danh mục; chỉ lô được chọn và còn phù hợp được xuất.
Tìm kiếm là thao tác xem trong danh mục, **không thay lựa chọn hoặc phạm vi
xuất**. Lô đã chọn ngoài kết quả tìm có đếm riêng ngay trên danh mục. Bản tạo
và Excel/PDF chỉ chứa chính xác tập chọn, không query tìm đang xem.

## Mẫu

Lưu thành mẫu mở sheet ngắn: tên và Danh mục cho lần sau:

- Theo điều kiện lọc: lần sau lấy mọi lô hiện tại phù hợp, gồm cả lô mới.
- Đúng các lô đang chọn: giữ ID lô, không tự thay bằng lô khác hoặc mọi lô
  cùng SKU. Nếu ID không còn, thông báo số lô thiếu; không suy diễn sản phẩm.

Mẫu giữ điều kiện DATE/xử lý và cách chọn lô, không giữ số tồn hoặc số ngày
cũ. Mỗi lần mở bắt đầu kỳ tháng hiện tại; đổi kỳ trước khi tạo nếu cần.
Tên sau khi áp dụng gợi ý không trống; tên tùy chỉnh trùng (không phân biệt
hoa thường) bị chặn, tối đa 80 ký tự.
Mẫu mới không sửa preset và không thay report history đã có.

Nút ba chấm ở mẫu cá nhân mở Đổi tên / Nhân bản. Nhân bản tạo ID riêng và
copy điều kiện/danh sách lô; đổi bản này không đổi bản gốc. Gợi ý tên bản sao
không trùng và không vượt giới hạn. Preset tiêu chuẩn không có thao tác sửa.
Trong composer của mẫu cá nhân, Lưu mẫu mặc định cập nhật đúng ID đang dùng;
có thể chọn Tạo mẫu mới. Giữ tên của chính mẫu đó được phép, nhưng tên trùng
mẫu khác/preset vẫn bị chặn. Sau cập nhật, tên hiển thị và tên mặc định cho
báo cáo mới lấy bản mới nhất. Báo cáo cũ giữ nguyên tên và dữ liệu snapshot.

## Lịch sử

Bấm Tạo bản báo cáo mở sheet tên sẵn dùng (tối đa 120 ký tự), xem kỳ
và số lô. Tạo và lưu lịch sử ghi một snapshot mới: ID, tên, kỳ, ngày chốt, cửa hàng,
thời điểm tạo, bộ lọc và copy lô đã chọn. Danh sách mới nhất trước; mở lại để
xem, Excel hoặc In/Lưu PDF. Dùng lại cấu hình mở composer cho một báo cáo mới,
không sửa/ghi đè bản cũ. Sửa DATE sau khi tạo không thay bản trong lịch sử.

Lịch sử tìm theo tên, ID hoặc khoảng kỳ hiển thị; kết hợp lọc tháng **ngày
chốt** (`asOf`), không đọc ngược timestamp hiển thị theo locale. Đếm kết quả
trên toàn bộ lịch sử đúng store, giữ thứ tự mới trước. Hiện 10 bản đầu và
Xem thêm từng 10 bản; đổi tìm/lọc reset phần hiển thị, không đổi bản xuất.
Có empty/reset rõ ràng. Tạo bản mới bỏ tìm/lọc cũ để thấy bản vừa tạo.

Bản thử StoreApp dùng fixture tổng hợp. Lịch sử và mẫu người dùng lưu riêng
store tại localStorage version 1, key `coopfood:mock-date-report-library:v1:<storeCode>`;
giữ qua chuyển màn hình và reload trên cùng browser/origin. UI ghi Dữ liệu
mẫu / Trên trình duyệt này. Chỉ source raw frozen lots được lưu; đánh giá dùng
ngày chốt đã lưu, không dùng ngày hôm nay khi mở lịch sử. Không lưu ảnh/PII.

Zod kiểm dữ liệu đọc, store code phải khớp; dữ liệu lỗi/foreign không bị tự
xóa hoặc ghi đè. Không ghi được thì báo rõ giữ trong phiên, không tuyên bố đã
lưu bền. Không có đồng bộ nhiều tab, server, tài khoản hoặc thiết bị. Đây là
repository **chỉ cho mock UI**; PostgreSQL vẫn là authority của app online.
Không áp cơ chế localStorage này vào app online hoặc Pilot như contract mới.

## Semantics DATE và tồn

Dùng chính `dateLots` của StoreApp. `assessDateLot` và mốc NSX/cảnh báo/hạn
lùi/HSD không đổi; xử lý và tình trạng DATE độc lập. Ảnh tham khảo không đổi
rule thành các nhóm phần trăm. SKU/lô giữ chuỗi, thiếu NSX không suy timeline.

Kỳ chứa snapshot tại ngày chốt, không lọc tồn theo HSD, không cộng tồn qua
ngày. Kỳ đang mở dùng ngày HCM hiện tại; kỳ ngoài ngày hiện tại chưa có tồn
lịch sử để tạo báo cáo mới. Bản đã tạo trước đó vẫn mở trong Lịch sử bằng
snapshot riêng, không phụ thuộc dữ liệu hiện tại. Tuần thứ Hai–Chủ nhật.

Chưa có số lượng tồn/đơn vị hoặc sổ tồn cuối kỳ. Tồn hiện —; Excel ghi Chưa
có, không 0. “Đã xử lý” không tự trừ tồn. Excel giữ SKU/lô string, tên bắt đầu
bằng = không trở thành công thức; kèm title/kỳ/ngày chốt/bộ lọc/nguồn mẫu.
PDF qua In/Lưu PDF của browser, không dịch vụ sinh PDF server.

## Phần kế tiếp

Owner thử menu → Tổng hợp → chọn lô → lưu mẫu → tạo → Lịch sử → dùng lại.
Preview <http://127.0.0.1:4221/#reports>.
Sau UI: contract số lượng/đơn vị, snapshot cuối kỳ và report persistence online
với quyền store/region/chain, audit/retention, cross-store/region deny tests.
Không API/schema/scheduler/engine báo cáo, không Pages hoặc Figma cutover.

[Bàn giao/checks](../delivery/rpt01-report-design/handoff.md).
