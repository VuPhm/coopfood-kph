# KPH Co.op Fresh — bàn giao revision 12

Ngày 11/10/2026. Owner yêu cầu **“làm”** sau
[kế hoạch r11](kph-coop-fresh-plan.md). F1–F3 đã triển khai trong working tree;
Technical **PASS trên working tree**, owner visual/workflow acceptance **pending**.
Không đóng các gate nghiệm thu cũ.

## Kết quả

KPH dùng header xanh gọn, nội dung trắng, launcher hồng/mint với icon tròn,
thẻ mobile/bảng desktop dễ đọc, tìm/lọc/sắp xếp hiển thị ở cả hai layout.
Form dùng panel trắng và số nhóm trên nền sáng, CTA xanh, desktop giữ ba cột,
mobile một cột và footer sticky. Chi tiết/lọc/xuất dùng chrome modal chung,
ảnh chi tiết có count/thứ tự/nhãn xem. Tình trạng/biện pháp/approval giữ màu
semantic; không đổi workflow hoặc quyền.

Đã gom các rule KPH/form cũ khỏi `store-app.css` sang `store-kph-fresh.css`,
không thêm lớp override KPH liên tiếp. Stylesheet tải cùng frame nên skeleton
và nội dung lazy dùng cùng geometry; không cần đổi markup skeleton. Nút checkbox
desktop có label hit area 44px. Chỉ mount một layout danh sách và giữ lazy
entry/workspace/form/Excel, privacy, date rules và data authority.

## Workspace và scope

- Branch/worktree: `store-app/figma-mobile-implementation`,
  `/Users/vup/Documents/coopfood-kph`; writer `/root`.
- Base đã xem trước runtime: `c8365e664b7b0fe7ca01930b4a556f56ba172d38`;
  gồm các sửa backdrop/giữ form chưa gửi từ lượt review trước.
- Trong lúc làm, HEAD tiến tới `b6247044740157e86f10ddf9a4cfe9c3cf166c38`
  với sửa selector E2E authenticated workspace và báo cáo tích hợp ở task khác.
  Giữ nguyên các sửa đó; không đưa chúng vào scope Fresh hoặc ghi là do lượt này.
- Candidate Fresh là working tree, chưa có commit SHA riêng. Manifest nguồn đã
  kiểm ở `.local/kph-fresh/source-manifest.json`; preview build độc lập.

Runtime thay: `apps/store-pwa/src/store-kph-fresh.css`, `store-app.css`,
`store-app-frame.tsx`, `store-kph-list.tsx`, `store-kph-workspace.tsx`.
Gate mới: `e2e/scripts/check-kph-fresh.cjs`. Docs: Visual/UI DNA, rollout/KPH
plan/handoff, plan r12 và snapshot r10/r11, CURRENT_STATE/NEXT.
Không sửa backend/API/schema, shared primitive/global token, dependencies,
Admin/Pilot presentation, Excel format hay Figma frames. Không merge/push/deploy.

## Kiểm chứng

Runtime: Node 26.0.0, npm 11.12.1 và các dependency hiện có trong repo; Chromium headless qua
Playwright. Dữ liệu đều là fixture tổng hợp. Preview mock Fresh
**http://127.0.0.1:4201/#kph**, build `.local/kph-fresh-build`; mode memory-only.

`npm run check` PASS. Store PWA test với `--maxWorkers=2`: **180 PASS**.
`npm run verify` final exit 0: docs/contracts/generated API, TypeScript,
**228 test PASS** (Store 180, Admin 14, API 2, rules 19, UI 13), build;
log `.local/kph-fresh/verify-final.log`. `git diff --check` PASS.
Lần verify đầu chạy đồng thời browser/build bị hai lỗi async timeout ở
`store-app.test.tsx` và `store-kph-workspace.test.tsx`; chạy lại khi browser
đã xong. Không bỏ test hoặc nâng timeout.

Hai build riêng PASS:

```sh
VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build -- --outDir ../../.local/kph-fresh-build --emptyOutDir
VITE_STORE_APP_MOCK=false VITE_KPH_ONLINE=true npm --workspace @coopfood-kph/store-pwa run build -- --outDir ../../.local/kph-fresh-online-build
```

Các script dưới trong `e2e/scripts/` exit 0:

| Gate | Kết quả và phạm vi |
| --- | --- |
| `check-kph-fresh.cjs` | 390×844, 1440×1024, 320×844; search string, selection reset/empty/disabled, vùng bấm ≥44px, một layout, form/focus/outside recovery, screenshot |
| `check-store-qa-repairs.cjs` | Hai viewport chuẩn; create/ảnh/review/duyệt/Excel đúng phiếu/SKU, DATE session, quick utility route, metadata |
| `check-progressive-layout.cjs` | Hai viewport chuẩn; Home/KPH/form skeleton geometry ≤1px, không có layout shift, giữ scroll form |
| `check-kph-lazy.cjs` | Hai viewport chuẩn; deferred chunks, loading/cancel/focus, page selection/resize và chunk recovery |
| `check-kph-calendar-icons.cjs` | Hai viewport chuẩn, hai loại phiếu; đúng icon/calendar 20px, read-only ngày phát hiện, picker/select/Escape/focus |
| `check-kph-offline.cjs` | Hai viewport chuẩn; SW thật, offline reload, form/Excel lần đầu lấy chunk qua worker, đúng SKU xuất và ảnh Home, không cache API |
| `check-store-header.cjs` | 6 viewport; avatar/back/navigation giữ anchor giữa Home/Tra hạn/Tra cứu/KPH/DATE, shelf scroll/focus regression |
| `check-modal-ui.cjs` | 5 viewport; chrome/motion/scrim, scroll lock, focus/picker/Escape/X/backdrop và form không mất khi bấm nền |
| `check-mobile-toolbar.cjs` | 5 viewport; active route, touch bounds, clearance cuối nội dung, quick state/focus/layering, login exclusion |

5 viewport: 390×844, 1440×1024, 320×740, 768×1024, 844×390;
header thêm 1024×768. Dùng `STORE_PREVIEW_URL=http://127.0.0.1:4201`, các gate
QA/calendar/header/modal dùng `STORE_APP_URL=http://127.0.0.1:4201`.
Offline thêm `STORE_BUILD_DIR=.local/kph-fresh-build`.
Fresh screenshot/results nằm `.local/kph-fresh/`; các gate cũ lưu output ở
đường dẫn `.local/` vốn có. Đã xem screenshot list/form/detail mobile/desktop.

Modal gate ban đầu phát hiện header form khác điểm dừng gradient tài khoản;
đã sửa về `--cf-modal-header` và rerun PASS. Screenshot tìm kiếm có icon nhạt
và count xuống dòng; đã tăng contrast icon và giữ count một dòng, chụp lại/kiểm
Fresh cùng progressive layout PASS. Không sửa expectation cũ để làm gate xanh.

## Nghiệm thu và giới hạn

Owner mở preview trên mobile và desktop, xem danh sách/tìm/lọc, thử cả loại
TPCN/TPTS → quét hoặc nhập tay → ảnh → xem lại/gửi → duyệt → chọn/xuất đúng
phiếu. Thử quay lại form, đóng modal/picker, đổi filter/page và offline đã cache.
Expected: state và eligibility đúng, không che CTA, chữ đọc rõ và thống nhất Fresh.

Mock giữ phiếu trong phiên; reload reset. Build online PASS không chứng minh
API wiring hoặc nghiệm thu backend thật cho reskin này; online gateway hiện có
giữ presentation riêng. Chưa đo field INP, camera/keyboard trên điện thoại thật
hoặc production; lab layout/focus không thay bằng chứng thiết bị. Chunk ExcelJS
trên 500 KB vẫn là cảnh báo baseline và được lazy/precache theo capability cũ.

Source manifest/JSON, snapshot lịch sử và link local đã kiểm hợp lệ trước bàn giao.
Bước nhỏ tiếp: owner nghiệm thu KPH Fresh tại 4201. Nếu có blocker, sửa một
danh sách có mục tiêu trong giới hạn hai review rounds; các màn còn lại vẫn hoãn.
