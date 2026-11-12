# Tích hợp header xanh với luồng BE — 12/11/2026

Theo yêu cầu owner “sau round này tích hợp … luồng nhánh be đang làm song song”.
Đây là tích hợp local có scope, không là nghiệm thu cuối nghiệp vụ/rollout.

## Nhánh và ownership

- UI source `store-app/admin02-fresh-dashboard`, candidate `b783455`, bao gồm
  desktop chrome/official logos revision9–10 và header xanh revision11.
- Stable BE base `4bcbb48` trên `store-app/kphon02-lookup-history`, chứa ADMIN03
  membership, KPHON01 context và KPHON02 lookup/history. Owner đã cho tiếp với
  UI debt. Không merge các nhánh BE01–BE16 cũ chưa có acceptance tương đương.
- Integration `store-app/ui08-green-header-integration`, worktree
  `/Users/vup/Documents/coopfood-kph/.local/worktrees/ui08-green-header-integration`.
  Sole integration writer `/root`.
- Chat “Tiếp tục lộ trình” đang làm `store-app/kphon03-create-media`, có code
  chưa commit. Không sửa/copy/stash worktree active đó từ task UI.

## Quyết định conflict

`admin-shell.tsx`: giữ UserRoundCog/memberships destination, canMemberships và
filter scope của ADMIN03; dùng official logo và shell mới, bỏ icon/organization
card cũ. `vite.config.ts`: giữ ADMIN_API_TARGET và plugin adminPreviewCache,
strictPort/no-store cùng tồn tại. Auto-merge `store-app-header.tsx` giữ cả logo
dark mới lẫn ngoại lệ focus `.store-online-account` của BE. `store-page-hero.tsx`
giữ ngoại lệ focus online của BE. Không đổi backend/OpenAPI/generated client so
với stable BE base.

## Kiểm tra bản tích hợp

- `ADMIN_PREVIEW_URL=http://127.0.0.1:4178 STORE_PREVIEW_URL=http://127.0.0.1:4177 node e2e/scripts/check-desktop-chrome.cjs`:
  PASS6Admin viewports và Store7routes×3viewports, header xanh/no lines,
  collapsed/navigation/menu/password/focus và actual nav token equality.
- `node e2e/scripts/check-integrated-green-header.cjs`: PASS real synthetic
  backend8082, Store390×844/1440×1024 login/scope/barcode/history/account;
  Admin1440×1024 region membership navigation. Không route API mocks, không
  đổi dữ liệu nghiệp vụ hoặc chạy lại seed/reset trong lúc BE active.
- Full `VITEST_MAX_WORKERS=1 npm run verify`: PASS384tests (Admin25,Store320,
  API4,rules19,UI16), docs/contracts/generatedAPI/typechecks/build/PWA.
  Log `.local/verification/ui08/verify.log`, exit0. Warning ExcelJS chunk>500kB
  giữ nguyên. Candidate sau chỉ thêm chờ selected-state ổn định trong browser
  script; runtime code bằng merge2e41b71, browser smoke đã chạy lại PASS.

Preview tích hợp riêng: Store online4179, Admin4178, Store mock4177. Không thay
preview canonical4173 hoặc nhánh KPHON03 active. Log/ảnh tại
`.local/verification/ui08/` và `.local/verification/chrome-r9/` trong worktree
integration, không commit ảnh/log.

## Đưa vào KPHON03

Merge integration branch này vào KPHON03 sau khi writer checkpoint phần đang
làm. Chỉ khác stable BE base ở UI/assets/preview/tests/docs; không yêu cầu copy
hoặc thay business code đang sửa. Giữ quyền scoped continuation của các slice
BE; final combined workflow tests và owner UI/UX acceptance vẫn là gate riêng.

## Checkpoint cuối

Candidate `a045c4c68eec2bbb197e79fa979264c5d6a2fb77`, merge implementation `2e41b71`.
Owner ban đầu chọn giữ riêng, sau đó đổi ý: “tích hợp luôn KPHON03, tôi đổi ý r”.
Quyết định mới: phối hợp trực tiếp với writer KPHON03, checkpoint rồi merge
nhánh integration và kiểm lại code kết hợp; không merge main hoặc deploy.
Sau checkpoint sạch của KPHON03, writer có thể dùng:

```sh
git merge --no-ff store-app/ui08-green-header-integration
```

Đọc diff và kiểm lại các paths Store create/session/focus của KPHON03 sau gộp.
Main và active BE giữ nguyên. UI pending owner review không được hiểu thành
backend/combined-flow acceptance.
