# KPH — nhãn màu danh sách, 12/10/2026

Owner yêu cầu thiết kế cơ chế nhãn màu cho các list hiện có, chọn và triển khai
trước trên KPH. Follow-up tiếp tục task UI hiện tại trên nhánh
`store-app/figma-mobile-implementation`, worktree `/Users/vup/Documents/coopfood-kph`,
base `c6d9fa5`; writer của lượt này là Codex trong chat hiện tại. Giữ các WIP
KPH/DATE có sẵn. Technical PASS; owner xác nhận “phong cách nhãn này đẹp” trong follow-up
12/10/2026. Choice và dấu màu item mới có
[bàn giao riêng](kph-choice-items.md).
Preview build mock: <http://127.0.0.1:4213/#kph>.

## Kết quả và quyết định

- [Cơ chế v1](../../product/LIST_LABEL_SYSTEM.md): nhãn chữ/icon/nền nhẹ, sáu
  vai trò neutral/info/process/warning/danger/success; mapping cho KPH và các
  list còn lại được ghi riêng. Chỉ rollout Store Fresh KPH trong lượt này.
- Primitive `ListLabel` compose từ `Tag` với palette scoped; không đổi Tag cũ
  hoặc token brand/status global. Adapter KPH map chính xác accepted label/enum,
  xử lý case/trim/NFC; free text OTHER không bị suy diễn bằng từ khóa.
- Mobile dùng ba nhãn tình trạng/biện pháp/duyệt trên hàng wrap; desktop dùng
  ba cột sẵn có. Skeleton dùng cùng `StoreKphList`, không nhân bản markup badge.
- Hết HSD đỏ; các condition cần chú ý cam. ĐỔI xanh dương, XUẤT TRẢ tím, HỦY
  trung tính. Duyệt xanh/cam/xám kèm chữ/icon. Hàng hết HSD vẫn đỏ dù phiếu đã
  duyệt xanh; màu duyệt không nói rằng hàng an toàn.
- Giữ labels/enum/state, selection/filter/paging, workflow và điều kiện Excel.
  Form choices, detail summary, online/Pilot history, DATE và Admin không reskin.
  Không API/backend/dependency/Figma write; không push/merge/deploy.

## File thuộc lượt này

- `packages/ui/src/list-label.tsx`, `list-label.css`, `list-label.test.tsx`,
  `index.ts`; integration owner của primitive trong lượt này là writer trên.
- `apps/store-pwa/src/store-kph-label.tsx`, `store-kph-label.test.tsx`,
  `store-kph-list.tsx`, `store-kph-fresh.css` (bỏ các override chip KPH cũ).
- `e2e/scripts/check-kph-list-labels.cjs`.
- `docs/product/LIST_LABEL_SYSTEM.md`, `STORE_APP_COMPONENT_CATALOG.md`,
  `STORE_APP_VISUAL_DNA.md`, `packages/ui/DESIGN_SYSTEM.md`, CURRENT_STATE/NEXT
  và bàn giao này.

Các source DATE và follow-up trước có sẵn trong working tree thuộc phạm vi
khác; không coi chúng là thay đổi của nhãn KPH. Preview riêng đọc build đã kiểm.

## Kiểm chứng

| Lệnh | Kết quả |
| --- | --- |
| `npm run verify` | PASS docs/contract/API drift, TypeScript, 253 frontend/package tests và Store online/Admin build. |
| `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build -- --outDir ../../.local/kph-list-labels/build --emptyOutDir` | PASS mock build/PWA. |
| `STORE_PREVIEW_URL=http://127.0.0.1:4213 node e2e/scripts/check-kph-list-labels.cjs` | PASS 390×844/1440×1024/320×844: đủ 6 tones, 3 chiều mỗi phiếu, icon/text/category, contrast, nhãn dài tăng chữ 150%, search/selection/review/export eligibility. |
| `STORE_PREVIEW_URL=http://127.0.0.1:4213 STORE_KPH_COLORS_OUTPUT=.local/kph-list-labels/filter node e2e/scripts/check-kph-filter-sort.cjs` | PASS 3 viewport: sort/filter/reset/date guard/selection, keyboard/picker/focus, contrast/bounds/touch. |
| `STORE_PREVIEW_URL=http://127.0.0.1:4213 node e2e/scripts/check-kph-fresh.cjs` | PASS 3 viewport: list/search/selection, form hai loại, recovery/readonly/touch/modal focus. |
| `STORE_PREVIEW_URL=http://127.0.0.1:4213 STORE_PROGRESSIVE_OUTPUT=.local/kph-list-labels/progressive node e2e/scripts/check-progressive-layout.cjs` | PASS 390×844/1440×1024: geometry khung → ready ≤1px, không ghi nhận layout shift ở KPH/Home/form. |

Unit mới kiểm exact alias/code, fallback OTHER không suy diễn, text/category/icon
không thêm control, ba chiều mobile/desktop và callback mở/chọn còn đúng.
Browser kiểm chặn tải Excel ở confirmation khi phiếu đã đổi sang Không duyệt;
opener Xuất Excel vẫn cho xem số phiếu đủ/không đủ điều kiện như workflow cũ.

Evidence ignored: `.local/kph-list-labels/evidence` (ảnh hai loại/ba viewport,
reflow/contrast/results JSON), `.local/kph-list-labels/filter`,
`.local/kph-list-labels/progressive`. Gate Fresh giữ output hiện có
`.local/kph-fresh`. Gate progressive có output cố định
`.local/progressive-loading/check` (không đọc biến output); đã copy evidence
sang thư mục của lượt này. Đã xem ảnh TPCN 390/1440/320; không dùng pixel snapshot rộng.
Playwright Chromium chạy ngoài sandbox theo automatic approval cho localhost.

## Giới hạn và bước kế tiếp

Technical gate là build mock/fixture và regression frontend, không phải nghiệm
thu owner, camera thật hoặc real-backend E2E. Warning chunk ExcelJS lớn có sẵn
vẫn hiện; lượt này không đổi export dependency. Các list khác chỉ có mapping
đề xuất, không tự coi đã áp dụng cơ chế mới.

Bước nhỏ tiếp: owner xem KPH ở preview 4213, so sánh TP khô/TP tươi và bảng
desktop. Sau khi chốt nhãn, áp adapter riêng cho DATE hoặc list kế tiếp được chọn.
