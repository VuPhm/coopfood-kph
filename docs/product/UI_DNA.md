# UI DNA của Tool KPH legacy

> Bản mang sang cho repository reboot. Trace ID và quan sát legacy được giữ
> nguyên; các gate/milestone F1–F5 cuối tài liệu là bối cảnh extraction
> lịch sử. Trạng thái thực tế nằm trong `../CURRENT_STATE.md` và `../NEXT.md`.

## Phạm vi và nguồn bằng chứng

Baseline này được trích ngày 2026-08-12 từ repository legacy read-only
`/Users/vup/Documents/tool-kph`, nhánh `codex/deploy-single-pages`, commit
`c4592977409ab6cff001b754d7fed86fd8d1e4e3`.

Nguồn đã đọc gồm `index.html`, `app.js`, các script `date-input`, `image-stamp`,
`interface-refresh`, `live-lookup`, `mobile-ios`, `pwa`, `store-profile`, các CSS,
manifest, service worker và offline page. Tên class/selector và bundle minified
chỉ là bằng chứng triển khai, không phải public contract để copy sang hệ thống
mới.

Baseline dùng dữ liệu tổng hợp; chưa chụp screenshot vì source hiện tại đủ để
lập inventory. Bộ screenshot tổng hợp cần được tạo theo
[kế hoạch golden fixtures](GOLDEN_FIXTURES_PLAN.md) trước khi làm KPH UI.

## Điều tạo cảm giác “đúng Tool KPH”

- Nhận diện Co.op Food xanh đậm, nền sáng, mật độ gọn và trạng thái màu có ý
  nghĩa; thao tác nguy hiểm không dùng cùng màu với thao tác chính.
- Người dùng vào thẳng workspace KPH, thấy rõ cửa hàng, hai nút tạo phiếu theo
  loại thực phẩm và lịch sử trong phiên; không phải đi qua menu nhiều tầng.
- TPCN/TPTS được chọn ngay ở điểm bắt đầu và form chỉ hiện lựa chọn phù hợp.
- Các lựa chọn tình trạng/biện pháp là card lớn có icon và màu, dễ chạm trên
  điện thoại; ô “Khác” chỉ xuất hiện khi cần.
- Ngày vừa cho gõ nhanh `dd/mm/yyyy`, vừa có nút lịch riêng. Tra hạn là tiện ích
  nổi luôn sẵn, kết quả thể hiện màu và bốn mốc NSX/Cảnh báo/Hạn lùi/HSD.
- Ảnh là một phần của luồng tạo phiếu: chụp/chọn, xem trước, xóa, phóng to và
  giữ thứ tự. Excel có bước xác nhận tóm tắt trước khi tải.
- Desktop ưu tiên bảng thao tác hàng loạt; mobile chuyển thành card, vẫn giữ
  chọn/xóa/xem ảnh và hai loại phiếu.

## Visual tokens quan sát được

| Nhóm | Giá trị legacy | Hướng dùng lại |
|---|---|---|
| Brand primary | `#006633`; hover `#005229`; active `#004221` | Giữ làm màu hành động chính/header |
| Brand secondary | `#93c11f` | Focus/nhấn phụ, không dùng thay semantic state |
| Accent nguy hiểm | `#e20514` | Hết hạn, xóa, hạn lùi cần chú ý |
| Accent cảnh báo | `#f29200` | Cận date/cảnh báo |
| Nền/surface | canvas `#eef3ef`; muted `#f3f7f4`; strong `#e4ece6`; trắng `#ffffff` | Phân cấp khối không cần viền |
| Text | `#1c261c` / `#667366` | Nội dung chính/phụ |
| Semantic green | nền `#e9f5ed`, nhấn bằng fill | Safe/success |
| Semantic yellow | nền `#fff1dc`, nhấn bằng fill | Warning |
| Semantic red | nền `#fdebec`, nhấn bằng fill | Danger/error |
| Spacing | `4, 8, 12, 16, 24, 32, 40px` | Không thêm spacing lẻ ngoài thang nếu chưa có lý do |
| Control | cao tối thiểu `44px`, radius `12px` | Input/nút thường |
| Panel | radius `24px` | Workspace, modal card, result card |
| Item | radius `16px`; compact item `12px` | Card, choice, table row, icon button |
| Shadow | panel `0 12px 32px rgba(0,66,33,.08)` | Chỉ panel/overlay; control nhỏ không tự đổ bóng |
| Focus | indicator xanh-lime 3px, offset 2–3px | Không được loại bỏ focus visible |

### Visual refresh block-first cân bằng — 2026-08-24

Ghi chú thiết kế mới ưu tiên surface fill, khoảng trắng, radius và hai cấp
elevation nhưng không loại bỏ viền một cách cực đoan. Viền neutral vừa phải
được dùng để tăng affordance và tách các khối gần màu; tránh mạng divider mảnh
dày đặc hoặc dùng đường kẻ làm cách phân cấp duy nhất:

- Focus bàn phím luôn có indicator 3px tương phản rõ; “không outline” không áp
  dụng cho `:focus-visible`.
- Panel/group có thể dùng border neutral 1px; input, choice và upload affordance
  dùng border 2px; selected/error kết hợp màu nền với tổng stroke 2–3px.
- Icon dùng stroke khoảng `2.25–2.5`; timeline tối thiểu `6px`; marker tối thiểu
  `2px`. Divider giữa mọi dòng vẫn được thay bằng spacing hoặc surface khác màu.
- Pill chỉ dành cho badge, count và switch. Control/card/panel lần lượt dùng
  radius `12/16/24px` để tránh nhiều mức bo tùy ý.
- Các phần tử cùng hàng dùng height contract: control/action `44px`, action tạo
  phiếu và store context desktop `72px`, action tạo phiếu mobile `56px`; label +
  control form `72px`. Các item có nội dung khác chiều cao phải căn giữa theo
  cross-axis, không căn top tùy ý.

Typography legacy không hoàn toàn nhất quán: bundle có Montserrat nhúng, trong
khi các nhãn loại thực phẩm và workspace refresh dùng system UI stack. Hệ thống
mới nên ưu tiên system UI stack hỗ trợ tiếng Việt, giữ hierarchy và density;
không copy font data URI hoặc các override chồng lớp.

Icon sau cùng chủ yếu là SVG nét tròn, stroke xấp xỉ 2–2.5, kích thước
17–26px. Icon chỉ bổ trợ; label/aria-label vẫn phải tồn tại. Màu choice card:
đỏ cho hư hỏng/hủy, cam cho cận date, xanh lá cho đổi, xanh dương cho xuất trả,
xám cho hết HSD/khác.

## Layout và responsive behavior

| Viewport | Hành vi đã quan sát |
|---|---|
| `>= 1280px` | Workspace tối đa khoảng 1200px; khi mở tra hạn, workspace thu lại và panel tra hạn nằm cạnh phải |
| `701–1279px` | Header/workspace hai hàng; bảng KPH có min-width khoảng 880px và cuộn ngang nếu cần |
| `<= 700px` | Ẩn phần ngày bên phải header; title, store, actions xếp dọc; bảng ẩn và danh sách card hiện; modal giới hạn theo `100dvh` và safe area |
| `<= 360px` | Giảm padding/font/gap, vẫn giữ nút tạo và tab chạm được |

Header thương hiệu sticky, xanh toàn chiều ngang. Workspace header theo thứ tự
ngữ cảnh: title → store identity → hai hành động tạo phiếu. Trên mobile, title
tách hai dòng và hai nút tạo vẫn ở vị trí nổi bật. Safe area dùng
`env(safe-area-inset-top/bottom)`; body/modal chặn overscroll khi overlay mở.

## Component patterns cần giữ

### Workspace và nhận diện cửa hàng

- Header có logo/brand “Co.op Food”, tên tool và ngày hôm nay.
- Workspace có title “Phiếu theo dõi hàng không phù hợp”, store identity và hai
  nút tạo TPCN/TPTS.
- Legacy cho sửa tên/mã cửa hàng bằng modal và lưu localStorage; tiền tố
  “Co.op Food” là UI cố định, không nằm trong tên lưu.
- Hệ thống mới giữ vị trí/khả năng nhận biết cửa hàng nhưng lấy giá trị từ
  session + membership. Nhân viên không được tùy ý đổi store ngoài quyền.

### Lịch sử, bảng và card

- Tab TPCN/TPTS kèm count, count tổng của tab đang xem, số dòng đã chọn.
- Desktop: checkbox đầu bảng, ngày + người phát hiện, SKU/UPC + tên hàng, NCC,
  số lượng + đơn vị, tình trạng, biện pháp, ảnh xếp chồng và nút xóa.
- Mobile: card có checkbox/ngày/SKU ở header; tên/số lượng, tình trạng/biện pháp,
  ảnh và nút xóa ở body/footer.
- Export/xóa chỉ bật khi có selection; “chọn tất cả” áp dụng trong loại phiếu
  hiện hành, không xuyên tab.
- Empty state nói rõ dữ liệu “trong phiên”. Hệ thống mới phải đổi copy/state cho
  dữ liệu server/offline nhưng giữ khả năng hiểu ngay phạm vi danh sách.

### Form KPH

- Modal sectioned, header cố định và body cuộn trên mobile.
- Thứ tự cuối cùng: thông tin phát hiện; số lượng & đơn vị; tình trạng; biện
  pháp; người phát hiện & ảnh/ghi chú.
- Input cao đồng nhất; date và SKU có icon action ở cạnh phải.
- Tình trạng/biện pháp dùng radio-card 2–4 lựa chọn; selected state có border và
  focus ring theo màu semantic.
- Hai upload card “Chụp ảnh” và “Chọn ảnh”; preview vuông có nút xóa riêng.
- Footer có Hủy và Lưu phiếu; lỗi form hiện trong vùng status gần actions.

### Date input và tra hạn

- Gõ ngày tự chèn `/`, giữ cursor theo số digit, không tự sửa một ngày chưa hợp
  lệ thành giá trị khác.
- Calendar chỉ mở bằng nút lịch; bấm input không mở. Chọn ngày cập nhật input;
  bấm ngoài, resize hoặc Escape đóng calendar. Escape trả focus về nút lịch.
- Locale Việt, tuần bắt đầu thứ Hai, không dùng native mobile date picker.
- Mở tra hạn không auto-focus NSX; focus vào nút đóng để tránh keyboard mobile
  bật lên ngoài ý muốn.
- FAB tra hạn tự mở rộng label một lần rồi thu tròn; reduced-motion bỏ animation.
- Tra thuận/ngược bằng toggle “Đã biết/Chưa biết” NSX; ngày, số ngày và số tháng
  đồng bộ. Kết quả cập nhật live khi đủ dữ liệu.
- Result card giữ chiều cao ổn định, có placeholder/error/safe/warning/danger và
  timeline bốn mốc; “Hạn lùi” được nhấn đỏ.

### Scanner/camera

- Nút quét nằm trong field SKU/UPC và mở modal camera riêng.
- Legacy hỗ trợ EAN-8, EAN-13, UPC-A, Code 128, Code 39; chạy khoảng 10 fps, ưu
  tiên camera sau, cho đổi camera và thử lại.
- Thành công đóng modal và điền mã; lỗi quyền/không có camera vẫn chỉ dẫn nhập
  tay hoặc dùng máy quét cầm tay dạng bàn phím.
- Hệ thống mới giữ affordance và fallback này, sau đó lookup catalog đúng
  cardinality `0 hoặc 1` để tự điền SKU/tên sản phẩm/NCC. Not-found hiện rõ lựa
  chọn quét lại hoặc nhập tay; manual fallback phải giữ cờ `NOT_FOUND`, không mở
  product-picker nhiều kết quả.

### Ảnh

- Camera input dùng `capture=environment`; library cho chọn nhiều ảnh.
- UI giới hạn ba ảnh và yêu cầu ít nhất một ảnh để lưu.
- iOS chấp nhận HEIC/HEIF rồi thử chuyển JPEG; pipeline chính nhận JPEG/PNG.
- Ảnh được resize không upscale trong envelope 1280×720, nén JPEG mục tiêu
  550 KiB và đóng dấu ở góc dưới trái bằng card bán trong suốt: giờ, thứ, ngày,
  rồi store code + name; text dài được ellipsis.
- Timestamp ưu tiên EXIF `DateTimeOriginal`/`DateTimeDigitized`/`DateTime`, rồi
  metadata text tương đương, `lastModified`, cuối cùng controlled/server clock;
  hiển thị theo `Asia/Ho_Chi_Minh`. Stamp client không phải audit truth.
- Viewer dùng `object-fit: contain`; desktop có kính lúp 2.5×, touch nhấn-kéo có
  kính lúp 2.75×. Overlay/click ngoài/Escape đóng viewer.
- Backend mới không được tin stamp client như audit truth; giữ bản/metadata theo
  policy và bảo toàn thứ tự ảnh khi render/export.

### Modal, focus và overlay

- Modal có backdrop blur, radius lớn, header + close button, animation nhẹ.
- Body bị scroll-lock; mobile chỉ body modal cuộn và chặn overscroll ra trang.
- Overlay click đóng hầu hết modal; Escape có thứ tự ưu tiên giữa image,
  scanner, settings, export, delete và lookup.
- Một số modal trả focus về trigger, nhưng legacy chưa có focus trap nhất quán;
  KPH modal không được xử lý Escape trong handler chung. Đây là nợ kỹ thuật,
  không phải behavior cần copy. UI mới phải có focus trap, restore focus và
  Escape/close policy nhất quán mà không làm mất dữ liệu ngoài dự kiến.

### Export và PWA

- Export yêu cầu selection, mở modal tóm tắt loại phiếu, số dòng, số ảnh,
  Co.op Food/store rồi mới tải file; nút đổi thành “Đang xuất…” trong lúc chạy.
- Xóa một/hàng loạt có modal xác nhận và copy nêu rõ số phiếu.
- PWA standalone, theme `#006633`, cache app shell, navigation fallback về app;
  toast báo offline/online và có phiên bản mới trong khoảng 3.2 giây.
- Legacy cache được UI nhưng dữ liệu phiếu chỉ ở memory; không được coi đây là
  offline transaction sync. Hệ thống mới cần IndexedDB/outbox ở milestone riêng.

## Quyết định parity

| Hạng mục | Phân loại | Ghi chú |
|---|---|---|
| Brand tokens, density, choice cards, table/card split | Giữ nguyên có chủ đích | Có thể chuẩn hóa token và accessibility |
| Hai entry action TPCN/TPTS | Giữ nguyên | Không giấu sau dropdown/menu |
| Date format, picker trigger-only, no NSX autofocus | Giữ nguyên | Business/interaction contract |
| Scanner modal + nhập tay/máy quét fallback | Giữ nguyên và mở rộng | Thêm lookup `0 hoặc 1` từ catalog |
| Store/detected-by gần thao tác tạo phiếu | Giữ affordance, đổi authority | Giá trị từ session/membership theo quyền |
| Table desktop/card mobile, selection/export confirm | Giữ nguyên | Dữ liệu chuyển sang server/offline state |
| LocalStorage store profile/detected-by | Loại bỏ có chủ đích | Không còn là nguồn sự thật |
| Phiếu chỉ sống trong memory, hard delete | Loại bỏ có chủ đích | Server persistence, lifecycle, audit |
| Focus management không nhất quán | Sửa nợ kỹ thuật | Acceptance criteria accessibility bắt buộc |
| CSS override chồng lớp/bundle minified/font nhúng | Không copy | Tái hiện bằng component/token mới sau ADR |

## Gate trước KPH UI

Inventory UI tối thiểu đã có, nhưng gate chưa đóng hoàn toàn. Trước khi code màn
hình KPH mới phải:

1. Duyệt các dòng “giữ/cải tiến/loại bỏ” cùng
   [behavior inventory](BEHAVIOR_INVENTORY.md).
2. Tạo screenshot tổng hợp cho desktop/mobile và các state trọng yếu.
3. Phê duyệt golden fixtures ngày/phiếu/ảnh/Excel và biến chúng thành test chạy
   được.
4. Duyệt fixture/authorization evidence cho policy barcode not-found và CHT
   sửa/duyệt/vô hiệu hóa đã chốt.
5. Ghi acceptance criteria cho mọi khác biệt interaction có tác động người dùng.
