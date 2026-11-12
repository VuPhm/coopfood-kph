# ADMIN02 revision8 — tab bị worker Pilot kiểm soát

Candidate `1ef9b46ddd4f35f17ef76c01692e461aac250c94` tại worktree bền vững `/Users/vup/Documents/coopfood-kph/.local/worktrees/admin02-fresh-dashboard`.

Owner báo reload thường vẫn trang cũ. Evidence revision7 chỉ dùng browser context sạch nên không đủ cho origin đã dùng trước; nhận định sửa hết ở lần trước bị superseded bởi vòng này.

## Hiện tượng thực tế và sửa

Computer Use được dùng chỉ để kiểm tra tab IAB đang tồn tại, vì Playwright headless không truy cập được phiên browser đó. Lần đầu thấy URL4175/#identity nhưng titleKPH và giao diện Pilot với phiếu local, trong khi HTTP server4175 trả Admin. Sau thêm retirement handler /sw.js và reload thường, tab chuyển sang titleQuản trị và màn Tài khoản người dùng. Phiênchain.p03 vẫn đăng nhập. Reload thường lần hai giữ đúng màn, không hard refresh hoặc đổi URL.

`apps/admin-web/preview-cache.ts` là Vite plugin configureServer/configurePreviewServer, không có build hook. Serve JS no-store đúng /sw.js thay cho HTML fallback trước đây. Worker mới skipWaiting, claim clients, unregister chính nó, navigate các window đang thuộc registration về URL hiện tại. Admin không có nhu cầu offline worker; migration chấm dứt worker cũ trên origin được dùng lại. Không xóa CacheStorage/IndexedDB/localStorage/cookie, không Clear-Site-Data hoặc thay auth. Không sửa Store/Pilot/Pages source hay deployment. Dist Admin không sinh sw.js.

## Kiểm tra mới

- `node e2e/scripts/check-admin02-old-worker.cjs`:PASS. HTTP fixture server trên cổng ephemeral tái hiện old offline worker root/sw.js kiểm soát cả navigation. Browser giữ cache, normal reload khi server đổi sang Admin → browser lấy retirement worker → Admin login xuất hiện; normal reload tiếp vẫn Admin; registration còn0. IndexedDB record, localStorage, cookie và CacheStorage đều giữ nguyên. Không can thiệp browser CDP cache, update thủ công, hard refresh hay xóa data. Server fixture không mở cổng demo thứ hai lâu dài.
- `node e2e/scripts/check-admin02-reload.cjs`:PASS CSS2revision/no-store/strictPort. File tạm restore trong finally; không còn thay đổi source.
- `npm --workspace @coopfood-kph/admin-web run build`:PASS TypeScript/Vite. Output asset hashes giữ nguyênBHsq9Ypc/DTeA-JKp, chứng minh runtime app không đổi do local middleware.
- `npm --workspace @coopfood-kph/admin-web test`:PASS19/19.
- `git diff --check`, docs checker:PASS.

Responsive/workflow9cases tạirevision7 giữ evidence trên cùng UI bundle; không chạy lại toàn bộ backend/Store vì không thay các phần đó. Screenshot CUA trực tiếp ghi nhận màn Tài khoản Admin trong chính tab owner, khác với chỉ screenshot headless mới. Technical readiness không tự trở thành owner acceptance.

Preview vẫn [http://127.0.0.1:4175/#identity](http://127.0.0.1:4175/#identity), servicevn.coopfood.kph.admin02.app đọc source worktree này. Không push/merge/deploy. Roadmap membership giữ nguyên quyết định exact username ngoài vùng của owner, không tự thay policy khác.
