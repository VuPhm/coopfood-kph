# KPHON01 assessment

Base b6bd19a là checkpoint ADMIN03 đã accepted/CLOSED. Main59c7caa chưa tích hợp
các candidate này; tiếp từ checkpoint accepted trên worktree task mới, không
merge/push main. Branch store-app/kphon01-effective-context, sole writer root.

BE02/BE03 cũ (2b42c94/4a65334) reusable cho SQL predicates/discovery tests và
Fresh session boundary; không merge branch/ledger hoặc coi acceptance cũ là mới.
Những phần superseded: /me/store-access+kph booleans khác đề xuất hiện hành
/kph/stores+capabilities; tài liệu catalog membership-only lệch CatalogService
hiện gọi P01 requireViewCreate; docs CURRENT/NEXT, preview4381 và quyền push cũ
không áp dụng. Các nhánh BE04–BE16 không được tự tích hợp.

Chọn wire GET /api/v1/kph/stores theo đề xuất hiện hành, array capabilities
VIEW/CREATE/REVIEW/EXPORT; no-store và union scopes, không role/membership giả.
Giữ session và GET /stores hiện có. Catalog mô tả đồng bộ policy thực; chưa wiring
lookup UI. D01 page-local/reset giữ nguyên, không load-more semantics online.

Online dùng shell Fresh; route nghiệp vụ chưa nối có trạng thái rõ, không render
mock DATE/report/notification/KPH hay promise persistence. Phiên/scope lỗi phải
che store cũ, revoke không tự chọn store khác; khả năng thấp hơn phải cập nhật.
Không lưu session/token/selection vào browser authority. Kiểm scope targeted ở
slice này, giữ kiểm tổ hợp toàn roadmap ở vòng cuối theo owner.
