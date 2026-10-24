# COMPACT01 revision2 — technical PASS, owner pending

Candidate `a89d13c824638ab3993f636f211b73af8e1a9af3`. Runtime checkpoint
`5b4c8c4` đã kiểm; a89 chỉ sửa gate login và CURRENT_STATE/NEXT, runtime không
đổi. Preview production <http://127.0.0.1:4342/#kph>; baseline4341 dùng để so.
Trạng thái **AWAITING_ACCEPTANCE**, chưa ghi owner nghiệm thu.

## Phạm vi và quyết định

- Nhánh `store-app/compact01-interface-density`, một writer tại
  `/Users/vup/Documents/coopfood-kph/.local/worktrees/compact01-interface-density`.
- Task base`0a257309ae0db1a45cc9d225207a8e0080a99206` ghép đúng FORM01d4f9d17
  chứa header816b4e3. Main vẫnf77034d; không sửa worktree/acceptance FORM01.
  Owner “tiếp tục thực hiện” cho phép triển khai Compact. Dependency phải
  merge main trước của planningr1 được thay bằng stacked task baseline; không
  suy acceptance hay merge FORM01 từ quyết định này.
- Chế độ gọn trong account sheet, mặc định tắt, áp ngay, lưu browser/device;
  storage lỗi vẫn hoạt động trong phiên và nói rõ chưa lưu. Không có API mới.
- App/loading/portal cùng scope; ra login/unmount cleanup. Provider không
  remount workspace. Functional areas trước, item nhẹ; không scale/font theme.
- Header/hero loại account và DOM portal khỏi scroll-to-top; control tìm kiếm/
  Back vẫn reveal như cũ. Account body cuộn riêng, header màn thấp gọn hơn.
- Không sửa packages/ui, backend, domain, OpenAPI, migration, root config/lock
  hoặc dependency sau task base. Không merge main/push/deploy/Pages.

Runtime files: `store-density.tsx`, `store-density.css`, `store-account-sheet.tsx`,
`store-app.tsx`, `store-app-frame.tsx`, `store-app-header.tsx`, `store-page-hero.tsx`.
Test: `store-density.test.tsx`, `check-store-density.cjs`, `check-store-page-kit.cjs`.
Quy tắc và hồ sơ: [density](../../product/STORE_APP_DENSITY.md), CURRENT_STATE,
NEXT và thư mục cycle này.

## Số đo production

Cùng fixture/font/trạng thái; 390×844 và1440×1024. Các giá trị thực, không ép
mọi màn đạt mục tiêu thử24–48px. Selector/geometry đầy đủ trong
`.local/compact01/final-density/results.json`.

| Vùng đo | 390px: mặc định → gọn | 1440px: mặc định → gọn |
| --- | --- | --- |
| Hero KPH gồm header/search/tạo | 212 →196px (-16) | 220 →196px (-24) |
| Tổng4section bộ lọc KPH | 656 →608px (-48) | 552 →504px (-48) |
| Hàng/item KPH đầu | 99 →95px (-4) | 60 →56px (-4) |
| Nhóm kỳ/phạm vi Báo cáo | 122 →114px (-8) | 70 →58px (-12) |

Ở320px bộ lọc chỉ giảm16px vì đã có inset12px và cần giữ nhãn/nút; không
ép tiếp. 900px nhóm report settings138→114px. Header vẫn72px; input16px;
item/tên/%HSD/tag giữ typography/hierarchy. Comfortable parity trong1px,
ngoại trừ nhóm Cài đặt mới và account layout cần để chứa nó.

## Lệnh và kết quả cuối

macOS, Nodev26.0.0, Playwright1.62/Chromium headless; fixture/ảnh tổng hợp,
không Computer Use. Artifact production `.local/compact01/build` (116precache),
baseline `.local/compact01/baseline`; logs dưới `.local/compact01/logs`.
Task dependency symlinks third-party, @coopfood-kph trỏ đúng task. Không install.

- `VITEST_MAX_WORKERS=2 npm run verify`: **PASS342tests** = Store289 + Admin16
  + API2 + rules19 + UI16; docs/contracts/generated API/types/build/PWA PASS.
  Log`final-verify.log`. Warning chunk ExcelJS lớn là baseline.
- `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build
  -- --outDir ../../.local/compact01/build --emptyOutDir`: PASS, `build.log`.
- `STORE_PREVIEW_URL=http://127.0.0.1:4342 STORE_BASELINE_URL=http://127.0.0.1:4341
  STORE_DENSITY_OUTPUT=.local/compact01/final-density node e2e/scripts/check-store-density.cjs`:
  **PASS**390×844,1440×1024,320×844,900×650,844×390; default parity7màn,
  switch thật bằng Space, persistence/reload/malformed/denied, portal bounds,
  state/group/collapse/query/report selection, anchor, text150/200%, forced
  colors switch, contrast≥4.5, print geometry. Compact actions390/1440 PASS:
  DATE nhắc1/7, hai loạiKPH error/ảnh/review/submit, phiếu Chờ duyệt đúng lô,
  report create/history/Excel16rows7lô+string SKU/PDF và Tra hạn đúng ngày.
  Log`final-density.log`, screenshots/XLSX/PDF dưới`final-density/`.
- `STORE_PREVIEW_URL=http://127.0.0.1:4342 node e2e/scripts/check-store-page-kit.cjs`:
  **PASS7màn×7viewport**390/1440/1920/2560/320/768/844landscape; khung, green/
  white/overlap, scroll/focus/account/login/custom report parent và150% chữ.
  Log`final-pagekit-v2.log`; giữ mọi assertion kích thước/palette/bounds.
- `STORE_PREVIEW_URL=http://127.0.0.1:4342 STORE_SCROLLBARS_OUTPUT=.local/compact01/final-scrollbars
  node e2e/scripts/check-store-scrollbars.cjs`: **PASS5viewport**,7màn/dialogs,
  kéo native thumb, sidebar, lock/restore và không tràn ngang. `final-scrollbars.log`.
- `STORE_PREVIEW_URL=http://127.0.0.1:4342 STORE_REPORT_OUTPUT=.local/compact01/final-selection
  node e2e/scripts/check-report-selection-dock.cjs`: **PASS390/1440/320**, scope/
  mixed/menu/nested popup/focus/dock/text150/màn thấp; `final-selection.log`.
- `npm run check:docs`, `git diff --check`: PASS.

Full verify/density/scrollbar/dock chạy ở runtime checkpoint5b4c8c4. Sau đó
chỉ gate pagekit và state docs đổi ởa89; `git diff --quiet 5b4c8c4 a89d13c --
apps packages contracts backend` exit0. Reuse evidence đó vì source runtime,
unit tests, shared packages/domain/API/build inputs không đổi. Gate pagekit
mới chạy trên artifact cùng runtime sau sửa assertion, source khớpa89.
Các commit ledger saua89 không đổi runtime hoặc tests.

## Chẩn đoán ảnh hưởng gate

Pagekit cũ fail cả baseline4341 lẫn candidate tại login desktop/text150:
so y của logo20 với empty account slot14. Login không có account. Sửa kiểm
cho đúng consumer: logo vẫn44×44; giữ alignment với account thật trên màn
đã đăng nhập và toàn bộ gate geometry/overflow/focus. Không sửa login runtime
hoặc tắt test; baseline failure lưu trong`baseline-pagekit.log`.

Anchor test dùng scroll64px nơi account hit-test được. Ở scroll450px, page
kit che header và Playwright tự cuộn lên để bấm; không dùng luồng giả này để
chứng minh giữ anchor sâu. Component test chứng minh draft/selection portal
không remount và focus portal không kéo trang. Chưa tạo đường settings mới
trong form đang khóa modal. Đã xem ảnh KPH/report mobile, report desktop,
choice sheet landscape và reviewTPCN; không pixel snapshot rộng.

## Nghiệm thu và giới hạn

Mở4342 → Tài khoản → Cài đặt → Giao diện → **Chế độ gọn**. So KPH/DATE,
bộ lọc, Báo cáo kỳ/phạm vi và form tạo phiếu; tắt để so default. Thử chọn
phiếu/đóng nhóm trước toggle, reload và Tra hạn. Bước nhỏ tiếp: owner xem
hai mật độ và quyết định; technical PASS không suy owner acceptance.

Mock memory-only/browser-local; chưa chứng minh backend/Safari/Windows,
keyboard OS hoặc thiết bị thật. Không benchmark/chứng nhận accessibility
toàn app. Preview chạy local4342 (session49569); baseline4341 (session83283),
dev4340 (session19755) là artifact/phiên riêng. Chưa merge main/push/deploy.
