# COMPACT01 — assessment ngày24/10/2026

## Yêu cầu trực tiếp

Owner: “lên kế hoạch bắt đầu vòng tạo chế độ compact cho giao diện / tuỳ chọn
tắt bật trong cài đặt / hình dung hiện tại là làm gọn1 phần item, làm gọn chủ
yếu vào các phần chức năng”. Lượt này được phép lập kế hoạch; không suy ra
quyền thực thi runtime, merge FORM01, nghiệm thu UI hoặc deploy.

## Baseline và inventory

- Main local `f77034d9c14b88f5ae6359e31cfd23b4e3e6b0d8`, sạch lúc kiểm, ahead
  origin/main47 commits theo local ref. Remote freshness **not checked**;
  lập kế hoạch không cần fetch hoặc công bố remote là mới nhất.
- Đã chạy `node tooling/skills/delivery-cycle/scripts/cycle.mjs inspect --repo
  /Users/vup/Documents/coopfood-kph`: inventory nhánh/worktree/dirty files.
- Các task UI02/RPT02/DATE03/HEADER02/KPH02 đã có closure trên main theo
  CURRENT_STATE/NEXT; tái sử dụng baseline đã tích hợp. Không merge lại nhánh cũ.
- FORM01 `store-app/form01-fresh-soft` có hồ sơ chuẩn bị Compact cùng ngày;
  HEAD quan sát `3bd013173bce54abd2eb3f51ba79631bb87b05e1`, runtime candidate
  `d4f9d17d14ab6abbccaeb930c04ac5592cae8069`, đang chờ owner theo record nhánh.
  Tái sử dụng ý tưởng/settings/storage/guardrails, điều chỉnh ưu tiên khu chức
  năng trước item. Không sửa worktree hoặc hồ sơ FORM01 do writer khác giữ.
- HEADER03 tip `d1675d1` là task riêng; gói FORM01 đã chứa đúng
  `816b4e33d27ef9512af05e5968511e6a29690536`. Không chọn tip mới thay mốc này.
- Pilot/Pages và các task provenance khác ngoài scope. Không nhận ownership
  packages/ui từ FORM01, không sửa root lock/config hoặc runtime đang review.
- Task planning mới có nhánh `store-app/compact01-interface-density`, worktree
  `/Users/vup/Documents/coopfood-kph/.local/worktrees/compact01-interface-density`
  từ main f77034d. Một writer: chat hiện tại. Chưa có candidate Compact.

## Nguồn đã đối chiếu

- CURRENT_STATE, NEXT, ENGINEERING_PRINCIPLES, STORE_APP_BASELINE,
  STORE_APP_CONTRACTS và accepted ADR0001–0006.
- UI DNA, FRAME, SURFACE_STYLE, FORM_CONTROLS, KPH_COMPACT_HISTORY;
  delivery-cycle lifecycle/record và DELIVERY_WORKFLOW.
- Source thực: `store-app.tsx`, `store-app-frame.tsx`,
  `store-account-sheet.tsx`, `store-settings-dialog.tsx`, settings row/control
  CSS, tokens UI, mobile refinements, DATE/KPH/Tra hạn CSS và browser gate.
- `store-settings-dialog.tsx` chỉ thuộc Pilot; Store Fresh dùng account sheet.
  Radix portal render ngoài frame; cần density scope/cleanup riêng có test.
- CSS hiện có đã giảm nhiều gap mobile: list-control gap6×8px, report settings
  row60px; cần đo, không giảm máy móc. `.store-compact` là selection control KPH,
  không phải preference mật độ. Header72px đang có gate geometry riêng.
- UI/UX Pro Max search `touch target compact spacing --domain ux`: kết quả
  Touch Spacing và Text Reflow phù hợp. Dùng44px theo guardrail của repo và
  bản chuẩn bị FORM01; không diễn giải kết quả search thành chứng nhận WCAG.

Provenance chưa ở main được đọc bằng `git show store-app/form01-fresh-soft:`
với các path `docs/delivery/form01-fresh-soft/compact-next-round.md`,
`merge-preparation-2026-10-24.md`, `technical.md`, `plan.json`; HEADER03 qua
`git show store-app/header03-context-nav:docs/delivery/header03-context-nav/technical.md`.
Nội dung ở nhánh khác dùng để assessment, không tự thành quyết định mới của owner.

## Giới hạn và dependency

Chưa có phép đo trực quan/baseline mới sau merge FORM01. Các giá trị Compact
trong kế hoạch là thử nghiệm có gate; chưa có test runtime/preview Compact để
gọi PASS. Trước EXECUTING cần yêu cầu triển khai, xác nhận main thực chứa gói
baseline, cập nhật revision/base và scope trên cùng task. Không mở thêm một
milestone thực thi song song với FORM01.

## Kiểm tra hồ sơ

- `npm run check:docs`: PASS, docs/fixtures hợp lệ.
- `git diff --check`: PASS; chỉ có hồ sơ trong thư mục cycle mới.
- Runtime không đổi; chưa chạy unit/build/browser cho Compact, các technical
  gate trong plan vẫn pending. Không dùng kết quả FORM01 làm bằng chứng cho
  density chưa triển khai.
