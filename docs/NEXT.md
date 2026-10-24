# Công việc kế tiếp

**COMPACT01 revision3 — CLOSED, chốt tạm24/10/2026:** owner xác nhận
“tạm, đến đây chốt được. cân nhắc tiếp cho các item list” sau khi xem preview4344.
Chốt phạm vi token size và cấu trúc Compact hiện tại, runtime`ca543e6`;
không coi đây là nghiệm thu thiết kế item mới hoặc FORM01/main integration.
Technical346tests và production browser đã PASS;
[quyết định/giới hạn](delivery/compact01-interface-density/acceptance-revision3.md).
Main vẫn`f77034d`, chưa merge/push/deploy. Đã rà source và ghi
[đề xuất item list](delivery/compact01-interface-density/list-items-next.md):
KPH trước, sau đó Báo cáo/DATE/Thông báo; mới là đánh giá, chưa đổi runtime.
Bước nhỏ tiếp theo: một candidate item KPH Compact có phân cấp nhãn rõ hơn,
giữ đủ thông tin/chọn/nhóm ngày; chờ yêu cầu triển khai vòng riêng.

**COMPACT01 revision2 — lịch sử24/10/2026:** thêm Chế độ gọn tại Tài khoản → Cài đặt
→ Giao diện; mặc định tắt, nhớ theo thiết bị. Gọn chủ yếu search/CTA/bộ lọc/
settings/form, item chỉ giảm đệm nhẹ; giữ state và mật độ mặc định. Nhánh riêng
từ task base0a25730 gồm đúng FORM01d4f9d17 + header816; main vẫnf77034d, không
suy acceptance FORM01. Preview <http://127.0.0.1:4342/#kph>.
[Scope/kiểm tra/giới hạn](delivery/compact01-interface-density/technical.md),
[quy tắc](product/STORE_APP_DENSITY.md). Technical342tests + production browser hai mật độ/5viewport, frame7màn/7viewport,
native scrollbar và report dock đạt; owner xem cả hai chế độ. Chưa merge/
push/deploy. Bước tiếp: owner dùng thử và quyết định nghiệm thu Compact.

**FORM01 revision 4 — candidate24/10/2026:** owner yêu cầu đủ mọi nút, đặc biệt
nút xanh; làm tổng thể token nút và mép khối trượt/sidebar/menu bar. Dùng một
role/state matrix cho primary/secondary/ghost/danger/selected/disabled và native
command; primary có gradient/mép sáng/bóng thấp, pressed tại chỗ. Chrome dùng
edge/elevation token, giữ canvas trắng và header816b4e3. Shared Button chỉ thêm
metadata cho binding Store-local; không đổi global UI palette/API.
[Token/triết lý](product/STORE_APP_SURFACE_STYLE.md),
[scope/evidence](delivery/form01-fresh-soft/technical.md).
Technical PASS: 334 tests và Playwright nút/chrome/native scrollbar.
Preview <http://127.0.0.1:4306/#kph>; owner xem bản mới, chưa merge main/push/deploy.

**FORM01 revision 3 — candidate24/10/2026:** owner chấp nhận hướng form bằng
“ổn, làm tiếp”, yêu cầu mở rộng và ghi triết lý. Đã tích hợp đúng header
`816b4e3` vào nhánh task, base hợp nhất `568c8cd`; không đổi main. Mở rộng
**Co.op Fresh Soft** cho nút phụ/toolbar, filter choices, nhóm thông tin, picker/
popup và divider: nền tạo khối, mép nghỉ nhẹ, selected/focus/error rõ.
[Triết lý và role/state recipe](product/STORE_APP_SURFACE_STYLE.md),
[scope/acceptance/checks](delivery/form01-fresh-soft/technical.md).
Preview <http://127.0.0.1:4304/#home>. Chưa merge main/push/deploy; owner xem
các màn và trạng thái mới. Các candidate cũ dưới đây là lịch sử.

**FORM01 — candidate revision 2, 24/10/2026:** theo owner làm mềm form;
feedback viền còn dày, tham khảo item Home và iOS 27.
Dùng tên **Co.op Fresh Soft** cho `coop-fresh-soft-v1`; input/date/select/textarea
fill nhẹ/radius 16/mép nghỉ 6%; label/content nhận diện, focus/error/selection
rõ; Số lượng có placeholder khi trống. Giữ semantic/check, nhóm/
footer mềm hơn. Giữ rule/validation/readonly/disabled/focus và kích thước control;
không đổi packages/ui, API, header/nav/list/chart. Nhánh `store-app/form01-fresh-soft`
từ `f77034d`; preview <http://127.0.0.1:4302/#kph>. Chưa merge/push/deploy;
[phạm vi, kiểm tra và giới hạn](delivery/form01-fresh-soft/technical.md).
Bước tiếp theo: owner xem KPH form/bộ lọc, Báo cáo, Tra hạn và đăng nhập.

**HEADER03 — candidate24/10/2026:** Home bỏ copy “Trang chủ / Cửa hàng
hiện tại” khỏi hình, giữ heading accessible/lời chào. Back mobile chỉ mũi tên,
không nền/viền; desktop dùng sidebar + ancestor `Trang chủ › màn`, mẫu báo cáo
thêm cấp Báo cáo. Giữ72px/44px/focus, palette/header và nghiệp vụ. Technical334tests/build/PWA,
7màn×7viewport, context/contrast/chart parity PASS. Preview
<http://127.0.0.1:4331/#home>; [scope và evidence](delivery/header03-context-nav/technical.md).
Nhánh `store-app/header03-context-nav` từ mainf77034d; chưa merge/push/deploy.
Bước tiếp: owner xem Home/mobile arrow/desktop đường dẫn tại preview4331.
Các pending bên dưới là lịch sử.

**UI02 + RPT02 — CLOSED,23/10/2026:** owner “merge với `0757b6d`” cho bản
scrollbar đang xem tại4295 và report checkpoint0757b6d. Merge main local
`e5628ab` gồm scrollbar`e2c2ab5` + report đúng0757b6d; source hợp nhất không sửa
thêm. Verify333tests/contracts/API/types/build/PWA, native scrollbars7màn×5
viewport, report fresh/header/selection-dock/library/Excel/PDF và soft-material
chart/print parity PASS. Preview main <http://127.0.0.1:4296/#kph> và reports.
Chưa push/deploy; mock/browser-local và thiết bị thật giữ giới hạn riêng. Các
pending UI02/RPT02 bên dưới là lịch sử trước acceptance. Đóng vòng, chờ yêu cầu
mới. [SHA, quyết định và kiểm tra](delivery/reports02-soft-surfaces/merge-2026-10-23.md).

**UI02 scrollbar — candidate23/10/2026:** rà cả7màn và popup theo owner “rà
soát hết”. Desktop dùng native scrollbar mảnh; popup cuộn trong body, giữ header/
close/bo góc, form và tiện ích có bar kéo được. Choice sheet chỉ cuộn results;
khóa/mở cuộn giữ layout và nút nổi. Mobile tags giữ bar ẩn. Build/Playwright với
scrollbars thật ở390×844/1440×1024/1280×720/900×650/1440×500, high contrast,
KPH/chrome regression đạt. Nhánh `store-app/ui02-scrollbars` từ `3b0da6c`, chưa
merge/push/deploy. Preview <http://127.0.0.1:4295/#kph>;
[phạm vi, files, lệnh kiểm và giới hạn](delivery/ui02-scrollbars.md).
Bước tiếp: owner xem thanh cuộn trang và các popup trên desktop thực.

**RPT02 — candidate chờ nghiệm thu, 23/10/2026:** áp Co.op Fresh khối mềm,
viền nhẹ cho menu mẫu, composer, danh mục/lịch sử và popup Báo cáo. Pastel theo
Home, holder trắng, summary xám nhẹ; giữ header xanh đã duyệt và màu biểu đồ.
Dock inline tránh tiện ích nổi che nút. Technical333tests/contracts/API/types/
build/PWA; browser390/1440/320, chữ150%, mẫu/kỳ/selection/history/Excel/PDF,
chart/print parity và6màn khác giữ nguyên. Preview <http://127.0.0.1:4290/#reports>.
[Scope, lệnh kiểm, evidence/giới hạn](delivery/reports02-soft-surfaces/technical.md).
Nhánh `store-app/reports02-soft-surfaces` từ main3b0da6c; chưa merge/push/deploy.
Bước tiếp theo: owner xem menu → Tổng hợp → chi tiết/tạo → lịch sử trước duyệt.
Các trạng thái pending bên dưới là lịch sử.

**DATE03 + HEADER02 — CLOSED, 23/10/2026:** owner “cho phép merge cái này
và `4450982`”. Đã merge main local HEADER02 đúng4450982 và DATE/Thông báo
checkpoint721e1ca; source tích hợp tại `23f6b19`. Verify333tests/contracts/API/
types/build/PWA, browser DATE/Thông báo/KPH và chrome7màn ở390/1440/320 PASS;
chart parity giữ nguyên. Preview main <http://127.0.0.1:4284/#home>.
[Nghiệm thu, SHA, lệnh kiểm và giới hạn](delivery/header02-green-layer/merge-2026-10-23.md).
Chưa push/deploy, Pages không đổi. Memory-only/thiết bị thật vẫn là giới hạn.
Các pending bên dưới là lịch sử. Đóng vòng, chờ yêu cầu mới.

**HEADER02 — candidate chờ nghiệm thu, 23/10/2026:** nền xanh và AppHeader
đồng bộ7màn, báo cáo con và header popup; gradient `#006b4b → #007a52`,
control căn giữa/viền nhẹ, đệm8px trước lớp trắng. Giữ thanh72px, nội dung
trắng, màu biểu đồ/trạng thái và workflow. Technical PASS327tests/contracts/
API/types/build/PWA; production browser7màn×7viewport, chrome/contrast/print/
chart parity và DATE→KPH/Tra hạn. Preview <http://127.0.0.1:4283/#home>.
[Phạm vi, lệnh kiểm và giới hạn](delivery/header02-green-layer/technical.md).
Nhánh `store-app/header02-green-layer` từ main630ec7b; chưa merge/push/deploy.
Bước tiếp theo: owner xem nền/header ở Home, DATE, KPH và popup trước khi duyệt.
Các trạng thái pending bên dưới là lịch sử.

**DATE03 follow-up / Thông báo DATE — candidate23/10:** owner yêu cầu bỏ Đã
xử lý vì thuộc KPH; DATE chỉ Mở/Đã ghi nhận và resolved rời list. Thông báo có
nhóm DATE theo phase/ngày báo lại, thu/mở và mở đúng lô. Verify333tests/build,
browser390/1440/320 và navigation5viewport PASS; chờ owner xem tại
<http://127.0.0.1:4281/#notifications>;
[scope, quyết định, evidence](delivery/date03-notifications.md),
[thiết kế](product/STORE_NOTIFICATIONS_DESIGN.md). Tiếp cùng worktree/base630ec7b;
chưa commit/merge/push/deploy, memory-only.

**DATE03 — candidate23/10/2026 từ `630ec7b`:** danh sách gọn, phần trăm24px
là chính, NSX/HSD chữ phụ; item trắng, chỉ chọn lô đổi mint/viền xanh và có
aria-state. Rule/chi tiết/nhắc1/7ngày/DATE→KPH giữ nguyên. Verify327tests/build
đạt; preview <http://127.0.0.1:4281/#date>, [phạm vi/checks](delivery/date03-compact-list.md).
Nhánh/worktree riêng, chờ owner xem; chưa commit/merge/push/deploy.

**DATE02 / SHELF02 — CLOSED, 23/10/2026:** owner “cho phép merge” candidate
DATE02 revision3 b50ec3f. Đã merge main local tại `d28b9c4`, source đúng bản đã
duyệt: chi tiết trắng/xám, % HSD, báo lại1ngày/1tuần, Xử lý → KPH đúng lô; Tra
hạn efe6f98 đã được duyệt đi cùng baseline. Màu biểu đồ giữ nguyên. Kiểm trực
tiếp main PASS327tests/contracts/API/types/build/PWA, browser DATE→KPH và
TPCN/TPTS/Tra hạn ở390/1440/320. Preview main <http://127.0.0.1:4279/#date>.
[Hồ sơ nghiệm thu/tích hợp](delivery/date02-soft-detail/merge-2026-10-23.md).
Cây main sạch sau ledger; chưa push/deploy. Giới hạn memory-only/thiết bị thật
vẫn giữ. Các dòng pending bên dưới là lịch sử. Đóng vòng, chờ yêu cầu mới.

**DATE02 revision3 — nhắc lại và tạo KPH, candidate23/10/2026:** Ghi nhận cho
chọn1ngày/1tuần và xác nhận ngày báo lại; đến hẹn mở lại Cảnh báo/Thông báo trong
phiên. Xử lý mở form KPH tương ứng, điền SKU/lô và dữ liệu đã biết; chỉ Gửi phiếu
thành công mới resolved, phiếu PENDING cùng Store session. Hủy/lỗi/SKU khác giữ
lô; loại hàng chưa biết phải chọn. Giữ nền trắng/xám và màu biểu đồ r2.
Technical327tests/build + browser transaction/visual/KPH gốc; preview
<http://127.0.0.1:4278/#date>, [evidence/giới hạn](delivery/date02-soft-detail/technical.md).
Vẫn prototype memory-only, chưa backend/push khi đóng app; chưa merge/push/deploy.
Bước tiếp theo: owner thử Ghi nhận và Xử lý → form KPH tại preview4278.

**DATE02 — candidate revision2 chờ nghiệm thu, 23/10/2026:** đã tiếp tục DATE
sau Tra hạn được owner xác nhận “đạt”. Chi tiết lô dùng holder trắng/viền mảnh,
nền trắng/xám nhẹ thống nhất theo feedback màu lộn xộn; biểu đồ giữ nguyên màu.
List thay số ngày bằng % HSD còn lại có màu theo phase; thiếu NSX/ngày lỗi không
suy %. Technical PASS313 tests/contracts/types/build/PWA, browser390/1440/320,
chữ150%, màn thấp và chart color parity. Preview <http://127.0.0.1:4278/#date>.
[Phạm vi, quy tắc và evidence](delivery/date02-soft-detail/technical.md).
Nhánh riêng từ SHELF02 snapshot06ff18b; main giữ467d8d6, chưa merge/push/deploy.
Bước tiếp theo: owner xem nền và chi tiết item tại đúng preview4278.

**SHELF02 — candidate chờ nghiệm thu, 22/10/2026:** Tra hạn màn chính/tiện ích
nổi áp khối mềm/viền nhẹ Home; mobile gọn70px, kết quả lên46px. Error liên kết
trường/focus rõ; bỏ viền glow động, giữ tính350ms/picker/rules và lịch sử20mục.
Technical PASS301 tests/contracts/types/build/PWA, browser390/1440/320, contrast/
chữ150%/motion/history; lab cuộn20mục CPU4× không frame>34ms. Preview
<http://127.0.0.1:4276/#shelf>; [phạm vi, evidence và giới hạn](delivery/shelf02-soft-utility/technical.md).
KPH03 đã merge/đóng vòng; SHELF02 ở nhánh riêng từ main467d8d6, chưa merge/push/deploy.
Bước tiếp theo: owner xem màn chính và tiện ích nổi, giữ nghiệp vụ ngày hiện có.

**KPH03 — owner đã duyệt và cho phép merge22/10/2026:** phản hồi trực tiếp
“merge rồi tối ưu tiếp toàn diện cho tra hạn lùi hàng” áp dụng candidate hai
form `a78e368`. Đã tích hợp bản khối mềm/bốn nhóm, error linkage/ảnh/focus/review;
source không đổi khi merge. Kiểm sau tích hợp và hồ sơ nghiệm thu tại
[kph03-create-forms](delivery/kph03-create-forms/technical.md). Chưa push/deploy.
Yêu cầu Tra hạn là round kế tiếp, giữ scope riêng.

**UI03 — hệ thống hoá phong cách22/10/2026:**
[Co.op Fresh — khối mềm, viền nhẹ](product/STORE_APP_SURFACE_STYLE.md)
(`coop-fresh-soft-v1`) lấy Home trên main9089f47 làm reference: pastel viền
trong suốt1px + sheen/bóng thấp, holder trắng viền `#dfe5e9`, glass có budget.
Đã đối chiếu computed styles/screenshot390/1440; chỉ tài liệu, không đổi UI.
Round sau từ main mới nhất, owner chỉ định phần cần áp; giữ contract và scope,
không tự rollout. UI DNA/Visual DNA/catalog/frame đã trỏ tới cùng hướng dẫn.

**KPH02 — CLOSED22/10/2026:** owner chấp nhận revision5 bằng “có thể merge”.
Đã merge main local tại`146e2e1`, source đúng checkpoint`48438cf`: nhóm ngày mặc
định bật, checkbox ngày/chạm thu mở riêng trong Chọn, ngày flat mobile căn trái;
item/tag/click hàng/lọc nhanh/Hiển thị thêm và nền trắng đã duyệt cùng bản này.
Gate trực tiếp main`VITEST_MAX_WORKERS=2 npm run verify` PASS294 tests/contracts/
API/types/build; mock PWA và Playwright390/1440/320,5màn surface, skeleton/live
PASS. Preview <http://127.0.0.1:4263/#kph> chạy từ main. Chưa push/deploy;
Store Fresh memory-only, API/thiết bị thật là giới hạn riêng. Các pending KPH
bên dưới là lịch sử trước nghiệm thu. Đóng task, chờ yêu cầu mới.
[Hồ sơ tích hợp/kiểm tra](delivery/kph02-merge-2026-10-22.md).

**KPH02 revision5 — candidate22/10/2026:** mặc định bật Nhóm theo ngày; reset
lọc trả về bật. Trong Chọn, checkbox ngày có vùng44×44px riêng; phần ngày/count/
chevron vẫn thu/mở, giữ selection và collapse khi vào/thoát Chọn. Tắt nhóm: ngày
mobile nằm cùng cụm SKU/số lượng căn trái. Nền trắng revision4 và UX click hàng/
OTHER/tag scroll/lọc nhanh/nối25 giữ nguyên. Cùng task từ `982c04c`, online/API
không đổi. Xem <http://127.0.0.1:4262/#kph>; chưa commit/merge/push/deploy,
owner pending. [Bàn giao/phạm vi/checks](delivery/kph02-compact-history.md).

**UI01 soft glass/mobile/performance — CLOSED 22/10/2026:** owner xác nhận
“rất ổn, cho phép merge”. Đã tích hợp vào main local tại `982c04c`; source
đúng candidate `d4d254c` đã duyệt. Gate tích hợp `VITEST_MAX_WORKERS=2 npm run
verify` PASS 286 tests/contracts/API/types/build. Mock PWA build và Playwright
trực tiếp main390/1440, report loading/retry/deep-link/offline PASS. Preview
<http://127.0.0.1:4251/#home> chạy từ main. Chưa push/deploy; các mục pending
UI01 bên dưới là lịch sử trước acceptance. Đóng vòng, chờ yêu cầu tiếp theo.
[Hồ sơ nghiệm thu/tích hợp](delivery/ui01-mobile-perf/merge-2026-10-22.md).

**UI01 mobile/performance — AWAITING_ACCEPTANCE, 22/10/2026:** mở
<http://127.0.0.1:4247/#home>; xem Home gọn, viền phụ nhẹ theo Home, thử
KPH/DATE đổi tab/tìm/chọn/lọc và Báo cáo lần đầu. Cỡ chữ/record/touch giữ
nguyên; JS nạp khi mở Home giảm19,6%, popup/scroll/offline technical đạt. Chờ owner
xem trên thiết bị thật; không tự mở thêm round hoặc merge/deploy.
[Phạm vi và evidence](delivery/ui01-mobile-perf/technical.md).

**UI01 — xem soft depth mới trên baseline `cbf750a`, 22/10/2026:** mở
<http://127.0.0.1:4247/#home>, kiểm capsule ba ô và utility/dock trong Báo cáo.
Giữ page kit/Home gọn; thêm gradient/shadow mềm theo feedback thô/phẳng.
Candidate vật liệu chờ owner xem trên máy
thật. Compact phần phụ mobile để round kế tiếp, chưa mở.
[Bàn giao và kiểm chứng](delivery/ui01-light-glass.md).

**Page kit/Home/navigation đã tích hợp — CLOSED 22/10/2026:** theo owner
“cho phép merge”, checkpoint `af425bb` merge vào main local tại `cbf750a`.
Kiểm trực tiếp main: `VITEST_MAX_WORKERS=2 npm run verify` PASS 286 tests/
contracts/API/types/build; browser 7 màn ×7 viewport và report regression
390/1440/320 PASS. Preview4232 chạy từ main. Chưa push/deploy; các mục pending
bên dưới là lịch sử trước acceptance. Không tự mở scope mới.
[Hồ sơ nghiệm thu/tích hợp](delivery/header-style-rollout/merge-2026-10-22.md).

**Owner cho phép merge page kit — 22/10/2026:** phản hồi trực tiếp “cho phép
merge” áp dụng bản khung xuyên suốt và Home đã bỏ trang trí. Chốt scope UI
hiện tại; các dòng pending phía dưới là lịch sử trước quyết định này.
[Bàn giao tích hợp](delivery/header-style-rollout/merge-2026-10-22.md).

**Home gọn — 22/10/2026:** theo yêu cầu owner, bỏ hình giỏ hàng, họa tiết lá/
sóng và slogan trang trí. Gỡ CSS/đệm330px dành cho artwork, chỉ giữ khoảng
chừa navigation/Tra hạn nổi; các nút tính năng và khung chung giữ nguyên.

**Khung trang xuyên suốt — 22/10/2026:** owner chưa đạt các bản trước.
Thay toàn bộ khung rộng/gọn riêng bằng page kit chung: AppHeader72px, slot
xanh, lớp trắng overlap12/góc24/gutter chung. Home/Tra hạn/DATE/KPH/reports/
Thông báo/login dùng cùng kit; login chuyển form một cột trong lớp trắng.
Nghiệp vụ và dữ liệu giữ nguyên. [Quy tắc](product/STORE_APP_FRAME.md),
[bàn giao](delivery/header-style-rollout/page-kit-2026-10-22.md).
Preview <http://127.0.0.1:4232/#home>, owner visual pending.

**Sửa khung desktop — follow-up 21/10/2026:** owner chưa đạt bản global trước.
Đã tái hiện KPH bị max-width1440px ở viewport1920, gây lệch116px/dải xanh hai
bên. Bỏ giới hạn ngoài; thêm parent canvas chung và hàng grid AppHeader chứa
Back/title/account, không absolute avatar. Root neutral, Home/login vẫn rộng.
Build/233 tests/browser technical PASS, thêm 1920/2560 vào header gate;
[bàn giao/ảnh trước-sau](delivery/header-style-rollout/desktop-frame-2026-10-21.md).
Chờ owner xem lại <http://127.0.0.1:4232/#kph>.

**Bộ khung global — follow-up 21/10/2026:** registry màn hình dùng chung cho
AppHeader/Home/sidebar/mobile; AppHeader có một markup/CSS với mode welcome/
spacious/compact. Bỏ override header theo màn; loading/live dùng cùng account
trigger từ profile. Giữ giao diện, native cover và nghiệp vụ hiện tại.
Build/PWA, 233 tests và browser technical PASS; loading/live zero layout shifts.
Owner visual pending tại <http://127.0.0.1:4232/#home>.
[Thiết kế](product/STORE_APP_FRAME.md),
[bàn giao](delivery/header-style-rollout/global-frame-2026-10-21.md).

**Home/điều hướng — follow-up 21/10/2026:** Home đủ DATE/KPH/Báo cáo/Tra hạn;
Tra hạn nổi trên các màn làm việc; desktop sidebar 248px; mobile capsule ba ô
Trang chủ/Thông báo/tính năng gần nhất (nhớ trong phiên). Follow-up cùng ngày:
sidebar gom đủ bốn nhánh trong một nhóm; menu nền đặc kiểu capsule iOS 27,
không Liquid Glass/blur/trong suốt. Owner chọn Thông báo
rỗng, chờ nguồn dữ liệu. Giữ header rộng/compact và workflow hiện hành, chỉ
Store App. Build/PWA, 231 tests và browser technical PASS; owner visual pending.
Preview <http://127.0.0.1:4232/#home>;
[thiết kế](product/STORE_NAVIGATION_DESIGN.md),
[bàn giao](delivery/header-style-rollout/navigation-2026-10-21.md).

**Mẫu báo cáo đang mở — compact follow-up 20/10/2026:** tên mẫu thay tiêu đề
chung ở header, Back về menu mẫu, tìm/Đổi mẫu/Info ghép vào nền xanh; kỳ/phạm
vi/danh mục ở nắp trắng cuộn native. Giữ workflow và Home/login/Tra hạn.
Build/229 tests và browser technical PASS; chờ owner xem ở
<http://127.0.0.1:4232/#reports>; [bàn giao](delivery/header-style-rollout/handoff.md).

**Header Store App — thêm dạng compact 20/10/2026:** theo yêu cầu owner,
Home/đăng nhập/Tra hạn giữ dạng rộng; KPH/DATE/Báo cáo dùng biến thể tác nghiệp
Back/tiêu đề/avatar cùng hàng, xanh gọn và nắp trượt chung. 390px: KPH/DATE
lên thêm 67px, menu Báo cáo 80px so bản hợp nhất rộng. Giữ 44px touch/focus,
workflow và loading geometry. Candidate chờ owner xem.
Preview <http://127.0.0.1:4232/#kph>;
[bàn giao](delivery/header-style-rollout/handoff.md).

**RPT01 — owner tạm chấp nhận và yêu cầu merge, 20/10/2026:** phản hồi trực tiếp
“tạm, merge” áp dụng candidate revision 14. Tích hợp báo cáo DATE, mẫu/lịch sử
browser-local và các control tham khảo; giữ KPH/DATE đã accepted trên `main`.
[Bàn giao tích hợp](delivery/rpt01-report-design/merge-2026-10-20.md) ghi checkpoint,
kiểm tra sau cập nhật nền và giới hạn. Các mục pending bên dưới là lịch sử
trước quyết định này; chưa mở scope API tồn kho, backend báo cáo hoặc Pages.

**Báo cáo DATE — RPT01 revision 14, 18/10/2026:** tối ưu và tách ba cụm Store
PWA tham khảo: search có xóa, settings rows và choice sheet có xác nhận.
Search dùng thật trong composer/picker/history; picker chỉ cuộn list, header/
search/footer giữ trong viewport. Khu điều hướng gọn hơn, tên mẫu có thêm chỗ.
Giữ không tab/không vuốt ẩn composer, nghiệp vụ mẫu/lịch sử/chọn lô không đổi.
Candidate chờ owner xem; chưa rollout các feature đã accepted.
Preview <http://127.0.0.1:5173/#reports>;
[mẫu component](product/STORE_FORM_CONTROLS.md),
[bàn giao/checks](delivery/rpt01-report-design/handoff.md).

**Báo cáo DATE — RPT01 revision 13, 18/10/2026:** owner loại bỏ round tab r12.
Đã tháo component/CSS tab và dựng composer riêng, trang trắng cuộn native;
không hero/nắp/transform. Đổi mẫu mở sheet tìm kiếm, chọn tạm rồi Dùng mẫu;
Hủy giữ draft, áp dụng giữ kỳ báo cáo. Kỳ/phạm vi là hai hàng thiết lập, lọc
chi tiết qua modal. Nghiệp vụ chọn lô/mẫu/lịch sử/xuất giữ nguyên. R13 candidate
chờ owner xem, không suy acceptance từ technical gate.
Preview <http://127.0.0.1:5173/#reports>;
[bàn giao/checks](delivery/rpt01-report-design/handoff.md).

**Báo cáo DATE — RPT01 revision 12, 18/10/2026:** thiết kế lại composer theo
hướng tối giản của app: nền xanh chỉ tên mẫu/tìm kiếm, bỏ control chọn mẫu lớn.
Đổi mẫu qua thanh điều hướng tối đa hai tab nhanh (320 px chỉ mẫu hiện tại),
Xem thêm mở thư viện đầy đủ. Kỳ/lọc/nhóm DATE gom thanh thiết lập; danh mục
bỏ khung lồng, dùng hàng phẳng. Giữ chọn lô/mẫu/lịch sử/nút neo, không thêm
vuốt ẩn composer. R12 candidate, chờ owner xem.
Preview <http://127.0.0.1:5173/#reports>;
[bàn giao/checks](delivery/rpt01-report-design/handoff.md).

**Báo cáo DATE — RPT01 revision 11, 18/10/2026:** owner chưa đạt r10.
Thẻ mẫu chuyển sang nền màu liền khối, icon tròn đậm theo Home; cả preset và
mẫu cá nhân. Trang khai báo mẫu đang chọn dùng cuộn native, bỏ grip và toàn bộ
listener kéo/vuốt ẩn; nút “Chọn mẫu khác” điều hướng rõ ràng. Kỳ vẫn trên nắp
trắng. Giữ dropdown, chọn lô, lưu mẫu/tạo báo cáo, mock/browser-local.
Preview <http://127.0.0.1:5173/#reports>; r11 chờ owner xem.
[Bàn giao/checks](delivery/rpt01-report-design/handoff.md).

**Báo cáo DATE — RPT01 revision 10, 14/10/2026:** đưa bộ chọn kỳ/ngày chốt
lên đầu nắp trắng. Nền xanh giữ mẫu đang dùng trong control có nhãn, icon,
viền và trạng thái mở rõ ràng; dùng dropdown hệ thống. Lịch vẫn portal trên
modal, Escape đóng lịch trước và trả focus. Typecheck/mock build/PWA, browser
390/1440/320 (lịch, keyboard, 150% chữ, contrast, chuyển mẫu, vuốt) và hồi quy
mẫu/lịch sử đạt. Giữ 40 lô/đợt, snapshot/in đủ tập; vẫn mock/browser-local.
Preview <http://127.0.0.1:5173/#reports>; phần r10 chờ owner xem.
[Bàn giao/checks](delivery/rpt01-report-design/handoff.md).

**Báo cáo DATE — RPT01 revision 9, 14/10/2026:** owner tạm đạt r8,
yêu cầu nắp trượt. Tên/đổi loại và kỳ nằm trên nền xanh; danh mục và lịch sử
là nắp trắng overlap như Home/Login. Kéo xuống đủ ngưỡng hoặc dùng nút về
menu trắng; thẻ loại có màu. Giữ cuộn tự nhiên, reduced motion, không dựng lại
rows theo từng touchmove. Stress 1.000 lô/CPU 4×: chỉ dựng layout đang dùng,
40 lô/đợt, khoảng 1.600 nodes thay ~65.000; snapshot/in vẫn đủ tập. Store 226
tests, mock build/PWA và browser 390/1440/320 đạt; chi tiết perf ở bàn giao.
Vẫn mock/browser-local, phần r9 chờ owner xem.
Preview <http://127.0.0.1:4221/#reports>; [thiết kế](product/STORE_REPORTS_DESIGN.md),
[bàn giao/checks](delivery/rpt01-report-design/handoff.md).

**Đóng lượt KPH/DATE theo “pass, merge”, 16/10/2026.** Owner đã nghiệm thu
preview 4215; scope UI CLOSED, tích hợp qua
[PR #12](https://github.com/VuPhm/coopfood-kph/pull/12) vào `main` rồi dừng.
Các đề nghị thử preview bên dưới là lịch sử trước nghiệm thu. Không tự mở
backend DATE, module mới hoặc deploy. [Hồ sơ tích hợp](delivery/figma-mobile-implementation/merge-2026-10-16.md).

**KPH + DATE: thử cuộn tiếp để neo tab tại 4215.** Tải lại
<http://127.0.0.1:4215/#kph> và <http://127.0.0.1:4215/#date>; vuốt lên cho
nắp phủ vùng tìm/CTA, vuốt tiếp để tab giữ trên đỉnh rồi đổi tab và cuộn về.
Technical PASS 37 tests/build/Playwright năm viewport và loading no shift.
Phần mới chưa commit; owner/device gate pending.
[Bàn giao](delivery/figma-mobile-implementation/sticky-tabs.md).

**DATE: xem nền xanh/nắp trượt/controls compact tại 4215.** Checkpoint UI trước
đã lưu local `216c17c`; DATE mới chưa commit. Tải lại
<http://127.0.0.1:4215/#date>, tìm SKU/lô, mở metadata, cuộn nắp và thử
Ghi nhận/Đã xử lý. Technical PASS build/32 tests/Playwright workflow/contrast/
reflow/scroll; owner/device gate pending.
[Bàn giao/rollback](delivery/figma-mobile-implementation/date-sliding-cover.md).

**KPH: xem CTA trắng, nhãn màu và cấu trúc mới tại 4215.** Tải lại
<http://127.0.0.1:4215/#kph>, xem hai CTA cùng hàng/icon/nhãn và thử cả hai
loại. Technical PASS build/11 tests/geometry/contrast/150% chữ/loading/workflow;
owner/device gate pending. [Bàn giao/rollback](delivery/figma-mobile-implementation/kph-white-cta.md).

**KPH: xem tìm trước CTA và solid sáng tại 4215.** Tải lại
<http://127.0.0.1:4215/#kph>, xem spacing 8 px và hai CTA cam nhạt/mint trên
nền xanh; thử tìm, tạo phiếu, cuộn nắp. Technical PASS build/11 tests/contrast/
keyboard/loading/workflow; owner/device gate pending.
[Follow-up và checks](delivery/figma-mobile-implementation/kph-sliding-cover.md).

**KPH: xem nền xanh liền dưới nắp tại 4215.** Tải lại
<http://127.0.0.1:4215/#kph>, xem header → CTA/tìm kiếm cùng nền xanh và cuộn
nắp trắng lên/xuống. Contrast/focus/loading/scroll technical PASS; owner/device
gate pending. [Follow-up/checks](delivery/figma-mobile-implementation/kph-sliding-cover.md).

**KPH: xem nắp trượt từ tab xuống tại 4215.** Tải lại
<http://127.0.0.1:4215/#kph>, cuộn để nắp trắng phủ CTA/tìm kiếm rồi cuộn
về đầu; thử Chọn/Lọc và focus bàn phím. Technical PASS năm viewport/loading/
workflow; owner/device gate pending. Bản compact trước giữ ở build riêng.
[Bàn giao/rollback](delivery/figma-mobile-implementation/kph-sliding-cover.md).

**KPH: xem thử compact khu chức năng tại 4215.** Mở
<http://127.0.0.1:4215/#kph>, so với bản trước 4213: CTA/tab/khoảng đệm gọn
hơn, nội dung phiếu giữ nguyên. Thử tạo phiếu, đổi loại, Chọn và Lọc.
Technical PASS build/11 tests/Playwright bốn viewport và loading; owner/device
gate pending. [Bàn giao/rollback](delivery/figma-mobile-implementation/kph-compact-controls.md).

**KPH: xem khu chức năng đồng bộ DATE tại 4213.** Tải lại
<http://127.0.0.1:4213/#kph>: tab → tiêu đề/số phiếu → Sắp xếp / Chọn / Lọc;
tìm/quét nằm riêng phía trên. Kiểm tra đổi loại, sắp xếp, chọn và lọc; bản này
cũng có CTA/panel mới của lượt trước. Technical PASS, owner/device gate pending.
[Bố cục và kiểm chứng](delivery/figma-mobile-implementation/kph-date-controls.md).

**KPH: nghiệm thu CTA và panel tạo mới.** Tải lại
<http://127.0.0.1:4201/#kph>, mở TPCN/TPTS, cuộn → xem lại → chỉnh sửa →
đóng/mở lại. Một portal/animation xuyên loading/review/resize, form gắn sau
entrance để khung phản hồi sớm. Technical PASS build/tests/Playwright
390/1440/320, normal/reduced motion/CPU 6× và nested popup; owner thử thêm
thiết bị đã thấy giật. [Bàn giao/phạm vi/giới hạn](delivery/figma-mobile-implementation/kph-create-panel.md).

**Nhãn màu + thanh cạnh trái — rollout 12/10/2026:** owner đã chốt KPH
bằng “đạt, checkp, nhân bản”, checkpoint local `5fdfa3e`; xác nhận nhân rộng
“Toàn bộ nhãn màu và thanh nhãn”. Đã áp dụng DATE, lịch sử Tra hạn, KPH
online/Pilot và Admin identity/lifecycle/catalog; cùng palette/gutter, adapter
giữ nghĩa trạng thái từng feature. DATE thêm bar trang trí theo tình trạng,
không thêm tiến độ/%; lịch sử giữ snapshot. Technical/browser mock-fixture PASS
390×844 và 1440×1024; phần nhân rộng chờ owner xem ở 4213.
[Bàn giao/phạm vi/checks](delivery/list-label-rollout/handoff.md).
Các ghi chú “chờ chốt KPH” / “không bar DATE” bên dưới là mốc trước yêu cầu này.

**KPH: xem spacing thanh nhãn đã tối ưu.** Tải lại
<http://127.0.0.1:4213/#kph>, xem bar 3px tại rãnh riêng, dài 36px mobile/
24px desktop; bật Chọn để kiểm khoảng cách checkbox/chữ. Build/typecheck,
Playwright 390/1440/320 và skeleton no shift PASS; chờ owner chốt spacing.
[Bàn giao/checks](delivery/figma-mobile-implementation/kph-marker-spacing.md).

**DATE thu gọn summary/chi tiết, follow-up 12/10/2026:** thông tin mã hàng
đóng gọn, mở thêm metadata khi cần. Chi tiết bỏ summary năm hàng, ngày phóng
lớn và ghi chú xử lý; giữ tên/SKU/lô, nhãn, timeline và ngày đầy đủ, CTA 48 px.
Mã hàng còn 62 px; detail giảm 39–52%, CTA không cần cuộn ở 390/1440/320
và detail 150% chữ. Technical PASS 32 tests/build/PWA, compact/mốc/workflow
Playwright ba viewport, contrast và metadata keyboard/reflow. Source working
tree, chờ owner nghiệm thu. Preview <http://127.0.0.1:4201/#date>;
[bàn giao/checks](delivery/figma-mobile-implementation/date-compact-detail.md).

**KPH: xem palette choice được phát triển lại và thanh cạnh trái.** Tải lại
<http://127.0.0.1:4213/#kph>, mở hai form và xem list ở mobile/desktop/chế độ
Chọn. Choice dùng bộ màu cũ từ KPH_OPTIONS, bar 4px theo tình trạng record;
ba nhãn v1 giữ nguyên. Mock build/typecheck, 44 targeted tests và Playwright
390/1440/320 (contrast/reflow/workflow/loading) PASS. Bản dấu tròn/choice dùng
chung màu nhãn đã được thay.
[Bàn giao/checks](delivery/figma-mobile-implementation/kph-choice-bars.md).

**DATE quản lý theo mốc Tra hạn, follow-up 12/10/2026:** danh sách dùng
nhãn tình trạng DATE và nhãn xử lý độc lập, không còn bar/%. Chi tiết lô dùng
chung timeline NSX/cảnh báo/hạn lùi/HSD với Tra hạn, kèm SKU/lô; thêm bộ lọc
DATE. Thiếu NSX/ngày lỗi không suy mốc. Khung trên đã accepted giữ nguyên.
Theo dõi ngày thực liên tục, thông báo và thống kê ghi hướng mở rộng, chưa
triển khai. Preview <http://127.0.0.1:4201/#date>; owner nghiệm thu phần mới
riêng. Technical PASS Store 204 tests, kiểm tra lại DATE 32 tests, build/PWA,
Playwright 390/1440/320 (nhãn/mốc/filter/workflow/contrast, tăng chữ 150%)
và hồi quy Tra hạn. [Hướng product](product/DATE_MILESTONE_MODEL.md),
[bàn giao/checks](delivery/figma-mobile-implementation/date-milestones.md).

**KPH: xem phần mở rộng choice/item tại preview 4213.** Tải lại
<http://127.0.0.1:4213/#kph>, xem dấu màu cạnh tên hàng ở mobile/desktop rồi
mở tạo phiếu hai loại: choice hai cột, màu theo nhãn, dấu tích selected và
condition Khác ở cuối. Palette v1 đã được owner xác nhận thích; phần mới
cần nghiệm thu riêng. Mock build, typecheck, 200 Store/UI tests và
Playwright ba viewport/contrast/reflow/workflow/loading PASS. [Bàn giao](delivery/figma-mobile-implementation/kph-choice-items.md).

**KPH nhãn màu v1 được owner xác nhận thích; phần choice/item mới chờ xem.** Mở
<http://127.0.0.1:4213/#kph>, đổi TP khô/TP tươi để so sánh nhãn tình trạng,
biện pháp và duyệt; desktop dùng cùng nhãn trong ba cột. Technical PASS
253 tests/build, mock build, Playwright 3 viewport/reflow/contrast/workflow và
loading geometry. [Cơ chế toàn list](product/LIST_LABEL_SYSTEM.md),
[bàn giao](delivery/figma-mobile-implementation/kph-list-labels.md).
Admin/history có mapping đề xuất; DATE triển khai theo lượt riêng bên trên.

**DATE bar danh sách đã bỏ theo hướng mới ngày 12/10/2026.** Các bản thin bar
hàng riêng/inline trước đây chỉ giữ lịch sử, đã thay thế bằng nhãn theo mốc
Tra hạn. [Hướng product](product/DATE_MILESTONE_MODEL.md),
[bàn giao hiện tại](delivery/figma-mobile-implementation/date-milestones.md).

**DATE đã gọn khung trên theo KPH.** Tải lại <http://127.0.0.1:4201/#date>
để xem hàng nhập/quét/Tìm, tiêu đề/số lượng và khoảng trống trước danh sách.
Build, 14 tests và Playwright 390/1440/320 (tăng chữ 150%, workflow, contrast)
PASS; owner đã nghiệm thu khung trên ngày 12/10/2026 qua “đạt”. [Bàn giao](delivery/figma-mobile-implementation/date-top-refinement.md).

**DATE đã dựng lại phần trình bày theo yêu cầu bỏ bố cục cũ.** Owner tải lại
<http://127.0.0.1:4201/#date>, xem khoảng cách/căn lề, thẻ NSX/HSD và chi tiết
lô với CTA cam/xanh cùng hàng. Danh sách đã làm gọn theo follow-up, cao giảm
25–31% và giữ cỡ chữ. Technical PASS ở 390/1440/320, tăng chữ 150%,
tìm/quét/lọc/xử lý; chờ nghiệm thu owner. [Bàn giao](delivery/figma-mobile-implementation/date-recomposition.md).

**DATE theo mẫu KPH đã sửa và chờ owner xem lại.** Tải lại
<http://127.0.0.1:4201/#date>: tab đều 44 px, thử HSD gần nhất/Tên hàng,
Lọc DATE → Đặt lại/Xong và hai CTA cam/xanh trong detail lô mẫu.
[Bàn giao/checks](delivery/figma-mobile-implementation/date-kph-reference.md).
Giữ acceptance KPH/DATE riêng; r14/4202 bên dưới là candidate trước follow-up.

**KPH dropdown/hộp lọc follow-up đang chờ owner xem lại.**
Mở <http://127.0.0.1:4201/#kph>, đổi Mới nhất/Cũ nhất/Tên hàng rồi vào hộp lọc,
thử trạng thái/ngày và Đặt lại/Xong. Icon lọc đã đồng bộ với DATE, cùng cỡ/nét
và căn tâm; geometry/contrast 3 viewport và skeleton không shift PASS.
Technical PASS 182 Store tests/build,
Playwright mobile/desktop/320, contrast và modal/progressive regression.
[Bàn giao](delivery/figma-mobile-implementation/kph-filter-sort.md).
Đây là lượt mới sau KPH r13; giữ gate DATE r14 bên dưới độc lập.

**DATE hợp nhất/Fresh r14 đang chờ owner nghiệm thu giao diện.**
Xem <http://127.0.0.1:4202/#date>: tìm SKU `0008421`, barcode `29123415005`,
lô `C24-118`; Ghi nhận/Đã xử lý → Home → mở DATE lại để xem state phiên.
Technical PASS 230 tests/build, DATE 3 viewport, 24 contrast states và regression
KPH/navigation/workflow. [Bàn giao và giới hạn](delivery/figma-mobile-implementation/date-coop-fresh.md).
Bước nhỏ tiếp: owner xem DATE mới; chưa coi technical PASS là nghiệm thu.

**KPH Fresh r13 đã duyệt và được lưu checkpoint local** theo “duyệt, checkpoint”.
Đóng slice giao diện KPH hiện tại; giữ Co.op Fresh làm DNA mặc định cho lượt nâng
UI tiếp theo. Chờ yêu cầu màn/phạm vi mới, không tự khởi chạy rollout.
[Bàn giao/giới hạn](delivery/figma-mobile-implementation/kph-coop-fresh-colors.md).

Các bước nghiệm thu r12 và chuẩn bị r11 phía dưới là lịch sử; những gate backend,
thiết bị thật và cycle khác không được đóng bởi nghiệm thu giao diện này.

Cập nhật: 2026-10-11

KPH **Co.op Fresh r12** đã triển khai theo “làm”; bước nhỏ tiếp theo là owner
xem [preview KPH](http://127.0.0.1:4201/#kph) và thử tạo → duyệt → chọn/xuất.
[Bàn giao](delivery/figma-mobile-implementation/kph-coop-fresh-handoff.md) ghi
scope, kiểm chứng và giới hạn mock. Chưa có nghiệm thu bản reskin; các mục
chuẩn bị r11 bên dưới là lịch sử, các màn rollout khác tiếp tục hoãn.

Kế hoạch KPH **Co.op Fresh** (`coop-fresh-v1`) đã chuẩn bị trong lúc nghiệm thu;
đây là mặc định thiết kế mới của Store PWA, xem
[kế hoạch r11](delivery/figma-mobile-implementation/kph-coop-fresh-plan.md).
Tiếp tục nghiệm thu checkpoint hiện tại; khi triển khai KPH, cập nhật feedback
đã xác nhận rồi làm F1 danh sách + token scoped → F2 tạo phiếu → F3 chi tiết/
duyệt/xuất. Rollout r6 của các màn khác giữ nguyên; chưa thực hiện reskin.

Owner yêu cầu Git checkpoint 11/10: các thay đổi hiện tại được lưu bằng commit
local trên nhánh task. Tiếp tục từ mốc này; các mục cần checkpoint bên dưới là
lịch sử trước mốc mới. Owner acceptance còn pending, chưa push/merge/deploy.

Progressive loading KPH → Home đã triển khai: khung đúng tỷ lệ, ảnh responsive,
giữ scroll form và offline. [Bằng chứng](delivery/figma-mobile-implementation/progressive-loading.md).
Bước nhỏ tiếp theo: owner tải lại 4197, xem Home/KPH/tạo phiếu trên mạng chậm;
chấp nhận update nếu đang dùng cache cũ, rồi thử offline sau cài cache.

Offline follow-up trên bản hiện tại: technical PASS cache shell/lazy chunks,
offline reload/tra hạn lùi/form/export hai viewport; 180 Store PWA tests.
[Phạm vi](delivery/figma-mobile-implementation/kph-offline.md).
Bước nhỏ tiếp theo: owner mở build 4197 trên điện thoại, chờ cài cache rồi
thử chế độ máy bay. Phiếu dùng thử giữ trong phiên; không thêm outbox hoặc
offline persistence cho phiếu máy chủ. Prototype 6 shell ngoài phạm vi.

KPH loading follow-up 11/10: technical PASS lazy loading/skeleton/recovery,
prefetch trang online đúng scope, một layout và memo hóa; 178 Store PWA + 12 UI
tests, build mock/online và Playwright hai viewport. JS Home giảm 29,9%, DOM KPH
giảm 45–47%; cold navigation thêm 24–56 ms để tải chunk, có skeleton.
[Bằng chứng](delivery/figma-mobile-implementation/kph-loading.md).
Bước nhỏ tiếp theo: owner thử build `http://127.0.0.1:4197/#kph`, mở tạo phiếu
và đo lại trên browser/thiết bị đã thấy >600 ms. Chưa field INP/real-backend.

Modal theo tài khoản follow-up 11/10: technical PASS header xanh/chữ trắng/X sáng,
body trắng/lề 24px, 206 Store/UI/Admin tests và Playwright mobile/desktop.
Bước nhỏ tiếp theo: owner xem popup tra và lọc tại `http://127.0.0.1:5175/#kph`;
visual acceptance và thiết bị thật còn pending. [Bàn giao](delivery/figma-mobile-implementation/modal-account-reference.md).

Modal chung follow-up 11/10: popup tra dùng Radix modal/backdrop tối 55% không
blur, khóa cuộn/focus và giữ state phiên. Shared chrome/motion/X; sheet mobile
sát đáy, desktop centered. Store 177 + UI 12 + Admin 14 tests/build PASS;
Playwright modal 5, close controls Store/Admin/PWA và workflow/header gates PASS.
Build CPU 6× popup median mobile/desktop 96/88 ms, max 128/152 ms; đây là lab,
lần đầu tài khoản desktop còn 504 ms. Visual acceptance/thiết bị thật pending.
[Bàn giao](delivery/figma-mobile-implementation/modal-unification.md).
Bước nhỏ tiếp theo: owner thử backdrop/X tại `http://127.0.0.1:5175/#kph`.

Modal INP follow-up 11/10: sửa backdrop/render, technical PASS 174 Store PWA +
12 UI tests và Playwright mobile/desktop. Build CPU 6× trung vị mobile
tài khoản/lọc/tạo 56/64/128 ms; lần mở đầu lớn nhất 280 ms.
[Bằng chứng](delivery/figma-mobile-implementation/modal-inp.md).
Bước nhỏ tiếp theo: owner đo lại trên browser/thiết bị đã thấy >600 ms;
preview build `http://127.0.0.1:4187/#kph`, dev vẫn `http://127.0.0.1:5176/#kph`.

Mobile toolbar follow-up 11/10: thanh dưới 4 mục Trang chủ/Tra cứu/KPH/DATE,
active xanh/mint và safe-area; nút nổi “Tra hạn lùi” dạng capsule peach trên thanh.
Popup giữ phía trên navigation, state/focus/route semantics cũ. Playwright toolbar,
Home scroll và Home regression 5 viewport PASS; TypeScript/build và 174 Store PWA tests PASS (2 workers).
[Bằng chứng](delivery/figma-mobile-implementation/mobile-toolbar.md).
Bước nhỏ tiếp theo: owner thử thanh dưới/nút nổi tại `http://127.0.0.1:5176/#kph`.

Đăng nhập follow-up 11/10: áp dụng lớp form trắng cuộn trên nền xanh sticky,
mobile một cột và desktop giữ hai cột. Technical PASS 14 tests, TypeScript/build,
Playwright scroll/identity 5 viewport và online API fixture 2 viewport.
[Bằng chứng](delivery/figma-mobile-implementation/login-scroll-layer.md).
Bước nhỏ tiếp theo: owner cuộn `http://127.0.0.1:5176/#login` để xem hình ảnh.

Home follow-up 11/10: khối nội dung trắng là lớp trên, cuộn tự nhiên lên che
header xanh giữ vị trí; chỉ áp dụng Home. Technical PASS Playwright 5 viewport,
TypeScript, 6 targeted tests và build. [Bằng chứng](delivery/figma-mobile-implementation/home-scroll-layer.md).
Owner đã chấp nhận tài khoản/login bằng “ổn”; cơ chế cuộn Home mới chờ xem hình ảnh.
Bước nhỏ tiếp theo: cuộn Home tại `http://127.0.0.1:5176/#home`.

Tài khoản + đăng nhập theo DNA đã triển khai theo yêu cầu owner ngày 11/10/2026;
revision 7 được owner visual acceptance bằng “ổn”; technical PASS trên working tree:
`npm run verify` 216 tests/build, Playwright account/login 5 viewport, online API
fixture 2 viewport và Home regression PASS. [Bàn giao](delivery/figma-mobile-implementation/account-login-refinement.md).
Preview: avatar ở `http://127.0.0.1:5176/#home`; đăng nhập ở
`http://127.0.0.1:5176/#login`. Login UI được dùng lại cho online gateway hiện có;
bản dev có lối vào dữ liệu mẫu riêng, không tạo session giả. Chưa real-backend/
thiết bị thật, chưa commit/merge/deploy.
Các trang còn lại giữ kế hoạch r6 hoãn; owner yêu cầu cuộn Home trước.

## Kế hoạch Visual DNA rollout — revision 6, hoãn sau tài khoản/login

Owner đã chấp nhận Home và yêu cầu tích hợp DNA/chuẩn bị các màn còn lại ngày
11/10/2026. [Visual DNA](product/STORE_APP_VISUAL_DNA.md) khóa hướng xanh/trắng,
pastel, icon tròn và quy tắc trang trí Home. [Kế hoạch áp dụng](delivery/figma-mobile-implementation/visual-dna-rollout-plan.md)
xác định thứ tự **nền UI chung → Tra cứu → DATE → KPH → Tra hạn lùi**, cùng
semantics, allowed scope và kiểm tra cần giữ.

R6 đã chuẩn bị, bảo tồn ở plan-r6; r7 ưu tiên tài khoản/login theo owner.
Rollout các màn còn lại chưa dispatch/chưa reskin. Bước nhỏ tiếp
khi triển khai: review/checkpoint các thay đổi Home/shelf còn dirty và untracked,
sau đó nền UI chung + Tra cứu. Tái sử dụng primitive/token hiện có, bổ sung palette
scoped Store App; giữ Home accepted và tương tác shelf đã nghiệm thu. Không cần
mở thêm cycle hoặc thay thế kế hoạch cũ khi resume. R5 workflow và lịch sử shelf
còn chờ acceptance trong phạm vi riêng; không gộp với nghiệm thu Home.

Follow-up Tra lùi hàng đã nghiệm thu và thu dọn ngày 10/10/2026; xem
[bàn giao cuối](delivery/figma-mobile-implementation/shelf-empty-state.md).
Yêu cầu mới bổ sung lịch sử 20 lần tra chỉ ở màn chính, lưu trong phiên đã
technical PASS 214 tests/build và Playwright mobile/desktop. Bước nhỏ tiếp theo:
owner xem bố cục desktop và thao tác Tra lại tại `http://127.0.0.1:5175/#shelf`;
xem [bàn giao lịch sử](delivery/figma-mobile-implementation/shelf-history.md).
Chưa tự merge/deploy. Các mục cycle bên dưới giữ phạm vi nghiệm thu riêng.

## Lịch sử Figma implementation — revision 5 chờ nghiệm thu

Trước scope chuẩn bị r6, cycle `figma-mobile-implementation` ở AWAITING_ACCEPTANCE revision 5 trên
`store-app/figma-mobile-implementation`. Đã sửa các lỗi QA về chọn/duyệt/xuất
KPH, giữ state DATE trong phiên và guard hai viewport, panel hạn lùi theo route,
SKU/UPC, metadata fixture và vùng bấm mobile; CTA Tra cứu hiển thị rõ theo frame.
`npm run verify` PASS 193 tests/build và ba gate Playwright ở
390×844 / 1440×1024 PASS. Candidate SHA nằm trong plan; owner acceptance pending.

Bước nhỏ tiếp theo: owner kiểm tra preview mock theo
[handoff r5](delivery/figma-mobile-implementation/acceptance-handoff-r5.md),
đặc biệt chọn một phiếu → xuất một phiếu, xử lý DATE → về Home → mở lại và
phiếu mới giữ đúng SKU/UPC. [Evidence r5](delivery/figma-mobile-implementation/technical-evidence-r5.md)
ghi lệnh, kết quả và giới hạn. Round sửa này kết thúc tại handoff; chưa mở
review/scope mới, API wiring, merge, deployment hay Pages cutover.

## Figma mobile implementation — evidence revision 1

Owner đã yêu cầu implement trực tiếp mobile, cho phép mock tạm; không tiếp tục
UI DNA prototype. Working tree trên `store-app/figma-mobile-implementation` đã
pass TypeScript, 164 tests, build, contract/docs checks và browser gate ở
390×844 / 1440×1024. [Bàn giao](delivery/figma-mobile-implementation/handoff.md)
có preview, file scope và icon placeholder replacements. Lượt [review/sửa](delivery/figma-mobile-implementation/review.md) đã hoàn tất
các lỗi ngày, count/filter và tương tác trong scope, `npm run verify` PASS
169 tests. Bước nhỏ kế tiếp: owner xem preview mobile và luồng tạo → xem lại
→ gửi; technical PASS không thay cho visual acceptance. Desktop
Figma và API wiring còn là công việc tiếp theo, chưa suy ra quyền deploy.

## Store App pivot — R2-01 đã đóng

R1-D01 đến R1-D04 đã được chấp nhận và tích hợp. Hướng giao diện nằm ở
[Store App UI DNA](product/STORE_APP_UI_DNA.md). R2-01 Shared Store App Shell
Spine đã được owner “pass” ngày 2026-09-24 trên candidate `3799a30`; cycle
CLOSED, close checker PASS tại `c2db4bf`. [R2-01 handoff](delivery/r2-01-shell-spine/acceptance-handoff.md)
giữ nguyên quyết định: UI visual refinement deferred, shell này không phải
final design system. Chưa merge vào `main`, chưa deploy, chưa cutover Pages.
R2-02 chưa mở; chỉ lập scope mới khi owner yêu cầu. Các cycle D01/P04/P05 bên
dưới là lịch sử delivery đã đóng, không phải task tiếp tục tự động.

## D01 history paging — đã đóng revision 2

Owner chọn D01 ngày 23/09/2026 sau khi xác nhận “pass p04”. Backend, Store PWA
và E2E do GPT-6 Luna triển khai đã tích hợp trên baseline P04/P05 ở
`codex/d01-p04-integration`. Candidate code/browser `7fc9b8d`; technical PASS:
162 frontend/package tests, 65 backend tests và browser 8 PASS / 4 skip theo viewport.

Owner xác nhận “pass” ngày 24/09/2026 sau
[handoff](delivery/d01-history-paging/acceptance-handoff.md). Cycle CLOSED;
close checker PASS tại `8144b7c`. [Evidence revision 2](delivery/d01-history-paging/technical-evidence-r2.md)
giữ nguyên kết quả kỹ thuật; lượt đóng chỉ ghi quyết định, không sửa code.
P04 + D01 đã merge vào `main` qua
[PR #8](https://github.com/VuPhm/coopfood-kph/pull/8), commit `1a339f3`, ngày
24/09/2026. CI frontend, backend và browser đều PASS. Chưa deploy; không tự mở
cycle mới.

## P04 user deactivation — đã đóng

Owner chấp nhận revision 3 ngày 23/09/2026 bằng “pass p04”. Candidate
`e502886` đã pass 161 frontend/package tests, 64 backend tests và browser
real-backend 4 viewport. Close checker PASS; đã tích hợp vào `main` cùng D01
qua PR #8; chưa deploy.

## P05 credential self-service — đã đóng và tích hợp

Implementation candidate trên `codex/p05-credential-self-service` đã có contract,
migration V9, backend, Store PWA, Admin Web và test source cho đổi mật khẩu của
chính user. Hash mới dùng PBKDF2 có prefix, BCrypt cũ vẫn được xác minh và
`credential_version` làm mọi session cũ mất hiệu lực ở request kế tiếp.

Technical verification đã pass trên candidate `39c0cff` với evidence tại
[technical evidence](delivery/p05-credential-self-service/technical-evidence.md).
Owner đã xác nhận “pass” ngày 23/09/2026 và yêu cầu làm tiếp.
[Owner decision](delivery/p05-credential-self-service/acceptance-handoff.md) đóng
cycle P05. [PR #7](https://github.com/VuPhm/coopfood-kph/pull/7) đã merge vào
`main` tại `2d32ffd` ngày 23/09/2026; CI frontend/backend/browser PASS. Chưa deploy.

## P02 scoped authorization — đã đóng

Candidate P02 sau repair round 2 đã triển khai schema region/store mapping,
user-region assignment và KPH authorization kế thừa. Scope resolver và KPH
capability policy đã tách lớp; invariant active store → active region được giữ
bằng relational constraint an toàn khi concurrent. Technical gate đã pass và
owner chấp nhận ngày 2026-09-21.

Các outcome đã được chấp nhận:

1. `REGION_MANAGER` thao tác KPH trong đúng region và bị deny ở region khác.
2. Grant/revoke region assignment có hiệu lực ở request kế tiếp.
3. `CHAIN_ADMIN` truy cập active store toàn chuỗi mà không cần synthetic
   store membership.
4. Store hoặc region inactive bị deny kể cả khi user còn region/chain scope.

Handoff chi tiết: [p02-scoped-authorization](delivery/p02-scoped-authorization/acceptance-handoff.md).

## P03 scheduled lifecycle — đã đóng

P03 trên `codex/p03-scheduled-lifecycle` đã được owner chấp nhận ngày 21/09/2026.
Backend,
OpenAPI, fixtures, generated client và Admin Web đã có create/reschedule/cancel/
manual execute cho store/region; lịch tối thiểu 30 ngày và recheck guard/scope.
Thực thi là thao tác thủ công khi đến hạn, không có tiến trình tự chạy.

Technical evidence, owner decision và close gate nằm tại
[P03 plan](delivery/p03-scheduled-lifecycle/plan.json).

## C01 catalog staging/validation — đã đóng

C01 được owner chấp nhận ngày 21/09/2026. Slice nhận UTF-8 CSV tổng hợp,
giữ identifier dạng string/leading zero, trả lỗi theo dòng và chặn duplicate
barcode. Chỉ `CATALOG_ADMIN` có quyền; upload cùng checksum idempotent. Batch
staging không được tạo published catalog hoặc xuất hiện trong lookup.

Contract accepted: [CATALOG_STAGING_CONTRACT](product/CATALOG_STAGING_CONTRACT.md).
Plan: [c01-catalog-staging](delivery/c01-catalog-staging/plan.json). C02 publish,
primary supplier và mọi dữ liệu vận hành thật vẫn ngoài scope.

## Điểm tích hợp hiện tại — PR #5 đã merge

PR #5 đã merge các cycle S04, P01, P02, P03 và C01 vào `main` ngày 21/09/2026,
với head `048a7ff` và merge commit `3ffc774`. Remote CI PASS cả frontend, backend
và browser. Provenance và evidence của từng cycle tiếp tục được giữ trong
`docs/delivery/**`.

P05 đã đóng và tích hợp. P04 đã được owner chấp nhận. D01 revision 2 đã đóng;
C02 vẫn bị chặn bởi primary supplier, O01/O02 tiếp tục hoãn.

## Policy lifecycle đã khóa

Owner đã yêu cầu deactivate store/region phải đặt lịch với ngày hiệu lực tùy
chọn nhưng cách thời điểm tạo lịch tối thiểu 30 ngày. Trước ngày hiệu lực entity
vẫn active; sau khi thực thi, authorization deny từ request kế tiếp. Không hard
delete; schedule/reschedule/cancel/execute đều phải audit và guard phải được kiểm
lại lúc thực thi.

Để giữ scope nhỏ, lịch 30 ngày trước mắt chỉ áp dụng cho store và region. Khóa
user, thu hồi global role/region assignment/store membership, reset credential
và invalid session có hiệu lực ngay ở request kế tiếp, kèm lý do, audit và guard
last-admin/last-manager. Không xây generic scheduler hoặc mở rộng thêm target khi
chưa có requirement vận hành cụ thể. P03 chỉ triển khai phần lịch deactivate
store/region; các lifecycle identity/credential khác chưa triển khai trong slice này.

## Sau khi P02 slice đầu được chấp nhận — provisioning API/Admin UI

P01 đã được owner duyệt ngày 17/09/2026 với hierarchy explicit:
`CHAIN_ADMIN` toàn chuỗi, `REGION_MANAGER` đúng vùng và `STORE_MANAGER` đúng
store. Schema/authorization slice đã đóng; P03 mở endpoint/Admin UI cho lịch
deactivate, các capability provisioning còn lại chờ cycle riêng.

### Outcome

- Chia P02 thành vertical slices nhỏ, bắt đầu từ schema/authorization cho region,
  store mapping và user-region assignment; chỉ một migration active.
- Cập nhật OpenAPI, examples, generated client, backend và Admin UI trong cùng
  slice khi public API thực sự được mở.
- Dùng fixture P01 làm nguồn test allow/deny cho toàn chuỗi, đúng vùng, đúng
  store và cross-region/cross-store.
- Giữ bootstrap/recovery và credential encoder migration thành slice riêng có
  verification bảo mật tương ứng.

### Contract đã khóa

- `CHAIN_ADMIN` quản trị toàn chuỗi và thực hiện KPH tại mọi active store.
- `REGION_MANAGER` thực hiện KPH và quản lý store profile/membership chỉ tại các
  store thuộc active region assignment; không quản lý global identity/credential.
- `STORE_MANAGER` tiếp tục duyệt/xuất trong đúng store membership.
- `CATALOG_ADMIN` chỉ quản trị catalog; không self-service signup.
- User/store/membership dùng deactivate/revoke có audit, không hard delete.
- Credential reset không echo/log secret và phải làm session cũ mất hiệu lực;
  không áp dụng password rotation định kỳ hoặc câu hỏi bảo mật.

### Ngoài phạm vi

- Email/SMS reset, SSO/MFA, production secret delivery hoặc hosting policy.
- Catalog staging/publish, paging, backup/restore và production rollout.
- Delegated global identity/credential administration cho `REGION_MANAGER`.

### Acceptance P02 tối thiểu

- Backend resolve store → region từ database; không tin region do client gửi.
- Test cho ID hợp lệ nhưng sai region/store phải deny ở backend.
- Thay đổi role/assignment/membership/reset có hiệu lực ở request kế tiếp và audit.
- Clean migration, backend integration, generated-client drift, frontend tests và
  browser flow của slice phải pass trước nghiệm thu.

## Các mốc đã đóng

- Pilot-00, Foundation-01, Foundation-02 và S01–S03: xem evidence/cycle tương ứng.
- S04: [online-stability-s04](delivery/online-stability-s04/plan.json), owner
  chấp nhận có điều kiện ngày 2026-09-17; giới hạn real-backend E2E của candidate
  đã được khép lại trong preflight PR #5 ngày 2026-09-21 (PASS 6, skip 4 theo
  viewport trên PostgreSQL 17/backend thật).
- P01: [p01-provisioning-policy](delivery/p01-provisioning-policy/plan.json),
  owner chấp nhận hierarchy và security policy ngày 2026-09-17.

## Ưu tiên chưa mở cycle

1. Chốt primary supplier và semantics lookup current trước khi mở C02 publish.
2. Chọn một outcome độc lập: lifecycle identity/credential, O01 backup/restore, O02 profile triển khai hoặc A01 nghiệm thu online trên
   thiết bị mục tiêu.

Chi tiết dependency/finding nằm tại
[REVIEW_AND_ROADMAP_2026-09-16](REVIEW_AND_ROADMAP_2026-09-16.md).
