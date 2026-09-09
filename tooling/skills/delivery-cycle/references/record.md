# Record and CLI

Node.js 20+ and Git; no npm install required. Resolve `<skill>` to this skill's
absolute directory. `--repo` is explicit; scripts never assume the agent's cwd.

```sh
node <skill>/scripts/cycle.mjs inspect --repo /path/to/repo
node <skill>/scripts/cycle.mjs init --repo /path/to/repo --id delivery-02
node <skill>/scripts/cycle.mjs check --repo /path/to/repo --plan docs/delivery/delivery-02/plan.json --phase dispatch
node <skill>/scripts/cycle.mjs check --repo /path/to/repo --plan docs/delivery/delivery-02/plan.json --phase scope --team frontend
node <skill>/scripts/cycle.mjs check --repo /path/to/repo --plan docs/delivery/delivery-02/plan.json --phase acceptance
node <skill>/scripts/cycle.mjs check --repo /path/to/repo --plan docs/delivery/delivery-02/plan.json --phase close
```

`init` exclusively creates a record; it never overwrites. Fill empty values before
checking. `inspect` shows only local refs/worktrees/dirty paths, not remote URLs.
Other commands read Git and files only. Plan paths are relative to repo; worktree
paths are absolute. Evidence paths must resolve inside the repository.

Teams have `id`, `worktree`, `allowedPaths` and `dependsOn` arrays. Paths are exact
files or directory prefixes ending in `/**`; no other globs, `..` or absolute paths.
Shared paths cannot overlap team writes; integration owner manages them separately.
Teams cannot overlap each other. Dependencies must exist and be acyclic. Leave
teams empty for solo work. Model/effort may be recorded but are not executable config.

Gates have `id`, `kind` (`technical` or `user`), `required` boolean, `status`
(`pending`, `pass`, `fail`), `revision`, `sha`, and repository-relative `evidence`.
An initial gate can be pending with revision/sha/evidence unset. At least one required
technical and one required user gate are required for this acceptance workflow.
For a technical gate include the actual command, runtime, result and output in its
referenced evidence file; CI needs a run URL and actual run SHA, not a local log.
For a user gate include `acceptedBy` and `decisionRef` pointing to the real user
message or recorded sign-off, plus an evidence file with the scenarios/decision.
Do not fabricate these fields to satisfy the checker.

`baseSha` is the reviewed implementation checkpoint for teams. When committing
plan/evidence after choosing it, only files inside this cycle's record directory may
advance before dispatch; code changes require a new base. A team can receive the
plan separately if it is not present at the base SHA.

`candidateSha` is the integrated code commit tested. The check permits newer commits
only within this record directory (e.g. adding acceptance evidence), and requires a
clean tree. Any other change needs a new candidate and relevant verification.
Required passed gates must reference this SHA and current revision. If deliberately
carrying forward unaffected evidence, the report must name the original SHA/revision
and coverage rationale; attach that assessment as current evidence. The checker does
not decide whether reuse is justified.

`changes` entries record `revision`, `request`, `source`, `impact`, `decision`.
`blockers` entries contain `id`, `status` (`open`/`resolved`), `owner`, `nextAction`.
An open blocker prevents acceptance/close. `reviewRound` must not exceed `reviewLimit`;
a repair beyond the limit needs a consciously revised bounded plan, not silent loops.

Checks fail nonzero for missing/invalid data, overlapping ownership, stale evidence,
untracked/out-of-scope files or missing user sign-off. They do not execute commands
from JSON, prove test correctness, validate remote CI or change plan status.
