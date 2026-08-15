# Contracts

`openapi/kph.openapi.yaml` là public contract duy nhất giữa frontend và backend.
Mỗi thay đổi API phải cập nhật spec, generated client và contract test trong
cùng change.

`fixtures/` chỉ chứa dữ liệu tổng hợp:

- `catalog/`: identifier string, leading zero và barcode conflict.
- `golden/dates/`: công thức inclusive, rounding và validation biên.
- `golden/kph/`: ma trận option/default/detail cho TPCN/TPTS.
- `golden/images/`: timestamp precedence và resize envelope.
- `golden/excel/`: cấu trúc cột/anchor và formula-injection guard.
- `api/`: example response cho mock frontend; không phải seed production.

Không đưa dữ liệu thật, credential, session token, ảnh vận hành hoặc workbook vận
hành vào thư mục này.

