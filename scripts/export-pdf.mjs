import { createServer } from 'node:http';
import { readFile, writeFile, realpath, mkdir } from 'node:fs/promises';
import { dirname, resolve, relative, extname, join, sep } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

// Aside must be installed, signed in and running. ASIDE_BOOTSTRAP can point to
// the user's Windows startup helper; no browser application is launched here.
const exec = promisify(execFile);
const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
if (args.length > 1 || (args[0] && extname(args[0]).toLowerCase() !== '.pdf')) {
  throw new Error('Usage: node scripts/export-pdf.mjs [output.pdf]');
}
if (process.platform === 'win32' && !process.env.ASIDE_BOOTSTRAP) {
  throw new Error('Set ASIDE_BOOTSTRAP to your reviewed Aside startup .ps1 helper before exporting on Windows.');
}
const output = args[0] ? resolve(args[0]) : resolve(root, 'jeon-munjun-portfolio.pdf');
const publicUrl = 'https://technoetic.github.io/ax-portfolio/cv.html';
// The CV uses inline styles; remove the external font stylesheet for export.
const html = (await readFile(resolve(root, 'cv.html'), 'utf8'))
  .replace(/<link\b[^>]*href=["']https:\/\/fonts\.googleapis\.com[^>]*>/gi, '');
const server = createServer((request, response) => {
  if (request.url !== '/cv.html') { response.writeHead(404).end(); return; }
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }).end(html);
});
await new Promise((accept, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', accept);
});
try {
  if (process.env.ASIDE_BOOTSTRAP) {
    await exec('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', process.env.ASIDE_BOOTSTRAP], { windowsHide: true });
  }
  const url = `http://127.0.0.1:${server.address().port}/cv.html`;
  const footer = '<div style="width:100%;text-align:center;color:#475569;font:9px Arial,sans-serif"><span class="pageNumber"></span> / <span class="totalPages"></span> · technoetic.github.io/ax-portfolio</div>';
  const script = `await (async () => {
    await fs.mkdir('./artifacts', {recursive:true});
    const page=await openTab('about:blank');
    try {
      await page.goto(${JSON.stringify(url)});
      await page.evaluate(publicUrl => {
        for (const link of document.querySelectorAll('a[href]')) link.href=new URL(link.getAttribute('href'), publicUrl).href;
      }, ${JSON.stringify(publicUrl)});
      await page.evaluate(() => document.fonts.ready);
      await page.pdf({path:'./artifacts/portfolio-cv.pdf',paperWidth:8.2677165354,paperHeight:11.6929133858,preferCSSPageSize:true,printBackground:true,generateTaggedPDF:true,generateDocumentOutline:true,displayHeaderFooter:true,headerTemplate:'<span></span>',footerTemplate:${JSON.stringify(footer)}});
      console.log(JSON.stringify({portfolioPdf:true,artifact:pwd+'/artifacts/portfolio-cv.pdf'}));
    } finally { await page.close().catch(() => {}); }
  })();`;
  const { stdout } = await exec(process.env.ASIDE_CLI || 'aside', ['repl', script], { windowsHide: true, timeout: 120000, maxBuffer: 1024 * 1024 });
  const receipt = stdout.split(/\r?\n/).map(line => { try { return JSON.parse(line); } catch { return null; } })
    .find(value => value?.portfolioPdf === true);
  if (!receipt || typeof receipt.artifact !== 'string') throw new Error('Aside did not report a PDF artifact');
  const artifact = resolve(receipt.artifact);
  const artifactRelative = relative(join(homedir(), '.aside', 'u'), artifact);
  const parts = artifactRelative.split(sep);
  if (!artifactRelative || artifactRelative.startsWith('..' + sep) || artifactRelative === '..'
      || resolve(join(homedir(), '.aside', 'u'), artifactRelative) !== artifact
      || parts.length !== 5 || !/^\d+$/.test(parts[0]) || parts[1] !== 'sessions'
      || !/^[A-Za-z0-9_-]+$/.test(parts[2]) || parts[3] !== 'artifacts' || parts[4] !== 'portfolio-cv.pdf') {
    throw new Error('Aside reported a PDF outside its session artifact directory');
  }
  const resolvedArtifact = await realpath(artifact);
  if (resolvedArtifact.toLowerCase() !== artifact.toLowerCase()) throw new Error('Aside PDF must not be a redirected artifact');
  const pdf = await readFile(artifact);
  if (pdf.length < 5 || pdf.subarray(0, 5).toString('ascii') !== '%PDF-') throw new Error('Aside artifact is not a PDF');
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, pdf);
  process.stdout.write(JSON.stringify({ output, bytes: pdf.length, source: 'cv.html', backend: 'aside', tagged_requested: true }) + '\n');
} finally {
  await new Promise(accept => server.close(accept));
}
