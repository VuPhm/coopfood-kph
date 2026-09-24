# Store App UI DNA

Status: Round 1 direction consolidated for owner review in R1-D04. This document
records the Store App principles carried through the R1-D01 audit, R1-D02
comparison, and accepted R1-D03 convergence. It is not a token specification or
permission to begin Round 2. Accepted business behavior remains governed by the
[Store App contract index](STORE_APP_CONTRACTS.md) and its linked contracts.
The older [UI_DNA](UI_DNA.md) is Tool KPH extraction and migration evidence, not
the authority for this Store App direction.

## Product intent and continuity

**Durable principle.** Make the next operational task and its state clear before
adding ornament. Evolve familiar KPH names, task landmarks, and sequence so a
returning operator can work inside the Store App without relearning the whole
application at once. User guidance and training material can reveal migration
costs, but is evidence rather than a UI contract; no such material is in this
repository yet.

**Implementation freedom.** The shell, navigation, screen and dialog boundaries,
component hierarchy, responsive composition, and visual treatment can change.
Familiarity does not require preserving the current long modal, tabs, membership
dropdown, or Pilot local authority.

## Shared shell and operational context

**Durable principle.** KPH is a named capability within a small authenticated
Store App shell. Keep direct entry to TPCN, TPTS, and history; common KPH work
must not require a mandatory overview or module detour. Show the acting account
and current operational store during work, then make the relevant actor, store,
and outcome explicit at create submission, review, and export. A context control
helps navigation; backend authorization and effective scope remain authoritative.

**Implementation freedom.** Context placement, navigation controls, and the
amount of persistent detail can respond to viewport and task. Add destinations
as capabilities become real; do not turn future modules into operable routes.

**Open dependency.** Effective-store and capability discovery for inherited
region/chain managers is unresolved. Use only currently valid account/store data;
the session's membership-only store list does not describe all effective access.
This principle does not specify a discovery API or selector policy.

## KPH creation and state

**Durable principle.** Preserve the recognizable TPCN/TPTS choice, scan or manual
lookup, details, ordered photo evidence, and review/submit boundary. Prefer a
continuous composition for the first Store App slice. Keep `FOUND` (one current
published product), `NOT_FOUND` (retain the code; permit rescan or manual entry
without inferring a product), and `CATALOG_UNAVAILABLE` (service recovery rather
than a product miss) distinct. Name busy, error, and review eligibility states
with understandable next actions; color alone cannot carry their meaning.

**Implementation freedom.** Sections, progress cues, scanner/dialog boundaries,
and exact state copy remain designable. A different creation sequence needs
observed task evidence and must preserve recovery across camera, keyboard, photo,
and back navigation.

**Durable principle.** One to three photos remain visibly counted, ordered, and
inspectable during capture and review. Online original and stamped derivatives
remain private; a client stamp must not be presented as the audit authority.
Thumbnail, viewer, and desktop pane choices remain designable.

## History, review, and export

**Durable principle.** Keep the filter, page, selection, review, and export mental
model. The accepted [D01 history contract](HISTORY_PAGING_CONTRACT.md) governs
filter/sort before paging, 1-based page state, page-local selection, reset rules,
counts, and busy feedback. Show review status and export eligibility before
consequential action; confirmation should make store, type, selected eligible
count, and exclusions understandable. Export remains limited to selected,
in-scope `SUBMITTED + APPROVED` records of one type.

**Implementation freedom.** Desktop can use dense comparison; mobile should lead
with decision-critical facts and a clear return to the same filtered page after
record detail. Tables, cards, filter surfaces, and action placement may differ
while expressing the same semantics.

## Responsive and brand character

**Durable principle.** Mobile favors focused task completion, reachable controls,
one-hand use across keyboard, camera, and photo inspection. Interruptions and
returns to the task should have a clear recovery path. Desktop may show more
comparison density. Both retain the same business states and scope. The Co.op
Food character should feel calm, restrained, legible, and operational.

**Implementation freedom.** Current assets, colors, and CSS are design evidence,
not final brand rules. Exact palette, typography, asset usage, spacing, radii,
component APIs, and motion remain open until approved brand guidance and usage
evidence support them. Brand color must not substitute for semantic labels.

**Open dependencies.** Approved brand/logo guidance, representative operator
feedback, and real-device observations are still needed before settling visual
rules or changing familiar task steps. Existing assets and synthetic comparisons
do not establish those outcomes.

Source trail: [R1-D01 audit](../evidence/r1-d01-ui-dna-audit.md),
[R1-D02 comparison](../evidence/r1-d02-evaluation-and-directions.md), and
[R1-D03 convergence](../evidence/r1-d03-ui-dna-convergence.md).
