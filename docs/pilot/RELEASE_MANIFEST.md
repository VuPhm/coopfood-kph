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
| Node.js | `TBD` |
| npm | `TBD` |
| Lockfile SHA-256 | `TBD` |
| Pages artefact SHA-256 | `TBD` |

## Verification

| Gate | Kết quả/evidence |
|---|---|
| `npm ci` | `NOT_RUN` |
| `npm run verify` | `NOT_RUN` |
| Production bundle không có demo data | `NOT_RUN` |
| Android Chrome matrix | `NOT_RUN` |
| iPhone Safari matrix | `NOT_RUN` |
| Desktop Chrome/Edge matrix | `NOT_RUN` |
| Microsoft Excel workbook check | `NOT_RUN` |
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

