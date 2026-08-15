# Công việc kế tiếp

Chỉ có một milestone đang hoạt động.

## Foundation-01 — vertical slice tạo và xem phiếu KPH

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

