# ADMIN03 — integrated UI evidence

09/11/2026, revision1, candidate `0bd2c474e4cc28c9665860f1294c953c05b148c5`.
Branch `store-app/admin03-store-membership`; worktree
`/Users/vup/Documents/coopfood-kph/.local/worktrees/admin03-store-membership`.
Sole writer Codex /root; review round2/2. No merge/push/deploy.

## Implementation và decisions

- Thêm workspace Quyền cửa hàng vào nhóm Quản lý vận hành, hash `#memberships`.
  Khám phá store từ API membership, không suy quyền vùng từ session memberships.
- Typed gateway dùng chung session/CSRF client; list/lookup/upsert/revoke thật.
- Chọn store, list account/membership state riêng, lookup exact username trước
  grant; đổi role, cấp lại, revoke có lý do và mô tả hiệu lực. Không optimistic
  authority. Thành công refetch backend; conflict giữ role/reason để sửa và retry.
- Lookup input thay đổi bỏ kết quả cũ/role/reason; không gán guessed user khi404.
  ASCII username kiểm trước lowercase; reason 1–500 Unicode code points.
- Query key chứa actor/store; đổi store remount form/list. Logout/session401
  cancel và remove membership queries. Error403 reset data và recheck scope;
  fetch lỗi không hiển thị cached member list như dữ liệu được phép.
- Reuse Admin Fresh shell/tokens, shared Button/Field/Dialog và Radix focus.
  Dialog autofocus đúng field, Escape/focus restore; target>=44px.
  Sửa inset mobile riêng của membership để khớp header/body, không sửa packages/ui.
- Vite hỗ trợ `ADMIN_API_TARGET` cho proxy local; default8081 giữ nguyên.
  ADMIN03 dùng backend8082/db55434 riêng. Source preview4175 thay đúng job ADMIN02
  đã kiểm arguments; không chạm backend/P03 data8081/55433.

## Technical checks

`VITEST_MAX_WORKERS=1 npm run verify`: **PASS**, exit0.
Docs/fixtures, OpenAPI/AJV, generated client diff, typecheck, tests, builds và PWA:

| Workspace | Tests |
| --- | ---: |
| Admin Web (gồm 6 membership tests) | 25 |
| Store PWA | 294 |
| API client | 4 |
| KPH rules | 19 |
| Shared UI | 16 |
| Tổng | **358** |

`npm --workspace @coopfood-kph/admin-web run check`, admin test/build cũng PASS.
Sau cập nhật implementation status/docs, chạy lại `npm run check:docs`,
`npm run check:contracts` (29 resources/21 API fixtures), `npm run check:api`
và `git diff --check`: PASS. Không đổi dependency/lockfile.
Node/npm cài sẵn, Vite8.2.1, Vitest4.1.10; dependency installation offline từ lockfile.
Build còn cảnh báo chunk Excel/PWA có sẵn; không đổi budget hoặc tắt check.

## Browser — real backend

```sh
node e2e/scripts/check-admin03-membership.cjs
```

PASS bằng Playwright headless Chromium, locale vi-VN, timezone Asia/Ho_Chi_Minh,
reduced motion. **0 intercepted/mock routes**. Trên candidate backend đã build
ở cùng worktree, PostgreSQL17 thử riêng với seed guarded
`e2e/seed/admin03-membership.sql`; không dùng workbook/photo/data vận hành.

- 1440×1024 và390×844: region login, chỉ store001; valid store002 list403.
  Lookup prefix không tìm user, không có nút save; exact uppercase lookup tìm đúng.
- Admin UI grant/revoke `employee.admin03`. Phiên Store đã login trước grant:
  KPH403 → grant UI → KPH200 → revoke UI → KPH403, session vẫn200. Reload Store
  đổi context đúng, không login lại; store002 vẫn403. Store dùng online entry
  hiện có (`VITE_STORE_APP_MOCK=false`, `VITE_KPH_ONLINE=true`), không dùng Fresh mock.
- Last-manager downgrade409 từ backend: error được dịch, reason/role vẫn giữ;
  screenshot mobile/desktop đã xem. Không sửa fixture để bypass guard.
- Chain thấy2stores; đổi store không còn dữ liệu storetrước. Gán/revoke membership
  trực tiếp của region và chain qua UI không làm mất quyền KPH kế thừa trong hai
  phiên Store riêng. Employee/catalog-only không có menu và membership-stores403.
- Keyboard Enter lookup, role autofocus, reason autofocus khi revoke, Escape
  đóng/focus về trigger; layout/touch44px, no page/dialog horizontal overflow.
- Reload thường giữ hash, no-store HTML và không có Admin service worker.
- 375×812, landscape844×390, textroot20px + system dark preference giữ theme
  light hiện có: không tràn; không thêm theme mới.
- Logout chain → login region trên cùng browser context chỉ còn1store.
- Không có pageerror trong hai luồng viewport chính.

Output đã quan sát:

```text
PASS desktop 1440×1024: exact lookup, keyboard/focus, grant/revoke two sessions, last manager, reload, layout
PASS mobile 390×844: exact lookup, keyboard/focus, grant/revoke two sessions, last manager, reload, layout
PASS chain scope/store switch, inherited region+chain permissions, small/landscape/large text, logout/login cache isolation
PASS employee and catalog-only cannot discover/manage memberships
```

Artifacts local: `.local/verification/admin03-membership/results.json` và
`desktop-members.png`, `desktop-last-manager.png`, `mobile-members.png`,
`mobile-last-manager.png`, `small.png`, `landscape.png`, `large-text.png`.
Visual inspection trực tiếp desktop-members và mobile-last-manager: hierarchy,
đọc rõ status/account, error/form/actions không bị cắt. Không pixel snapshots rộng.
Sau source commit kiểm lại runtime: Admin4175 đúng module source/no-store,
Store4173 HTTP200, backend8082 health200; launchctl app trỏ đúng worktree và proxy8082.

## Reuse backend gate

[Backend evidence](backend-evidence.md) tại `a768bd75f0821fb14e8383a3565c2cbfd1269dc7`
đạt full Maven verify80 tests, 15 membership bao gồm forced concurrency.
Backend source tree hash ở cả checkpoint đó và candidate hiện tại là
`7a83ecc749e617abaafb3f76a74df7774a2658af`. Lượt UI không thay backend, migrations hoặc wire schema shape;
chỉ đổi tag description. Vì vậy dùng lại gate backend ở revision1 trên candidate
này, có thêm E2E thật chứng minh integrated behavior. Không gọi đây là Maven run mới.

## Giới hạn

Technical gates PASS; owner-workflow gate vẫn pending. Không có owner sign-off
cho candidate này; không chạy close. Chưa kiểm thiết bị thật/OS camera hoặc
production hosting. Overview Admin vẫn dữ liệu minh họa được gắn nhãn; membership
là API thật trên DB thử. Fresh Store online wiring vẫn ngoài ADMIN03.
