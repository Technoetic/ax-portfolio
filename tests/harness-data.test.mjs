import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const sha256 = value => createHash('sha256').update(value, 'utf8').digest('hex');
const metadata = JSON.parse(await read('assets/harness50-source.json'));
const context = { window: {} };
// Verify the retained historical payload, which the live portfolio no longer loads.
runInNewContext(await read('steps-data.js'), context, { timeout: 1000 });
const steps = JSON.parse(JSON.stringify(context.window.STEPS_FULL));

test('archived step data identifies the released planning-first 14 profile', () => {
  assert.equal(metadata.repository, 'https://github.com/Technoetic/harness14');
  assert.equal(metadata.ref, 'v4.2.0');
  assert.equal(metadata.commit, '49735c60747ac8d9d64165ec8c1beb3c1cbc082e');
  assert.equal(metadata.version, '4.2.0');
  assert.equal(metadata.synced_on, '2026-10-11');
  assert.equal(metadata.plugin_install_id, 'harness20');
  assert.equal(metadata.workflow_profile, 'planning-first-14-v1');
  assert.equal(metadata.step_count, 14);
  assert.equal(metadata.body_normalization, 'UTF-8, LF line endings; omit YAML frontmatter and surrounding whitespace only');
  assert.equal(metadata.source_index.path, 'codex/assets/profiles/planning-first-14-v1/steps/index.json');
  assert.equal(metadata.source_index.sha256, 'e579d89625d4bdcfd501b48fed70be594c6114745fbef823e29314d882a44c5b');
});

test('archived source and normalized-body hashes stay bound to the released Git blobs', () => {
  assert.equal(metadata.steps.length, 14);
  const manifest = metadata.steps.map((entry, index) => {
    assert.equal(entry.step, index + 1);
    assert.equal(entry.path, `assets/profiles/planning-first-14-v1/steps/step${String(index + 1).padStart(3, '0')}.md`);
    assert.equal(typeof entry.title, 'string');
    assert.match(entry.source_sha256, /^[a-f0-9]{64}$/);
    assert.match(entry.body_sha256, /^[a-f0-9]{64}$/);
    return [entry.step, entry.title, entry.path, entry.source_sha256, entry.body_sha256];
  });
  // Independently derived from the v4.2.0 index and raw Git blobs, not portfolio output.
  assert.equal(sha256(JSON.stringify(manifest)), '4869f48be00ffd7f2b8fd22711cf6c48ceb459c937aa587fb6d0753621056ad3');
});

test('the archived payload retains every numbered title and complete normalized body', () => {
  assert.equal(steps.length, 14);
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
  assert.equal(steps[0][1], '기획: 요구사항 기반 (독립 검증 루프)');
  assert.equal(steps[9][1], '스크린샷 기반 상세 E2E 테스트');
  assert.equal(steps[13][1], '콘솔 에러 수집 및 해결');
});
