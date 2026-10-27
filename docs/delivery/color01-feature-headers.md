# COLOR01 — màu header theo chức năng,28/10/2026

Owner yêu cầu áp màu chủ đề của chức năng lên header. Dùng chính màu icon
launcher Home: DATE xanh lá, KPH hồng, Báo cáo xanh dương, Tra hạn cam.
Đây là candidate local, owner visual pending; không suy nghiệm thu HERO01.

- Branch `store-app/color01-feature-headers`, root sole writer.
- Base `ffb4e37e259c456ee1b90719bbec7e89b7cf2ac1` gồm HERO01/SEARCH01/LIST01.
- Worktree `/Users/vup/.codex/worktrees/color01-feature-headers/coopfood-kph`.
- Preview <http://127.0.0.1:4382/#kph>, dev4381.
- Chưa merge/push/deploy; main/Pages/Cloudflare không đổi.

## Scope và file

`apps/store-pwa/src/store-feature-colors.css` mới giữ nguồn màu chung cho
Home icon và header/underlay. Gradient90° giữ liền mạch qua bar và vùng dưới
nắp; cùng palette cho sheet thuộc chức năng. Portal có identity explicit:
KPH form từ DATE vẫn hồng; report sheet/picker xanh dương, utility Tra hạn
cam. Account/Home/Thông báo/login giữ brand green. Camera không đổi màu.

`store-home.css` lấy top/bottom từ nguồn chung, giữ nguyên8màu icon + pastel.
`store-app-frame.tsx` import recipe. Không thêm JS/theme toggle/dependency;
không đổi geometry, scroll/focus/spacing, status palette/action/tab/nav/field,
workflow/API/quyền hoặc print/export data. Header là ngoại lệ nhận diện chức
năng theo yêu cầu mới, không lan màu launcher vào nhãn trạng thái nghiệp vụ.

`e2e/scripts/check-store-page-kit.cjs` cập nhật expected gradient theo route;
bar/cover/focus/login/contrast và các gate khác giữ nguyên. CURRENT_STATE/NEXT
và `docs/product/STORE_APP_FRAME.md` ghi candidate cùng phạm vi.

## Kiểm tra

- `VITE_STORE_APP_MOCK=true npm run build --workspace @coopfood-kph/store-pwa`
  — PASS TypeScript/build/PWA118precache. Excel chunk warning kế thừa.
- `STORE_PREVIEW_URL=http://127.0.0.1:4381 node e2e/scripts/check-store-page-kit.cjs`
  — PASS7màn×7viewport:390×844/1440×1024/1920×1080/2560×1440/320×740/
  768×1024/844×390; đúng màu từng route, text/focus contrast, geometry, native
  scroll và minimum reveal, account/back/skip/login/report.
- `STORE_PREVIEW_URL=http://127.0.0.1:4382 node /tmp/color01/check.cjs` — production
  PASS390/1440/320: header trùng palette icon Home, filter/picker/utility dùng
  đúng gradient; DATE→KPH hồng. So trực tiếp baseline4380 ở cùng fixed clock:
  hero bounds bằng nhau, màu/bg/image của semantic labels/percent/CTA bằng nhau.
- Tính white contrast ở cả8stops: DATE min4.586:1; KPH4.612:1; Báo cáo5.444:1;
  Tra hạn4.515:1. Browser header audit4.5:1/focus3:1 PASS.
- `npm run check:docs`, `git diff --check` — PASS.

Evidence local `/tmp/color01/` (screenshots390/1440/320, `results.json`), page
kit `.local/store-page-kit/`. Đã xem KPH/Báo cáo/Tra hạn mobile. Thay đổi paint
reversible nên không thêm unit test mirror CSS; kiểm browser có mục tiêu.

Giới hạn: local mock/browser, chưa kiểm thiết bị thật. Bước nhỏ tiếp: owner
xem màu bốn header và popup tại4382; không tự mở rollout màu cho nội dung/nav.
