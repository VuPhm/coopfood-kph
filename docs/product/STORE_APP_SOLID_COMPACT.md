# Store Fresh Solid — đặc tả tái dựng một chế độ

**Revision4 — nhịp list và phản hồi card,27/10/2026:** Thông báo có gap8px,
đệm nội dung/viền item đầy đủ; native summary có hover/pressed/focus. Khi thiếu
không gian chữ (container nhỏ hơn18em), %HSD chuyển xuống hàng dưới để tên
không bị ép hẹp. Composition nằm tại store-notifications.css thay override từ
record/functional/DATE/component files. Card DATE/Báo cáo/Home attention tái dùng
hover/pressed shadow tokens của Home, không translate. Nav đổi foreground ngay
cùng solid selected background; giữ transition nền. Không đổi mode/flow/CTA/field.
[Kết quả và giới hạn](../delivery/fresh01-solid-compact/technical.md).

**Revision3 — shared Home light và CTA lam,26/10/2026:** owner chấp nhận hướng
revision2 rồi yêu cầu nhân rộng. Item/card/table nghiệp vụ và nhóm nút dùng
chung ánh sáng/chuyển sắc/viền, giữ selected/disabled/labels riêng; field vẫn
trắng. TPTS CTA lam#2465af, TPCN cam đậm, chữ trắng đủ tương phản cả gradient/
hover/focus/press. Home vẫn bốn tông; không đưa màu launcher vào state palette.
Shared ingredients tại store-material.css; không thêm theme/component/runtimeJS.
[Kết quả/state matrix](../delivery/fresh01-solid-compact/technical.md).


**Revision2 — Home reference và gradient,26/10/2026:** owner yêu cầu giữ Home
cũc5a440b và tăng hiệu ứng. Home là ngoại lệ có chủ đích: mint/hồng/xanhdương/
peach, icon tròn44px và ánh viền/chuyển sắc tĩnh. Workspace giữ palette chung;
functional surfaces dùng gradient nhẹ, không thêm theme hoặc blur lớn. Field
editable trắng, readonly#f9fbfa, disabled#e4ece7; lỗi/focus còn rõ. Tài liệu
Apple iOS27/HIG là tham chiếu ánh sáng/phân lớp/readability; recipe CSS là
cách diễn giải cho web. Kết quả và nguồn tại technical của revision2.


**Candidate implementation —26/10/2026, technical PASS, owner chưa nghiệm thu.**
Theo yêu cầu owner sau preview4360: bỏ chuyển chế độ, chỉ một UI gọn; tăng
màu/solid, cạnh mềm/độ nổi và khoảng hở, giảm thành phần phụ, đúc khuôn trượt.
FRESH01 đã triển khai đặc tả này, thay hướng hai chế độ và pastel chia vùng. Tài liệu cũ giữ làm provenance, không mặc định giữ paint cũ.
[Kế hoạch và thứ tự](../delivery/fresh01-solid-compact/plan.md).

## 1. Phân bổ màu 60–30–10

Đây là trọng số thị giác để review, không phải tỷ lệ pixel cứng áp mọi trang.

| Trọng số | Vai trò | Quy tắc |
| --- | --- | --- |
| 60 — trắng/trung tính | Mặt nội dung, nền card, vùng đọc, khoảng hở | Một mặt trắng chủ đạo; chỉ dùng một well trung tính khi thật sự gom dữ kiện |
| 30 — xanh thương hiệu | Hero/header, selected tab/nav, hành động chính, icon chức năng | Màu đặc rõ; chọn bằng fill/indicator và aria-state, không thêm nhiều pastel |
| 10 — cam nhấn | CTA cần ưu tiên hoặc icon điểm nhấn | Tập trung vào ít điểm; không tô mọi nút/icon thành cam, không cam xen xanh ngẫu nhiên |

**Bốn mức nền dùng chung:** trắng `#FFFFFF`; well `#F2F5F3`; brand `#007A52`;
brand-deep `#00583D`. Workspace không tạo màu nền riêng cho DATE/KPH/Báo cáo/Tra hạn. Home giữ bốn
nhóm màu launcher từ bản cũ theo yêu cầu revision2, không dùng làm state palette.
Cam `#C45108` là accent chức năng, được dùng trên điểm nhấn cụ thể, không làm
mức nền chia vùng thứ năm. Chữ accent trên well dùng role đậm#9c410b để
giữ tương phản, không lấy màu cam của nút áp vào chữ nhỏ. Hover/pressed dùng
cùng token family, không một
palette pastel mới. Chữ chính `#183B2D`, chữ phụ `#52655D`; đảo trắng trên
solid xanh/cam. Field editable luôn trắng; readonly gần trắng, disabled mới có nền xám xanh.
Màu vùng selected có nghĩa rõ.

Token names giữ convention Store-local hiện có; trước khi thêm declaration
kiểm owner và tái dùng nếu cùng nghĩa. Giá trị trên là điểm xuất phát để dựng
khuôn, được tinh chỉnh qua browser/owner review, không nhận là brand approved. Kết quả runtime tại [technical](../delivery/fresh01-solid-compact/technical.md).

Đã tính tương phản sRGB của cặp đề xuất (chưa phải chứng nhận UI runtime):
trắng/xanh5.38:1; trắng/xanhđậm8.53:1; trắng/cam4.64:1;
chữchính/trắng12.34:1; chữphụ/trắng6.22:1; chữphụ/well5.66:1.
Kiểm lại hover/pressed/disabled/focus và nền thực khi triển khai.

### Màu trạng thái

Giữ mapping nghiệp vụ của ListLabel: phase DATE, tình trạng/biện pháp/duyệt
KPH, lỗi form, info/processing. Không lấy cam nhấn UI thay mọi warning hoặc
lấy xanh thương hiệu thay mọi success. Màu nghiệp vụ là ngoại lệ có nghĩa,
không là vật liệu trang trí hoặc lý do thêm background riêng cho từng feature.
Icon/label luôn giữ chữ hoặc accessible name; màu không là tín hiệu duy nhất.
KPH/DATE tag thứ hai giữ container, không lặp lại lỗi mất bao tag.

## 2. Vật liệu và độ nổi

| Role | Cạnh/nền | Độ nổi ứng viên | Áp dụng |
| --- | --- | --- | --- |
| Canvas/section | Trắng, khoảng cách và heading | Không bóng | Vùng đọc, nhóm facts, list header; không quây mọi section |
| Field | Trắng khi editable; readonly/disabled riêng; cạnh xanhđen24%, focus rõ | Không bóng ngoài | Input/select/textarea; cảm giác vùng nhập, không giống button lồi |
| Card/action | Trắng hoặc solid đúng role; border1px xanhđen12–16%, mép sáng phía trên | inset0 1px 0 trắng85%; 0 3px 8px xanhđen8%; 0 8px 18px xanhđen8% | List item, action card, holder thật sự cần tách mặt |
| Sheet/popover | Cạnh mềm liên tục, nền đặc | inset0 1px 0 trắng90%; 0 12px 32px xanhđen18% | Lớp nổi, dropdown/modal; cao hơn card |

Tăng độ nổi so với baseline bằng token có cùng thứ bậc, không thêm bóng riêng
cho từng selector. Bóng không thay border/focus/selected cue. Không card lồng
card chỉ để thêm màu; bên trong ưu tiên heading/divider/space. Selected dùng
solid/indicator, pressed giảm bóng/đổi fill tại chỗ, không translate/scale làm
nhảy nội dung. Reduced-motion không chuyển động; forced-colors dùng outline
và màu hệ thống. Không thêm blur kính nhiều lớp lên nền vốn đã đổi màu.

## 3. Nhỏ hơn ở phần tử, thoáng hơn ở nhịp bố cục

| Role | Mobile ứng viên | Desktop ứng viên | Điều kiện |
| --- | --- | --- | --- |
| Gutter mặt nội dung | 16px | 28px | 320px có thể12px, giữ cùng mép nội dung |
| Gap giữa nhóm chức năng | 20px | 24px | Thay padding rỗng bên trong mọi control |
| Gap giữa item | 10–12px | 8–12px | Bảng dùng divider/row rhythm, không ép card vào table |
| Gap nội bộ dữ kiện | 4–6px | 4–8px | Cặp label/value và metadata còn đọc được |
| Input | min44px; chữ16/24 | min40–44px; chữ16/24 | Auto-height với chữ lớn, không fixed height gây clip |
| Primary/submit/scan/đóng | hit44px; face32–44px | hit40–44px | Với mobile thao tác chính44; không thu để nhét hàng |
| Nút phụ độc lập | hit32–36px; icon16–18px | hit32px; icon16px | Rõ nghĩa, khoảng cách8–12px, không sát target khác hoặc hành động nguy hiểm |
| Card/list item | Cả hàng là target, min56px và tự nở | Row min56px và tự nở | Không tách chevron thành mục tiêu bé bắt buộc bấm |
| Badge/tag chỉ đọc | height20px; chữ12/16; icon12–14px | Tương tự | Không thêm cursor/hover giả; tag dài wrap/cuộn đúng flow |
| Dữ kiện phụ | 12/16 | 12/16 | Tăng contrast; không dùng font li ti để đạt mật độ |
| Nội dung chính | 14/20 | 14/20 | Input16, section17/24, page20/26, %HSD24px giữ nổi bật |

Không một token hit-min toàn cục kéo mọi phần về cùng cỡ. Dùng role cho primary,
secondary, icon face và passive label; cần consumer thực trước khi tách token.
Một component nhỏ không được đặt hitbox chồng nút bên cạnh. Nhãn chỉ đọc có
thể giảm mạnh; nút phải còn dùng được bằng một tay và keyboard. Quan sát thật
trên mobile trước khi nhân cỡ phụ nhỏ cho mọi nơi.

W3C [Target Size Minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
quy định24×24CSSpx hoặc các ngoại lệ về khoảng cách; [Target Size Enhanced](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html)
đề ra44×44. Role32–36/44 ở đây là quyết định sản phẩm trong yêu cầu owner giảm
cỡ, không tuyên bố mọi nút phải44 hoặc24 là cỡ phù hợp cho mọi thao tác. Kiểm
spacing/bounding boxes thực, focus ring, contrast và text reflow, không chỉ đọc
con số token. Không thu primary/submit/scan theo size nút phụ.

## 4. Một khuôn trượt xuyên chức năng

| Lớp | Trách nhiệm | Tái sử dụng |
| --- | --- | --- |
| Hero/header | Back/title/account, search, tối đa nhóm action chính | StoreAppFrame + StoreAppHeader + StorePageLayout |
| Mặt trắng trượt | Cùng radius/mép/bóng/gutter; nội dung đi lên trên hero khi cuộn | Page surface hiện tại, không thêm scroll container thứ hai |
| Context/tab | Loại nội dung, count, active indicator | StoreStickyTabs + StoreFoodKindTabs cho DATE/KPH |
| Toolbar | Heading/count, action phụ, filter; thu bớt copy trùng | Shared list roles, sort trong filter khi cần; không mỗi màn một bộ khối |
| Nội dung | Mobile list/card, desktop table hoặc đúng cấu trúc nghiệp vụ | Giữ tên/định danh/nhãn và data semantics; loading cùng footprint |
| Detail/filter | Header đứng yên, body cuộn, footer hành động đúng nơi | StoreSheet / StoreChoiceSheet / Dialog hiện có |
| Form/transaction | Input là field; validation/ảnh/review/save liên tục | Form có sẵn, primitive Radix giữ focus/dismiss/lock |

Trượt là cấu trúc lớp và flow hiện tại, không thêm hiệu ứng parallax/animation
cho mọi khối. Dùng cùng mép/radius/elevation từ page tới sheet; không tạo một
shell/IA mới. Giữ mobile nav/sidebar và back stack đã xác nhận. Không lớp cố
định che action cuối, không mở hai modal trong DATE→KPH, đóng trả đúng opener.

## 5. Kỷ luật triển khai

1. Bỏ cơ chế hai-mode thật sự trước; không khóa flag compact rồi để nguyên
   code cũ phía sau. Không thêm theme mới để chuyển qua lại.
2. Thay declaration tại owner và xóa recipe superseded; không tạo file override
   khổng lồ cuối import stack chỉ để thắng CSS cũ. Screen/print/portal scope rõ.
3. Chỉ tách component khi có consumer thật, như food selector3consumers.
   Không tạo universal feature component đầy flags hoặc thêm thư viện UI.
4. Reuse nghiệp vụ, handler, focus/scroll; tái dựng hierarchy/token/paint. Không
   rewrite rule/domain từ đầu theo cách diễn đạt “tái dựng từ đầu” của UI.
5. Kết thúc bằng một candidate tích hợp có screenshot/workflow/print evidence;
   owner nghiệm thu hình ảnh sau technical checks. Không lấy352tests nguồn cũ
   làm bằng chứng bản mới, không coi kế hoạch này là implementation đã đạt.
