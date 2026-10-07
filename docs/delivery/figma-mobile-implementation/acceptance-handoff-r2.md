# Owner acceptance handoff — revision 2

Technical implementation is ready for owner review; this handoff does not record
acceptance. The local memory-only preview is served by Vite at
`http://127.0.0.1:5176/` (`VITE_STORE_APP_MOCK=true`). It is attached to the current
Codex window if the browser panel has completed opening.

Suggested review scenarios:

1. At 390×844, open TPTS and TPCN, create a draft with a barcode lookup and up to three
   photos, view evidence, move to review, edit, and send. Confirm the draft survives a
   switch to desktop and back. On desktop, inspect the three-column review and sticky
   footer.
2. In KPH, search/filter/sort/page and confirm the selection resets when those contexts
   change; export and verify only eligible rows for the current page/type are included.
   Open a desktop row with Enter/Space.
3. Use the desktop product/lot Lookup and the separate shelf-life utility; compare the
   derived remaining days with the dated fixture. In DATE, verify the add-follow-up
   action explains that it is unavailable in the preview.
4. Open the floating shelf panel, move focus into it, close with Escape, and confirm
   focus returns to the opener.

Fresh browser screenshots are available under the ignored local folder
`.local/figma-mobile/`; the list and exact assertions are in
`technical-evidence-r2.md`. Acceptance remains pending for the owner's visual and
workflow decision. No API wiring, merge, push, deployment, or Figma write is included.
