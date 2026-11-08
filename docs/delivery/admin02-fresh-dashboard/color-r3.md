# ADMIN02 revision3 — màu theo vai trò6:3:1

Owner: “ổn hơn rồi, áp dụng token hướng màu6:3:1 để neo được và có nhấn thay vì trắng loá”. Giữ bố cục và workflow; chỉ đổi màu/material Admin. Feedback xác nhận hướng refinement, chưa sign-off candidate revision3.

## Vai trò token

Tỷ lệ là định hướng phân cấp thị giác, không hứa đo đúng pixel60/30/10 tại mọi viewport. Token khai trong `apps/admin-web/src/admin-fresh-material.css`, scope body có Admin Shell, bao gồm portal context hiện có.

| Vai trò | Token/màu | Binding |
| --- | --- | --- |
|60 — nền đọc dịu |canvas `#edf2ed`, surface `#f8faf6`, well `#e8eee6`|canvas, chart/table/data holder, table heading; field/menu vẫn trắng khi cần|
|30 — neo Fresh |anchor `#173f33`, raised `#1c4c3d`, support `#deebe0`|sidebar/topbar, organization, KPI hỗ trợ; chữ inverse rõ|
|10 — điểm nhấn có nghĩa |action `#007a52`, attention `#9b581c`/soft `#f6ead5`|action/selection, pending KPI và attention; semantic danger/info/success giữ nguyên|

Sidebar selected dùng nền mint cùng stripe xanh để nổi trên rail đậm. Mobile giữ điểm neo topbar khi sidebar chuyển drawer. Focus trên nền đậm dùng ring sáng #d5e5a0; account portal tiếp tục trắng opaque, không hồi quy lỗi menu revision2. Không đổi enum, quyền, mock data hoặc API.

Tra ui-ux-pro-max: query color đầu trả palette design-system indigo không phù hợp, không áp dụng. Retry grocery retail trả green/amber phù hợp ý hướng Fresh; giá trị cuối chọn từ palette Fresh và đo contrast.

## Verification

- `npm --workspace @coopfood-kph/admin-web run build`: PASS TypeScript/Vite,1714modules, JS423.88kB/gzip131.32kB; CSS65.15kB/gzip13.56kB.
- `npm --workspace @coopfood-kph/admin-web test`: PASS19tests/2files.
- `node e2e/scripts/check-admin02-fresh.cjs`: PASS chain real synthetic backend ở1440×1024,1280×1024,834×1112,390×844; region scope và admin directory403; Catalog fixture ở cả4viewport. Menu opacity/bounds/alignment/focus/actions cùng overview/filter/detail/navigation/identity/lifecycle checks đều đạt. Không pageerror hoặc page overflow.
- Static WCAG contrast (sRGB relative luminance): sidebartext8.87:1, topbartext9.00, topbarmuted6.51, KPImuted5.05, attentionlabel4.64, datatext11.75, selectednav8.43; darkchromefocus7.23. Đây là cặp màu token, không thay audit accessibility toàn diện.
- Xem ảnh desktop/mobile overview và menu: điểm neo đậm, dữ liệu nền đặc dịu, amber chỉ tập trung attention. Ảnh synthetic tại `.local/verification/admin02-fresh/`; không commit ảnh và không pixel snapshot diện rộng.
- `npm run check:docs` và `git diff --check` kiểm ở cuối checkpoint. Không đổi code nghiệp vụ, Store, shared UI, dependencies, backend, membership hoặc deployment.

Candidate `9a8a5ea4d92732dbd92bf77b4d465c34f7537288`; tests chạy trên đúng content trước commit, không thay CSS khi thêm evidence. Revision2 evidence giữ provenance; revision3 build/visual đã kiểm mới. Không chứng minh thiết bị thật hoặc realtime backend. Preview vẫn http://127.0.0.1:4175/#overview; tải lại để lấy màu mới. Không push/merge/deploy.
