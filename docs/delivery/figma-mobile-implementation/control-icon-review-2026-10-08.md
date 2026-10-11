# Bounded control icon review — 2026-10-08

Source: owner says “tiếp tục” in the current chat after the Feather React note and
revision 3 handoff. This continues the UI loop; it does not record owner acceptance
or authorize API wiring.

Base: code candidate `caaea23e6a2bf86f0b8388f3887684db1ee59c9e`, docs HEAD
`35e0171e3e73d88c531832a4bd1d74ab29a37ad2`, same task branch/worktree.

Fresh reviewer: `/root/luna_controls_review_fresh`, GPT-6 Luna, read-only.
Scope is the three unresolved groups from the previous icon review: Store App back,
shared dialog close as rendered in Store App, and calendar trigger/navigation.
Only exact leaf/master evidence may establish a mismatch. Similar icon names or
an existing Lucide import alone are insufficient to justify changing shared
primitives or legacy consumers.

One bounded review pass, at most three confirmed findings. Root consolidates the
result. If a repair is justified, create a scoped revision 4 and invalidate affected
gates before code edits; keep revision 3 evidence intact. If there is no confirmed
mismatch, record the coverage and stop this review. Revision 3 technical evidence
and pending owner gate remain unchanged during the read-only pass.

No active code writer during this review. Root owns this docs-only record.

## Consolidated result

One confirmed mismatch: `calendar-input.tsx:148` renders Lucide CalendarDays
at 18px with day dots; KPH mobile refs `203:701` / `203:847` use Feather Calendar
at 20px, with no dots. An exact local export exists. The repair must re-read the
assigned mobile/desktop fields to choose their source/color and rendered sizes.

The back arrow has matching path geometry. Generic dialog close and picker
navigation have insufficient exact assigned refs; these remain adaptations,
not confirmed mismatches, and are excluded from repair.

Root additionally checked CalendarInput consumers: online/Pilot history,
KPH create, and the Store App shelf utility share the component. Therefore keep
the default icon unchanged and inject the verified presentation icon only for
the Figma KPH screen presentation. Preserve date rules, read-only state,
picker/keyboard behavior, and all other consumers. Allowed repair scope is
CalendarInput presentation props, two KPH form callsites, scoped icon CSS/assets,
meaningful calendar/KPH/browser checks and revision 4 records. Root will hand off
one fresh writer on the same branch/worktree and perform a final scoped review.
