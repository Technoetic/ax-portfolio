import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { startSite, createBrowser, openPage } from './browser.mjs';

let site, browser;
before(async () => { site = await startSite(); browser = await createBrowser(); });
after(async () => { await browser?.close(); await site?.close(); });

test('portfolio and CV local links, section anchors, images and scripts resolve', async () => {
  for (const path of ['', 'cv.html']) {
    const page = await openPage(browser, site, { path });
    try {
      const urls = await page.locator('[href],[src]').evaluateAll(nodes => [...new Set(nodes
        .map(node => node.getAttribute('href') || node.getAttribute('src'))
        .filter(Boolean).map(value => new URL(value, document.baseURI).href))]);
      const failures = [];
      for (const value of urls) {
        const url = new URL(value);
        if (url.origin !== new URL(site.url).origin) continue;
        const response = await page.request.get(url.href);
        if (response.status() !== 200) { failures.push(`${url.pathname}: HTTP ${response.status()}`); continue; }
        if (url.hash) {
          const html = await response.text();
          const id = decodeURIComponent(url.hash.slice(1));
          if (!html.includes(`id="${id}"`)) failures.push(`${url.pathname}: missing ${url.hash}`);
        }
      }
      assert.deepEqual(failures, []);
    } finally { await page.context().close(); }
  }
});

test('navigation is usable while optional CDN requests are still pending', async () => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  const pending = [];
  await context.route('**/*', route => {
    if (new URL(route.request().url()).origin === new URL(site.url).origin) return route.continue();
    pending.push(route);
  });
  try {
    const page = await context.newPage();
    await page.goto(site.url, { waitUntil: 'commit' });
    await page.locator('#section-select').selectOption('sav', { timeout: 10000 });
    assert.equal(await page.locator('#sav').getAttribute('aria-hidden'), 'false');
    assert.equal(new URL(page.url()).hash, '#sav');
    assert.ok(pending.length > 0);
  } finally {
    await Promise.all(pending.map(route => route.abort().catch(() => {})));
    await context.close();
  }
});

test('returning from a shared section URL shows the full title with real GSAP and normal motion', async () => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'no-preference' });
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === new URL(site.url).origin) return route.continue();
    if (url.pathname.endsWith('/gsap.min.js')) return route.fulfill({
      path: fileURLToPath(new URL('../node_modules/gsap/dist/gsap.min.js', import.meta.url)),
      contentType: 'application/javascript',
    });
    return route.abort();
  });
  try {
    const page = await context.newPage();
    await page.goto(new URL('#sav', site.url).href, { waitUntil: 'load' });
    assert.equal(await page.evaluate(() => window.gsap.version), '3.12.5');
    await page.waitForTimeout(1400);
    await page.locator('#section-select').selectOption('s0');
    await page.waitForTimeout(800);
    const heading = await page.locator('#s0 h1').evaluate(el => ({
      opacity: Number(getComputedStyle(el).opacity),
      transform: getComputedStyle(el).transform,
    }));
    assert.equal(heading.opacity, 1, 'The title must not retain the hidden section animation state');
    assert.ok(['none', 'matrix(1, 0, 0, 1, 0, 0)'].includes(heading.transform), JSON.stringify(heading));
  } finally { await context.close(); }
});
