# FRESH01 — một giao diện gọn, màu rõ và khối nổi

Ngày26/10/2026. Theo yêu cầu owner: bỏ công tắc và giao diện cũ; tái dựng có
kế hoạch, tăng trọng số màu/solid, viền mềm/độ nổi, khoảng hở; giảm thành phần
nhỏ và giữ cấu trúc trượt. **Đã triển khai và kiểm tra tích hợp; technical PASS, owner acceptance pending.** Không cần một lượt xin phép nữa để triển khai phạm vi đã yêu cầu.

Nhánh `store-app/fresh01-solid-compact`, worktree
`/Users/vup/Documents/coopfood-kph/.local/worktrees/fresh01-solid-compact`.
Nguồn kế thừa `c5a440b`; candidate mới1c5182c tại4362, preview4360 giữ nguyên.
Không dùng main cũ làm điểm xuất phát vì sẽ mất DATE/KPH vừa làm. Không xem
hướng list được chấp nhận là nghiệm thu toàn bộ candidate COMPACT03.

## Đích đến

Một giao diện Store Fresh duy nhất: gọn ở cấp điều khiển/dữ kiện, có khoảng
thở giữa nhóm; màu nhấn rõ, khối có cạnh mềm và độ nổi có thứ bậc. Không có
comfortable/compact preference, không localStorage mode, không nhánh UI cũ.
Print vẫn là định dạng đầu ra riêng; không coi print là một chế độ giao diện.

Khuôn sản phẩm giữ một đường đi: header/hero → mặt trắng trượt → tabs/context
→ toolbar → list → sheet chi tiết → form khi cần. Mẫu giống nhau dùng cùng
component/role; nghiệp vụ DATE/KPH/Báo cáo/Thông báo/Tra hạn không bị ép giống
nhau ở dữ liệu hoặc bước xử lý. [Đặc tả token/khuôn](../../product/STORE_APP_SOLID_COMPACT.md).

## Thứ tự thực hiện

| Bước | Việc làm cụ thể | Điều kiện hoàn tất |
| --- | --- | --- |
| 0 — kế hoạch, đã làm | Rà source, ghi token/role, map loại bỏ mã cũ, scope và gate | Có đặc tả + file map + nhánh/worktree riêng; runtime chưa đổi |
| 1 — một chế độ | Bỏ setting/provider/context/key/document flag; chọn Compact JSX làm cấu trúc mặc định; đưa screen CSS về owner chung; xóa comfortable branch và stylesheet hết dùng | Reload với key cũ compact/comfortable/sai/missing đều cùng UI, không switch, không lỗi storage; loading không nháy; print đầy đủ; luồng giữ nguyên |
| 2 — dựng khuôn | Áp palette, size, spacing, edge/elevation trong các owner token hiện có; làm trọn DATE/KPH từ header đến filter/detail/form/loading/empty/error | Hai tính năng làm mẫu có cùng vai trò và bốn mức nền; tag2 còn bao; chữ lớn, focus, pressed/selected và responsive đạt |
| 3 — áp xuyên app | Home, Thông báo, Báo cáo/catalog/template/history, Tra hạn/history, tài khoản và login dùng bộ khuôn; giảm nhãn/icon trước rồi xét nút phụ | Không còn màu/nền/khối/size tự phát theo feature; giữ đặc thù/đầu ra và thông tin nghiệp vụ |
| 4 — dọn, kiểm, bàn giao | Xóa selector/token/import/component chết, cập nhật gate cũ theo một-mode; build mock frozen và review tích hợp tối đa2lượt | Technical gates đạt, preview và kịch bản nghiệm thu rõ; owner acceptance ghi riêng |

Triển khai1→2→3→4 trong cùng milestone, một writer. Mỗi bước có checkpoint
nhỏ, không mở thêm audit hoặc feature ngoài phạm vi. Bước2 làm mẫu kỹ thuật
để tránh nhân sai khuôn; không phải một flow bắt owner duyệt lại mọi component.

## Quyết định thiết kế

- **60–30–10 là trọng số thị giác**, không phép đo phần trăm pixel: trắng/
  trung tính cho nội dung, xanh cho cấu trúc/selection/action, cam là nhấn nhỏ.
  Dùng bốn mức nền chung, không tặng mỗi chức năng một pastel riêng.
- **Solid có chủ đích:** selected/primary dùng màu đặc; icon chức năng có màu
  nhấn trên trắng. Chữ chính đậm rõ. Trạng thái vẫn chữ+icon+màu đúng nghĩa;
  đỏ/lỗi và các màu nghiệp vụ không bị gộp vào xanh/cam trang trí.
- **Nổi theo lớp:** nền phẳng; card mép mềm/bóng vừa; sheet cao hơn. Không
  lồng card trong card hoặc thêm fill để phân từng dòng. Field hơi lõm/matte,
  không có bóng ngoài giống nút. Pressed đổi vật liệu tại chỗ, không nhảy layout.
- **Nhỏ và thoáng:** giảm diện tích mặt icon/badge/metadata; tăng khoảng giữa
  nhóm và các target lân cận. Giữ cả hàng list dễ bấm. Vùng bấm phụ32–36px chỉ
  áp cho thao tác độc lập/rõ ràng, có khoảng hở; thao tác chính/scan/đóng/submit
  giữ44px. Không đặt hitbox vô hình chồng nhau để đạt cỡ danh nghĩa.
- **Trượt xuyên suốt:** tái dùng StoreAppFrame/PageLayout/StickyTabs/StoreSheet/
  ChoiceSheet/Dialog; giữ scroll owner, sticky/footer, khóa cuộn và trả focus.
  Không tạo shell mới hoặc thay modal primitive.

## Phạm vi và quyền thực hiện

Store Fresh mock + login dùng chung frame; online/Pilot/Admin, packages/ui,
root config/lockfile, backend/auth/API/schema và thuật toán/date labels/timeline
không nằm trong lượt tái dựng. Nếu thật sự cần sửa primitive dùng chung, ghi
lý do và kiểm consumer trước; không mặc định tăng scope. Không thêm dependency.

Giữ flow đã xác nhận: exact lot và unknown kind; reminder1/7ngày; DATE→KPH,
lookup NOT_FOUND không đoán; KPH chọn/nhóm/nối25/ảnh; report Excel/PDF/history;
ngày/timezone/%HSD/phase; navigation và focus/scroll. Không merge/push/deploy;
Cloudflare vẫnr4. Owner đã yêu cầu triển khai local, không thêm bước xin phép
thông thường. Bản kế hoạch không tự cho phép publication hoặc nghiệm thu UI.

## Kiểm chứng và nghiệm thu

1. Static inventory: không còn setting, storage key, density context/flag hoặc
   nhánh screen comfortable; loại gate chỉ còn mục đích bật/tắt. Không dùng
   constant compact để giữ nguyên hai bộ JSX chết hoặc CSS cũ không dùng.
2. Unit/interaction: state, scope, ngày, nhắc, form validation/idempotent save,
   report/history, navigation và loading. Test mode-switch cũ được thay bằng
   một-mode, stale-key independence, print và state preservation thực tế.
3. Playwright headless390×844/1440×1024; bổ sung320/900/landscape, text150/200,
   keyboard/focus, hit-target/spacing, overflow, native scrollbar/drag, sheets.
   Kiểm actual computed color/edge/shadow theo role và screenshot có mục tiêu,
   không snapshot pixel rộng. Screenshot chỉ là một phần bằng chứng.
4. Chạy `VITEST_MAX_WORKERS=2 npm run verify`, mock build và các browser workflow
   còn phù hợp. Thay assertion geometry chỉ khi role/size mới đã ghi explicit;
   không xóa nghiệp vụ hoặc bỏ gate để làm xanh.
5. Owner xem một-mode duy nhất trên các màn và kịch bản. Technical PASS không
   tự là nghiệm thu; dừng sau vòng bàn giao có kết quả, không audit lặp vô hạn.

## Điểm cần kiểm trong triển khai

- CSS hiện có129density selectors/5files và10runtime consumers: xóa song song
  dễ ảnh hưởng portal/loading/print. [Map cụ thể](assessment.md).
- Shadow/edge mạnh hơn dễ thành form lồi; material role tách field/action/card.
- Target phụ nhỏ có thể khó bấm trên thiết bị thật; desktop/mobile Playwright
  đo hình học không thay kiểm một tay trên máy thật. Không tuyên bố đã đạt.
- Tỷ lệ màu là quyết định thiết kế, chưa có owner nghiệm thu palette candidate.

Bước1–4 đã hoàn tất trong phạm vi; review2/2,347tests và browser gates đạt.
[Kết quả và giới hạn](technical.md). Bước tiếp owner xem candidate4362; không
mở thêm audit/rollout hoặc suy acceptance khi chưa có phản hồi.
