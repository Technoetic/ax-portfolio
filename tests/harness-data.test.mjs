import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const sha256 = value => createHash('sha256').update(value, 'utf8').digest('hex');
const metadata = JSON.parse(await read('assets/harness50-source.json'));
const context = { window: {} };
runInNewContext(await read('steps-data.js'), context, { timeout: 1000 });
const steps = JSON.parse(JSON.stringify(context.window.STEPS_FULL));
const fallbackMatch = (await read('assets/portfolio.js')).match(/^\s*const STEPS = (\[[^\r\n]*\]);$/m);
assert.ok(fallbackMatch, 'The no-body step title fallback must remain available');
const fallback = JSON.parse(fallbackMatch[1]);

test('step browsing identifies the released research-free 36 profile', () => {
  assert.equal(metadata.repository, 'https://github.com/Technoetic/harness50');
  assert.equal(metadata.ref, 'v2.13.0');
  assert.equal(metadata.commit, 'aa4c622cf05d88a51f4b5defb68d0251d8f4fde6');
  assert.equal(metadata.version, '2.13.0');
  assert.equal(metadata.synced_on, '2026-10-03');
  assert.equal(metadata.workflow_profile, 'research-free-36-v1');
  assert.equal(metadata.step_count, 36);
  assert.equal(metadata.body_normalization, 'UTF-8, LF line endings; omit YAML frontmatter and surrounding whitespace only');
  assert.equal(metadata.source_index.path, 'codex/assets/profiles/research-free-36-v1/steps/index.json');
  assert.equal(metadata.source_index.sha256, '716faa505091f2ab41b0a3a873b8e953831bb1f5a34c156ed899f194f7e44780');
});

test('all source and displayed-body hashes stay bound to the released Git blobs', () => {
  assert.equal(metadata.steps.length, 36);
  const manifest = metadata.steps.map((entry, index) => {
    assert.equal(entry.step, index + 1);
    assert.equal(entry.path, `assets/profiles/research-free-36-v1/steps/step${String(index + 1).padStart(3, '0')}.md`);
    assert.equal(typeof entry.title, 'string');
    assert.match(entry.source_sha256, /^[a-f0-9]{64}$/);
    assert.match(entry.body_sha256, /^[a-f0-9]{64}$/);
    return [entry.step, entry.title, entry.path, entry.source_sha256, entry.body_sha256];
  });
  // Independently derived from the v2.13.0 index and raw Git blobs, not portfolio output.
  assert.equal(sha256(JSON.stringify(manifest)), '4cf1c0844a9f01ca824c91c19ec607f366b5b6c494f8683fee30c4eb6e0942ae');
});

test('the browser payload exposes every numbered title and complete normalized body', () => {
  assert.equal(steps.length, 36);
  for (const [index, step] of steps.entries()) {
    const entry = metadata.steps[index];
    assert.equal(step.length, 3);
    const [number, title, body] = step;
    assert.equal(number, index + 1);
    assert.equal(number, entry.step);
    assert.equal(title, entry.title);
    assert.equal(typeof body, 'string');
    assert.ok(body.length > 0);
    assert.equal(body, body.trim());
    assert.ok(!body.includes('\r'), `Step ${number} must use LF line endings`);
    assert.ok(!body.startsWith('---\n'), `Step ${number} must omit YAML frontmatter`);
    assert.equal(sha256(body), entry.body_sha256, `Step ${number} body drifted from its source`);
  }
  assert.equal(steps[15][1], '의존성 게이트 검증');
  assert.equal(steps[35][1], '콘솔 에러 수집 및 해결');
});

test('missing body data still lists the same 36 titles in the same order', () => {
  assert.deepEqual(fallback, steps.map(([number, title]) => [number, title]));
  assert.equal(fallback.length, 36);
});
