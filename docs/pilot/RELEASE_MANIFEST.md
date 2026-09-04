# Pilot release manifest

Status: `DRAFT`

Điền manifest này từ clean checkout của release candidate. Không ghi secret,
workbook, ảnh hoặc dữ liệu vận hành thật.

## Định danh

| Trường | Giá trị |
|---|---|
| Release tag | `TBD` |
| Git SHA | `TBD` |
| Build time (`Asia/Ho_Chi_Minh`) | `TBD` |
| Node.js | `v24.18.0` |
| npm | `11.16.0` |
| Lockfile SHA-256 | `09827f73e9ddbd02cdc7611aabddf32971a505ed475995f980355d177e20d9a3` |
| Pages artefact SHA-256 | `TBD` |

## Verification

| Gate | Kết quả/evidence |
|---|---|
| `npm ci` | `NOT_RUN` |
| `npm run verify` | `PASS` tại candidate `00f145bdcb1c` |
| Production bundle không có demo data | `PASS` |
| Android Chrome matrix | `NOT_RUN` |
| iPhone Safari matrix | `NOT_RUN` |
| Desktop Chrome/Edge matrix | `PARTIAL`: in-app Chromium đạt update/offline/export; chưa đủ scanner/trash/Edge |
| Microsoft Excel workbook check | `NOT_RUN` |
| LibreOffice workbook check | `PASS`: 26.2.4.2, TPCN/TPTS và ảnh render đúng |
| Rollback rehearsal | `NOT_RUN` |

## Triển khai

| Trường | Giá trị |
|---|---|
| Workflow run | `TBD` |
| Pages URL | `TBD` |
| Deploy branch/SHA | `TBD` |
| Smoke test time/result | `TBD` |
| Release owner | `TBD` |

## Rollback

| Trường | Giá trị |
|---|---|
| Previous immutable tag/SHA | `TBD` |
| Rollback artefact checksum | `TBD` |
| IndexedDB compatibility confirmed | `NOT_RUN` |

Rollback chỉ redeploy immutable artefact trước; không xóa site data và không
down-migrate IndexedDB. Pilot không migrate dữ liệu sang hệ thống online.
