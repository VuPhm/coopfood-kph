# ADR 0006 — Store App evolution

Status: Accepted — 2026-09-24 (Round 0 baseline)

## Bối cảnh

Repository đã có online KPH, Admin Web, contract, PostgreSQL history và test đã
được xác nhận. Product direction mới cần một ứng dụng vận hành cửa hàng thống
nhất, mobile-first, trong khi nhánh GitHub Pages Pilot vẫn là trạng thái hoạt
động được bảo tồn. Giữ nguyên KPH-centric shell sẽ giới hạn IA; viết lại toàn
bộ sẽ làm mất lợi ích của contract, dữ liệu và verification hiện có.

## Quyết định

- Tiến hóa `coopfood-kph` theo vertical slice, không mặc định rewrite. Store
  Operations App dùng account và shell chung cho các module/capability; “sổ tay”
  chỉ là ẩn dụ product/IA, không yêu cầu chia hệ thống kỹ thuật.
- Giữ Spring Boot modular monolith và PostgreSQL trung tâm theo ADR-0001 cho
  tới khi có bằng chứng cần phân rã và ADR kế tiếp.
- Bảo vệ hành vi nghiệp vụ, public API, data semantics, security outcome,
  migration history và test/fixture đã xác nhận. Có thể thay class, shell,
  navigation, IA, screen/modal boundaries, responsive composition và UI tokens
  khi outcome được kiểm chứng.
- Store App phát triển trên task branch/worktree từ `main`, ví dụ
  `store-app/<task-id>-<slug>`; thử nghiệm độc lập dùng `exp/*`. Tên nhánh mang
  task identity, không mang tên executor; một writer active mỗi task worktree.
- `codex/github-pages-pwa` không là workspace Store App. Giữ commit
  `c789714870eff5912e10fe89361bd845d9e3983d` qua annotated tag
  `preserve/github-pages-pwa-2026-09-24-c789714`. Thay Pages là cutover riêng,
  explicit và có đường quay lại.

## Hệ quả và trade-off

Store App có thể thay UI/IA đáng kể mà không buộc refactor backend để đồng bộ
style. Mỗi slice phải chứng minh contract và scope còn đúng sau tích hợp; task
song song cần owner cho OpenAPI, migration, `packages/ui` và root config. Pilot
và online tiếp tục khác authority; không kéo IndexedDB Pilot sang online chỉ
vì có sẵn. Cách tiến hóa này cần giữ rõ ranh giới legacy/ref mới trong giai
đoạn chuyển tiếp, nhưng tránh migration big-bang.

## Ngoài phạm vi

ADR này không chọn UI Round 1, không mở API cho module tương lai, không quyết
định hosting, data migration Pilot, Pages cutover, offline outbox, microservice
hoặc production storage/retention. Các quyết định đó cần requirement và bằng
chứng riêng.

## Xem xét lại khi

Có bằng chứng rằng modular monolith, incremental migration hoặc ranh giới hai
entry point không đáp ứng yêu cầu vận hành/hiệu năng; hoặc khi một cutover Pages
đã được thiết kế và nghiệm thu riêng.
