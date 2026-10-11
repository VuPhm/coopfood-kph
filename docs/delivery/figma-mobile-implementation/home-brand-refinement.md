# Home theo ảnh tham khảo của owner

Ngày: 11/10/2026. Technical PASS; **owner visual acceptance đã nhận ngày 11/10/2026**.
Giữ branch/worktree hiện tại `store-app/figma-mobile-implementation` tại
`/Users/vup/Documents/coopfood-kph`. Không commit/merge/deploy.

Owner không chấp nhận bản thẻ trắng + storefront trước đó và cung cấp ảnh hai
màn hình điện thoại. Bản này lấy bố cục Home bên phải làm tham khảo: header xanh,
lời chào, thẻ pastel, icon tròn, giỏ thực phẩm, slogan và đường cong mint. Trên
mobile hẹp, hai thẻ trên dùng icon phía trên chữ để tránh ép chữ; tiện ích nằm
ở hàng dưới. Giữ các route và nghiệp vụ hiện có, desktop vẫn có summary thực
từ fixture. Logo 72px chỉ ở Home. Không thêm chức năng từ ảnh mẫu.

Nguồn nhận diện đã nghiên cứu:
[Saigon Co.op — Co.op Food New Concept](https://saigonco-op.com.vn/tin-tuc/tin-he-thong/co-op-food/co-op-food-buoc-vao-cuoc-dua-trai-nghiem-trong-thi-truong-ban-le-tien-loi).
Ba giá trị An toàn – Tiện lợi – Tươi ngon là cảm hứng. Ảnh mới là AI, không phải
ảnh sản phẩm/cửa hàng thật hay brand guideline được phê duyệt. Không sửa Figma.

## File và tài sản

- `apps/store-pwa/src/store-app.tsx`: lời chào trong header, icon Lucide cho các
  nút Home, mô tả ngắn, accessible labels giữ nguyên, decorative basket/motto.
- `apps/store-pwa/src/store-app.css`: header xanh, thẻ mint/hồng/cam, mobile
  hai thẻ trên + tiện ích dưới, desktop responsive; decoration không bắt sự kiện,
  reduced motion và focus từ hệ thống hiện có.
- `apps/store-pwa/public/brand/coopfood-home-basket.webp`: 1536×1024 có alpha,
  280024 bytes; built-in image_gen tạo PNG, `cwebp -q 85 -m 6` re-encode giữ alpha.
  PNG gốc ở `/Users/vup/.codex/generated_images/01a1211c-8e6b-7801-b236-aab278fb34de/exec-ca41eb84-3020-4b68-b7d0-bacf362248a4.png`.
  Storefront cũ chuyển khỏi public sang `.local/home-refinement/` để không
  đóng gói asset đã bị owner từ chối.
- `apps/store-pwa/vite.config.ts`: giữ cấu hình WebP precache từ lượt trước.

## Kiểm chứng

- `npm --workspace @coopfood-kph/store-pwa run check`: PASS.
- `npm --workspace @coopfood-kph/store-pwa test -- src/store-app.test.tsx`: 4 PASS.
- `npm --workspace @coopfood-kph/store-pwa run build`: PASS, precache 84 entries;
  cảnh báo chunk lớn/dynamic import đã có từ trước.
- `node .local/home-refinement/check-reference.cjs`: Playwright headless PASS
  390×844, 1440×1024, 320×740, 768×1024 và 1024×768. Kiểm tra ba nút, chữ không
  tràn, mobile hai hàng, ảnh có alpha, vùng trang trí sau vùng thao tác, tài khoản,
  từng route/quay về, bàn phím Enter, logo/ảnh Home-only, không tràn ngang/runtime error.
- Đã xem screenshot mobile 390 và desktop 1440/1024 tại
  `.local/home-refinement/reference-{width}.png` và chỉnh wave để không che slogan.
- `git diff --check`: PASS.

## Owner acceptance và bước tiếp

Owner trong chat ngày 11/10/2026: “quá đẹp, tích hợp vào dna, chuẩn bị điều chỉnh
các trang còn lại theo”. Decision: chấp nhận hình ảnh Home và dùng làm hướng DNA.
Candidate là working tree gồm `store-app.tsx`, `store-app.css` và basket WebP;
HEAD `b1c772f4753ad13db1a7930a484ac7933b73b383` chưa chứa các thay đổi này.
Không dùng nghiệm thu này để đóng workflow gate revision 5 hay lịch sử shelf.

Đã tích hợp [Visual DNA](../../product/STORE_APP_VISUAL_DNA.md) và
[kế hoạch áp dụng](visual-dna-rollout-plan.md). Giới hạn: Chromium với fixture,
chưa kiểm thiết bị thật; chưa API wiring. Bước nhỏ tiếp theo: nền UI chung và
Tra cứu theo kế hoạch, sau khi có checkpoint và bước triển khai được yêu cầu.

## Prompt — built-in image_gen

```text
Create a premium photorealistic advertising cutout for a Vietnamese fresh food convenience store mobile home screen. A white plastic grocery basket with elegant rectangular ventilation slots, seen from a slightly elevated three-quarter view, gently tilted towards the viewer. Basket is filled with fresh lush curly green lettuce rising on the left, glossy ripe red tomatoes in the front, vibrant green bell peppers, a cucumber, and one clear bottle of golden cooking oil with a black cap nestled behind the tomatoes on the right. Fresh, appetizing, clean, bright natural morning studio lighting, subtle realistic shadows within the basket, crisp detail, soft polished supermarket campaign aesthetic. The entire basket and all vegetables must be fully visible, no cropping. Composition compact and wider than tall, centered with a little transparent breathing room. Transparent background, no floor, no backdrop, no detached cast shadow, no surrounding scene. No text, no lettering, no logos, no watermark, no user interface. Not watercolor, not flat illustration. Output a beautiful realistic transparent PNG asset.
```
