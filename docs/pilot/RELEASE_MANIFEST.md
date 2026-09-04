# Pilot release manifest

Status: `CLOSED — OWNER WAIVER`

Manifest này ghi quyết định đóng Pilot hiện tại mà không tạo release mới. Không
ghi secret, workbook, ảnh hoặc dữ liệu vận hành thật.

## Định danh

| Trường | Giá trị |
|---|---|
| Release tag | `N/A — giữ Pilot đang chạy, không tạo tag mới` |
| Git SHA | `N/A — owner waiver` |
| Build time (`Asia/Ho_Chi_Minh`) | `N/A — không build release mới` |
| Node.js | `v24.18.0` |
| npm | `11.16.0` |
| Lockfile SHA-256 | `09827f73e9ddbd02cdc7611aabddf32971a505ed475995f980355d177e20d9a3` |
| Pages artefact SHA-256 | `N/A — không upload artefact mới` |

## Verification

| Gate | Kết quả/evidence |
|---|---|
| `npm ci` | `PASS` trên worktree clean tại base `be0f6f39a454`; lockfile không đổi |
| `npm run verify` | `PASS` trên worktree closeout tại base `be0f6f39a454`: 20 test files / 113 tests |
| Production bundle không có demo data | `PASS` |
| Android Chrome matrix | `PASS`: project owner xác nhận ngày 2026-09-04; metadata được waive một lần cho Pilot-00 |
| iPhone Safari matrix | `PASS`: project owner xác nhận ngày 2026-09-04; metadata được waive một lần cho Pilot-00 |
| Desktop Chrome/Edge matrix | `PASS`: project owner xác nhận toàn bộ DEV-03/DEV-04 ngày 2026-09-04; metadata được waive một lần cho Pilot-00 |
| Target workbook check | `PASS`: project owner chấp nhận LibreOffice 26.2.4.2 cho Pilot-00; TPCN/TPTS mở/render đúng, 1–3 ảnh đúng thứ tự/tỷ lệ |
| LibreOffice workbook check | `PASS`: 26.2.4.2, TPCN/TPTS và ảnh render đúng |
| Rollback rehearsal | `PASS — OWNER WAIVER`: không chạy cho closeout Pilot-00 |

Workflow Pages đã được harden cho release tương lai. Riêng closeout này, project
owner quyết định giữ Pilot đang chạy và waive `REL-01`–`REL-03`, nên workflow
không được kích hoạt.

## Triển khai

| Trường | Giá trị |
|---|---|
| Workflow run | `N/A — không chạy lại` |
| Pages URL | `Deployment Pilot hiện tại, không thay đổi` |
| Deploy tag/SHA | `N/A — owner waiver` |
| Smoke test time/result | `N/A — giữ deployment hiện tại` |
| Release owner | `Project owner` |

## Rollback

| Trường | Giá trị |
|---|---|
| Previous immutable tag/SHA | `N/A — owner waiver` |
| Rollback artefact checksum | `N/A — không rehearsal` |
| IndexedDB compatibility confirmed | `N/A — rollback được waive` |

Rollback chỉ redeploy immutable artefact trước; không xóa site data và không
down-migrate IndexedDB. Pilot không migrate dữ liệu sang hệ thống online.
