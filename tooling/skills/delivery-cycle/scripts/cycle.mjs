#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';

const die = (message) => { throw new Error(message); };
const requireThat = (value, message) => { if (!value) die(message); };
const nonempty = (value) => typeof value === 'string' && value.trim().length > 0;
const git = (repo, ...args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const list = (raw) => raw.split('\0').filter(Boolean);
const dirty = (repo) => list(git(repo, 'status', '--porcelain=v1', '-z', '--untracked-files=all'));
const sha = (repo, value) => {
  requireThat(typeof value === 'string' && /^[a-f0-9]{7,40}$/.test(value), 'Expected a real hexadecimal commit SHA');
  return git(repo, 'rev-parse', '--verify', `${value}^{commit}`).trim();
};
function inside(repo, path) {
  const result = relative(repo, path);
  return result !== '..' && !result.startsWith(`..${sep}`) && !isAbsolute(result);
}
function pattern(value) {
  requireThat(nonempty(value) && !isAbsolute(value) && !value.includes('\\'), `Invalid allowed path: ${value}`);
  const base = value.endsWith('/**') ? value.slice(0, -3) : value;
  requireThat(base.length && !base.split('/').some((p) => !p || p === '.' || p === '..') && !/[?*\[\]]/.test(base), `Use exact files or dir/**: ${value}`);
  return { base, prefix: value.endsWith('/**') };
}
function covers(rule, file) {
  const p = pattern(rule);
  return p.prefix ? file === p.base || file.startsWith(`${p.base}/`) : file === p.base;
}
const overlap = (a, b) => covers(a, pattern(b).base) || covers(b, pattern(a).base);
function onlyLedgerSince(repo, commit, ledgerDir) {
  git(repo, 'merge-base', '--is-ancestor', commit, 'HEAD');
  const changed = list(git(repo, 'diff', '--name-only', '--no-renames', '-z', commit, 'HEAD'));
  const prefix = relative(repo, ledgerDir).split(sep).join('/') + '/';
  requireThat(changed.every((file) => file.startsWith(prefix)), 'Code changed after checkpoint/candidate; select a new SHA and verify it');
  requireThat(dirty(repo).length === 0, 'Working tree is dirty; review and checkpoint before this gate');
}
function validate(plan) {
  requireThat(plan.schemaVersion === 1, 'Unsupported schemaVersion');
  requireThat(nonempty(plan.id) && nonempty(plan.objective) && nonempty(plan.integrationOwner), 'Fill id, objective and integrationOwner');
  requireThat(Number.isInteger(plan.revision) && plan.revision > 0, 'revision must be positive');
  requireThat(['PLANNING', 'EXECUTING', 'VERIFYING', 'AWAITING_ACCEPTANCE', 'BLOCKED', 'CLOSED'].includes(plan.status), 'Invalid status');
  for (const key of ['inScope', 'outOfScope', 'sharedPaths', 'teams', 'gates', 'changes', 'blockers']) requireThat(Array.isArray(plan[key]), `${key} must be an array`);
  requireThat(plan.inScope.length > 0 && plan.outOfScope.length > 0 && [...plan.inScope, ...plan.outOfScope].every(nonempty), 'Define scope and exclusions');
  requireThat(Number.isInteger(plan.reviewLimit) && plan.reviewLimit > 0 && Number.isInteger(plan.reviewRound) && plan.reviewRound >= 0, 'Invalid review bounds');
  requireThat(plan.reviewRound <= plan.reviewLimit, 'Review limit exceeded; record bounded repair decision');
  plan.sharedPaths.forEach(pattern);
  const paths = [], ids = new Set(), worktrees = new Set();
  for (const team of plan.teams) {
    requireThat(nonempty(team.id) && !ids.has(team.id), 'Team IDs must be unique'); ids.add(team.id);
    requireThat(nonempty(team.worktree) && isAbsolute(team.worktree), `Absolute worktree required for ${team.id}`);
    const normalized = existsSync(team.worktree) ? realpathSync(team.worktree) : resolve(team.worktree);
    requireThat(!worktrees.has(normalized), 'Teams must use separate worktrees'); worktrees.add(normalized);
    requireThat(Array.isArray(team.allowedPaths) && team.allowedPaths.length && Array.isArray(team.dependsOn), `Missing paths/dependencies for ${team.id}`);
    for (const path of team.allowedPaths) {
      pattern(path);
      requireThat(!plan.sharedPaths.some((shared) => overlap(shared, path)), `${team.id} overlaps shared owner: ${path}`);
      requireThat(!paths.some((p) => p.id !== team.id && overlap(p.path, path)), `Overlapping team ownership: ${path}`);
      paths.push({ id: team.id, path });
    }
  }
  const active = new Set(), visited = new Set();
  function visit(id) {
    requireThat(!active.has(id), `Dependency cycle at ${id}`);
    if (visited.has(id)) return;
    requireThat(ids.has(id), `Unknown dependency ${id}`);
    active.add(id); plan.teams.find((t) => t.id === id).dependsOn.forEach(visit); active.delete(id); visited.add(id);
  }
  ids.forEach(visit);
  const gates = new Set();
  for (const gate of plan.gates) {
    requireThat(nonempty(gate.id) && !gates.has(gate.id), 'Gate IDs must be unique'); gates.add(gate.id);
    requireThat(['technical', 'user'].includes(gate.kind) && typeof gate.required === 'boolean' && ['pending', 'pass', 'fail'].includes(gate.status), `Invalid gate ${gate.id}`);
  }
  for (const kind of ['technical', 'user']) requireThat(plan.gates.some((g) => g.required && g.kind === kind), `Missing required ${kind} gate`);
  for (const b of plan.blockers) requireThat(nonempty(b.id) && ['open', 'resolved'].includes(b.status) && nonempty(b.owner) && nonempty(b.nextAction), 'Blocker needs id/status/owner/nextAction');
  for (const c of plan.changes) requireThat(Number.isInteger(c.revision) && c.revision > 1 && c.revision <= plan.revision && ['request', 'source', 'impact', 'decision'].every((k) => nonempty(c[k])), 'Invalid change record');
  if (plan.revision > 1) requireThat(plan.changes.some((c) => c.revision === plan.revision), 'Current revision has no change decision');
}
function scope(repo, plan, teamId) {
  const team = plan.teams.find((t) => t.id === teamId);
  requireThat(team, 'Unknown --team');
  const worktree = realpathSync(team.worktree);
  const registered = list(git(repo, 'worktree', 'list', '--porcelain', '-z')).filter((s) => s.startsWith('worktree ')).map((s) => realpathSync(s.slice(9)));
  requireThat(registered.includes(worktree) && worktree !== repo, 'Team path must be a separate registered worktree');
  const base = sha(worktree, plan.baseSha);
  git(worktree, 'merge-base', '--is-ancestor', base, 'HEAD');
  // Include committed, staged, unstaged and untracked files; --no-renames checks both sides of a move.
  const files = [...new Set([
    ...list(git(worktree, 'diff', '--name-only', '--no-renames', '-z', base)),
    ...list(git(worktree, 'ls-files', '--others', '--exclude-standard', '-z')),
  ])];
  const denied = files.filter((file) => !team.allowedPaths.some((rule) => covers(rule, file)));
  requireThat(!denied.length, `Out-of-scope files: ${denied.join(', ')}`);
  console.log(JSON.stringify({ team: team.id, files, head: git(worktree, 'rev-parse', 'HEAD').trim() }, null, 2));
}
function main() {
  const [command, ...args] = process.argv.slice(2), options = {};
  for (let i = 0; i < args.length; i += 2) {
    requireThat(['--repo', '--id', '--plan', '--phase', '--team'].includes(args[i]) && args[i + 1] && !args[i + 1].startsWith('--'), 'Use command --repo PATH [--id ID | --plan PATH --phase dispatch|scope|acceptance|close]');
    requireThat(!(args[i].slice(2) in options), 'Duplicate option'); options[args[i].slice(2)] = args[i + 1];
  }
  requireThat(options.repo, '--repo is required');
  const repo = realpathSync(options.repo);
  requireThat(realpathSync(git(repo, 'rev-parse', '--show-toplevel').trim()) === repo, '--repo must be the repository root');
  if (command === 'inspect') {
    console.log(JSON.stringify({ head: git(repo, 'rev-parse', 'HEAD').trim(), branches: git(repo, 'branch', '-avv').trim(), worktrees: git(repo, 'worktree', 'list', '--porcelain').trim(), dirty: dirty(repo), remoteFreshness: 'not checked' }, null, 2)); return;
  }
  if (command === 'init') {
    requireThat(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(options.id ?? ''), 'Use a lowercase hyphenated --id');
    const target = resolve(repo, 'docs/delivery', options.id);
    mkdirSync(target, { recursive: true });
    requireThat(inside(repo, realpathSync(target)), 'Record directory escapes repo');
    const plan = JSON.parse(readFileSync(new URL('../assets/plan.json', import.meta.url), 'utf8'));
    plan.id = options.id; plan.baseSha = git(repo, 'rev-parse', 'HEAD').trim();
    const file = resolve(target, 'plan.json'); writeFileSync(file, JSON.stringify(plan, null, 2) + '\n', { flag: 'wx' }); console.log(file); return;
  }
  requireThat(command === 'check' && options.plan, 'Expected inspect, init or check --plan PATH');
  const file = realpathSync(resolve(repo, options.plan));
  requireThat(inside(repo, file), 'Plan must be inside repository');
  const ledgerDir = dirname(file);
  requireThat(relative(repo, ledgerDir).split(sep).length >= 3 && relative(repo, ledgerDir).split(sep).slice(0, 2).join('/') === 'docs/delivery', 'Plan belongs in docs/delivery/<id>/');
  const plan = JSON.parse(readFileSync(file, 'utf8')); validate(plan);
  if (options.phase === 'scope') { scope(repo, plan, options.team); return; }
  requireThat(['dispatch', 'acceptance', 'close'].includes(options.phase), 'Invalid --phase');
  const commit = sha(repo, options.phase === 'dispatch' ? plan.baseSha : plan.candidateSha);
  onlyLedgerSince(repo, commit, ledgerDir);
  if (options.phase === 'dispatch') {
    for (const team of plan.teams) {
      scope(repo, plan, team.id);
      requireThat(git(team.worktree, 'rev-parse', 'HEAD').trim() === commit && dirty(team.worktree).length === 0, `Team ${team.id} must start clean at baseSha`);
    }
  }
  if (options.phase !== 'dispatch') {
    requireThat(!plan.blockers.some((b) => b.status === 'open'), 'Unresolved blockers prevent acceptance');
    for (const gate of plan.gates.filter((g) => g.required && (options.phase === 'close' || g.kind === 'technical'))) {
      requireThat(gate.status === 'pass' && gate.revision === plan.revision && sha(repo, gate.sha) === commit, `Missing or stale evidence: ${gate.id}`);
      requireThat(nonempty(gate.evidence) && !isAbsolute(gate.evidence), `Missing evidence file: ${gate.id}`);
      const evidence = realpathSync(resolve(repo, gate.evidence));
      requireThat(inside(repo, evidence) && readFileSync(evidence).length > 0, `Invalid evidence: ${gate.id}`);
      if (gate.kind === 'user') requireThat(nonempty(gate.acceptedBy) && nonempty(gate.decisionRef), `Missing actual user sign-off: ${gate.id}`);
    }
  }
  console.log(`PASS ${options.phase}: ${plan.id} revision ${plan.revision}. Record checks only; verify evidence truth separately.`);
}
try { main(); } catch (error) { console.error(`FAIL: ${error.message}`); process.exitCode = 1; }
