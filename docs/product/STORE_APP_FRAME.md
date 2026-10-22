# Khung trang xuyên suốt Store App — 22/10/2026

Owner chưa đạt các bản trước và yêu cầu có một nền xanh/khung CSS để lắp các
thành phần đồng bộ cho toàn app. Bản hiện tại thay các cấu trúc welcome/
spacious/compact riêng bằng **một page kit** cho Home, Tra hạn, DATE, KPH,
Báo cáo (menu/composer/history/document), Thông báo và đăng nhập.

Owner đã cho phép merge bản cuối ngày 22/10; [nghiệm thu/tích hợp](../delivery/header-style-rollout/merge-2026-10-22.md).

## Một cấu trúc, ba vị trí lắp

```tsx
<StorePageLayout>
  <StorePageHero>
    {/* Lời chào, tìm kiếm hoặc CTA của feature; AppHeader do frame cấp. */}
  </StorePageHero>
  <StorePageSurface>
    {/* Nội dung nghiệp vụ, form hoặc danh sách. */}
  </StorePageSurface>
</StorePageLayout>
```

Các component nằm trong [store-page-hero.tsx](../../apps/store-pwa/src/store-page-hero.tsx).
[store-header.css](../../apps/store-pwa/src/store-header.css) sở hữu toàn bộ
nền, kích thước, sticky/overlap và bo góc. Feature không tự dựng header, nền
ngoài, nắp trắng hoặc chọn một density khác.

| Vai trò | Quy tắc chung |
| --- | --- |
| Thanh trên | Padding top/bottom 14px; hàng grid tối thiểu 44px, mặc định tổng 72px. Ba cột 44px/minmax(0,1fr)/44px, gap8. |
| Back/brand/tài khoản | Control44px; avatar40px. Mọi màn cùng anchor, không absolute theo wrapper riêng. Login không có tài khoản hoặc sidebar giả. |
| Tiêu đề | 20/26px, subtitle 12/16px trên mọi màn. Một dòng/ellipsis để không dịch bar; giữ nguyên text trong DOM/title attribute và tên mẫu đầy đủ trong picker. Text accessibility lớn có thể tăng chiều cao hàng. |
| Gutter | 22px mobile, 16px dưới360px, 36px desktop từ900px. Hero content và nội dung feature dùng cùng token. |
| Vùng xanh | Cùng gradient115deg `#00724e → #008655`; sticky native. Chiều cao do nội dung slot, không là một min-height riêng cho từng màn. |
| Lớp trắng | Section rộng 100%, min-height100dvh, overlap12px, góc24px, white/shadow chung. Phần cuối trang giữ clearance navigation/action riêng của nội dung. |
| Parent | Page layout rộng 100%, max-width none/margin0, isolation. Không giới hạn khung chứa header/cover bởi max-width của feature. |

Home có lời chào trong slot xanh; header vẫn là hàng có title như các màn
khác. Tra hạn không còn header riêng cao166px. Đăng nhập dùng cùng header/
hero/surface; form trắng một cột, rộng tối đa480px và căn giữa bên trong lớp
trắng, kể cả desktop. Bố cục login hai cột trước đây được thay theo hướng đồng
bộ toàn app của owner ngày 22/10. Giữ form/busy/error/password/preview behavior.

## Ownership

- [Registry](../../apps/store-pwa/src/store-app-routes.ts): title/subtitle,
  leading brand/Back, feature metadata cho Home/sidebar/mobile. Không còn
  header mode/density theo màn. Feature list không thay capability API.
- [StoreAppFrame](../../apps/store-pwa/src/store-app-frame.tsx): sidebar/mobile,
  account/context và main/canvas. Không có nhánh dựng hero rộng riêng cho Home/
  Tra hạn. Mỗi page dùng các slot kit; loading dùng cùng kit/trigger.
- [StoreAppHeader](../../apps/store-pwa/src/store-app-header.tsx): cùng một hàng
  brand/Back/title/store/account. Mẫu báo cáo chỉ cung cấp title/Back/ref.
  Login lắp cùng component vào slot appHeader, không có implementation riêng.
- [StoreNavigation](../../apps/store-pwa/src/store-navigation.tsx): giữ sidebar
  đủ bốn feature, mobile ba ô, recent trong phiên. Vật liệu nav đã được UI01
  thay bằng glass nhẹ có fallback đặc; xem
  [khối/viền hiện tại](STORE_APP_SURFACE_STYLE.md). Geometry/semantics do frame giữ.
- White surface có target `store-page-content`/tabIndex-1; skip link vào nội
  dung trắng, bỏ qua hero. Focus control trên xanh đưa trang về đầu.

## Kiểm chứng và giới hạn

[Gate xuyên suốt](../../e2e/scripts/check-store-page-kit.cjs) kiểm 7 màn × 7
viewport, gồm390×844,1440×1024,1920×1080,2560×1440,320×740,768×1024,844×390:
đúng một layout/header/surface, bar 72px, gradient/gutter/overlap/radius, Back/
account cùng tọa độ, scroll/focus, chữ 150%, không overflow/JS error; report
custom title/Back, login và account modal/skip link. Lệnh `check-store-header`
được chuyển sang gate chung này, thay assertion rộng/gọn đã hết hiệu lực.

[Frame tests](../../apps/store-pwa/src/store-app-frame.test.tsx) giữ kiểm title/
Back/ref, không remount account/sidebar và active theo route. Hồi quy báo cáo,
loading geometry và navigation riêng vẫn giữ. Không dùng pixel snapshot rộng.
[Handoff và giới hạn](../delivery/header-style-rollout/page-kit-2026-10-22.md).
