# Chuẩn bị merge FORM01 + HEADER03 — 24/10/2026

## Yêu cầu và trạng thái

Owner: “cùng với `816b4e3` chuẩn bị merge vào main, chuẩn bị vòng tối ưu
compact (tuỳ chọn trong cài đặt) cho giao diện”. Đây là chỉ dẫn chuẩn bị gói
merge và vòng kế tiếp; chưa ghi thành quyết định nghiệm thu/merge đã thực hiện.
Không đổi runtime ở lượt chuẩn bị này; không push/deploy hoặc sửa Pages.

## Gói tích hợp đã kiểm

| Thành phần | Mốc chính xác |
| --- | --- |
| Main local, sạch lúc kiểm | `f77034d9c14b88f5ae6359e31cfd23b4e3e6b0d8` |
| Candidate runtime Fresh Soft revision4 | `d4f9d17d14ab6abbccaeb930c04ac5592cae8069` |
| HEAD lúc preflight, chỉ thêm ledger sau runtime | `dd50c62e606097a29044d5c9bba190a1f715045e` |
| Header được yêu cầu, đã có trong candidate | `816b4e33d27ef9512af05e5968511e6a29690536` |
| Nhánh tích hợp | `store-app/form01-fresh-soft` |
| Worktree / writer | `/Users/vup/.codex/worktrees/form01-fresh-soft/coopfood-kph`; chat hiện tại, một writer |
| Preview đúng revision4 | <http://127.0.0.1:4306/#reports> và <http://127.0.0.1:4306/#kph> |

4304 trong browser context là bản revision3, chưa có vòng token nút/chrome mới.
Merge gói đầy đủ trên nhánh FORM01; không cherry-pick/merge lại816b4e3, không
lấy tip mới hơn của nhánh HEADER03 (`d1675d1`) chỉ vì cùng tên task.

Gói có form/mép Home-style, bộ token nút xanh/secondary/selected/disabled,
mép khối trượt/sidebar/menu, cùng Home header/mobile Back/desktop ancestor816.
Bản mặc định giữ kích thước hiện tại. Compact chưa được cài vào gói này.

## Kết quả preflight thực tế

- `git status --short` ở main và task: sạch trước khi viết hồ sơ này.
- `git merge-base --is-ancestor main HEAD`: exit0.
- `git merge-base --is-ancestor 816b4e3 HEAD`: exit0.
- `git rev-list --left-right --count main...HEAD`: `0 11` tại dd50c62;
  main không có commit phân kỳ. Remote không fetch; đây là gói cho main local.
- `git merge-tree --write-tree main dd50c62`: exit0, tree
  `cd1a38ef33b5e6690b368794c61c20c59b125c65`, trùng `dd50c62^{tree}`.
  Merge thử không có conflict và không cập nhật main/index/worktree.
- `git diff --quiet d4f9d17 HEAD -- apps packages e2e contracts backend`: exit0;
  giữa runtime candidate và dd50c62 chỉ có ledger trong cùng cycle.
- `node tooling/skills/delivery-cycle/scripts/cycle.mjs check --repo
  /Users/vup/.codex/worktrees/form01-fresh-soft/coopfood-kph --plan
  docs/delivery/form01-fresh-soft/plan.json --phase acceptance`: PASS revision4.
- [Technical evidence](technical.md): 334 tests và Playwright state/contrast/
  geometry/form/chrome/native scrollbar PASS trên runtime d4f9d17. Reuse kết
  quả này vì lượt hiện tại chỉ viết hồ sơ trong cycle, source không đổi;
  chưa gọi đó là kiểm trực tiếp main sau merge.

Các commit sau dd50c62 của lượt chuẩn bị chỉ được sửa thư mục cycle này;
checker acceptance ràng buộc lại candidate runtime. Cùng một gói source đã kiểm,
không kéo compact implementation vào merge Fresh Soft.

## Thực hiện khi chốt merge

1. Kiểm lại main/task sạch, SHA main và ancestry; nếu main tiến thêm, ghép lại
   vào task và kiểm phần tích hợp trước khi cập nhật main. Đọc source/evidence,
   ghi quyết định thực của owner; hiện owner gate vẫn pending.
2. Merge nhánh `store-app/form01-fresh-soft` vào main local bằng merge commit
   có hai parent để giữ ranh giới gói; không sửa source trong lúc merge.
3. Ghi merge SHA, chạy gate tích hợp phù hợp và build mock từ main vào artifact
   riêng; kiểm header816 + nút/chrome/native bar trên390×844 và1440×1024.
   Mở preview main mới; không dùng4304 để nghiệm thu revision4.
4. Cập nhật CURRENT_STATE/NEXT và ledger theo kết quả thực, đóng FORM01 khi đủ
   gate. Push/deploy/Pages cutover vẫn là phạm vi riêng.
5. Mở task/worktree Compact từ main đã tích hợp; dùng
   [phạm vi vòng Compact](compact-next-round.md), không bắt đầu rollout tự động.

Nếu cần quay lại gói sau merge, dùng revert merge commit theo parent main;
không reset/rewrite main hoặc sửa tag Pages. Chưa thực hiện thao tác quay lại.

## Giới hạn

Preflight xác nhận main local tại thời điểm kiểm, không xác minh tip remote.
Prototype Store Fresh vẫn mock/browser-local; giới hạn backend/Safari/Windows/
thiết bị thật trong technical evidence giữ nguyên. Lượt này không thay UI.
