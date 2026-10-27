# Nhập sản phẩm/lô vào theo dõi DATE — đề xuất28/10/2026

Trạng thái: **chuẩn bị để triển khai**, chưa là contract nghiệp vụ/API accepted.
Yêu cầu owner: “chuẩn bị cho phần nhập theo dõi date mới để nhập sản phẩm date
vào theo dõi”. Vòng này chuẩn bị luồng, dữ liệu và tiêu chí kiểm; chưa thêm chức
năng lưu vào app. NOTIF01 vẫn là candidate chưa nghiệm thu; MOTION01 đã accepted.

## Mục tiêu và đợt đầu đề xuất

Từ DATE, người dùng thêm **một lô của một sản phẩm** vào danh sách theo dõi của
cửa hàng hiện tại. Một SKU có thể có nhiều lô/ngày; thêm theo dõi không tạo sản
phẩm catalog, phiếu KPH hay một giao dịch nhập kho.

Đợt đầu ưu tiên nhập từng lô bằng quét barcode, nhập barcode hoặc SKU chính xác.
Tái dùng Store Fresh/form hiện có; prototype dùng cùng nguồn dữ liệu trong phiên
với DATE/Thông báo/Báo cáo. Nhập Excel, OCR/đọc ngày từ ảnh, số lượng tồn và lưu
bền vững online là các slice khác; đây là đề xuất phạm vi, không phải kết luận
owner đã loại các nhu cầu đó.

## Hiện trạng đã kiểm

| Phần | Bằng chứng | Hệ quả cho triển khai |
| --- | --- | --- |
| Danh sách DATE | [DateWorkspace](../../apps/store-pwa/src/store-date-workspace.tsx) nhận `lots/onLotsChange`, đã có tìm/quét, loại hàng, filter và sheet chi tiết | Gắn entry tại DATE; tìm/quét hiện tại vẫn có nghĩa tra cứu danh sách, không tự thêm lô |
| Nguồn dữ liệu | [StoreApp](../../apps/store-pwa/src/store-app.tsx) sở hữu state lô và truyền chung sang DATE/Thông báo/Báo cáo | Chỉ commit một lần vào nguồn chung sau khi lưu thành công; không tạo list riêng trong form |
| Lô mẫu | [MockDateLot](../../apps/store-pwa/src/store-app-mock.ts) có `id/name/sku/date/manufactured?/status`, chưa có quantity/product snapshot/batchCode riêng | Không ép model mẫu thành contract mới; tách ID theo dõi và mã lô thực trước khi dựng input |
| Phân loại/liên kết KPH | [store-date-actions.ts](../../apps/store-pwa/src/store-date-actions.ts) lấy catalog metadata explicit theo SKU | Lô nhập tay mới cần mang loại/source explicit hoặc giữ Chưa phân loại; không suy loại từ tên |
| Tra sản phẩm online | [OpenAPI](../../contracts/openapi/kph.openapi.yaml), `GET /api/v1/catalog/barcodes/{barcode}` trả0/1, có `storeId`/membership check | Chưa có endpoint tìm SKU/tên hoặc tạo DATE. Không đưa SKU vào barcode endpoint rồi giả định semantics giống nhau |
| Tính ngày | [rule ngày](../../packages/kph-rules/src/date.ts), [assessment DATE](../../apps/store-pwa/src/store-date-assessment.ts) | Tái dùng parser/calculator/phase/%; không viết công thức riêng cho form |

Prototype hiện memory-only; reload mất thay đổi. PostgreSQL/backend vẫn là
source of truth của online theo [baseline](../STORE_APP_BASELINE.md),
[contract index](STORE_APP_CONTRACTS.md) và [ADR0006](../adr/0006-store-app-evolution.md).
Quyền KPH kế thừa không tự cấp quyền tra catalog hoặc tạo DATE.

## Luồng thao tác đề xuất

**DATE → Thêm theo dõi → tìm/quét sản phẩm → nhập thông tin lô → xem mốc → thêm.**

1. Nút **Thêm theo dõi** trong vùng thao tác DATE, dùng cùng nút/form đã chốt;
   không đổi chức năng nút Tìm hoặc scan đang tra lô.
2. Mở form riêng, ba nhóm trong một form: **Sản phẩm / Thông tin lô / Mốc DATE**.
   Ưu tiên dùng page kit cho form đầy đủ trên mobile, CalendarInput và footer
   hiện có; không chồng form tạo lên sheet chi tiết hoặc scanner còn mở.
3. Quét/nhập mã. Đang tra có phản hồi rõ và giữ kích thước control. Chỉ kết quả
   của request mới nhất được áp dụng; đổi mã làm kết quả cũ hết hiệu lực.
4. FOUND: hiện tên/SKU/barcode và loại/đơn vị đã biết để đối chiếu. Có **Đổi sản
   phẩm**. Không tự ghi một sản phẩm chỉ vì vừa quét thành công.
5. NOT_FOUND: giữ nguyên mã; có **Quét lại**, **Nhập mã khác**, **Nhập tay**.
   Nhập tay giữ provenance NOT_FOUND, không tạo catalog hoặc suy tên/SKU/loại.
   Lỗi catalog có trạng thái riêng, **Thử lại** và đường nhập tay explicit;
   không đổi503/thất bại mạng thành NOT_FOUND.
6. Nhập lô/ngày. Mốc preview chỉ hiện khi dữ liệu đủ/hợp lệ; ngày dở dang giữ
   nguyên để sửa, không bị picker hoặc phép tính ghi đè. Không điền ngày hôm nay
   vào NSX/HSD để làm form có vẻ đầy đủ.
7. **Thêm theo dõi** kiểm lỗi/trùng, có trạng thái đang lưu, chống double submit.
   Lỗi giữ draft; thành công mới thêm một lô, thông báo kết quả và đưa đúng lô
   vào vùng xem được của DATE. Điều chỉnh tab/filter chỉ đủ để thấy lô vừa thêm,
   không reset toàn app hoặc làm nhảy header.
8. Nếu cần nhập tiếp, đề xuất **Thêm lô khác** sau thành công: giữ sản phẩm đã
   xác nhận, xóa mã lô/NSX/HSD của lượt cũ. Không vô tình dùng lại ngày của lô cũ.

Mở scanner có đường nhập tay khi từ chối quyền; đóng scanner trả focus và draft.
Hủy form chưa lưu không thay list/count/nhắc. Draft có thay đổi cần hành vi đóng
rõ ràng để tránh mất dữ liệu; dùng primitive focus/dialog hiện có, không tự viết
focus trap. Form có label thật, lỗi cạnh field + focus lỗi đầu tiên, target≥44px,
footer không che field khi bàn phím mở, chữ200% được wrap.

## Trường dữ liệu và cách biểu đạt

| Trường | Đề xuất đợt đầu | Nguồn/validation |
| --- | --- | --- |
| Cửa hàng | Hiện context hiện tại, không nhập lại mỗi lô | Online phải lấy scope được server kiểm; không tin storeId của client |
| Tên sản phẩm | Bắt buộc | FOUND lấy từ kết quả; nhập tay người dùng xác nhận, không tạo catalog |
| SKU | Chuỗi bắt buộc cho đề xuất V1 | Giữ số0 đầu; không sinh SKU giả. Nếu thực tế cần theo dõi hàng chưa có SKU phải chốt nhánh nhận dạng riêng |
| Barcode | Giữ mã đã quét/nhập; có thể chưa có ở nhánh nhập tay | Chuỗi; không parse thành số hoặc mặc định barcode=SKU |
| Loại hàng | Metadata explicit; nếu chưa biết giữ Chưa phân loại | Không suy TPCN/TPTS từ tên/mã. Nếu người dùng chọn loại thì lưu nguồn lựa chọn để DATE/KPH dùng nhất quán |
| Mã lô thực tế | Đề xuất không bắt buộc | Chuỗi người dùng đọc trên hàng; tách khỏi ID nội bộ. Không bắt người dùng nghĩ mã lô giả |
| NSX | Bắt buộc trong luồng chuẩn; nhánh chưa có NSX là điểm cần chốt bên dưới | Nhập dd/mm/yyyy, parse thành LocalDate; không suy ngược từ %/lô khác |
| HSD | Bắt buộc | Ngày có thật; khi có NSX, HSD phải lớn hơn NSX |
| Số lượng/đơn vị tồn | Đề xuất chưa nhập trong V1 | Catalog unit là thông tin sản phẩm, không tự biến thành đơn vị tồn. Chưa có định nghĩa quantity; không mặc định0 hoặc1 |
| Mốc/phase/% | Chỉ đọc, tính từ rule chung | Không cho nhập sửa % hoặc chọn nhãn để thay ngày |

Thiếu NSX trong dữ liệu hiện tại đã có semantics: HSD vẫn được giữ; chưa qua
HSD thì Thiếu NSX, qua HSD thì Hết HSD, không có %/timeline/mốc suy diễn. Điều đó
**không tự quyết định** có cho tạo lô mới thiếu NSX hay không.

## Bất biến và tình huống cần giữ

- Ngày dd/mm/yyyy; ngày nghiệp vụ Asia/Ho_Chi_Minh, online date/LocalDate.
  `shelfLife = HSD - NSX + 1`; HSD≤NSX hoặc ngày không tồn tại là lỗi chặn lưu.
- Dưới10ngày: hạn lùi=HSD, không mốc cảnh báo riêng. Từ10ngày: offset lùi
  round20%, cảnh báo HSD−round40%. Cùng fixture/calculator Tra hạn; % chỉ trình bày.
- Ngày đã quá HSD hoặc NSX ở tương lai có phase hiện có. Đề xuất cho theo dõi
  sau khi nêu rõ tình trạng; không âm thầm đổi ngày, tự tạo KPH hoặc coi là lỗi
  cú pháp. Chính sách tạo mới cho hai trường hợp này cần owner xác nhận.
- Lô mới đề xuất `Mở`, chưa hẹn báo lại, chưa liên kết KPH. Thông báo sinh từ
  phase/ngày hiện hành; lô an toàn không có cảnh báo giả vì vừa được thêm.
- Nhắc1/7ngày, resolved chỉ sau tạo KPH thành công, và ngày nghiệp vụ giữ cơ chế
  hiện có. Sửa/tạo draft không làm đổi lô cũ. Snapshot báo cáo đã lưu không đổi.
- Không đính kèm ảnh giả, không tự lấy quantity của KPH làm tồn DATE và không
  kế thừa persistence IndexedDB của Pilot vào Store App online.

## Nhận dạng, trùng và retry — đề xuất cần chốt

**ID theo dõi** là định danh hệ thống, không phải barcode/SKU/mã lô. Mã lô
thực tế là field riêng, có thể không có theo đề xuất. Khi không có mã lô, UI
đối chiếu SKU + NSX/HSD; không lộ UUID như một mã lô do người dùng nhập.

Trước khi lưu, tìm ứng viên trùng trong cùng cửa hàng/sản phẩm và NSX/HSD;
nếu có mã lô thì đối chiếu thêm mã lô. Đây là cảnh báo ứng viên, **chưa là
unique constraint** vì cùng SKU/ngày có thể thuộc các lô vật lý khác nhau.
Đề xuất hiện bản đang theo dõi với **Xem lô đã có / Quay lại chỉnh**; không tự
gộp, cộng số lượng, ghi đè hoặc mở lại lô resolved. Có cho **Thêm lô riêng**
khi trùng ngày hay không cần chốt trước implementation lưu.

Mỗi payload đã xác nhận có request key ổn định cho lần submit/retry nguyên vẹn.
Sửa payload sau khi đã gửi không tái dùng key cũ; khi chưa rõ lần trước đã lưu
hay chưa phải đối chiếu kết quả trước khi tạo lượt gửi mới. Prototype chống
double-click trong nguồn state dùng chung;
online cần idempotency/transaction/backend recheck thật, không coi disable nút
hoặc lookup trước lưu là bảo đảm chống trùng giữa nhiều thiết bị.

## Các quyết định còn mở

| Cần chốt trước phần tương ứng | Đề xuất để bắt đầu | Ảnh hưởng |
| --- | --- | --- |
| Có nhận lô mới chưa có NSX? | Luồng chuẩn yêu cầu đủ NSX/HSD; nếu cho thiếu thì explicit “Chưa có NSX”, giữ semantics hiện có | Validation và nhánh preview |
| Có cần số lượng tồn ngay ở đợt đầu? | V1 theo dõi ngày trước; không ghi quantity giả | Nếu cần: định nghĩa đơn vị, số lẻ, cập nhật/chênh lệch và snapshot trước form/API |
| Trùng cùng SKU/ngày nhưng khác lô vật lý xử lý thế nào? | Cảnh báo ứng viên, không gộp tự động; mã lô thực tế tách riêng | Model/constraint/flow lưu và đồng thời |
| Mã lô thực tế có bắt buộc không? Có hàng chưa có SKU không? | Mã lô tùy chọn, SKU bắt buộc V1 | Nhận dạng/search/detail/KPH; không dùng placeholder làm dữ liệu thật |
| Lô đã quá HSD/NSX tương lai có được nhập mới? | Cho theo dõi kèm cảnh báo rõ, không tự KPH | Validation nghiệp vụ tạo mới |
| Ai được tạo/sửa online và store scope nào? | Chưa suy từ role KPH; xác định policy DATE riêng | Bắt buộc trước contract/API/migration online |

Các mục trên là quyết định sản phẩm được ghi lại để triển khai đúng; chuẩn bị
spec này không tự đổi contract accepted. Có thể dựng form/fixture trước khi
backend sẵn sàng, nhưng nhánh lưu chưa được chốt phải được biểu đạt minh bạch.

## Chia slice thực hiện và vị trí tích hợp

1. **Fixture/model + form mock từng lô.** Sau khi chốt nhánh V1, thêm draft/schema
   và fixture ngày/nghiệp vụ; form đề xuất `store-date-intake.tsx` dùng CalendarInput,
   RHF/Zod, scanner, StoreSearchField và nút/footer hiện có. Cập nhật model view
   khi cần tách batchCode/snapshot/kind, không mở abstraction domain xuyên stack.
2. **Commit vào theo dõi + kiểm liên thông.** StoreApp là owner state; DateWorkspace
   mở entry và reveal đúng ID. Adapter dateLotKind/dateLotKphSeed đọc metadata
   explicit của lô mới, giữ fallback fixture cũ; search/detail/accessibility dùng
   ID và mã lô riêng đúng vai trò. Thông báo và báo cáo đọc cùng nguồn, giữ snapshot.
3. **Online sau contract.** Chốt permission/duplicate/quantity/persistence trước;
   OpenAPI + examples + generated client cùng slice. Spring modular monolith và
   PostgreSQL; migration mới, server validate scope/date/catalog/idempotency,
   cross-store/cross-region deny tests theo policy DATE được chốt. Không thêm
   queue/Redis/search engine. Backend và frontend có thể làm song song theo contract.

## Tiêu chí kiểm trước khi đưa bản nhập mới cho owner

| Tình huống | Kết quả cần thấy |
| --- | --- |
| Quét FOUND, nhiều request trả khác thứ tự | Chỉ sản phẩm của mã hiện tại được xác nhận; số0 đầu còn nguyên |
| NOT_FOUND hoặc catalog lỗi | Mã/draft còn; scan lại/nhập tay/thử lại có đường rõ, không sản phẩm suy đoán |
| Ngày dở dang/31-02/HSD=NSX/HSD<NSX | Giữ input, lỗi đúng field, chưa thêm lô |
| Dưới10ngày/đúng10ngày/năm nhuận/ngày HSD | Fixture dùng cùng rule Tra hạn; không lệch ngày hoặc suy phase từ % |
| Thiếu NSX nếu được cho phép | Không tạo NSX/%/mốc giả; phase HSD đúng semantics đã có |
| Cùng SKU nhưng khác HSD hoặc mã lô | Không ghi đè lô cũ; xử lý theo duplicate policy đã chốt |
| Bấm lưu hai lần/retry | Một kết quả cho cùng request key; lỗi vẫn giữ draft |
| Hủy/đổi sản phẩm/đóng scanner | Không thay list/count; focus quay đúng vị trí; ngày lô cũ không lọt sang sản phẩm mới |
| Lưu lô mới thành công | Đúng tab/filter/ID được nhìn thấy; Mở; alert/count theo phase thật; report lịch sử không đổi |
| Từ lô mới sang KPH, cancel/lỗi/thành công | Đúng SKU/kind/source; chỉ thành công mới resolved, không mất lô do lỗi |
| Mobile/desktop/chữ200/reduced-motion | Playwright390×844 và1440×1024; DOM/interaction/screenshot, không overflow hoặc footer che field; không đoán FPS thiết bị thật |
| Online khi triển khai | Test backend scope/date/idempotency và E2E với dữ liệu tổng hợp; không gọi mock là bằng chứng online |

Bước nhỏ tiếp theo: dựng slice1 form mock theo các quyết định V1 đã được chốt,
trên nhánh task riêng. Thiết kế giữ header xanh/page kit/motion accepted và các
mẫu input mới; không quay lại cấu trúc form/chrome cũ.
