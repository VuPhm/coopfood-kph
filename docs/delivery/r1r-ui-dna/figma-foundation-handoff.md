# Figma foundation reboot — revision 2

Date: 29/09/2026. Status: technically reviewed, awaiting owner acceptance.

## Outcome and entry points

[Start here](https://www.figma.com/design/55DDRKrysV4PJXYGyRQdoC?node-id=439-2)
is the entry point. The owner explicitly chose foundations and UI frames first,
Figma first, without another application prototype.

- [Foundations](https://www.figma.com/design/55DDRKrysV4PJXYGyRQdoC?node-id=439-3):
  122 variables across CF / Primitives (61), CF / Semantic (26), CF / Dimensions (35).
- Components: Icons, Button/IconButton, Field, Choice, Status, Card,
  Navigation, Evidence; 9 component sets and 59 component nodes including variants.
- [Patterns](https://www.figma.com/design/55DDRKrysV4PJXYGyRQdoC?node-id=439-12):
  FormSection, ActionBar, UtilityHeader, ContentSlot, ExpiryResult,
  MobileShell and DesktopWorkspace.
- [Home](https://www.figma.com/design/55DDRKrysV4PJXYGyRQdoC?node-id=450-35),
  [KPH list](https://www.figma.com/design/55DDRKrysV4PJXYGyRQdoC?node-id=451-11),
  [KPH form](https://www.figma.com/design/55DDRKrysV4PJXYGyRQdoC?node-id=451-64),
  [expiry utility](https://www.figma.com/design/55DDRKrysV4PJXYGyRQdoC?node-id=452-11):
  mobile 390×844 starter frames made from shared instances.
- [Desktop workspace](https://www.figma.com/design/55DDRKrysV4PJXYGyRQdoC?node-id=453-28):
  1440×1024 layout reference.
- [Candidates](https://www.figma.com/design/55DDRKrysV4PJXYGyRQdoC?node-id=439-16):
  isolated space for future proposals and owner decisions.

All seven former pages were removed, including the old product screens,
desktop screens, expiry state screens, old foundations/components/patterns,
and the archive page that contained only two heading texts.
The two old R1R collections (77 variables) were removed only after a
file-wide reference check found zero uses in current nodes, new aliases or styles.

## Preserved direction and deliberate adjustments

The existing green Co.op Food palette, coral/amber accents, light surfaces,
Inter typography and rounded operational UI remain the source direction.
Seven existing text styles and two effect styles were retained.
An eighth text style, type/input at 16/24, supports mobile entry.

The contrast audit found small warning/danger text on tinted backgrounds below
4.5:1. Added warning-text (#914904), danger-text (#b30410) and neutral/850
(#5e6b5e, aliased by text-muted). Original palette primitives remain available.
The tested foreground/background pairs now range from 4.66:1 to 15.63:1.

Pilot UX source was read from codex/github-pages-pwa at
21ab5b87bf19711cf0408b10216931dc7de172d7. Its local data authority, manual/barcode
capture, KPH type choice, photo order, filtering/selection/export and date
calculator interactions are recorded beside the UI frames. Home is an organizing
entry point requested by the owner, not a claim that the protected Pilot branch
already contains that Home screen.

Catalog FOUND/NOT_FOUND and backend authorization belong to the online
contract; they were not inserted into the pilot UI frames.
No new application prototype, prototype reaction or deployment was created.

## Verification

Figma Plugin API read/write results and rendered screenshots were inspected
during the build. The final audit is in
[figma-foundation-audit.json](figma-foundation-audit.json);
the exact token/style/page inventory is in
[figma-foundation-contract.json](figma-foundation-contract.json).

- All 15 current pages inspected; no raw solid paints, missing token references,
  wrong font families or orphan main components reported.
- All variables have explicit scopes and WEB syntax; semantic/dimension values
  alias primitives. Alias targets resolve.
- 73 instances reported; 0 prototype reactions.
- Variant geometry and screenshots checked for the component families.
- Screenshots checked at mobile 390×844 and desktop 1440×1024.
- Targeted fixes verified: guide auto height, button grid after fixed sizing,
  loading labels, field error copy and disabled/readonly action visuals,
  horizontal action-row height and accessible foreground colors.

No Playwright/app/backend test was run: this revision changes Figma and
documentation only. Existing application edits were not validated or changed by
this revision. Figma screenshots are visual evidence, not browser interaction,
camera, keyboard, safe-area or real-device acceptance.

Repository checks: `node scripts/check-docs.mjs` PASS; `git diff --check` PASS;
JSON parsing of contract/audit files PASS. The delivery acceptance checker was
run and stopped at `Working tree is dirty; review and checkpoint before this
gate`. It therefore does not certify a code candidate or close this cycle.
The pre-existing dirty application work was deliberately preserved. Owner
acceptance remains pending.

## Repository handoff

Workspace: /Users/vup/Documents/coopfood-kph.
Branch: store-app/r1r-ui-dna. Source HEAD:
4fab6889f6cc6a7b66d25806262329cbf88ea024. Sole writer: root.

Changed documentation: plan.json (revision 2), this handoff, exported contract,
audit JSON and packages/ui/DESIGN_SYSTEM.md. All pre-existing application and
shared UI code changes remain in the working tree. The Git candidate SHA in the
plan identifies the source reference only; Figma is the reviewed artifact.

The code token stylesheet is not yet synchronized. In particular, several
legacy primitive names map to different shades than Figma, and the accessible
foreground additions need a future implementation slice. Use the exported
contract rather than assuming the current CSS is an exact mirror.
Code Connect/library publication is deferred because this is a Figma-first
candidate, not a verified code implementation.

## Owner review and next step

No owner acceptance is recorded. Review foundations and the mobile UI frames;
then select one bounded flow-design slice, such as the KPH creation states.
Detailed state screens, calendar/scanner behavior, production responsive behavior,
and implementation remain subsequent work. Do not create extra prototypes or
start application work without the next owner direction.
