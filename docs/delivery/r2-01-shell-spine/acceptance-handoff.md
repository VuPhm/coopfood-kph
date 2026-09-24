# R2-01 owner acceptance handoff

Status: awaiting owner decision. Technical candidate:
`3799a30cdc64976f9eb77009d9dd49942e7038dc`.

Synthetic, read-only online preview: <http://127.0.0.1:4175/> while the local
Vite preview and fixture API are running. The session starts as
`manager.demo` at `CF-DEMO-001 · Nguyễn Kiệm`; no credential entry is needed.
The fixture server rejects save, review, export, password, and logout writes.

For owner review:

1. At 390×844 and desktop, identify Store App, active KPH, acting account and
   current operational store without entering an overview page.
2. Open TPCN and TPTS directly; confirm the familiar create form opens and
   its controls remain reachable. Close each form without submitting.
3. Open Lịch sử directly; compare the phone card and desktop table and confirm
   the current page/filter controls remain recognizable.
4. Report a specific blocking defect or an explicit acceptance decision.

Screenshots and command evidence: [technical evidence](technical-evidence.md).
Real-backend and real-device behavior remain separate evidence, as documented
there. No merge, deployment, Pages cutover, or R2-02 starts from this handoff.

To restart the local synthetic preview from the repository root after an online
build, run `node e2e/scripts/serve-r2-01-synthetic-api.cjs` and
`npm --workspace @coopfood-kph/store-pwa exec -- vite preview --host 127.0.0.1 --port 4175 --strictPort`
in separate terminals. Rebuild with
`VITE_KPH_ONLINE=true npm --workspace @coopfood-kph/store-pwa run build`
if another command has rebuilt the default Store PWA dist.
