import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser, openPage, showSlide, startSite } from './browser.mjs';

let browser, site;
before(async () => { site = await startSite(); browser = await createBrowser(); });
after(async () => { await browser?.close(); await site?.close(); });

test('CV heading is reachable at its scroll origin on a 390px phone', async () => {
  const page = await openPage(browser, site);
  try {
    await showSlide(page, 'scv');
    const heading = await page.locator('#scv h2').boundingBox();
    assert.ok(heading.y >= 0, `CV heading starts above the scroll origin: ${heading.y}px`);
  } finally { await page.context().close(); }
});

test('blog cards fit a 320px phone without horizontal clipping', async () => {
  const page = await openPage(browser, site, { width: 320 });
  try {
    await showSlide(page, 's7');
    const geometry = await page.locator('#s7').evaluate(el => ({ width: el.clientWidth, scrollWidth: el.scrollWidth }));
    assert.ok(geometry.scrollWidth <= geometry.width + 1, `Blog overflows: ${JSON.stringify(geometry)}`);
    assert.equal(await page.locator('#s7 .post').count(), 5);
    for (const post of await page.locator('#s7 .post').all()) {
      const box = await post.boundingBox();
      assert.ok(box.x >= 0 && box.x + box.width <= 321, `Card outside viewport: ${JSON.stringify(box)}`);
    }
  } finally { await page.context().close(); }
});

for (const width of [320, 390, 768, 1280, 1440]) {
  test(`all slides remain reachable within the ${width}px viewport and fixed navigation`, async () => {
    const page = await openPage(browser, site, { width, height: width >= 1280 ? 800 : 844 });
    try {
      const ids = await page.locator('#deck > .slide').evaluateAll(slides => slides.map(slide => slide.id));
      for (const id of ids) {
        await showSlide(page, id);
        const geometry = await page.locator(`#${id}`).evaluate(el => {
          const header = document.querySelector('.site-header');
          const children = [...el.children].filter(child => getComputedStyle(child).display !== 'none');
          return {
            width: el.clientWidth, scrollWidth: el.scrollWidth,
            top: Math.min(...children.map(child => child.getBoundingClientRect().top)),
            headerBottom: header?.getBoundingClientRect().bottom || 0,
          };
        });
        assert.ok(geometry.scrollWidth <= geometry.width + 1, `${id} overflows horizontally: ${JSON.stringify(geometry)}`);
        assert.ok(geometry.top >= geometry.headerBottom, `${id} content starts beneath/above the header: ${JSON.stringify(geometry)}`);
        await page.locator(`#${id}`).evaluate(el => { el.scrollTop = el.scrollHeight; });
        const bottom = await page.locator(`#${id}`).evaluate(el => {
          const children = [...el.children].filter(child => getComputedStyle(child).display !== 'none');
          return Math.max(...children.map(child => child.getBoundingClientRect().bottom));
        });
        const nav = await page.locator('.nav').boundingBox();
        assert.ok(bottom <= nav.y, `${id} final content hides behind footer: ${bottom} > ${nav.y}`);
      }
      await showSlide(page, 's5');
      await page.locator('#moreBtn').click();
      assert.equal(await page.locator('#s5 .cmd-row:visible').count(), 20);
      const commands = await page.locator('#s5 .cmd-row').evaluateAll(rows => rows.map(row => ({
        width: row.clientWidth, scrollWidth: row.scrollWidth,
        target: row.querySelector('[role="button"], a, button, .f')?.getBoundingClientRect().toJSON(),
      })));
      for (const command of commands) {
        assert.ok(command.scrollWidth <= command.width + 1, `Expanded command overflows: ${JSON.stringify(command)}`);
        assert.ok(command.target.height >= 24, `Command target too small: ${JSON.stringify(command.target)}`);
      }
    } finally { await page.context().close(); }
  });
}

test('navigation and dialog controls have usable pointer target sizes', async () => {
  const page = await openPage(browser, site, { width: 1440 });
  try {
    for (const target of await page.locator('.dots button, .nav button').all()) {
      const box = await target.boundingBox();
      assert.ok(box.width >= 24 && box.height >= 24, `Small navigation target: ${JSON.stringify(box)}`);
    }
    await showSlide(page, 's4');
    await page.locator('#stepArrow').click();
    const close = await page.locator('#stepModal .modal-close').boundingBox();
    assert.ok(close.width >= 44 && close.height >= 44, `Small dialog close button: ${JSON.stringify(close)}`);
  } finally { await page.context().close(); }
});

test('keyboard focus on the clipped workflow arrow has a visible indicator', async () => {
  const page = await openPage(browser, site, { width: 1440 });
  try {
    await showSlide(page, 's4');
    const arrow = page.locator('#stepArrow');
    await arrow.scrollIntoViewIfNeeded();
    await page.locator('#s4').focus();
    const beforeFocus = await arrow.screenshot();
    await arrow.focus();
    assert.equal(await arrow.evaluate(el => el.matches(':focus-visible')), true);
    const afterFocus = await arrow.screenshot();
    assert.notDeepEqual(beforeFocus, afterFocus, 'The clip-path must not hide the keyboard focus indicator');
  } finally { await page.context().close(); }
});

test('without JavaScript every section is visible in document order', async () => {
  const page = await openPage(browser, site, { width: 390, javaScriptEnabled: false });
  try {
    const slides = await page.locator('#deck > .slide').evaluateAll(elements => elements.map(el => ({
      id: el.id, top: el.getBoundingClientRect().top, bottom: el.getBoundingClientRect().bottom,
      visibility: getComputedStyle(el).visibility, opacity: getComputedStyle(el).opacity,
      width: el.clientWidth, scrollWidth: el.scrollWidth,
    })));
    let previousBottom = 0;
    for (const slide of slides) {
      assert.equal(slide.visibility, 'visible', `${slide.id} is hidden without JavaScript`);
      assert.equal(slide.opacity, '1');
      assert.ok(slide.top >= previousBottom - 1, `${slide.id} overlaps previous section`);
      assert.ok(slide.scrollWidth <= slide.width + 1, `${slide.id} overflows without JavaScript`);
      previousBottom = slide.bottom;
    }
    assert.ok(await page.locator('html').evaluate(el => el.scrollHeight > innerHeight));
    await page.locator('#s0 .hero-actions a').first().click({ trial: true, timeout: 3000 });
  } finally { await page.context().close(); }
});
