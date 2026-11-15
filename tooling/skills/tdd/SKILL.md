---
name: tdd
description: Add or fix behavior with focused behavior tests, or simplify a test suite in Co.op Food. Use existing contracts and a red-green loop; select checks by marginal risk reduction.
---

# Focused behavior tests

Adapted from [Matt Pocock's tdd module](https://github.com/mattpocock/skills/tree/5863806dd4e15c63174bee4e7515a4256792ecfa/skills/engineering/tdd),
MIT, source commit `5863806dd4e15c63174bee4e7515a4256792ecfa`.
Local changes: accept existing contract boundaries without another approval;
choose checks by marginal value; keep refactoring in the local loop; require no
other skill, review ceremony or automatic agent dispatch.

## Choose the next useful check

Read CURRENT_STATE/NEXT and the affected code, contract and tests. Use
[the repo test strategy](../../../docs/TEST_STRATEGY.md) to select the smallest
check that can detect the change's failure mode. Existing HTTP contracts,
component user actions and exported functions are agreed boundaries. Ask only
when a new business/API boundary needs a user decision.

For each additional test or run, identify what previously uncovered failure it
can catch and whether its likely avoided harm outweighs execution, token,
maintenance and owner time. Use qualitative judgment; do not invent probabilities
or maximize test count. Required security/data checks remain constraints.

## Work through observable behavior

- Test public behavior, with expected values from the contract or independent
  fixture. Avoid private methods, CSS implementation values, broad snapshots and
  assertions that recompute the production algorithm.
- For a new behavior or regression: one failing test, the minimal fix, then
  refactor while that focused test stays green. Do not batch speculative tests.
- When simplifying existing tests, preserve each distinct failure mode. Remove
  a duplicate only after identifying the retained test that catches it.
- Prefer deterministic unit/component/API tests for boundaries and branches;
  use a small real-backend browser flow to verify that they are wired together.
- Parameterize equivalent inputs; keep distinct async race, authorization and
  data-integrity cases even if their final visible outcome looks identical.

Read [tests.md](tests.md) for test-quality examples or [mocking.md](mocking.md)
when deciding how to isolate a boundary. These are upstream references. Repo
contracts take precedence: mock fixtures are valid component evidence; clean-DB,
audit, original/private-media assertions can require direct persistence evidence.
Do not rewrite existing tests merely to match the examples.

## Finish and stop

Run relevant checks once after the last affected edit. Rerun only checks affected
by another edit, failure or unresolved concern. Keep the full integration gate
at its agreed checkpoint; a targeted pass cannot replace it. No full suite for
prose-only changes and no extra tests mirroring test tooling or implementation.

Hand visual taste, workflow comfort and real-device behavior to the owner with
a short actionable trial. Keep reproducible correctness/security checks with
code. Report commands/results and what remains unverified; stop when the agreed
outcome has evidence. No new feature, commit, merge or deploy is implied by this
skill.
