# KPHON04 — nghiệm thu ngắn, giữ UI de74077

Ngày15/11/2026. Candidate `1ad090750bbc579554b4e685e97322f5157fc7e5` trên
`store-app/kphon04-review-export`; worktree
`/Users/vup/Documents/coopfood-kph/.local/worktrees/kphon04-review-export`.
Base `82191c2` bao gồm UI `de74077`. Nền UI được giữ để tiếp tục sửa; không
hiểu yêu cầu tiếp BE là chấp nhận UI hoặc create KPHON03 cuối cùng.

## Dùng thử

- Store online: <http://127.0.0.1:4176/#kph>.
- Admin cùng backend: <http://127.0.0.1:4175/>.
- Backend8082, PostgreSQL17 synthetic container KPHON02 cũ tại55434, private media
  trong worktree KPHON02; khởi động lại nguyên trạng, không seed/reset.
- Tài khoản tổng hợp `region.admin03` (vùng), `chain.admin03` (chuỗi),
  `employee.admin03` (nhân viên); mật khẩu thử `admin-e2e-password`.
  Chỉ dùng fixture tổng hợp, không nhập ảnh/dữ liệu vận hành thật.

Ba thao tác owner cần xem:

1. Với quản lý vùng, chọn cửa hàng001 → KPH → mở phiếu chờ duyệt → Duyệt phiếu
   hoặc Không duyệt. Tải lại, chọn lại cửa hàng: trạng thái và người duyệt giữ đúng.
2. Chọn → chọn một phiếu đã duyệt và một phiếu chưa duyệt → Xuất Excel.
   Xác nhận số đủ điều kiện/bị bỏ qua → Tải xuống. File chỉ có phiếu đã duyệt
   được chọn, ảnh và người duyệt ở cộtR; đổi trang/tab/lọc phải xóa chọn cũ.
3. Với nhân viên, vẫn xem/tạo được nhưng không thấy duyệt/xuất. Giao diện desktop
   giữ sidebar/header và panel của `de74077`; mobile giữ hero/sheet hiện có.

Backend kiểm lại scope ở từng request; hidden control không thay authorization.
Lỗi mạng không báo duyệt/xuất thành công giả; không tự retry review khi mất response.
Export audit là lần chuẩn bị dữ liệu server, không khẳng định browser đã tải file;
lỗi ảnh hoặc scope đổi khi chuẩn bị file không tạo workbook thiếu/nhầm scope.

## Runtime và phạm vi tiếp tục

Preview chạy độc lập phiên foreground; PID/log local ở `.local/runtime/kphon04/`.
Launcher có sẵn:

```sh
node tooling/preview/fresh-review.mjs --admin-port 4175 --store online --store-port 4176 --api http://127.0.0.1:8082
```

Cần backend8082 đang chạy. Backend jar KPHON01 cũ được tái sử dụng vì production
`backend/src/main` không có diff so với candidate; kiểm tích hợp BE dùng test mới
với PostgreSQL Testcontainers riêng. Launcher không tự start/reset DB.
Node modules được symlink local tới KPHON03 sẵn có; không thêm dependency/lockfile.

Technical PASS và owner acceptance là hai gate riêng. Không có sign-off được
suy từ việc owner cho tiếp BE. KPHON03/UI và hai vòng cuối (kỹ thuật toàn luồng,
sau đó UI/UX) vẫn pending; camera/keyboard/touch trên thiết bị thật và rollout
chưa được kiểm. DATE/notification/report online, C02 và vận hành là scope sau.
Không merge main, push/deploy hoặc đụng Pages/tag.

## Kết thúc vòng

Review tối đa hai lượt. Lượt1 phát hiện một lỗi: scope recheck trong lúc PUT duyệt
có thể bỏ refresh history sau commit thật. Đã sửa: invalidate captured actor/store
bất kể generation, chỉ notice/state phải còn current; lỗi401/403 vẫn refresh scope
nếu cùng actor/store mounted. Lượt2 xác nhận hết blocker; test hồi quy đạt.
Không mở thêm audit hoặc vòng polish từ các gợi ý ngoài scope.

Bước nhỏ tiếp: owner thử ba thao tác trên và ghi quyết định/điểm cần sửa.
Khi có quyết định, chỉ sửa blocker cụ thể hoặc đóng gate; không tự mở DATE.
