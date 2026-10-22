# UI01 — viền theo Home, mobile trước, hiệu năng sau

Candidate chưa owner acceptance. Một writer trong worktree UI01; không merge,
push hoặc deploy. Base review local `90af8cb`, tiếp nối baseline owner chỉ định
`cbf750a`. Các số đo so với soft-depth checkpoint, không dùng bản0041ac0 sai nền.

## Thay đổi và lý do

- `store-glass.css`: giữ mép Home làm reference; line trang trí alpha6%, nét1px
  được giữ để geometry không đổi. Toolbar bình thường nhẹ; selected/focus/increased
  contrast giữ dấu rõ. Hero input có nền fill tương phản và stroke trắng20%.
- `store-mobile-refinements.css` + import frame: chỉ dưới900px; giảm padding,
  gap, decorative icon và chiều cao tối thiểu thẻ Home, CTA/settings/dock.
  Header72px, font, vùng chạm>=44px, safe-area và nội dung record không đổi.
- `store-app.tsx`, `main.tsx`: Báo cáo tải khi mở; deep link fetch song song
  entry, giữ frame/status/retry khi chậm/lỗi. Không đổi template/history/selection.
- `check-kph-colors.cjs`: tính border RGBA trên fill thực rồi so với nền ngoài;
  không dùng RGB thô bỏ qua alpha. Giữ ngưỡng text4,5/non-text3.
- `check-store-page-kit.cjs`: đợi report frame loaded trước đo; loading/error
  được kiểm riêng, không bỏ assertion geometry.

## Mobile và desktop

Production Chromium, cùng fixture, 390×844 /320×844 /1440×1024.
Lệnh `LABEL=before|after node .local/ui01-mobile-perf/measure.cjs`;
JSON/screenshot ở `.local/ui01-mobile-perf/` (ignored, dữ liệu tổng hợp).

| 390px | Trước | Sau | Kết quả |
| --- | --- | --- | --- |
| Home — đầu “Cần chú ý” | y696 | y610 | lên86px |
| KPH — phiếu đầu | y368 /143px | y350 /143px | lên18px, record cùng cao |
| DATE — lô đầu | y340 /153px | y328 /153px | lên12px, record cùng cao |
| Báo cáo — dòng đầu | y394 /144px | y358 /144px | lên36px, record cùng cao |
| Settings báo cáo | 138px | 122px | giảm16px |

Ở320px record/font cũng giữ nguyên; thẻ Home tự tăng cao nếu text cần, không
cắt chữ để ép min-height. Desktop1440 các rect đo được không đổi.

## Startup production

Service worker bị block để tách module execution khỏi precache install.
Ba cold context mỗi bản, CPU4×, localhost; số nhỏ có nhiễu, không phải field INP.

- JS decoded tới account enabled: **546.931 →439.943 bytes (-19,56%)**.
- Home ready samples trước464/400/394,2ms; sau376,1/374,3/385,6ms.
  Median400→376,1ms; không suy SLO từ ba mẫu.
- Report chunk không được yêu cầu trên Home; có delay/error placeholder, frame
  và recovery; direct `#reports` hoạt động.
- CSS report32,55KB chuyển sang feature chunk. Tổng precache113 assets vẫn đầy
  đủ; không suy “giảm precache/network install” từ số JS module đầu phiên.

## Lệnh kiểm tra và kết quả

- `VITE_STORE_APP_MOCK=true npm run build --workspace @coopfood-kph/store-pwa`:
  PASS TypeScript/Vite/PWA113 assets; warning Excel chunk lớn là baseline.
- `VITEST_MAX_WORKERS=2 npm test --workspace @coopfood-kph/store-pwa`: PASS233
  tests/34 files,29,97s, gồm model/library/report/UI. Không sửa rule nghiệp vụ.
- `STORE_PREVIEW_URL=http://127.0.0.1:4247 node e2e/scripts/check-store-page-kit.cjs`:
  PASS7 màn ×7 viewport390/1440/1920/2560/320/768/844, anchors/header72,
  overlap, native scroll/focus, chữ150%, report/login/skip link.
- `STORE_PREVIEW_URL=http://127.0.0.1:4247 node e2e/scripts/check-store-navigation.cjs`:
  PASS5 viewport, recent/reload/Thông báo/utility/dock/toast/focus/150%/contrast.
- `STORE_PREVIEW_URL=http://127.0.0.1:4247 node e2e/scripts/check-report-selection-dock.cjs`:
  PASS390/1440/320, selection/menu/dock/reflow/keyboard/contrast.
- `node .local/light-glass-cbf750a/audit-soft-glass.cjs`: PASS Home/KPH/DATE/
  composer ×390/1440/320 normal transparency. Screenshot đã xem ba màn mobile.
- `STORE_PREVIEW_URL=http://127.0.0.1:4247 node e2e/scripts/check-report-loading.cjs`: PASS không nạp trên
  Home, giả lập chunk chậm/lỗi với frame/retry, direct link.
- `node .local/light-glass-cbf750a/check-fresh-glass.cjs`: PASS geometry/vật liệu,
  reduced preferences/no-support fallback/modal/Escape/focus. CuộnCPU4×:
  p95off16,7–16,8/on16,7–16,8ms; maxoff16,8/on33,4ms; không gap>34ms.
- `STORE_PREVIEW_URL=http://127.0.0.1:4247 INP_LABEL=ui01-mobile-perf
  INP_SAMPLES=2 INP_EXPECT_NO_BLUR=true INP_CHECK_GEOMETRY=true
  node e2e/scripts/check-modal-inp.cjs`: PASS account/filter/create/quick ×390/
  1440, Escape/focus/geometry/backdrop. CPU6× event samples56–360ms; mobile
  account208/56, filter152/120, create192/144, quick256/208; desktop account
  248/64, filter360/152, create200/152, quick256/152. Không coi là field INP.
- `STORE_PREVIEW_URL=http://127.0.0.1:4247 node e2e/scripts/check-report-offline.cjs`:
  PASS first report use sau reload offline390/1440, precached chunk trả bởi
  service worker; network probe thất bại thật. Không phụ thuộc Home đã mở reports.
- `npm run check:docs`, `git diff --check`: PASS.

## Giới hạn và dùng thử

Đây là Store App mock, chưa chứng minh real-backend hoặc Safari/GPU/pin/thiết bị
thật. Primary record semantics và touch/type không đổi. Lần mở Báo cáo đầu
cần feature chunk; loading/error có recovery; precache offline được kiểm riêng.
Owner chưa nghiệm thu round viền/mobile/performance mới. Bước nhỏ: xem Home,
KPH/DATE và composer trên điện thoại, thử đổi tab/chọn/lọc, mở popup và Báo cáo.
Preview <http://127.0.0.1:4247/#home>.
