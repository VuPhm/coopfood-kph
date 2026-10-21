# Home, điều hướng và tiện ích Store App — 21/10/2026

UI đã được owner cho phép merge ngày 22/10/2026, tiếp nối header/hợp nhất
nền xanh. Chỉ Store App hiện tại; không áp Admin Web hay entry online/Pilot cũ.
Technical gate đạt không thay nghiệm thu hình ảnh của owner.

## Home và tính năng

Home dùng một launcher responsive, gồm đủ bốn tính năng đang có: Quản lý DATE,
KPH, Báo cáo DATE và Tra hạn lùi. Mobile hai cột; màn rộng từ 1280px bốn cột.
Lời chào nằm trong slot xanh của [page kit 22/10](STORE_APP_FRAME.md),
AppHeader 72px dùng chung với các màn; lớp trắng vẫn cuộn native. Follow-up22/10: bỏ cụm hình giỏ hàng/họa tiết/slogan
trang trí và khoảng đệm dành cho chúng. Hai lối vào công việc
cần chú ý dùng cùng số liệu DATE/KPH hiện hành; không tạo nguồn thống kê mới.
Nút chuông mở trang Thông báo.

`storeFeatures` trong [registry global](../../apps/store-pwa/src/store-app-routes.ts)
là danh sách tính năng chung cho launcher/sidebar/mobile; header title/leading cũng
nằm trong registry. [Ownership AppHeader/frame](STORE_APP_FRAME.md), không phải capability
API. Backend vẫn quyết định authorization/store scope.

## Điều hướng

- Dưới 900px, đúng ba ô: Trang chủ, Thông báo, tính năng đang truy cập gần nhất.
  Tính năng là DATE/KPH/Báo cáo/Tra hạn. Đi Home hoặc Thông báo không ghi đè ô
  gần nhất; reload trong cùng phiên giữ lựa chọn qua `sessionStorage`. Chỉ lưu
  ID hợp lệ, không lưu dữ liệu nghiệp vụ. Storage bị chặn vẫn điều hướng được.
- Phiên mới chưa vào tính năng: ô thứ ba là “Tính năng”, mở khu launcher Home.
  Điều hướng dùng link hash, giữ deep link; active có `aria-current="page"`.
- Từ 900px, sidebar rộng 248px, nhãn chữ/icon đầy đủ: Trang chủ, Thông báo,
  nhóm “Tính năng cửa hàng” đủ bốn nhánh Quản lý DATE, KPH, Báo cáo và Tra hạn
  lùi (cùng danh sách Home). Có logo và cửa hàng hiện tại; cuộn riêng khi viewport thấp. Không hiển thị thanh mobile cùng sidebar.

Thanh mobile là capsule nổi cao 64px, cách đáy 12px cộng safe-area, rộng tối đa
420px; icon 23px/label 11px, vùng chạm ít nhất 44px, active mint/chữ xanh đậm.
Theo phản hồi owner, chỉ tham khảo bố cục capsule nổi/bo tròn của iOS 27;
**không dùng Liquid Glass**. Nền đặc `#f9fdfb`, viền `#dce9e3`, shadow nhẹ;
không trong suốt, backdrop-filter, blur/saturate hay phản quang. Active mint,
pressed đổi màu không dịch bố cục; tắt transition khi reduced motion, có focus
và forced-colors. Không phụ thuộc API iOS hoặc thêm thư viện UI.

Nguồn tham khảo: [Apple iOS 27](https://apps.apple.com/us/iphone/story/id1896606813),
[Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars),
[Sidebars](https://developer.apple.com/design/human-interface-guidelines/sidebars).

## Thông báo và Tra hạn nổi

Owner chọn **trang Thông báo rỗng, chờ nối dữ liệu**. Route `#notifications`
có header compact/nắp trắng, “Chưa có thông báo” và nút về Home. Không có
thông báo giả, badge số, push hoặc API mới. Nguồn sự kiện, unread, quyền,
retention và đồng bộ chưa nằm trong scope này.

Nút “Tra hạn lùi” nổi trên Home/KPH/DATE/Báo cáo/Thông báo. Trang Tra hạn đầy
đủ và đăng nhập không lặp nút. Giữ popup và phép tính hiện hành; mở popup ẩn
thanh mobile/nút nổi, đóng trả focus và giữ dữ liệu tra khi đổi màn. Modal
nghiệp vụ tiếp tục ở lớp trên navigation.

Trong composer, action dock xuất khoảng chừa qua CSS variable tại root để
nút Tra hạn nằm trên Lưu mẫu/Tạo báo cáo; toast PWA chừa thêm chỗ phía trên
nút. Nội dung cuối trang chừa navigation/safe-area. Loading dùng cùng launcher
và navigation để tránh đổi cấu trúc sau tải.

## Nguồn và kiểm chứng

Source: [Home](../../apps/store-pwa/src/store-home.tsx),
[Navigation](../../apps/store-pwa/src/store-navigation.tsx),
[Thông báo](../../apps/store-pwa/src/store-notifications.tsx),
[CSS navigation](../../apps/store-pwa/src/store-navigation.css).

[Test component](../../apps/store-pwa/src/store-app.test.tsx) kiểm launcher,
recent/storage failure và trạng thái rỗng. [Playwright](../../e2e/scripts/check-store-navigation.cjs)
kiểm 390×844, 1440×1024, 320×740, 768×1024, 844×390: geometry, contrast,
recent/reload, empty state, utility/dock/focus, chữ navigation 150% và overflow.
Gate kiểm computed style menu nền alpha 1, opacity 1, filter/backdrop-filter none;
sidebar có đúng bốn link trong cùng nhóm tính năng.
[Bàn giao và lệnh kiểm](../delivery/header-style-rollout/navigation-2026-10-21.md).
