# ADMIN02 revision5 — chuẩn token Fresh mobile và hai vòng tối ưu

Owner yêu cầu bỏ token/comment thừa trước Fresh, lấy Fresh mobile mới nhất làm chuẩn; sau đó tối ưu thêm hai vòng. Quyền tiếp tục UI được giữ; không push/merge/deploy. Revision này thay các palette thử nghiệm Admin ởrevision1–4 bằng cùng nguồn Fresh mobile đang tích hợp tại baseline. Không lấy nhánh cũ chưa tích hợp làm chuẩn.

## Chuẩn hóa

Nguồn thực tế đã đọc: `store-material.css`, `store-button-system.css`, `store-chrome-soft.css`, `store-size-tokens.css`, `store-form-soft.css` trong Store PWA. Bộ `packages/ui/src/tokens.css` là compatibility foundation R1R, không phải authority của palette Fresh hiện hành.

Tách đúng40 literal token đang được cả Admin và Store sử dụng sang `packages/ui/src/fresh-tokens.css`; export CSS qua package UI. Store chỉ đổi RHS từ literal sang alias Fresh và thêm import; các alias/state/override hiện có giữ nguyên. Không nhập CSS selector Store vào Admin. Không đổi JavaScript nghiệp vụ, dependency hoặc lockfile.

Admin có `admin-tokens.css` map Fresh → semantic aliases/utility roles và context dialog. `admin-fresh.css` giữ composition; `admin-fresh-material.css` giữ binding/state. Xóa palette số60/30/10, màu ref thử nghiệm, root token Admin cũ và comment lịch sử khỏi source hiện hành. Docs revision cũ vẫn là provenance. Base compatibility token file dùng bởi shared primitives/Pilot/Store được giữ; Admin override các vai trò Fresh cần dùng thay cho literal R1R.

Baseline so sánh là `ead35df` trước extraction. Store đã so sánh117computed CSS variables trước/sau trích xuất ởChromium390×844, cả no-preference/reduce: hoàn toàn bằng nhau. Đối chiếu10vai trò chạy thật giữa Store mobile mock và Admin cũng khớp: brand#007a52/deep#00583d, ink#183b2d/muted#52655d, canvas#f2f5f3,line#cedbd4,radius12/16,caption12/control14. Scope là token; không suy thành acceptance thiết bị thật.

## Vòng tối ưu1 — cascade và token không dùng

Sau chuẩn hóa, rà cascade CSS có mục tiêu: bỏ6declaration bị cùng selector/context ghi đè, bỏ3alias Admin không dùng (kể cả khai báo còn sót trong forced-colors), đổi class `legacy-workspace` sang `admin-business-workspace`. Giữ selector/style ownership rõ; không đổi handler/query/authorization. Source audit cuối không còn alias Admin khai báo mà không có var consumer, không còn palette/comment thử nghiệm R1R/60:30:10 trong source Admin.

Build sau vòng1PASS; CSS build giảm từ70.94kB/gzip14.38 xuống70.77kB/gzip14.34 trên cùng entry. Không lấy số này làm kết quả payload cuối vì vòng2 tăng cỡ chữ/binding typography.

## Vòng tối ưu2 — thang chữ và trạng thái responsive

Đưa63caption declaration về Fresh caption12, control14, field16/line24, section17 và page mobile20; các utility/portal dùng cùng token. Vùng bấm icon/filter/chart mobile tối thiểu44px. Rà thêm dialog CF context để shared modal không đưa palette cũ trở lại; giữ menu tài khoản trắng opaque, glyph/label căn trái và keyboard/focus behavior. Source indicator mock dùng warning token hiện hành. Bỏ backdrop-filter không còn tác dụng phía sau surface đặc để tránh xử lý blur thừa; không thêm JS/runtime animation.

Xem desktop/mobile overview, Store Home mobile và account menu; không có xung đột layout được browser gate phát hiện. Build JS gzip vẫn131.32kB; CSS tăng do import foundation dùng chung và binding đầy đủ, không báo giảm bundle sau cảhai vòng. Không tắt gate hoặc nới giới hạn chunk để che cảnh báo.

## Kiểm chứng

- Full `VITEST_MAX_WORKERS=1 npm run verify` sau extraction: PASS350tests (Admin19,Store294,API2,rules19,UI16), docs/contracts/generatedAPI/typechecks/build/PWA. Đã chạy lại toàn bộ trên content cuối: PASS350tests, contract/API/docs/typechecks/build/PWA, exit0; log `.local/verify-r5.log`.
- Final focused Admin build/test: PASS19tests và TypeScript/Vite.
- Store Fresh mock build: `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build -- --outDir /private/tmp/coopfood-kph-admin02/.local/fresh-store-preview --emptyOutDir` PASS/PWA. Build warning ExcelJSchunk>500kB giữ nguyên, không thay config.
- `node e2e/scripts/check-admin02-fresh.cjs`: cả bốn viewport1440×1024/1280×1024/834×1112/390×844 đạt với synthetic backend chain; region scope/admin-users403; Catalogfixture bốnviewport; account paint/bounds/keyboard/focus/actions, hash/history, mock filters/details và workspace regressions. Gate cuối sau build đạt đủ9trường hợp (chain4,region1,Catalog4); không overflow/pageerror và menu vẫn opaque/focus đúng.
- QA local `verify-fresh-extraction.cjs`:117Storecomputed tokens unchanged ×2motion conditions. `check-fresh-standard.cjs`:10actual Store/Admin foundation roles bằng nhau.
- `npm run check:docs` và `git diff --check`: PASS trước checkpoint; kiểm lại cuối.

Ảnh/log synthetic trong `.local/verification/admin02-fresh/`, log verify `.local/verify-r5.log` (không commit ảnh/log). Store QA preview4176 đã dừng, không dừng backend/preview membership. Admin preview vẫn http://127.0.0.1:4175/#overview. Candidate/revision/evidence được gắn trong plan sau commit; owner acceptance pending. Không backend/database/API/Pages/deploy changes.

Thiết lập local: root node_modules trước đó symlink sang main nên package export Fresh mới không resolve; đã tạo symlink dependency riêng và trỏ workspace packages về worktree này. Không sửa dependency/main node_modules/lockfile để xử lý lỗi setup.

Payload cuối Admin: CSS72.90kB/gzip14.44kB; JS423.90kB/gzip131.32kB. Không claim giảm payload so với revision4 vì dùng foundation chung và thang chữ đầy đủ. Không có runtime dependency mới.

Candidate content `6aeb9d823a50566ea6e9a2ee32dac9fd910f19d2`; implementation không đổi khi bổ sung metadata/evidence. Technical ready, owner gate pending.
