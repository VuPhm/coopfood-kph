# Store App Visual DNA — Home 11/10/2026

Status: **owner accepted cho Home và hướng thị giác dùng tiếp** ngày 11/10/2026.
Owner: “quá đẹp, tích hợp vào dna, chuẩn bị điều chỉnh các trang còn lại theo”.
Nguồn: ảnh tham khảo owner + Home đang chạy tại `/#home`,
[bàn giao và prompt](../delivery/figma-mobile-implementation/home-brand-refinement.md).
Đây là DNA của giao diện Store App, không phải brand manual chính thức của Co.op Food.
Nghiệp vụ và scope tiếp tục theo [contract index](STORE_APP_CONTRACTS.md).

## Tính cách và phân cấp

Tươi mới, thân thiện, sáng và rõ. Xanh làm nền nhận diện; nền trắng dành cho
thao tác; pastel tạo nhóm chức năng; chữ đậm giúp chọn đúng việc. Khoảng trống
và bo góc tạo sự mềm mại, không làm mất thông tin hay kéo dài thao tác nghiệp vụ.

Home là màn chào và chọn việc: lời chào, tên, cửa hàng trong header xanh;
logo nhỏ; ba nút có icon tròn, tên và mô tả; ảnh thực phẩm và slogan ở chân trang.
Màn nghiệp vụ dùng header gọn với back, tiêu đề, tài khoản/cửa hàng; nội dung
trắng có nhóm rõ, thanh công cụ dễ tìm và hành động chính nổi bật. Không cần
sao chép chiều cao header Home hoặc khoảng trắng trang trí sang form/danh sách.

## Palette được chấp nhận trong Home

Các giá trị sau lấy từ implementation đã nghiệm thu. Cột vai trò dự kiến là
hướng tổ chức CSS scoped khi triển khai; chưa phải biến đã tồn tại trong code.

| Vai trò dự kiến | Giá trị hiện tại | Cách dùng |
| --- | --- | --- |
| `--store-brand-start` / `--store-brand-end` | `#008655` / `#00a777` | Header gradient xanh, 115deg |
| `--store-surface` | `#ffffff` | Nền nội dung, form, danh sách |
| `--store-ink` | `#20344a` | Tiêu đề chức năng và nội dung chính |
| `--store-ink-muted` | `#596b7d` | Mô tả, thông tin phụ trên nền sáng |
| `--store-module-mint` / `--store-module-mint-icon` | `#e6f7f2` / `#009c70` | Nhóm DATE/tra cứu, icon trắng |
| `--store-module-pink` / `--store-module-pink-icon` | `#fce9f0` / `#f24468` | Nhóm KPH, icon trắng |
| `--store-module-peach` / `--store-module-peach-icon` | `#fff0e6` / `#ff8c32` | Tiện ích hạn lùi, icon trắng |
| `--store-wave-light` / `--store-wave-deep` | `#d9f1df` / `#bfe6ce` | Sóng nền trang trí Home |

Pastel là nhận diện chức năng, không phải trạng thái nghiệp vụ. Màu semantic
`--cf-color-success`, `--cf-color-amber`, `--cf-color-danger`, `--cf-color-info`
và nhãn/icon đi kèm vẫn quyết định trạng thái. Hồng KPH không có nghĩa “lỗi”;
xanh DATE không có nghĩa lô “an toàn”. Màu vòng icon dành cho icon, không dùng
màu sáng đó làm chữ nhỏ trên trắng. Kiểm contrast cho từng cặp màu/size khi áp dụng.

## Typography, hình học và icon

- Dùng font sans hiện có `--cf-font-family` cho UI. Tiêu đề thẻ 16/22px mobile,
  18/25px desktop, weight 650; mô tả 12/18px. Đây là số đo Home; ở màn nghiệp vụ
  chọn theo mật độ và khả năng đọc, không thu nhỏ nội dung chính chỉ để giống Home.
- Lời chào Home có tên 25/32px; header nghiệp vụ gọn theo tiêu đề màn. Chữ viết
  tay chỉ dành cho slogan trang trí, không dùng cho label, ngày, số lượng hay CTA.
- Nền nội dung bo góc trên 25px trên Home; thẻ launcher 18px; form/panel 16–20px
  tùy ngữ cảnh, control 12–14px là hướng áp dụng. Giữ primitive dialog/focus hiện có.
- Gutter mobile 20px (14–16px ở 320px), khoảng giữa thẻ 12px; desktop 24–36px,
  khoảng nhóm 16–24px. Home hẹp dùng 2 thẻ trên + tiện ích dưới; desktop có 3 cột.
- Vòng icon Home 54px mobile, 64px desktop; glyph 28px, stroke 1.8. Icon thao tác
  nghiệp vụ 18–24px, vùng chạm ít nhất 44px. Không bọc mọi icon toolbar trong vòng lớn.
- Icon nét đơn giản cùng trọng lượng thị giác. Home dùng Lucide hiện có; các asset
  Feather đã kiểm của màn nghiệp vụ vẫn tái sử dụng. Chỉ thay từng callsite khi
  xác minh hình học, nhãn, sự kiện; không đổi toàn bộ icon như một bước đồng bộ tự động.
- Thẻ pastel phẳng, ít shadow. Border mảnh phân nhóm; elevation dành cho lớp nổi.
  Focus rõ, hover nhẹ; tôn trọng reduced motion, không thêm animation trang trí lặp.

## Thành phần xuyên suốt — yêu cầu owner 11/10/2026

Avatar và các control dùng chung phải giữ vị trí/kích thước giữa các trang ở cùng
viewport. Hình học thuộc `store-header.css`; CSS feature không override tọa độ,
padding hay kích thước avatar. Gutter của header 22px, ở dưới 360px dùng 16px,
từ 900px dùng 36px. Nút tài khoản 44px đặt cách đỉnh header 14px; avatar 40px
căn giữa. Back ở các trang nghiệp vụ dùng cùng slot 44px bên trái. Nền, tiêu đề
và chiều cao hero có thể đổi theo nội dung; slot của control không dịch theo đó.
Tên/vai trò đầy đủ xem trong tài khoản; header dùng avatar như Home trên mọi trang.
Navbar/rail giữ anchor hiện hành khi đổi route. Safe-area và breakpoint là thuộc
tính viewport, không phải biến thể riêng từng page.

`check-store-header.cjs` so sánh avatar, nút tài khoản, back và navigation giữa
Home/Tra hạn/Tra cứu/KPH/DATE trên 6 viewport. Trang mới phải dùng hình học chung
và được đưa vào kiểm tra này; không thêm override theo page để căn avatar bằng mắt.

## Lớp nội dung khi cuộn — Home follow-up 11/10/2026

Theo yêu cầu owner, Home có nền/header xanh giữ vị trí bằng `position: sticky`,
lớp trắng `position: relative; z-index: 1` trượt lên khi cuộn trang tự nhiên.
Khối trắng cao tối thiểu một viewport, chồng 20px lên header lúc đầu, bo góc
trên 25px và shadow nhẹ để phân biệt lớp. Ảnh/sóng/slogan đi cùng khối trắng.
Không tạo vùng cuộn lồng, không dùng listener để translate theo scroll.
Khi focus bàn phím quay về nút header, trang cuộn về đầu để control hiện rõ.

Đã mở rộng sang trang đăng nhập và trang Tra hạn lùi theo yêu cầu owner kế tiếp.
Tra hạn dùng cùng lớp trắng cuộn lên/header xanh phía sau, giữ form/result/history;
xem [bàn giao Tra hạn và header chung](../delivery/figma-mobile-implementation/shelf-header-scroll.md).
Các màn nghiệp vụ khác chưa dùng cơ chế cuộn này. Technical PASS 5 viewport cho Home;
owner visual acceptance cho cơ chế mới còn pending, xem
[bằng chứng cuộn Home](../delivery/figma-mobile-implementation/home-scroll-layer.md).

Trang đăng nhập dùng cùng cơ chế native scroll: mobile nền giới thiệu xanh
sticky, lớp form trắng chồng 24px/cao tối thiểu viewport. Desktop giữ hai cột,
vùng xanh đứng yên và form trắng bên phải trượt từ offset 64px. Màn thấp dưới
600px dùng một cột để giữ thao tác nhập liệu. Shared login áp dụng cả preview
và online, không đổi semantics xác thực. Technical PASS 5 viewport và 14 tests;
visual follow-up chờ owner xem, [evidence](../delivery/figma-mobile-implementation/login-scroll-layer.md).

## Thanh dưới và tiện ích nổi — mobile follow-up 11/10/2026

Navigation dưới 900px dùng nền trắng, góc trên 22px, 4 mục thật Trang chủ,
Tra cứu, KPH, DATE. Icon 23px stroke 1.8, label 11/16px luôn hiện; active màu
`#00724e` và pill mint `#e6f7f2`, có `aria-current="page"`. Chiều cao 72px cộng
safe-area; vùng bấm tối thiểu 44px. Desktop tiếp tục rail; login không có thanh này.

Tiện ích tra hạn lùi ở KPH/DATE dùng capsule peach `#fff0e6`, chữ/icon `#884312`,
nhãn “Tra hạn lùi”, cao 48px và shadow nhẹ. Mobile đặt trên navigation 12px;
Khi mở popup tra, ẩn navigation và nút nổi; popup sát đáy trên mobile, chừa
safe-area và cuộn khi màn thấp. Đóng bằng X/Escape hiện lại công cụ, trả focus
về nút nổi và giữ dữ liệu tra. Modal nghiệp vụ/tài khoản
luôn ở lớp trên cả navigation. Nội dung cuối trang, decoration và toast chừa chỗ
cho thanh/nút. Không suy diễn trạng thái nghiệp vụ từ peach/mint của navigation.

Technical PASS trên working tree; owner visual follow-up pending, xem
[evidence](../delivery/figma-mobile-implementation/mobile-toolbar.md).

## Modal và backdrop — follow-up 11/10/2026

Popup tra hạn và các modal dùng primitive `Dialog` chung: scrim tối 55% màu
`rgb(28 38 28 / 55%)`, không blur toàn viewport; scroll lock, focus trap,
Escape/outside dismissal và focus trả về nút mở do Radix quản lý. Popup giữ state
tra trong phiên ở owner hiện có; lịch chọn ngày đóng trước khi Escape đóng modal.
Mobile giữ sheet sát đáy, ẩn thanh công cụ khi mở popup tra; desktop popup tra giữ
vị trí nổi, sheet lọc/chi tiết ở giữa màn. Không chỉnh tọa độ avatar/navigation.

`packages/ui/src/dialog.css` sở hữu backdrop, radius 24px, shadow hiện có và
motion dùng opacity/scale: vào 180ms, ra 120ms, backdrop 150ms; reduced motion
bỏ animation. Không thêm blur, animation lặp, listener scroll hoặc GPU hint tồn tại lâu.
Nút X chung có hit area 44px, vòng 36px/glyph 20px, cách cạnh trên/phải 12px;
inverse trên hero xanh/tối, neutral cho utility hoặc viewer trên trắng. Tiêu đề chừa slot X, sheet không
thêm nút đóng riêng. Tạo phiếu/quét mã/xem ảnh giữ biến thể màn thao tác đã xác nhận;
semantics workflow và palette trạng thái nghiệp vụ giữ nguyên.

Theo phản hồi owner “chưa đồng bộ, tham chiếu thêm theo về hộp tài khoản”,
header modal dùng đúng gradient hero tài khoản `115deg, #008655 → #00a777`,
tiêu đề trắng 16px/600, lề trái 24px và slot X bên phải. Body trắng, spacing 24px,
nhóm mint và controls bo mềm; không đưa avatar/thông tin tài khoản vào modal khác.
Header màn tạo/quét giữ bố cục nút quay lại và mật độ thao tác, dùng cùng gradient;
viewer giữ nền tối để xem ảnh. Glow tra hạn chỉ nằm trong body, không phủ header.
Hộp tài khoản là reference đã accepted; phần áp dụng các modal khác còn chờ
owner visual acceptance. [Bằng chứng follow-up](../delivery/figma-mobile-implementation/modal-account-reference.md).

Áp dụng chung cho Store/Admin qua primitive, đồng bộ overlay utility cũ và filter
prototype để không còn style riêng lệch. Technical PASS; owner visual acceptance
cho round modal này còn pending. Xem [bàn giao modal](../delivery/figma-mobile-implementation/modal-unification.md).

## Logo và ảnh

Logo hiện tại `apps/store-pwa/public/brand/coopfood-logo.png`, chiều rộng Home
72px, đúng tỷ lệ. Chỉ hiện ở nơi cần nhận diện như Home hoặc trang đăng nhập; các trang nghiệp vụ
ưu tiên tiêu đề, back và context. Không quay lại cụm wordmark cũ trong rail.
Nghiệm thu này không thay quyết định logo trong mẫu Excel.

Theo yêu cầu owner tiếp theo ngày 11/10/2026, trang đăng nhập được phép dùng
lại ảnh này trong vùng nhận diện tách biệt khỏi form (desktop); tài khoản dùng
hero xanh + thẻ cửa hàng mint, không thêm ảnh. Phần mở rộng này được owner nghiệm
thu bằng “ổn” ngày 11/10/2026, xem [bàn giao](../delivery/figma-mobile-implementation/account-login-refinement.md).

Ảnh AI: `apps/store-pwa/public/brand/coopfood-home-basket.webp`, 1536×1024,
280024 bytes, alpha, đã có WebP precache. Dùng như decoration Home và vùng nhận diện trang đăng nhập với `alt=""`,
`aria-hidden`, `pointer-events: none`, giữ tỷ lệ, không che nút/chữ và không
trình bày thành ảnh hàng hóa thật. Sóng mint và lá là CSS. Slogan “An toàn / Tiện
lợi / Tươi ngon / Mỗi ngày” là text trang trí. Font viết tay phụ thuộc máy;
không dùng để truyền tải thông tin nghiệp vụ cần đọc chính xác.

Không đưa giỏ thực phẩm, sóng lớn hay slogan vào vùng dữ liệu dày, panel kết quả,
ảnh minh chứng KPH hoặc dialog. Empty state của màn nghiệp vụ có thể dùng icon
nhẹ và hướng dẫn rõ; không tự tạo thêm ảnh AI để đồng bộ.

## Áp dụng vào code

Nguồn visual reference là Home đã nghiệm thu trong `store-app.tsx` và block
Home cuối `store-app.css`. Token hiện tại `packages/ui/src/tokens.css` phục vụ
nhiều consumer và có liên kết Figma; không thay giá trị global theo Home ngay.
Ở bước triển khai tiếp theo, đặt token mới trong scope Store App, thay literal
Home bằng vai trò có tên, rồi dùng cho từng màn. Tái sử dụng Button, Input,
Dialog, CalendarInput và asset URL hiện có, giữ API primitive.

Home là reference được giữ khi refactor. Hướng này cập nhật phần visual của
Figma implementation cũ theo yêu cầu owner; workflow đã accepted vẫn giữ.
Các trang còn lại chưa được visual acceptance chỉ vì cùng DNA. Nếu cần đối
chiếu Figma, đọc đúng node/context/screenshot; proposal mới đặt ở candidate riêng.

## Gate cho các trang tiếp theo

Playwright headless ở 390×844 và 1440×1024: DOM, sự kiện, screenshot xem trực
quan; thêm 320px cho chữ dài/form. Kiểm focus/bàn phím, vùng chạm, không tràn
ngang, busy/error/empty/disabled và semantic status. Xác minh các thao tác đặc
thù trong [kế hoạch áp dụng](../delivery/figma-mobile-implementation/visual-dna-rollout-plan.md).
Nghiệm thu Home chỉ chứng minh Home và hướng thẩm mỹ này; thiết bị thật,
API wiring và nghiệm thu workflow toàn cycle có bằng chứng riêng.
