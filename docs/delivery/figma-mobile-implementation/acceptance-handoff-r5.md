# Bàn giao round sửa QA — revision 5

Ngày 08/10/2026, theo yêu cầu owner “dùng kết quả này cho 1 round sửa”. Preview mock: <http://127.0.0.1:5175/>. Candidate SHA được ghi tại [plan](plan.json); [evidence](technical-evidence-r5.md) ghi kiểm chứng. Technical readiness đạt; owner acceptance vẫn pending.

Đã sửa 5 P2 và 2 P3 trong QA, cùng lỗi CTA Tra cứu thấy khi rà screenshot cuối. Các file ứng dụng thay đổi thuộc StoreApp/mock, KPH workspace/create draft/record view, DATE workspace, shelf utility, lookup và scoped CSS; bổ sung regression tests và hai browser scripts. Không đổi API, backend, contract, dependency hoặc packages/ui.

Kiểm tra ngắn ở mobile 390×844 và desktop 1440×1024:

1. KPH → Chọn → Cải thìa VietGAP 500 g. Chỉ một checkbox được chọn, count là 1, workbook chỉ có một phiếu với SKU `0011730`. Duyệt/không duyệt phiếu này không thay trạng thái Nông sản mẫu 01.
2. Tạo TPTS với barcode `29123415005`, thêm ảnh tổng hợp, xem lại và gửi. Phiếu giữ SKU `0011730`; chi tiết có UPC riêng. Desktop tìm được theo cả SKU và barcode, workbook dùng SKU catalog. NOT_FOUND không tự tạo SKU.
3. DATE → Theo dõi DATE → Sản phẩm C → Đã xử lý. Về Home rồi vào DATE lại: lô vẫn Đã xử lý, Home desktop còn 1 cảnh báo mở; hai nút cập nhật của lô đã xử lý đều disabled. Lô đã ghi nhận chỉ còn thao tác Đã xử lý.
4. KPH/DATE → mở tiện ích hạn lùi → đổi màn. Panel đóng; trang Tra hạn lùi không có form/field ID trùng. Trên mobile, thử bấm gần mép nút Chọn, Lọc, calendar và switch NSX: hit area mở rộng, kích thước hiển thị giữ nguyên.
5. Tra cứu `0011730`: nhóm Thực phẩm tươi sống, đơn vị kg theo fixture. Tra `0008421`: nhóm Thực phẩm khô, đơn vị EA. Nút Tra cứu có nền xanh và chữ trắng đọc được, không bị cắt.

Screenshot candidate cục bộ ở `.local/figma-mobile/r5/`: `selection-{390,1440}.png`, `found-sku-{390,1440}.png`, `date-resolved-{390,1440}.png`, `quick-{390,1440}.png`, `lookup-fresh-{390,1440}.png`; raw kết quả `qa-repairs.json`. Đây là candidate implementation riêng để owner review, không ghi đè frame Figma accepted. Nếu cần cập nhật Figma thì đó là bước owner chỉ định riêng.

Giới hạn: tất cả dữ liệu/ảnh là fixture tổng hợp, memory-only; đổi màn giữ state nhưng reload reset. Metadata nhóm/đơn vị chỉ thuộc fixture, không phải mở rộng catalog contract. Browser gate không chứng minh API persistence, authorization backend hoặc camera/thiết bị thật. Warning build ExcelJS/chunk lớn có sẵn vẫn còn. Chưa merge/push/deploy. Bước nhỏ tiếp theo là owner xem các scenario trên và đưa quyết định nghiệm thu hoặc finding cụ thể.
