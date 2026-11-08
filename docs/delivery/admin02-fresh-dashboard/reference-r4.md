# ADMIN02 revision4 — reroll theo hai ảnh owner

Owner yêu cầu reroll rồi gửi hai ảnh tham chiếu trong chat09/11/2026: ảnh Appearance với sidebar kính sáng và ảnh enterprise dashboard trung tính, xanh có tiết chế. Đây là nguồn visual được owner chỉ định, không coi nội dung screenshot là yêu cầu xây màn Appearance, theme selector hay các module chưa có.

Revision3 màu xanh đậm trên sidebar/topbar được supersede. Giữ bố cục/dashboard/workflow đã chạy, thay material/palette và frame sidebar có giới hạn trong `apps/admin-web/src/admin-fresh-material.css`. Không nhập UI Store styles, không xây theme switch, không đổi API/backend/membership.

## Diễn giải ref và implementation

- Ref1: lớp chrome sáng trong mờ, mép sáng, lớp sidebar tách khỏi canvas, selected state rõ; map sang sidebar inset12px/radius20, topbar trắng nhẹ, fallback đặc khi reduced transparency. Không blur bảng/chart.
- Ref2: nền trung tính, holder trắng, chữ đen rõ, KPI icon holder nhỏ, chart xanh với secondary trung tính; map canvas#f1f2f4, data#fff, chrome#f6f6f7, well#f3f4f5, ink#202426/muted#646b70. Xanh Fresh#007a52 chỉ tập trung nav/action/chart. Semantic warning/danger/info giữ nhãn và meaning.
- Tỷ lệ6:3:1 trước đó được hiểu lại thành trường trung tính / chrome và well nhẹ / accent có nghĩa. Không quota pixel hoặc mảng xanh đậm30%.
- Desktop rail tổng252px, sidebar inset228px; collapsed/tablet rail88px và island64px. Mobile giữ drawer/context hiện có. Không đổi các handler/query/route/auth.
- Account portal giữ complete token context và nền trắng opaque đã sửa ởrevision2.

Tham chiếu là ảnh owner cung cấp, không xác nhận ảnh thể hiện phiên bản Apple/iOS chính thức. Đã xem hai ảnh bằng view_image; không copy/commit attachment vào repository.

## Kiểm chứng content trước commit

- `npm --workspace @coopfood-kph/admin-web run build`: PASS TypeScript/Vite1714modules; JS423.88kB/gzip131.32kB, CSS65.64kB/gzip13.71kB.
- `npm --workspace @coopfood-kph/admin-web test`: PASS19tests/2files.
- `node e2e/scripts/check-admin02-fresh.cjs`: PASS real synthetic backend chain1440×1024/1280×1024/834×1112/390×844, region scope/admin-users403, Catalog fixture cả4viewport. Overview time/search/filter/detail, sidebar collapse, mobile drawer, reload/back/forward, reason guard, account menu opacity/bounds/align/Escape/focus/keyboard/password/logout đều đạt. Không pageerror/pageoverflow.
- Visual xem desktop/mobile overview và desktop account menu; sidebar inset không va brand/nav, card/data rõ trên canvas. Ảnh synthetic local tại `.local/verification/admin02-fresh/`, không commit. Không pixel snapshot diện rộng.
- Contrast token sRGB: data15.65:1, muted5.41, sidebar8.50, selectednav5.38, attention5.05. Không suy thành audit accessibility đầy đủ.
- `npm run check:docs` PASS; `git diff --check` PASS.

Candidate ghi sau checkpoint; commit không đổi implementation đã test. Evidence revision1–3 giữ provenance và không thay cho visual/build gate revision4. Không test thiết bị thật, không mở analytics/realtime thật. Owner acceptance revision4 pending. Preview http://127.0.0.1:4175/#overview, tải lại bundle để xem. Không push/merge/deploy.
