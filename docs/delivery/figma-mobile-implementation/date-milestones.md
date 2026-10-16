# DATE quản lý theo mốc Tra hạn — 12/10/2026

> Bố cục summary/chi tiết đã được thu gọn theo phản hồi tiếp theo của owner.
> Giữ kết quả mốc/nhãn; xem [bàn giao mới](date-compact-detail.md) cho UI hiện tại.

Follow-up theo yêu cầu owner: bỏ bar trong list, dựng DATE dựa vào các mốc Tra
hạn rồi gắn SKU/lô để quản lý. Cùng task/worktree/writer, nhánh
`store-app/figma-mobile-implementation`, base `c6d9fa5`; source working tree.
Không tạo cycle/team mới cho lượt nhỏ này. Preview <http://127.0.0.1:4201/#date>.
Khung trên đã accepted; phần mốc/nhãn mới giữ nghiệm thu owner riêng.

## Kết quả và quyết định

Danh sách bỏ hoàn toàn bar/%. Dùng nhãn tình trạng DATE (theo NSX/cảnh báo/
hạn lùi/HSD) và nhãn xử lý riêng. Mobile chi tiết cũng hiện rõ cả hai nhãn, kể cả khi đã xử lý.
Chi tiết lô reuse đúng `ShelfLifeTimeline`
của Tra hạn: ngày chính, hôm nay, mốc, ngày đầy đủ và SKU/lô. Mobile/desktop đều gọi “Chi tiết lô DATE”, phù hợp cả lô chưa cảnh báo. Hộp lọc thêm
“Tình trạng DATE”, reset/empty recovery xóa filter này đúng ý nghĩa “tất cả”.
Lô đã xử lý giữ nhãn Hết HSD khi hết hạn; HSD hôm nay chưa là hết hạn.

Mốc tính từ `calculateShelfLife`, không có bản sao công thức. Thiếu NSX vẫn
biết HSD có qua hay không, nhưng không suy NSX/cảnh báo/hạn lùi hoặc vẽ holder.
Ngày lỗi vẫn render được để sửa dữ liệu. Dưới 10 ngày gộp hạn lùi/HSD, không
thêm mốc cảnh báo giả. Timeline là shared component app, không import màn
Tra hạn/form/calendar vào DATE. `useMemo` theo lots/ngày để reuse assessment
khi tìm/lọc; `memo` timeline, CSS tĩnh và container query cho khung hẹp.

Nhỏ hơn 250 px rail: bỏ ngày ngắn lặp trên thanh, giữ tên mốc và ngày đầy đủ
ngay dưới; nhãn wrap khi tăng chữ. Màu chữ timeline DATE dùng palette Fresh
cho đủ contrast; không đổi Tra hạn. Không thêm dependency/timer/GPU layer.
Không tuyên bố đã benchmark INP hoặc dữ liệu lớn trên thiết bị cửa hàng.

[Hướng product](../../product/DATE_MILESTONE_MODEL.md) ghi rõ theo dõi ngày thực
liên tục, thông báo và thống kê là **mở rộng sau, chưa triển khai**. Hiện view
suy nhãn theo ngày HCM khi render, không tự cập nhật qua nửa đêm. “Thêm theo
dõi” vẫn disabled; chưa tạo API/form/persistence DATE, migration hoặc backend.
Không đổi contract nghiệp vụ, rule, authorization hay provenance.

## Source và kiểm tra

Source chính: `apps/store-pwa/src/store-date-workspace.tsx`,
`store-date-assessment.ts`, `store-date-label.tsx`, `store-date-fresh.css`,
`store-shelf-timeline.tsx`, `store-shelf-life.tsx` (extract component, giữ hành vi).
Test mới: `store-date-assessment.test.ts`, `store-date-milestones.test.tsx`;
gates `check-date-milestones.cjs`, `check-date-layout.cjs`,
`check-date-kph-reference.cjs`, cập nhật dialog title assertion trong
`check-store-qa-repairs.cjs` dưới `e2e/scripts`. Xóa source/test/gate thin bar
list của lượt trước; [inline handoff](date-inline-bar.md) giữ bằng chứng lịch sử.
Docs: CURRENT_STATE/NEXT, Visual DNA, contract index, model DATE, nhãn màu,
component catalog và handoff này. Các thay đổi KPH/shared UI có sẵn là scope
khác; không stage/commit chung hoặc đổi API primitive.

| Lệnh | Kết quả |
| --- | --- |
| `npm --workspace @coopfood-kph/store-pwa run test -- --maxWorkers=2` | PASS 204 tests / 26 files, gồm 18 test DATE mới và hồi quy Tra hạn/workflow |
| `npm --workspace @coopfood-kph/store-pwa run test -- --maxWorkers=2 src/store-date-assessment.test.ts src/store-date-milestones.test.tsx src/store-date-workspace.test.tsx src/store-date-lookup.test.tsx src/store-app.test.tsx` | PASS 32 tests / 5 files sau đổi title chung mobile/desktop |
| `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build -- --outDir ../../.local/date-top-build --emptyOutDir` | PASS TypeScript/build/PWA |
| `STORE_DATE_OUTPUT=.local/date-milestones-20261012/phases node e2e/scripts/check-date-milestones.cjs` | Kiểm tra nhãn tại 5 mốc × 3 viewport, HCM boundary, timeline parity, contrast/geometry, thiếu NSX và resolved/expired; PASS 15 cases, contrast text ≥4.5:1, geometry/bar gradient và detail reflow 150% |
| `STORE_DATE_OUTPUT=.local/date-milestones-20261012/layout node e2e/scripts/check-date-layout.cjs` | PASS 390/1440/320, no list bar, trọng số khung trên/spacing/CTA và list reflow 150% |
| `STORE_KPH_COLORS_OUTPUT=.local/date-milestones-20261012/reference node e2e/scripts/check-date-kph-reference.cjs` | PASS 3 viewport, DATE phase filter/reset, sort/query/focus/bounds và contrast |
| `STORE_DATE_OUTPUT=.local/date-milestones-20261012/workflow node e2e/scripts/check-date-fresh.cjs` | PASS 3 viewport, lookup/scan/miss/recovery, xử lý/guard/state/navigation và contrast |
| `STORE_APP_URL=http://127.0.0.1:4201 node e2e/scripts/check-shelf-result.cjs` | PASS 390/1440, 12 scenarios mỗi viewport, today/edge/short-life, quick panel/reset/validation, không overlap/runtime errors |
| `npm run check:docs` và `git diff --check` | PASS |

Tất cả DATE browser gates dùng `STORE_PREVIEW_URL=http://127.0.0.1:4201`,
production mock build, Playwright Chromium headless; 390×844, 1440×1024 và
320×844. Clock controlled cho phase/filter/layout. Chromium ngoài sandbox qua
auto-review cho localhost; không dùng Computer Use hoặc Figma write.

Evidence ignored `.local/date-milestones-20261012/`: source trước khi sửa,
layout/phase/workflow/reference screenshots và contrast/geometry JSON;
source manifest. Không đưa dữ liệu/ảnh vận hành thật vào repo.

Giới hạn: mock state trong phiên, API DATE/camera thật/chuyển ngày tự động
chưa nghiệm thu. Warning chunk ExcelJS lớn là hiện hữu. Không commit/deploy;
Pages bảo tồn giữ nguyên. Bước nhỏ tiếp: owner tải lại DATE, mở một lô đầy đủ
NSX và một lô thiếu NSX để nghiệm thu hướng mốc/nhãn mới.
