# KPH theo Co.op Fresh — kế hoạch bổ sung revision 11

Ngày 11/10/2026. Trạng thái: **PLANNING — chuẩn bị hoàn tất, chưa triển khai**.

Bản r11 trên là lịch sử chuẩn bị. Owner đã yêu cầu **“làm”** cùng ngày;
revision 12 triển khai cả F1–F3 trên cùng task/worktree, ưu tiên KPH trước các
màn rollout còn lại. Kết quả hiện hành và preview nằm tại
[bàn giao KPH Fresh](kph-coop-fresh-handoff.md). Các gate nghiệm thu trước giữ
phạm vi riêng; chưa có owner acceptance cho KPH Fresh.
Yêu cầu owner: lên kế hoạch nâng giao diện KPH trong lúc đang nghiệm thu,
đặt tên để gọi lại hoặc dùng làm mặc định mới.

Tên chọn: **Co.op Fresh**, gọi ngắn **Fresh**, mã `coop-fresh-v1`.
[Visual DNA](../../product/STORE_APP_VISUAL_DNA.md) là nguồn mặc định thiết kế.
Đây là chi tiết bước KPH trong [rollout r6](visual-dna-rollout-plan.md), tiếp tục
cùng task; không mở milestone triển khai hoặc tự đổi thứ tự các màn còn lại.

## Workspace và trạng thái nghiệm thu

- Branch: `store-app/figma-mobile-implementation`.
- Worktree: `/Users/vup/Documents/coopfood-kph`; một writer `/root`.
- Checkpoint code: `91f0c70c58d982842736c62f9cd2a22fe9e9d219`; inspect local
  11/10 xác nhận clean trước lượt tài liệu này. Remote chưa fetch.
- Trong lúc lập kế hoạch, HEAD tiến tới `d43d6d7bfac930fa5fc3f4dac50945be92a6b45d`
  với sửa outside-dismiss của shared dialog. Lượt này không sửa/test lại commit
  đó; khi triển khai phải giữ bản sửa và kiểm behavior dialog theo candidate mới.
- Tái sử dụng Home/account/login accepted, shared header/modal, toolbar và các
  tối ưu KPH/loading/offline đã có. R6 là kế hoạch khung; r5 và các follow-up
  vẫn giữ phạm vi nghiệm thu/evidence riêng. Không thay preview bằng bản reskin
  trong lúc owner nghiệm thu; bản kế hoạch này không đóng gate nào của runtime.
- Chỉ sửa docs ở lượt này. Khi được yêu cầu triển khai, kiểm lại HEAD/dirty và
  feedback mới, dùng đúng checkpoint chứa các sửa nghiệm thu trước khi reskin.

## Bố cục và ngôn ngữ thị giác

Header xanh gọn, back/avatar theo `store-header.css`; mặt nội dung trắng,
panel bo 16–20px, controls 12–14px; dùng font hiện có và spacing trong DNA.
Accent hồng pastel nhận diện KPH (`#fce9f0`, icon `#f24468`); TPCN/TPTS giữ
nhãn, icon và dấu hiệu phân biệt đã có. CTA chính dùng xanh thương hiệu.
Nhãn duyệt, cảnh báo và tình trạng tiếp tục dùng token semantic kèm chữ/icon.
Không dùng hồng module làm màu lỗi hoặc đổi màu trạng thái để khớp pastel.

Mobile: header → hai lối tạo TPCN/TPTS → lịch sử với tab/count → tìm/lọc/sắp
xếp → thẻ phiếu → phân trang. Tên hàng và trạng thái dễ đọc trước, mã/ngày/
số lượng ở lớp tiếp theo; giữ checkbox tách khỏi thao tác mở phiếu. Nội dung
cuối chừa thanh dưới, nút Tra hạn lùi và safe-area. Không thêm màn tổng quan
bắt buộc trước khi tạo hoặc xem phiếu.

Desktop: giữ bảng để so sánh nhiều phiếu, tăng phân cấp bằng khoảng cách,
border nhẹ và nhóm toolbar; không phóng to thẻ mobile thành bảng dài.
Modal giữ header gradient tài khoản, body trắng và focus primitive hiện có.
Ảnh minh chứng/viewer giữ tỷ lệ và nền phù hợp; không thêm giỏ thực phẩm,
slogan hoặc sóng trang trí vào form/bảng.

## Ba lát triển khai khi owner yêu cầu

| Lát | Thay đổi cụ thể | Điều kiện hoàn thành |
| --- | --- | --- |
| KPH-F1 — danh sách | Token Fresh scoped Store App; launcher TPCN/TPTS, tab/count, tìm/lọc/sắp xếp, thẻ mobile/bảng desktop, selection và phân trang; đồng bộ khung loading | Hai viewport đọc rõ; chọn đúng ID; đổi type/filter/sort/page reset selection; tổng/count giữ đúng; không đổi vị trí avatar/navigation |
| KPH-F2 — tạo phiếu | Nhóm hàng hóa, phát hiện/xử lý và ảnh dùng panel/control Fresh; form và skeleton cùng geometry; review/submit rõ | Giữ default TPCN/TPTS, ngày phát hiện read-only, mã string/SKU–UPC riêng, lookup/recovery, 1–3 ảnh đúng thứ tự; back/focus/scroll và dữ liệu form đúng |
| KPH-F3 — chi tiết và xuất | Detail, trạng thái duyệt, nhóm ảnh, filter/export sheets cùng DNA; confirmation nêu store/type/số phiếu hợp lệ | Duyệt đúng phiếu; file chỉ chứa selection đủ điều kiện trên trang hiện tại; busy/error/retry đúng; đóng modal trả focus; giữ cấu trúc Excel |

Mỗi lát có evidence và preview riêng, tối đa hai vòng review có mục tiêu.
F1 đặt nền cho F2/F3. Lượt chuẩn bị hiện tại không dispatch agent; rollout r6
của Tra cứu/DATE/Tra hạn vẫn giữ nguyên. Nếu owner chọn làm KPH trước, thực hiện
các token Fresh tối thiểu ngay trong F1; không buộc chờ reskin các module khác.

## Phạm vi file và ownership

Runtime dự kiến: `apps/store-pwa/src/store-kph-workspace.tsx`,
`store-kph-list.tsx`, `store-kph-loading.tsx`, `store-kph-form-assets.ts`,
`create-record-dialog.tsx` và test tương ứng. Integration writer sở hữu
`store-app.css`, token Fresh scoped, các callsite trong `store-app.tsx`/
`store-loading-frame.tsx` khi cần, cùng e2e scripts và docs.
Form dùng chung chỉ đổi presentation Store App, kiểm regression online/Pilot.
Không chồng thêm các block override lặp; gom rule và kiểm computed style.

Tái sử dụng Button/Input/Dialog/CalendarInput và icon đã kiểm; giữ default của
`packages/ui`, không đổi global token, root config/lockfile/dependency hoặc
`store-header.css` để căn riêng KPH. Nếu phát sinh shared primitive thực sự cần
đổi, ghi scope consumer và giao integration owner trước khi sửa.
Không đổi API, backend, migration, authorization, model state, data authority,
Excel format, Admin/Pilot, accepted Figma frames hay Pages.

## Bất biến nghiệp vụ và hiệu năng

[Contract index](../../product/STORE_APP_CONTRACTS.md),
[DOMAIN_RULES](../../product/DOMAIN_RULES.md) và
[D01](../../product/HISTORY_PAGING_CONTRACT.md) quyết định semantics.
Lookup phân biệt FOUND/NOT_FOUND/CATALOG_UNAVAILABLE; giữ barcode khi nhập tay.
Online lọc/sort trước phân trang, count từ response; không tự thêm search API
hoặc lấy bộ lọc mock làm bằng chứng backend. Backend quyết định scope, duyệt/
xuất; UI không tạo quyền và không thêm xóa/vô hiệu hóa phiếu.
Ngày `dd/mm/yyyy`, timezone `Asia/Ho_Chi_Minh`, private original/stamped và
snapshot giữ nguyên. Không thay công thức hạn lùi.

Giữ entry/workspace/form/Excel lazy, prefetch đúng scope và chỉ mount một
layout danh sách. Mỗi đổi geometry phải cập nhật skeleton cùng lát để giữ
scroll/focus và tránh nhảy nội dung. Không thêm blur backdrop toàn màn hoặc
animation lặp. Offline chỉ theo capability hiện có, không thêm persistence/
outbox. Lab timing chỉ so trong cùng build/thiết bị/CPU; không suy ra field INP.

## Kiểm chứng và nghiệm thu

Lượt tài liệu: `npm run check:docs`, JSON parse, kiểm link local và
`git diff --check`; không chạy test UI vì runtime chưa đổi.

Khi triển khai: test feature/session/form/Excel liên quan, `npm run check`,
mock/online build; tích hợp cuối `npm run verify`. Playwright headless mặc định
390×844 và 1440×1024, thêm 320px cho tên dài/form; DOM + interaction + screenshot
xem trực quan, không mở snapshot pixel rộng. Test/focus/touch theo contract repo
(vùng chạm 44px), không tràn ngang, reduced motion, empty/error/busy/disabled.

Dùng lại gate `check-store-qa-repairs.cjs`, `check-kph-calendar-icons.cjs`,
`check-store-header.cjs`, `check-modal-ui.cjs`, `check-mobile-toolbar.cjs` khi
có callsite bị ảnh hưởng; `check-kph-lazy.cjs`, `check-kph-loading.cjs`,
`check-progressive-layout.cjs`, `check-kph-offline.cjs` cho loading/cache.
Đối chiếu screenshot mới và update assertion chỉ khi expectation đã được review.
Không bỏ test để reskin pass. Home/account/login có regression có mục tiêu.

Owner thử: mở cả TPCN/TPTS → tạo/quét hoặc nhập tay → thêm ảnh → xem lại/gửi;
mở chi tiết → duyệt → chọn một phiếu → xuất đúng một phiếu đủ điều kiện;
đổi filter/page để thấy selection reset; thử mạng chậm và offline đã cài cache.
Ghi visual acceptance KPH riêng với SHA/evidence. Preview mock dùng dữ liệu tổng
hợp trong phiên, reload reset; không chứng minh real-backend/thiết bị thật.
Nếu scope triển khai có online wiring, cần browser backend thật và deny tests
cross-store/cross-region trước khi nhận acceptance online.

Không có node Figma mới được giao trong yêu cầu này; reference là DNA/Home đang
chạy. Nếu slice được giao theo Figma, đọc đúng structured context và screenshot
qua MCP trước sửa; sau Playwright chỉ đưa proposal vào candidate riêng.

## Bước nhỏ tiếp theo

Tiếp tục nghiệm thu bản checkpoint hiện tại. Khi bắt đầu reskin, áp dụng feedback
nghiệm thu đã xác nhận rồi làm **KPH-F1**. Rủi ro chính: CSS/form dùng chung có
thể tác động Home/Pilot, skeleton lệch khi đổi geometry, CTA bị thanh dưới che;
đã có gate cụ thể cho từng điểm. KPH Fresh chưa có implementation hoặc acceptance;
không tự commit/merge/push/deploy từ yêu cầu lập kế hoạch.

## Phản hồi màu r13 — 11/10/2026

Owner chưa chấp nhận màu r12: đỏ dùng nhiều, CTA chìm, cần đo contrast và
cam/xanh cho hai launcher. Thực hiện trong cùng task/writer (review round 2):
TPCN cam đặc, TPTS xanh đặc; chip biện pháp trung tính, condition cam nhẹ,
đỏ dành cho lỗi/hết HSD; selected xanh với dấu viền/chữ đậm. Đo runtime
text/control/selection/focus, giữ semantics và shared token. Bảng màu r13 trong
Visual DNA ưu tiên hơn chỉ dẫn giữ màu/pastel của kế hoạch r11/r12.
Bằng chứng và giới hạn: [bàn giao sửa màu](kph-coop-fresh-colors.md).
