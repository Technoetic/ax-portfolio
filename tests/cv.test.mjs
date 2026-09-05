import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import AxeBuilder from '@axe-core/playwright';
import { mkdtemp, readFile, rm, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { startSite, createBrowser, openPage } from './browser.mjs';

let site, browser;
before(async () => { site = await startSite(); browser = await createBrowser(); });
after(async () => { await browser?.close(); await site?.close(); });

for (const width of [320, 390, 1280]) {
  test(`CV remains readable and accessible at ${width}px`, async () => {
    const page = await openPage(browser, site, { path: 'cv.html', width });
    try {
      const overflow = await page.evaluate(() => [...document.querySelectorAll('main, header, section, footer, p, h1, h2, h3, a')]
        .filter(el => {
          const r = el.getBoundingClientRect();
          return r.width && (r.left < -1 || r.right > innerWidth + 1);
        }).map(el => ({ tag: el.tagName, text: el.textContent.trim().slice(0, 60) })));
      assert.deepEqual(overflow, [], 'CV content and actions must stay inside the viewport');
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      assert.deepEqual(results.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), []);
    } finally { await page.context().close(); }
  });
}

test('CV offers visible keyboard focus and a direct downloadable document', async () => {
  const page = await openPage(browser, site, { path: 'cv.html', width: 390 });
  try {
    await page.keyboard.press('Tab');
    assert.equal(await page.locator(':focus').evaluate(el => {
      const css = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return css.outlineStyle !== 'none' && parseFloat(css.outlineWidth) >= 2 && r.top >= 0 && r.bottom <= innerHeight;
    }), true);
    const download = page.getByRole('link', { name: /PDF.*다운로드/ }).first();
    assert.equal(await download.isVisible(), true);
    assert.match(await download.getAttribute('href'), /jeon-munjun-portfolio\.pdf$/);
    assert.notEqual(await download.getAttribute('download'), null);
  } finally { await page.context().close(); }
});

test('CV print layout preserves full-size text and hides screen navigation', async () => {
  const page = await openPage(browser, site, { path: 'cv.html', width: 794 });
  try {
    await page.emulateMedia({ media: 'print' });
    assert.equal(await page.locator('nav.top').isVisible(), false);
    const textStyles = await page.locator('main').evaluate(el => ({
      color: getComputedStyle(el).color,
      minBodySize: Math.min(...[...el.querySelectorAll('.intro, .about, .case-summary, .ds, .where, .scope dd, .reading p:not(.snapshot)')].map(node => parseFloat(getComputedStyle(node).fontSize))),
      overflow: el.scrollWidth > el.clientWidth + 1,
    }));
    assert.equal(textStyles.color, 'rgb(17, 24, 39)');
    assert.ok(textStyles.minBodySize >= 12, `Print body text must be at least 9pt: ${textStyles.minBodySize}`);
    assert.equal(textStyles.overflow, false);
  } finally { await page.context().close(); }
});

test('PDF exporter produces a tagged text document with public hyperlinks', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'ax-cv-export-'));
  try {
    const output = join(directory, 'resume.pdf');
    await promisify(execFile)(process.execPath, ['scripts/export-pdf.mjs', output], { cwd: new URL('../', import.meta.url), timeout: 30000 });
    const pdf = await readFile(output);
    const body = pdf.toString('latin1');
    assert.equal(body.slice(0, 5), '%PDF-');
    assert.match(body, /\/StructTreeRoot\b/, 'Tagged structure is required for document navigation');
    assert.match(body, /\/ToUnicode\b/, 'Fonts must preserve text extraction');
    assert.match(body, /https:\/\/technoetic\.github\.io\/ax-portfolio\//);
    assert.doesNotMatch(body, /https?:\/\/127\.0\.0\.1:/, 'PDF links must work after the local export server stops');
  } finally {
    await rm(join(directory, 'resume.pdf'), { force: true });
    await rmdir(directory);
  }
});
