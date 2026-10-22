# KPH hiển thị/lọc và bề mặt Store — revision 5, 22/10/2026

Owner chấp nhận và cho phép merge bằng “có thể merge” ngày22/10/2026, áp dụng
revision5 tại preview4262: mặc định nhóm ngày, chọn/thu mở độc lập, nền trắng.
Candidate checkpoint`48438cf`, merge main local`146e2e1`; [hồ sơ tích hợp](../delivery/kph02-merge-2026-10-22.md).
Cùng task/worktree từ`982c04c`. KPH Store Fresh vẫn fixture trong phiên;
không thay D01 online hoặc cấp quyền chọn dữ liệu chưa tải. Palette áp khung
Store chung. Thiết bị thật/API wiring là giới hạn riêng, không suy từ owner
visual acceptance thành kiểm chứng production.

## Kiểu danh sách và nhóm ngày

- Mặc định **bật nhóm ngày**. Khi tắt, ngày hiện cùng cụm SKU/số lượng căn trái
  trên item mobile (icon lịch) và trong cột ngày desktop.
- Trong Lọc & sắp xếp có switch Nhóm theo ngày, áp dụng ngay; tắt nhóm tính vào badge
  trình bày vì khác mặc định. Bật/tắt chỉ đổi cách xem: giữ query/filter/sort, số phiếu đã tải và
  selection. Khi bật, các nhóm mở; Đặt lại bộ lọc trả switch về bật.
- Khi đã bật nhóm: tiêu đề ngày13px/count12px, click/Enter/Space thu/mở với
  `aria-expanded`/controls ở cả hai chế độ. Checkbox ngày chỉ hiện khi Chọn;
  label44×44px chỉ chọn ngày, cách button thu/mở8px. Phần chevron/ngày/count
  dùng chung button thu/mở, không chọn phiếu. Chọn ngày khi đang thu gọn chỉ
  tác động tập đã tải, không tự mở. Thu/mở giữ selection; vào/thoát Chọn giữ
  collapse hiện tại. Cùng ngày dùng chung tập chọn/trạng thái ngay cả khi sort
  tên tạo nhiều đoạn ngày.
- Filter/type/query/sort/tạo phiếu đặt lại nhóm mở. Nối thêm mở các ngày có phiếu
  vừa nối để focus được tới phiếu mới; nhóm khác giữ nguyên. Không đổi giới hạn25
  hoặc rule duyệt/xuất. Grouping không thêm request backend.

## Item và vùng bấm

Desktop giữ chữ13px/dòng thường~60px, nhãn26px, căn giữa dọc và cột ổn định.
Bấm mọi ô dữ liệu/khoảng trống/mũi tên cuối hàng để mở phiếu; button tên vẫn là
lối vào keyboard. Click ô dữ liệu đưa focus về button của hàng trước khi mở để
Escape từ chi tiết trả đúng hàng. Checkbox/cả ô selection hoạt động độc lập.

OTHER dài trên desktop giới hạn theo cột/ellipsis. Native title khi hover và
DOM/accessible text giữ nguyên văn; click hàng mở chi tiết đầy đủ. Không suy
nghĩa từ từ khóa của OTHER hoặc đổi mapping màu/enum/dữ liệu.

Mobile giữ tên14px/tối đa2 dòng, SKU12px/số lượng13px, ngày12px khi không nhóm;
padding10px/gap6px. Hàng tag tách khỏi button mở phiếu để không mở nhầm khi vuốt.

- Tag trên một hàng, cuộn ngang **bên trong item**, không làm trang tràn ngang;
  scrollbar ẩn, chỉ vùng còn cuộn có fade mép. Pan dọc vẫn cho cuộn trang tự nhiên.
- Native scroll hỗ trợ touch/keyboard; strip chỉ vào tab order khi overflow,
  có tên/description và focus ring. Đầu/cuối/fade cập nhật qua ResizeObserver/
  scroll, không có listener đo trong cuộn trang.
- Tag giữ chữ12px, line16px, min22px. OTHER giới hạn146px/ellipsis trên mobile;
  nhãn chuẩn vẫn đầy đủ. Giữ nguyên title/accessible text/detail.

## Bề mặt Store App

Owner nhận xét canvas xám revision3 “xấu dơ”. Bỏ mảng nền xám, chọn trắng thuần
và tách holder bằng viền/bóng nhẹ; giữ geometry và workflow hiện có. `store-glass.css` và token canvas scoped trong app đảm nhiệm:

| Vai trò | Candidate | Cách dùng |
| --- | --- | --- |
| Page canvas | `#fff` | Trắng thuần liên tục dưới hero, không thêm gradient/tint |
| Holder | `#fff`, edge`#dfe5e9` | KPH/DATE, Home attention, control; bóng nhẹ trung tính |
| Inner well | `#fafbfc` | Gần trắng, chỉ ở tab/table header/filter section |
| Brand/selected/status | Giữ palette xanh/pastel/semantic | Không dùng xanh nhạt làm toàn bộ nền mặc định |

Hero holders trắng đặc; navigation/dock vẫn có glass có giới hạn, fallback trắng.
Sidebar trắng. Home pastel module và nhãn trạng thái giữ meaning; glow
Tra hạn không đổi. Login/online/Pilot có composition/style riêng không được nhập
lại vào khung mock vì thay đổi này. Xem palette trong Visual DNA và hồ sơ owner acceptance ở trên.

## Lọc nhanh và hiển thị thêm

Hôm nay/Hôm qua theo `Asia/Ho_Chi_Minh`; Tuần này từ thứ Hai đến hôm nay,
inclusive, vẫn nhập tay `dd/mm/yyyy`, from≤to. Lối tắt không đổi approval/sort.
Đổi type/query/filter/sort reset selection/chi tiết/giới hạn về25. Nối tối đa25
mỗi lần, giữ chọn/thứ tự/unique IDs và focus phiếu đầu mới; hết tập bỏ nút.
Tick ngày/chọn tất cả chỉ tập đã tải, có mixed/shown-total khi ngày chia đợt.

Mock giữ29 phiếu/loại, nhóm5phiếu/ngày14/08→09/08 và OTHER dài ở số02/05. Đây
là dữ liệu tổng hợp ngày cố định, lối tắt ngày hiện tại có thể trả rỗng.

[Bàn giao/checks/giới hạn](../delivery/kph02-compact-history.md).
