# COMPACT01 revision3 — chốt tạm phạm vi hiện tại

Ngày24/10/2026, owner gửi trực tiếp trong chat đang thực hiện task:

> tạm, đến đây chốt được. cân nhắc tiếp cho các item list

Nguồn: user message sau preview production4344 (ambient URL4344/#home),
ngay sau yêu cầu chuẩn hóa size và lược cấu trúc. Người quyết định: owner trong
chat này. Không gán thêm thao tác dùng thử cụ thể mà owner chưa báo.

## Quyết định và giới hạn

Đóng COMPACT01 revision3 ở mức **chấp nhận tạm thời phần token size và cấu
trúc Compact hiện tại**. Runtime được chốt là
`ca543e6c610801c53e97fd84f35a553855e84ec6`, cùng bản production4344.
Giữ toggle trong Cài đặt, mặc định tắt, preference theo browser/device;
functional composition KPH/DATE/report và form/filter phẳng như candidate.
Các item mới chỉ có điều chỉnh nhẹ padding ở vòng này.

Đề nghị “cân nhắc tiếp” được xử lý thành [đánh giá item list](list-items-next.md),
chưa khởi chạy vòng implementation hoặc coi phương án mới đã được duyệt.
Owner có thể điều chỉnh phần chốt tạm bằng một revision/slice tiếp theo.
Không suy thành nghiệm thu FORM01, quyền merge main, push hoặc deploy.

## Bằng chứng kỹ thuật được giữ

[Technical revision3](technical.md) ghi346tests, mock build và production
Playwright hai mật độ/5viewport, page kit7màn/7viewport, scrollbar/dock,
DATE→KPH, form text150/200, báo cáo/Excel/PDF và print parity.
Những scenario này là kiểm tra kỹ thuật, không tuyên bố owner đã tự thử hết.

Checkpoint đóng hồ sơ ghi ở `plan.json.candidateSha` chỉ cập nhật tài liệu
CURRENT_STATE/NEXT, trạng thái product density và ledger sau runtime`ca543e6`; không đổi app/test/build.
Tái dùng bằng chứng revision3/runtime`ca543e6` vì diff ngoài docs rỗng.
Kiểm cuối: `npm run check:docs`, `git diff --check`, đối chiếu diff chỉ docs,
`cycle.mjs check --phase close`. Không chạy lại toàn bộ UI cho thay đổi docs.

Giới hạn kỹ thuật vẫn là mock memory-only/browser-local; chưa chứng minh
backend, Safari, Windows, keyboard OS hoặc thiết bị thật. Main giữ`f77034d`.
