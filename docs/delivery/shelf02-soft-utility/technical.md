# SHELF02 — Tra hạn lùi hàng, 22/10/2026

## Baseline và phạm vi

Owner yêu cầu “merge rồi tối ưu tiếp toàn diện cho tra hạn lùi hàng”. KPH03
đã merge main local tại `4cb54ae60a3d1d4b6a4c901979ad39f6404b893e`, đóng vòng
sau verify298 tests và browser hai form390/1440/320; source đúng candidate đã
duyệt. [Hồ sơ KPH03](../kph03-create-forms/merge-2026-10-22.md).

SHELF02 bắt đầu từ main sạch `467d8d6152e1708b2bb735459d701659f03f52bf`,
nhánh `store-app/shelf02-soft-utility`, worktree
`/Users/vup/.codex/worktrees/shelf02-soft-utility/coopfood-kph`, sole writer
current chat. Scope màn Tra hạn, tiện ích nổi và cách trình bày lịch sử; áp
[Co.op Fresh — khối mềm, viền nhẹ](../../product/STORE_APP_SURFACE_STYLE.md).
Không thay quy tắc ngày/rounding, backend/API/auth, KPH/DATE/Home/reports,
packages/ui, root config/lockfile hoặc Pages. Không tự merge/push/deploy candidate.

## Thay đổi

- `store-shelf-life.tsx`: nhóm hai ngày theo chiều rộng form; thêm hướng dẫn
  nhập thời hạn, nhãn ngày kết quả hiển thị rõ. Error liên kết đúng trường bằng
  aria-invalid/describedby; submit thủ công focus trường lỗi, tự tính không
  giành focus. ID riêng cho màn chính và popup.
- `store-shelf-life.css`: holder trắng bo18/viền1px#dfe5e9/bóng thấp; mode pastel
  có sheen dùng token Home. Desktop hai cột; mobile ngày đặt cạnh nhau khi đủ
  rộng, 320px tự xếp một cột. Input16px, nút≥44/48px, CTA tự xuống hàng khi
  phóng chữ. Lịch sử bỏ khung lồng, giữ card/table thích ứng. Focus/selection/
  contour input đủ rõ; ưu tiên tương phản vẫn có viền rõ.
- `store-app.css`: bỏ bảy lớp gradient viền và bốn custom property paint animation
  riêng của Tra hạn; giữ motion xuất hiện hữu hạn và timeline dùng chung.
- `store-glass.css`: quick portal nhận token vật liệu và preference overrides
  hiện có; không sao chép palette vật liệu hoặc thêm backdrop-filter.
- Component tests thêm ba ca field linkage/focus/recovery/ID. Browser gate mới
  `check-shelf-refinement.cjs`; cập nhật visual assertions của auto/DNA/result
  theo page kit/palette đã nhận. Motion gate kiểm vật liệu tĩnh/focus không xê
  dịch/no paint animation thay yêu cầu glow cũ; giữ kiểm finite/reduced motion.

Giữ debounce350ms, picker tính ngay, reset/đổi mode, suy NSX/HSD, 1 tháng theo
calendar, shelfLife bao gồm hai đầu, mốc9/10 ngày và round20%/40%. Giữ lịch sử
20 mục trong phiên, dedup/thứ tự/recall tính lại trạng thái ngày hiện tại; popup
không thêm lịch sử và giữ dữ liệu khi đóng/mở. Không sửa source timeline,
history, KPH/DATE, packages/contracts/backend (đã đối chiếu diff với base).

## Kết quả và kiểm tra

Chromium production mock cùng viewport/font, main base4274 và candidate4276:

| 390×844 | Base | Candidate |
| --- | --- | --- |
| Khối nhập + kết quả | 715px | 645px |
| Vị trí đầu kết quả | y486px | y440px |
| Chiều cao kết quả | 297px | 297px |

Main gọn70px, kết quả lên sớm46px; popup390/1440 cao666px, không cần cuộn dọc
ở các state đã kiểm. 320px có thể cuộn; chữ150% không bị cắt/nút tràn. Không
đánh đổi bằng giảm chữ hoặc touch target. Screenshot cuối ở
`.local/shelf02/refinement/` đã xem main/quick mobile và desktop.

- `VITEST_MAX_WORKERS=2 npm run verify`: PASS docs, Contract Lock/OpenAPI,
  generated API drift, types, **301 tests** (Admin16/Store248/API2/rules19/UI16),
  build/default PWA. `.local/shelf02/verify.log`.
- `VITE_STORE_APP_MOCK=true npm run build --workspace @coopfood-kph/store-pwa`:
  PASS mock PWA114 precache; warning ExcelJS chunk lớn đã có từ baseline.
  `.local/shelf02/mock-build.log`.
- `STORE_APP_URL=http://127.0.0.1:4276 node e2e/scripts/check-shelf-refinement.cjs`:
  PASS main/quick×390/1440/320, vật liệu/contrast, lỗi ngày/thời hạn/focus, calendar
  Escape, mốc9ngày, text150%, no overflow/focus return. Contrast đo trong scope
  script: text≥4,5:1 và contour/focus/selection≥3:1. Log `refinement.log`.
- Cùng STORE_APP_URL, `check-shelf-auto.cjs`: PASS390/1440,350ms/picker/modes/
  reset/reopen, holder chênh≤1px, cả lỗi vẫn không cuộn ở hai viewport này.
- `check-shelf-result.cjs`: PASS390/1440,12scenario trạng thái/ngày/rounding,
  13 vị trí Today và resize/375pxquick, timeline không chồng nhau.
- `check-shelf-history.cjs`: PASS390/1440,20limit/dedup/order/recall/session/
  reload/reset/mode, popup không ghi lịch sử; thêm900/1024/1200 responsive.
- `check-shelf-dna.cjs`: PASS390/1440/320/768/1024, main/quick/keyboard/calendar/
  focus/touch; Home/page kit giữ nguyên.
- `check-shelf-motion.cjs`: PASS390/1440 main/quick, static focus/status bounds,
  không glow/filter/paint transition, finite entrance và reduced motion.
- Cuối round chỉ đổi CTA flex sizing và popup padding giảm4px để sửa clipping
  chữ150%/overflow lỗi; refinement/auto, full verify và mock build đã chạy lại
  trên source cuối. Không thay timeline/history/domain nên giữ evidence các
  gate còn lại. Logs browser tương ứng ở `.local/shelf02/`.
- `npm run check:docs`, kiểm link local và `git diff --check`: PASS sau bàn giao.

Lab mở popup `check-modal-inp.cjs`, CPU6×, hai samples/viewport, chạy tuần tự:

| Viewport | Base4274 | Candidate4276 |
| --- | --- | --- |
| 390×844 | 344 / 168ms | 384 / 192ms |
| 1440×1024 | 344 / 176ms | 336 / 168ms |

Mẫu nhỏ, mobile tăng24–40ms và desktop giảm8ms; chưa đủ kết luận về latency,
không tuyên bố cải thiện field INP. Kết luận chắc chắn là bỏ paint animation
và không thêm blur. Log `perf-base.log`/`perf-final.log`; event JSON ở
`.local/modal-inp/shelf02-base/` và `shelf02-final/`.

Cuộn20lịch sử120rAFframes, CPU4×, cùng font/viewport: base390 p95/max17/18ms,
base1440 18/20ms; candidate390 17/18ms,1440 17/18ms; cả bốn không frame>34ms.
Đây là lab ngắn, không đại diện mọi thiết bị. Script/results ignored tại
`.local/shelf02/scroll.cjs` và `scroll-results.json`. Không đưa measurement/
observer mới vào typing/scroll runtime.

Evidence dùng fixture tổng hợp, không commit ảnh/dữ liệu vận hành. Chỉ kiểm
component/Chromium mock; chưa kiểm Safari/IME/keyboard thiết bị thật, pin/GPU
hoặc backend thật. Không suy rộng contrast checks thành chứng nhận WCAG.

## Owner review

Mở <http://127.0.0.1:4276/#shelf>, thử nhập ngày, đổi chế độ chưa biết NSX,
sửa lỗi nhập và gọi lại lịch sử. Từ Home mở tiện ích Tra hạn nổi để xem cùng
ngôn ngữ vật liệu, đóng/mở giữ form. Owner visual pending; technical PASS
không thay nghiệm thu thực. Main giữ sạch ở467d8d6, chỉ KPH03 đã được merge.
