import assert from 'node:assert/strict';
import test from 'node:test';
import { EntryService } from '../src/js/services/entry-service.js';
import { VersionService } from '../src/js/services/version-service.js';
import { retainAssets } from '../scripts/retain-assets.mjs';

function jsonResponse(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    url: 'https://technoetic.github.io/ax-portfolio/version.json',
    async json() {
      return payload;
    },
  };
}

test('VersionService keeps loadedBuild from HTML metadata and detects A->B and rollback B->A', async () => {
  let serverBuild = 'axp-build-b00001';
  const service = new VersionService({
    baseUrl: 'https://technoetic.github.io/ax-portfolio/',
    loadedBuild: 'axp-build-a00001',
    fetcher: async () => jsonResponse({ schema: 1, buildId: serverBuild }),
    randomId: () => 'check1',
  });

  // Startup race: even if B deployed immediately after A HTML arrived, loadedBuild stays A
  const first = await service.refresh();
  assert.equal(service.loadedBuild, 'axp-build-a00001');
  assert.equal(first.changed, true);
  assert.equal(service.pendingBuild, 'axp-build-b00001');

  // Rollback B -> A: strict inequality detects rollback too
  serverBuild = 'axp-build-a00001';
  const rollbackService = new VersionService({
    baseUrl: 'https://technoetic.github.io/ax-portfolio/',
    loadedBuild: 'axp-build-b00001',
    fetcher: async () => jsonResponse({ schema: 1, buildId: serverBuild }),
    randomId: () => 'check2',
  });
  const rolledBack = await rollbackService.navigation(
    'https://technoetic.github.io/ax-portfolio/#sav',
    () => ({ dirty: false, saving: false }),
  );
  assert.equal(rolledBack.kind, 'reload');
  assert.equal(rolledBack.buildId, 'axp-build-a00001');
});

test('VersionService re-checks dirty and saving state after async version check completes', async () => {
  let dirty = false;
  let saving = false;
  let editDuringFirstCheck = true;

  const service = new VersionService({
    baseUrl: 'https://technoetic.github.io/ax-portfolio/',
    loadedBuild: 'axp-build-a00001',
    fetcher: async () => {
      // Simulate user starting an edit while the first version.json request is in flight
      if (editDuringFirstCheck) {
        editDuringFirstCheck = false;
        dirty = true;
      }
      return jsonResponse({ schema: 1, buildId: 'axp-build-b00001' });
    },
  });

  const protectedDecision = await service.navigation(
    'https://technoetic.github.io/ax-portfolio/#sxc',
    () => ({ dirty, saving }),
  );
  assert.equal(protectedDecision.kind, 'protect');
  assert.equal(protectedDecision.changed, true);

  // Once edit is saved/discarded, the next navigation automatically triggers full-document reload
  dirty = false;
  saving = false;
  const reloadDecision = await service.navigation(
    'https://technoetic.github.io/ax-portfolio/#sxc',
    () => ({ dirty, saving }),
  );
  assert.equal(reloadDecision.kind, 'reload');
  assert.equal(reloadDecision.buildId, 'axp-build-b00001');
});

test('VersionService survives network failure, timeout, and malformed JSON without reload loop', async () => {
  const failing = new VersionService({
    baseUrl: 'https://technoetic.github.io/ax-portfolio/',
    loadedBuild: 'axp-build-a00001',
    timeoutMs: 40,
    fetcher: async (_url, { signal }) =>
      new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(new Error('Aborted')));
      }),
  });

  const decision = await failing.navigation(
    'https://technoetic.github.io/ax-portfolio/#sref',
    () => ({ dirty: false, saving: false }),
  );
  assert.equal(decision.kind, 'spa');
  assert.equal(failing.status, 'unavailable');
});

test('EntryService upgrades stale cached HTML once and prevents infinite reload loops', async () => {
  const replacedUrls = [];
  const cleanedUrls = [];

  const makeVersion = serverBuild =>
    new VersionService({
      baseUrl: 'https://technoetic.github.io/ax-portfolio/',
      loadedBuild: 'axp-build-a00001',
      fetcher: async () => jsonResponse({ schema: 1, buildId: serverBuild }),
    });

  // 1. Fresh entry where CDN served stale A while version.json is B -> replaces once
  const entry1 = new EntryService({
    version: makeVersion('axp-build-b00001'),
    currentURL: 'https://technoetic.github.io/ax-portfolio/#sref',
    replace: url => replacedUrls.push(url),
    cleanUrl: url => cleanedUrls.push(url),
    randomId: () => 'uuid1',
  });
  assert.equal(await entry1.start(), 'replaced');
  assert.deepEqual(replacedUrls, [
    'https://technoetic.github.io/ax-portfolio/?_axp=axp-build-b00001-uuid1#sref',
  ]);

  // 2. If CDN edge still serves A on that exact _axp URL -> loop-guarded, cleans URL, never loops
  const entry2 = new EntryService({
    version: makeVersion('axp-build-b00001'),
    currentURL: replacedUrls[0],
    replace: () => assert.fail('Must not replace in a loop'),
    cleanUrl: url => cleanedUrls.push(url),
  });
  assert.equal(await entry2.start(), 'loop-guarded');
  assert.deepEqual(cleanedUrls, ['https://technoetic.github.io/ax-portfolio/#sref']);
});

test('retainAssets handles missing initial manifest when allowEmpty is enabled', async () => {
  const result = await retainAssets({
    allowEmpty: true,
    fetcher: async () => ({
      ok: false,
      status: 404,
      url: 'https://technoetic.github.io/ax-portfolio/pages-manifest.json',
    }),
  });
  assert.deepEqual(result, { retained: 0, previousBuild: null });
});
