# ADMIN02 revision7 — preview và reload

Candidate `b46741a266cd80ed1c39609b40898d993dd9aed5`. Worktree hiện tại `/Users/vup/Documents/coopfood-kph/.local/worktrees/admin02-fresh-dashboard`, nhánh `store-app/admin02-fresh-dashboard`. Cùng branch/commit cũ được khôi phục khi thư mục `/private/tmp/coopfood-kph-admin02` không còn; không mất implementation. Không sửa main/membership/Pages.

## Nguyên nhân và thay đổi

Preview trước dùng `vite preview` đọc dist cố định trong thư mục tạm. Sửa source không tự rebuild dist; runtime/thư mục tạm cũng không còn khi resume. Không chứng minh được cache trong phiên browser cũ của owner. Source Admin không đăng ký service worker; không thêm unregister/clear-storage, không xóa session.

Dùng Vite dev đọc source trực tiếp qua `npm --workspace @coopfood-kph/admin-web run preview:ui`; cố định127.0.0.1:4175, strictPort. Dev5174 và preview cũng strictPort; dev/preview trả Cache-Control:no-store. Bản build production không thay đổi asset/auth/behavior. Đây là local preview config, không thay hosting/deploy.

Launcher macOS `bash e2e/scripts/start-admin02-ui.sh` gắn đường dẫn source/config tuyệt đối, lưu log ở `.local/runtime/admin02/app.log`, không fallback cổng hoặc kill process khác. launchctl `vn.coopfood.kph.admin02.app` đang giữ4175; đã dừng đúng frontend synthetic `vn.coopfood.kph.p03.app` ở4174. Backend P03 vẫn8081, synthetic database55433. Không có listener4174 sau sửa.

## Kiểm tra

- Admin component tests:19/19 PASS; Admin TypeScript/build PASS.
- `node e2e/scripts/check-admin02-reload.cjs`:PASS nhiều lần, gồm sau restart bằng launcher. Giữ HTTP cache enabled trong cùng browser context; đổi CSS hai lần, chờ Vite compile module rồi page.reload thường xác nhận computed CSS mới. Không CDP cache-disable, hard reload, clear cache, query busting. HTML/CSS no-store, zero registered SW. Spawn server thứ hai cùng4175 phải exit khác0, không chuyển sang4176 và không ảnh hưởng server đang chạy. Test luôn restore source trong finally.
- Phép thử đầu reload ngay trong cùng tick ghi file đụng thời gian invalidation/compile của Vite, có thể đọc module trước thay đổi. Test cuối đợi response module chứa bản mới trước reload để kiểm chứng browser cache riêng biệt; không coi đây là lỗi cache đã chứng minh.
- `node e2e/scripts/check-admin02-fresh.cjs`:PASS9cases: chain1440/1280/834/390, region scope/403, Catalogfixture4viewports. Overview filters/detail, Identity reason, Lifecycle/read/reload, account keyboard/password/logout, no overflow/pageerror. Đã xem screenshot desktop/mobile Tổng quan; dữ liệu rõ, không có hai dòng trang trí owner đã yêu cầu gỡ.
- `npm run check:docs`, `git diff --check`:PASS. Không đổi source UI/business/Store/shared tokens; reuse evidence token/Store revision5 và copy revision6 với phạm vi đó, không diễn giải thành test backend mới.

Preview [http://127.0.0.1:4175](http://127.0.0.1:4175). Synthetic chain.p03/region.p03 dùng password fixture admin-e2e-password, không phải account vận hành. UI Tổng quan vẫn mock; workspace dùng backend synthetic thật. Local database ở runtime tạm, không phải dữ liệu bền vững vận hành.

## Tiếp lộ trình

Đã chuẩn bị [màn và quyết định membership](next-membership-decision.md). Directory hiện chain-only; cần owner chọn eligibility cho region trước chốt API. Không can thiệp branch ADMIN01 hoặc tự triển khai policy chưa chốt. Technical PASS riêng với owner UI acceptance pending. Không push/merge/deploy.
