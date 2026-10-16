# KPH — tối ưu size/spacing thanh nhãn, 12/10/2026

Owner yêu cầu tối ưu kích thước và spacing khi chèn bar vào danh sách.
Tiếp tục `store-app/figma-mobile-implementation`, base `c6d9fa5`, worktree
`/Users/vup/Documents/coopfood-kph`; writer scope KPH trong chat này.
Owner đã xác nhận “đạt, checkp, nhân bản” ngày 12/10/2026; checkpoint local
`5fdfa3e`. Preview mock <http://127.0.0.1:4213/#kph>.
[Checkpoint/decision](kph-label-checkpoint.md), [rollout kế tiếp](../list-label-rollout/handoff.md).

## Kết quả và quyết định

- Bar cũ đặt absolute sát mép (6px mobile/4px desktop), chiều dài theo chiều
  cao item tối đa 64/40px, chưa dành rãnh nội dung riêng. Chuyển sang bar KPH
  **3px**, độ dài cố định **36px mobile/24px desktop**, inset **12px**.
- Mobile dùng grid với cột marker 3px/gap 12px; bar offset 20px, theo khối
  tên/SKU. Phần nội dung padding-left 0 vì grid đã dành rãnh riêng. Khi Chọn,
  thêm cột checkbox 44px; marker đứng nguyên rãnh và không lấn vùng chạm.
  Label checkbox bỏ margin-left 4px thừa; giữ khoảng cách 12px giữa cột.
- Desktop bar 24px căn giữa dòng, leading cell padding-left 28px; heading
  first cell cùng padding để chữ heading/body và checkbox thẳng lề.
- Giữ bảng màu, ba nhãn chữ, choice, typography và workflow. Bar dài cố định
  không phình theo tên/nội dung wrap. API primitive không đổi; size override
  scoped tại KPH, variant bar mặc định trong packages/ui vẫn 4px/40px.

## File đổi

- `apps/store-pwa/src/store-kph-fresh.css`: rãnh/grid, size/alignment/padding.
- `e2e/scripts/check-kph-marker-layout.cjs`: geometry và interaction có mục tiêu;
  `check-kph-choice-items.cjs`: cập nhật yêu cầu size/inset hiện tại.
- `docs/product/LIST_LABEL_SYSTEM.md`, `STORE_APP_VISUAL_DNA.md`,
  `STORE_APP_COMPONENT_CATALOG.md`, CURRENT_STATE/
  NEXT, bàn giao này; `kph-choice-bars.md` đánh dấu thông số cũ là mốc trước.

## Kiểm chứng

| Lệnh | Kết quả |
| --- | --- |
| `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build -- --outDir ../../.local/kph-list-labels/build --emptyOutDir` | PASS TypeScript/build/PWA; warning chunk ExcelJS có sẵn. |
| `STORE_PREVIEW_URL=http://127.0.0.1:4213 node e2e/scripts/check-kph-marker-layout.cjs` | PASS 390×844/1440×1024/320×844, cả TPCN/TPTS, 25 item mỗi loại: size/inset, clearance chữ/checkbox ≥12px, checkbox ≥44px, marker đứng nguyên rãnh khi Chọn, không overflow; tên dài tăng chữ 150%, mở phiếu và restore focus. |
| `STORE_PREVIEW_URL=http://127.0.0.1:4213 node e2e/scripts/check-progressive-layout.cjs` | PASS 390/1440 KPH/Home/form, geometry frame→ready ≤1px, không layout shift. |
| `STORE_PREVIEW_URL=http://127.0.0.1:4213 STORE_LABEL_OUTPUT=.local/kph-marker-spacing/list-regression node e2e/scripts/check-kph-list-labels.cjs` | PASS 390/1440/320: ba nhãn/sáu tone, contrast/reflow 150%, search/select/review/export eligibility. |
| `npm run check:docs`, `git diff --check` | PASS. |

Đã xem ảnh mobile 390, Chọn 320 và desktop 1440. Evidence ignored tại
`.local/kph-marker-spacing/evidence` và `list-regression`, progressive giữ output
`.local/progressive-loading/check`. Playwright headless qua automatic approval
cho localhost; không Computer Use/pixel snapshot rộng. Lượt CSS này không thêm
unit test mô phỏng implementation; kiểm geometry trực tiếp trên browser thật.

## Giới hạn và bước nhỏ tiếp

Gate dùng mock/fixture, không phải real-backend E2E. Owner đã nghiệm thu
spacing KPH riêng; không suy nghiệm thu các list nhân rộng.
Không đổi các WIP DATE/choice/API/quyền, không push/merge/deploy. Bước nhỏ tiếp:
xem bản nhân rộng theo yêu cầu mới của owner trong bàn giao rollout.
