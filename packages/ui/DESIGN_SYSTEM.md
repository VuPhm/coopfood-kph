# Store App UI foundation

## Current inventory — 2026-10-12

`ListLabel` composes `Tag` for read-only list labels with text, decorative icon,
category and six scoped tones. `ListItemMarker` adds a decorative item cue,
`dot` or rounded `bar` variant, always paired with a visible semantic label; both share `ui-label-palette`. See the [label system](../../docs/product/LIST_LABEL_SYSTEM.md).
KPH Fresh is the accepted first consumer (checkpoint `5fdfa3e`). The rollout
also covers DATE, lookup history, online/Pilot KPH and Admin identity/lifecycle/
catalog lists; feature adapters retain their own status authority. The existing
Tag API/palette remains available. `ui-list-marker-card` and `ui-list-marker-cell`
reserve a 28px leading gutter: bar 3px wide, inset 12px, 36px mobile / 24px
desktop. Cards retain vertical/end padding; tables center the bar in the cell.
See the [rollout handoff](../../docs/delivery/list-label-rollout/handoff.md).

Use the [Store App component catalog](../../docs/product/STORE_APP_COMPONENT_CATALOG.md)
to find implemented primitives, Store patterns, consumers, variants, verification
and proposed improvements. Current Store PWA presentation follows
[Co.op Fresh](../../docs/product/STORE_APP_VISUAL_DNA.md); shared UI also serves
Admin Web. The Figma foundation/reboot scope below records its historical slice,
not the current DATE scope or Fresh acceptance state. Tokens remain a draft;
the stylesheet header does not establish verified Figma parity.

The Figma R2 Store App presentation roles are exposed as `--cf-kph-dry`,
`--cf-kph-dry-soft`, `--cf-kph-fresh`, `--cf-kph-fresh-soft`,
`--cf-home-lookup`, and `--cf-home-date`. They do not replace business states;
error, warning, success, choice and focus semantics retain precedence. Typography
tokens align with the assigned Figma scales while compatibility aliases remain.

The current design candidate is [CoopFood — Store UI foundation](https://www.figma.com/design/55DDRKrysV4PJXYGyRQdoC?node-id=439-2). The owner chose Figma-first foundations and UI frames on 29/09/2026, without another application prototype. Foundations are on `01 — Foundations`, component families on `10`–`17`, patterns on `20`, and Home/KPH/expiry starter frames on `30`–`32`. See the [reboot handoff](../../docs/delivery/r1r-ui-dna/figma-foundation-handoff.md).

## Icon source — owner clarification, 2026-10-08

- The owner identified the Store App icon set as **Feather React** in the current
  chat on 2026-10-08. The official React package reference is
  [`react-feather`](https://github.com/feathericons/react-feather).
- For the current Figma file `aEDpXtz0IiEkPiVucqjQ3Q`, map icon names and geometry
  to Feather and the assigned frame/master. The observed masters use a 24×24 grid
  and stroke 2; rendered size follows the specific slot. Do not treat a similarly
  named Lucide icon as verified equivalent.
- The current candidate uses local Figma SVG exports for many target icons and
  still has Lucide consumers from the existing stack. This note records the icon
  source; it does not claim that a `react-feather` dependency or migration is done.
  Any implementation follow-up must record affected consumers, exact mappings and
  visual checks. Legacy consumers outside the assigned scope remain governed by
  [ADR-0001](../../docs/adr/0001-foundation-stack.md).

## Tokens

- `src/tokens.css` is a pre-existing implementation draft, not a verified mirror of the reboot. Figma now uses `CF / Primitives`, `CF / Semantic`, and `CF / Dimensions`; the old R1R collections were removed. The [exported token contract](../../docs/delivery/r1r-ui-dna/figma-foundation-contract.json) records exact values and proposed CSS mappings for a later implementation slice.
- The exact CSS custom properties in Figma variable code syntax (`--cf-brand`, `--cf-space-8`, `--cf-radius-12`, and peers) are defined in the stylesheet. Readable `--cf-color-*` and `--cf-palette-*` aliases are available for application styles.
- Spacing variable suffixes are pixel values and match Figma: `--cf-space-4` is 4px, `--cf-space-8` is 8px, and so on.
- The Store PWA imports the token file and maps its Tailwind theme names to semantic variables. Legacy aliases remain in the token file while existing Store PWA and Admin Web screens migrate in later scoped work.
- Add semantic intent tokens before adding one-off values to a feature stylesheet. A feature may add local layout rules but should not redefine brand, status, typography, spacing, or elevation values.

## Components

- Export reusable React primitives from `src/index.ts`. Keep them semantic and presentational; feature state and business rules stay in the consuming app.
- `Button`, `Input`, `Field`, `Dialog`, and `Tag` are existing shared primitives. `Card`, `SectionTitle`, and `BottomNavigation` establish consistent panel, section, and mobile navigation structure for the Store PWA pilot.
- Keep touch controls at least 44px high, use native buttons/inputs, expose selected or expanded states, and label icon-only controls.
- Compose feature-specific patterns in the app rather than adding business-specific props to shared primitives. Bind visual variants to semantic tokens.

## Screen organization

- The design scope is mobile-first Home, KPH, and the reverse-expiry utility. Pilot KPH uses manual entry or barcode capture; catalog lookup belongs to the separate online contract and is not added to the pilot UI frames. DATE alerts and standalone product lookup are outside this reboot.
- Responsive layouts may add columns at wider viewports; preserve the mobile hierarchy and workflow order.
- Keep review/submission boundaries visible. Mock data and prototype-only actions must be labeled as simulations and must not imply a server write.
- Product/API semantics and authorization come from repo contracts and accepted ADRs. Figma controls visual presentation and interaction only.


## Shared dropdowns — RPT01 candidate, 2026-10-14

`Select` is a controlled single-value combobox, built on Radix Select. Pass
`value`, `onValueChange`, readonly `options` (`value`, `label`, optional
`disabled`), and an accessible label/labelledby. Native trigger props, `name`
and `contentClassName` are supported. Empty application values are valid;
named forms submit the original string value, including leading zeroes.
Trigger is 48px, options at least 44px, with check/selected/highlight states.
Radix owns keyboard/typeahead, focus restoration, collision and scrolling.
Use `DropdownMenu`/Trigger/Content/Item/Label/Separator for commands instead
of repurposing a value select. Both use `dropdown.css`; theme variables use
`--dropdown-*` with semantic CF fallbacks. Apply the same theme class to the
trigger and portal content. Store uses `store-dropdown` from store-controls.css.

Current consumers are the DATE report scope, history month and template save
settings, plus the report selection action menu. Existing Admin/native selects
and KPH/DATE sort behavior have not been migrated in this slice. Store/UI/Admin
TypeScript and Store/browser checks pass; owner acceptance remains pending.
See [report design](../../docs/product/STORE_REPORTS_DESIGN.md).

Multi-selection and floating action docks are Store compositions, not domain
primitives in this package. `StoreSelectionBar` takes eligible/visible IDs and
preserves off-query choices; the feature retains scope and paging policy.
`StoreActionDock` renders actions once and changes positioning, measuring its
real height/width to avoid jumps and keep focused controls visible. Parent
contains one dock. Use it only when actions need to remain available while
scrolling; it does not grant actions or decide what is selected.
