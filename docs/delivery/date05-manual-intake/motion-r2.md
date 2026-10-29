# DATE05 revision2 — panel nhập xuất hiện liền mạch

Owner tại4398/#date yêu cầu sửa Thêm theo dõi nhảy giao diện. Cùng worktree và
writer DATE05. Technical PASS; owner acceptance pending, không merge/push/deploy.

Đổi `store-date-workspace.tsx`: import form cùng DATE thay lazy boundary có
fallback `<p>` trong layout trang; bỏ đổi bố cục trung gian. Scanner và catalog
vẫn như r1. Trả focus về nút+ với preventScroll khi đóng. Đổi
`store-date-intake.css`: panel trượt toàn chiều cao từ đáy bằng transform260ms,
không fade/translate24px như popup; giảm chuyển động tắt animation. Giữ vùng
mốc tối thiểu82px trước/sau nhập ngày, tránh đẩy phần bổ sung.

Đã đo scroll128px trong ca locator tự scroll khi click lúc trang đang arrival;
tap tọa độ thật không tái hiện delta đó. Không dùng delta này làm bằng chứng lỗi
sản phẩm đã sửa. Gate mới dùng tọa độ thực sau khi trang ổn định, kiểm nền giữ
nguyên, chiều rộng/chiều cao panel ổn định trong toàn animation, bottom đúng
viewport, focus trả nút+, preview không đổi cao. Bỏ lazy fallback loại trừ một
nguồn đổi bố cục lúc tải đầu. Không thêm dependency hay animation per-frame ở
runtime. Form tải cùng module DATE; tradeoff là thêm code vào chunk DATE thay
một request lúc mở.

Kiểm tra trên source candidate ghi trong plan:

- `VITE_STORE_APP_MOCK=true npm run build --workspace @coopfood-kph/store-pwa`:
  PASS, gồm TypeScript. Cảnh báo chunk lớn có sẵn.
- `npm run test --workspace @coopfood-kph/store-pwa -- --maxWorkers=2 src/store-date-intake.test.tsx src/store-date-workspace.test.tsx`:
  PASS2files/14tests.
- `node e2e/scripts/check-date05-manual.cjs`: PASS390×844,1440×1024,320×740,
  844×390; manual/choice/scan/denied/preview/invalid/text200 giữ đúng.
- `node e2e/scripts/check-date-intake-motion.cjs`: PASS390×844 và1440×1024,
  normal/reduced motion; mỗi ca3lần mở/đóng với scroll0/80/0, kiểm tọa độ từng
  frame, focus và vùng preview. Screenshot ở `/tmp/date06-motion/`.
- `npm run check:docs`, `git diff --check`: PASS.

Kết quả motion tại [motion-results-r2](motion-results-r2.json). KPH/backend/API
không đổi từ r1; unit311Store/17UI và KPH tap gate tại sourceffecd38 được tái sử
dụng, xem [r1](technical.md). Không chạy lại full suite vì sửa chỉ composition
và CSS DATE, đã chạy targeted unit và browser trên bản mới.

DATE vẫn trong phiên; camera dùng mô phỏng trong gate, chưa thiết bị thật.
Bước nhỏ tiếp: owner mở/đóng+ ở4398/#date và nhập hai ngày để xem độ liền mạch.
