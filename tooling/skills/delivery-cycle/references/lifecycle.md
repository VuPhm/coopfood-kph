# Lifecycle

| Phase | Concrete output | Exit condition |
| --- | --- | --- |
| Assess | Branch/worktree inventory and recovered pending work | Know what to reuse and which contract governs |
| Plan | Outcome, exclusions, gates, owners and dependencies | Sufficient input for bounded work; no routine re-approval |
| Execute | Reviewed base, isolated assignments, local commits | Scoped diffs and relevant checks returned |
| Integrate | Shared-file fixes and candidate SHA | Combined implementation can be tested |
| Verify | Technical evidence tied to candidate and revision | Required checks pass; no unresolved blockers |
| Accept | Runnable preview, user scenarios, actual user feedback | User accepts or gives concrete changes |
| Close | Evidence, final state, limitations and deferred backlog | Stop work; next cycle requires a new request |

Use PLANNING, EXECUTING, VERIFYING, AWAITING_ACCEPTANCE, BLOCKED or CLOSED in the
record. A status label is a report, not permission and not proof of completion.

## User changes during execution

1. Preserve the original outcome unless the user cancels or replaces it.
2. Classify feedback: clarification; defect in current acceptance; scope addition;
   unrelated future request. Do not call every defect a new feature.
3. Record revision, request/source, impact and decision in `changes`. Update scope,
   gates and assignments together. Pause only dependent work; unaffected teams proceed.
4. Invalidate affected results, including prior acceptance if observable behavior
   changed. Reuse unaffected evidence only with explicit coverage reasoning.
5. Run targeted checks, then integrated gates as required by the change. Do not
   rerun every audit after a wording-only correction.

## Review and interruptions

Default two planned review rounds, adjustable to task complexity. Blockers include
wrong contract, authorization/data integrity faults, regression of required behavior
and failure of a required gate. Style suggestions normally go to deferred backlog.
Limit review scope, not correctness. An unresolved blocker needs a reproducible
failure, assigned owner and smallest next action; no recursive reviewer loops.

Before usage/time interruption, checkpoint safe work and record agent IDs,
worktree paths, actual commits, running processes, remaining checks and last user
instruction. Ask teams to checkpoint at safe boundaries; do not kill unrelated
processes. On resume inspect status once and continue pending work; no redispatch
of completed teams. Do not promise unattended continuation without a supported run.

## Acceptance and next cycle

Technical checks may be automatic; business acceptance comes from the user's
actual decision. A plan request alone does not authorize launch or deployment.
When execution is already authorized, proceed without repeatedly asking to do it.
A local acceptance does not prove remote CI, real-device testing or production
readiness. Name each limitation precisely. Publishing and merging follow existing
session authorization; never infer them from a passed checker.

On closure update the project's state/NEXT once, preserve evidence, and stop.
Carry deferred work into a future plan only when the next request needs it.
