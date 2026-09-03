# Pilot-00 acceptance ledger

Cập nhật: 2026-09-04. Ledger này là gate phát hành cho Pilot Store PWA
local-only theo ADR-0002. Trạng thái mặc định là `NOT_RUN`; `PARTIAL` nghĩa là
mới đạt một phần môi trường/luồng bắt buộc. Chỉ đổi sang `PASS` khi có bằng
chứng dùng dữ liệu tổng hợp hoặc ẩn danh.

## Quy tắc phát hành

- Pilot chỉ được tag khi tất cả mục `P0` là `PASS` và không có lỗi P1 mở.
- Không dùng test `skipped`, ảnh thật, workbook vận hành thật hoặc thông tin nhân
  viên/cửa hàng thật làm bằng chứng.
- Mỗi lần kiểm tra thủ công phải ghi ngày, browser/OS/device, Git SHA và đường
  dẫn artefact/bằng chứng. Không commit secret hoặc dữ liệu vận hành.
- GitHub Pages chỉ deploy đúng SHA đã tag. Nhánh deploy sau đó chỉ nhận
  security/critical fix.

## Gate tự động

| ID | Mức | Gate | Bằng chứng yêu cầu | Trạng thái |
|---|---|---|---|---|
| AUTO-01 | P0 | Typecheck, unit/component test và production build | `npm run verify` | PASS |
| AUTO-02 | P0 | Production khởi tạo rỗng, không precache dữ liệu demo | Test/bundle inspection | PASS |
| AUTO-03 | P0 | Store profile hợp lệ trước tạo phiếu và xuất Excel | Component/browser test | PASS |
| AUTO-04 | P0 | Golden Excel: cấu trúc, formula guard, TPCN/TPTS, 1–3 ảnh | Golden + serialize/read-back test | PASS |
| AUTO-05 | P0 | Golden ảnh: EXIF fallback, resize, JPEG, stamp, không giữ original | Golden/image test | PASS |
| AUTO-06 | P0 | IndexedDB fresh-create, upgrade, reload, transaction abort và export history | Browser/IndexedDB test | PARTIAL |
| AUTO-07 | P0 | Offline reopen và service-worker update prompt | Production-build browser test | PARTIAL |
| AUTO-08 | P1 | Scanner permission/no-camera/start failure/success/fallback/cleanup | Component/browser test | PASS |
| AUTO-09 | P1 | Low-quota và storage API unavailable có cảnh báo xử lý được | Component/browser test | PASS |

### Bằng chứng tự động hiện tại

- `npm run verify` đạt trên Node.js `v24.18.0`, npm `11.16.0`: docs/API
  contract, typecheck, toàn bộ unit/component test và production build đều xanh.
- Sau build, `apps/store-pwa/dist` không có thư mục `demo`, không chứa mã phiếu
  hoặc tên nhân sự fixture và service worker không precache đường dẫn `demo/`.
- Golden Excel đã serialize/read-back cả TPCN/TPTS, formula guard và ảnh 1–3;
  golden ảnh đã kiểm EXIF fallback, JPEG/stamp/resize và stamped-only payload.
- IndexedDB test đã kiểm fresh create, v1 → v2 không mất record, close/reopen,
  rollback transaction nhiều record và export history. Chưa chạy upgrade trên
  browser thật nên `AUTO-06` còn `PARTIAL`.
- Component test đã kiểm update prompt và copy offline; production browser đã
  quan sát cold start rỗng, lưu/reload store profile và update prompt bằng dữ
  liệu tổng hợp. Chưa chạy offline reopen nên `AUTO-07` còn `PARTIAL`; kết quả
  browser này là exploratory và không thay thế device matrix.

## Device và workbook matrix

| ID | Mức | Môi trường | Luồng bắt buộc | Trạng thái | Evidence |
|---|---|---|---|---|---|
| DEV-01 | P0 | Android, Chrome current | Camera scan, manual fallback, ảnh 1–3, reload, offline reopen, export | NOT_RUN | — |
| DEV-02 | P0 | iPhone, Safari current | Permission denied, camera/library HEIC/HEIF, IndexedDB reload, export | NOT_RUN | — |
| DEV-03 | P0 | Desktop, Chrome current | Scanner fallback, trash/restore, update prompt, export | NOT_RUN | — |
| DEV-04 | P1 | Desktop, Edge current | Luồng chính và download workbook | NOT_RUN | — |
| XLSX-01 | P0 | Microsoft Excel desktop mục tiêu | Mở/render TPCN và TPTS, 1–3 ảnh đúng thứ tự/tỷ lệ | NOT_RUN | — |
| XLSX-02 | P1 | LibreOffice hiện hành | Secondary compatibility check | NOT_RUN | — |

## Gate vận hành và release

| ID | Mức | Gate | Trạng thái |
|---|---|---|---|
| OPS-01 | P0 | Người dùng thấy rõ dữ liệu chỉ nằm trên thiết bị, không đồng bộ | PASS |
| OPS-02 | P0 | Runbook bao phủ mất thiết bị, xóa site data, quota thấp, nhiều thiết bị và kết sổ | PASS |
| OPS-03 | P0 | Xác nhận không migrate IndexedDB Pilot sang hệ thống online | PASS |
| REL-01 | P0 | Release manifest có tag, SHA, Node/npm version, lockfile và checksum artefact | NOT_RUN |
| REL-02 | P0 | Pages deploy đúng tagged SHA; smoke test sau deploy đạt | NOT_RUN |
| REL-03 | P0 | Rollback thử bằng immutable artefact trước, không xóa site data | NOT_RUN |

## Mẫu ghi bằng chứng

```text
Gate ID:
Ngày/giờ Asia/Ho_Chi_Minh:
Git SHA:
Thiết bị/OS/browser hoặc workbook tool:
Dữ liệu tổng hợp đã dùng:
Kết quả:
Đường dẫn evidence:
Người kiểm tra:
```
