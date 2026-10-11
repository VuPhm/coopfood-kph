# Store App UI foundation

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
