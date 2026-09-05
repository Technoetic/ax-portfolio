import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, sep, extname } from 'node:path';
import { chromium } from 'playwright';

export const root = fileURLToPath(new URL('../', import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.pdf': 'application/pdf' };

export async function startSite() {
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      const file = resolve(root, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
      if (!file.startsWith(root.endsWith(sep) ? root : root + sep)) {
        response.writeHead(403).end(); return;
      }
      const body = await readFile(file);
      response.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' }).end(body);
    } catch { response.writeHead(404).end('Not found'); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return { url: `http://127.0.0.1:${server.address().port}/`, close: () => new Promise(resolve => server.close(resolve)) };
}

export async function createBrowser() { return chromium.launch({ headless: true }); }

export async function openPage(browser, site, { width = 390, height = 844, path = '', javaScriptEnabled = true, online = false } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce', hasTouch: true, javaScriptEnabled });
  if (!online) await context.route('**/*', route => {
    const url = new URL(route.request().url());
    return url.origin === new URL(site.url).origin ? route.continue() : route.abort();
  });
  const page = await context.newPage();
  await page.goto(new URL(path, site.url).href, { waitUntil: 'networkidle' });
  if (javaScriptEnabled) await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' });
  return page;
}

export async function showSlide(page, id) {
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await page.locator('body').click({ position: { x: 1, y: 100 } });
  await page.keyboard.press('Home');
  const index = await page.locator('#deck > .slide').evaluateAll((slides, id) => slides.findIndex(s => s.id === id), id);
  if (index < 0) throw new Error(`Missing slide ${id}`);
  for (let i = 0; i < index; i++) await page.keyboard.press('ArrowRight');
  await page.locator(`#${id}.active`).waitFor({ state: 'visible' });
  await page.locator(`#${id}`).evaluate(el => { el.scrollTop = 0; });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

export async function swipe(page, { x, y, dx, dy = 0 }) {
  const session = await page.context().newCDPSession(page);
  try {
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let i = 1; i <= 8; i++) await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + dx * i / 8, y: y + dy * i / 8 }] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(150);
  } finally { await session.detach(); }
}
