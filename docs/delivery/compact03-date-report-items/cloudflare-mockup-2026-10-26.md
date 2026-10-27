# Cloudflare mockup publication —26/10/2026

Direct owner request after revision4 handoff: **“đưa lên mockup cloudflare”**.
This explicitly authorizes publication of the4352 candidate to the existing
mockup project, separately from visual acceptance/main integration. The UI cycle
remains AWAITING_ACCEPTANCE revision4; its earlier no-deploy scope applied before
this publication request. No UI/runtime source change, Git merge/push or protected
GitHub Pages change was needed. Main remains f77034d, clean.

- Public link: <https://coopfood-demo-20261021.pages.dev>
- Immutable deployment: <https://72c8cc2c.coopfood-demo-20261021.pages.dev>
- Previous deployment retained: <https://f33b5258.coopfood-demo-20261021.pages.dev>
- Existing Cloudflare Pages project `coopfood-demo-20261021`, production branch
  `demo` (separate from GitHub Pages). Upload source checkpoint0b9985e; runtime
  df369271 and candidate9e5af0d are identical in apps/packages.

Copied the exact tested `.local/compact03/r4/build` (4352) to
`.local/compact03/r4/cloudflare/site`, verified SHA256 for119build files, and added
only existing mockup `_headers`/robots.txt: noindex/nofollow/noarchive, no-store
entry and no-cache service worker. Mock fixture build, no backend/data upload.

Publication command, run inside the cloudflare folder:

```sh
node /Users/vup/.npm/_npx/32026684e21afda6/node_modules/wrangler/bin/wrangler.js pages deploy site --project-name coopfood-demo-20261021 --branch demo --commit-hash 0b9985e --commit-message 'Publish Compact DATE notifications and Fresh mockup 2026-10-26' --commit-dirty=false
```

Exit0, deployment72c8cc2c. Before upload, deployment list confirmed previous
productionf33b5258 on `demo`. HTTP200 on the stable public link; downloaded
index exactly equals package index, noindex/no-store headers confirmed.

Local4352 smoke passed390×844/1440×1024 before upload. Then direct public smoke:

```sh
MOCKUP_URL=https://coopfood-demo-20261021.pages.dev node .local/compact03/r4/cloudflare/check-mockup.cjs
STORE_UI_DENSITY=compact MOCKUP_URL=https://coopfood-demo-20261021.pages.dev node .local/compact03/r4/cloudflare/check-mockup.cjs
```

Both exit0 (four cases),7routes, density attribute, notification24px percent,
KPH search/open both forms, shelf calculation, report save/Excel download and
service worker ready; no JS/HTTP errors, API calls or external data requests.
Evidence `.local/compact03/r4/cloudflare/{package.json,deployment.json,public-*.log,
evidence-cloudflare/}`. No repeat of unchanged346tests was needed; revision4
technical evidence still applies to identical runtime.

For an existing PWA/browser session, choose **Cập nhật** if the application offers
Có phiên bản mới (save any active draft first). To see Compact, open Tài khoản →
Cài đặt → Giao diện → Chế độ gọn. Default comfortable remains the default.
Mock DATE/KPH/reminders still reset on reload; this is a visual/flow mockup,
not backend or real-device acceptance. Next step: owner open the stable public
link and compare DATE/Thông báo in both densities.
