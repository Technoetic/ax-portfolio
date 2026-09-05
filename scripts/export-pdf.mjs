import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

// Export uses local system fonts. Linux needs a Korean font such as fonts-noto-cjk.
const root = fileURLToPath(new URL('../', import.meta.url));
const publicUrl = 'https://technoetic.github.io/ax-portfolio/cv.html';
const args = process.argv.slice(2);
if (args.length > 1 || (args[0] && extname(args[0]).toLowerCase() !== '.pdf')) {
  throw new Error('Usage: node scripts/export-pdf.mjs [output.pdf]');
}
const output = args[0] ? resolve(args[0]) : resolve(root, 'jeon-munjun-portfolio.pdf');
const html = await readFile(resolve(root, 'cv.html'));
const server = createServer((request, response) => {
  if (request.url !== '/cv.html') { response.writeHead(404).end(); return; }
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(html);
});
await new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', resolve);
});

let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 794, height: 1123 }, reducedMotion: 'reduce' });
  const origin = `http://127.0.0.1:${server.address().port}`;
  await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await page.goto(`${origin}/cv.html`, { waitUntil: 'networkidle' });
  await page.emulateMedia({ media: 'print' });
  await page.evaluate(async publicUrl => {
    // Relative links must still work when the document is downloaded and this server is gone.
    for (const link of document.querySelectorAll('a[href]')) {
      link.href = new URL(link.getAttribute('href'), publicUrl).href;
    }
    await document.fonts.ready;
  }, publicUrl);
  const pdf = await page.pdf({
    format: 'A4', preferCSSPageSize: true, printBackground: true, tagged: true, outline: true,
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: '<div style="width:100%;text-align:center;color:#475569;font:9px Arial,sans-serif"><span class="pageNumber"></span> / <span class="totalPages"></span> &nbsp; · &nbsp; technoetic.github.io/ax-portfolio</div>',
  });
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, pdf);
  process.stdout.write(JSON.stringify({ output, bytes: pdf.length, source: 'cv.html', tagged: true }) + '\n');
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
