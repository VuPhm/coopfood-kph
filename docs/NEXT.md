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

Không mang ngoại lệ local-only hoặc waiver release của Pilot sang topology online.

## Closed — Foundation-01 — vertical slice tạo và xem phiếu KPH

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
- Đã tích hợp implementation KPH create/list/photo, catalog snapshot, private
  media và Store PWA online; slice được owner acceptance ngày 2026-09-13.
- Đợt khắc phục đầu tiên gom catalog resolver dùng chung cho lookup/snapshot,
  tách seed nâng cấp V1 khỏi seed schema hiện tại, và thêm PR CI frontend/backend.
- Đã làm rõ ranh giới hiển thị Pilot/online theo R02: callback thao tác chỉ được
  truyền cho Pilot; online context/actor read-only và loading/error/empty có test.
- Kế hoạch đóng milestone: [FOUNDATION_01_COMPLETION_PLAN.md](FOUNDATION_01_COMPLETION_PLAN.md).
  Khóa checkpoint gồm cả file untracked trước khi chia ba team Luna max: online
  flow, backend/media và E2E/review. Integration owner giữ vùng contract/config/
  migration; mỗi team có worktree riêng. A/B/C đã tích hợp; runtime/logout checkpoint `acd585d`. Hoàn tất browser
  E2E và CI đúng SHA, sau đó bàn giao online preview cho owner nghiệm thu.
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

### Điểm tiếp tục — 2026-09-10

Local integration/frontend/backend/browser checks đã pass theo evidence
`evidence/foundation-01/integration-2026-09-10.md`. Chờ xác nhận push nhánh lên
origin public `VuPhm/coopfood-kph` để mở draft PR và chạy CI; automatic approval
review đã từ chối lệnh trước khi thực thi. Sau CI, chốt owner acceptance của
online preview. Không mở thêm team/refactor trong lúc chờ quyết định này.

### Cập nhật 2026-09-11 — sau review nhánh

Đã trở về Foundation và tích hợp scanner Pilot `edc81d2` thành `ca180af`, giải
quyết xung đột với phần lifecycle đã có. Scanner 11 tests/typecheck pass;
`npm run verify` pass 135 tests và build. Năm format baseline theo SCAN-02 được
đối chiếu; chưa có bằng chứng thiết bị thật mới. Backend không đổi nên không
chạy lại các tests backend của checkpoint trước.

`ca180af` đã push thành công lên origin. Lệnh tạo draft PR bị automatic approval
review từ chối riêng vì thiếu xác nhận PR công khai tại `VuPhm/coopfood-kph`.
PR chưa tạo, remote Verify chưa chạy. Chờ owner xác nhận tạo draft PR public;
không lặp lại push/integration đã hoàn tất và không mở vòng refactor mới.

### UI feedback — 2026-09-12

Theo yêu cầu mới, ưu tiên nghiệm thu phần Store PWA đã chuẩn hoá bằng skill
`ui-ux-pro-max`; xem [UI evidence](evidence/foundation-01/ui-review-2026-09-12.md).
Dùng ảnh desktop/mobile và preview có backend tổng hợp để chốt phản hồi UI.
Không coi component tests hay screenshot fixture là owner acceptance.

### Closeout — 2026-09-13

Candidate `92fb895` pass local frontend 135 tests/build, backend 36 tests không
skip và browser E2E 5 pass/3 viewport-specific skip. PR #2 pass cả ba job remote
`frontend`, `backend`, `browser`. Owner xác nhận đã thử một số phần, duyệt pass,
cho phép public PR và yêu cầu chốt. Xem
[closeout evidence](evidence/foundation-01/closeout-2026-09-13.md).

Foundation-01 đã đóng. Không còn milestone active và không tự mở production
rollout hay feature mới từ danh sách hoãn.

## Closed — Foundation-02 — duyệt, xuất online và lọc ngày

Owner xác nhận mở cycle ngày 2026-09-15 và yêu cầu bổ sung lọc theo ngày khi xem
phiếu. Phạm vi/gate nằm tại
[plan](delivery/foundation-02-online-review-export/plan.json).

- Khóa OpenAPI/examples/generated client cho query ngày, approval và export.
- Migration V5 giữ approval state/reviewer snapshot/history; backend revalidate
  manager membership, ghi audit và khóa snapshot export trong transaction.
- Store PWA dùng `dd/mm/yyyy`, báo lỗi khoảng ngược cạnh field; cụm lọc chỉ giữ
  hai ô ngày, mũi tên, nút xóa và tự áp dụng khi ngày hoàn chỉnh hợp lệ thay đổi.
  Một đầu trống là khoảng không giới hạn; desktop hiển thị một hàng compact,
  mobile đặt cùng hộp “Lọc & sắp xếp”. EMPLOYEE không thấy action duyệt/xuất,
  manager chỉ xuất selection đã duyệt.
- Candidate revision 3 đã pass Contract Lock, frontend tests/build, backend
  evidence không bị ảnh hưởng, browser E2E desktop/mobile và visual QA tới
  `320px`/landscape. Project owner cho pass candidate `f179b38` ngày
  2026-09-16; gate acceptance/close đều pass và cycle đã đóng.

Ngoài cycle: production infra, offline sync, Admin catalog/provisioning, edit,
xóa/invalidate và approval time window. Hiện không có milestone active; yêu cầu
kế tiếp phải chỉ định outcome mới, không tự mở candidate, deploy hoặc rollout.
