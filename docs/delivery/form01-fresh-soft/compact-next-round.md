# COMPACT01 — chuẩn bị vòng mật độ giao diện tùy chọn

Trạng thái: bản phạm vi chuẩn bị theo yêu cầu owner24/10/2026; chưa triển khai,
chưa mở cycle thực thi và chưa thay giao diện mặc định. Base implementation sẽ
là SHA main sau khi tích hợp FORM01 + đúng816b4e3, ghi SHA thực khi mở task.
Không dùng planning làm acceptance của thiết kế hoặc thay contract hiện hành.

## Mục tiêu sản phẩm

Thêm **Chế độ gọn (Compact)** tại **Tài khoản → Cài đặt → Giao diện** để người
muốn xem nhiều thông tin hơn tự bật. Giữ **Co.op Fresh Soft** và quy tắc:
“Nền và khoảng cách tạo khối; viền nghỉ lùi xuống; trạng thái giữ rõ”.
Compact vừa phải, ưu tiên khoảng đệm và cách bố trí; không thu đồng loạt item
xuống30–40%, không scale/zoom toàn app. Desktop mặc định giữ trọng số cao của
bản hiện tại; mobile không chắp vá hay ép tên/tag/ngày vào cùng một hàng.

## Tùy chọn và phạm vi lưu

- Cài đặt được thêm thành nhóm trong sheet Tài khoản hiện có. Heading nhóm
  “Cài đặt”, mục “Giao diện”, switch tên “Chế độ gọn”; mô tả ngắn “Giảm khoảng
  trống để xem nhiều nội dung hơn”. Không thêm một tab/menu chính hoặc route
  Cài đặt riêng trong slice đầu. Bộ chọn phải có label/description và keyboard.
- Mặc định **tắt**, chính là giao diện Fresh Soft đã chốt; không tự bật theo
  màn hình, hệ điều hành, loại tài khoản hay role. Người dùng đổi được ngay.
- Đổi ngay trong phiên; lưu duy nhất preference density trên browser/device,
  không đồng bộ tài khoản/store. Namespaced key đề xuất
  `coopfood.store-ui.density.v1`, chỉ nhận `comfortable` hoặc `compact`.
  Key thiếu/sai/cũ không hỗ trợ → comfortable; storage bị chặn/lỗi → vẫn dùng
  state trong phiên, không chặn công việc. Không lưu PII, phiếu, ảnh hay scope.
- Không lấy settings IndexedDB của Pilot hoặc quyền backend làm preference.
  localStorage ở đây chỉ là hiển thị, không là authority dữ liệu nghiệp vụ.
- Áp Store Fresh đã đăng nhập và các sheet/portal của nó; không áp login,
  online/Pilot cũ, Admin, print/PDF/Excel, canvas biểu đồ hay asset thương hiệu.
  Khi ra khỏi Store Fresh phải dọn attribute/style scope, không rò sang entry khác.

## Inventory và quyết định hình ảnh

Hiện `StoreAccountSheet` chưa có settings UI; `StoreAppFrame` là boundary app,
portal do Radix render ngoài root nên cần một density scope duy nhất xuyên
app + portal, cleanup đúng lifecycle. Tái sử dụng control/primitive và token
đang có; không thêm state manager/dependency/platform abstraction.

| Vùng | Giữ nguyên | Thử tối ưu trong Compact |
| --- | --- | --- |
| AppHeader/sidebar/menu | Header72px, sidebar248px, menu64px,44px controls, ancestor816/recent/safe area | Chưa đổi geometry trong slice đầu; tránh compact phá frame |
| KPH desktop | Trọng số tên, căn dọc/ngày, click cả hàng, checkbox độc lập | Giảm padding hàng có dư; đo thử hàng60px về52–56px khi nội dung cho phép |
| KPH mobile | Tên tối đa2 dòng, ngày cân đối, tag strip cuộn riêng, detail đầy đủ | Giảm đệm giữa cụm; không ghép tag với vùng mở phiếu hoặc ép một dòng |
| DATE / Thông báo | %HSD, nhãn phase/ngày, nhóm/thu mở/nhắc đúng lô | Giảm khoảng nhóm và đệm thẻ, giữ hierarchy và nhãn cần xem nhanh |
| Báo cáo | Settings, selection/check, dock, tên mẫu và trạng thái | Giảm khoảng trống section/table; responsive rõ, không che nội dung cuối |
| Form/picker/filter/Tra hạn | Label/helper/error/focus, input16px,44px hit area, thứ tự thao tác | Giảm padding section/gap dư; input48px có thể thử44px, textarea/photo vẫn đủ dùng |
| Home | Nhận diện module/pastel, launcher và lối vào công việc | Giảm khoảng giữa cụm có dư, giữ nhãn và số liệu đọc nhanh |

Các con số thử là mục tiêu đo, chưa là thay đổi đã chốt. Đo computed styles trên
base mới trước khi chọn giá trị; trường nhiều dòng có thể cao hơn. Không ép
một chiều cao cố định bằng overflow hidden để đạt số item.

Giữ font tên/nội dung chính ở mức hiện tại trong slice đầu; nhãn phụ không
xuống dưới12px, input giữ16px. Vùng chạm ít nhất44×44px, mục độc lập liền kề
có khoảng an toàn8px; zoom/chữ150–200% được phép nở cao. Reduced motion và
contrast/forced colors phải giữ các cue rõ như standard. Chọn compact không
đồng nghĩa chọn font nhỏ hoặc bỏ nhãn/hướng dẫn/lỗi.

## Token và trạng thái

- Chỉ override nhóm `--store-density-*` cho spacing/min-height được mapping
  tới consumer thực. Comfortable giữ giá trị hiện tại, không dựng thêm theme
  palette; role/state nút và token layer của FORM01 vẫn là nguồn vật liệu chung.
- Density là preference hiển thị độc lập, không tái sử dụng `.store-compact`
  đang có trong KPH: đó là nút **Chọn** (`aria-pressed`) của selection nghiệp vụ.
- Bật/tắt giữ route/query/filter/group ngày/collapse/selection, số mục đã tải,
  scroll anchor vào item đang xem, draft form/ảnh đang nhập, report state và
  focus của control hiện hành. Không remount workspace hoặc tạo request mới.
- KPH default nhóm ngày vẫn bật; checkbox ngày chỉ hiện trong Chọn; vùng
  checkbox và vùng thu/mở vẫn riêng. OTHER ellipsis có full text/detail;
  tag chỉ cuộn trong hàng, trang không tràn ngang. Hiển thị thêm không đổi25.
- Không thay rule/enum/API/auth/snapshot/số ảnh/date timezone/idempotency hoặc
  giới hạn chọn/export. Chart/PDF/Excel giữ layout/font/màu trước preference.

## Slice thực hiện dự kiến

1. Sau khi FORM01 tích hợp, tạo `store-app/compact01-interface-density` ở
   worktree riêng, một writer; ghi base SHA thực, scope và owner packages/ui
   nếu phát sinh. Chỉ một milestone thực thi active; kế hoạch này không mở team.
2. Preference + nhóm Cài đặt + app/portal scope. Kiểm reload/storage failure/
   cleanup và default không đổi trước khi áp spacing.
3. Map spacing cho KPH/DATE/Thông báo và report list; owner xem desktop/mobile
   nhiều item cùng ngày, OTHER dài, tên dài, empty/loading và selection.
4. Áp form/picker/Tra hạn/Home nơi có dư khoảng trống; kiểm chuỗi thao tác,
   lỗi/ảnh/focus và report dock. Không tiếp tục nén nơi đã đạt ngưỡng đọc/chạm.
5. Chốt token matrix và evidence trước/sau, trình owner xem cả hai chế độ;
   nghiệm thu riêng Compact trước merge. Không auto rollout ngoài Store Fresh.

## Gate có thể nghiệm thu

- Unit/component: default off, parse storage/safe fallback, đổi không mất draft/
  selection, cùng density trong portal, cleanup ra ngoài scope.
- Playwright headless mặc định390×844 và1440×1024; thêm320×844,900×650,
  844×390 và chữ150%/200% để bắt nén/tràn. Kiểm DOM/interaction/screenshot có
  mục tiêu; không snapshot pixel toàn app.
- Comfortable: các box/content/workflow giữ baseline trong1px ở cùng font và
  dữ liệu. Compact: đo số hàng đầy đủ/chiều cao vùng có mục tiêu, cần cho thấy
  lợi ích thực; không nhận thay đổi chỉ vì ít padding nhưng khó đọc/chạm hơn.
- Toggle cả lúc nhập form, chọn lô/phiếu, nhóm ngày đang đóng, đang cuộn;
  dữ liệu/focus/anchor không mất. Modal vẫn khóa cuộn, đóng trả đúng focus.
- Scrollbar desktop native kéo được, tag mobile cuộn riêng không lộ thanh,
  không tràn ngang, menu/dock/FAB không che thao tác cuối.
- Thử reload, storage denied, malformed value, deep link, đổi viewport, mở/đóng
  portal; contrast text≥4.5, focus/selected/disabled đọc rõ, forced colors.
- Chart/print/export parity, `npm run verify` và regression DATE→KPH, tạo KPH,
  report selection/export, Tra hạn theo affected scope. Không dùng mock để
  tuyên bố backend/thiết bị thật đã đạt.

## Quyết định chuẩn bị

Mặc định tắt và lưu theo thiết bị là giả định thiết kế hợp lý cho tùy chọn tự
chọn; có thể điều chỉnh trước implementation theo owner. Không đổi màn mặc
định và không cài switch giả chưa có hiệu lực vào bản chuẩn bị merge hiện tại.
