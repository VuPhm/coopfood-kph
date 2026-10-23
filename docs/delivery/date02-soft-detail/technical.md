# DATE02 — chi tiết lô và phần trăm HSD, 23/10/2026

## Baseline và quyết định

Owner: “đạt, áp tiếp lên DATE, đặc biệt phần chi tiết item; nhân tiện đổi mục
thông tin quá x ngày trong list item thành dạng phần trăm còn lại, có màu tương
ứng”, tiếp “làm đoạn chưa làm được”. SHELF02 đã được chấp nhận; hồ sơ đóng
vòng ở nhánh shelf02 commit ee9f988. DATE bắt đầu từ snapshot đã kiểm
`06ff18b3f74c93cf45cac8bb713cedc2ea42569b`, source Tra hạn efe6f98.
Main sạch ở467d8d6 (KPH03 đã tích hợp); không suy ra quyền merge/push/deploy.

Nhánh `store-app/date02-soft-detail`, worktree
`/Users/vup/.codex/worktrees/date02-soft-detail/coopfood-kph`, sole writer current
chat. Chỉ DATE workspace/list/detail/filter và helper trình bày phần trăm;
không backend/OpenAPI/auth/persistence, packages/ui, root/lockfile, KPH/Tra hạn/
Home/reports rollout. Biểu đồ/timeline và rule mốc giữ nguyên.

Revision2 theo feedback: “màu sắc các phần giao diện và nền bị lộn xộn (màu
biểu đồ thì ok rồi đừng chạm vào)”. Bỏ nền mint ở khối nhận diện và nền màu
ở từng ô mốc, dùng holder trắng với viền mảnh; hai ô tổng hợp cùng xám nhẹ
#f5f8fa. Chỉ chữ/nhãn trạng thái và phần trăm trong list giữ màu semantic.
Không đổi màu, source hoặc CSS selector của biểu đồ. Tab cũ4276 chưa có DATE02;
preview đúng là4278. Review2/limit2; chờ owner nghiệm thu candidate này.

## Implementation

- `store-date-workspace.tsx`: danh sách thay số ngày bằng “Còn n% HSD”; chi tiết
  giữ số ngày và thêm tỷ lệ để đối chiếu. Nhóm nhận diện lô, summary, timeline/
  bảng ngày và CTA rõ ràng. Không đổi callback tìm/lọc/sort/chọn/Ghi nhận/Đã xử lý.
- `store-date-assessment.ts`: thêm helper trình bày, không đổi assessDateLot.
  `% = ceil((remainingDays + 1) / shelfLifeDays ×100)`, clamp0–100; tính cả ngày
  hiện tại để khớp shelfLife inclusive. HSD hôm nay còn ít nhất1%; sau HSD0%.
  Trước NSX tối đa100%, có nhãn Chưa đến NSX. Màu bám phase thật, không phân
  loại lại theo % làm tròn. Thiếu NSX/ngày lỗi không suy phần trăm, kể cả đã qua
  HSD; hiện Chưa đủ dữ liệu/Kiểm tra ngày.
- `store-date-fresh.css`: nền trắng/xám thống nhất, holder edge1px#dfe5e9, bóng
  tĩnh nhẹ có chọn lọc; không thêm blur. Detail desktop và sheet mobile dùng
  cùng recipe. Sheet cuộn trong body trên màn thấp/chữ lớn; header giữ vị trí,
  footer sticky với nút≥48px/focus trong viewport. Giữ các state selected rõ.
- `store-glass.css`: DATE portal nhận token vật liệu/preference overrides sẵn
  có; không thêm token palette hoặc filter. Report không có rollout style mới.
- DATE product model ghi rõ quy tắc trình bày mới, thay yêu cầu cũ không % theo
  chỉ định trực tiếp của owner. Chart không có progress bar mới.

## Kiểm tra và evidence

- `VITEST_MAX_WORKERS=2 npm run verify`: PASS docs/Contract Lock/OpenAPI/API drift/
  types, **313 tests** (Admin16/Store260/API2/rules19/UI16), build/PWA. Log
  `.local/date02/verify.log`. Có12 ca mới cho ratio trước/tại/sau NSX/HSD,
  round-up trên shelf life dài, leap day, thiếu/lỗi ngày. Component kiểm %/màu
  giữ sau resolved, không suy % khi dữ liệu lỗi; cập nhật expected lookup fixture.
- Gate verify chạy ở revision1; revision2 chỉ sửa nền/viền và cách chia body
  scroll CSS, một chuỗi fallback thiếu ngày cùng nghĩa, docs/browser checks.
  Không đổi helper/rules/workflow/test logic; giữ coverage unit/contracts/types.
- Final `VITE_STORE_APP_MOCK=true npm run build --workspace @coopfood-kph/store-pwa`:
  PASS typecheck/mock PWA114 precache; warning ExcelJS chunk lớn đã có ở base.
  `.local/date02/mock-build.log`. Production preview4278 từ output này.
- `STORE_PREVIEW_URL=http://127.0.0.1:4278 node e2e/scripts/check-date-refinement.cjs`:
  PASS390×844/1440×1024/320×844 ×6phase (18cases), ratio/tone/phase, contrast,
  nền trắng/xám thực tế, no blur, list/detail chữ150%, no clipping/overflow,
  CTA/focus/Escape return, missing NSX và processing độc lập. Thêm390×568 PASS
  cuộn content, cả hai nút và keyboard focus trong viewport. Motion bình thường.
- Cùng production URL và output `.local/date02/compact-prod`, chạy
  `check-date-compact.cjs`: PASS390/1440/320, metadata disclosure/keyboard,
  bốn lô, CTA48px, no repeated summaries, contrast/text150%; reduced motion.
- `check-date-milestones.cjs` PASS390/1440/320 ở dev4277: trạng thái tại mốc thật,
  HCM boundary, geometry/contrast, missing NSX, resolved-expired independence,
  timeline parity Tra hạn. Chỉ nền và body scroll thay sau đó; không đổi mốc/
  timeline nên giữ evidence `.local/date02/milestones.log`.
- Đối chiếu chart computed color/background/gradient/border trên mọi node và
  pseudo với bản4276: PASS390/1440, nguyên màu; script/results ignored tại
  `.local/date02/chart-parity.cjs`, `chart-parity.json`/log.
- `git diff --exit-code 06ff18b -- packages contracts backend` cùng source
  shelf-life/timeline: PASS. `npm run check:docs`, local links, scope và
  `git diff --check`: PASS sau bàn giao.

Evidence là fixture tổng hợp, screenshot/log ignored trong `.local/date02/`;
không commit dữ liệu/ảnh thật. Chỉ Chromium mock/component, chưa Safari/thiết
bị thật/API DATE/persistence (vẫn prototype memory-only). Không tuyên bố giảm
latency hay chứng nhận WCAG từ kiểm contrast có mục tiêu. Không timer/chart
library/scroll observer mới; màu và bóng tĩnh, tính % đơn giản theo assessment.

## Owner review

Mở <http://127.0.0.1:4278/#date>, tìm A24-301/A24-255 để xem % và chi tiết,
D24-090 để xem thiếu NSX; thử Ghi nhận/Đã xử lý. Kiểm nền trắng/xám và đối chiếu
biểu đồ cũ. Technical PASS; owner pending. Bước tiếp theo chỉ nghiệm thu scope
DATE này, không tự merge/push/deploy hoặc rollout màn khác.

## Candidate handoff

Checkpoint **`fa1a5369213227976e5d7556e41a4d9a7ff4f70e`**, revision2, review2/limit2.
Sau checkpoint chỉ ghi ledger, không đổi source đã kiểm. Cây task sạch, main
không đổi. AWAITING_ACCEPTANCE; owner gate pending cho DATE02.
