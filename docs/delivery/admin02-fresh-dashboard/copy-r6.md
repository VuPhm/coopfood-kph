# ADMIN02 revision6 — dọn chữ trang trí

Owner chỉ ra vòng dọn trước chưa bao phủ nội dung UI: eyebrow “ĐIỀU HÀNH & GIÁM SÁT” và tagline “Nhìn toàn cảnh, tập trung vào những việc cần xử lý.” không giúp thao tác.

Đã bỏ hai dòng đó, slogan/sidebar note, footer nhận diện lặp, breadcrumb Workspace và các câu chỉ diễn giải lại tên khối/table. Wordmark dùng nhãn Admin ngắn. Rút gọn banner nguồn dữ liệu; giữ trạng thái mock, thời điểm snapshot, đơn vị/kỳ/số lượng, giới hạn file/lịch và hệ quả trong confirm/status/error. Catalog helper bỏ mãC01 và cách nói bytes, giữ upload lại mở kết quả cũ. Bỏ eyebrow lặp của Identity/Lifecycle; date field vẫn hiện ngày hiệu lực sớm nhất, backend guard không đổi.

Bỏ CSS của các phần đã gỡ: admin-eyebrow/sidebar-note/admin-page-footer/panel-footnote/breadcrumb-parent. Không đổi token Fresh chung, Store, backend/API hoặc handlers.

Kiểm tra:
- `npm --workspace @coopfood-kph/admin-web run build`: PASS TypeScript/Vite; JS421.92kB/gzip130.92kB, CSS72.06kB/gzip14.32kB.
- `npm --workspace @coopfood-kph/admin-web test`:PASS19tests/2files trên content cuối.
- `node e2e/scripts/check-admin02-fresh.cjs`: PASS chain4viewport/region scope/Catalog4viewport, account, workflow và screenshot. Đã xem desktop/mobile overview sau dọn chữ; không overflow/pageerror.
- `npm run check:docs`, `git diff --check`:PASS. Search source xác nhận hai câu owner nêu và các class trang trí đã gỡ không còn.

Candidate ghi sau checkpoint. Evidence350tests/Store token parity ởrevision5 giữ provenance, không chạy lại phần Store/backend vì copy/CSS Admin không chạm các phần đó. Technical readiness không thay owner acceptance. Preview4175; không push/merge/deploy.
