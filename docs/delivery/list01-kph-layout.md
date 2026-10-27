# LIST01 — KPH hai hàng, 27/10/2026

Status: technical PASS; owner visual acceptance pending.

Owner yêu cầu tiếp list item, KPH trước: bỏ dòng thứ hai và phân bổ SKU/SL,
tham khảo layout phù hợp, ưu tiên phong cách đã chốt nhưng không cứng nhắc.
Scope nhỏ, một writer root; không mở milestone/team cycle.

- Branch: `store-app/list01-kph-layout`.
- Base: `04f7c4a4d9001901c3973e7e6bbf5a2118932ee7` (main).
- Worktree: `/Users/vup/.codex/worktrees/list01-kph-layout/coopfood-kph`.
- Preview production mock: <http://127.0.0.1:4372/#kph>; dev4371.
- Không merge/push/deploy; Pages/Cloudflare giữ baseline.

## Quyết định

Tham khảo [Material 3 Lists](https://m3.material.io/components/lists/overview):
label chính và trailing metadata nhất quán, ngắn, dễ quét. Đây là diễn giải
cho KPH, không áp Material theme hoặc thêm dependency.

Mobile bỏ hàng SKU/SL/duyệt riêng. Hàng đầu tên + SL/đơn vị + chevron;
hàng dưới SKU + strip tình trạng/biện pháp + duyệt. Đã/Không duyệt giữ icon,
Chờ duyệt giữ chữ; accessible description còn số lượng/định danh/trạng thái.
SKU/UPC/nhập tay không suy diễn. Ngày khi tắt nhóm thuộc cụm định danh.
Thiếu chỗ (container nhỏ) cho tag xuống hàng; tên hai dòng/chữ lớn tự nở.

Giữ nền/gradient/edge và tone/icon/tag containers Fresh Solid. Không thay
table desktop, rule/API/quyền, chọn/thu mở/nối25, handler hoặc output.
Print giữ composition metadata và ba nhãn cũ bằng useStorePrint.
Loading tái dùng cùng StoreKphList nên theo đúng footprint mới.

Opener dành24px cuối cho footer, có44px target; footer facts không bắt
pointer, strip nhận riêng touch/keyboard và không mở phiếu khi vuốt/bấm.
Tên dài tăng chiều cao trước vùng footer, không ép height. Trong normal
390px, item đầu giảm88px →62px; desktop vẫn56px.

## Files và kiểm tra

- `apps/store-pwa/src/store-kph-list.tsx`: composition; bỏ observer đo approval,
  print metadata đơn giản, description đầy đủ.
- `apps/store-pwa/src/store-kph-items.css`: recipe hai hàng/responsive hiện có.
- `e2e/scripts/check-kph-compact-history.cjs`: min-height assertion mobile56
  thay88 theo composition mới; các gate nghiệp vụ giữ nguyên.
- `docs/CURRENT_STATE.md`, `docs/NEXT.md`, record này: handoff candidate.

Đã chạy:

- `npm run check --workspace @coopfood-kph/store-pwa` — PASS.
- `npm run test --workspace @coopfood-kph/store-pwa -- src/store-kph-workspace.test.tsx src/store-app.test.tsx src/store-kph-label.test.tsx` — PASS25tests.
- `npm run build --workspace @coopfood-kph/store-pwa` — PASS online build.
- `VITE_STORE_APP_MOCK=true npm run build --workspace @coopfood-kph/store-pwa` — PASS,117precache.
- Playwright targeted `/tmp/list01/browser.cjs`:390×844/1440×1024/320×844,
  hai hàng, description, tên dài/chữ150–200%, chọn, focus/detail, strip không
  mở phiếu, no overflow và print composition — PASS.
- KPH history gate:390/1440/320, nhóm/chọn/collapse/nối/focus/eligible export,
  quick date filter, OTHER dài/scroll touch+keyboard/chữ150%/contrast — PASS.
  Dev run tạm tại `/tmp/list01/history.cjs` chỉ điều chỉnh kỳ vọng hình học;
  production run dùng script repository và `STORE_KPH_SYNTHETIC_ROUTE=false`.
- `git diff --check` — PASS.

Evidence local: `/tmp/list01/after-390.png`, `after-1440.png`, `after-320.png`,
`long-390-2.png`, `selected-390.png`, `results.json` và thư mục `history`.
Build có cảnh báo chunk Excel lớn đã có; không thêm dependency/assets.
Đây là UI fixture/browser local; chưa xác minh thiết bị thật hoặc API production.

Bước nhỏ tiếp: owner xem nhịp hai hàng và vị trí SKU/SL/duyệt tại4372,
rồi quyết định tinh chỉnh KPH hay chuyển list tiếp theo.
