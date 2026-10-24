# Store Fresh — size roles và Compact composition

COMPACT01 revision3, candidate24/10/2026. Source:
`apps/store-pwa/src/store-size-tokens.css`; mappings và bố cục trong
`store-density.css`. Một owner ở task Compact; không đổi tokens global của UI.

## Nguồn tham khảo và quyết định sản phẩm

- [Apple HIG Layout](https://developer.apple.com/design/human-interface-guidelines/layout):
  phân cấp theo mức quan trọng, nhóm việc liên quan, disclosure cho lựa chọn phụ.
- [Apple HIG Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons):
  ít thao tác nổi bật, lựa chọn cùng nhóm có kích thước tương xứng; dùng style
  thể hiện ưu tiên. Hướng dẫn hit region44×44 dùng đơn vịpt của Apple.
- [WCAG2.2 Target Size Minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum):
  web AA24×24CSSpx có các ngoại lệ; Store chọn44×44CSSpx cho tác nghiệp chạm.
- [WCAG Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow):
  giữ nội dung/chức năng ở320CSSpx và khi phóng lớn, cho phép nội dung nở cao.

Các giá trị dưới đây là **quy ước của Store trong CSSpx**, tham khảo nguyên tắc
HIG và accessibility web. Applept và CSSpx thuộc các hệ nền tảng khác nhau.
Đây không phải bảng số bắt buộc cho mọi sản phẩm hay chứng nhận WCAG toàn app.
Tra cứu disclosure ở skillUI/UX không có match đúng nội dung; quyết định bố
cục dựa vào nguồn chính thức trên và contract thực tế trong repo.

## Primitive và semantic roles

| Nhóm | Token prefix `--store-` | Giá trị | Cách dùng |
| --- | --- | --- | --- |
| Spacing | `space-1`…`space-6` | 4/8/12/16/20/24 | Khoảng giữa control, section, inset; micro-step có thể suy từ scale |
| Icon | `size-icon-sm/md/lg` | 16/20/24 | Chevron / thao tác / module; giữ SVG tỷ lệ |
| Visual face | `size-face-sm` | 36 | Phần nền vẽ của icon control phụ |
| Hit region | `size-hit-min` | 44 | Cả vùng click/touch; face nhỏ vẫn giữ hit region này |
| Control | `size-control-md/lg` | 44/52 | Control tác nghiệp thường / control lớn khi có lý do; cùng nhóm cùng size |
| Row | `size-row-one/two/three` | 44/56/72 | Minimum cho một/hai/ba tầng nội dung, được phép nở cao |
| Radius | `radius-sm/control/group/sheet` | 8/12/16/24 | Chi tiết / control / group / sheet; phần Compact điều khiển dùng12 |
| Caption | `type-caption`, `leading-caption` | 12/18 | Hint/count/context phụ |
| Control copy | `type-control`, `leading-control` | 14/20 | Nhãn nút và kỳ báo cáo |
| Input/body | `type-input`, `leading-input` | 16/24 | Nội dung nhập, giữ legibility trên mobile |
| Section | `type-section`, `leading-section` | 17/24 | Tiêu đề nhóm công việc |
| Page | `type-page`, `leading-page` | 20/26 | Vai trò title của frame, geometry frame giữ baseline |

Minimum row là budget bắt đầu, không phải fixed-height clipping. Item nhiều
tên/tag/ngày hoặc chữ lớn có thể cao hơn. Annotation trạng thái tiếp tục dùng
contract label riêng; chữ nhỏ và status chip không trở thành nút44px.

`--store-density-*` là mapping tới semantic roles, không là bảng px riêng cho
mỗi màn. Token được cấp ở body có Store Fresh để portal kế thừa. Comfortable
giữ geometry hiện hành; Compact dùng các role này. Print dùng composition
comfortable; CSS density chỉ có hiệu lực trên screen.

## Cấu trúc được lược trong revision3

| Khu vực | Compact |
| --- | --- |
| KPH tạo phiếu | Hai button44px `Tạo TPCN`/`Tạo TPTS`, cùng kích thước, đầy đủ accessible name và tooltip; một chạm mở đúng form. Bỏ caption/label-pill/chevron lặp và shortcut tạo trùng ở ô tìm kiếm. |
| KPH danh sách | Heading/count + Chọn/lọc trong một hàng. Sort nằm ở bộ lọc hiện có, badge báo tiêu chí đang dùng; sort state giữ khi đổi chế độ. |
| DATE | Heading/count + lọc cùng hàng; giữ segment trạng thái. Sort trong bộ lọc; bỏ CTA Thêm theo dõi chưa khả dụng khỏi Compact. |
| Báo cáo thiết lập | Một hàng kỳ + icon lọc; giá trị kỳ đầy đủ và reflow. Bộ lọc active có số tiêu chí và mô tả phạm vi, accessible description luôn có. |
| Báo cáo danh mục | Heading ngữ nghĩa vẫn có; số SKU/lô ghép vào selection summary, bỏ một hàng title/count hiển thị riêng. Giữ mixed state, selection scope và menu chọn. |
| Form/bộ lọc | Các section nghiệp vụ phẳng, phân cách nhẹ; bỏ nền/khung/bóng của card lồng. Label, lỗi, lựa chọn, ảnh, trình tự review giữ đủ. |

Mật độ chỉ đổi presentation. Sort/filter thực thi cùng state và handler;
không remount workspace/draft. Capture reading anchor trước React đổi
composition rồi khôi phục sau DOM/CSS để giữ vị trí khi account còn tới được.
Print-media subscription trả composition comfortable, về screen trả Compact;
không đổi dữ liệu xuất, biểu đồ hay timeline.

Tham chiếu [density](STORE_APP_DENSITY.md), [evidence revision3](../delivery/compact01-interface-density/technical.md).
