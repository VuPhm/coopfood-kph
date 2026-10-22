# UI01 — Fresh glass từ baseline đúng cbf750a, 22/10/2026

Candidate theo yêu cầu thử trong suốt/blur nhẹ; chưa owner visual acceptance.
Giữ round compact kích thước phần phụ mobile cho lượt sau.

## Baseline và worktree

- Branch `store-app/ui01-light-glass`.
- Worktree `/Users/vup/.codex/worktrees/ui-light-glass/coopfood-kph`.
- Base **`cbf750a6518aaa84738806d806041e0ac82cbe10`**, owner chỉ định sau merge
  page kit/navigation vào main local. Writer: chat UI01 này, một writer.
- Bản thử đầu đã dùng nhầm `0041ac0`; đã bảo lưu ngoài source và thay thế.
  Evidence cũ trong `.local/light-glass` / `.local/modal-inp/light-glass-build`
  không dùng để nghiệm thu candidate này. Main không bị sửa.
- Preview build <http://127.0.0.1:4247/#home> và các route KPH/DATE/Báo cáo.
- Checkpoint soft-depth local `90af8cb`; chưa merge/push/deploy, không thay Pages.
  Round viền/mobile/performance tiếp tục trong [hồ sơ UI01](ui01-mobile-perf/technical.md).

## Thay đổi

Giữ page kit chung, Home không artwork, sidebar 248px và capsule mobile 3 ô
64px/Trang chủ/Thông báo/recent đã accepted. Không đổi font/geometry/touch,
IA, dữ liệu, workflow/quyền/API; không sửa Admin/online/Pilot/packages/ui.

`store-glass.css` được import sau navigation CSS trong `store-app-frame.tsx`.
Feedback khách: round trước chưa đạt vì thô/phẳng. Revision hiện tại tăng chiều
sâu bằng các lớp sáng và shadow tĩnh, không đổi layout hoặc density:

- Canvas trắng pha mint `#f3f9f6 → #fff`, gradient155deg rất nhẹ trên cover.
- Thẻ Home/attention có sheen sáng, mép trắng và shadow4px/12px6%; icon có bóng
  nhỏ riêng để tách khỏi nền pastel. Caption Home #4f6274 giữ contrast ở320px.
- CTA KPH và hero controls có shadow mềm; list KPH/DATE chỉ bóng sát mép
  2px/7px4%. DATE active giữ border/inset indicator của feature.
- Capsule trắng68%, dock nổi trắng78%, **blur10px ở tối đa hai vùng**. Utility
  peach78% chỉ tint, không blur. Sheen có ba stop trắng46% → trắng8% → xanh3%.
- Ô tìm/CTA KPH trên hero trắng80%, quét/Đổi mẫu/Info mint76%; không thêm blur.
  Chữ phụ/focus giữ đậm; CTA semantic, active và trạng thái vẫn màu đặc.

Dock inline, form, ảnh và backdrop modal không blur; nội dung vẫn opaque dù
có gradient sáng. Không gradient/shadow động, không scale/translate khi hover.
Fallback và reduced preferences vẫn đặc/no filter. Các shadow static không
đổi bounding rect hoặc vùng chạm. Không thêm artwork vào Home.

Không thêm dependency, JS cuộn, filter animation hoặc will-change. Tắt filter
khi mở modal; fallback đặc khi browser thiếu backdrop-filter, reduced
transparency/motion, increased contrast/forced colors. Media preference là
progressive enhancement; không giả định browser nào cũng expose cài đặt OS.

Yêu cầu hiện tại của owner mở candidate vật liệu trên controls nhỏ, thay cho
ràng buộc “menu nền đặc, không glass” của baseline navigation ở phạm vi này.
Không thay acceptance page kit hoặc cho phép blur backdrop toàn màn hình.
Tham khảo [Apple Materials](https://developer.apple.com/design/human-interface-guidelines/materials),
không mô phỏng refraction động hoặc tuyên bố tương đương iOS27.

## File đổi

- `apps/store-pwa/src/store-glass.css`: vật liệu/fallback scoped.
- `apps/store-pwa/src/store-app-frame.tsx`: import cho frame/loading.
- `docs/CURRENT_STATE.md`, `docs/NEXT.md`: candidate trên đúng baseline.
- File bàn giao này.

## Kiểm chứng trên cbf750a

- `VITE_STORE_APP_MOCK=true npm run build --workspace @coopfood-kph/store-pwa`:
  PASS TypeScript/Vite/PWA. Warning chunk Excel lớn là baseline.
- `node .local/light-glass-cbf750a/check-fresh-glass.cjs`: PASS Playwright
  390×844/1440×1024/320×844, Home/KPH/DATE/reports/composer; rect trước/sau
  stylesheet giống nhau, không overflow, tối đa hai filter, popup/Escape/focus,
  background filter none khi modal, reduced preferences và no-support fallback.
  Screenshot đã xem Home/composer mobile mới. Desktop cao1024 dock inline đúng
  hành vi baseline, không ép nổi như bản thử sai nền.
- Cuộn CPU4×, off/on/on/off 100 frame/lượt: p95 off16,7–16,8/on16,8ms;
  max16,8ms cả hai, không gap>34ms trong mẫu. Đây là lab Chromium, chưa field INP/GPU/pin.
- `STORE_PREVIEW_URL=http://127.0.0.1:4247 node e2e/scripts/check-store-page-kit.cjs`:
  PASS bảy route × bảy viewport (390/1440/1920/2560/320/768/844), header anchors,
  native scroll/focus, report custom title/Back, login và skip link.
- `STORE_PREVIEW_URL=http://127.0.0.1:4247 node e2e/scripts/check-store-navigation.cjs`:
  PASS năm viewport390/1440/320/768/844, capsule ba ô/recent/reload, sidebar,
  Thông báo rỗng, utility/dock/toast/focus, contrast, chữ150% và overflow.
  Assertion nền đặc vẫn đạt trong reduced-motion; không sửa/tắt test cũ.
- Revision soft depth: `node .local/light-glass-cbf750a/audit-soft-glass.cjs`
  PASS Home/KPH/DATE/composer ×390/1440/320, text/input/focus trong normal
  transparency. Screenshot `depth-*.png` đã xem mobile và desktop; JSON ở
  `.local/kph-fresh-colors/glass-depth-*.json`. Caption Home đã đậm thêm để
  sửa ca320px <4,5:1 do cuối gradient xanh dương; không hạ ngưỡng test.
- Các gate page-kit/navigation đầy đủ ở trên là evidence revision trước;
  revision này chạy lại build, targeted geometry/fallback/popup/contrast/scroll.
- `npm run check:docs`, `git diff --check`: PASS. Main local vẫn sạch tại6a229f5 (docs-only sau cbf750a).

Evidence hiện tại riêng ở `.local/light-glass-cbf750a/`, `.local/navigation/`,
`.local/store-page-kit/`. Không dùng lại số đo popup từ baseline0041ac0.

Bước nhỏ tiếp: owner xem <http://127.0.0.1:4247/#home>, cuộn DATE/KPH và mở
composer báo cáo trên điện thoại thật. Chốt vật liệu trước rồi mới compact các
phần phụ mobile; chưa mở round đó.
