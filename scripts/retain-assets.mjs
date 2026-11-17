import { createHash, randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { APP_ROOT } from './build.mjs';

const DIST_ASSET = /^assets\/dist\/(?:[a-z\d_-]+\/)*[a-z\d_.-]+\.(js|css)$/i;

async function readBoundedBytes(response, maxBytes) {
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const chunks = [];
  let total = 0;
  for await (const chunk of response.body) {
    total += chunk.length;
    if (total > maxBytes) throw new Error('Response exceeded byte limit');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export async function retainAssets({
  baseUrl = 'https://technoetic.github.io/ax-portfolio/',
  outDir = APP_ROOT,
  allowEmpty = false,
  fetcher = fetch,
} = {}) {
  const base = new URL(baseUrl);
  const nonce = randomUUID();
  const root = path.resolve(outDir);

  const request = async relative => {
    const url = new URL(relative, base);
    url.searchParams.set('_retain', nonce);
    const response = await fetcher(url, {
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(15000),
    });
    if (response.url && new URL(response.url).origin !== base.origin) {
      throw new Error('Origin redirect rejected');
    }
    return response;
  };

  const manifestRes = await request('pages-manifest.json');
  if (manifestRes.status === 404 && allowEmpty) {
    return { retained: 0, previousBuild: null };
  }
  if (!manifestRes.ok) {
    throw new Error(`Previous pages-manifest.json unavailable: HTTP ${manifestRes.status}`);
  }
  const manifest = JSON.parse((await readBoundedBytes(manifestRes, 512 * 1024)).toString('utf8'));
  if (manifest?.schema !== 1 || typeof manifest.buildId !== 'string' || !manifest.files || typeof manifest.files !== 'object') {
    throw new Error('Invalid pages-manifest.json structure');
  }

  const assets = Object.entries(manifest.files).filter(([relPath]) => DIST_ASSET.test(relPath));
  const verified = [];
  let totalBytes = 0;

  for (const [relPath, expectedDigest] of assets) {
    if (!/^[a-f\d]{64}$/i.test(expectedDigest)) {
      throw new Error(`Invalid digest for ${relPath}`);
    }
    const bytes = await readBoundedBytes(await request(relPath), 2 * 1024 * 1024);
    totalBytes += bytes.length;
    if (totalBytes > 8 * 1024 * 1024) throw new Error('Retained assets exceeded total budget');
    const actualDigest = createHash('sha256').update(bytes).digest('hex');
    if (actualDigest !== expectedDigest) {
      throw new Error(`SHA-256 mismatch for ${relPath}`);
    }
    const dest = path.resolve(root, relPath);
    if (!dest.startsWith(root + path.sep)) {
      throw new Error('Path traversal rejected');
    }
    verified.push([dest, bytes]);
  }

  for (const [dest, bytes] of verified) {
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, bytes);
  }
  return { retained: verified.length, previousBuild: manifest.buildId };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(await retainAssets({ allowEmpty: process.argv.includes('--allow-empty') })));
}
