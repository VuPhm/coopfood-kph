# Công việc kế tiếp

## Closed — Pilot-00 closeout

Pilot local-only theo ADR-0002 được project owner chấp nhận đóng ngày 2026-09-04.
Device metadata và release mechanics `REL-01`–`REL-03` được waive một lần vì
Pilot hiện tại đang chạy và không cần tag/deploy/rollback mới. Acceptance ledger,
evidence và runbook nằm trong `docs/pilot/`.

- Persist phiếu, ảnh stamped, duyệt/thùng rác và lịch sử tạo Excel trong
  IndexedDB theo schema có migration.
- Service worker precache app shell/lazy chunk cần thiết, có offline fallback và
  update prompt an toàn.
- Xin persistent storage, theo dõi quota và kiểm thử reload/offline/export trên
  thiết bị thật.
- Không tạo API giả, outbox, background sync hoặc merge multi-device.
- Device/browser matrix và workbook đã pass theo acceptance tối thiểu; không tạo
  tag mới theo owner waiver.
- Sau release, nhánh deploy Pilot chỉ nhận security/critical fix.

Chỉ có một milestone đang hoạt động. Không mang ngoại lệ local-only hoặc waiver
release của Pilot sang topology online.

## Active — Foundation-01 — vertical slice tạo và xem phiếu KPH

### Mục tiêu

Từ database sạch, chạy được luồng login → store context → lookup barcode
→ tạo phiếu có 1–3 ảnh → xem lịch sử, trong khi frontend có thể phát triển
song song bằng mock sinh từ cùng OpenAPI.

### Phạm vi

- Khóa OpenAPI v1 và fixture hiện có bằng validation/test.
- Backend: session + CSRF, membership store, current catalog lookup `0 hoặc 1`,
  KPH create/list, catalog snapshot và private original/stamped media local.
- Store PWA: port khung workspace, hai entry TPCN/TPTS, form, lookup fallback,
  1–3 ảnh và history table/card theo UI DNA.
- Test role × store, business-date fixture và flow HTTP/browser quan trọng.

### Tiến độ slice

- Đã có session/store context và Contract Lock.
- Migration coherence V2 giữ nguyên bộ tag Pilot accepted: TPCN có Cận date,
  Hết HSD, Rách bao bì, Xì chân không, Khác; TPTS có Dập úng, Thối mốc,
  Cận date, Hết HSD, Khác. Đây là tình trạng hàng, khác trạng thái duyệt.
- Migration V2 đã pass trên PostgreSQL 17/Testcontainers từ database sạch và
  đường nâng cấp mã cũ tổng hợp.
- Catalog lookup đã trả `0 hoặc 1` từ catalog published/current với membership
  store bắt buộc; dữ liệu inactive, non-current hoặc thiếu NCC chính không bị
  suy diễn. `CHAIN_ADMIN` không bypass membership.
- Đã có implementation KPH create/list/photo, catalog snapshot, private media
  và adapter Store PWA online trong working tree; slice chưa được acceptance.
- Đợt khắc phục đầu tiên gom catalog resolver dùng chung cho lookup/snapshot,
  tách seed nâng cấp V1 khỏi seed schema hiện tại, và thêm PR CI frontend/backend.
- Đã làm rõ ranh giới hiển thị Pilot/online theo R02: callback thao tác chỉ được
  truyền cho Pilot; online context/actor read-only và loading/error/empty có test.
- Kế hoạch đóng milestone: [FOUNDATION_01_COMPLETION_PLAN.md](FOUNDATION_01_COMPLETION_PLAN.md).
  Khóa checkpoint gồm cả file untracked trước khi chia ba team Luna max: online
  flow, backend/media và E2E/review. Integration owner giữ vùng contract/config/
  migration; mỗi team có worktree riêng. Đã dispatch A/B/C từ checkpoint `2c456ea`; xem bảng dispatch trong kế hoạch.
- Dừng refactor tổng quát. Hoàn tất login/store, lookup/retry, media và browser
  acceptance; tối đa hai vòng review có kế hoạch rồi đóng hoặc ghi blocker cụ thể.
  Review kiến trúc là nguồn finding, không phải danh sách phải làm hết mới được đóng.

### Ngoài phạm vi

- Catalog import UI, provisioning UI, invalidate/export/approve, offline sync.
- Production object storage, cloud deployment, Redis, queue, microservice.
- Tổng quát hóa design system ngoài component thực sự được Store PWA dùng.

### Acceptance criteria

- Frontend không import code backend; backend không phụ thuộc frontend.
- OpenAPI và fixture là contract chung; thay public API phải đổi contract và
  generated client trong cùng thay đổi.
- Backend không tin actor/store identity từ payload và chặn cross-store.
- Barcode found lưu catalog snapshot; not-found chỉ cho scan lại hoặc manual
  với `NOT_FOUND`, không suy diễn product.
- `HSD == NSX` bị reject; UI `dd/mm/yyyy`, API ISO date, timezone nghiệp vụ
  `Asia/Ho_Chi_Minh`.
- Phiếu cần 1–3 ảnh; original và stamped đều private; danh sách reload
  từ backend giữ snapshot và thứ tự ảnh.
- Test/docs của module đã chạm đều pass từ database sạch.
