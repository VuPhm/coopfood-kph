# Checkpoint KPH nhãn màu — owner accepted 12/10/2026

Owner xác nhận **“đạt, checkp, nhân bản”**, rồi chọn **“Toàn bộ nhãn màu và
thanh nhãn”** trong chat ngày 12/10/2026. Bản KPH được chốt gồm ba nhãn chữ/icon,
palette choice từ KPH_OPTIONS và thanh cạnh trái 3×36px mobile / 3×24px desktop,
inset 12px. Selection giữ rãnh checkbox 44px và khoảng cách tối thiểu 12px.

Checkpoint local trên `store-app/figma-mobile-implementation`, worktree
`/Users/vup/Documents/coopfood-kph`, parent `c6d9fa5`. Commit chứa primitive UI,
adapter/list/form/skeleton KPH, sort phụ thuộc và các script kiểm KPH. WIP DATE
và tài liệu chung chưa chốt vẫn ở working tree, không nằm trong checkpoint này.

Kiểm trước checkpoint: Store mock build PASS; Playwright marker-layout,
list-labels và progressive-layout PASS ở 390×844 / 1440×1024 (marker/label thêm
320×844); docs và diff check PASS. Evidence local ignored nằm trong
`.local/kph-marker-spacing`. Đây là nghiệm thu hình ảnh mock KPH; không suy ra
nghiệm thu DATE/Admin/online, backend, thiết bị thật hoặc quyền deploy.

Yêu cầu tiếp theo: nhân bản cả nhãn màu và thanh nhãn vào các list hiện có,
dùng primitive chung và mapping theo feature; giữ API, quyền, selection,
pagination và snapshot lịch sử. Không push/merge/deploy.
