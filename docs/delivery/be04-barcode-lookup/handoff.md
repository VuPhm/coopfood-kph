# BE04 — Tra barcode qua API thật

31/10/2026. Root sole writer, branch `store-app/be04-barcode-lookup`, worktree
`/Users/vup/Documents/coopfood-kph/.local/worktrees/be04-barcode-lookup`.
Base `4a653345210425230a65eae9265b495d3afca065`. Không có agent song song.

Owner: “tạm, giao diện chưa xong, tiếp” — giao diện BE03/BE04 vẫn provisional,
không suy acceptance/merge/deploy. Khi phát hiện mâu thuẫn OpenAPI membership-only
với CatalogService/KphStoreAccessPolicy/test chain access, đã hỏi owner. Owner chọn
“Theo backend: quyền KPH vùng/chuỗi được tra”. [ADR-0007](../../adr/0007-barcode-lookup-scope.md)
ghi rõ scope lookup khác staging/publish; không thay guard backend.

## Outcome

Home/KPH → Tra mã hàng → DATE: quét bằng scanner hiện có hoặc nhập barcode để gọi
`GET /api/v1/catalog/barcodes/{barcode}?storeId=...`. Identifier giữ chuỗi.
FOUND hiện một product/SKU/NCC chính; NOT_FOUND có Quét lại/Nhập tay, giữ barcode
và trạng thái. Nhập tay chỉ giữ tạm trong phiên, chưa tạo/lưu KPH; BE05 mới nối
persistence. Không gợi ý product/supplier hoặc biến lỗi403/503/network thành miss.
401 quay về xác minh session/login. Query có abort signal, key gồm store/barcode,
không persist/cache bền vững; đổi mã/store/unmount bỏ kết quả/request cũ.

## Phạm vi

- Store session gateway expose lookup callback hiện có; StoreOnlineApp composition.
- Component lookup/CSS/tests; reuse BarcodeScannerDialog, Button, shell, token.
- OpenAPI/examples/generated types, contract index/P01/discovery docs và ADR-0007.
- Backend HTTP tests thêm region/revoke/inactive; không runtime/migration mới.
- Vite chỉ thêm override proxy target cho runtime test riêng; default8080 giữ lại.

## Nghiệm thu

Login employee → store0001 → Tra mã hàng. Tra `0890123456789` phải ra
SKU-E2E-0001/NCC-E2E-01; tra `0000000000000` phải ra NOT_FOUND, nhập tay trống và
mã cũ vẫn còn. Đổi mã/store phải bỏ kết quả/draft cũ. Quét lỗi camera có nhập
mã thủ công. Region/chain không membership vẫn tra đúng scope; revoke request
kế tiếp phải403 hoặc trở về chọn store khi refresh. Offline/503 không báo miss;
phiên401 quay về login. Kiểm headless390×844/1440×1024, DOM/interaction/screenshot.

Technical đang kiểm; owner chưa nghiệm thu. Không UI redesign, không thêm tính
năng catalog publish hoặc lưu DATE/report/KPH. Không merge/push/deploy.
