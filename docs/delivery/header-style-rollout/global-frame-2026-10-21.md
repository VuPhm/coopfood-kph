# Đồng nhất bộ khung global — 21/10/2026

Owner chưa đạt bản này; [follow-up sửa lệch desktop/dải xanh](desktop-frame-2026-10-21.md) là candidate mới nhất.

Owner yêu cầu AppHeader/sidebar dùng bộ khung global thay cho hardcode riêng
mỗi màn. Tiếp nối [Home/navigation](navigation-2026-10-21.md) trong cùng task;
không tạo task/nhánh mới hoặc mở shell online Round 2.

- Branch `store-app/header-01-style-rollout`; base `0041ac0`.
- Worktree `/Users/vup/Documents/coopfood-kph/.local/worktrees/header-style-rollout`.
- Một writer `/root`; thay đổi chưa commit/merge/deploy.
- Preview production mock: <http://127.0.0.1:4232/#home>.
- Technical PASS; owner visual acceptance pending.

## Quyết định và file

1. `apps/store-pwa/src/store-app-routes.ts` mới là registry: title/subtitle,
   mode header, metadata/nhãn/icon Home/sidebar/mobile và thứ tự feature.
   `Screen`/hash parsing chuyển khỏi frame; alias lookup vẫn dẫn DATE.
2. `store-app-header.tsx` mới chứa duy nhất markup AppHeader. Frame lấy mode
   từ registry và cấp title/profile/account; feature chỉ truyền title/subtitle/
   Back/heading ref qua StorePageHero. Không nhận title class hoặc tự chọn density.
   Mẫu báo cáo bỏ class header riêng, giữ title focus/Back/semantics.
3. `store-app-frame.css` mới quản lý root/main và nền theo mode. `store-header.css`
   quản lý toàn bộ anchors/breakpoint/typography/brand/welcome/spacious/compact.
   Gỡ rule header cũ trong `store-app.css` (desktop/mobile/Home) và logo aspect
   ratio trong `feature-loading.css`; không tiếp tục stacking override theo màn.
4. `store-navigation.tsx`/`store-home.tsx` đọc cùng registry, bỏ feature list/
   nhãn/icon riêng và các conditional đổi nhãn theo tên màn. Sidebar vẫn bốn
   feature, mobile ba ô/nền đặc/no glass. CSS navigation tiếp tục một owner.
5. `store-account-trigger.tsx` mới là nút account chung cho live/loading, lấy
   initials từ profile. `store-account-sheet.tsx` dùng trigger/ref chung; bỏ
   avatar “MA” hardcode ở `store-loading-frame.tsx`. Dialog focus vẫn giữ.
6. Feature cover KPH/DATE giữ trailing clearance trong stylesheet nghiệp vụ;
   header CSS không biết list selector. Route CSS Tra hạn bỏ nền root riêng.
   Home/Tra hạn giữ header rộng; KPH/DATE/reports/notifications compact. Login
   giữ standalone theo yêu cầu trước, không ép sidebar tác nghiệp vào login.
7. `store-app-frame.test.tsx` thêm hai test hành vi: title/back/ref custom không
   đổi sidebar active hoặc remount chrome; chuyển route phục hồi title/Back
   mặc định; welcome/spacious không nhân đôi header. Report browser scripts
   dùng h1 của header global thay class riêng.

Docs: [quy ước frame](../../product/STORE_APP_FRAME.md), registry ownership trong
component catalog/Visual DNA/navigation/CURRENT_STATE/NEXT. Không đổi API,
backend, quyền, workflow hoặc dữ liệu. Scope chỉ Store App hiện tại; không
refactor `StoreAppShell` online/Pilot hay Admin trong lượt này.

## Kiểm chứng

Chạy từ worktree trên:

- `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build`:
  PASS TypeScript/Vite/PWA; chunk ExcelJS >500KB warning là baseline.
- `npm --workspace @coopfood-kph/store-pwa run test -- --maxWorkers=2`:
  PASS **233 tests / 34 files**, đã chạy lại sau account trigger chung.
- `STORE_APP_URL=http://127.0.0.1:4232 node e2e/scripts/check-store-header.cjs`:
  PASS 390×844, 1440×1024, 320×740, 768×1024, 844×390, 1024×768; header/hero
  duy nhất, anchors/avatar/Back, native cover, chữ lớn và focus/route reset.
- `STORE_PREVIEW_URL=http://127.0.0.1:4232 node e2e/scripts/check-store-navigation.cjs`:
  PASS năm viewport (390/1440/320/768/844), Home đủ feature, sidebar/mobile
  active/recent/reload, nền opaque/no filter, utility/focus/action dock/toast.
- `STORE_PREVIEW_URL=http://127.0.0.1:4232 node e2e/scripts/check-report-header.cjs`:
  PASS 390/1440/320; h1 tên mẫu/Back, picker apply/cancel, giữ kỳ, 60 mẫu,
  lịch và chữ 150%, không tabs/gesture ẩn composer.
- `STORE_PREVIEW_URL=http://127.0.0.1:4232 node e2e/scripts/check-progressive-layout.cjs`:
  PASS Home/KPH × 390/1440, loading/live chrome/form zero layout shifts/JS error.
- `npm run check:docs` và `git diff --check`: PASS.

Ảnh/check output cục bộ tại `.local/store-header/`, `.local/navigation/`,
`.local/progressive-loading/check/`; dữ liệu tổng hợp. Không snapshot pixel rộng.
Header/navigation/report đã kiểm sau tách frame; header và progressive được
chạy lại sau gom account trigger/aspect ratio.

## Giới hạn và bước nhỏ tiếp

Browser emulation không thay iPhone/Safari/standalone/OS keyboard thật.
Nghiệm thu hình ảnh chưa suy từ technical PASS. Bước nhỏ tiếp: owner xem Home,
DATE/KPH và mở mẫu Báo cáo tại preview 4232; thay đổi header/sidebar về sau
chỉnh registry/component/CSS chung, không tạo override ở từng màn.
