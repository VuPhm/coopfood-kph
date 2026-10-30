# Search discovery — SEARCH02 candidate30/10/2026

Áp dụng Store Fresh, giữ recipe/token hiện có và contract nghiệp vụ từng màn.
Owner yêu cầu nhóm đề xuất/lịch sử/kết quả và đồng bộ ô tìm, đưa quét vào ô.
Candidate, chưa nghiệm thu owner; không đổi API hoặc thêm catalog inference.

- Ô tìm16px, cao tối thiểu44px, giữ chỗ nút clear/scan riêng44px. Clear chỉ xóa
  query và giữ focus; quét chỉ mở scanner. Manual barcode trong form không phải
  ô tìm nên vẫn giữ scan trong hàng chọn cách nhập.
- Focus/tap mở panel; khi trống hiện Tìm gần đây (nếu có) rồi đề xuất. Khi có
  query hiện số khớp và nhóm kết quả. DATE chia đang theo dõi/đã ghi nhận, KPH
  theo hai loại hàng, report/picker theo phạm vi hiện tại.
- Tên hàng + SKU/metadata tách2dòng. Group count theo mã unique; tối đa5dòng mỗi
  nhóm, phần còn lại có thông báo nhập thêm. SKU/barcode/mã lô là chuỗi.
- Gợi ý chỉ từ dữ liệu đã có trong context hiện tại. Chọn điền query; DATE/intake
  vẫn gọi exact lookup hiện có, KPH chuyển đúng tab cho SKU đã chọn. Không tự
  tạo sản phẩm/lô, không bỏ các lô đã chọn trong báo cáo.
- Tìm gần đây tối đa5query, chỉ ghi khi chọn/Enter/submit. Xóa lịch sử riêng với
  xóa query. Lưu trong component đang mở; rời màn/reload thì mất, không lưu
  localStorage/server và không log query. Không mang lịch sử sang phiên khác.
- ArrowDown từ input vào dòng đầu, Up/Down giữa các dòng; Tab dùng native focus,
  Enter chọn/tìm, Escape đóng gợi ý trước dialog. Tap lại input đang focus mở
  lại gợi ý. Click ngoài đóng panel, giữ query.
- Dùng native popover top layer để không bị khối trượt che và vẫn nằm trong
  cây DOM của form/dialog. Chọn phía trên/dưới theo visual viewport; nội dung
  tự cuộn. ResizeObserver và listener chỉ tồn tại lúc mở, không loop per-frame
  ở runtime. Browser không có popover dùng inline absolute fallback; chưa
  xác minh clipping fallback trên browser cũ.

[Files/kiểm tra/giới hạn](../delivery/search02-grouped-discovery/technical.md).
