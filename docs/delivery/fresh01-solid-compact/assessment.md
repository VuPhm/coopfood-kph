# Khảo sát nguồn và map thay thế FRESH01

Source c5a440b (runtime5b65094), tree sạch khi bắt đầu. Mainf77034d sạch;
không fetch/push, remote freshness chưa kiểm vì scope local. Các worktree task
cũ được giữ nguyên, không dọn hoặc chỉnh sửa provenance/Pages. Root sole writer.

## Kế thừa và thay thế

| Phần | Quyết định | Lý do |
| --- | --- | --- |
| DATE/KPH list r8 | Kế thừa cấu trúc/thứ tự/facts/tag2; dựng lại paint/size roles | Owner đã nói list Compact ổn; không mất công việc vừa tích hợp |
| DATE food tabs / unknown queue / shared sheet | Kế thừa | Có consumer thực, đúng flow và metadata; không phụ thuộc gu vật liệu |
| Frame/white sliding cover/nav/scroll/sticky | Kế thừa cấu trúc, dựng lại vật liệu | Owner yêu cầu giữ khuôn trượt |
| Compact preference/provider/account switch | Loại bỏ | Owner yêu cầu một UI duy nhất |
| Comfortable JSX/style | Loại bỏ | Không giữ UI cũ ẩn hoặc compatibility flag |
| Token soft/material hiện tại | Gom/chỉnh tại owner; xóa trùng sau migration | Không xếp thêm một theme override sau chuỗi CSS cũ |
| Print/export và domain guards | Giữ | Output không phải mode UI; rule/nghiệp vụ/API không thay |

## Map bước1

Rà bằng source search trước sửa:129literal density selectors trong5CSSfiles:
store-density.css78; store-compact-surfaces.css21;
store-date-notification-surfaces.css15; store-fresh-surfaces.css8;
store-record-items.css7. Số đếm là inventory, không phải mục tiêu LOC.

| File | Việc thực hiện |
| --- | --- |
| store-density.tsx | Xóa preference/read/write/context/provider/scope/setting/anchor chỉ dùng toggle. Nếu print cần hook, giữ hook print có tên đúng chức năng, không trả string mật độ |
| store-app.tsx / store-app-frame.tsx | Bỏ provider/scope và import chết; giữ frame lifecycle/loading/portal ownership |
| store-account-sheet.tsx | Bỏ setting và mô tả lưu thiết bị; giữ tài khoản/cửa hàng/action/focus/body scroll. Không thay bằng một toggle giả disabled |
| store-kph-create-button.tsx | Giữ một CTA hàng gọn với icon/text/chevron; xóa JSX comfortable cũ |
| store-report-settings.tsx | Giữ một operational row; xóa cặp settings cards cũ, xem StoreSettingsGroup consumers thật trước xóa shared code |
| store-kph-workspace.tsx / store-kph-loading.tsx | Một toolbar/CTA/sort composition cho live và loading; bỏ shortcut trùng, sort vẫn truy cập trong filter |
| store-date-workspace.tsx | Bỏ density conditional ở quick-sort; giữ type/filter/attention/sheet/lookup/deep-link |
| store-date-report.tsx | Một heading/selection context, vẫn giữ saved report/output context; kiểm export riêng |
| store-kph-list.tsx | Dense screen cố định; chỉ tách print khi cần đầy đủ3labels. Không làm print mất approval |
| store-density.css | Chuyển recipe screen thực sự dùng về owner layout/feature tương ứng rồi xóa tên/vars preference; account layout chuyển về account CSS |
| store-fresh-surfaces.css | Bỏ comfortable-only recipe; chuyển phần thật sự cần sang role chung, xóa import/file nếu rỗng |
| store-compact-surfaces.css / record-items / date-notification-surfaces | Bỏ mode guard, gộp về screen Store scope và owner recipe; portal theo body Store active; print tách bằng media |
| store-density.test.tsx | Thay persistence/toggle tests bằng one-mode/stale-key/print/loading/state thực; xóa test behavior đã bỏ |
| e2e density/stability/list-policy/parity checks | Bỏ thao tác bấm công tắc, thay expectation một-mode và state/print; giữ DATE/KPH/report/reminder/unknown assertions |

Stale localStorage key không cần compatibility migration hay đọc/xóa lúc boot.
Code mới bỏ qua hoàn toàn: giá trị cũ không ảnh hưởng UI. Không truy cập storage
chỉ để dọn preference chết; không thêm key mới thay thế.

## Owner của token/khuôn

- Color/material: store-glass.css, store-button-system.css,
  store-component-soft.css, store-form-soft.css, store-chrome-soft.css. Kiểm
  source declaration và consumer trước gom; một role có một owner.
- Size/space/type: store-size-tokens.css và frame/feature layout. Không chỉnh
  shared packages/ui default để tác động lây Admin/online.
- Frame: StoreAppFrame / StorePageLayout; tab: StoreStickyTabs + StoreFoodKindTabs.
- Surface: StoreSheet / StoreChoiceSheet / Dialog giữ focus/scroll primitives.
- List: StoreKphList + DATE mobile/table; cùng heading/control/table roles,
  không ép thành generic domain list với nhiều flags.
- Feature owner giữ labels/semantic states; không recolor toàn bộ SVG hoặc
  ListLabel bằng universal selector làm mất cảnh báo/lỗi/selected/loading.

## Checkpoint và giới hạn kế hoạch

Nguồn kế thừa có352tests và browser evidence trong COMPACT03; đó là bằng chứng
trước thay đổi, không phải kiểm chứng FRESH01. Lượt này chỉ có tài liệu mới,
check:docs / diff-check / consistency check cho plan. Không có browser preview
FRESH01, không đổi runtime4360 và không tự nhận đã xóa switch hoặc dựng palette.
