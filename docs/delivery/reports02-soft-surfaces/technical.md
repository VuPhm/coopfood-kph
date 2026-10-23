# RPT02 — Co.op Fresh cho Báo cáo, 23/10/2026

Technical PASS; owner acceptance pending. Preview mock production:
<http://127.0.0.1:4290/#reports>. Chưa merge/push/deploy.

## Mốc, writer và phạm vi

- Base main `3b0da6c586fa4f067be73529c3a86101cd3e665a`, đã có HEADER02 + DATE03.
- Nhánh `store-app/reports02-soft-surfaces`, một writer tại chat này.
- Worktree `/Users/vup/.codex/worktrees/reports02-soft-surfaces/coopfood-kph`.
- Yêu cầu trực tiếp: “áp dụng giao diện mới cho vùng báo cáo”. Giả định tiếp
  Co.op Fresh khối mềm/viền nhẹ theo Home; giữ composition và semantics đã duyệt.
- Scope: menu preset/mẫu riêng, composer, list/table lô, lịch sử/snapshot và
  popup kỳ/phạm vi/tạo/lưu mẫu/picker/chi tiết. Không đổi API/domain/storage,
  mẫu/selection/export logic, màu nhãn/timeline, header/nav hay màn khác.

## Files và quyết định

- `store-report-soft.css`: CSS scope report/portal, áp screen-only; pastel
  mint/peach/sky/lilac nhẹ + sheen/bóng tĩnh thấp cho thẻ mẫu. Icon48/54px,
  viền1px transparent/radius18. Holder trắng/edge `#dfe5e9`, ngày/summary
  xám nhẹ; selected có checkbox/radio thật + mint nhẹ. Không thêm blur/listener
  hay dependency. Reduced motion/transparency bỏ sheen/shadow; contrast tăng
  edge. Input giữ đường biên đủ tương phản và focus rõ.
- `store-report-hub.tsx`, `store-date-report.tsx`: chỉ import CSS scoped.
- `store-action-dock.tsx`: khi dock đã về inline nhưng còn ở dải đáy màn,
  utility vẫn tránh vùng hành động. Tái sử dụng measurement/scroll/resize có
  sẵn; đo chiều cao utility, không thêm observer/listener hay thay snapshot.
  Browser tái hiện đóng chi tiết lô cuối rồi click Tạo báo cáo không bị che.
- `check-report-soft.cjs`: đối chiếu timeline và print với baseline main,
  bảo đảm sáu màn khác không nhận style, chỉ dock có blur hiện có. Pointer
  kích hoạt CTA sau chi tiết cuối kiểm cả nhánh inline mới.
- `check-date-report.cjs`: harness cũ gọi nút DATE “Đã xử lý” đã bị owner bỏ
  trong DATE03. Cập nhật sang Ghi nhận/Hẹn báo lại, vẫn kiểm snapshot cũ Mở,
  snapshot mới Đã ghi nhận và reload không sửa snapshot. Không đổi runtime
  nghiệp vụ để làm test xanh.
- Product guide, CURRENT/NEXT và plan ghi trạng thái candidate, không suy
  nghiệm thu visual từ technical PASS.

## Kiểm chứng

Playwright Chromium headless local, fixture tổng hợp, không dữ liệu/ảnh thật.
Preview4290 dùng mock build riêng; baseline4288 phục vụ build main đã kiểm
ở `.local/date03-header02-merge/build` (runtime23f6b19, các commit sau chỉ hồ sơ).
Không dùng snapshot pixel rộng. Log/screenshot/workbook/PDF test đều ignored
trong `.local/reports02/`, không commit dữ liệu vận hành.

```sh
VITEST_MAX_WORKERS=2 npm run verify
# Final log verify-final.log: PASS333 tests (Admin16/Store280/API2/rules19/UI16)
# docs/contracts23 resources+15 fixtures/generated API/types/build/PWA PASS
# Sau đó chỉ thêm docs/evidence; check:docs + git diff --check PASS

# Trong apps/store-pwa:
VITE_STORE_APP_MOCK=true npm exec vite -- build --outDir ../../.local/reports02/build
npm exec vite -- preview --host 127.0.0.1 --port 4290 --strictPort --outDir ../../.local/reports02/build
# PASS production mock build/PWA

# Từ root, các gate production sau đều dùng:
# STORE_PREVIEW_URL=http://127.0.0.1:4290
# STORE_REPORT_OUTPUT=.local/reports02/production-<gate>
node e2e/scripts/check-report-fresh.cjs
# PASS390/1440/320: menu/composer/filter/period/create/history, text>=4.5,
# input boundaries>=3, selected/focus>=3,44px targets/reflow/150% chữ
node e2e/scripts/check-report-header.cjs
# PASS390/1440/320: provisional picker/cancel, kỳ giữ nguyên,60mẫu,
# pinned search/footer, calendar/Escape/focus,150%/màn thấp620px
node e2e/scripts/check-report-selection-dock.cjs
# PASS390/1440/320: chọn theo phạm vi, selection ngoài query,
# một bộ nút DOM, dock floating/inline linh hoạt, hit-test/focus/reflow
node e2e/scripts/check-date-report.cjs
# PASS390/1440/320: template/history/selection/frozen snapshots,
# XLSX đúng1lô/SKU chuỗi/tồn Chưa có, print table/PDF, reload/persistence;
# storage quota failure có báo giữ trong phiên, không tuyên bố đã lưu bền
STORE_BASELINE_URL=http://127.0.0.1:4288 node e2e/scripts/check-report-soft.cjs
# PASS390/1440/320: sheen hiện diện normal mode, no added blur,
# timeline+print exact computed-style parity với main;6màn khác giữ màu/
# surface/border/shadow/radius, CTA click sau đóng chi tiết cuối không bị che

# Dev4285 trước bản sửa clearance cuối, không đổi CSS/management logic:
node e2e/scripts/check-report-management.cjs
# PASS390/1440/320: đổi tên/nhân bản/cập nhật mẫu, lỗi tên, search/tháng/
# 10→20 lịch sử, snapshot/dùng lại. Coverage tái dùng vì chỉ sửa measurement
# clearance, đã được production selection-dock/soft/regression kiểm lại.
```

Đã nhìn screenshot trước/sau menu/composer/create/document và production menu
mobile/history390, document1440. Bản in được kiểm DOM/table + xuất PDF; style
print so với main giống nhau. Source domain/model/library/Excel/API/backend/
packages không đổi. Build warning chunk>500kB và schema format password/int64,
localStorage experimental có sẵn, không có lỗi build/test.

## Thử và giới hạn

Owner xem menu mẫu → Tổng hợp → chọn/bỏ chọn/chi tiết lô → Đổi mẫu/kỳ →
Tạo bản → Lịch sử → mở/in/xuất. Mong đợi pastel nhẹ có chiều sâu, holder
trắng/viền mảnh, trạng thái chọn và focus vẫn rõ, header đồng bộ bản đã duyệt.

Mock report library vẫn browser-local theo store, chưa có persistence/server
online; tồn chưa có dữ liệu. Chưa kiểm iOS/GPU/keyboard OS thật, không tuyên bố
benchmark hiệu năng; chỉ giữ budget blur, không thêm listener/animation. Owner
chưa nghiệm thu RPT02. Bước nhỏ tiếp theo: nhận feedback đúng preview4290,
chỉ tích hợp main sau khi được cho phép.
