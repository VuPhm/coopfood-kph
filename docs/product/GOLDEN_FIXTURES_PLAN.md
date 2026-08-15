# Kế hoạch contract và golden fixture

## Mục tiêu

Biến behavior ID trong [inventory](BEHAVIOR_INVENTORY.md) thành bằng chứng chạy
lặp lại được mà không copy implementation legacy. Fixture phải tổng hợp
hoặc ẩn danh; không dùng workbook, ảnh, user, store hay catalog production.

Fixture hiện có nằm trong `contracts/fixtures/` và được chọn là baseline
cho repository reboot. Chúng là policy/structural evidence, không phải golden
binary hay dữ liệu seed vận hành.

## Nguyên tắc

- Mỗi fixture có ID/trace nối tới behavior inventory.
- Expected business result độc lập DOM, selector và implementation language.
- Không so raw bytes với XLSX, ảnh hay file có timestamp/random metadata;
  kiểm cấu trúc canonical và render có chủ đích.
- Fixture đã accepted là append-only về meaning. Đổi expected result cần
  acceptance criteria hoặc quyết định nghiệp vụ.
- Frontend mock và backend test cùng đọc fixture; không duy trì hai bộ truth.

## Baseline hiện có

| Nhóm | File | Contract chính |
|---|---|---|
| Catalog | `contracts/fixtures/catalog/*.csv` | Identifier là string, leading zero, 1 barcode không trỏ 2 product |
| Date | `contracts/fixtures/golden/dates/*.json` | Inclusive shelf life, round 20%/40%, HSD phải sau NSX |
| KPH | `contracts/fixtures/golden/kph/*.json` | Option/default TPCN/TPTS, normalize `Khác`/`KHÁC` |
| Image | `contracts/fixtures/golden/images/*.json` | Timestamp precedence, 1280×720, no-upscale |
| Excel | `contracts/fixtures/golden/excel/*.json` | 16 logical columns, O:Q images, R approver, formula guard |
| API | `contracts/fixtures/api/*.json` | Synthetic MSW/backend response examples |

## Bổ sung trong Foundation-01

### Date

- Sync thuận/ngược bằng inclusive day count.
- Clamp cộng/trừ tháng ở cuối tháng và năm nhuận.
- Status safe/warning/danger/expired ở đúng biên HSD và hạn lùi.
- UI parse/format `dd/mm/yyyy`, core/API dùng ISO `date`.

### KPH và catalog

- `EA` nguyên, `kg` thập phân dương; 0 bị reject.
- 1/2/3 ảnh valid; 0/4 ảnh bị reject.
- Catalog `FOUND` lưu reference + snapshot; publish catalog mới không đổi
  snapshot phiếu cũ.
- `NOT_FOUND` giữ barcode đã quét và manual input, product reference null,
  không có product-picker.
- Replay cùng actor + idempotency key trả cùng record; payload khác với key
  cũ trả conflict.
- Actor/store trong response lấy từ session; test phải chặn cross-store.

### Image

- JPEG landscape có EXIF, portrait chỉ có `lastModified`, PNG không metadata,
  ảnh nhỏ no-upscale và file sai magic byte.
- Kiểm original + stamped cùng private, checksum/order, output JPEG và store
  snapshot trên stamp; client timestamp không phải audit time.
- Target 550 KiB là best effort có quality floor, không được là lý do mất
  original.

### Excel và visual

Excel chưa nằm trong Foundation-01, nhưng fixture cấu trúc phải được giữ
nguyên cho slice export. Khi mở slice: kiểm page setup, A1:A3, header hàng
7–8, O:Q/R, image anchor, protection permission, footer, filename và literal hóa
`=`, `+`, `-`, `@`; không so raw XLSX bytes.

Visual screenshot được sinh sau khi Store PWA có shell thật, với business
clock và dữ liệu tổng hợp cố định. Viewport tối thiểu: desktop
`1440×900`, mobile `390×844`, narrow `360×800`; bao phủ workspace, table/card,
create form, found/not-found, 1/3 ảnh, picker/scanner và focus-visible.
