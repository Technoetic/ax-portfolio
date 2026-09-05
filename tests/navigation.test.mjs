import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { startSite, createBrowser, openPage, showSlide, swipe } from './browser.mjs';

let site, browser;
before(async () => { site = await startSite(); browser = await createBrowser(); });
after(async () => { await browser?.close(); await site?.close(); });

const activeSlide = page => page.locator('#deck > .slide.active').getAttribute('id');

test('touching a step detail never swipes the background portfolio', async () => {
  const page = await openPage(browser, site, { width: 320, height: 568 });
  try {
    await showSlide(page, 's4');
    await page.locator('#stepArrow').click();
    await page.locator('#stepList .step-row').first().click();
    await swipe(page, { x: 270, y: 300, dx: -190 });
    assert.equal(await activeSlide(page), 's4');
    assert.equal(await page.locator('#stepDetail').evaluate(el => el.classList.contains('open')), true);
  } finally { await page.context().close(); }
});

test('panning the contribution chart scrolls the chart without advancing the deck', async () => {
  const page = await openPage(browser, site, { width: 320, height: 568 });
  try {
    await showSlide(page, 's6');
    await page.locator('.grass-wrap').scrollIntoViewIfNeeded();
    const box = await page.locator('.grass-wrap').boundingBox();
    await swipe(page, { x: box.x + box.width - 20, y: box.y + box.height / 2, dx: -180 });
    assert.equal(await activeSlide(page), 's6');
    assert.ok(await page.locator('.grass-wrap').evaluate(el => el.scrollLeft > 0));
  } finally { await page.context().close(); }
});

test('Space activates the command expander without changing the slide', async () => {
  const page = await openPage(browser, site);
  try {
    await showSlide(page, 's5');
    await page.locator('#moreBtn').focus();
    await page.keyboard.press('Space');
    assert.equal(await activeSlide(page), 's5');
    assert.equal(await page.locator('#moreBtn').getAttribute('aria-expanded'), 'true');
    await page.keyboard.press('Space');
    assert.equal(await page.locator('#moreBtn').getAttribute('aria-expanded'), 'false');
  } finally { await page.context().close(); }
});

test('nested step dialogs contain focus and restore both launchers in Escape order', async () => {
  const page = await openPage(browser, site);
  try {
    await showSlide(page, 's4');
    await page.locator('#stepArrow').focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.locator('#stepModal').evaluate(el => el.contains(document.activeElement)), true);
    const row = page.locator('#stepList .step-row').first();
    await row.focus();
    await page.keyboard.press('Space');
    assert.equal(await page.locator('#stepDetail').evaluate(el => el.contains(document.activeElement)), true);
    assert.equal(await page.locator('#stepModal').getAttribute('aria-hidden'), 'true');
    assert.equal(await page.locator('#deck').evaluate(el => el.inert), true);
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.locator('#stepDetail').evaluate(el => el.contains(document.activeElement)), true);
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#dNo').textContent(), '002');
    await page.keyboard.press('Escape');
    assert.equal(await row.evaluate(el => el === document.activeElement), true);
    assert.equal(await page.locator('#stepModal').getAttribute('aria-hidden'), 'false');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#stepArrow').evaluate(el => el === document.activeElement), true);
    assert.equal(await page.locator('#deck').evaluate(el => el.inert), false);
  } finally { await page.context().close(); }
});

test('command dialog contains focus and returns focus to its command launcher', async () => {
  const page = await openPage(browser, site);
  try {
    await showSlide(page, 's5');
    const command = page.locator('#s5 .cmd-row.clickable .f').first();
    await command.focus();
    await page.keyboard.press('Space');
    assert.equal(await activeSlide(page), 's5');
    assert.equal(await page.locator('#stepDetail').evaluate(el => el.contains(document.activeElement)), true);
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.locator('#stepDetail').evaluate(el => el.contains(document.activeElement)), true);
    await page.keyboard.press('Escape');
    assert.equal(await command.evaluate(el => el === document.activeElement), true);
  } finally { await page.context().close(); }
});

test('valid section hashes survive reload and browser back/forward', async () => {
  const page = await openPage(browser, site, { path: '#sav' });
  try {
    assert.equal(await activeSlide(page), 'sav');
    const last = await page.locator('#deck > .slide').last().getAttribute('id');
    await page.locator('#next').click();
    const next = await activeSlide(page);
    assert.notEqual(next, 'sav');
    assert.equal(new URL(page.url()).hash, '#' + next);
    await page.goBack();
    assert.equal(await activeSlide(page), 'sav');
    await page.goForward();
    assert.equal(await activeSlide(page), next);
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await activeSlide(page), next);
    await page.locator('#section-select').selectOption(last);
    assert.equal(await activeSlide(page), last);
    assert.equal(await page.locator('#next').isDisabled(), true);
    assert.equal(await page.locator('#dots [aria-current="step"]').count(), 1);
    assert.ok((await page.locator('#section-status').textContent()).includes(await page.locator('#' + last).getAttribute('data-title')));
  } finally { await page.context().close(); }
});

test('section links navigate semantically and six language graphs have unique names', async () => {
  const page = await openPage(browser, site);
  try {
    assert.equal(await page.locator('#prev').isDisabled(), true);
    const link = page.locator('#s0 a[data-slide-target]').first();
    const hash = await link.getAttribute('href');
    await link.click();
    assert.equal(await activeSlide(page), hash.slice(1));
    const labels = await page.locator('#dots button').evaluateAll(buttons => buttons.map(b => b.getAttribute('aria-label')));
    const titles = await page.locator('#deck > .slide').evaluateAll(slides => slides.map(s => s.dataset.title));
    assert.equal(labels.length, titles.length);
    titles.forEach((title, index) => assert.ok(labels[index].includes(title)));
    const names = await page.locator('#langs [role="progressbar"]').evaluateAll(bars => bars.map(b => b.getAttribute('aria-label')));
    assert.equal(names.length, 6);
    assert.equal(new Set(names).size, 6);
    assert.ok(names.every(Boolean));
  } finally { await page.context().close(); }
});

test('outside horizontal swipes navigate but vertical gestures stay within the section', async () => {
  const page = await openPage(browser, site, { width: 390, height: 844 });
  try {
    const second = await page.locator('#deck > .slide').nth(1).getAttribute('id');
    await swipe(page, { x: 350, y: 200, dx: -180 });
    assert.equal(await activeSlide(page), second);
    await showSlide(page, 's7');
    await swipe(page, { x: 350, y: 550, dx: -65, dy: -210 });
    assert.equal(await activeSlide(page), 's7');
  } finally { await page.context().close(); }
});
