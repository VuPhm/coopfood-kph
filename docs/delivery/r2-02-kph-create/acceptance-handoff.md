# R2-02 owner review

Status: `AWAITING_ACCEPTANCE`. Candidate:
`1e6c8102c983b5654aa6f596fa6756e36dd94529` on
`store-app/r2-02-kph-create`, based on R2-01-merged `main` at `4fab688`.

Interactive synthetic online preview: <http://127.0.0.1:4177/> while the local
preview server is running. It starts as `manager.demo` at
`CF-DEMO-001 · Nguyễn Kiệm`. All data is synthetic and memory-only; restart the
server to reset it. This preview does not demonstrate actual backend storage,
authorization, or private media derivatives.

1. On a 390×844 phone or desktop, enter TPCN directly. Open scan, choose “Nhập
   mã thủ công” if a camera is unavailable, enter `FOUND-CREATE`, and leave the
   barcode field. Expect `FOUND`, a catalog-filled read-only product/NCC, and the
   familiar TPCN options.
2. Add one JPEG/PNG photo and open it. Select “Xem lại trước khi gửi”. Expect the
   store/account, lookup result, type-specific details, and photo order. Nothing
   is submitted yet. Change a detail to confirm review becomes invalid, review
   again, then choose “Gửi phiếu”.
3. Enter TPTS directly and use `UNAVAILABLE-CREATE`. On the first lookup expect
   catalog unavailability, with no `NOT_FOUND` claim. Retry to get `NOT_FOUND`;
   enter manual product/NCC, add up to three photos, inspect the second image,
   and confirm the order in review before sending.

Technical evidence and viewport screenshots are in
[technical-evidence.md](technical-evidence.md). Please record acceptance or a
concrete in-scope issue in this R2-02 task. Visual shell refinement remains
deferred; R2-03 and Pages cutover are outside this review.
