# Store App UI DNA

Implemented components, their consumers and variants, and the proposed extension
priorities are indexed in the [component catalog](STORE_APP_COMPONENT_CATALOG.md)
(reviewed 2026-10-12). Use it before introducing another control or Store pattern;
its proposals do not change the acceptance gates or business contracts below.

Status: Round 1 direction accepted by the owner in R1-D04. This document
records the Store App principles carried through the R1-D01 audit, R1-D02
comparison, and accepted R1-D03 convergence. The owner-accepted Home visual
extension dated 2026-10-11 is defined in
[Store App Visual DNA](STORE_APP_VISUAL_DNA.md); its palette, geometry and usage
rules guide subsequent Store PWA screens. Its name is **Co.op Fresh**
(`coop-fresh-v1`), the default design direction for future Store PWA UI upgrades
as recorded on 2026-10-11; individual screens retain their own acceptance gates.
This principle document does not itself
authorize implementation of a new delivery slice. Accepted business behavior
remains governed by the
[Store App contract index](STORE_APP_CONTRACTS.md) and its linked contracts.
The older [UI_DNA](UI_DNA.md) is Tool KPH extraction and migration evidence, not
the authority for this Store App direction.

## Ready-to-use names — owner note 2026-10-14

For user-named artifacts such as reports, templates and copies, provide an
editable, populated suggestion plus a matching placeholder. Most operators
should be able to accept it without typing. A cleared/whitespace-only name
uses the suggestion; generated copy/template names avoid collisions. Preserve
names the operator has edited. Naming dialogs may focus their confirmation
button so keyboard entry is optional. Apply this to generated artifact names;
identity and catalog values still follow their own business contracts.
This records the owner's naming preference, not acceptance of every candidate
screen. See [report naming behavior](STORE_REPORTS_DESIGN.md).

## Product intent and continuity

**Durable principle.** Make the next operational task and its state clear before
adding ornament. Evolve familiar KPH names, task landmarks, and sequence so a
returning operator can work inside the Store App without relearning the whole
application at once. User guidance and training material can reveal migration
costs, but is evidence rather than a UI contract; no such material is in this
repository yet.

**Implementation freedom.** The shell, navigation, screen and dialog boundaries,
component hierarchy, responsive composition, and visual treatment can change.
Familiarity does not require preserving the current long modal, tabs, membership
dropdown, or Pilot local authority.

## Shared shell and operational context

**Durable principle.** KPH is a named capability within a small authenticated
Store App shell. Keep direct entry to TPCN, TPTS, and history; common KPH work
must not require a mandatory overview or module detour. Show the acting account
and current operational store during work, then make the relevant actor, store,
and outcome explicit at create submission, review, and export. A context control
helps navigation; backend authorization and effective scope remain authoritative.

**Implementation freedom.** Context placement, navigation controls, and the
amount of persistent detail can respond to viewport and task. Add destinations
as capabilities become real; do not turn future modules into operable routes.

**Open dependency.** Effective-store and capability discovery for inherited
region/chain managers is unresolved. Use only currently valid account/store data;
the session's membership-only store list does not describe all effective access.
This principle does not specify a discovery API or selector policy.

## KPH creation and state

**Durable principle.** Preserve the recognizable TPCN/TPTS choice, scan or manual
lookup, details, ordered photo evidence, and review/submit boundary. Prefer a
continuous composition for the first Store App slice. Keep `FOUND` (one current
published product), `NOT_FOUND` (retain the code; permit rescan or manual entry
without inferring a product), and `CATALOG_UNAVAILABLE` (service recovery rather
than a product miss) distinct. Name busy, error, and review eligibility states
with understandable next actions; color alone cannot carry their meaning.

**Implementation freedom.** Sections, progress cues, scanner/dialog boundaries,
and exact state copy remain designable. A different creation sequence needs
observed task evidence and must preserve recovery across camera, keyboard, photo,
and back navigation.

**Durable principle.** One to three photos remain visibly counted, ordered, and
inspectable during capture and review. Online original and stamped derivatives
remain private; a client stamp must not be presented as the audit authority.
Thumbnail, viewer, and desktop pane choices remain designable.

## History, review, and export

**Durable principle.** Keep the filter, page, selection, review, and export mental
model. The accepted [D01 history contract](HISTORY_PAGING_CONTRACT.md) governs
filter/sort before paging, 1-based page state, page-local selection, reset rules,
counts, and busy feedback. Show review status and export eligibility before
consequential action; confirmation should make store, type, selected eligible
count, and exclusions understandable. Export remains limited to selected,
in-scope `SUBMITTED + APPROVED` records of one type.

**Implementation freedom.** Desktop can use dense comparison; mobile should lead
with decision-critical facts and a clear return to the same filtered page after
record detail. Tables, cards, filter surfaces, and action placement may differ
while expressing the same semantics.

## Responsive and brand character

**Durable principle.** Mobile favors focused task completion, reachable controls,
one-hand use across keyboard, camera, and photo inspection. Interruptions and
returns to the task should have a clear recovery path. Desktop may show more
comparison density. Both retain the same business states and scope. The Co.op
Food character should feel fresh, welcoming, legible, and operational. The
owner accepted the green header, white content, pastel task cards, round icons
and food decoration on Home on 2026-10-11. Task screens inherit the visual
language with less ornament and a compact header.

**Implementation freedom.** Use the accepted Home palette and usage rules in
[Visual DNA](STORE_APP_VISUAL_DNA.md) for Store PWA presentation; preserve
business status colors and labels. The food basket and handwritten slogan belong
to Home, while forms, tables and dialogs favor readable operational content.
Component APIs and task-specific composition remain designable. This acceptance
establishes an app visual direction, not an official corporate brand manual.

**Open dependencies.** Approved brand/logo guidance, representative operator
feedback, and real-device observations are still needed before settling
corporate brand rules or changing familiar task steps. Home now has explicit
owner visual acceptance; other screens, real-device behavior and production
workflow need their own evidence.

Source trail: [R1-D01 audit](../evidence/r1-d01-ui-dna-audit.md),
[R1-D02 comparison](../evidence/r1-d02-evaluation-and-directions.md), and
[R1-D03 convergence](../evidence/r1-d03-ui-dna-convergence.md).


## Candidate: Dropdown và thao tác tập hợp — 14/10/2026

RPT01 revision 8 bổ sung Select/Menu primitive chung, áp trước tại Báo cáo.
Select giữ một giá trị, action menu chạy thao tác; dùng đúng role và primitive,
không dùng select cho lệnh tức thời. Mọi trigger có tên accessible, lựa chọn
selected/check và focus rõ. Portal giữ theme và tự đổi phía/cuộn theo viewport.

Chọn nhiều phải nêu phạm vi: master ba trạng thái cho phần đang xem, menu tách
thao tác đang xem với toàn tập phù hợp. Không để “chọn tất cả/bỏ chọn” mơ hồ
khi đang tìm; selection ngoài query được giữ nếu contract feature cho phép.
Contract KPH online vẫn page-local/reset riêng.

Nhóm CTA cần dùng khi cuộn có thể dùng StoreActionDock: một bộ nút, nổi khi
chưa tới vị trí tự nhiên, inline tại cuối nội dung; trên toolbar/safe-area,
chừa khoảng cho nội dung và focus, cho phép reflow/resize. Summary ngắn; không
nhân đôi controls hoặc neo mọi button. Consumer đầu là Lưu mẫu/Tạo báo cáo.
[Catalog/API](STORE_APP_COMPONENT_CATALOG.md), [bàn giao](../delivery/rpt01-report-design/handoff.md).
Đây là candidate mới, chưa thay trạng thái owner acceptance của các feature cũ.


## Candidate: Cụm điều khiển tham khảo — 18/10/2026, revision 14

StoreSearchField, StoreSettingsGroup/Row và StoreChoiceSheet dùng cùng Fresh
roles/type/touch size, có consumer thật trong báo cáo. Choice sheet chỉ cuộn
list, không trôi search/footer; cancel/apply/focus/clear là contract có test.
Đổi mẫu và Info gom vào navigation, tên mẫu đầy đủ và page cuộn native.
[API và mẫu dùng](STORE_FORM_CONTROLS.md) để feature khác tham khảo; không
suy quyền rollout hoặc owner acceptance của trang khác.

## Candidate: Báo cáo dựng lại — 18/10/2026, revision 13

R12 bị owner loại bỏ. R13 bỏ tab và bố cục nắp của composer: trang trắng
bình thường dưới shell hiện có, title/search, một group thiết lập và danh mục.
Đổi mẫu qua sheet tìm kiếm/radio/Dùng mẫu; Hủy không sửa draft. Không gesture
ẩn, sticky hero, blur hoặc animation mới. Fresh token/type/touch size giữ
nhất quán app; chi tiết theo modal, không bọc nhiều khung. History/snapshot
còn pattern cũ; không suy acceptance cho r13 từ kiểm tra kỹ thuật.
[Thiết kế](STORE_REPORTS_DESIGN.md), [bàn giao](../delivery/rpt01-report-design/handoff.md).

## Candidate: Báo cáo tối giản — 18/10/2026, revision 12

Tên mẫu và tìm kiếm tích hợp trên xanh; không chọn mẫu ở hero. Thanh đổi mẫu
mỏng trên trắng chỉ vài tab nhanh, Xem thêm mở menu đầy đủ. Kỳ/lọc/nhóm DATE
gom một cụm, danh mục hàng phẳng/hairline và checkbox, không bọc nhiều khung.
Giữ Fresh typography/token/44–48 px touch target, nút neo dùng chung và thông
tin chi tiết trong modal. Apple-like ở phân cấp/spacing/disclosure, không thêm
font, blur/glass hoặc bộ theme khác. Composer không có vuốt để ẩn. Các mốc
r9–r11 bên dưới ghi lịch sử; bố cục r12 là candidate mới chờ owner xem.
[Thiết kế](STORE_REPORTS_DESIGN.md), [bàn giao](../delivery/rpt01-report-design/handoff.md).

## Candidate: Nền xanh và nắp báo cáo — 14/10/2026

Owner tạm đạt cụm dropdown/chọn/neo r8, yêu cầu r9 dùng hướng nắp của Home/Login.
R10 giữ control mẫu có nhãn/icon/viền trên nền xanh; kỳ/ngày chốt chuyển lên
đầu nắp trắng, cùng body danh mục. Nắp trắng
radius 26 overlap 24. Lịch sử cùng pattern; menu chọn loại vẫn trắng, các mục
r11 dùng nền màu liền khối và icon tròn đậm như Home. Composer bỏ grip và mọi
listener pull-down; chỉ cuộn native, dùng nút “Chọn mẫu khác” để về menu.
History/snapshot vẫn có grip 44 px/button/keyboard và pull-down.

Motion dùng transform/opacity, tôn trọng reduced motion, không animate height/
layout hoặc blur. Không giữ bản nội dung trùng phía sau và không dựng lại list
trong touchmove. Khi scale inventory, tách tập dữ liệu/selection/export khỏi
số row screen; kiểm print đủ dữ liệu trước khi chấp nhận giới hạn render.
[Thiết kế](STORE_REPORTS_DESIGN.md), [bàn giao](../delivery/rpt01-report-design/handoff.md).
Technical gate không thay nghiệm thu hình ảnh/gesture trên thiết bị thật.
