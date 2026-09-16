# Technical evidence — online stability S03

Ngày: 16/09/2026. Revision: 1. Candidate:
`05b462b4ee6632e14dbe4c147b6c341eb6a5d420`.

## Phạm vi đã kiểm

- Adapter online giữ nguyên `store` authoritative trong response export thay vì
  bỏ trường này sau khi gọi API.
- Workbook online dùng `store.code` và `store.name` từ export bundle cho header
  A2/A3, kể cả khi session context đang giữ tên/mã khác.
- Selection 500 phiếu vẫn được gửi đủ tới endpoint; 501 trả thông báo rõ trước
  khi Store PWA mở confirm hoặc gọi `prepareExport`.
- Pilot tiếp tục dùng store profile trên thiết bị; layout, formula guard, cột R
  và image anchors của workbook không đổi.

## Lệnh và kết quả

| Lệnh | Kết quả |
| --- | --- |
| `npm run test --workspace @coopfood-kph/store-pwa -- --run src/online-kph.test.ts src/app.online.test.tsx` | PASS: 2 files, 14 tests |
| `npm run check --workspace @coopfood-kph/store-pwa` | PASS TypeScript |
| `npm run verify` | PASS docs, Contract Lock 14 resources/7 API fixtures, generated API drift, typecheck, 146 tests và build Admin Web/Store PWA |
| `git diff --check` trước candidate | PASS |

## Giới hạn

- Backend/OpenAPI không đổi; giới hạn `maxItems: 500` và validation backend đã
  tồn tại từ Foundation-02 nên không chạy lại backend suite trong slice này.
- Không thêm browser case tạo 501 dòng; biên 500/501 được kiểm bằng adapter test,
  còn component test kiểm thông báo chặn trước gateway.
- Build vẫn có warning chunk lớn baseline (main khoảng 527 kB, ExcelJS khoảng
  930 kB); S03 không đổi dependency hoặc bundle strategy.
