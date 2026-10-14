# KPH Co.op Fresh — dropdown và hộp lọc, 11/10/2026

Follow-up nhỏ theo owner: “1 round nữa cho drop sắp xếp nhanh, hộp lọc”.
Nhánh `store-app/figma-mobile-implementation`, cùng worktree/writer, base
`c6d9fa5`. Preview mock: <http://127.0.0.1:4201/#kph>.
Owner acceptance lượt này **pending**; nghiệm thu KPH r13 đã lưu riêng.
Ledger r14/DATE và preview 4202 không đổi. Chưa commit/push/merge/deploy lượt này.

## Kết quả

- Sắp xếp nhanh dùng popup bám nút: Mới nhất / Cũ nhất / Tên hàng, có mô tả,
  nền xanh/chữ trắng và dấu ✓ cho lựa chọn. Giữ chung danh mục với hộp lọc.
  Dùng Dialog non-modal có sẵn; arrow/Home/End, Enter, Escape, X, click ngoài
  và focus return; vị trí giới hạn theo viewport, theo scroll/resize.
- Hộp lọc chia ba nhóm ngày / trạng thái duyệt / sắp xếp; lựa chọn nổi rõ,
  nút lọc có badge số tiêu chí đang dùng. Hai ô ngày cạnh nhau trên mobile
  thông thường/desktop, một cột dưới 360 px để ngày không bị cắt; nút lịch 44×44.
- Footer Đặt lại / Xong giữ trong vùng nhìn khi body cuộn. Xong chỉ đóng hộp;
  bộ lọc vẫn áp dụng ngay. Giữ guard khoảng ngày, định dạng `dd/mm/yyyy`, sort,
  pagination và quy tắc đặt lại các phiếu đang chọn.
- Tái sử dụng Co.op Fresh/shared Dialog, không thêm dependency hoặc sửa
  API/backend/authorization. Màu đỏ dành cho lỗi khoảng ngày trong scope.

## Files và bằng chứng

- `apps/store-pwa/src/store-kph-sort.tsx`: popup, vị trí và nút dùng chung.
- `apps/store-pwa/src/store-kph-workspace.tsx`: sort trigger và hộp lọc.
- `apps/store-pwa/src/store-kph-loading.tsx`: cùng geometry nút sắp xếp.
- `apps/store-pwa/src/store-kph-fresh.css`: style scoped, responsive và footer.
- `e2e/scripts/check-kph-filter-sort.cjs`: ordering, sync/reset, date guard,
  selection reset, keyboard, outside/reopen, picker, touch, bounds/resize,
  placeholder không cắt, footer không cắt và tương phản runtime ba viewport.
- `e2e/scripts/check-kph-colors.cjs`: export audit để tái sử dụng; resolve màu
  CSS hiện đại bằng renderer trình duyệt, giữ ngưỡng; thêm selected sort surface.
- CURRENT_STATE/NEXT và tài liệu này: follow-up riêng, giữ acceptance DATE.

Ảnh/JSON tại `.local/kph-filter-sort/`; đã xem mobile 390/320 và desktop 1440.
Build log `.local/kph-filter-build.log`; unit log `.local/kph-filter-tests.log`.
Source manifest `.local/kph-filter-sort/source-manifest.json` ghi hash file
runtime/test của bản kiểm tra. Artifact dùng fixture synthetic.

## Kiểm tra kỹ thuật

| Lệnh | Kết quả |
| --- | --- |
| `npm --workspace @coopfood-kph/store-pwa run check` | PASS TypeScript |
| `npm --workspace @coopfood-kph/store-pwa run test -- --maxWorkers=2` | PASS 182 tests / 23 files |
| `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build -- --outDir ../../.local/kph-fresh-build --emptyOutDir` | PASS build/PWA |
| `STORE_PREVIEW_URL=http://127.0.0.1:4201 node e2e/scripts/check-kph-filter-sort.cjs` | PASS 390×844, 1440×1024, 320×844; popup còn vừa sau resize về cao 390; 9 contrast states |
| `STORE_PREVIEW_URL=http://127.0.0.1:4201 node e2e/scripts/check-kph-colors.cjs` | PASS 66 KPH contrast states ở 390/1440 |
| `STORE_PREVIEW_URL=http://127.0.0.1:4201 node e2e/scripts/check-kph-fresh.cjs` | PASS ba viewport, list/search/selection/forms/modal focus |
| `STORE_PREVIEW_URL=http://127.0.0.1:4201 node e2e/scripts/check-progressive-layout.cjs` | PASS Home/KPH hai viewport, skeleton ≤1px, zero layout shift |
| `STORE_APP_URL=http://127.0.0.1:4201 node e2e/scripts/check-modal-ui.cjs` | PASS năm viewport, focus/scroll lock/picker và shared modal regression |
| `npm run check:docs` và `git diff --check` | PASS |

Trong audit scoped: chữ nhỏ thấp nhất **4,6243:1**, biên ô nhập **3,7438:1**;
focus/selection ≥3:1. Đây là bằng chứng có mục tiêu trên Chromium/mock;
không phải nghiệm thu owner hoặc chứng nhận toàn app. Build giữ cảnh báo
chunk lớn có sẵn, không thêm dependency để xử lý trong lượt UI này.

Bước nhỏ tiếp theo: owner xem popup Mới nhất và hộp Lọc & sắp xếp ở preview
4201, thử đổi thứ tự → lọc → Đặt lại → Xong. Gate backend/thiết bị thật giữ riêng.

## Tái sử dụng trong DATE cùng ngày

Owner xác nhận dùng mẫu KPH để sửa DATE. Popup được tách sang
`store-quick-sort.tsx`, giữ wrapper/options KPH, prefix CSS/test đổi thành
`store-quick-sort-*`. KPH targeted gate PASS lại ba viewport; progressive
Home/KPH PASS không shift. Hành vi KPH không đổi bởi việc dùng chung này.
Manifest cũ giữ tại `source-manifest-before-date.json`; manifest hiện tại có
thêm module dùng chung. [Bàn giao DATE](date-kph-reference.md) ghi scope mới.


## Follow-up kiểm lại icon

Owner yêu cầu “xem lại các icon, đặc biệt là lệch 2 icon lọc với nhau”. KPH
trước dùng Feather Sliders dọc từ asset 18 px; DATE dùng Lucide
SlidersHorizontal 20 px. Đồng bộ cùng glyph 20 px/nét 1,8 và tâm nút 44×44,
trạng thái lọc active dùng currentColor trắng, badge không đẩy icon.
KPH tìm/quét dùng Lucide Search 18/Maximize 20 với cùng nét 1,8; tìm kiếm căn
bằng 50%/translate thay top cố định. Hai icon lịch trong hộp lọc cùng nét 1,8,
màu action Fresh và căn tâm. Skeleton dùng đúng icon/style live để giữ geometry.
Rà soát sort/chevron/pagination/CTA giữ vai trò và vị trí; không đổi layout,
handler, filter/search/scan state, API hoặc dependency.

Files của lượt icon: `store-kph-workspace.tsx`, `store-kph-loading.tsx`,
`store-kph-fresh.css`; shared selector icon lọc cũng áp vào DATE. Tài liệu
CURRENT_STATE/NEXT và handoff này ghi trạng thái hiện hành. Các gate 182 tests
phía trên là evidence trước lượt này; lần này TypeScript/build và browser có
mục tiêu, không chạy lại unit workflow vì không thay logic.

- Build mock theo lệnh ở bảng trên: PASS TypeScript/build/PWA.
- `node .local/kph-icons/check.cjs`: PASS 390/1440/320; hai filter cùng glyph,
  cỡ/nét, tâm icon theo nút, cột lọc/quét cùng x trên mobile; search/sort/lịch,
  badge active và non-text contrast ≥3:1.
- `STORE_PREVIEW_URL=http://127.0.0.1:4201 STORE_KPH_COLORS_OUTPUT=.local/kph-icons/controls node e2e/scripts/check-kph-filter-sort.cjs`:
  PASS 3 viewport, order/filter/reset/date guard/selection/picker/focus/contrast.
- `STORE_PREVIEW_URL=http://127.0.0.1:4201 node e2e/scripts/check-progressive-layout.cjs`:
  PASS KPH/Home 390/1440; geometry ≤1 px, không layout shift và không pageerror.
- `npm run check:docs` / `git diff --check`: PASS.

Evidence `.local/kph-icons/`: ảnh trước/sau 3 viewport, geometry/contrast JSON,
script đo có mục tiêu, build/browser logs, source manifest. Đã xem ảnh mobile
và desktop. Chromium headless ngoài sandbox được review tự động cho phép;
không dùng Computer Use. Technical PASS, owner acceptance pending. Preview
4201/#kph; bước nhỏ tiếp: owner tải lại và đối chiếu icon lọc KPH với DATE.
