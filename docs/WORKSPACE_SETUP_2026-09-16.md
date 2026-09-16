# Git và workspace trước khi giao việc

Ngày 16/09/2026. Phạm vi được phép: chuẩn bị Git/workspace, chưa triển khai S01–S03.

## Nền Git

- Foundation-02 đã accepted/closed: `d9e33fd41708118a9903e4e5244e249ef3803357`.
- Đã `git fetch origin` thành công ngày 16/09/2026. Tại thời điểm kiểm tra,
  `origin/main` là ancestor của foundation head, chậm 12 commit; không có commit
  riêng phía main. Không reset nền về main vì sẽ thiếu Foundation-02.
- Nhánh tích hợp: `codex/online-stability-integration`, tạo từ foundation head.
  Commit chuẩn bị lưu review, NEXT và tài liệu workspace. Không sửa runtime code.
- Không merge/push/deploy hoặc xóa nhánh cũ trong setup này. Foundation/Pilot và
  nhánh WIP cũ giữ nguyên; không giao task mới vào các nhánh team Foundation-01.

## Bố trí workspace

| Vai trò | Nhánh | Đường dẫn |
| --- | --- | --- |
| Integration owner | `codex/online-stability-integration` | `/Users/vup/Documents/coopfood-kph` |
| S01, chuẩn bị chờ owner giao | `codex/s01-online-scope-guard` | `/Users/vup/Documents/coopfood-kph/.local/worktrees/s01` |

`.local/` đã gitignored. S01 là Git worktree riêng, có index/branch riêng và dùng
chung Git object store. Cài dependencies riêng tại worktree; không symlink
node_modules, không sao chép `.env`, database, ảnh hay session từ workspace chính.
Build/test tạo output tại worktree của task. Không chạy `git clean -fdx` ở root
vì có thể phá `.local` chứa workspace và dữ liệu local khác.

Checkpoint SHA thực và kiểm tra setup được ghi trong
`.local/workspace-setup-20260916.json` tại workspace chính sau khi tạo worktree.
Đây là inventory local, không chứa secret và không phải quyền bắt đầu feature.

## Chờ giao việc, không tự khởi động

- Chỉ S01 được tạo worktree trước. S02/S03 cùng chạm `app.tsx`; triển khai tuần tự,
  tạo worktree từ integration HEAD mới sau khi task trước đã tích hợp.
- Không có agent/task được dispatch bởi setup này. Khi owner giao S01 mới bắt
  đầu implementation, và lập cycle record theo delivery-cycle nếu điều phối
  cả đợt nhiều task. Không mở lại cycle Foundation-02.
- Khi bắt đầu, đọc AGENTS → CURRENT_STATE → NEXT → principles → contract/ADR;
  đối chiếu roadmap S01. Kiểm `git status`, `git branch --show-current`,
  `git rev-parse HEAD` và `git worktree list` trước sửa.
- Nếu integration đã đổi sau setup: giữ các thay đổi task đang có; integration
  owner quyết định cập nhật nền, không tự reset/rebase worktree của người khác.

## Phạm vi S01 đã chuẩn bị

Outcome: response mutation cũ không cập nhật giao diện của store/session mới.

- Allowed: `apps/store-pwa/src/app.tsx`, regression tests
  `apps/store-pwa/src/app.online*.test.tsx`; helper scope và test mới dưới
  `apps/store-pwa/src/` nếu thực sự cần, phải liệt kê trong handoff.
- Không tự sửa OpenAPI/generated client, schema migration, packages/ui,
  root config/lockfile, backend, Pilot persistence hoặc feature Admin.
- Shared files do integration owner giữ. S02/S03 chưa được phép ghi vào vùng này.
- Kiểm thử: deferred response sau đổi store/logout/login; mutation cùng scope
  vẫn hoạt động; không coi abort là rollback server. Chạy Store PWA test/check,
  rồi integration owner chạy root verify và browser gate phù hợp.
- Dừng sau outcome S01; báo commit thật, file đổi, lệnh/kết quả, giới hạn.
  Không làm S02/S03 hoặc refactor App toàn diện trong cùng task.

## Runtime và kiểm tra trước giao

- Java local 21; Docker/OrbStack socket hiện chưa hoạt động. Backend integration
  hoặc E2E cần runtime thật phải khôi phục Docker trước, không skip test để xanh.
- S01 có thể bắt đầu bằng component regression không cần Docker khi được giao.
- Không dùng chung DB/media vận hành cho test. Nếu mở preview sau này: port riêng
  theo worktree và DB/media tổng hợp riêng; không tự dừng process đang có.
- Không cần chạy lại toàn bộ backend chỉ vì setup tài liệu/worktree. Verification
  code baseline của review ở `REVIEW_AND_ROADMAP_2026-09-16.md`.

## Tích hợp sau khi task hoàn tất

Owner kiểm diff/allowed paths và evidence trên task commit; tích hợp vào nhánh
integration rồi chạy gate trên candidate mới. Chỉ sau đó tạo worktree task kế
tiếp. Owner acceptance, merge main và deploy là các bước riêng, không được suy
diễn từ việc workspace đã sẵn sàng.
