# COMPACT01 revision3 — size roles và composition

Trạng thái VERIFYING, owner pending. Bản revision2 đã bị owner yêu cầu làm
lại cấu trúc; [evidence r2](revision2.md) chỉ là lịch sử. Cùng nhánh/worktree,
task base0a25730 gồm đúng FORM01d4f9d17 + header816. Main giữf77034d.

## Scope thực

Size tokens Store-local; Compact KPH giữ hai lối Tạo TPCN/TPTS trực tiếp,
bỏ shortcut tạo trùng và hàng sort riêng (sort trong filter). DATE toolbar
gộp, report kỳ/lọc một hàng + context/count gom vào selection; form/filter
section phẳng. Comfortable giữ baseline. Capture anchor trước DOM mutation;
print về composition comfortable. Domain/API/auth/ảnh/export giữ nguyên.

Nguồn và token matrix: [size roles](../../product/STORE_APP_SIZE_TOKENS.md).
Các giá trịpx là quyết định sản phẩm Store, không gọi là kích thước bắt buộc
của Apple/WCAG. Source mới: store-size-tokens.css, store-report-settings.tsx;
consumers và density/tests được cập nhật trong cùng task.

## Kiểm chứng đang chốt

Dev gate4343 đạt hai mật độ/5viewport, print/portal/state/anchor, sort trong
filter và luồng DATE→KPH hai loại/report Excel/PDF/Tra hạn. Full verify đạt
346tests, source TypeScript/contracts/build đã đạt. Đang chạy production
sau chốt token radius. Không dùng evidence r2 để nghiệm thu cấu trúc mới.

Preview mới dự kiến4344, artifact .local/compact01/r3-build;4342 giữ revision2
để so. Chưa merge main/push/deploy/Pages. Mock/browser-local và thiết bị thật
vẫn là giới hạn. Bước tiếp: hoàn tất gate production, ghi candidate và owner
xem KPH/DATE/report/filter/form ở hai mật độ.
