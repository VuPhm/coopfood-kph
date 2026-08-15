# ADR 0001 — Foundation stack

Status: Accepted — 2026-08-15

## Bối cảnh

Repository reboot cần cho Store PWA, Admin Web và backend tiến độc lập trên một
contract, đồng thời giảm code tự viết cho form, accessibility, security,
migration và data access. Team hiện chưa có bằng chứng cần microservice, queue,
Redis, offline outbox hoặc monorepo task runner riêng.

## Quyết định

- Monorepo npm workspaces, không Turbo/Nx ở foundation.
- Store PWA và Admin Web là React + TypeScript + Vite, dùng Tailwind CSS v4,
  shadcn-style source components trên Radix và Lucide.
- Form dùng React Hook Form + Zod; server state dùng TanStack Query. Không thêm
  global state manager khi chưa có state thực tế cần nó.
- OpenAPI 3.1 là contract chung. TypeScript types sinh bằng
  `openapi-typescript`; HTTP client dùng `openapi-fetch`.
- Backend là Spring Boot modular monolith trên Java 21, PostgreSQL, Flyway và
  jOOQ; Spring Security giữ session, CSRF và authorization.
- Unit/component test dùng Vitest + Testing Library; backend integration dùng
  Testcontainers. Browser E2E được thêm theo vertical slice, không dựng suite
  giả khi chưa có flow HTTP hoàn chỉnh.

## Trade-off và hệ quả

Source component kiểu shadcn cho phép sửa giao diện tự do nhưng team sở hữu phần
code đã copy; chỉ mang component có consumer thật. Một contract sinh type tạo
thêm bước generation nhưng loại bỏ generator/client viết tay và cho frontend làm
việc bằng fixture không cần chờ backend. Modular monolith giảm chi phí vận hành,
đổi lại phải giữ package boundary và test tenant isolation rõ ràng.

## Xem xét lại khi

Có bằng chứng đo được về build orchestration, offline transaction, tải, độ tin
cậy hoặc topology triển khai mà stack hiện tại không đáp ứng; mọi thay đổi nền
phải có ADR kế tiếp và migration path.
