# Co.op Food KPH

Nền tảng quản lý phiếu hàng không phù hợp cho Co.op Food, được xây lại từ các
business contract và UI evidence đã kiểm chứng.

## Thành phần

- `apps/store-pwa`: ứng dụng mobile-first cho cửa hàng.
- `apps/admin-web`: ứng dụng quản trị online.
- `packages/api`: client sinh từ OpenAPI và transport dùng chung.
- `packages/ui`: token và UI primitives dùng chung.
- `packages/kph-rules`: rule thuần cần phản hồi tức thì ở frontend.
- `backend`: Spring Boot modular monolith.
- `contracts`: OpenAPI, examples và fixture ngôn ngữ độc lập.

Backend và frontend build độc lập. OpenAPI cùng fixtures là seam tích hợp; backend
vẫn là nguồn quyết định authorization và nghiệp vụ.

Đọc `AGENTS.md`, `docs/CURRENT_STATE.md` và `docs/NEXT.md` trước khi thay đổi.

## Chạy kiểm tra

Yêu cầu Node.js 24+, npm 11 và JDK 21.

```bash
npm ci
npm run verify
cd backend && ./mvnw verify
```

Chạy hai frontend độc lập bằng `npm --workspace @coopfood-kph/store-pwa run dev`
và `npm --workspace @coopfood-kph/admin-web run dev`. PostgreSQL local nằm trong
`infra/local/compose.yaml`; Testcontainers tự tạo database sạch khi có Docker.
