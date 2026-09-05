import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import AxeBuilder from '@axe-core/playwright';
import { createBrowser, openPage, showSlide, startSite } from './browser.mjs';

let browser, site;
before(async () => { site = await startSite(); browser = await createBrowser(); });
after(async () => { await browser?.close(); await site?.close(); });

async function auditAccessible(page, state, findings) {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const violations = result.violations.map(violation => ({
    id: violation.id,
    nodes: violation.nodes.map(node => ({ target: node.target, reason: node.failureSummary })),
  }));
  if (violations.length) findings.push({ state, violations });
}

for (const width of [320, 390, 1440]) {
  test(`all portfolio sections and dialogs meet automated WCAG A/AA checks at ${width}px`, { timeout: 90000 }, async () => {
    const page = await openPage(browser, site, { width, height: 844 });
    const errors = [];
    const findings = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() !== 'error') return;
      // The shared offline fixture deliberately aborts CDN requests. Only their
      // browser network diagnostics are exempt; local resource and JS errors fail.
      const location = message.location().url;
      const external = /^https?:/.test(location) && new URL(location).origin !== new URL(site.url).origin;
      if (external && /^Failed to load resource: net::ERR_FAILED$/.test(message.text())) return;
      errors.push(`console.error: ${message.text()} (${location})`);
    });
    try {
      // Attach error listeners before this load so initialization is checked too.
      await page.reload({ waitUntil: 'networkidle' });
      const ids = await page.locator('#deck > .slide').evaluateAll(slides => slides.map(slide => slide.id));
      assert.equal(ids.length, 12, 'The audited portfolio contains twelve sections');
      for (const id of ids) {
        await showSlide(page, id);
        await auditAccessible(page, `${width}px section ${id}`, findings);
      }
      await showSlide(page, 's5');
      await page.locator('#moreBtn').click();
      await auditAccessible(page, `${width}px expanded commands`, findings);
      await page.locator('#s5 .cmd-row.clickable .f').first().click();
      await auditAccessible(page, `${width}px command detail`, findings);
      await page.keyboard.press('Escape');
      await showSlide(page, 's4');
      await page.locator('#stepArrow').click();
      await auditAccessible(page, `${width}px step list`, findings);
      await page.locator('#stepList .step-row').first().click();
      await auditAccessible(page, `${width}px step detail`, findings);
      assert.deepEqual(errors, [], `JavaScript or local resource errors: ${JSON.stringify(errors)}`);
      assert.deepEqual(findings, [], JSON.stringify(findings, null, 2));
    } finally { await page.context().close(); }
  });
}

test('keyboard users can scroll the activity chart and detail body without leaving the section', async () => {
  const page = await openPage(browser, site, { width: 320, height: 568 });
  try {
    await showSlide(page, 's6');
    const chart = page.locator('.grass-wrap');
    await chart.focus();
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(() => document.querySelector('.grass-wrap').scrollLeft > 0);
    assert.equal(await page.locator('#deck > .slide.active').getAttribute('id'), 's6');
    assert.equal(await chart.evaluate(el => el === document.activeElement), true);

    await showSlide(page, 's4');
    await page.locator('#stepArrow').click();
    await page.locator('#stepList .step-row').first().click();
    const body = page.locator('#dBody');
    await body.focus();
    await page.keyboard.press('PageDown');
    await page.waitForFunction(() => document.querySelector('#dBody').scrollTop > 0);
    assert.equal(await page.locator('#deck > .slide.active').getAttribute('id'), 's4');
    assert.equal(await body.evaluate(el => el === document.activeElement), true);
  } finally { await page.context().close(); }
});
