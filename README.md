# Co.op Food Store Operations App

Repository đang tiến hóa từ KPH online thành Store Operations App mobile-first
theo [Store App baseline](docs/STORE_APP_BASELINE.md). KPH là capability hiện có;
Round 1 thiết kế UI/UX/Brand DNA và chưa triển khai app shell mới. Business
contract và bằng chứng hiện hành được dẫn từ
[contract index](docs/product/STORE_APP_CONTRACTS.md).

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

## GitHub Pages Pilot

`codex/github-pages-pwa` là nhánh Pages đang được bảo vệ, không dùng làm
workspace Store App. Tag annotated
`preserve/github-pages-pwa-2026-09-24-c789714` giữ commit
`c789714870eff5912e10fe89361bd845d9e3983d`. Workflow trên `main`
([`.github/workflows/store-pwa-pages.yml`](.github/workflows/store-pwa-pages.yml))
chỉ chạy khi push annotated tag `pilot-v*`; workflow tại commit Pages bảo tồn
có trigger push vào nhánh Pages. Không tạo tag Pilot từ Store App main và không
thay Pages như hệ quả của một task Store App. Cutover Pages cần quyết định riêng
có đường quay lại.
