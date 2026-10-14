# KPH — palette choice cũ và thanh cạnh trái, 12/10/2026

Follow-up tiếp theo đã tối ưu thanh thành 3px, rãnh riêng và chiều dài cố định;
xem [spacing hiện tại](kph-marker-spacing.md). Thông số 4px bên dưới là mốc trước.

Follow-up theo phản hồi owner: phát triển lại bộ màu choice đã có, thay cách
đồng màu cam; đổi dấu item thành left sign bar dễ nhìn hơn, cân nhắc Apple-like.
Tiếp tục nhánh `store-app/figma-mobile-implementation`, worktree
`/Users/vup/Documents/coopfood-kph`, base `c6d9fa5`; writer của scope KPH/
primitive là Codex trong chat này. Giữ WIP DATE và nghiệm thu riêng.
Preview mock <http://127.0.0.1:4213/#kph>; owner acceptance phần mới pending.

## Quyết định và kết quả

- Nguồn palette cũ là `KPH_OPTIONS` (`choice.tone`) và CSS choice kế thừa;
  không sửa rule package. Adapter choice riêng chuyển tone thành palette pastel:
  Cận date cam; Rách bao bì/Xì chân không/Dập úng/Thối mốc đỏ; Hết HSD/Khác
  xám. HỦY đỏ, ĐỔI xanh lá, XUẤT TRẢ xanh dương, KHÁC xám.
- Icon đặc trưng từng tình trạng được khôi phục bằng Lucide: kiện hàng/gió/
  trái táo/biohazard. Giữ lưới hai cột, condition Khác ở hàng cuối; selected
  có viền/nền pastel và check, native radio và focus riêng.
- Palette option định danh lựa chọn; palette nhãn record vẫn diễn giải trạng
  thái đã ghi. Choice Hết HSD xám theo bộ cũ nhưng nhãn/bar phiếu Hết HSD đỏ;
  choice HỦY đỏ chỉ ghi biện pháp, không xóa phiếu. Ba nhãn v1 không đổi.
- `ListItemMarker` thêm variant bar, giữ dot mặc định cho consumer tùy chọn.
  KPH dùng bar 4px, bo tròn, dài tối đa 64px mobile/40px desktop, cạnh trái
  mỗi item. Accent riêng rõ hơn ink, tương phản ≥3:1 trên nền list thực.
  Hướng Apple-like ở mức trình bày: thẻ trắng, màu tiết chế, thanh mảnh bo tròn.
- Màu bar theo tình trạng record, không đổi theo duyệt/selection. Khi vào
  Chọn, bar vẫn ở mép trái ngoài checkbox (desktop đổi sang leading cell).
  Bar aria-hidden/noninteractive, luôn kèm nhãn tình trạng chữ/icon.
- Giữ default/enum/thứ tự, OTHER, validation, selection/filter/paging,
  workflow, API/quyền/media/Excel. Không backend/dependency/Figma write.

## File thay đổi của follow-up

- `apps/store-pwa/src/store-kph-choice.tsx`, `create-record-dialog.tsx`,
  `store-kph-loading.tsx`: mapping palette option, icon và skeleton chung.
- `apps/store-pwa/src/store-kph-list.tsx`, `store-kph-fresh.css`: bố trí bar,
  selection leading cell; `store-kph-label.test.tsx`: palette tách record labels.
- `packages/ui/src/list-item-marker.tsx`, `list-label.css`: variant bar/accent;
  `packages/ui/DESIGN_SYSTEM.md`: API/consumer.
- `e2e/scripts/check-kph-choice-items.cjs`: palette cũ, geometry/contrast bar,
  bar trong selection, keyboard/OTHER/choice/reflow.
- `docs/product/LIST_LABEL_SYSTEM.md`, `STORE_APP_VISUAL_DNA.md`,
  `STORE_APP_COMPONENT_CATALOG.md`, CURRENT_STATE/NEXT; bàn giao này và
  ghi mốc trước trong `kph-choice-items.md`.

## Kiểm chứng

| Lệnh | Kết quả |
| --- | --- |
| `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build -- --outDir ../../.local/kph-list-labels/build --emptyOutDir` | PASS TypeScript toàn Store source/tests, build/PWA; warning ExcelJS lớn có sẵn. |
| `npm --workspace @coopfood-kph/store-pwa test -- src/create-record-dialog.test.tsx src/store-kph-label.test.tsx src/store-kph-workspace.test.tsx --maxWorkers=2` | PASS 30 tests form/labels/history; không thay timeout/test security. |
| `npm --workspace @coopfood-kph/ui test` | PASS 14 tests primitive. |
| `STORE_PREVIEW_URL=http://127.0.0.1:4213 STORE_CHOICE_OUTPUT=.local/kph-choice-bars/evidence node e2e/scripts/check-kph-choice-items.cjs` | PASS 390×844/1440×1024/320×844, hai form: palette cũ, bar 4px/leading edge/contrast ≥3:1, bar trong Chọn, radio/arrow keys/check/focus, OTHER, touch, text/indicator contrast và chữ 150%. |
| `STORE_PREVIEW_URL=http://127.0.0.1:4213 node e2e/scripts/check-progressive-layout.cjs` | PASS 390/1440 KPH/Home/form frame→ready geometry ≤1px, không layout shift. |
| `STORE_PREVIEW_URL=http://127.0.0.1:4213 STORE_LABEL_OUTPUT=.local/kph-choice-bars/list-regression node e2e/scripts/check-kph-list-labels.cjs` | PASS ba viewport: 6 tone/3 nhãn, reflow 150%, contrast, search/select/review/export. |
| `STORE_PREVIEW_URL=http://127.0.0.1:4213 node e2e/scripts/check-kph-fresh.cjs` | PASS ba viewport: list/search/selection, hai form/recovery/readonly/touch/modal focus. |
| `npm run check:docs`, `git diff --check` | PASS. |

Evidence ignored `.local/kph-choice-bars/evidence` và `list-regression`; Fresh
gate ở `.local/kph-fresh`, progressive script ở
`.local/progressive-loading/check`. Đã xem ảnh list mobile/bảng desktop Chọn,
form TPCN 390/TPTS 320. Playwright headless, automatic approval cho localhost;
không Computer Use, không snapshot pixel rộng.

## Giới hạn và bước nhỏ tiếp

Kiểm kỹ thuật dùng mock/fixture, không thay real-backend E2E hoặc camera thật.
Lượt này chưa push/merge/deploy; không thay acceptance của nhãn v1/KPH r13/DATE.
Owner tải lại preview 4213, xem hai nhóm choice và bar ở mobile/desktop/Chọn
để nghiệm thu phần mới; sau đó chọn list tiếp theo nếu cần rollout.
