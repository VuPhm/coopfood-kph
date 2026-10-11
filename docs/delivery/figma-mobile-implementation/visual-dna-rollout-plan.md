# Chuẩn bị áp dụng Visual DNA cho các màn còn lại — revision 6

Ngày 11/10/2026. Status: PLANNING, preparation complete; chưa triển khai reskin.
Owner đã nghiệm thu Home bằng “quá đẹp” và yêu cầu tích hợp DNA, chuẩn bị các
trang còn lại. Authority cho lượt này: tài liệu DNA, kế hoạch, trạng thái và
nghiệm thu Home. Không suy ra yêu cầu chạy toàn bộ implementation từ “chuẩn bị”.

## Workspace và evidence

Tiếp tục task `figma-mobile-implementation`, branch
`store-app/figma-mobile-implementation`, worktree `/Users/vup/Documents/coopfood-kph`,
writer `/root`. Inspect local ngày 11/10 cho HEAD
`b1c772f4753ad13db1a7930a484ac7933b73b383`; remote chưa fetch vì không tích hợp Git.
Home và follow-up shelf đang uncommitted, gồm file untracked; không coi HEAD là
commit đã chứa Home. Trước dispatch cần reviewed checkpoint gồm đúng các file
code/asset/evidence cần thiết. Không reset hoặc đưa vào scope các worktree khác.

[Visual DNA](../../product/STORE_APP_VISUAL_DNA.md) là hướng được owner chấp nhận.
[Home evidence](home-brand-refinement.md) giữ prompt và kiểm tra thực tế; owner
acceptance này chỉ áp dụng Home, không đóng gate workflow r5 hoặc lịch sử shelf.
Bản kế hoạch r5 được bảo tồn tại [plan-r5](plan-r5.json).

## Outcome và phạm vi

Chuẩn bị từng slice để Store PWA có cùng ngôn ngữ xanh/trắng/pastel/bo góc/icon
với Home; màn nghiệp vụ vẫn nhanh, đọc rõ và giữ semantics. Chỉ một writer,
không dispatch agent ở lượt chuẩn bị. Chưa sửa runtime hoặc `packages/ui`.

| Bước | Phạm vi triển khai dự kiến | Kiểm chứng phải giữ |
| --- | --- | --- |
| 1. Nền UI chung | Token scoped Store App, refactor literal Home; compact header cho màn nghiệp vụ, typography, form/control, panel và sheet; giữ logo Home-only | Home giữ bố cục accepted; context/tài khoản/back, focus, dialog close/return, không ảnh che thao tác |
| 2. Tra cứu | Thanh tìm/quét/CTA rõ, product panel trắng, header nhóm mint, metadata/lô có phân cấp | Found, miss, recovery; SKU và UPC riêng, identifier string, metadata fixture, không suy diễn sản phẩm; submit/busy/scanner vẫn hoạt động |
| 3. DATE | Search/filter/tab, thẻ lô và detail pane thống nhất; accent mint cho module, semantic cảnh báo giữ riêng | Filter/count, Ghi nhận/Đã xử lý và guard, mobile close/desktop detail, đổi màn vẫn giữ state và Home count; chưa bật Thêm theo dõi |
| 4. KPH | Launcher TPCN/TPTS, toolbar/tab/list/table; sau đó create/review/detail/filter/export sheet cùng DNA | Chọn một phiếu không chọn nhầm ID, filter/page reset selection, SKU/UPC, ngày read-only, 1–3 ảnh có thứ tự, review/eligible export; giữ model TPCN/TPTS và privacy |
| 5. Tra hạn lùi | Header/control/surface và lịch sử theo DNA; accent peach cho nhóm tiện ích | Giữ tự tra, holder/state/glow/motion đã nghiệm thu, timeline/mốc/nhãn, main-only history 20 trong phiên, Tra lại, popup route ownership và ID độc lập; không thay công thức |

Mỗi bước kết thúc với technical evidence và preview cụ thể. Chuẩn bị Tra cứu
trước vì scope nhỏ hơn KPH; ưu tiên shelf sau để tránh vô tình thay lại tương tác
đã nghiệm thu. Chỉ mở rộng composition nếu cần để đáp ứng DNA/khả năng đọc.

## Ownership và ranh giới

Integration owner giữ `store-app.tsx`, `store-app.css`, scoped token nếu cần,
`vite.config.ts` khi asset cache thực sự đổi, docs và browser gates. Feature paths
là `store-lookup-workspace.tsx`, `store-date-workspace.tsx`,
`store-kph-workspace.tsx`, `store-shelf-life.tsx`, `store-shelf-history.tsx`, các
test tương ứng; `create-record-dialog.tsx`, `calendar-input.tsx` chỉ thay presentation
có scope, giữ default của online/Pilot consumers. Không rewrite CSS bằng chồng
thêm nhiều lớp override: gom rule của phần được sửa và kiểm computed style.

Giữ shared primitive/token global hiện có; chỉ đưa token/component sang
`packages/ui` khi có consumer thật và review phạm vi ảnh hưởng. Không đổi
OpenAPI/backend/migration/security/domain/API wiring. Không thêm stock module,
notification giả, bottom nav/settings chưa có semantics; không đổi Admin/Pilot,
Excel template/logo, Figma accepted frames hay Pages. Không commit/merge/push/deploy
trong lượt chuẩn bị.

## Acceptance và kiểm tra dự kiến

- Home accepted là reference, chưa có acceptance của các trang được reskin.
  Owner nghiệm thu visual từng slice; gate workflow r5 còn pending riêng.
- Chạy TypeScript, test feature/session phù hợp, build; gate tích hợp cuối dùng
  `npm run verify`. Không coi kiểm tra doc hôm nay là kiểm tra implementation mới.
- Playwright 390×844 và 1440×1024, thêm 320px cho text/form: screenshots xem thật,
  no overflow, touch/focus/keyboard, empty/error/busy/disabled, từng thao tác trong bảng.
- Đặc biệt KPH: chọn/duyệt/xuất đúng phiếu; DATE: update → Home → mở lại;
  shelf: cả main/popup, history recall và công thức/validation; giữ fixture/timezone.
- Chỉ sửa tập finding có mục tiêu, tối đa 2 review rounds cho rollout rồi lập
  repair scope hữu hạn cho blocker thực. Không mở audit vô hạn hoặc bỏ gate nghiệp vụ.

## Readiness và bước tiếp

DNA và thứ tự slice đã sẵn sàng. Bước nhỏ tiếp theo khi bắt đầu triển khai:
review/checkpoint working tree hiện có, rồi làm bước 1 + Tra cứu, dùng Home làm
reference. Chưa dispatch ready vì chưa có code checkpoint của follow-up hiện tại
và yêu cầu hiện hành chỉ chuẩn bị. Các gate r6 chưa chạy và đang pending.
