# Behavior inventory của Tool KPH legacy

> Bản mang sang cho repository reboot. Các trace ID là contract/evidence key;
> milestone cũ chỉ là bối cảnh. Xem `../NEXT.md` cho scope đang hoạt động.

## Cách đọc

Inventory được quan sát từ baseline legacy ghi trong
[UI DNA](UI_DNA.md). Phân loại:

- `Giữ`: khóa bằng test trước khi viết lại.
- `Cải tiến`: giữ ý định/nghiệp vụ nhưng thay implementation có acceptance
  criteria.
- `Loại bỏ`: nợ kỹ thuật hoặc authority không phù hợp hệ thống đa cửa hàng.
- `Chưa chốt`: không suy đoán; cần quyết định sản phẩm/nghiệp vụ.

Các ID dưới đây là trace key cho fixture, acceptance test và screen map; không
phải API identifier.

## Phiếu KPH

| ID | Hành vi quan sát được | Phân loại / hợp đồng mới |
|---|---|---|
| KPH-01 | Workspace có hai entry “Thực phẩm khô & khác” (`TPCN`) và “Thực phẩm tươi sống” (`TPTS`) | Giữ; chọn loại trước khi mở form |
| KPH-02 | TPCN chỉ hiện tình trạng Cận date, Hết HSD, Rách bao bì, Xì chân không, Khác; mặc định Cận date | Cải tiến đã xác nhận 2026-08-27; khóa bằng golden test conditional options |
| KPH-03 | TPTS hiện Dập úng, Thối mốc, Cận date, Hết HSD, Khác; mặc định Dập úng; không còn lựa chọn Hư hỏng | Cải tiến đã xác nhận 2026-08-27 |
| KPH-04 | TPCN hiện biện pháp HỦY, ĐỔI, XUẤT TRẢ, KHÁC; mặc định hiện hành là HỦY sau reset form | Giữ danh sách và mặc định HỦY; đã khóa bằng fixture `KPH-OPT-01` |
| KPH-05 | TPTS chỉ hiện HỦY và KHÁC; mặc định HỦY | Giữ |
| KPH-06 | Chọn tình trạng Khác mới hiện nội dung tình trạng; trống được normalize thành “Khác” | Giữ interaction; nội dung là optional, trống giữ nhãn “Khác” |
| KPH-07 | Chọn biện pháp KHÁC mới hiện nội dung xử lý; trống được normalize thành “KHÁC” | Giữ interaction; nội dung là optional, trống giữ nhãn “KHÁC” |
| KPH-08 | Ngày phát hiện là ngày local hiện tại và không cho sửa; số lượng mặc định `1`; đơn vị mặc định `EA`, lựa chọn `EA` hoặc `kg` | Cải tiến đã xác nhận 2026-08-27; timezone `Asia/Ho_Chi_Minh` |
| KPH-09 | Ngày phát hiện, người phát hiện, số lượng > 0 và ít nhất một ảnh là bắt buộc | Giữ; backend validation là nguồn quyết định |
| KPH-10 | Cần ít nhất một trong SKU/UPC hoặc tên hàng hóa; SKU tối đa 50, tên hàng 200, NCC 150, người phát hiện 100, note/nội dung xử lý 255 | Giữ làm baseline; catalog lookup có thể làm SKU/product snapshot bắt buộc theo policy mới |
| KPH-11 | Ngày xử lý optional nhưng nếu có phải đúng `dd/mm/yyyy`; không thấy validation quan hệ với ngày phát hiện | Giữ format; quan hệ ngày là `Chưa chốt` |
| KPH-12 | Record mới được prepend, tự selected, chuyển tab sang đúng loại và đóng/reset form | Giữ luồng nhanh; server mutation phải idempotent |
| KPH-13 | Danh sách và ảnh record chỉ sống trong memory của tab; reload làm mất dữ liệu | Loại bỏ; PostgreSQL là nguồn thật, IndexedDB chỉ cache/outbox |
| KPH-14 | Xóa một hoặc nhiều record là hard delete trong memory sau confirm | Loại bỏ; Store PWA không hiện xóa/vô hiệu hóa cho CHT. Quyền quản trị tương lai phải dùng reason/audit, không xóa cứng |
| KPH-15 | Phiếu hiện không có product reference/catalog snapshot chuẩn hóa | Cải tiến bắt buộc; lưu barcode và snapshot SKU/tên/NCC tại thời điểm tạo |

## Store identity, detected-by và authorization

| ID | Hành vi quan sát được | Phân loại / hợp đồng mới |
|---|---|---|
| ID-01 | Tên/mã cửa hàng được nhập trong modal và lưu localStorage | Loại bỏ authority; hiển thị cùng vị trí nhưng lấy từ session/membership |
| ID-02 | Prefix “Co.op Food” cố định ở UI; profile chỉ lưu phần tên chi nhánh, mã tối đa 50 | Giữ presentation; store code là chuỗi |
| ID-03 | Tối đa 5 tên người phát hiện gần nhất lưu localStorage, de-duplicate không phân biệt hoa/thường; tên mới nhất làm default | Cải tiến; mặc định actor từ account, lịch sử/ghi thay chỉ khi role cho phép |
| ID-04 | Legacy không login, role, session hoặc tenant check | Cải tiến bắt buộc; backend kiểm membership cho mọi request store-scoped |
| ID-05 | Store identity được đóng trực tiếp vào ảnh và đưa vào tóm tắt/Excel | Giữ snapshot presentation; nguồn store phải là session-authorized context |
| ID-06 | Policy nhân viên/manager sửa, duyệt, vô hiệu hóa phiếu chưa tồn tại | Cải tiến bắt buộc: `STORE_MANAGER` (CHT) đúng membership chỉ được duyệt trong UI lịch sử; không được xóa/vô hiệu hóa. Quyền quản trị tương lai chưa chốt; `CHAIN_ADMIN` không bypass ngầm |

Login mới không được thêm bước chọn store/người phát hiện lặp lại trên mỗi phiếu.
Sau login, cửa hàng hợp lệ và actor mặc định phải sẵn ngay trong workspace; chỉ
hiện switch/override khi membership và quyền thực sự cho phép.

## Ngày và tra hạn

| ID | Hành vi quan sát được | Phân loại / hợp đồng mới |
|---|---|---|
| DATE-01 | Nhập/hiển thị `dd/mm/yyyy`, parse theo local date, không dùng UTC timestamp cho NSX/HSD | Giữ; backend `LocalDate`, database `date` |
| DATE-02 | `shelfLife = HSD - NSX + 1`; HSD phải sau NSX ít nhất một ngày trong lookup UI | Giữ công thức và validator legacy: `HSD == NSX` là validation error, không tính shelf life một ngày |
| DATE-03 | `shelfLife < 10`: hạn lùi bằng HSD và không có mốc cảnh báo | Giữ |
| DATE-04 | Từ 10 ngày: offset hạn lùi `Math.round(20% × shelfLife)`; mốc cảnh báo `Math.round(40% × shelfLife)` trước HSD | Giữ chính xác rounding bằng golden test |
| DATE-05 | Sau HSD: trạng thái “Đã hết HSD”; vào ngày HSD chưa bị coi là sau HSD | Giữ |
| DATE-06 | Trạng thái dài hạn: safe; warning khi khoảng còn tới hạn lùi không lớn hơn `round(40%) - round(20%)`; danger khi đến/qua hạn lùi | Giữ |
| DATE-07 | Có tra thuận NSX + ngày/số ngày/số tháng → HSD và tra ngược HSD + duration → NSX | Giữ |
| DATE-08 | Số ngày là inclusive. Số tháng dùng phép cộng/trừ tháng và clamp ngày về cuối tháng đích | Giữ bằng fixture cuối tháng/năm nhuận |
| DATE-09 | Khi sửa ngày/số ngày/số tháng, các field liên quan đồng bộ và kết quả tự refresh khi đủ dữ liệu | Giữ affordance |
| DATE-10 | Gõ ngày chỉ nhận tối đa 8 digit và tự chèn slash; invalid partial value không bị picker overwrite | Giữ interaction |
| DATE-11 | Calendar chỉ mở từ nút lịch; click ngoài/resize/Escape đóng; mở lookup không autofocus NSX | Giữ interaction |
| DATE-12 | Timeline UI tự tính lại mốc cảnh báo/hạn lùi ngoài core result | Cải tiến; hệ thống mới phải dùng cùng pure domain result để tránh hai implementation lệch nhau |

Biên cùng ngày đã được chốt theo validator legacy: công thức inclusive chỉ áp dụng
sau khi validation xác nhận `HSD > NSX`; `HSD == NSX` phải trả lỗi.

## Barcode và scanner

| ID | Hành vi quan sát được | Phân loại / hợp đồng mới |
|---|---|---|
| SCAN-01 | SKU/UPC có thể gõ hoặc mở camera từ icon trong field | Giữ |
| SCAN-02 | Camera hỗ trợ EAN-8, EAN-13, UPC-A, Code 128, Code 39; ưu tiên camera sau, cho chọn camera/retry | Giữ tối thiểu, kiểm thiết bị thật |
| SCAN-03 | Frame khoảng 85% × 42%, scan 10 fps; success điền raw decoded value rồi đóng modal | Giữ trải nghiệm nhanh; normalize identifier theo contract catalog |
| SCAN-04 | Permission/no-camera/start failure hiển thị lỗi và nhắc nhập tay hoặc máy quét cầm tay | Giữ |
| SCAN-05 | Legacy không lookup catalog và không tự điền tên/NCC; field scanner đang gọi chung “SKU/UPC” | Cải tiến F2/F4; scan barcode lookup trả `0 hoặc 1`, tự điền SKU/tên/NCC |
| SCAN-06 | Một barcode active → một product active; một SKU → nhiều barcode | Hợp đồng mới đã accepted ở ADR-0003 |
| SCAN-07 | Policy barcode không tìm thấy (chặn hay manual có cờ) | Cải tiến có chủ đích: cho quét lại; nếu người dùng chọn nhập tay thì giữ barcode đã quét (nếu có) và trạng thái `NOT_FOUND`, không hiển thị danh sách product |

## Ảnh

| ID | Hành vi quan sát được | Phân loại / hợp đồng mới |
|---|---|---|
| IMG-01 | Mỗi phiếu cần 1–3 ảnh, giữ đúng thứ tự chọn; ảnh có thể xóa trước khi lưu | Giữ |
| IMG-02 | Camera chụp sau hoặc chọn nhiều từ thư viện; core nhận JPEG/PNG | Giữ; MIME/magic-byte validation ở server |
| IMG-03 | iOS thử chuyển HEIC/HEIF thành JPEG bằng browser; lỗi có message cụ thể | Cải tiến có contract; test trên iPhone thật |
| IMG-04 | Mỗi JPEG/PNG được stamp trước khi đưa vào record | Giữ presentation nếu nghiệp vụ duyệt; không dùng stamp client làm bằng chứng audit duy nhất |
| IMG-05 | Stamp ưu tiên EXIF/date metadata, rồi `lastModified`, rồi local now; gồm giờ, thứ, ngày, store code + name | Giữ bằng fixture tổng hợp có metadata xác định |
| IMG-06 | Resize không upscale, giữ tỷ lệ trong 1280×720; encode JPEG nhiều pass hướng tới 550 KiB | Giữ baseline; giới hạn server/object storage cần chốt riêng |
| IMG-07 | Preview vuông crop `cover`; viewer toàn ảnh `contain`; desktop hover lens 2.5×, touch press/drag lens 2.75× | Giữ affordance xem chi tiết, có thể thay implementation |
| IMG-08 | Blob/object URL chỉ tồn tại trong phiên và được revoke khi xóa/unload | Loại bỏ persistence model; vẫn giữ cleanup ở client mới |
| IMG-09 | Legacy không có persistence server cho original/stamped | Cải tiến bắt buộc: giữ private cả bản gốc và bản stamped theo vòng đời phiếu; stamped không thay thế evidence gốc |

## Selection, modal và accessibility

| ID | Hành vi quan sát được | Phân loại / hợp đồng mới |
|---|---|---|
| UI-01 | Tab loại phiếu có count; selection và select-all chỉ tác động list của tab hiện hành | Giữ |
| UI-02 | Export/xóa disabled khi chưa chọn; selected row/card có visual state | Giữ selection/export; loại bỏ xóa khỏi Store PWA |
| UI-03 | Export và delete có confirm modal; delete copy phân biệt 1/nhiều phiếu | Giữ confirm export; loại bỏ delete/invalidate khỏi UI CHT |
| UI-04 | Overlay/modal khóa body scroll; mobile body modal cuộn và chứa overscroll | Giữ outcome |
| UI-05 | Escape đóng picker/image/scanner/settings/export/delete/lookup theo ưu tiên | Giữ nguyên tắc; chuẩn hóa cho mọi modal |
| UI-06 | Focus đôi lúc được đưa vào close/field và trả trigger; không có focus trap nhất quán, KPH modal không đóng bằng Escape chung | Loại bỏ nợ kỹ thuật; thêm focus trap/restore focus có test |
| UI-07 | Reduced-motion bỏ FAB animation và transition đáng kể | Giữ |

## Excel compatibility

| ID | Hành vi quan sát được | Phân loại / hợp đồng mới |
|---|---|---|
| XLSX-01 | Mỗi lần export chỉ một loại TPCN hoặc TPTS và chỉ các dòng selected của tab đó | Giữ |
| XLSX-02 | Sheet tên theo loại; landscape, fit width 1, gridlines; title loại phiếu ở hàng 5; header hai tầng hàng 7–8 | Giữ bằng structural golden |
| XLSX-03 | Thông tin công ty, `CO.OP FOOD`, `STORE` ở A1:A3; Times New Roman; footer có mã biểu mẫu/lần ban hành/trang | Giữ; mẫu Excel/logo approved dùng legacy read-only làm provenance, nhưng golden chỉ dùng descriptor/asset đã duyệt và dữ liệu tổng hợp |
| XLSX-04 | Cột logic: STT, ngày phát hiện, SKU/UPC, tên hàng, NCC, ĐVT, số lượng, tình trạng, người phát hiện, HỦY, ĐỔI, XUẤT TRẢ, KHÁC, ngày xử lý, ảnh, người duyệt | Giữ thứ tự |
| XLSX-05 | Export cuối luôn mở vùng ảnh thành O:Q và chuyển người duyệt sang R; tối đa ba ảnh, mỗi ảnh một cột, fit giữ tỷ lệ, row height 105 | Giữ bằng image-anchor golden |
| XLSX-06 | Sheet được protect bằng password ngẫu nhiên, spin count 100000; format/insert/delete/sort đều khóa theo cấu hình hiện hành | Giữ outcome, không so raw hash |
| XLSX-07 | Cell string bắt đầu sau trim-left bằng `=`, `+`, `-`, `@` được prefix apostrophe | Giữ security golden chống formula injection |
| XLSX-08 | Filename chứa loại phiếu và ngày local `dd-mm-yyyy` | Giữ trừ khi có acceptance criteria mới |
| XLSX-09 | Raw XLSX không deterministic vì password/hash và package metadata | Cải tiến test: canonical structural assertions thay vì byte-for-byte |

## PWA và offline

| ID | Hành vi quan sát được | Phân loại / hợp đồng mới |
|---|---|---|
| PWA-01 | Manifest standalone, theme xanh, orientation any, icon maskable | Giữ baseline |
| PWA-02 | Service worker precache app shell, cache-first asset, network navigation fallback về cached app | Cải tiến theo version/deploy strategy mới |
| PWA-03 | Toast báo offline/online/update; offline page hướng dẫn phải mở app một lần khi có mạng | Giữ affordance |
| PWA-04 | Cache shell không đồng nghĩa lưu draft/record; record hiện mất khi reload | Loại bỏ giới hạn bằng IndexedDB cache/outbox ở F5 |
| PWA-05 | Retry mutation/idempotency và upload hai giai đoạn chưa tồn tại | Hợp đồng mới; thiết kế sau online MVP, không giả lập bằng localStorage |

## Khoảng trống phải chốt

- SKU nhiều NCC: cách chọn NCC primary.
- Cửa sổ thời gian sửa/duyệt và quyền override khẩn cấp sau MVP.
- Thời hạn retention/exception deletion sau MVP cho original và stamped.
- Mức visual/interaction deviation được chấp nhận sau accessibility fixes.
