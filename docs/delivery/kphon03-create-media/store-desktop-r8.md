# Store desktop workspace — revision8, 14/11/2026

Owner: “Store desktop: bỏ cơ chế trượt nền xanh, trình bày lại nguyên cụm chức
năng, đưa về giống sát Admin”. Tiếp trên branch `store-app/kphon03-create-media`,
worktree `.local/worktrees/kphon03-create-media`, base `38dc839` của revision7.
Candidate đã kiểm: `de740775569b70f60b819b9ff0832813271860dd`. Ba script browser
workspace/chrome/create chạy lại trên checkpoint này đều PASS; các commit sau
chỉ cập nhật hồ sơ cycle.

## Kết quả

Từ900px, Store dùng canvas Fresh và các panel trắng phẳng theo Admin. Header/
sidebar vẫn là implementation chung revision7. H1 chuyển xuống body, header giữ
breadcrumb; id/ref/focus của trang và report template được giữ, không tạo H1 trùng.
Không còn hero xanh dưới nội dung, negative cover overlap hoặc nắp trượt desktop.

Home có heading và thẻ chức năng trắng, icon nhỏ, bỏ welcome banner desktop;
cảnh báo hôm nay giữ đủ lối vào. KPH/DATE có hàng tìm kiếm/tác vụ riêng, rồi
panel chứa tab/nhóm/danh sách. CTA KPH dùng màu action chung thay hai màu lớn.
Giữ compact rows UI05 và nhóm DATE trong mock. Tra hạn có form/kết quả/history
panel riêng. Report menu/composer/history/document giữ nội dung tối trên nền sáng;
history/document có nút về menu desktop thay handle kéo, focus quay lại menu.
Tiện ích tra hạn nổi giữ tính năng, đổi sang button trắng theo desktop.

Mobile dưới900px giữ hero xanh sticky, overlap12px, welcome, CTA theo nhóm,
compact rows, dock và pull-to-dismiss báo cáo. Desktop focus toolbar không gọi
scrollTo(0); focus mobile tiếp tục reveal hero. Print và modal/form riêng giữ
flow hiện có. Không đổi API/domain/auth/D01/paging/media hoặc global Fresh token.

## File thay đổi

- `apps/store-pwa/src/store-app-frame.tsx`, `store-app-header.tsx`: H1 trong body
  desktop và breadcrumb shared header; giữ mobile heading/ref.
- `store-desktop-chrome.css`: workspace composition/toolbar/panels desktop,
  Home/tra hạn/báo cáo, không áp CSS mới vào mobile.
- `store-page-hero.tsx`, `store-report-surface.tsx`: phân biệt focus/pull desktop
  và mobile bằng breakpoint hook hiện có.
- `store-screen-layout.test.tsx`: kiểm focus account/portal/toolbar ở hai mode.
- `e2e/scripts/check-store-desktop-workspace.cjs`: DOM/interaction/screenshot
  của các màn và report flow, không dùng pixel snapshot rộng.
- `docs/CURRENT_STATE.md`, `NEXT.md`, `product/STORE_APP_FRAME.md` và hồ sơ cycle.

Root sole source writer; Terra `/root/sidebar` hỗ trợ một lượt read-only QA trên
mock4180, không sửa code. Hai lượt rà có giới hạn, không mở backlog UI mới.

## Kiểm kỹ thuật

Runtime local cùng worktree: Store4173 online, Admin4175, mock4180, backend8082
với DB/media synthetic cũ. Không seed/reset hoặc xóa browser storage của owner.
Playwright headless Chromium; screenshot/log ignored `.local/verification/desktop-r8/`.

- `VITEST_MAX_WORKERS=1 npm run test -w @coopfood-kph/store-pwa`: **329/329 PASS**,
  48 files (`unit-final.log`). Lượt đầu còn assertion cũ luôn scroll về đầu;
  test sửa để kiểm riêng desktop/mobile, không bỏ assertion.
- Targeted final `store-report-surface.test.ts`, `store-screen-layout.test.tsx`,
  `store-app-frame.test.tsx`: **13/13 PASS**, sau chỉnh label nút back desktop.
- `npm run check -w @coopfood-kph/store-pwa` và `npm run build -w @coopfood-kph/store-pwa`:
  PASS (`typecheck.log`, `build-final.log`); cảnh báo chunk ExcelJS lớn đã có.
- `node e2e/scripts/check-store-desktop-workspace.cjs`: PASS 6 màn × 3 viewport
  **390×844 / 900×844 / 1440×1024**; canvas/hero/overlap, một H1, không tràn ngang,
  search/action hiển thị, hover còn phản hồi, focus không ép cuộn desktop.
  Report picker, tạo bản mẫu, document, history có dữ liệu, back và focus PASS;
  metadata desktop có contrast ≥4.5:1. Mobile hero/pull và back giữ đúng mode.
- `node e2e/scripts/check-fresh-chrome-alignment.cjs`: PASS **390/834/900/1440**,
  expanded/collapsed, parity Admin/Store, fixed chrome/tabs, account/focus và resize.
- `node e2e/scripts/check-kphon03-create-media.cjs`: PASS **390/1440** trên backend
  thật/synthetic: FOUND/NOT_FOUND, review/send, ba originals theo thứ tự byte-identical,
  private stamped media, retry mất response không duplicate, chặn close/double-send
  khi pending, revoke-before-send403 không success giả. Tạo thêm phiếu synthetic.

QA độc lập report/shelf ở390/1440: menu/history/composer/picker/back và kéo mobile
đạt; tra NSX18/01/2026, HSD18/10/2026 ra hạn lùi24/08/2026. Evidence phụ trong
`report-review/`. Rà ảnh cuối Home/KPH/DATE/shelf/report/notification và document;
panel/hàng giữ layout, chữ tối rõ. Kiểm desktop dùng native scrollbar headless.
Script kiểm mới đã sửa tên màn/selector theo DOM thật và dùng contrast thay so
literal màu token; các lỗi đó thuộc script kiểm, không phải bỏ qua product failure.

`npm run check:docs` và `git diff --check` PASS.

Admin/shared-ui source không đổi trong revision8; unit/build các phần đó dùng
lại evidence revision7 `3fc1a61` với rationale phạm vi không bị tác động. Browser
parity vẫn chạy lại để kiểm consumer Store/header body mới với Admin thật.

## Bàn giao và giới hạn

Xem Store online `http://127.0.0.1:4173/`, Admin `http://127.0.0.1:4175/`; bản mẫu
đầy đủ DATE/report ở `http://127.0.0.1:4180/`. Đối chiếu desktop Home/KPH, đổi màn,
thu sidebar và cuộn; thử lại390px để thấy mobile giữ Fresh. Runtime detached còn chạy.

Đạt kiểm kỹ thuật có mục tiêu; owner UI/create acceptance còn pending. DATE/report
vẫn prototype, chưa có backend; không suy khả năng lưu online từ browser mock.
Chưa kiểm thiết bị iPhone thật hoặc chạy hai vòng test tổ hợp/UIUX cuối. Không
merge main/push/deploy/Pages. Bước nhỏ tiếp: owner xem desktop candidate cạnh Admin.
