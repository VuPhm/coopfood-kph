# Store Fresh — Chế độ gọn (COMPACT01)

Candidate revision3,24/10/2026; thay bố cục Compact sau feedback owner, chưa nghiệm thu. Base task0a25730 có Fresh Soft
d4f9d17 và đúng header816b4e3; chưa merge main. [Hồ sơ](../delivery/compact01-interface-density/plan.json).

## Sử dụng

Tài khoản → Cài đặt → Giao diện → **Chế độ gọn**. Mặc định tắt; đổi có hiệu lực
ngay, nhớ theo browser/device. Không đổi account/store hoặc quyền. Khóa
`coopfood.store-ui.density.v1` chỉ nhận `comfortable`/`compact`; thiếu/sai/đọc
lỗi dùng comfortable, ghi lỗi vẫn đổi trong phiên và có thông báo chưa lưu.

Size roles/cấu trúc và nguồn Apple/W3C ở [quy ước size](STORE_APP_SIZE_TOKENS.md).

## Hình ảnh

Ưu tiên vùng chức năng; giữ font chính, màu và Co.op Fresh Soft. Header72px,
sidebar/menu và nghiệp vụ giữ baseline. Item giảm nhẹ đệm, không ép chiều cao.

| Consumer | Compact |
| --- | --- |
| Tìm kiếm KPH/DATE/Báo cáo, clear/scan | 44px; clear button vẫn44px, input16px |
| Tạo phiếu KPH | Button một hàng44px Tạo TPCN/TPTS, accessible name đầy đủ; bỏ shortcut trùng |
| Báo cáo kỳ/phạm vi | Một hàng kỳ + lọc44px, face icon36px/hit44px, có active context |
| Bộ lọc | Section phẳng phân cách nhẹ, gap8/12px; sort nằm trong sheet |
| Choice sheet | Option60px/padding dọc8px; header/search/footer vẫn riêng |
| Form KPH | Section inset12px, heading gap8px, lựa chọn≥48px/input44px; ảnh không thu nhỏ |
| Tra hạn | Gap8px, form chính inset12px, nút≥44px; kết quả và timeline giữ nguyên |
| KPH mobile / DATE item | Padding dọc8px /10px; tag và tên không gộp |
| KPH desktop | Row cell height52px, padding dọc6px; control44px có thể làm row cao56px |
| Thông báo | Nhóm20/12/8px theo tầng; summary≥56px; item≥92px |

Token `--store-density-*` chỉ sống dưới `html[data-store-density="compact"]`
khi `.store-app` active. CSS density chỉ nằm trong `@media screen`; không áp
chart/timeline, print/PDF/Excel, login, legacy online/Pilot hoặc Admin. Chế độ
mặc định không có override geometry. Không tái sử dụng `.store-compact` của
selection KPH làm density flag.

## Tương tác và accessibility

Provider không remount workspace. Tìm kiếm/lọc/selection/group/collapse/draft
được giữ. Frame và loading frame đặt cùng document attribute để Radix portal
nhận đúng mật độ; ra login/unmount dọn scope. Mở tài khoản giữ vị trí đọc khi
trigger còn nhìn thấy; focus từ portal không làm hero/header cuộn về đầu.
Ở vị trí cuộn sâu, lớp trắng của page kit che header như baseline; người dùng
cần cuộn lên để tới Tài khoản, không có nút settings ẩn trong form đang modal.

Vùng chạm≥44px, input16px, chữ phụ≥12px. Chữ lớn được phép tăng chiều cao.
Account sheet có body cuộn riêng; màn thấp dùng header gọn để công tắc và nút
đóng vẫn tới được. Switch có label/description/aria-checked, dùng Space/Enter,
focus rõ và forced-colors cue. Không thêm animation hoặc dependency.

Kiểm chứng/candidate/giới hạn tại [technical](../delivery/compact01-interface-density/technical.md).
