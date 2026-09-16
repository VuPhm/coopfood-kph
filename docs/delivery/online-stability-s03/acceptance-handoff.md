# Acceptance handoff — online stability S03

Candidate: `05b462b4ee6632e14dbe4c147b6c341eb6a5d420`.
Mode: Store PWA online.

## Kịch bản nghiệm thu

1. Chuẩn bị export response có store name/code khác session context. Xuất một
   phiếu `SUBMITTED + APPROVED`; workbook phải dùng store snapshot của response
   ở A2/A3, không dùng giá trị session cũ.
2. Chọn đúng 500 phiếu đã duyệt; Store PWA phải gửi đủ 500 ID để backend chuẩn
   bị snapshot export.
3. Chọn 501 phiếu; Store PWA phải báo “Chỉ có thể xuất tối đa 500 phiếu mỗi
   lần”, không mở confirm và không gửi request export.
4. Export Pilot local-only vẫn dùng profile thiết bị; structure/formula/image và
   cột người duyệt của workbook không đổi.

## Trạng thái quyết định

Technical gate đã pass. Chưa ghi nhận owner acceptance cho candidate S03 này.
