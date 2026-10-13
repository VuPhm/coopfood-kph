# Pilot Pages — section form bị co/cắt trên iOS 18

Ngày: 13/10/2026. Baseline: `bac4205` trên `codex/github-pages-pwa`.

## Chẩn đoán và phạm vi

Ảnh báo lỗi: cả năm section TPTS bị ép thành các ô thấp gần bằng nhau,
cắt mất trường nhập, trong khi header/footer vẫn hiện. Form là grid trong
scrollport có chiều cao giới hạn; section có `contain: layout paint` từ
`ef629e77`. Paint containment cắt nội dung vượt biên section, nên khi browser
tính hàng thấp hơn nội dung, người dùng không thể đọc/thao tác phần bị cắt.

Chromium preview baseline không tái hiện section bị co. Tương tác giữa intrinsic
grid sizing và containment trên WebKit là giả thuyết phù hợp với ảnh, chưa phải
root cause đã xác nhận trên máy iOS 18 thực. WebKit cũng đã ghi nhận sửa lỗi
automatic minimum size cho grid/flex với `overflow: clip` trong
[Safari TP 227](https://webkit.org/blog/17324/release-notes-for-safari-technology-preview-227/);
nguồn này là tham khảo cơ chế, không chứng minh đúng bug của thiết bị báo lỗi.

Patch CSS nhỏ:

- Bỏ layout/paint containment trên section form để nội dung tham gia sizing và
  không bị clip bởi tối ưu này.
- `grid-auto-rows: max-content; align-content: start` cho form: mỗi hàng lấy chiều
  cao nội dung, phần vượt viewport dùng vùng cuộn hiện tại.
- Giữ header/footer sticky, safe-area, khoảng cách, animation và điều khiển.
  Không đổi nghiệp vụ, codec ảnh, IndexedDB, API hoặc Pages configuration.

## Kiểm tra

- `npm --workspace @coopfood-kph/store-pwa test`: 236 tests / 23 files pass.
- `npm run build`: pass; cảnh báo chunk ExcelJS có sẵn vẫn còn.
- `npm --workspace @coopfood-kph/store-pwa run build -- --base /coopfood-kph/`:
  pass. Preview xác minh CSS candidate `index-2j3SiyR2.css` sau silent startup
  update từ CSS baseline `index-BB8WRdZA.css`; không xoá site data.
- UI browser thật (Chromium), origin kiểm thử riêng, dữ liệu tổng hợp:
  393×740, 375×667, 320×568, 667×375 và desktop 1280×720. TPTS/TPCN giữ
  section theo nội dung; `scrollHeight` section bằng `clientHeight`, không
  overflow ngang, form dài hơn scrollport và cuộn đến ghi chú/footer được.
- TPTS 393×740 ban đầu: scrollport 631px, nội dung 1782px; section lần lượt
  384/148/322/230/472px. Nhập barcode `2912345612345` vẫn ra `1.234 kg`;
  thêm chi tiết Khác tăng section 3 lên 402px, form lên 1886px.
- Số lượng 0 vẫn bị validation từ chối, lỗi thiếu người phát hiện hiện đúng;
  section tăng chiều cao khi có lỗi. Ảnh PNG tổng hợp được xử lý và preview
  làm section 5 tăng chiều cao, không cắt ảnh/ghi chú.
- Không thêm test jsdom khẳng định pixel layout: jsdom không có layout engine.
  Các phép đo trên browser bổ sung cho suite regression hành vi hiện có.

## Giới hạn và bước tiếp theo

Chưa có iPhone iOS 18 thực để xác nhận tái hiện/hết lỗi, bàn phím Safari,
Dynamic Type và safe-area thiết bị thật. Sau deploy, mở lại/reload app trên máy
đã báo lỗi, thử cuộn đủ năm section, nhập số lượng, chọn ảnh và lưu phiếu.
Không yêu cầu xoá cache/site data vì pilot giữ phiếu trong IndexedDB.

Rollback chỉ revert CSS patch, không reset dữ liệu hoặc rollback codec ảnh.
