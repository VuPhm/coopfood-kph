# COMPACT01 revision3 — technical PASS, owner chốt tạm

Candidate`ca543e6c610801c53e97fd84f35a553855e84ec6`, revision3.
Preview production <http://127.0.0.1:4344/#kph>;4342 giữ revision2 để so,
4341 là comfortable baseline trước Compact. Trạng thái **CLOSED, chốt tạm**; [quyết định owner](acceptance-revision3.md).
[Evidence r2](revision2.md) là lịch sử, không chứng minh cấu trúc mới.

## Scope và nguồn quyết định

User phản hồi4342 “chỉ đơn thuần giảm khoảng trống”, yêu cầu token size chuẩn,
lược cấu trúc, tham khảo Apple/UIUX. Tiếp cùng nhánh/worktree/base0a25730
(gồm FORM01d4f9d17 + header816); main vẫnf77034d. Không merge main/push/deploy.

[Size matrix và nguồn Apple/W3C](../../product/STORE_APP_SIZE_TOKENS.md):
spacing4/8/12/16/20/24, icon16/20/24, face36/hit44, control44/52, minimum
row44/56/72, radius8/12/16/24, type roles12/14/16/17/20 và line-height riêng.
Đây là product tokens trong CSSpx; HIG dùngpt, WCAG web có ngưỡng24 và ngoại lệ.
Store giữ44CSSpx cho tác nghiệp chạm; không tuyên bố chứng nhận WCAG toàn app.

## Thay đổi thực

- `store-size-tokens.css`: primitive/semantic sizes Store-local, body scope cho
  portal; `store-density.css` map geometry/control material qua role tokens.
- `store-kph-create-button.tsx`: Compact có DOM inline icon+Tạo TPCN/TPTS,
  bỏ caption/colored label/chevron lặp; vẫn một chạm đúng form và accessible
  name đầy đủ. KPH live/loading bỏ shortcut tạo trùng ở ô tìm và sort riêng;
  sort còn trong sheet hiện có. Heading/count và Chọn/lọc dùng một hàng.
- `store-date-workspace.tsx`: heading/count/lọc một hàng, giữ segment trạng
  thái; sort trong filter; bỏ CTA Thêm theo dõi chưa khả dụng khỏi Compact.
- `store-report-settings.tsx`: composition kỳ + lọc một hàng thay hai settings
  cards; scope active có badge/context, description luôn đầy đủ. Report
  catalog đưa SKU/lô vào selection summary; giữ heading ngữ nghĩa/mixed/scope.
  StoreSettingsGroup thêm className optional; StoreSelectionBar thêm context
  optional; consumer mặc định giữ behavior và geometry.
- Section form/filter phẳng, bỏ hộp nền/khung/bóng lồng; label/lỗi/options/
  ảnh/review giữ đủ. Input auto-height cho chữ lớn, font nhập16px.
- `store-density.tsx`: capture anchor trước React đổi DOM để không nhảy khi
  chuyển cấu trúc; print-media trả composition comfortable rồi phục hồi
  Compact. Draft/filter/selection không reset. Scope cleanup và storage
  fallback tiếp tục nhưr2. Không thêm dependency/shared UI/API/domain change.

## Số đo production

Cùng fixture/font/trạng thái. `.local/compact01/r3-production-density/results.json`.

| Vùng | 390px comfortable → Compact | 1440px comfortable → Compact |
| --- | --- | --- |
| Hero KPH | 212 →184px | 220 →184px |
| List controls KPH | 74 →44px | 44 →44px |
| Controls DATE | 124 →96px | 148 →96px |
| Thiết lập report | 122 →44px | 70 →44px |
| Tổng section lọc KPH | 656 →600px | 552 →496px |

320px period được nở lên56px để giữ đầy đủ ngày; không ép44px. Item KPH vẫn
chỉ giảm4px nhưr2 (99→95mobile,60→56desktop). Bản mới tiết kiệm chủ yếu bằng
bỏ hàng/control/khung trùng. Comfortable và print parity giữ trong1px.

## Lệnh, môi trường và kết quả

macOS/Nodev26, Playwright1.62 Chromium headless; fixture và ảnh tổng hợp.
Không Computer Use. Workspace dependencies trỏ task-local, không đổi lock/deps.
Log dưới`.local/compact01/r3-logs/`; artifact`.local/compact01/r3-build`.

- `VITEST_MAX_WORKERS=2 npm run verify`: **PASS346tests**, Store293/Admin16/
  API2/rules19/UI16; docs/contracts/generated API/types/build/PWA PASS.
  `verify.log`.12density tests gồm direct create/reduced report composition,
  sort access/state, print restore, storage/portal/draft/cleanup/focus.
- `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build
  -- --outDir ../../.local/compact01/r3-build --emptyOutDir`: **PASS**,116precache.
  `build.log`; warning ExcelJS chunk lớn vẫn là baseline.
- `STORE_PREVIEW_URL=http://127.0.0.1:4344 STORE_BASELINE_URL=http://127.0.0.1:4341
  STORE_DENSITY_OUTPUT=.local/compact01/r3-production-density node e2e/scripts/check-store-density.cjs`:
  **PASS390×844/1440×1024/320×844/900×650/844×390**. Comfortable7màn/print
  geometry, real switch/persistence/storage denied/malformed, reduced DOM,
  full44px hit with smaller face, period/filter alignment, sort in sheet,
  flat filter, anchor/query/selection/group/collapse; selected report context,
  contrast≥4.5 and reflow150/200. Workflow390/1440: DATE reminder1/7,
  TPCN/TPTS validation/photo/review/submit/KPH, report/history/Excel7lô+string
  SKU/PDF and Tra hạn đúng ngày. Bổ sung form headers/labels/inputs/buttons
 150/200% ở390/1440: bounds/no horizontal text clipping PASS. `density.log`.
- `STORE_PREVIEW_URL=http://127.0.0.1:4344 node e2e/scripts/check-store-page-kit.cjs`:
  **PASS7màn×7viewport**390/1440/1920/2560/320/768/844landscape: geometry,
  title/Back/ancestor/account/login/focus/scroll và150% chữ. `pagekit.log`.
- `STORE_PREVIEW_URL=http://127.0.0.1:4344 STORE_REPORT_OUTPUT=.local/compact01/r3-selection
  node e2e/scripts/check-report-selection-dock.cjs`: **PASS390/1440/320**,
  master/mixed/menu/scope/nested popup/focus/dock/text150/màn thấp. `selection.log`.
- `STORE_PREVIEW_URL=http://127.0.0.1:4344 STORE_SCROLLBARS_OUTPUT=.local/compact01/r3-scrollbars
  node e2e/scripts/check-store-scrollbars.cjs`: **PASS5viewport**,7màn/dialogs,
  native thumb/lock/restore/overflow. `scrollbars.log`.
- `npm run check:docs`, `git diff --check`: PASS. Đã xem ảnh productionKPH/report
 390/1440/320, filter/choice landscape và form text200. Không pixel snapshot rộng.

Production gates chạy trên runtime726eac9, source checkpoint trước tests.
Sau đó4cad3cd chỉ thêm kiểm form text và state docs; ca543e6 đổi đúng một
reference table height từ control-lg sang row-two và product doc. JS/domain/
packages/API không đổi. Row thật vốn≥56px vì nút44 + padding12; kiểm browser
riêng sau build cuối trên900/1440:25hàng mỗi màn, selection on/off khớp tuyệt
đối với Compact4342 (stdout`row-tokens.log`). Tái dùng các gate khác vì thay
reference này không đổi computed geometry/state và mobile không nhận rule;
print nằm ngoài screen scope. Build cuối đã PASS trên candidate source.

## Bàn giao và giới hạn

Mở4344 → Tài khoản → Cài đặt → Giao diện → Chế độ gọn. Xem Tạo TPCN/TPTS,
list toolbar, sort trong filter, DATE, report kỳ/lọc/count và form phẳng.
Tắt lại để so bản mặc định. Owner đã chốt tạm size/composition tại
reviewRound2/limit2; [đánh giá item list tiếp theo](list-items-next.md) chưa triển khai.

Preview production4344 session69782;4343 là dev revision3,4342 làr2.
Mock memory-only/browser-local, chưa backend/Safari/Windows/keyboard OS hoặc
thiết bị thật. Không đổi palette/chart/timeline/ảnh/export/nghiệp vụ; không
chạm packages/ui/root config/lock/schema/Pages sau base. Main giữf77034d.

## Checkpoint đóng hồ sơ24/10/2026

Candidate hồ sơ`6875575928b9bf7894df1c9744169977dab976b3`; runtime không đổi
từ`ca543e6c610801c53e97fd84f35a553855e84ec6`. `git diff --name-only ca543e6
6875575` chỉ có CURRENT_STATE/NEXT, product density status và ledger COMPACT01.
Tái dùng toàn bộ evidence revision3 ở trên vì không đổi app/test/config/API
hoặc assets. Owner chốt tạm đúng runtime4344; không suy nghiệm thu item mới.
`npm run check:docs` và `git diff --check` PASS sau thay đổi docs;
close consistency gate chạy trên checkpoint này cùng ledger sau đó.
