import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { APP_ROOT, computeBuildArtifacts } from '../scripts/build.mjs';

const sha256 = buf => createHash('sha256').update(buf).digest('hex');

async function listDistFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await listDistFiles(full)));
    else files.push(path.relative(APP_ROOT, full).replaceAll('\\', '/'));
  }
  return files.sort();
}

test('committed build artifacts match deterministic source build byte-for-byte', async () => {
  const expected = await computeBuildArtifacts({ rootDir: APP_ROOT });

  const [indexHtml, cvHtml, versionJson, manifestRaw] = await Promise.all([
    readFile(path.join(APP_ROOT, 'index.html'), 'utf8'),
    readFile(path.join(APP_ROOT, 'cv.html'), 'utf8'),
    readFile(path.join(APP_ROOT, 'version.json'), 'utf8'),
    readFile(path.join(APP_ROOT, 'pages-manifest.json'), 'utf8'),
  ]);

  assert.equal(indexHtml.replace(/\r\n/g, '\n'), expected.indexHtml);
  assert.equal(cvHtml.replace(/\r\n/g, '\n'), expected.cvHtml);
  assert.equal(versionJson.replace(/\r\n/g, '\n'), expected.versionJson);
  assert.equal(manifestRaw.replace(/\r\n/g, '\n'), expected.manifestJson);

  const version = JSON.parse(versionJson);
  assert.equal(version.buildId, expected.buildId);
  assert.match(indexHtml, new RegExp(`<meta name="app-build-id" content="${expected.buildId}">`));
  assert.match(cvHtml, new RegExp(`<meta name="app-build-id" content="${expected.buildId}">`));

  const manifest = JSON.parse(manifestRaw);
  assert.equal(manifest.buildId, expected.buildId);

  const actualDist = await listDistFiles(path.join(APP_ROOT, 'assets', 'dist'));
  for (const [relPath, expectedContent] of expected.distFiles.entries()) {
    assert.ok(actualDist.includes(relPath), `Missing built asset ${relPath}`);
    const onDisk = (await readFile(path.join(APP_ROOT, relPath), 'utf8')).replace(/\r\n/g, '\n');
    assert.equal(onDisk, expectedContent, `Stale content in ${relPath}`);
    assert.equal(manifest.files[relPath], sha256(Buffer.from(onDisk, 'utf8')));
  }
});

test('package.json has zero external dependencies and MIT LICENSE exists', async () => {
  const pkg = JSON.parse(await readFile(path.join(APP_ROOT, 'package.json'), 'utf8'));
  assert.equal(pkg.dependencies, undefined);
  assert.equal(pkg.devDependencies, undefined);
  assert.equal(pkg.license, 'MIT');

  const license = await readFile(path.join(APP_ROOT, 'LICENSE'), 'utf8');
  assert.match(license, /^MIT License/m);
  assert.match(license, /Copyright \(c\) 2026 Technoetic/);
});
