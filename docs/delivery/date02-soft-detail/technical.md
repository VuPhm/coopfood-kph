# DATE02 — chi tiết lô, nhắc lại và tạo KPH, 23/10/2026

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

## Revision3 — Ghi nhận / Xử lý, 23/10/2026

Owner yêu cầu “ghi nhận: cho chọn1ngày hoặc1tuần sau báo lại; xử lý: tạo phiếu
kph tương ứng”. Tiếp tục cùng nhánh/worktree, từ checkpoint visual fa1a536 /
ledger1e9fbea. Đây là scope chức năng mới: tăng review limit lên3 và invalidated
gate liên quan; không coi yêu cầu mới là nghiệm thu candidate revision2. Các
mục pending/checkpoint r2 phía trên là lịch sử, r3 mới là candidate đang xem.

### Thay đổi và invariant

- DATE Ghi nhận mở radio1ngày/1tuần với ngày hẹn; Hẹn báo lại mới ghi acknowledged
  + remindOn, Hủy giữ nguyên. Có xác nhận ngày đã hẹn và có thể đổi lịch. Đến
  ngày hẹn, lô trở lại Mở/Cảnh báo, có card trong Thông báo và toast một lần khi
  app hiển thị. Không mất lời nhắc vì tab ẩn; đồng hồ cấp Store cập nhật nửa đêm
  HCM/focus/visibility, cleanup timer/listeners, không poll/timer từng lô.
- Xử lý mở form KPH có sẵn. Kind lấy metadata explicit của fixture; thiếu kind
  mở chọn TPCN/TPTS. Seed giữ SKU string, barcode/NCC/name/unit đã biết và lô/
  NSX/HSD ở note; không tạo NSX/HSD field mới trong contract KPH, không bịa
  catalog/ảnh/tồn. Loại không biết do người dùng chọn; đơn vị mặc định vẫn có
  thể sửa. Phase EXPIRED gợi ý Hết HSD; warning/danger gợi ý Cận date; khác giữ
  default của form. Actor/ngày phát hiện/read-only/photos/review giữ nguyên.
- Chỉ Gửi phiếu thành công mới đưa record PENDING vào cùng Store session rồi
  gắn kphRecordId và resolved. Chặn SKU khác nguồn trước save. Hủy/lỗi giữ DATE;
  retry cùng idempotency key, guard chống gửi lặp, resolved không tạo lần nữa.
  Condition DATE/percent/màu biểu đồ độc lập trạng thái xử lý.
- Tách `store-kph-create-control.tsx` từ host đã duyệt, giữ nguyên portal/
  animation/skeleton/lazy mount/focus/review/scroll; thêm seed optional. KPH gốc
  và DATE dùng cùng host. `store-kph-draft-record.ts` gom phép map record cũ
  cho hai entry point thật, không đổi shape/snapshot/URL lifetime. Không thêm
  dependency, API hay backend. Default dialog/online/Pilot không nhận seed.
- `create-record-dialog.tsx` chỉ thêm seed whitelist (không actor/date/photos/
  quantity) và nhận diện SKU seed; barcode đổi vẫn qua lookup/error policy cũ.
- `store-date-actions.ts`, `use-business-date.ts`, `store-app-mock.ts` giữ pure
  calendar/seed metadata; `store-app.tsx` giữ records/lots/nhắc trong phiên;
  `store-notifications.tsx` hiển thị các lô đến hẹn. `store-date-workspace.tsx`
  và CSS thêm choices/notice, giữ nền trắng/xám và toàn bộ chart styles r2.
- Product model ghi rõ behavior prototype mới, không tự đổi DOMAIN_RULES,
  OpenAPI/generated client, backend/auth, shared UI/rules, root config hoặc Pages.

### Kiểm tra r3

- `VITEST_MAX_WORKERS=2 npm run verify`: PASS docs/contracts/API drift/types,
  **327 tests** (Admin16/Store274/API2/rules19/UI16), default builds/PWA.
  `.local/date02/verify-r3.log`. Khắc phục lỗi type của test options trước gate
  này; không bỏ assertion hoặc tắt check. Sau gate chỉ thêm xử lý toast/visibility
  và notice/focus nhỏ; component reminder cuối11tests PASS và final type/mock
  build + production browser gate kiểm trực tiếp những thay đổi đó.
- Tests mới: lịch+1/+7 qua năm/tháng/leap day; legacy ack/resolved không tự
  suy lịch; metadata/unknown/invalid seed; clock midnight/resume/cleanup; form
  prefill giữ SKU có số0; hủy lịch/hủy KPH, lỗi rồi retry, chặn SKU khác; Store
  thông báo và cảnh báo lại theo ngày. KPH form thật được dùng trong unit
  transaction, không thay bằng mock form dễ pass.
- Production mock build cuối PASS, PWA114 precache. Warning ExcelJS chunk lớn
  từ baseline. `.local/date02/mock-build-r3.log`.
- `check-date-actions.cjs`: PASS390/1440/320, nhắc1/7ngày → chưa tới hẹn không
  thông báo → đến hẹn báo lại/Cảnh báo Mở; TPCN/TPTS prefill, cancel/focus,
  ảnh/review/Gửi phiếu, một record PENDING cùng phiên, DATE resolved giữ expired/
  %; chưa biết kind phải chọn, Hủy giữ dữ liệu. `.local/date02/actions-final.log`.
- `check-date-refinement.cjs`, `check-date-compact.cjs`: PASS production390/1440/
  320 + màn thấp390×568, palette/contrast/%/text150/focus/CTA/metadata. Gate cũ
  đổi assert resolve trực tiếp sang entry Xử lý; transaction đầy đủ ở gate trên.
- `check-kph-create-forms.cjs`: PASS hai form gốc×390/1440/320, default/Other/
  photo bounds/recovery/error/review/focus; không để seed DATE rò sang form gốc.
- `check-date-milestones.cjs`: PASS các mốc/rounding/HCM/geometry/parity Tra hạn
  và thiếu NSX. `chart-parity.cjs`: PASS390/1440, computed colors/gradients của
  chart nguyên bản4276 và candidate4278 giống nhau. Source timeline/rules không
  đổi. Logs `milestones-final.log`, `chart-parity-r3.log`.
- `npm run check:docs`, local links/scope, `git diff --check`: PASS cuối bàn giao.

Evidence/screenshot fixture tổng hợp ignored trong `.local/date02/`, không dữ
liệu vận hành thật. API DATE/persistence/push ngoài ứng dụng vẫn chưa có; reload
mất lịch và dữ liệu phiên. Chưa xác minh Safari/thiết bị cửa hàng hoặc backend
thật. Nhắc trong app và record PENDING không phải thông báo đẩy hay phiếu đã
đồng bộ/được duyệt. Không đổi ảnh original/stamped policy của đường online.

### Xem r3

<http://127.0.0.1:4278/#date>: mở lô → Ghi nhận → chọn1ngày/1tuần → Hẹn báo lại;
thử Hủy trước. Xử lý → kiểm thông tin lô/ảnh → Xem lại → Gửi phiếu; kiểm phiếu
ở KPH và trạng thái lô. Với lô thiếu catalog, phải chọn loại trước. Giữ review3
bounded; technical PASS không thay owner acceptance, chưa merge/push/deploy.

Final polish sau các gate: Hủy của picker dùng nền trắng/viền control để phân
biệt Hẹn báo lại; chỉ CSS và comment thừa. Final mock build/typecheck và
transaction gate390/1440/320 chạy lại PASS, không đổi data/mốc/timeline.

Code checkpoint r3 **`b50ec3fdd9b15196a00b6173c28d5169024a3c8c`**; sau checkpoint
chỉ ghi ledger. Cây task sạch, source giữ đúng bản kiểm; owner pending.
Main vẫn467d8d6 sạch, chưa merge/push/deploy candidate này.
