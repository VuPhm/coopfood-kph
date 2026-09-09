---
name: delivery-cycle
description: Plan and run bounded software delivery cycles from branch assessment and scope changes through agent handoffs, integration, technical verification and user acceptance. Use for milestone coordination or reusable team workflows, not isolated small edits.
---

# Delivery cycle

Deliver a defined outcome and stop. Follow the target repository's AGENTS.md and
business contracts; this skill adds coordination, not architecture policy.

## Start or resume

- Read the repository's current state and next work before planning. On resume,
  recover the existing cycle, branch/worktree inventory, agent results and pending
  user feedback. Do not create a new cycle merely because context was lost.
- Run `node <skill>/scripts/cycle.mjs inspect --repo <repo>` for local branch,
  worktree and dirty-file inventory. Check remote heads when relevant, record
  freshness; the script does not fetch or assume remote state is current.
- Classify existing work as reusable, superseded or conflicting. Do not merge an
  old planning branch solely because its ADRs say Accepted.
- For a multi-step cycle read [the lifecycle](references/lifecycle.md). Create a
  record with `init --repo <repo> --id <cycle-id>`; edit its generated plan.json.
  A small fix needs only an outcome, relevant checks and handoff, not this ledger.

## Plan and adjust

Define in-scope outcome, exclusions, observable acceptance, ownership, dependencies,
review limit and authority for execution. Never count finishing all audit findings
as the default goal. User-requested model settings carry into dispatch; otherwise
inherit configured settings. No fixed team count or model is required by this skill.

For a scope change, increment revision, record the request and affected tasks/checks,
notify affected agents before further edits, and invalidate affected evidence.
If unaffected evidence is reused, reference its original revision/SHA and explain
why its coverage still applies. Do not broaden scope while silently keeping old gates.

## Execute and integrate

- Delegate only when requested/authorized by the user or applicable instructions.
  Use subagents for team work, separate user-visible tasks only when requested.
- First capture a reviewed code checkpoint including relevant untracked files.
  Assign disjoint write paths and isolated worktrees from that checkpoint. One
  integration owner handles shared configuration/contracts/migrations.
- Run `check --repo <repo> --plan <plan> --phase dispatch` before dispatch. Use
  [the handoff template](assets/handoff.md) for each bounded assignment. Never
  substitute a proposed agent ID, worktree or SHA for an actual one.
- Run `check ... --phase scope --team <id>` on returned worktrees; inspect diffs
  and meaningful tests before integrating. Checks are read-only: no automatic
  commit, cherry-pick, shell execution from the plan, push or deployment.
- Review the integrated SHA. A successful agent test at an older SHA is not proof
  of integrated acceptance. Send one consolidated blocker list per review round.

## Verify, accept, stop

- Separate technical readiness from user acceptance. Prepare a runnable preview,
  short user scenarios, expected results and known limits. Record user feedback
  and its source; silence is not acceptance. Prior explicit acceptance still counts.
- Run `check ... --phase acceptance` for technical evidence; use `--phase close`
  only after required user acceptance. The checker validates record consistency,
  not the truth of test output or whether a human actually approved it.
- At the planned review limit, stop broad review. If blockers remain, record a
  bounded repair plan or BLOCKED with owner/next action; never waive integrity or
  mark complete because the budget ended. Resume only the unresolved work.
- Close with integrated SHA, evidence, user decision, limitations and deferred
  backlog. Do not auto-start the next cycle. A new request starts or reopens a
  clearly identified cycle; improve this skill only for observed recurring failures.

CLI details and evidence fields: [record format](references/record.md).
