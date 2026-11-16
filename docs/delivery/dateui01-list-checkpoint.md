# DATEUI01 — đưa workspace danh sách DATE lên candidate

Ngày17/11/2026. Base `60ba810`, nhánh `store-app/dateui01-list-checkpoint`,
worktree `.local/worktrees/dateui01-list-checkpoint`, một writer. Owner sửa
ưu tiên: đã có giao diện quản lý DATE theo KPH, phải đưa lên trước bước backend
và lưu checkpoint. Không tự triển khai DATEON02 hoặc merge/push/deploy.

## Đúng nguồn UI

Đã đối chiếu các nhánh LIST01/DATE06/DATE10/FRESHR5 và code/evidence thực tế.
Workspace DATE compact với table/card, nhóm, filter, %HSD, timeline/detail và
nhãn xử lý đã có trong source hiện tại, bao gồm checkpoint `3273e94`14/11.
LIST01 `df77179` là provenance căn DATE processing theo KPH. Không thiếu merge
một backend DATE: entry online đang thay cả DATE bằng `StoreBarcodeLookup`,
nên giao diện quản lý không xuất hiện trên candidate owner dùng.

Tái dùng **chính `DateWorkspace` đang có**, giữ list/mobile/desktop/detail theo
KPH classes/tokens/header/sidebar hiện tại. Thêm mode `unconnected` có type
riêng: không nhận lots/callback prototype, không gọi mock catalog/groups/profile
hoặc tạo KPH từ nguồn giả. Home online trở lại “Quản lý DATE”; route DATE lắp
workspace đó với lookup thật. Unknown list/count được ghi rõ chưa kết nối,
không hiện0 lô như kết quả thật. Theo dõi/lọc/ghi nhận/xử lý DATE chưa có backend
được khóa; không mock fallback hoặc fake success trong phiên online.

## Preview đã probe đúng source/mode

- **Xem đủ giao diện danh sách/detail:** <http://127.0.0.1:4184/#date> — mode
  mock riêng,7 lô fixture tổng hợp, thay đổi trong phiên; không dùng chứng minh
  persistence, partial processing mới hoặc quyền vận hành DATE.
- **Candidate online:** <http://127.0.0.1:4183/#date> — mode online, session/
  effective store và lookup qua backend8082/DB tổng hợp KPHON02 hiện có. Dùng
  `region.admin03` / `admin-e2e-password`, chọn001. Không reset/seed DB.
- Cả hai từ worktree DATEUI01; preview KPH4181/Admin4182 giữ nguyên. URL phải
  probe lại khi bàn giao; không đồng nghĩa main/Pages đã có patch.

## Kiểm có mục tiêu

- Regression RED: Home online không có “Quản lý DATE”. Sau wiring, GREEN:
  `VITEST_MAX_WORKERS=1 npm --workspace @coopfood-kph/store-pwa test -- src/store-online-app.test.tsx src/store-date-workspace.test.tsx src/store-date-workflow.test.tsx`
  — **PASS22 tests/3 files**, gồm list route, không mock rows/write, giữ
  workflow prototype và manual draft qua scope revalidation/revoke.
- `NODE_PATH=/Users/vup/Documents/coopfood-kph/e2e/node_modules FRESH_STORE_MOCK_URL=http://127.0.0.1:4184 node e2e/scripts/check-fresh-r5-date.cjs`
  — PASS390×844/1440×1024, list/nhóm, tag không mở nhầm detail, intake fixture,
  zoom200%/overflow. Chạy đúng script liên quan, không quét lịch sử visual.
- Local `.local/verification/dateui01/online-browser.cjs` — PASS390/1440 trên
  API thật: FOUND giữ SKU000042/NCC000007, NOT_FOUND/manual draft không mất khi
  focus/revalidate, DATE unknown không lô mẫu/DATE request/write. Quay lại KPH
  thật còn control tạo phiếu. UI riêng có7 lô, mở/đóng detail và không overflow/
  pageerror. Root xem screenshot list mobile/desktop và online DATE.
- Build online với `VITE_STORE_APP_MOCK=false VITE_STORE_APP_ONLINE=true` —
  TypeScript/Vite/PWA102 entries PASS. Lượt đầu typecheck bắt option `exact`
  không hợp type Testing Library trong test mới; đã sửa, không sửa product
  semantics để làm test xanh. Build mock riêng sau đó PASS, TypeScript/Vite/
  PWA123 entries; warning chunk size hiện có. Docs/local links/diff/syntax PASS.

Artifact/log/screenshot ở `.local/verification/dateui01/`; script DATE fixture
ở `.local/verification/freshr5-date/`. Không thêm dependency/lockfile, không
đổi API/schema/backend/rule. Không lặp425 frontend hoặc92 backend tests chỉ
để ghi ngày mới; evidence đó vẫn thuộc source KPH trước, không phải DATE API PASS.

Checkpoint UI này đi **trước DATEON02**. Contract DATEON01 `60ba810`, partial
quantity và manager-only sửa/hẹn vẫn giữ nguyên; prototype single-link không
được lấy làm implementation bền vững. Owner xem đúng list UI trước khi tiếp
persistence/API. iPhone/camera/OS vẫn pending; chưa nghiệm thu DATE backend.
