# Bàn giao dự kiến cho Luna 6

Cycle: `figma-mobile-implementation`, revision **2**, scope **mobile + desktop, giữ mock**.
Kế hoạch: [implementation-plan-r2.md](implementation-plan-r2.md).
Model được owner chỉ định: `gpt-6-luna`. Không áp reasoning override khi chưa được yêu cầu.
**Chưa dispatch; agent ID và actual checkpoint SHA chưa có.**

## Trước khi giao thực thi

Integrator đọc dirty inventory và checkpoint code đang có, gồm untracked liên quan,
giữ provenance các thay đổi trước. Base HEAD hiện tại là
`4fab6889f6cc6a7b66d25806262329cbf88ea024`; không dùng nó như implementation candidate.
Nhánh/worktree hiện tại: `store-app/figma-mobile-implementation`,
`/Users/vup/Documents/coopfood-kph`.
Manifest [working-tree-inputs-2026-10-07.json](working-tree-inputs-2026-10-07.json)
ghi hash input code lúc lập kế hoạch, không thay checkpoint commit.

Sau checkpoint ghi base SHA thực vào plan; xác nhận one writer.
Nếu dùng subagent, ghi worktree được tạo/attach từ checkpoint, agent ID thật,
allowed paths/dependencies rồi chạy dispatch checker. Nếu chuyển model ngay trong
chat, tiếp tục worktree hiện tại và root ngừng writer trước khi Luna bắt đầu.
Giữ task identity, không mở branch từ main sạch mà bỏ candidate.

## Prompt thực thi dùng khi owner yêu cầu implement

> Tiếp tục cycle figma-mobile-implementation revision 2 theo
> docs/delivery/figma-mobile-implementation/implementation-plan-r2.md.
> Scope đã chốt: mobile + desktop theo file Figma aEDpXtz0IiEkPiVucqjQ3Q, giữ mock.
> Đọc AGENTS.md và docs theo thứ tự bắt buộc, rồi đọc plan.json, kế hoạch r2,
> ref inventory, token reference và handoff/review cũ.
> Kiểm actual checkpoint SHA/worktree do integrator bàn giao; giữ toàn bộ candidate.
> Tái sử dụng implementation hiện tại, không rewrite từ HEAD base cũ.
> Làm S0 → S1 → S2 → S3 → S4 → S5 → S6 → S7 tuần tự, checkpoint nhỏ theo outcome.
> Re-read exact Figma node context + screenshot trước mỗi slice; reuse
> packages/ui, RHF/Zod, CalendarInput/scanner/media/workbook và KPH rules.
> Không fork form dry/fresh hoặc controller mobile/desktop; theme từ KphKind.
> Contract thắng sample Figma: TPTS desktop dùng KPH_OPTIONS.TPTS, filter/page/count/
> selection/export đúng accepted semantics. Desktop Tra cứu là product/lot workspace;
> tiện ích Tra hạn lùi hàng là calculator riêng. DATE thêm theo dõi chưa có workflow,
> giữ disabled có giải thích theo kế hoạch.
> Giữ mock explicit/memory-only; production default online path không đổi;
> không nối API, backend/schema/contracts, persistence, Pages, merge/push/deploy.
> Sole writer giữ shared UI; không spawn team hoặc mở rộng scope.
> Chạy tests có ý nghĩa, npm run verify, targeted headless Playwright tại
> 390×844 và 1440×1024, breakpoint smoke và screenshot desktop reference 1440×900.
> Kiểm local static asset/slot/callsite/render geometry; không dùng URL tạm,
> raw SVG, icon substitute hoặc glyph chevron.
> Trả candidate SHA, changed files, command/output/evidence, actual preview URL,
> owner scenarios và giới hạn mock. Technical PASS → AWAITING_ACCEPTANCE;
> chờ owner decision thật, không tự đóng cycle hoặc làm API tiếp.

## Ownership và return contract

Allowed paths chi tiết ở plan.json và kế hoạch r2. Không sửa AGENTS.md, backend,
contracts, packages/kph-rules, app.tsx/online controller cũ.
Root lockfile/config/dependency mới gửi integrator xử lý với lý do cụ thể.

Mỗi slice trả file scope, checkpoint SHA thật, checks đã chạy/kết quả và blocker.
Khi lỗi business/ref không giải được an toàn: trả node URL + rule + phần bị chặn,
tiếp tục phần độc lập. Không giả định owner đã duyệt Figma candidate hoặc app mới.
Review giới hạn 2 vòng; đề xuất sau implementation đặt backlog/candidate riêng khi
được yêu cầu, không ghi đè Figma accepted.

Lượt lập kế hoạch chỉ review refs/source và tạo hồ sơ. Không có implementation,
fresh application test pass, preview mới hoặc owner visual acceptance được suy ra.

