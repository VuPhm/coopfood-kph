# QA01 — kết quả tinh gọn test và skill

Ngày15/11/2026. Base `1ad090750bbc579554b4e685e97322f5157fc7e5`, nhánh
`store-app/qa01-lean-tests`, worktree `.local/worktrees/qa01-lean-tests`, một
writer Codex. Không tiếp feature hoặc thay code production, contract, schema,
CI, lockfile, nhánh Pages hay tag bảo tồn.

## Thay đổi và quyết định

- Bỏ toàn bộ skill `tooling/skills/delivery-cycle` cùng script/test/template riêng.
  Repo không có skill nội bộ nào khác cần xóa. Các skill/plugin toàn máy khác
  không có bằng chứng là thừa đối với công việc khác nên giữ nguyên.
  Gỡ symlink đăng ký `~/.codex/skills/delivery-cycle`; đăng ký `tdd` trỏ tới
  module ở worktree QA01, có hiệu lực từ lượt mới. Đăng ký ban đầu này được
  chuyển sang repo chính khi tích hợp17/11, như checkpoint bên dưới.
- Chỉ lấy module `tdd` từ [Matt Pocock](https://github.com/mattpocock/skills/tree/5863806dd4e15c63174bee4e7515a4256792ecfa/skills/engineering/tdd),
  ghim source SHA trong skill, giữ license MIT. Điều chỉnh yêu cầu confirm/test
  boundary và phụ thuộc skill khác cho đúng contract và quyền đã có của repo.
- AGENTS đọc tài liệu theo scope; DELIVERY_WORKFLOW gọn, không bắt plan JSON,
  dispatch team hoặc review vòng mới. Hồ sơ nghiệm thu cũ giữ làm provenance.
- [TEST_STRATEGY](../TEST_STRATEGY.md) đặt lợi ích/chi phí cận biên và điều kiện
  dừng. Profile `test:kph` chọn7 file online; không thay full gate.
- KPHON04 giữ review/export/selection/reload và workbook ở hai viewport. Kiểm
  HTTP cross-region review/export và anonymous media chỉ một lần:3 request deny
  thay vì6,2 session reads thay vì4,1 anonymous context thay vì2. Đây là giảm
  công việc trực tiếp, chưa phải số đo tăng tốc hoặc tiết kiệm token toàn dự án.
- Bỏ coupling tới gradient/margin/display/position trong script KPHON04; giữ
  control visibility, sidebar/heading desktop, overflow và ảnh cho owner review.
  Các race, forged request, downgrade và integrity tests khác không bị xóa.

## Kiểm chứng mới trên QA01

| Lệnh | Kết quả |
| --- | --- |
| `VITEST_MAX_WORKERS=1 npm run test:kph` | PASS61 tests,7 files,14.04s; một lượt |
| `STORE_URL=http://127.0.0.1:4177 npm run test:kph:browser` | PASS mobile390×844, desktop1440×1024, HTTP guards một lần và hai phiên downgrade/expiry |
| `npm run check:docs` | PASS docs/JSON fixtures |
| `node --check e2e/scripts/check-kphon04-review-export.cjs` | PASS syntax |
| Skill validation bằng `js-yaml` và Node assert | PASS YAML/name/description/placeholders/local references/license; Python `quick_validate.py` thiếu PyYAML nên không chạy được |
| `git diff --check` và kiểm local links ở tài liệu thay đổi | PASS |

Dependencies cài riêng bằng `npm ci --offline --no-audit --no-fund` ở root và
`--prefix e2e`, không symlink node_modules hay thay lockfile. Preview QA01 riêng
4177 dùng launcher có sẵn, source tại worktree này, Fresh online proxy backend
8082 hiện có; probe anonymous session401. Không rebuild backend hoặc reset DB.
Playwright dùng fixture tổng hợp hiện có, tạo6 phiếu và export, tạm đổi membership
rồi restore bằng finally. Artifact local trong
`.local/verification/kphon04-review-export/` gồm results, ảnh và2 workbook.
Preview QA01 được dừng sau kiểm; preview owner4173/4175/4176 không bị thay.

## Giới hạn và bước nhỏ tiếp

Không chạy lại full frontend/backend/CI vì không đổi executable production hay
contract; kết quả này chỉ chứng minh profile và script test đã sửa chạy được.
Không tuyên bố toàn app PASS, owner accepted, rollout hay thiết bị thật đạt.

Khi owner tiếp tục gate KPHON04: agent xác minh lại URL/mode/source đang chạy,
owner xem mobile/desktop, duyệt/không duyệt rồi mở một Excel tổng hợp để đánh
giá thao tác và khả năng đọc/in. Không giao owner chạy lại security matrix.
Hai vòng tổ hợp và UI/UX cuối giữ pending trong NEXT; không tự mở feature mới.

## Tích hợp và dọn theo owner17/11/2026

Owner đồng ý merge/làm sạch để tiếp lộ trình. Tích hợp hồ sơ KPHON04 `089dd17`
vào QA01 bằng `c955166`, không conflict; main trước tích hợp `59c7caa` là
ancestor nên dùng fast-forward, không ghép lại production code. Quyền merge
không phải nghiệm thu KPHON03–04/UI hoặc quyền push/deploy.

Kiểm mới: `VITEST_MAX_WORKERS=1 npm run verify` **PASS420 tests** (Admin27,
Store350, API4, rules19, UI20), docs/fixtures, contract30 resources/22 examples,
generated API không drift, TypeScript/build/PWA. `git diff --check` và local
links đạt. Tree `apps`, `packages`, `backend`, `contracts`, `.github` và root
lockfile trùng `1ad0907`; backend/browser evidence15/11 vẫn là evidence cũ,
không gọi chúng là lần chạy mới hoặc hai vòng toàn app cuối.

CURRENT_STATE/NEXT đã rút gọn về baseline tích hợp và bước tiếp hiện hành.
Checkpoint dài trước đó vẫn đọc bằng `git show f2b1404:docs/CURRENT_STATE.md`
và `git show f2b1404:docs/NEXT.md`.

Dọn sau fast-forward main: chuyển `~/.codex/skills/tdd` sang
`/Users/vup/Documents/coopfood-kph/tooling/skills/tdd`; xóa worktree QA01,
KPHON04 integration và ba worktree agent backend/export/e2e đã sạch. Xóa hai
nhánh QA01/KPHON04 integration đã merged bằng `branch -d`; giữ ba nhánh agent
làm provenance (patch-equivalent đã xác minh bằng `git cherry`). Không có
workspace còn lại phụ thuộc node_modules ở năm target này. Không dọn các
worktree khác, đặc biệt runtime/media KPHON02/KPHON03 hoặc Pages.

Evidence local được lưu trước khi dọn ở repo chính:
`.local/verification/qa01-integration-2026-11-17/` gồm log verify mới,
artifact QA01/KPHON04/e2e và Surefire reports. Build/dependency cache ở worktree
tạm có thể tạo lại; không mang PID cũ sang runtime mới. Skill không còn phụ
thuộc đường dẫn worktree QA01 sau chuyển đăng ký. Không push/deploy.

Bước tiếp: chuẩn bị Fresh online/Admin từ main và xác minh URL/source trước
lượt owner chốt KPHON03–04 ngắn theo NEXT; hai vòng cuối vẫn pending.
