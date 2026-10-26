# Store Fresh — Chế độ gọn (COMPACT01)

Revision3 chốt tạm ngày24/10/2026 theo owner “tạm, đến đây chốt được”.
Runtime`ca543e6`; [quyết định/phạm vi](../delivery/compact01-interface-density/acceptance-revision3.md). Base task0a25730 có Fresh Soft
d4f9d17 và đúng header816b4e3; chưa merge main. [Hồ sơ](../delivery/compact01-interface-density/plan.json).

## Sử dụng

Tài khoản → Cài đặt → Giao diện → **Chế độ gọn**. Mặc định tắt; đổi có hiệu lực
ngay, nhớ theo browser/device. Không đổi account/store hoặc quyền. Khóa
`coopfood.store-ui.density.v1` chỉ nhận `comfortable`/`compact`; thiếu/sai/đọc
lỗi dùng comfortable, ghi lỗi vẫn đổi trong phiên và có thông báo chưa lưu.

Size roles/cấu trúc và nguồn Apple/W3C ở [quy ước size](STORE_APP_SIZE_TOKENS.md).

## Hình ảnh

Ưu tiên vùng chức năng; giữ font chính, màu và Co.op Fresh Soft. Header72px,
sidebar/menu và nghiệp vụ giữ baseline. Item giảm nhẹ đệm, không ép chiều cao.

| Consumer | Compact |
| --- | --- |
| Tìm kiếm KPH/DATE/Báo cáo, clear/scan | 44px; clear button vẫn44px, input16px |
| Tạo phiếu KPH | Button một hàng44px Tạo TPCN/TPTS, accessible name đầy đủ; bỏ shortcut trùng |
| Báo cáo kỳ/phạm vi | Một hàng kỳ + lọc44px, face icon36px/hit44px, có active context |
| Bộ lọc | Section phẳng phân cách nhẹ, gap8/12px; sort nằm trong sheet |
| Choice sheet | Option60px/padding dọc8px; header/search/footer vẫn riêng |
| Form KPH | Section phẳng/padding dọc12px, heading gap8px, lựa chọn≥48px/input≥44px; ảnh không thu nhỏ |
| Tra hạn | Gap8px, form chính inset12px, nút≥44px; kết quả và timeline giữ nguyên |
| KPH mobile / DATE item | Padding dọc8px /10px; tag và tên không gộp |
| KPH desktop | Minimum row hai tầng56px, padding dọc6px; nội dung dài được nở cao |
| Thông báo | Nhóm20/12/8px theo tầng; summary≥56px; item≥92px |

Token `--store-density-*` chỉ sống dưới `html[data-store-density="compact"]`
khi `.store-app` active. CSS density chỉ nằm trong `@media screen`; không áp
chart/timeline, print/PDF/Excel, login, legacy online/Pilot hoặc Admin. Chế độ
mặc định không có override geometry. Không tái sử dụng `.store-compact` của
selection KPH làm density flag.

## Tương tác và accessibility

Provider không remount workspace. Tìm kiếm/lọc/selection/group/collapse/draft
được giữ. Frame và loading frame đặt cùng document attribute để Radix portal
nhận đúng mật độ; ra login/unmount dọn scope. Mở tài khoản giữ vị trí đọc khi
trigger còn nhìn thấy; focus từ portal không làm hero/header cuộn về đầu.
Ở vị trí cuộn sâu, lớp trắng của page kit che header như baseline; người dùng
cần cuộn lên để tới Tài khoản, không có nút settings ẩn trong form đang modal.

Vùng chạm≥44px, input16px, chữ phụ≥12px. Chữ lớn được phép tăng chiều cao.
Account sheet có body cuộn riêng; màn thấp dùng header gọn để công tắc và nút
đóng vẫn tới được. Switch có label/description/aria-checked, dùng Space/Enter,
focus rõ và forced-colors cue. Không thêm animation hoặc dependency.

Kiểm chứng/candidate/giới hạn tại [technical](../delivery/compact01-interface-density/technical.md).

## Candidate COMPACT03 — item DATE/Báo cáo/Thông báo,25/10/2026

Owner chấp nhận item KPH4346 bằng “ổn, tiếp”, cho tiếp tục các list theo
[đề xuất](../delivery/compact01-interface-density/list-items-next.md). Đây là
candidate kế tiếp, chưa nghiệm thu hình ảnh hoặc cho phép merge main.

- DATE: giữ tên/SKU/lô, NSX/HSD, %HSD24px, phase và lịch báo lại; processing
  là chữ/icon có màu, không nền/viền pill. Không ẩn Mở/Đã ghi nhận hoặc ngày
  nhắc. Không thay nhãn/timeline trong chi tiết.
- Báo cáo: bỏ khung nền HSD/Tồn trong card, trình bày thành dòng dữ kiện;
  processing thành chữ/icon. Giữ checkbox độc lập44px, toàn bộ dữ liệu thiếu
  tồn, phase, selected/mixed và detail. Bảng desktop giữ cột và dữ liệu.
- Thông báo: các nhóm phẳng, separator phân nhóm thay khung bao; bỏ gutter
  lặp ở bên trong để item có thêm30px vùng đọc. Giữ phase/%HSD, header/count/
  description, native thu/mở và mở đúng lô. Không loại thông tin lặp khỏi data.
- `store-record-items.css` chỉ screen Compact. Comfortable và bản in/PDF/Excel
  giữ quy tắc đã chốt; KPH của COMPACT02 không đổi. Các recipe dùng size tokens
  hiện có, không thêm mode, dependency hoặc shared primitive.

[Preview, số đo, kiểm tra và giới hạn](../delivery/compact03-date-report-items.md).

## COMPACT03 revision2 — vùng phụ, candidate26/10/2026

Theo owner yêu cầu tiếp phần bị ngắt và đồng nhất vùng chưa cover. Recipe chỉ
áp screen Compact; comfortable và output giữ nguyên. Không đổi handler hoặc
đưa dữ liệu nghiệp vụ vào preference.

| Consumer bổ sung | Recipe |
| --- | --- |
| Chi tiết KPH | Summary không khung/nền lồng, separator nhẹ; hàng tối thiểu44px, chữ14px, section17px. Label/value được wrap khi phóng chữ; giữ đủ ảnh và CTA duyệt. |
| Menu report/mẫu cá nhân/lịch sử | Hàng chức năng tối thiểu72px, icon phụ36px/20px, separator thay card/shadow; giữ màu icon, tên/mô tả/kỳ/count và quản lý mẫu44px riêng. |
| Lịch sử Tra hạn | Hàng phẳng, chữ phụ từ11px thành12px, ngày vẫn dd/mm/yyyy; cột ngày có minimum theoem để co giãn khi chữ lớn. Giữ snapshot lúc tra,20lần và Tra lại44px. |
| Tài khoản/Cài đặt | Store/settings rows phẳng, face36px, switch row≥56px, nút44px và inset/gap theo tokens; giữ hero, mô tả, persistence/fallback, body scroll và trả focus. |

Không thay đổi Home brand modules, header/navigation, timeline/chart hoặc
ảnh. [Coverage/phần hoãn](../delivery/compact03-date-report-items/assessment.md),
[kế hoạch và giới hạn](../delivery/compact03-date-report-items/plan.json).

## COMPACT03 revision4 — candidate DATE/Thông báo và Fresh chung

Owner26/10 yêu cầu đồng dạng phần chức năng và áp Compact cho DATE/Thông báo.
Cả hai mật độ dùng input16/24, caption12/18, calendar launcher44px; cặp ngày
filter KPH tự xuống hàng khi hẹp. Thông báo đưa tên/định danh bên trái và
%HSD24px bên phải, phase/lịch báo lại thành dòng toàn chiều ngang như DATE.
Giữ native details/summary và mở đúng lô, không thêm filter giả.

Compact DATE: filter/detail/reminder phân section bằng separator, heading17/24,
processing nhẹ hơn phase, lựa chọn nhắc và footer≥44px; không đổi box timeline.
Comfortable giữ nhóm mềm/thoáng; chi tiết KPH được wrap label/value khi chữ lớn,
report facts bớt nền lồng và account settings cùng recipe. Đây là thay đổi mặc
định được owner cho phép, thay quy tắc giữ nguyên comfortable geometry của các
revision trước trong đúng phạm vi này. Screen-only; print/chart/legacy giữ riêng.

[Scope, bản tích hợp và kiểm chứng](../delivery/compact03-date-report-items/plan.json).
Technical readiness không thay thế nghiệm thu owner hoặc cho phép merge.

## COMPACT03 revision5 — controller ổn định

Tài khoản/Cài đặt là nơi điều khiển mật độ nên giữ cùng geometry ở hai mode.
Không thu padding/icon/nút của chính panel này khi bấm công tắc: điều đó làm
cửa sổ tự co và dịch control dưới con trỏ. Recipe shared tại store-density.css;
Fresh/Compact consumer files không sở hữu account layout nữa. Checked/focus
paint vẫn đổi, workspace phía sau vẫn áp Compact ngay và giữ state. Quyết định
này thay recipe account Compact ở revision2/4 trong đúng phạm vi sửa lỗi.

Text input có một owner auto-height/min44; scan/action có thể giữ44px. DATE
filter section thuộc file DATE, generic density chỉ sở hữu KPH/report. Không
khóa input44px bằng selector ưu tiên cao hơn rồi vá auto-height ở cuối file.
[Review/kiểm chứng](../delivery/compact03-date-report-items/revision5-review.md).
