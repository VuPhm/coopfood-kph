# Shelf input repair — revision 9

09/10/2026. Owner “tiếp” resumes QA/repair on the combined r8 implementation.
Same cycle and branch/worktree; base 8a3942d, sole writer /root; no delegation.

Playwright audit at 390×844 and 1440×1024 (`.local/ui-r9/audit.json`) reproduced:
entering 2 months before NSX deletes duration and leaves expiry blank; numeric
-2/1.5/10000 becomes 2/15/1000; invalid date submit leaves focus on the button and
provides no invalid/description association on inputs.

Bound this round to those three form defects. Retain explicit duration source,
recompute the derived date when the anchor changes, preserve invalid raw values
and validate positive whole numbers, associate errors and focus the invalid field.
Manual expiry in known mode overrides duration with the explicit date pair.
Reuse date functions/tokens/result markup; no domain/API/CSS/shared CalendarInput,
Figma or dependency changes. Original worktree remains read-only.

Two reviews: targeted repair/tests, then combined browser/screenshots. Check days
and months entered in either order, known/unknown anchors, mode switches, month-end
rules, invalid/clear/recovery, valid five-digit duration, independent main/quick IDs
and error focus. Re-run r8 result and focus/aggregate/responsive coverage relevant
to the form. Keep untouched KPH calendar/QA evidence historical with explicit reuse
reasoning. Verify workspace/tests/build; record candidate and pending owner handoff.
