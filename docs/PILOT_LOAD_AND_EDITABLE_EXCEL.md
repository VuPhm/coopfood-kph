# Pilot Pages: Excel chỉnh sửa được và tải màn hình PIN

Yêu cầu ngày 13/10/2026, base `cd55154`, branch `codex/github-pages-pwa`.

## Excel

- Bỏ sheet protection và mật khẩu ngẫu nhiên cho cả TPCN/TPTS. Đây là thay đổi
  nghiệp vụ được yêu cầu rõ; ngoại lệ pilot được ghi trong DOMAIN_RULES.
- Giữ bố cục BM-331.CF, ảnh theo thứ tự, ô người duyệt trống và formula guard.
- Không thực hiện 100.000 vòng băm mật khẩu khi tạo workbook nữa.
- Test serialize/đọc lại XLSX xác nhận sheet không có protection cho cả hai loại;
  các test ảnh, kích thước, bố cục và literal hóa công thức vẫn chạy.

## Tải app

- Workspace KPH và QueryClient chuyển sang dynamic import sau mở khóa PIN;
  cấu hình query giữ nguyên. Không thay rule PIN, dữ liệu IndexedDB hoặc UI KPH.
- Có trạng thái đang mở app và nút tải lại nếu chunk lỗi; không tự xóa site data.
- Bổ sung WebP vào precache để logo PIN đang dùng vẫn có khi mở ngoại tuyến.
  Giữ precache toàn bộ chunk workspace/scanner/Excel/EXIF và update flow hiện hành.
- Không đổi hosting, API, backend, DB version, dependency hay Pages workflow.

## Đo bundle

Production build với `--base /coopfood-kph/ --manifest`; cộng file JS entry và
imports tĩnh trong manifest, gzip bằng cùng Node/zlib cho trước và sau:

| JS cần trước PIN | Trước | Sau |
| --- | ---: | ---: |
| Byte chưa nén | 496.637 | 337.554 |
| Byte gzip | 151.899 | 104.672 |

Giảm 32,0% byte JS khởi động, 31,1% gzip. Đây là module graph cần để render PIN,
không phải số đo thời gian LCP hoặc tốc độ trên iPhone. Service worker vẫn tải
chunk nền để chuẩn bị offline, nên tổng dung lượng cài PWA không giảm tương ứng.
Workspace tải thêm khoảng 160 KB chưa nén sau mở khóa lần đầu.

Kiểm tra build manifest/service worker: mọi JS chunk và logo WebP đều có trong
precache. Test loader cover PIN sai/đúng, chunk chậm và chunk tải lỗi có recovery.
Cần tiếp tục xác nhận LCP, lần mở lạnh và reload/offline trên thiết bị pilot thật.

## Kiểm tra local

- Store PWA: 210 test / 19 file pass, gồm Excel không khóa và loader success/error.
- `npm run build`, build với Pages base, `npm run check:docs` và
  `git diff --check`: pass.
- Production preview đúng base `/coopfood-kph/`: PIN/logo, mở workspace,
  form TPTS trích `1.234 kg`, reload trở về PIN; viewport 375×812 và 812×375.
- Chưa push/deploy hai bước thay đổi này.
