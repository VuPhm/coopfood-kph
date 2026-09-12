import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('./cycle.mjs', import.meta.url));
function fixture(t) {
  const dir = mkdtempSync(resolve(tmpdir(), 'delivery-cycle-test-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const repo = resolve(dir, 'repo'); mkdirSync(repo);
  const git = (...args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  git('init', '-q'); git('config', 'user.name', 'Test'); git('config', 'user.email', 'test@example.invalid');
  writeFileSync(resolve(repo, 'code.txt'), 'initial'); git('add', '.'); git('commit', '-qm', 'base');
  const base = git('rev-parse', 'HEAD');
  const run = (...args) => spawnSync(process.execPath, [cli, ...args, '--repo', repo], { encoding: 'utf8' });
  assert.equal(run('init', '--id', 'sample').status, 0);
  const path = 'docs/delivery/sample/plan.json';
  const plan = JSON.parse(readFileSync(resolve(repo, path), 'utf8'));
  Object.assign(plan, { objective: 'Deliver test flow', inScope: ['flow'], outOfScope: ['deployment'], integrationOwner: 'root', candidateSha: base,
    gates: [{ id: 'test', kind: 'technical', required: true, status: 'pass', revision: 1, sha: base, evidence: 'docs/delivery/sample/test.md' },
      { id: 'uat', kind: 'user', required: true, status: 'pending' }] });
  writeFileSync(resolve(repo, 'docs/delivery/sample/test.md'), 'Synthetic fixture test evidence; not real delivery acceptance.');
  const save = () => { writeFileSync(resolve(repo, path), JSON.stringify(plan)); git('add', '.'); if (git('status', '--porcelain')) git('commit', '-qm', 'record'); };
  const check = (phase, ...args) => run('check', '--plan', path, '--phase', phase, ...args);
  return { repo, dir, git, base, plan, save, check, run };
}

test('init refuses overwrite and traversal', (t) => {
  const f = fixture(t); const before = readFileSync(resolve(f.repo, 'docs/delivery/sample/plan.json'), 'utf8');
  assert.notEqual(f.run('init', '--id', 'sample').status, 0);
  assert.equal(readFileSync(resolve(f.repo, 'docs/delivery/sample/plan.json'), 'utf8'), before);
  assert.notEqual(f.run('init', '--id', '../escape').status, 0);
});
test('technical readiness does not imply user acceptance', (t) => {
  const f = fixture(t); f.save();
  assert.equal(f.check('dispatch').status, 0);
  assert.equal(f.check('acceptance').status, 0);
  assert.notEqual(f.check('close').status, 0);
  Object.assign(f.plan.gates[1], { status: 'pass', revision: 1, sha: f.base, evidence: 'docs/delivery/sample/test.md' }); f.save();
  assert.match(f.check('close').stderr, /sign-off/);
  Object.assign(f.plan.gates[1], { acceptedBy: 'Synthetic test actor', decisionRef: 'synthetic://fixture-only' }); f.save();
  assert.equal(f.check('close').status, 0);
});
test('dirty and newer code cannot reuse old evidence', (t) => {
  const f = fixture(t); f.save(); writeFileSync(resolve(f.repo, 'code.txt'), 'changed');
  assert.match(f.check('acceptance').stderr, /dirty/);
  f.git('add', '.'); f.git('commit', '-qm', 'change code');
  assert.match(f.check('acceptance').stderr, /Code changed/);
});
test('revision and blockers invalidate acceptance', (t) => {
  const f = fixture(t); f.plan.revision = 2;
  f.plan.changes = [{ revision: 2, request: 'change', source: 'test', impact: 'flow', decision: 'retest' }]; f.save();
  assert.match(f.check('acceptance').stderr, /stale evidence/);
  f.plan.gates[0].revision = 2;
  f.plan.blockers = [{ id: 'bug', status: 'open', owner: 'root', nextAction: 'fix flow' }]; f.save();
  assert.match(f.check('acceptance').stderr, /Unresolved blockers/);
});
test('overlapping paths and cyclic dependencies fail', (t) => {
  const f = fixture(t);
  f.plan.teams = [{ id: 'a', worktree: resolve(f.dir, 'a'), allowedPaths: ['src/**'], dependsOn: [] },
    { id: 'b', worktree: resolve(f.dir, 'b'), allowedPaths: ['src/deep/file.ts'], dependsOn: [] }]; f.save();
  assert.match(f.check('dispatch').stderr, /Overlapping/);
  f.plan.teams[1].allowedPaths = ['other/**']; f.plan.teams[0].dependsOn = ['b']; f.plan.teams[1].dependsOn = ['a']; f.save();
  assert.match(f.check('dispatch').stderr, /cycle/);
});
test('scope checks committed, untracked and renamed paths', (t) => {
  const f = fixture(t), worktree = resolve(f.dir, 'a');
  f.git('worktree', 'add', '--detach', worktree, f.base);
  f.plan.teams = [{ id: 'a', worktree, allowedPaths: ['code.txt'], dependsOn: [] }]; f.save();
  assert.equal(f.check('scope', '--team', 'a').status, 0);
  writeFileSync(resolve(worktree, 'outside.txt'), 'untracked');
  assert.match(f.check('scope', '--team', 'a').stderr, /outside.txt/);
  rmSync(resolve(worktree, 'outside.txt'));
  execFileSync('git', ['-C', worktree, 'mv', 'code.txt', 'outside.txt']);
  execFileSync('git', ['-C', worktree, 'commit', '-qm', 'move']);
  assert.match(f.check('scope', '--team', 'a').stderr, /outside.txt/);
});
test('scope rejects prefix lookalikes and shared ownership', (t) => {
  const f = fixture(t); f.plan.sharedPaths = ['packages/ui/**'];
  f.plan.teams = [{ id: 'a', worktree: resolve(f.dir, 'a'), allowedPaths: ['packages/ui/button.ts'], dependsOn: [] }]; f.save();
  assert.match(f.check('dispatch').stderr, /shared owner/);
  f.plan.sharedPaths = []; f.plan.teams[0].allowedPaths = ['../outside']; f.save();
  assert.notEqual(f.check('dispatch').status, 0);
});

test('dispatch requires actual clean worktrees at the reviewed base', (t) => {
  const f = fixture(t), worktree = resolve(f.dir, 'team');
  f.plan.teams = [{ id: 'team', worktree, allowedPaths: ['code.txt'], dependsOn: [] }]; f.save();
  assert.notEqual(f.check('dispatch').status, 0);
  f.git('worktree', 'add', '--detach', worktree, f.base);
  assert.equal(f.check('dispatch').status, 0);
  writeFileSync(resolve(worktree, 'code.txt'), 'pending');
  assert.match(f.check('dispatch').stderr, /start clean/);
});

test('scope rejects a sibling with a matching string prefix', (t) => {
  const f = fixture(t), worktree = resolve(f.dir, 'team');
  f.git('worktree', 'add', '--detach', worktree, f.base);
  f.plan.teams = [{ id: 'team', worktree, allowedPaths: ['src/**'], dependsOn: [] }]; f.save();
  mkdirSync(resolve(worktree, 'src-other')); writeFileSync(resolve(worktree, 'src-other/file.ts'), 'outside');
  assert.match(f.check('scope', '--team', 'team').stderr, /src-other/);
});
