# Screen map Tool KPH legacy → hệ thống mới

> Bản mang sang cho repository reboot. Mapping screen/state và trace ID là
> baseline; gate F1–F5 cuối tài liệu là lịch sử extraction, không thay
> `../CURRENT_STATE.md` hoặc `../NEXT.md`.

## Mục đích

Screen map nối điểm vào, state, interaction và trace ID trong
[behavior inventory](BEHAVIOR_INVENTORY.md). Đây không phải yêu cầu giữ nguyên
DOM/URL; hệ thống mới có Store PWA và Admin Web riêng nhưng dùng chung API.

## Sơ đồ luồng legacy

```text
Workspace KPH
├── Thiết lập cửa hàng (modal)
├── Tạo TPCN (modal form)
│   ├── Chọn ngày (popover)
│   ├── Quét SKU/UPC (camera modal)
│   └── Xem ảnh (lightbox)
├── Tạo TPTS (cùng form, options khác)
├── Tab lịch sử TPCN/TPTS
│   ├── Chọn một/tất cả
│   ├── Xem ảnh (lightbox)
│   ├── Xóa (confirm modal)
│   └── Xuất Excel (summary confirm → download)
└── Tra hạn nhanh (FAB → modal/panel)
    └── Chọn ngày (popover)
```

Legacy là single page, mọi screen/modal được render trong `#app`; không có route,
login hay admin catalog.

## Danh mục màn hình và overlay

| Screen/state | Entry | Nội dung/hành động chính | Responsive | Target mới / trace |
|---|---|---|---|---|
| Workspace KPH | Mở app | Brand, ngày, store identity, hai nút tạo, lịch sử, FAB tra hạn | Desktop bảng; mobile card | Store PWA authenticated shell; KPH-01, ID-01–05, UI-01 |
| Empty history | Chưa tạo record | Copy “Chưa có dữ liệu khai báo trong phiên” | Giống layout list | Empty server/offline state, copy theo scope thật; KPH-13 |
| TPCN history | Tab Khô & khác | Count, selection, export/delete, row/card | Table `>700px`; cards `<=700px` | Store PWA list filtered by type; UI-01–03 |
| TPTS history | Tab Tươi sống | Như TPCN, options/data riêng | Như trên | Store PWA list filtered by type |
| Create TPCN | Nút tạo TPCN | Form sectioned; TPCN condition/resolution; image; save/cancel | Modal body scroll trên mobile | Store PWA create flow; KPH-02,04,06–12 |
| Create TPTS | Nút tạo TPTS | Cùng form nhưng 4 condition, chỉ HỦY/KHÁC | Modal body scroll | Store PWA create flow; KPH-03,05–12 |
| Date picker | Nút lịch ở date field | Calendar tiếng Việt, select/close | Popover co về full width rất hẹp | Shared Store PWA control; DATE-10,11 |
| SKU/UPC scanner | Icon barcode trong form | Camera preview, camera selector, retry/status | Modal preview tối thiểu 210–240px | Store PWA scanner + catalog lookup; SCAN-01–07 |
| Image preview | Sau chụp/chọn | Thumbnail theo thứ tự, xóa từng ảnh, click để xem | Wrap thumbnail | Store PWA draft image manager; IMG-01–08 |
| Image lightbox | Click thumbnail | Full image contain, close, desktop/touch zoom | Full viewport + safe gutter | Shared viewer; IMG-07, UI-04–06 |
| Store settings | Click store identity | Tên/mã store, prefix Co.op Food, save/cancel | Modal | Không còn employee settings; session/membership switcher khi có quyền; ID-01–06 |
| Export confirm | Chọn dòng → Xuất Excel | Loại, số dòng, số ảnh, Co.op Food/store | Modal | Store PWA export request/preview; XLSX-01–09 |
| Delete confirm | Một hoặc nhiều dòng → Xóa | Copy count-aware, cancel/confirm | Modal | “Vô hiệu hóa” + reason/audit theo policy; KPH-14, UI-03 |
| Lookup ready | FAB tra hạn | Toggle biết NSX, date/duration fields, reset | Side panel rộng; modal mobile | Store PWA utility; DATE-01–12 |
| Lookup placeholder | Thiếu data | Icon + hướng dẫn nhập | Result card cao ổn định | Giữ |
| Lookup safe/warning/danger | Đủ data | Date result, detail, timeline bốn mốc | Result card/timeline responsive | Giữ domain result thống nhất |
| Lookup error | Data invalid | Message có ngữ cảnh | Result card đỏ | Giữ semantic/message tương đương |
| PWA connection toast | `online`/`offline`/update | Toast ngắn gần đáy safe area | Fixed, max-width mobile | App-shell + sync status mới; PWA-01–05 |
| Offline first-load page | Chưa cache app và mất mạng | Giải thích + retry | Centered card | Hosting/app-shell fallback |

## State map màn hình tạo phiếu

| State | Trigger | UI legacy | Acceptance hướng tới |
|---|---|---|---|
| Fresh TPCN | Click TPCN | Ngày hôm nay, SL 1, EA, Cận date, detected-by gần nhất | Actor/store từ session đã sẵn, không thêm bước chặn |
| Fresh TPTS | Click TPTS | Ngày hôm nay, SL 1, EA, Hư hỏng, HỦY | Như trên |
| Catalog found | Chưa có trong legacy | Chỉ field SKU được điền sau scan | Lookup `1`: điền barcode, SKU, product, primary NCC và khóa snapshot khi submit |
| Catalog not found | Chưa có trong legacy | Không phân biệt với manual value | Lookup `0`: state/message/fallback theo policy đã chốt |
| Scanner unavailable | Permission/no camera/start error | Message + nhập tay/máy quét cầm tay | Không làm dead-end |
| Conditional other | Chọn Khác | Hiện field detail tương ứng | Giữ; validation theo policy |
| Image processing | Chọn/chụp | Input tạm disabled trong lúc stamp; lỗi alert/status | Có progress/error per image, không duplicate upload |
| Validation error | Submit invalid | `#form-message` gần footer | Focus/announce field đầu lỗi, giữ draft |
| Saving | Chưa có server state | Synchronous in-memory | Pending state, idempotency key, không double-submit |
| Saved | Validation pass | Prepend, selected, close/reset | Server result + outbox state rõ; snapshot không đổi theo catalog sau này |

## Mapping Store PWA và Admin Web

| Capability | Store PWA | Admin Web |
|---|---:|---:|
| Login/session/store context | Có | Có, scope toàn chuỗi theo role |
| Quét barcode/tạo KPH/ảnh | Chính | Xem/duyệt theo policy; không cần copy camera flow mặc định |
| Danh sách KPH table/card | Có | Table/search/filter mở rộng nhưng giữ semantic/status |
| Tra hạn nhanh | Có | Có thể dùng lại shared domain control nếu có nhu cầu |
| Export KPH | Có theo quyền | Có theo store/chain scope và audit |
| Import/publish catalog | Không | Chính; F2 admin UI tối thiểu |
| Store/profile tự sửa | Không | Store administration riêng theo role, không phải local preference |

## Baseline viewport cần chụp

Không commit screenshot có dữ liệu thật. Bộ tổng hợp tối thiểu:

- Desktop `1440×900`: empty workspace, TPCN/TPTS history có selection, create
  modal, lookup side-by-side, export confirm, scanner permission error.
- Mobile `390×844`: workspace, card list, create modal đầu/cuối scroll, picker,
  scanner, image viewer, offline/update toast.
- Narrow mobile `360×800`: workspace actions/tabs, choice grid, modal safe-area.
- State-only crops: focus-visible, placeholder/error/safe/warning/danger, 1/2/3
  ảnh, catalog found/not-found và sync pending/error khi các slice đó tồn tại.

Chi tiết dữ liệu và quy trình approval nằm trong
[GOLDEN_FIXTURES_PLAN.md](GOLDEN_FIXTURES_PLAN.md).

## Gate traceability

| Milestone | Evidence phải có trước khi đóng |
|---|---|
| F1 | UI DNA, behavior inventory, screen map, fixture plan được review; screenshot baseline tổng hợp được lên lịch/owner rõ |
| F2 | Catalog import/lookup fixtures; scanner states `0/1/error`; admin UI tối thiểu dùng token/shared patterns có chủ đích |
| F3 | Session/store context thay local profile; role × store × action security tests |
| F4 | Screenshot parity được duyệt; KPH/date/image/Excel golden tests chạy được; mọi intentional deviation có acceptance criteria |
| F5 | Offline reload/reconnect/duplicate mutation/error state E2E trên device thật |

KPH UI chính không được bắt đầu chỉ vì screen map đã có; toàn bộ gate F4 phía
trên phải có fixture/test được phê duyệt theo mức rủi ro tương ứng.
