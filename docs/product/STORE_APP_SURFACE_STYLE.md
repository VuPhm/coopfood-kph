# Co.op Fresh Soft — khối mềm, viền nhẹ

FRESH01 revision4: hover/pressed shadow của Home là token dùng chung cho
whole-card actions; focus rõ, nhấn tại chỗ. Thông báo gap8px/đệm/viền đủ và nhóm
thu/mở có feedback. Native nav foreground chuyển ngay khi đổi selected state.
Không thêm vật liệu/màu/animation mới. [Checks](../delivery/fresh01-solid-compact/technical.md).

FRESH01 revision3: ánh sáng Home được tái dùng qua item/control/jewel roles
trong store-material.css, tới list/card/table và button states; TPTS CTA dùng
lam riêng, TPCN cam. Giữ field trắng/print/semantic colors và geometry.
[Phạm vi và tương phản](../delivery/fresh01-solid-compact/technical.md).


> FRESH01 revision2 candidate26/10/2026: giữ một UI, tăng gradient/ánh viền
> theo Home cũ và Apple iOS27/HIG; Home bốn tông, field nhập sáng trắng.
> Workspace trắng/well/xanh/xanhđậm, cam nhấn; selected chuyển sắc, cạnh mềm16%
> và độ nổi card/sheet. [Đặc tả đang dùng](STORE_APP_SOLID_COMPACT.md),
> [kết quả triển khai](../delivery/fresh01-solid-compact/technical.md).
> Nội dung bên dưới là provenance Fresh Soft trước tái dựng, không yêu cầu
> giữ pastel chia vùng hoặc khôi phục công tắc. Owner FRESH01 chưa nghiệm thu.


Tên ngắn: **Co.op Fresh Soft**. Mã tham chiếu giữ **`coop-fresh-soft-v1`**.
Ngày 22/10/2026; tên ngắn và recipe form bổ sung 24/10/2026. Đây là bộ quy tắc
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

## Triết lý được owner chấp nhận — 24/10/2026

**Nền và khoảng cách tạo khối; viền nghỉ lùi xuống; trạng thái giữ rõ.**

Owner đã chấp nhận form revision 2 bằng “ổn, làm tiếp” và yêu cầu áp dụng cho
các thành phần khác, ghi lại triết lý. **Co.op Fresh Soft** là tên của hướng
này, giữ mã `coop-fresh-soft-v1`. Reference hiện tại: Home, form `56e2edd` đã
duyệt và header `816b4e3` được yêu cầu tích hợp; base hợp nhất `568c8cd`.
Rollout button/chrome revision 4 là candidate riêng, không thay nghiệm thu từng
implementation bằng acceptance của triết lý.

1. **Tạo phân cấp trước khi vẽ khung.** Trắng là nền chính; pastel nhẹ nhận
   diện nhóm/chức năng. Dùng khoảng cách, tiêu đề, icon và hướng sáng để mắt
   nhận ra khối. Không quây mỗi nhãn/hàng/nút trong một đường bao đậm.
2. **Viền nghỉ chỉ hỗ trợ nhận diện.** Pastel dùng transparent; action có chữ/
   icon dùng mép 6% và fill nhẹ; holder trắng vẫn có mép `#dfe5e9` để tách trắng/
   trắng. Giữ hộp border1px để kích thước không nhảy. Không coi tất cả border
   là trang trí: check/radio/switch/cue nhập liệu vẫn phải đọc được.
3. **Phản hồi có trọng số.** Hover đổi fill nhẹ, không thêm nét kép. Chọn dùng
   check/radio, chữ/aria-state và màu đúng vai trò; một đường biên là đủ. Focus
   bàn phím giữ ring rõ; lỗi có chữ/aria và màu lỗi. Không làm mờ cả control
   bằng opacity để đạt cảm giác nhẹ, cũng không dùng bóng thay dấu hiệu chọn.
4. **Độ nổi có giới hạn.** Một mép sáng và bóng thấp tĩnh cho khối cần tách lớp;
   popup dùng bóng cao hơn. Divider lồng nhau rất nhẹ. Không thêm blur cho form,
   list/card hoặc animation shadow/filter. Reduced motion/transparency bỏ bóng;
   increased contrast/forced colors đưa viền cần thiết về màu hệ thống.
5. **Thông tin và thao tác quyết định.** Chữ/icon vẫn đủ tương phản, label và
   placeholder nhận diện ô nhập. Giữ touch target, geometry, thứ tự đọc, scroll,
   nghiệp vụ, semantic labels và màu biểu đồ. Đây là quy chuẩn Co.op Fresh cho
   PWA, chỉ tham khảo iOS27 về vật liệu/phân cấp; không tạo bản sao hệ điều hành.

### Áp theo vai trò, không đổi đồng loạt mọi border

| Vai trò | Nghỉ | Tương tác / trạng thái |
| --- | --- | --- |
| Card chức năng Home/Báo cáo | Pastel, mép transparent, sheen/bóng thấp | Hover fill; focus ring, giữ nhãn rõ |
| Holder nghiệp vụ trắng | Trắng + `#dfe5e9`, bóng thấp nơi cần tách lớp | Selected dùng semantic/check; không nhuộm toàn list |
| Input/date/select/textarea | Fill `#f0f7f3`, mép 6%, label/content rõ | Focus/error rõ, readonly/disabled thật; recipe mục6 |
| Nút phụ, toolbar, chip bộ lọc | Fill `#f0f7f3`, mép 6%, chữ/icon rõ | Hover `#e6f2eb`; chọn/open giữ cue hiện có, không nét kép |
| Nhóm filter/settings/reminder/Thông báo | Nền theo vai trò, mép 6%, bóng thấp | Check/native state/collapse riêng; focus không bị thay |
| Hàng picker và divider bên trong | Mép 6%; text/check làm cue | Hover fill; radio/check và keyboard giữ native semantics |
| Popup sort/dropdown/calendar | Mép 6%, nền đặc, bóng nổi nhỏ | Focus trap, điều hướng, cạnh màn và scroll không đổi |
| Header/navigation/primary action | Revision4 bổ sung token vật liệu nút xanh và mép chrome | Giữ header816b4e3/geometry; trạng thái đọc được, không đổi checkbox hoặc màu nghiệp vụ |

Runtime rollout local ở [store-component-soft.css](../../apps/store-pwa/src/store-component-soft.css),
form ở [store-form-soft.css](../../apps/store-pwa/src/store-form-soft.css).
Chỉ Store Fresh/login và các portal thuộc Store; không tự áp Admin/online/Pilot
hoặc `packages/ui`. [Scope, acceptance đã có và evidence mới](../delivery/form01-fresh-soft/technical.md).

## Token nút và mép chrome — FORM01 revision 4

Owner nhận xét chưa hiệu quả trên mọi nút, nhất là nút xanh, và yêu cầu một
round tổng thể token nút rồi áp vào mép khối trượt/sidebar/menu bar. Scope mới
cho phép sửa vật liệu primary/selected/navigation; giữ quy tắc và geometry.

[store-button-system.css](../../apps/store-pwa/src/store-button-system.css) là
nguồn token và binding theo vai trò của Store Fresh. Button shared chỉ thêm
`data-slot="button"`, `data-variant`, `data-size` để consumer áp recipe tin cậy;
không thay class/API/default styling của Admin/online/Pilot. Button native của
Store được nối cùng role, không suy primary từ tên utility hoặc text của nút.

| Vai trò/token | Giá trị / sử dụng |
| --- | --- |
| Primary | `#00724e`; gradient150° `#07825a → #00724e(58%) → #006746`, chữ trắng |
| Primary hover / pressed | `#006b49` / `#005e40`; hover gradient sâu hơn, pressed fill đặc và bóng inset |
| Secondary | Fill `#f0f7f3`, chữ `#005e40`, hover `#e6f2eb`, pressed `#dceee3` |
| Secondary edge | Hộp border giữ nguyên, sơn transparent; inset1px 6% thay viền dày/đôi |
| Ghost / icon | Chữ `#40566a`, nền nghỉ transparent; icon hover tint nhẹ, giữ hit area |
| Selected | Cùng vật liệu xanh primary; check/aria-state/underline vẫn giữ; edge xanh đồng nền |
| Danger | `#b42318 → #9c2118`, chữ trắng; không áp màu này cho thao tác trung tính |
| Disabled | Fill `#e4ece7`, chữ `#506358`, không gradient/bóng/giảm opacity; native disabled giữ nguyên |
| Radius | Action16px; icon14px; capsule/navigation giữ hình dạng phù hợp |
| Focus | Ring3px `#20344a`, inverse hero trắng; không dùng bóng hoặc màu nền làm cue duy nhất |
| Motion | Hover nền nhẹ120ms; chữ và selected/disabled đổi đồng bộ, không cross-fade màu trạng thái; pressed tại chỗ, không translate1px/brightness cả nút |

Các token `--store-button-*` áp trực tiếp vào primary của form/review, report
dock, bộ lọc, login/account, Tra hạn, nút chọn và native command. KPH create CTA
vẫn có nhãn loại hàng theo màu riêng; “Ghi nhận” DATE giữ cam `#c24e00 → #a63f00`.
Không thay switch, radio/check, semantic label, row/item clickable thành CTA.

[store-chrome-soft.css](../../apps/store-pwa/src/store-chrome-soft.css) định nghĩa
`--store-layer-*`: mép6%, highlight trắng90%, cap shadow `0 -2px 10px /6%`,
panel shadow `0 12px 32px /14%`, nav shadow thấp và sidebar shadow sát mép.
Dùng inset/box-shadow thay border làm đổi box: khối trắng trượt, sheet/modal,
sidebar248px, menu capsule và floating report dock giữ placement/scroll owners.
Sidebar current có stripe3px, menu current giữ capsule và aria-current.

Reduced motion/transparency bỏ bóng trang trí và chuyển màu tức thì; increased
contrast/forced colors đưa viền và current marker về hệ màu OS, bỏ gradient.
Không thêm backdrop blur hoặc đổi layout để tạo cảm giác mềm. Recipe ở mục
trước vẫn áp theo vai trò; phần token/chrome revision4 đang chờ owner xem.

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
material cũ store-glass.css (đã thay bởi [Store material](../../apps/store-pwa/src/store-material.css)),
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

- Hàng “Cần chú ý”: radius14px, gap12px, border 1px `#dfe5e9`, nền trắng,
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

## 6. Recipe form — FORM01 candidate 24/10/2026

Owner yêu cầu làm mềm các thành phần form hiện tại và đặt tên phong cách;
form revision 2 đã được chấp nhận24/10, xem phần triết lý phía trên.
Dùng tên **Co.op Fresh Soft** cho cùng bộ `coop-fresh-soft-v1`; không tạo theme,
setting hay họ token shared mới. Revision 2 theo feedback “viền vẫn dày”:
ưu tiên cách Home phân khối bằng fill/mép sáng thay đường bao đậm. Recipe form
nằm trong stylesheet local
[store-form-soft.css](../../apps/store-pwa/src/store-form-soft.css), áp Store Fresh/
login và các portal của Store; Admin/online/Pilot giữ riêng.

| Vai trò | Recipe form |
| --- | --- |
| Input/select/textarea nghỉ | Radius 16px, hộp border 1px giữ geometry nhưng màu chỉ `rgb(0 60 40 / 6%)`; fill `#f0f7f3`, mép sáng/bóng thấp; label + nội dung/placeholder rõ |
| Hover | Fill `#eaf4ee`, giữ mép nhẹ; không vẽ lại khung đậm chỉ vì trỏ chuột |
| Focus | Border xanh `#00724e`, fill trắng; ring keyboard hiện có vẫn rõ, bounds không đổi |
| Readonly | Fill `#f0f5f2`, giữ readonly/native value/nhãn và focus của caller |
| Disabled | Fill `#f0f3f1`, bỏ bóng; trạng thái disabled thuộc caller |
| Invalid | Fill `#fef3f2`, edge `#b42318`, lỗi chữ/aria vẫn do form cung cấp |
| Choice KPH | Giữ màu semantic + radio/check; dùng một đường biên và bóng thấp thay nét kép khi chọn |
| Nhóm/filter và footer | Nhóm trắng/radius 18, bóng nhẹ; nút radius 16; không thay padding/layout hoặc CTA semantics |
| Login | Một shell chứa icon/input/reveal, cùng recipe; không thêm viền lồng lên input |

Màu xanh rất nhẹ chỉ ở **bên trong ô nhập**; canvas/holder vẫn trắng như đã
nghiệm thu. Hero search/CTA giữ vật liệu riêng trên xanh. Viền nghỉ là trang trí,
không phải cue duy nhất: field giữ label và nội dung/placeholder rõ; Số lượng
Store Fresh có thêm “Nhập số lượng” khi trống. Chữ/value/placeholder ≥4.5:1;
focus/error/selection vẫn ≥3:1. Field thiếu cue nhận diện phải giữ boundary ≥3:1,
không dùng viền 6% cho ô trống không label. Reduced motion/transparency bỏ bóng; high contrast dùng màu hệ thống. Không thêm blur, animation shadow,
listener, dependency hoặc thay rule ngày/snapshot/dữ liệu.

Tham khảo [iOS 27](https://www.apple.com/lae/os/ios/) về khả năng đọc và độ tách
lớp, cùng [Apple Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
về dùng vật liệu có chọn lọc. Đây là diễn giải cho PWA/Co.op Fresh, không mô phỏng
native glass hoặc thêm blur. Kiểm cue theo vai trò, xem
[WCAG 1.4.11 — Boundaries](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html#boundaries);
không suy kiểm scoped thành chứng nhận accessibility đầy đủ.

Giữ skeleton/live cùng geometry. [Phạm vi, gate và preview](../delivery/form01-fresh-soft/technical.md).
Form revision 2 đã được owner chấp nhận; component rollout revision 3 chờ xem.
Không suy technical PASS thành acceptance.

## 7. Cách áp cho round sau

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

## 8. Kiểm chứng tài liệu và giới hạn

Lượt UI03 chỉ thêm hướng dẫn và liên kết; **không đổi runtime/token/component**.
Đã đối chiếu source trên main9089f47 và đo Home qua preview main4263 bằng
Playwright headless390×844/1440×1024: bốn màu pastel, border trong suốt1px,
radius 18px/sheen/card shadow/no blur, holder trắng/edge, icon48/54px,
hover xanh và focus ring. Kiểm thêm320/768px để xác nhận cascade title/icon/
hướng xếp/min-height; bốn viewport PASS vật liệu. Đã xem screenshot mobile
để xác nhận cách tạo khối.
Các số đo này mô tả reference, không phải tuyên bố toàn app đạt accessibility
hay đã kiểm thiết bị thật. Acceptance và evidence đầy đủ ở
[UI01](../delivery/ui01-mobile-perf/merge-2026-10-22.md) và
[KPH02](../delivery/kph02-merge-2026-10-22.md).

## COMPACT03 revision4 — phân cấp dùng chung giữa chức năng

Candidate26/10 theo owner: đồng dạng dựa trên vai trò, không chỉ giảm đệm.
Tên → định danh → tình trạng chính → xử lý/lịch nhắc → hành động giữ cùng
thứ tự trong DATE/Thông báo và các list tương đương. %HSD dùng24px cho hai
nguồn cùng dữ liệu; phase vẫn chữ/icon/màu, không suy nghiệp vụ từ hình ảnh.
Compact dùng section phẳng, separator và face36px; comfortable giữ grouped
well thoáng hơn. Section17/24, input16/24, caption12/18 và hit44px lấy từ
Store-local size tokens; không tạo palette/mode/dependency mới. Các filter
cùng cách chia nhóm/sắp xếp/đặt lại/xong khi workflow thực sự tương đương.
Thông báo giữ native thu/mở và deep link, không ép thành workspace tìm/lọc.
Loading KPH chỉ dùng paint trung tính, không hiện nhãn trạng thái nghiệp vụ
trước khi workspace sẵn sàng. [Gates](../delivery/compact03-date-report-items/plan.json).

## COMPACT03 revision6 — field và action khác vai trò

Owner26/10 yêu cầu field bớt lồi và CTA giống Home soft. Text input/textarea/
select dùng matte fill #f3f6f4, edge16%, radius12 và không bóng ngoài/sheen;
focus vẫn trắng/edge xanh, lỗi đỏ, readonly/disabled phân biệt. Size và label/
validation giữ nguyên. Hai CTA KPH dùng pastel cam/mint với hover/pressed,
chevron; comfortable hai tầng chữ trên một mặt nền, Compact một hàng. Biện
pháp giữ tag container; approval final vẫn có fallback icon đã chốt.

Tham khảo [Apple Text fields](https://developer.apple.com/design/human-interface-guidelines/text-fields)
về nhận diện/label/kích thước/nhập liệu và [Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
về phân cấp lớp chức năng/content; [iOS27](https://images.apple.com/os/ios/) nhấn
mạnh readability/contrast. Đây là ứng dụng vào Co.op Fresh web, không tuyên bố
sao chép pixel hay chuẩn bắt buộc của iOS. Rule mới thay field-elevation recipe
FORM01 trong đúng phạm vi các Store consumers đang dùng; không đổi choice
semantics, chrome, workflow hoặc palette chart.
