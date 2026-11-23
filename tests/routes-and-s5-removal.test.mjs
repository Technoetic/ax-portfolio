import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { APP_ROOT } from '../scripts/build.mjs';
import {
  BOOTSTRAP_PARAM,
  buildReloadUrl,
  cleanBootstrapUrl,
  LEGACY_SLIDE_ALIASES,
  parseSlideHash,
  SLIDE_IDS,
} from '../src/js/shared/routes.js';

test('index.html has 15 slides with #smv, #sw6, and #sctt added and #s5/#s4 retired', async () => {
  const [indexHtml, cvHtml] = await Promise.all([
    readFile(path.join(APP_ROOT, 'index.html'), 'utf8'),
    readFile(path.join(APP_ROOT, 'cv.html'), 'utf8'),
  ]);

  const sectionIds = [...indexHtml.matchAll(/<section\b[^>]*\bclass="[^"]*\bslide\b[^"]*"[^>]*\bid="([^"]+)"/g)].map(
    m => m[1],
  );
  assert.deepEqual(sectionIds, [...SLIDE_IDS]);
  assert.equal(sectionIds.length, 15);
  assert.ok(sectionIds.includes('smv'), '#smv slide must exist');
  assert.ok(sectionIds.includes('sw6'), '#sw6 slide must exist');
  assert.ok(sectionIds.includes('sctt'), '#sctt slide must exist');
  assert.ok(!sectionIds.includes('s5'), '#s5 slide must not exist');
  assert.ok(!sectionIds.includes('s4'), '#s4 slide must not exist');
  assert.match(indexHtml, /<span class="counter" id="counter">01 \/ 15<\/span>/);

  const forbiddenTokens = [
    'id="s5"',
    'id="stepDetail"',
    'commands-data.js',
    'steps-data.js',
    'marked.min.js',
    'd2coding',
    'D2Coding',
    'JetBrains Mono',
    'claude-code-commands',
    '커스텀 슬래시 커맨드',
    'Claude Code 커스텀 커맨드',
    'nova.igrowth.kr',
  ];
  for (const token of forbiddenTokens) {
    assert.ok(!indexHtml.includes(token), `index.html must not contain retired/dead token: ${token}`);
    assert.ok(!cvHtml.includes(token), `cv.html must not contain retired/dead token: ${token}`);
  }
});

test('parseSlideHash redirects #s5 and #s4 to #sav and handles deep links & unknown hashes', () => {
  assert.equal(LEGACY_SLIDE_ALIASES.s5, 'sav');
  assert.equal(LEGACY_SLIDE_ALIASES.s4, 'sav');

  assert.deepEqual(parseSlideHash('#s5'), {
    id: 'sav',
    aliased: true,
    unknown: false,
    hadHash: true,
  });
  assert.deepEqual(parseSlideHash('#s4'), {
    id: 'sav',
    aliased: true,
    unknown: false,
    hadHash: true,
  });
  assert.deepEqual(parseSlideHash('#sref'), {
    id: 'sref',
    aliased: false,
    unknown: false,
    hadHash: true,
  });
  assert.deepEqual(parseSlideHash('#smv'), {
    id: 'smv',
    aliased: false,
    unknown: false,
    hadHash: true,
  });
  assert.deepEqual(parseSlideHash('#sw6'), {
    id: 'sw6',
    aliased: false,
    unknown: false,
    hadHash: true,
  });
  assert.deepEqual(parseSlideHash('#sctt'), {
    id: 'sctt',
    aliased: false,
    unknown: false,
    hadHash: true,
  });
  assert.deepEqual(parseSlideHash(''), {
    id: 's0',
    aliased: false,
    unknown: false,
    hadHash: false,
  });
  assert.deepEqual(parseSlideHash('#unknown-slide'), {
    id: 's0',
    aliased: false,
    unknown: true,
    hadHash: true,
  });
});

test('bootstrap URL helpers preserve hashes and strip only the bootstrap query parameter', () => {
  const reloadUrl = buildReloadUrl(
    'https://technoetic.github.io/ax-portfolio/#sav',
    'axp-123456789abc',
    'nonce1',
    BOOTSTRAP_PARAM,
  );
  assert.equal(
    reloadUrl,
    'https://technoetic.github.io/ax-portfolio/?_axp=axp-123456789abc-nonce1#sav',
  );
  assert.equal(
    cleanBootstrapUrl(reloadUrl, BOOTSTRAP_PARAM),
    'https://technoetic.github.io/ax-portfolio/#sav',
  );
});

test('reference-atlas.html redirects to index.html#sref', async () => {
  const redirectHtml = await readFile(path.join(APP_ROOT, 'reference-atlas.html'), 'utf8');
  assert.match(redirectHtml, /url=index\.html#sref/);
  assert.match(redirectHtml, /index\.html#sref/);
});
