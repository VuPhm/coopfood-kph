# Shared desktop chrome — revision7,14/11/2026

Owner yêu cầu Store/Admin desktop dùng chung một dạng sidebar/header, ưu tiên
hướng Admin. Nguồn trước `638f982`; thay đổi này bổ sung revision6, không coi
owner đã nghiệm thu create/UI hoặc hai vòng toàn app cuối.

Candidate đã kiểm: `3fc1a6169854b370c1c19f2b72e2e23b5c00729e` trên
`store-app/kphon03-create-media`, worktree `.local/worktrees/kphon03-create-media`.

## Kết quả và scope

`packages/ui/src/desktop-chrome.tsx/.css` là một implementation cho:
DesktopSidebar, DesktopNavItem, DesktopHeader và DesktopAccountButton. Hai app
truyền navigation/context theo quyền riêng, không suy thêm capability.

Theo bố cục Admin: sidebar trắng fixed248px, thu gọn80px; logo chính thức,
nav44px với active gradient/chevron, collapse footer cùng vị trí. Header xanh
fixed72px; cùng breadcrumb/title, avatar34px, tên/secondary và chevron tài khoản.
Header, sidebar, logo, nav, footer và account cùng geometry/paint trên hai entry.
Sticky tabs của Store pin dưới header72px; focus/anchor có scroll clearance.

Store đã có collapse; header tách khỏi phần search/CTA cuộn của feature. Store
name chuyển sang header context/account, không còn một footer store card riêng.
Giữ full identity trong account, không suy vai trò từ tên hoặc nhóm hàng.
Admin tiếp tục dropdown, Store tiếp tục account sheet và actions đã có.
Sidebar/header/source/sidebar width CSS cũ được gỡ khỏi nơi sở hữu hình học;
không chỉ copy thêm một bộ CSS mới lên các selector Store cũ.

Từ900px dùng shared frame. Dưới900px Store giữ hero sticky/mobile dock/back và
avatar44px; Admin giữ menu mobile. Parent/subtitle của Store được giữ trong DOM
mobile, desktop chỉ giữ breadcrumb/title theo Admin. Shared desktop geometry
được scope trong frame, không áp vào header của form/modal riêng. Print bỏ chrome.

Không đổi D01/paging/count/scope revalidation/create/private media, backend/API,
password/logout, prototype DATE hoặc Pages. Root sole writer, không task song song.

## File chính

- Shared component/CSS/export trong `packages/ui/src/desktop-chrome*`, `index.ts`.
- Admin `admin-shell.tsx`, `admin-fresh.css`, `admin-fresh-material.css`.
- Store `store-app-frame.tsx`, `store-app-header.tsx`, `store-navigation.tsx`,
  `store-account-trigger.tsx`, `store-header.css`, `store-navigation.css`,
  `store-desktop-chrome.css`; frame test theo vị trí context header mới.
- `check-fresh-chrome-alignment.cjs` kiểm shared chrome hiện hành;
  `check-kphon03-create-media.cjs` dùng selector shared sidebar/brand.

## Kiểm có mục tiêu

Runtime cùng worktree: Store4173 online, Admin4175, Store4180 mock, backend8082
và DB/media synthetic cũ; không seed/reset. Chrome test dùng session/login thật
của region synthetic, không mock capability.

`node e2e/scripts/check-fresh-chrome-alignment.cjs`: PASS tại390×844,
834×844,900×844 và1440×1024. So sánh bounding boxes + computed paint/font thật
của sidebar/header/brand/logo/nav/collapse/account/avatar. Cả expanded/collapsed
cùng kết quả, header x248/80,y0,h72. Bài test đưa pointer về cùng trạng thái
trước so sánh, không so hovered với unhovered.

Kiểm collapsed navigation KPH, account sheet/dropdown/focus return, cuộn giữ
header/sidebar top0,900→834→900 giữ collapse state và menu mobile đủ tên,
mobile dock/hero sticky không đổi, trang không tràn ngang; forced-colors và
reduced-motion có mục tiêu. Screenshot và log ignored `.local/verification/desktop-r7/`.

Lượt đầu unit Store327/328: assertion context trong sidebar không còn đúng IA;
chuyển assertion sang shared header context, giữ identity/nav/focus assertions.
Frame target3/3 PASS. Final UI20 + Admin27 + Store328 = **375 tests PASS**;
TypeScript các workspace và build hai app PASS (cảnh báo chunk ExcelJS đã có).
Log `unit-final.log` và `build.log` trong thư mục trên.

KPHON03 real-backend browser PASS390/1440: create/review/private originals+stamp/
retry idempotent/scope403 không đổi, không bị fixed header che thao tác. Bài tạo
thêm phiếu synthetic, không reset DB.

Các script có selector sidebar/brand cũ đã được đổi sang selector shared để
không trỏ vào class đã bỏ. Assertion hình học của các script UI lịch sử vẫn
là evidence của source cũ, không coi đã chạy lại toàn bộ; gate
hiện hành dùng script chrome mới và các luồng API hiện có, không pixel snapshot rộng.

## Bàn giao

Xem Store4173 và Admin4175 ở desktop, thu/mở sidebar, đổi màn rồi cuộn; kiểm
mobile390 và ranh giới900. Đây là technical candidate; owner UI acceptance riêng.
Không merge main/push/deploy/Pages. Thiết bị iPhone thật và hai vòng cuối toàn app
vẫn pending. Bước nhỏ tiếp: owner đối chiếu một dạng chrome giữa hai entry.
