# KPH Co.op Fresh — sửa màu r13, 11/10/2026

Technical: **PASS**, owner visual acceptance **ACCEPTED** ngày 11/10/2026.
Preview: http://127.0.0.1:4201/#kph. Nhánh `store-app/figma-mobile-implementation`,
HEAD quan sát `b6247044740157e86f10ddf9a4cfe9c3cf166c38`; chưa có commit candidate.
Giữ cùng writer/worktree; không merge/push/deploy.

## Kết quả theo phản hồi owner

- Hai CTA tạo phiếu đổi từ pastel sang nền đặc: TPCN cam `#c24e00`, TPTS xanh
  `#00724e`, chữ/icon trắng. Hover đậm hơn, focus có outline 3px.
- Bỏ đỏ hàng loạt khỏi chip và lựa chọn biện pháp “HỦY”. Condition dùng cam nhẹ,
  biện pháp trung tính; selected xanh, viền kép và chữ đậm. Đỏ chỉ còn lỗi,
  dấu bắt buộc và condition “Hết HSD”. Approval có nhãn chữ riêng.
- Viền ô nhập `#718578`, placeholder/muted `#596b7d`, focus `#20344a`;
  header KPH tối hơn để chữ trắng đọc rõ. Form/sheets giữ gradient modal chung,
  kiểm contrast ở vùng chữ thực tế. Icon lịch và asset gốc giữ nguyên.
- Không đổi enum, lựa chọn mặc định, state, validation, eligibility, dữ liệu,
  API hoặc tone functions dùng bởi consumer khác. Bảng màu được bổ sung trong
  [Visual DNA](../../product/STORE_APP_VISUAL_DNA.md).

## Files trong follow-up này

- `apps/store-pwa/src/store-kph-fresh.css`: vai trò màu/CTA/control/focus/selection.
- `apps/store-pwa/src/store-kph-list.tsx`: presentation class cho condition và
  resolution, giữ label/state, không dùng tone domain làm màu cảnh báo đại trà.
- `e2e/scripts/check-kph-colors.cjs`: đo màu computed và nền tại vị trí text,
  resolve transparent/gradient; kiểm text/placeholder, input boundary,
  selection/focus và hover/lỗi ở hai loại form. Ngưỡng so không làm tròn.
- Visual DNA, CURRENT_STATE, NEXT và hồ sơ cycle: phản hồi r13, bảng màu,
  kết quả, review round 2. `plan-r12.json` giữ ledger trước khi sửa.

Các file reskin r12 còn lại vẫn trong working tree, liệt kê ở
[bàn giao r12](kph-coop-fresh-handoff.md); không gom thay đổi ngoài task.

## Kiểm tra

| Lệnh | Kết quả |
| --- | --- |
| `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build -- --outDir ../../.local/kph-fresh-build --emptyOutDir` | PASS TypeScript/build/PWA |
| `node e2e/scripts/check-kph-colors.cjs` | PASS 56 trạng thái tại 390×844, 1440×1024; text tối thiểu 4.6243:1 ≥4,5; boundary tối thiểu 3,9412:1 ≥3; focus/selection ≥3 |
| `node e2e/scripts/check-kph-fresh.cjs` | PASS 390×844, 1440×1024, 320×844; layout, touch, search/selection reset, form/recovery, modal focus |
| `STORE_PREVIEW_URL=http://127.0.0.1:4201 node e2e/scripts/check-progressive-layout.cjs` | PASS Home/KPH ở hai viewport; không layout shift, skeleton/live geometry và scroll giữ nguyên |
| `STORE_APP_URL=http://127.0.0.1:4201 node e2e/scripts/check-store-qa-repairs.cjs` | PASS hai viewport; tạo/review/duyệt/chọn/xuất đúng SKU, DATE/quick regression |
| `STORE_APP_URL=http://127.0.0.1:4201 node e2e/scripts/check-modal-ui.cjs` | PASS năm viewport; shared gradient/backdrop, focus/scroll lock/picker, giữ form chưa lưu |
| `git diff --check` | PASS |

Lần kiểm đầu script mới phát hiện thao tác test vào radio ẩn không ổn định;
đã đổi sang click label như người dùng và assert checked. Phép đo không chấp
nhận NaN. Không sửa test nghiệp vụ/shared modal cũ hoặc tăng timeout.

Build log/contrast JSON: `.local/kph-fresh-colors/`. Screenshots và Fresh
interaction JSON: `.local/kph-fresh/`; đã xem trực quan danh sách mobile,
form desktop và các sheet. R12 screenshots/source manifest đã giữ riêng ở
`.local/kph-fresh-r12/`. Manifest hiện tại ở
`.local/kph-fresh-colors/source-manifest.json`.

Unit/full verify 228 tests và online build r12 giữ bằng chứng lịch sử; không
claim chạy lại ở r13. Follow-up chỉ presentation nên dùng TypeScript build
và targeted Playwright cho thay đổi màu/interaction/geometry.

## Giới hạn và bước tiếp

Đây là kiểm contrast có mục tiêu trong KPH, không chứng nhận toàn app đạt WCAG.
Icon ảnh, consumer ngoài KPH, thiết bị/camera thật và backend thật không được
chứng minh bởi audit này. Các workflow chạy dữ liệu mẫu trong preview.
Chữ nhỏ ≥4,5:1 và control cue ≥3:1 dựa trên
[W3C SC 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) và
[SC 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).
Owner xem hai CTA cam/xanh, danh sách và lựa chọn form tại 4201; chưa mở rollout
màn khác trước phản hồi nghiệm thu. Candidate-SHA gates còn pending vì chưa commit.

## Follow-up cùng r13: “tab thiếu tương phản”

Sửa `store-kph-fresh.css`: selected nền xanh đậm/chữ trắng, badge trắng/chữ xanh
và gạch trắng ở đáy; unselected nền sáng/chữ đậm. Không đổi markup, state, loại
phiếu, chiều cao hay hit area. Nền selected so với track/unselected **5,6721:1**,
chữ trắng trên xanh **5,9711:1**. Phản hồi này chỉ ra khoảng trống của audit cũ:
text/background đủ tương phản nhưng nền selected gần trùng nền tab còn lại.

`check-kph-colors.cjs` bổ sung kiểm nền selected với track ≥3:1, chuyển cả hai
loại, hover/focus và dấu hình học. PASS **66 trạng thái** ở hai viewport;
`check-kph-fresh.cjs` PASS ba viewport (390/1440/320), mock build/TypeScript PASS.
Ảnh mobile/desktop đã xem lại. Bằng chứng mới `.local/kph-fresh-tabs/`; evidence
trước sửa tab giữ ở `.local/kph-fresh-colors-before-tab-fix/` và
`.local/kph-fresh-before-tab-fix/`. Không chạy lại gate backend/online vì chỉ CSS.
Chưa suy ra owner visual acceptance; bước tiếp xem lại tab tại preview 4201.

Tab follow-up: `check-progressive-layout.cjs` PASS Home/KPH ở hai viewport,
không layout shift; tab CSS dùng chung cho skeleton/runtime. `git diff --check` PASS.

## Nghiệm thu và checkpoint — 11/10/2026

Owner trong chat hiện tại: **“duyệt, checkpoint”**, sau khi nhận bản sửa tab
và preview KPH 4201. Chấp nhận giao diện Co.op Fresh r13, gồm danh sách, form,
sheets, CTA cam/xanh, semantic color và tab. Nghiệm thu này không đóng các gate
backend/thiết bị thật hoặc r5 trước đó. Các câu pending ở trên giữ lịch sử kiểm
thử trước quyết định này. Lưu source và tài liệu bằng commit local; commit SHA
và kiểm hồ sơ được ghi trong bước closeout tiếp theo. Không push/merge/deploy.

Checkpoint source `d9845c721c30055ed4424dfcbc851a55fd13f61d` đã lưu local;
owner gate đã accepted và slice r13 CLOSED. Source giống manifest đã kiểm tra.
Xem [checkpoint và closeout](kph-coop-fresh-checkpoint.md); các câu pending ở
phần lịch sử phía trên không còn là trạng thái r13 hiện hành.
