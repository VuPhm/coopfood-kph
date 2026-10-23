# Co.op Fresh — khối mềm, viền nhẹ

Mã tham chiếu: **`coop-fresh-soft-v1`**, ngày 22/10/2026. Đây là bộ quy tắc
vật liệu/khối của **Co.op Fresh**, bổ sung [Visual DNA](STORE_APP_VISUAL_DNA.md),
không tạo theme hay tuỳ chọn mới trong ứng dụng. Round sau có thể yêu cầu:
**“Áp Co.op Fresh khối mềm, viền nhẹ theo Home cho [phạm vi chỉ định]”.**

Owner đã duyệt UI01 bằng “rất ổn, cho phép merge” (main `982c04c`) và palette
trắng KPH02 bằng “có thể merge” (main `146e2e1`). Tài liệu này hệ thống hoá
implementation trên main **`9089f476a7514ef5176686b08295b0fbcbd2b090`**;
không tự mở rollout ra màn khác. Khi áp dụng dùng main mới nhất, giữ các quyết
định được duyệt sau mốc này và chỉ sửa phần owner chỉ định.

HEADER02 candidate23/10/2026 chỉ tinh chỉnh vùng chrome: gradient xanh
`#006b4b → #007a52`, header/portal đồng màu và control căn giữa; giữ nguyên
recipe khối/viền và màu biểu đồ. Thông số/giới hạn tại
[page kit](STORE_APP_FRAME.md#header02--candidate-23102026). Owner đã cho phép
merge4450982 ngày23/10; [kiểm main](../delivery/header02-green-layer/merge-2026-10-23.md).

## 1. Công thức thị giác

**Nền trắng sạch → khối màu rất nhẹ → mép sáng → bóng mềm có chọn lọc.**
Home là mẫu cho cách tạo khối: không đóng mọi vùng trong một đường viền đậm.
Nền pastel và khoảng cách đã phân nhóm; mép sáng cùng bóng thấp tạo chiều sâu.
Chữ/icon vẫn đặc và rõ. Sự trong suốt tập trung ở lớp nổi nhỏ, không phủ lên
nội dung hay cả trang. Giữ gradient xanh nhận diện của page kit; canvas và
holder nghiệp vụ trắng, không quay lại canvas mint/xám hoặc gradient toàn nền.

Phân biệt ba mẫu để không hiểu “viền nhẹ” thành cùng một border cho mọi nơi:

| Mẫu | Reference đang chạy | Viền nghỉ | Nền / độ sâu | Dùng khi |
| --- | --- | --- | --- | --- |
| Khối pastel | Bốn nút tính năng Home `.store-module` | **`1px solid transparent`** | Pastel đặc + sheen + bóng card thấp | Chọn tính năng hoặc nhóm nội dung quan trọng |
| Holder trắng | Home “Cần chú ý”, KPH/DATE holder | **`1px solid #dfe5e9`** | Trắng, không gradient; bóng thấp ở card/hàng cần tách lớp | Nội dung nghiệp vụ, row/card trên canvas trắng |
| Lớp nổi | Mobile navigation, report action dock khi floating | **`1px solid rgb(0 60 40 / 6%)`** | Trắng trong + sheen + bóng nổi; blur nhỏ có giới hạn | Điều hướng/hành động nổi trên nội dung |

Border trong suốt ở Home vẫn giữ hộp 1px để hover không đổi kích thước.
Không thay bằng border 0 rồi thêm border khi tương tác. Không mặc định dùng
viền 6% cho holder trắng: palette KPH02 đã chọn `#dfe5e9` để tách trắng/trắng.
Nút chuông Home dùng holder trắng/viền này, **không có bóng**.

## 2. Các khối Home làm mẫu

Nguồn: [StoreHomeContent](../../apps/store-pwa/src/store-home.tsx),
[Home CSS](../../apps/store-pwa/src/store-home.css),
[base Home rules](../../apps/store-pwa/src/store-app.css),
[material](../../apps/store-pwa/src/store-glass.css),
[mobile refinements](../../apps/store-pwa/src/store-mobile-refinements.css).

### Thẻ tính năng

| Vai trò | Mobile dưới 900px | Desktop từ 900px |
| --- | --- | --- |
| Khối | Radius18px, min-height164px, padding14px 16px, gap10px | Radius18px, min-height200px, padding18px 16px, gap14px |
| Lưới | Hai cột, gap12px | Hai cột; từ1280px bốn cột/gap16px |
| Icon tròn | 48×48px, glyph28px/stroke1.8 | **54×54px**, glyph28px/stroke1.8 |
| Tiêu đề | 16/22px, weight650 | 16/22px, weight650 |
| Mô tả | 12/18px, `#4f6274`, không giảm opacity | Cùng kiểu chữ |
| Khoảng title → mô tả | 6px | 6px |

Min-height không phải fixed height: text wrap được tăng thẻ. Đo tại390px,
hàng đầu cao174px do tên KPH xuống dòng; hàng sau164px. Không ép đều164px
bằng cắt chữ. Icon/copy thực tế vẫn xếp dọc ở768px: selector của lưới Home
thắng rule xếp ngang500–899px cũ.

Icon desktop thực tế54px và title ở320px vẫn16px vì selector Home thắng
rule64px/15px cũ. Không lấy số64px, title15px hay min-height172px/200px mobile
từ một khai báo cũ rồi coi đó là mẫu mới.

| Tính năng | Nền card | Nền vòng icon |
| --- | --- | --- |
| DATE | `#e6f7f2` | `#009c70` |
| KPH | `#fce9f0` | `#f24468` |
| Báo cáo | `#e3efff` | `#286a9c` |
| Tra hạn | `#fff0e6` | `#ff8c32` |

Màu này nhận diện module; trạng thái lỗi/cảnh báo/duyệt vẫn theo
[nhãn semantic](LIST_LABEL_SYSTEM.md). Không dùng hồng KPH để suy “lỗi” hoặc
xanh DATE để suy “an toàn”. Không đưa vòng icon lớn vào mọi toolbar nghiệp vụ.

### Holder trắng và lớp trang

- Hàng “Cần chú ý”: radius14px, gap12px, border1px `#dfe5e9`, nền trắng,
  bóng card thấp. Mobile min-height48px/padding8px 14px; desktop56px/10px 14px.
- Nút chuông: 44×44px/radius14px, cùng nền/viền holder, không bóng.
- Page surface: trắng đặc, không gradient, chỉ bo hai góc trên24px và overlap12px.
  Bóng ở mép nắp ngăn vùng trắng với hero xanh; không áp bóng đó cho từng row.
- AppHeader72px/gutter22px (dưới360px:16px; từ900px:36px) thuộc
  [page kit](STORE_APP_FRAME.md), không thuộc recipe card. Áp vật liệu không
  tự đổi shell, chiều cao header hoặc geometry desktop.

## 3. Token và recipe đang tồn tại

Các biến sau **đã có** trong `store-glass.css`; tái sử dụng trong scope Store.
Không thêm bản sao token vào feature hay đổi `packages/ui` chỉ để áp vật liệu.

| Token | Giá trị / ý nghĩa |
| --- | --- |
| `--store-page-canvas`, `--store-holder-surface` | `#fff` |
| `--store-holder-edge` | `#dfe5e9`, holder trắng |
| `--store-soft-edge`, `--store-glass-edge` | `rgb(0 60 40 / 6%)`, viền trang trí/control phụ hoặc lớp nổi |
| `--store-glass-sheen` | Ánh sáng chéo nhẹ; dùng ở pastel/lớp nổi, không phủ mọi holder |
| `--store-soft-card-shadow` | Mép sáng1px và bóng thấp; không blur backdrop |
| `--store-glass-shadow` | Mép sáng và hai bóng cho lớp nổi/CTA trên xanh |
| `--store-glass-blur` | `10px`; chỉ các surface được cho phép bên dưới |

Recipe màu/mép/bóng thực tế (không phải component API mới):

```css
/* Thẻ pastel Home: giữ base pastel của module, không dùng opacity cả khối. */
border: 1px solid transparent;
border-radius: 18px;
background-image: var(--store-glass-sheen);
box-shadow: var(--store-soft-card-shadow);

/* Holder trắng: nền sạch, viền tách trắng/trắng. */
border: 1px solid var(--store-holder-edge);
background-color: var(--store-holder-surface);
background-image: none;
/* Chỉ thêm --store-soft-card-shadow nếu cần độ nổi tương tự hàng Home. */
```

```css
--store-glass-sheen:
  linear-gradient(155deg,
    rgb(255 255 255 / 46%),
    rgb(255 255 255 / 8%) 52%,
    rgb(0 72 48 / 3%));
--store-soft-card-shadow:
  inset 0 1px 0 rgb(255 255 255 / 80%),
  0 4px 12px rgb(28 44 64 / 7%);
--store-glass-shadow:
  inset 0 1px 0 rgb(255 255 255 / 90%),
  0 2px 4px rgb(0 60 40 / 5%),
  0 8px 20px rgb(0 60 40 / 11%);
```

Icon tròn Home có sheen riêng145deg (trắng16% → transparent60%), mép sáng
trắng35% và bóng `0 4px 10px rgb(0 60 40 / 12%)`. Đây là điểm nhấn nhỏ;
không nhân bóng icon lên mọi control hoặc lồng nhiều lớp shadow trong một card.

## 4. Viền tương tác giữ rõ

Viền nghỉ nhẹ là trang trí; focus, selected, expanded và lỗi có nhiệm vụ khác.

| Trạng thái | Cách áp |
| --- | --- |
| Home hover | Viền `#00865b`, translateY(-2px); active về0. Giữ1px và bounds hộp. Đây là behavior sẵn có, không bắt buộc copy chuyển động sang row nghiệp vụ. |
| Keyboard focus | Giữ ring3px/offset3px của control hiện có; Home dùng `--cf-color-focus` (`#b7dd4b`), nghiệp vụ dùng `--store-focus` nơi đã khai báo, header dùng trắng. Không thay ring bằng viền trang trí6%. |
| Selected | Giữ nền/viền xanh `--store-brand-action`, checkbox/check/nhãn và aria-state; không chỉ thêm sheen để báo chọn. |
| Input | Giữ nhận diện fill/contour/label; `--store-control-line` (`#718578`) có vai trò khác viền card. Hero hiện dùng holder trắng **đặc**, border trắng20% trên xanh. |
| Expanded / filtered / invalid | Giữ rule và semantic của feature; không áp quiet-border selector lên trạng thái đang mở/lọc/lỗi. |

Giữ vùng chạm tối thiểu44×44px, text thật, native button/input và focus không
bị nav/dock che. Khi đổi phối màu, kiểm contrast ở nền render thật, có composite
alpha và sheen; không đo alpha-border như màu đặc. Dùng các ngưỡng trong
Visual DNA và auditor hiện có, không hạ ngưỡng để đạt một recipe trang trí.

## 5. Trong suốt và hiệu năng

| Surface | Bình thường có hỗ trợ filter | Fallback |
| --- | --- | --- |
| Mobile navigation | Trắng68%, sheen, blur10px | Trắng đặc |
| Report dock khi floating | Trắng78%, sheen, blur10px | Trắng đặc |
| Tra hạn nổi | Peach78%, sheen; **không blur** | `#fff0e6` |
| Hero input/CTA | Trắng đặc + sheen/shadow; nút mint76%; **không blur** | Trắng / mint đặc |
| Home card / holder / content / modal body | Nền đặc, **không blur** | Cùng nền đặc |

Budget tối đa **hai vùng blur nhỏ đồng thời**: nav + floating dock. Không thêm
blur vào card/list/page/header/scrim; không animate filter/box-shadow, không
thêm `will-change` thường trực. CSS gradient và shadow tĩnh đã đủ cho khối Home.
Các lớp phủ dialog giữ scrim không blur; lúc dialog mở tắt filter ở nav/dock.

Giữ opaque defaults + `@supports`; giữ overrides cho reduced transparency,
reduced motion, increased contrast và forced colors. Các preference này tắt
filter/sheen/shadow qua token theo implementation hiện có. Viền more-contrast
chuyển rõ hơn. Không suy ra blur chạy tốt trên mọi GPU/Safari chỉ vì Chromium
headless đạt; kiểm thiết bị mục tiêu khi có scope đó.

## 6. Cách áp cho round sau

1. Từ main mới nhất, đọc tài liệu này, Visual DNA, page kit và contract feature.
   Tạo task branch/worktree, ghi rõ vùng owner chỉ định và phần cần giữ.
2. Chọn **một mẫu vật liệu theo vai trò**: pastel / holder trắng / lớp nổi.
   Tái sử dụng component/callback/semantics hiện có theo
   [catalog](STORE_APP_COMPONENT_CATALOG.md). Không biến toàn màn thành launcher.
3. Giữ composition, typography, thông tin, geometry và workflow đã accepted
   trừ khi owner yêu cầu riêng. Mobile gọn bằng đệm/gap phụ; không thu chữ,
   touch target hay record để tạo cảm giác gọn.
4. Tra cascade: `store-app.css` → frame/header + feature styles →
   `store-glass.css` → `store-mobile-refinements.css`; CSS lazy Home/feature
   còn có thể thắng theo specificity/thứ tự. Đo computed styles, không copy
   selector `.store-screen-home` sang feature và không thêm `!important` toàn cục.
   Portal ngoài `.store-app` cần scope của sheet/control tương ứng.
5. Playwright headless390×844 và1440×1024: DOM/interaction + screenshot của
   đúng vùng đổi; kiểm default/hover/focus/selected/open/error/loading khi có.
   Thêm320px/chữ150% nếu thay geometry/wrap. Kiểm không overflow, không layout
   shift và skeleton cùng vật liệu/kích thước; chỉ kiểm rộng hơn nếu có lý do.
6. Chạy gate liên quan, đối chiếu screenshot với Home hiện tại rồi đưa owner
   xem đúng scope. Nghiệm thu UI01 là reference, không tự nghiệm thu mọi màn mới.

Mẫu yêu cầu có thể copy:

> Từ main mới nhất, áp Co.op Fresh khối mềm, viền nhẹ (`coop-fresh-soft-v1`)
> theo `docs/product/STORE_APP_SURFACE_STYLE.md` cho **[các phần chỉ định]**.
> Dùng khối/viền Home làm mẫu, chọn đúng pastel hoặc holder trắng; giữ nghiệp vụ,
> nội dung, focus/selected và budget blur. Mobile trước, đối chiếu desktop.

## 7. Kiểm chứng tài liệu và giới hạn

Lượt UI03 chỉ thêm hướng dẫn và liên kết; **không đổi runtime/token/component**.
Đã đối chiếu source trên main9089f47 và đo Home qua preview main4263 bằng
Playwright headless390×844/1440×1024: bốn màu pastel, border trong suốt1px,
radius18px/sheen/card shadow/no blur, holder trắng/edge, icon48/54px,
hover xanh và focus ring. Kiểm thêm320/768px để xác nhận cascade title/icon/
hướng xếp/min-height; bốn viewport PASS vật liệu. Đã xem screenshot mobile
để xác nhận cách tạo khối.
Các số đo này mô tả reference, không phải tuyên bố toàn app đạt accessibility
hay đã kiểm thiết bị thật. Acceptance và evidence đầy đủ ở
[UI01](../delivery/ui01-mobile-perf/merge-2026-10-22.md) và
[KPH02](../delivery/kph02-merge-2026-10-22.md).
