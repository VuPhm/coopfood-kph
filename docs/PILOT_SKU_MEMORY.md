# Pilot Pages — gợi nhớ tên hàng và nhà cung cấp theo mã

Yêu cầu và xác nhận phạm vi: 21/10/2026. Nhánh `codex/github-pages-pwa`,
worktree `0cc0`. Baseline `0c42b31` đã gồm fix ngày khóa Android chưa deploy;
tính năng mới được commit riêng, không sửa lại lịch sử.

## Quy tắc đã chọn

- Chỉ nhớ **tên hàng + nhà cung cấp**, theo toàn bộ mã SKU/UPC và loại TPCN/TPTS.
  Trim khoảng trắng hai đầu; giữ số 0 đầu, phân biệt chữ hoa/thường. Không dùng
  prefix, không biến mã cân khác trọng lượng thành cùng sản phẩm.
- Dùng phiếu đã lưu gần nhất theo createdAt, còn trong lịch sử và không bị
  Không duyệt. Với legacy thiếu timestamp, giữ record đầu trong thứ tự hydrate
  khi hòa. Không học từ nhãn sinh tự động `Sản phẩm <mã>` hoặc `Chưa nhập nhà
  cung cấp`, mã `NHẬP TAY`, mã rỗng hay nội dung legacy quá giới hạn field.
- Cặp giá trị lấy từ cùng phiếu; không lấy bù dữ liệu cũ nếu bản mới đã xóa
  tên/NCC. Xóa phiếu/đổi trạng thái có thể đổi nguồn nhớ về phiếu hợp lệ trước đó.
- Nhập tay: hoàn tất khi blur hoặc dừng gõ 500ms. Scanner: hoàn tất ngay khi
  trả mã. Enter/submit cũng hoàn tất trước validation để không lưu sớm khi timer
  chưa chạy. Các đường dùng cùng handler với parser trọng lượng TPTS hiện có;
  submit không cân lại số lượng đã được sửa tay.
- Chỉ điền field đang trống. Giữ giá trị người dùng nhập/sửa tay, kể cả chủ động
  xóa field khi đang dùng cùng mã. Khi đổi mã, thay/xóa field đã được tự điền;
  field sửa tay được giữ. Có status note và aria-describedby chỉ rõ field đã nhớ.
- Không sao chép ngày, số lượng, đơn vị, tình trạng, biện pháp, người, ảnh hay
  ghi chú từ phiếu cũ. Mã TPTS `29` vẫn tự nhận kg theo rule riêng; thao tác sửa
  số lượng/đơn vị trong lúc chờ debounce không bị cân tự động ghi đè.

## Lưu trữ và hiệu năng

Không thêm storage hoặc migration. Sau khi hydrate, App xây Map metadata từ
lịch sử hiện có bằng useMemo; mỗi lần hoàn tất mã tra Map trực tiếp. Không đọc
IndexedDB/ảnh theo từng phím gõ, không tạo URL ảnh hoặc tải catalog. Bộ nhớ chỉ
được cập nhật sau khi lưu thành công vì App chỉ thêm record sau transaction.
Hủy form hoặc lưu lỗi không tạo dữ liệu nhớ mới; bản nháp lỗi vẫn được giữ.

Đây là gợi nhớ dữ liệu người dùng đã khai báo trên cùng browser/device, không
phải catalog published, không khẳng định FOUND và không đồng bộ giữa thiết bị.
Danh sách phiếu có thể chứa dữ liệu của cấu hình cửa hàng trước đó trên chính
thiết bị (giới hạn hiện có của pilot), nên đây không phải bộ nhớ tenant/store
được backend xác thực. Không thay API, schema DB, codec ảnh hay Pages config.

File đổi: `app.tsx`, `create-record-dialog.tsx`, `barcode-scanner-dialog.tsx`,
thêm `sku-memory.ts`, `sku-memory.test.ts`, `create-record-sku-memory.test.tsx`,
`app-sku-memory.test.tsx` trong `apps/store-pwa/src/`; cập nhật ngoại lệ pilot
trong `docs/product/DOMAIN_RULES.md` và tài liệu này.

## Kiểm chứng

- Thêm 34 cases: exact code/kind/leading zero; latest/correction/blank/placeholder;
  trash/rejected/legacy malformed metadata; 1000 record không đọc ảnh; manual
  pause/blur và scanner; giữ/sửa/xóa field tay; code lạ; mã cân khác; hủy timer
  khi đóng/đổi kind/unmount; lưu thật và hydrate lại IndexedDB; cancel/save lỗi;
  submit trước blur/debounce trên cả hai loại.
- `npm --workspace @coopfood-kph/store-pwa test`: **306 tests / 29 files pass**.
- `npm run build`: pass; build Pages base `/coopfood-kph/`: pass. Cảnh báo chunk
  ExcelJS có sẵn không đổi. Initial PIN entry vẫn ~336.57KB; phần tính năng
  nằm trong workspace tải sau mở khóa.
- `npm run check:docs`, `git diff --check`: pass.
- Production preview riêng `127.0.0.1:5193/coopfood-kph/`: lưu phiếu TPCN tổng
  hợp mã `000123` có tên/NCC và PNG, reload/mở PIN, nhập lại mã → hai field được
  điền đúng và có ghi chú nguồn. Đổi mã `000999` giữ tên sửa tay, xóa NCC tự điền;
  TPTS cùng mã `000123` không lấy TPCN; mã `2912345612345` vẫn ra `1.234 kg`.
- Kiểm lại final bundle `index-D4J_k90V.js` sau silent update ở màn PIN: nhập
  lại mã sau reload vẫn tự điền hai field và ghi chú nguồn đúng.
- Mobile 375×812, 320×568 và landscape 667×375: helper text không cắt/tràn ngang;
  section lấy đủ chiều cao nội dung, form cuộn được. Ảnh bằng chứng ngoài Git:
  `/tmp/kph-sku-memory-mobile.png`. Toàn bộ dữ liệu/ảnh thử là tổng hợp.

## Giới hạn / tiếp theo

Chưa kiểm camera hoặc Android/iOS thật cho tính năng này. Bước tiếp theo: thử
nhập/quét mã đã từng lưu trên thiết bị pilot, xác nhận thông tin gợi nhớ và sửa
NCC nếu đã thay đổi. Rollback revert riêng tính năng, không reset IndexedDB;
giữ fix ngày khóa `0c42b31` và các codec ảnh đã có.

## Round rà an toàn bổ sung — 21/10/2026

Rà cả candidate ngày khóa `0c42b31` và SKU memory `34f9d28`, vẫn trên đúng
worktree/branch, chưa push/deploy.

- Tái hiện được lỗi: sau khi sửa tay số lượng/đơn vị của mã cân TPTS, blur lại
  ô mã sẽ cân lại và ghi đè phần sửa tay. Hai regression tests thất bại trước
  patch (nhận `1.234` thay vì `7,5`), cả lúc timer đang chờ và đã hoàn tất.
- Fix chỉ ở handler blur, dùng cờ bảo vệ sửa tay đã có. Cùng mã giữ số lượng/
  đơn vị sửa tay; nhập mã mới hoặc scanner trả mã vẫn trích xuất ngay theo
  đường xử lý chung. Tên/NCC vẫn được gợi điền khi blur. Không đổi JSX layout,
  schema, validation số lượng > 0, storage hay Pages configuration.
- Thêm 12 cases: hai đường ghi đè trên; đổi mã/quét lại; sửa riêng đơn vị;
  gõ tiếp trước debounce; giữ sửa/xóa chủ động khi đóng/mở lại; hai loại form
  lưu lỗi rồi retry thành công và hydrate lại bằng IndexedDB thật trong test;
  nguồn mới hơn bị trash/rejected sau hydrate; formatToParts khác thứ tự,
  literal locale và padding. Không dùng dữ liệu hoặc ảnh vận hành.
- File sửa trong round này: `create-record-dialog.tsx`,
  `create-record-sku-memory.test.tsx`, `app-sku-memory.test.tsx`,
  `business-date.test.ts` trong `apps/store-pwa/src/`, và tài liệu này.
- `npm test`: pass toàn bộ workspace (**347 tests**, riêng Store PWA **318
  tests / 29 files**). `npm run build`: pass. Build Pages base `/coopfood-kph/`:
  pass, entry `index-DDVM3pqW.js`, workspace `workspace-BWO68BEB.js`; CSS không
  đổi. Cảnh báo chunk ExcelJS và experimental localStorage của Node đã có sẵn.
- `npm run check:docs`, `git diff --check`: pass. Round này không thêm kiểm
  chứng camera hoặc thiết bị thật; kết quả browser của round trước vẫn ghi ở
  phần kiểm chứng phía trên, không gộp thành kiểm chứng bản build mới.

Giữ giới hạn cần kiểm Android/iOS thật đã nêu trên. Bước nhỏ tiếp theo: trên
thiết bị pilot, nhập/quét mã đã nhớ, sửa số lượng/NCC, blur lại mã rồi lưu và
mở lại để xác nhận bản lưu. Không coi test mô phỏng là đã xác nhận máy thật.
