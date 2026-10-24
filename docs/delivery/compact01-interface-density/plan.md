# COMPACT01 — Chế độ gọn tùy chọn

Ngày lập:24/10/2026; revision2 **EXECUTING** theo owner “tiếp tục thực hiện”.
Triển khai solo trên cùng task. Base0a25730 ghép đúng FORM01d4f9d17 + header816
vào nhánh Compact; main và nghiệm thu FORM01 giữ riêng. Dependency main-merge
trong bản kế hoạch ban đầu được thay bằng task baseline này để tiến hành ngay.

## Mục tiêu và thứ tự ưu tiên

Thêm **Chế độ gọn (Compact)** có thể bật/tắt trong Cài đặt. Làm gọn chủ yếu
**khu vực chức năng** để người dùng tiếp cận nội dung và thao tác nhanh hơn;
item chỉ giảm một phần khoảng đệm. Giữ Co.op Fresh Soft, phân cấp chữ, nhãn
trạng thái và workflow đã duyệt.

Thứ tự ưu tiên: tìm kiếm/bộ lọc/thanh thao tác → nhóm thiết lập và form/popup
→ khoảng cách giữa các section → item. Không lấy tăng số item bằng mọi giá
làm mục tiêu của vòng này.

Kế thừa bản chuẩn bị COMPACT01 ở nhánh FORM01, cụ thể hóa theo yêu cầu hiện
tại “làm gọn 1 phần item, làm gọn chủ yếu vào các phần chức năng”. Đây là
record riêng cho cùng vòng Compact dự kiến, không mở thêm một vòng song song.
[Assessment và provenance](assessment.md), [record](plan.json).

## Tùy chọn người dùng

- Vị trí: **Tài khoản → nhóm Cài đặt → Giao diện → Chế độ gọn** trong account
  sheet hiện có; không cần route hay tab điều hướng mới. Nhóm Giao diện có
  switch ngay trong sheet, không bắt người dùng qua nhiều popup.
- Mô tả: “Thu gọn khu vực thao tác và khoảng cách để xem nhiều nội dung hơn”.
- Đề xuất mặc định **tắt**; bật/tắt áp dụng ngay, không cần tải lại hoặc Lưu.
  Mặc định tắt và lưu theo thiết bị là giả định để triển khai, chưa phải
  nghiệm thu hình ảnh hoặc preference policy của owner.
- Lưu theo browser/device với key `coopfood.store-ui.density.v1`, giá trị
  `comfortable` hoặc `compact`. Chỉ là preference hiển thị, độc lập tài khoản,
  store và dữ liệu nghiệp vụ; không lưu phiếu/ảnh/PII hoặc đồng bộ backend.
- Key thiếu/sai → comfortable. Storage đọc/ghi lỗi → vẫn bật/tắt được trong
  phiên; không chặn thao tác nghiệp vụ hoặc báo đã lưu bền vững khi ghi lỗi.
- Áp Store Fresh sau đăng nhập và portal của nó. Login, Pilot/online cũ,
  Admin, bản in/PDF/Excel và canvas biểu đồ giữ quy tắc riêng.

## Phạm vi hình ảnh

Các số dưới đây là **giá trị thử**, phải đo lại trên baseline sau tích hợp.
Không áp một tỷ lệ thu nhỏ cho toàn app; nơi đã gọn đủ thì giữ nguyên.

| Khu vực | Điều chỉnh Compact dự kiến | Điều kiện giữ |
| --- | --- | --- |
| KPH và DATE: tìm kiếm, lọc, sắp xếp, Chọn | Giảm khoảng dọc; gom control liên quan cùng hàng khi đủ chỗ; CTA KPH hiện khoảng64px thử52–56px; search48px thử44px | Nhãn dễ nhận biết, trạng thái lọc/count/chọn vẫn rõ; mobile cho xuống dòng tự nhiên |
| Bộ lọc và popup chọn | Section padding16–24px thử12–16px; gap16px thử12px; input/nút48px thử44px ở nơi phù hợp | Label/helper/error vẫn hiện; clear button có vùng44px kể cả khi input giảm chiều cao; footer không che kết quả |
| Báo cáo: kỳ, phạm vi, selection, dock | Hàng thiết lập mobile đang60px thử52–56px, desktop68px thử56–60px; giảm đệm giữa các cụm | Giữ tên mẫu/kỳ/phạm vi, số đã chọn, mixed state và thao tác cuối; không thêm tab hoặc gesture ẩn |
| Form KPH TPCN/TPTS | Giảm đệm section và khoảng cách giữa trường; ghép trường liên quan trên desktop nếu đủ rộng | Giữ thứ tự nghiệp vụ, ngày, lỗi liên kết, 1–3 ảnh có thứ tự, review/submit; không thu ảnh để đạt chỉ tiêu |
| Tra hạn chính và tiện ích | Giảm khoảng trống quanh input/kết quả; kiểm cả hai consumer | Input16px, kết quả chính rõ, picker/error/history và quy tắc tính giữ nguyên |
| Item KPH/DATE/Thông báo/Báo cáo | Giảm nhẹ padding/gap dư sau khi làm vùng chức năng; thử giảm chiều cao0–10% với fixture tên ngắn | Giữ cỡ chữ chính; tên dài và chữ lớn được nở cao, ngày/%HSD/tag không ép chung một dòng; KPH tag strip vẫn cuộn riêng |
| Home | Chỉ giảm đệm quanh nhóm nút chức năng nếu còn dư | Giữ phân biệt module, số cần chú ý và nhãn |
| AppHeader/sidebar/menu | Giữ geometry của baseline đã tích hợp | Header72px, sidebar248px, menu/safe-area/Back/ancestor không bị thiết kế lại trong vòng này |

Tối thiểu44×44px cho vùng chạm tác nghiệp; khoảng an toàn8px giữa nút rời
nhau. Chữ nhập giữ16px, chữ phụ không dưới12px; không giảm font chính trong
slice đầu. Không bỏ nhãn/lỗi/trạng thái để đạt mật độ. Không dùng scale/zoom,
fixed-height clipping hoặc tự thu/mở nhóm theo density.

## Kỹ thuật và ownership

- Một writer ở nhánh `store-app/compact01-interface-density`, worktree
  `/Users/vup/Documents/coopfood-kph/.local/worktrees/compact01-interface-density`.
  Không dispatch agent ở lượt lập kế hoạch.
- `store-account-sheet.tsx` là nơi thêm nhóm Cài đặt. Không dùng nhầm
  `store-settings-dialog.tsx`: dialog đó thuộc thiết lập cửa hàng Pilot.
- Dùng state/context React nhỏ cho preference, parse/persist có fallback;
  không thêm dependency hoặc state manager.
- Một scope density dùng chung cho app và Radix portal: cân nhắc attribute
  có lifecycle trên document khi Store Fresh đang active, kết hợp selector
  chỉ cho root/portal Fresh. Dọn scope khi ra login/unmount; dùng component
  test chứng minh portal mới mở và portal đang mở nhận đúng preference.
- Tạo nhóm `--store-density-*` cho spacing/min-height có consumer thật;
  comfortable map đúng baseline, compact override cục bộ. Vật liệu nút/layer
  tiếp tục dùng token FORM01; không sửa palette, font hay tokens global.
- Không dùng `.store-compact` làm selector density: class này hiện biểu đạt
  nút **Chọn** của KPH. Không dùng density làm `key` hoặc remount workspace.
- Bật/tắt giữ route/query/filter/group/collapse/selection/tập đã tải và draft.
  Với danh sách đang cuộn, giữ item anchor khi còn đủ scroll range. Đóng
  account sheet trả focus về trigger theo hành vi hiện có.
- Không thêm đường vào Cài đặt trong mọi form. Khi modal đang khóa focus và
  người dùng không thể mở account sheet, kiểm thay đổi preference qua provider
  trong component test; không tạo luồng UI giả để đủ testcase.
- `packages/ui/**`, lockfile, root config, API, backend/migration không nằm
  trong write scope dự kiến. Nếu thật sự cần shared primitive, ghi scope
  revision và nhận ownership trước khi sửa; ưu tiên reuse native/control sẵn có.

## Các bước thực hiện

| Bước | Đầu ra | Điều kiện qua bước |
| --- | --- | --- |
| 0. Chốt baseline | Đã ghép FORM01d4f9d17 + đúng header816b4e3 vào task base0a25730; main giữ riêng | Task chứa source mong đợi, scope/owner rõ; không thay main hoặc nghiệm thu FORM01 |
| 1. Đo và thiết lập preference | Ma trận comfortable ở390/1440; switch, persistence và app/portal scope chạy thật | Default không đổi; reload/storage lỗi/cleanup đạt; chưa rollout spacing |
| 2. Làm vùng chức năng | KPH/DATE toolbar và bộ lọc trước, tiếp theo Báo cáo settings/selection/dock | So trước/sau cùng dữ liệu; khu vực thao tác gọn rõ, control còn dễ dùng |
| 3. Hoàn thiện | Form/picker/Tra hạn, giảm nhẹ item và Home nếu có dư | Không mất nhãn/trạng thái/draft, không tràn hoặc che thao tác; dừng nén ở ngưỡng đọc/chạm |
| 4. Kiểm và nghiệm thu | Candidate SHA, preview thật, evidence hai chế độ và kịch bản owner | Technical đạt rồi chờ owner chấp nhận Compact; ghi phần đạt/chưa đạt riêng |

Base thực thi revision2 là `0a257309ae0db1a45cc9d225207a8e0080a99206`, task merge
của kế hoạch với đúng runtime FORM01d4f9d17 chứa header816b4e3. Main vẫnf77034d.
Owner đã yêu cầu tiếp tục; dependency phải merge main trước trong revision1
được thay bằng stacked task baseline. Không suy acceptance hoặc main merge.

## Tiêu chí kiểm chứng

1. **Có lợi ích đo được ở khu chức năng:** ghi tổng chiều cao từ đầu cụm
   control đến đầu danh sách và chiều cao nhóm form/settings, cùng fixture,
   font, viewport, trạng thái. Mục tiêu thử giảm10–20% vùng có dư hoặc lấy lại
   khoảng24–48px ở mobile KPH/DATE/Báo cáo. Chọn một metric phù hợp cho từng
   cụm trước khi sửa; báo số thực, không nhận chỉ vì CSS đổi. Đây không phải
   cam kết ép mọi màn cùng tỷ lệ; nếu vướng44px/reflow thì ghi và owner xem.
2. **Default parity:** comfortable giữ geometry/content trước vòng trong1px
   với cùng dữ liệu/font, ngoại trừ nhóm Cài đặt mới. Tắt compact khôi phục
   bố cục mà không reset công việc; không tự bật theo viewport hoặc role.
3. **State và persistence:** component test cho parse/default/storage throw,
   toggle không remount/mất draft/selection, scope portal/cleanup. Playwright
   bật/tắt bằng switch thật, reload/deep link/đổi màn, storage malformed/denied.
   Account overlay khóa trang, nên đo anchor sau khi đóng sheet và layout ổn.
4. **Nghiệp vụ:** KPH nhóm ngày/chọn ngày/mở phiếu/nối25/OTHER/tag strip;
   DATE nhắc1/7 ngày và DATE→KPH đúng lô; Báo cáo kỳ/phạm vi/chọn/mẫu/lịch sử/
   xuất; form lỗi/ảnh/review và Tra hạn giữ kết quả như baseline.
5. **Responsive/accessibility:** Playwright Chromium headless ở390×844 và
   1440×1024 cho cả hai chế độ; thêm320×844,900×650,844×390, chữ150%/200% ở
   vùng đổi. DOM/interaction/screenshot có mục tiêu, không pixel snapshot rộng.
   Giữ keyboard, focus, label/switch state, selected/disabled/forced colors;
   native scrollbar kéo được, footer/dock/FAB không che control, không tràn ngang.
6. **Isolation/output:** preference không rò ra login/legacy/Admin; portal và
   loading/live nhất quán. Chart/print/PDF/Excel không nhận density spacing/font;
   so dữ liệu xuất/ảnh và màu/layout theo gate hiện hành.
7. **Tích hợp:** `VITEST_MAX_WORKERS=2 npm run verify`, build mock PWA và
   regression browser đúng affected scope trên cùng candidate. Gate mới dự
   kiến `e2e/scripts/check-store-density.cjs`; cập nhật assertion comfortable/
   compact có chủ đích, không nới gate cũ toàn cục để cho qua. Không cần chạy
   backend suite cho thay đổi trình bày thuần túy.

Các script nền cần tái sử dụng theo phần sửa: `check-store-page-kit.cjs`,
`check-store-scrollbars.cjs`, `check-kph-compact-history.cjs`,
`check-kph-create-forms.cjs`, `check-date-actions.cjs`, `check-report-fresh.cjs`,
`check-report-selection-dock.cjs`, `check-shelf-refinement.cjs` và gate
button/chrome từ FORM01 sau tích hợp. Bằng chứng mock/browser-local không
chứng minh backend, Safari, keyboard OS hoặc thiết bị thật.

## Owner xem và đóng vòng

Hai lượt review có giới hạn: (1) khu chức năng KPH/DATE/Báo cáo, (2) bản tích
hợp đầy đủ và hai chế độ. Bật Compact, thử tìm/lọc/chọn, mở form/popup, chuyển
màn/reload rồi tắt lại; so độ thoáng, độ đọc, vùng bấm và phần nội dung tăng
thêm. Owner quyết định thực tế, không tự suy acceptance từ tests.

Chỉ merge khi có quyền theo vòng nghiệm thu. Không push/deploy/Pages cutover
trong phạm vi này. Đóng vòng sau khi ghi candidate/evidence/owner decision/
giới hạn và cập nhật CURRENT_STATE/NEXT; không tự mở vòng tiếp theo.

**Bước nhỏ tiếp theo:** hoàn tất gate production và đưa owner dùng thử hai mật
độ tại4342; chưa merge main/push/deploy.
