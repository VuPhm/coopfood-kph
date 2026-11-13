# Công việc kế tiếp

## Lịch đồng bộ token Store và Admin

Đang hoàn tất bản khôi phục Fresh theo owner14/11: Home/tài khoản/tra hạn và
KPH có đủ composition đã duyệt, sidebar desktop đồng bộ, mobile giữ nền trượt.
[Target UI/UX và evidence revision4](delivery/kphon03-create-media/fresh-restore-r4.md).
Tiếp nhóm token Admin sau khi owner xem candidate; giữ hai vòng cuối toàn app.

Mốc đối chiếu là hai trang đăng nhập tại `1ea1937` và Store Fresh sau compact/polish `c7cc939` (PUB01 `41febf6`). Các số dưới đây là thứ tự thực hiện. Nhóm đầu đã bắt đầu ngay ngày 13/11. Mỗi vòng bàn giao một nhóm màn có thể thử trọn luồng.

| Thứ tự | Màn ưu tiên | Thay đổi và cách kiểm |
| --- | --- | --- |
| 1 | Chọn cửa hàng, Home Store và Tổng quan Admin | Đối chiếu các lối vào theo vai trò trước khi bỏ chữ thừa. Đồng bộ tiêu đề, nhóm tác vụ, khoảng cách và trạng thái đang chọn. Thử chọn và đổi cửa hàng, mở từng mục được cấp quyền. |
| 2 | Menu tài khoản và đổi mật khẩu ở cả hai app | Dùng cùng token cho trường nhập, nút chính/phụ và thông báo. Thử lỗi mật khẩu, trạng thái đang gửi, đóng hộp thoại và trả focus. |
| 3–4 | Tra barcode, lịch sử và chi tiết KPH | Đồng bộ ô tìm, bộ lọc, tab, dòng phiếu và trạng thái rỗng/lỗi. Kiểm FOUND/NOT_FOUND, phân trang D01 và mở ảnh từ chi tiết. |
| 5 | Tạo và xem lại phiếu TPCN/TPTS | Gom trường theo tác vụ, làm rõ trường chỉ đọc, giữ lỗi cạnh thao tác cần sửa. Thử chọn ảnh, quay lại chỉnh sửa và gửi lại sau mất kết nối. |
| 6–7 | Quyền cửa hàng, tài khoản, lifecycle và catalog Admin | Áp cùng token cho bảng, bộ chọn, nhãn trạng thái và hộp xác nhận. Kiểm bằng tài khoản chuỗi và vùng để phân biệt mục thiếu với mục giới hạn theo quyền. |
| 8–9 | Tra hạn, DATE, thông báo và báo cáo Store | Rà các màn Fresh hiện có theo luồng từ cảnh báo tới chi tiết. Kiểm ngày, trạng thái, lựa chọn và bản in trên dữ liệu thử phù hợp từng màn. |

**Nguyên tắc áp dụng.** Dùng `packages/ui/src/fresh-tokens.css` và form `SignIn` làm mẫu cho vai trò màu, chữ, focus và kích thước điều khiển. Theo hướng Store Fresh mobile và iOS, ưu tiên nhãn rõ, vùng chạm từ 44 px, chữ nhập 16 px và cuộn tự nhiên khi bàn phím mở. Bỏ slogan, nhãn viết hoa trang trí, lời giải thích lặp và CSS cũ khi đã chuyển hết nơi sử dụng. Giữ những chỉ dẫn giúp quyết định hoặc khắc phục lỗi.

**Kiểm từng vòng.** So ảnh trước/sau ở 390×844 và 1440×1024, kiểm thứ tự focus, tràn ngang và thao tác nghiệp vụ trong bảng. Ghi phần UI còn thiếu bên cạnh kết quả kỹ thuật. Sau khi nối đủ luồng KPH, thực hiện vòng test tổ hợp rồi tới vòng UI/UX cuối, gồm kiểm bàn phím và vùng an toàn trên iPhone thật.

Bản sửa [SW/trang cũ](delivery/kphon03-create-media/cache-repair-r3.md) đã có trong hai preview.

UI green header đã ghép vào KPHON03 theo owner đổi ý, merge `59fbcb8`.
Giữ toàn bộ create/session/idempotency/private media. Kiểm có mục tiêu trên
bản kết hợp và owner UI acceptance vẫn riêng với hai vòng cuối đã hẹn.
[Integration KPHON03 revision2](delivery/kphon03-create-media/integration-r2.md).
Không tự mở milestone tiếp trong lượt tích hợp.

Cập nhật14/11/2026. [CURRENT_STATE](CURRENT_STATE.md). FRESH01 và ADMIN03 CLOSED;
owner chấp nhận ADMIN03 qua chat, giữ kiểm tổ hợp rộng ở vòng cuối.
[Quyết định](delivery/admin03-store-membership/acceptance-2026-11-09.md).

## KPHON01 — nền session và effective store context

Nhánh `store-app/kphon01-effective-context`, từ checkpoint ADMIN03 accepted
`b6bd19a`, không merge các nhánh BE cũ hoặc main. [Plan](delivery/kphon01-effective-context/plan.json).
KPHON01 đã tạm đạt theo owner ngày09/11/2026 và đóng slice context.
[Quyết định](delivery/kphon01-effective-context/acceptance-2026-11-09.md).
Đã có GET /api/v1/kph/stores + Fresh login/chọn store, kiểm scope thật, không mock fallback. [Contract](product/STORE_KPH_CONTEXT_CONTRACT.md).

## KPHON02 — lookup/history chỉ đọc

Nhánh `store-app/kphon02-lookup-history`, base `0c37581`.
Đã nối lookup FOUND/NOT_FOUND/nhập tay chưa lưu và history/chi tiết theo D01.
[Evidence](delivery/kphon02-lookup-history/evidence.md),
[scenarios để owner thử](delivery/kphon02-lookup-history/handoff.md).
Owner cho tiếp ngày12/11, giữ các điểm tối ưu giao diện cho sau. KPHON02
CLOSED provisional-scoped theo [quyết định](delivery/kphon02-lookup-history/acceptance-2026-11-12.md).

## KPHON03 — tạo phiếu với ảnh private

Nhánh `store-app/kphon03-create-media`, base `4bcbb48`.
Đã nối form Fresh vào create hiện hành: context thật, original/server-stamped
private media, review-before-send, retry idempotent và history D01 sau thành công.
[Evidence](delivery/kphon03-create-media/evidence.md),
[scenarios và UI debt](delivery/kphon03-create-media/handoff.md). Chờ owner;
không suy acceptance của KPHON02 thành acceptance code mới.

Bước nhỏ tiếp theo: review theo scope; kế đó export phiếu hợp lệ, rồi hai vòng
cuối theo thứ tự bên dưới. Giữ quyết định accepted, không đổi API/media, ngày,
rule hoặc D01 load/paging ngầm. Các điểm tối ưu giao diện được giữ cho vòng UI/UX.

DATE/report/notification chưa có backend trong entry này phải hiện rõ chưa
kết nối, không render mock operational data. C02 supplier/lookup publish và
rollout vẫn outcome riêng. Kiểm authorization/integrity có mục tiêu ở mỗi slice;
không thay kiểm tổ hợp cuối bằng việc ký nhận các tổ hợp con.

## Hai vòng để sau trước nghiệm thu cuối

1. Một vòng test kỹ và tổ hợp các luồng đã nối.
2. Một vòng UI/UX sau vòng test kỹ.

Đây là yêu cầu owner ngày09/11/2026; cả hai còn pending, chưa chạy hoặc được
coi là PASS. Không tự mở hai vòng trong lượt ghi nhận tạm đạt; giữ kiểm scope/
integrity có mục tiêu khi triển khai tiếp. Tạm đạt context không phải nghiệm thu
cuối toàn app hoặc quyền rollout.

## Thứ tự phụ thuộc đề xuất

| Thứ tự | Outcome | Điều kiện/gate chính |
| --- | --- | --- |
| 1 | Admin Web theo vai trò và luồng cấp/thu hồi quyền cửa hàng | Nghiệm thu màn riêng và luồng hai phiên nêu trên |
| 2 | [KPH online trên UI Fresh](product/STORE_KPH_ONLINE_NEXT_SCOPE.md) | Effective context, D01, cross-store/cross-region, real-backend E2E và owner acceptance |
| 3 | DATE bền vững | Contract tạo/sửa lô, quantity/unit, ownership/audit, nhắc và transaction DATE→KPH |
| 4 | Thông báo và Báo cáo trên dữ liệu DATE | Nguồn dữ liệu bền vững; chốt unread/nhắc, snapshot/kỳ/quyền/retention; push chỉ khi có requirement |
| Trước rollout | A01 thiết bị thật, O01 backup/restore, O02 deployment profile | Camera/keyboard/interruption, restore thực, media storage/retention và host verification |

Thứ tự Admin trước Store là ưu tiên nghiệm thu. Có thể kiểm quyền KPH bằng backend hiện có; giao diện Fresh không phải điều kiện để kiểm luồng Admin.

C02 catalog là dependency riêng: chốt primary supplier và lookup current trước
publish. Nếu rollout cần catalog vận hành được publish qua Admin, phải khép C02
trước rollout. Không dùng dữ liệu staging làm published lookup.
Provisioning/reset/bootstrap/recovery còn lại mở bằng outcome riêng khi cần.

## Giới hạn

Không đổi business rule/API ngầm, không mang authority IndexedDB Pilot sang
online; không triển khai module tương lai, redesign rộng hoặc cutover Pages
trong slice KPH. Pages cutover phải có quyết định explicit và đường quay lại.
Technical PASS và owner acceptance là hai gate riêng.

[Lịch sử NEXT đến 27/10](https://github.com/VuPhm/coopfood-kph/blob/04f7c4a4d9001901c3973e7e6bbf5a2118932ee7/docs/NEXT.md) giữ nguyên provenance;
những mục “kế tiếp”, “pending”, quyền push và preview ở đó không phải kế hoạch active.
