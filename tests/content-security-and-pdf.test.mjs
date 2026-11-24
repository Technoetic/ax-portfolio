import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { APP_ROOT } from '../scripts/build.mjs';
import { computeInternationalAge } from '../src/js/shared/korean-age.js';

async function walkFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walkFiles(full)));
    else out.push(full);
  }
  return out;
}

test('index.html, cv.html, activity-charts.js, and metrics.json stay dynamically synchronized', async () => {
  const [indexHtml, cvHtml, metricsRaw, chartsJs] = await Promise.all([
    readFile(path.join(APP_ROOT, 'index.html'), 'utf8'),
    readFile(path.join(APP_ROOT, 'cv.html'), 'utf8'),
    readFile(path.join(APP_ROOT, 'assets', 'metrics.json'), 'utf8'),
    readFile(path.join(APP_ROOT, 'src', 'js', 'visuals', 'activity-charts.js'), 'utf8'),
  ]);
  const metrics = JSON.parse(metricsRaw);

  const av = metrics.pluginReleases['agentic-vault'];
  const sxc = metrics.pluginReleases['semantic-crosscheck'];
  const mv = metrics.pluginReleases['md-viz'];
  const w6 = metrics.pluginReleases['webapp6'];
  const ctt = metrics.utilityReleases['close-to-tray-helper'];
  const atlas = metrics.referenceAtlas;
  const esc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  assert.ok(Number.isInteger(metrics.publicRepos.value) && metrics.publicRepos.value > 0);
  assert.ok(Number.isInteger(metrics.githubPagesRepos.value) && metrics.githubPagesRepos.value > 0);
  assert.ok(Number.isInteger(metrics.blogPosts.value) && metrics.blogPosts.value > 0);
  assert.deepEqual(av.hosts, ['Claude Code', 'Codex', 'Antigravity']);
  assert.deepEqual(mv.hosts, ['Claude Code', 'Codex', 'Antigravity']);
  assert.deepEqual(w6.hosts, ['Claude Code', 'Codex', 'Antigravity']);
  assert.deepEqual(ctt.hosts, ['Claude Code', 'Codex', 'Antigravity']);
  assert.ok(atlas.sources > 0 && atlas.citations > 0);

  for (const doc of [indexHtml, cvHtml]) {
    assert.match(doc, new RegExp(`v${esc(av.version)}`));
    assert.match(doc, /Antigravity/);
    assert.match(doc, new RegExp(`v${esc(sxc.version)}`));
    assert.match(doc, new RegExp(`v${esc(mv.version)}`));
    assert.match(doc, /github\.com\/Technoetic\/md-viz/);
    assert.match(doc, new RegExp(`v${esc(w6.version)}`));
    assert.match(doc, /github\.com\/Technoetic\/webapp6/);
    assert.match(doc, new RegExp(`v${esc(ctt.version)}`));
    assert.match(doc, /github\.com\/Technoetic\/close-to-tray-helper/);
    assert.match(doc, /Reference[\s\S]{0,40}Atlas/);
    assert.match(doc, new RegExp(esc(atlas.sources)));
    assert.match(doc, new RegExp(esc(atlas.citations)));
    assert.match(doc, new RegExp(esc(metrics.publicRepos.value)));
    assert.match(doc, new RegExp(esc(metrics.githubPagesRepos.value)));
    assert.match(doc, new RegExp(esc(metrics.blogPosts.value)));
    assert.match(doc, /빌딩 HMI 11년/);
    assert.match(doc, /tel:\+821076335021/);
    assert.match(doc, /github\.com\/Technoetic\/dh-instantquote\/blob\/[a-f0-9]{40}\/README\.md/i);
  }

  assert.match(chartsJs, new RegExp(esc(metrics.activityChart.asOf)));

  const sbcp = indexHtml.match(/<section\b[^>]*\bid="sbcp"[^>]*>([\s\S]*?)<\/section>/)?.[1] || '';
  assert.ok(sbcp, 'missing #sbcp slide');
  assert.doesNotMatch(sbcp, /운영 중입니다/, '#sbcp must not claim live operation without a live demo link');
  assert.doesNotMatch(sbcp, /Fly\.io 배포/, '#sbcp must not show Fly.io deploy badge without a live demo link');
});

test('the cover links to the quoting case and AI tools without a quote preview', async () => {
  const html = await readFile(path.join(APP_ROOT, 'index.html'), 'utf8');
  const cover = html.match(/<section\b[^>]*\bid="s0"[^>]*>([\s\S]*?)<\/section>/)?.[1];
  assert.ok(cover, 'missing cover slide');
  const links = [...cover.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g)];
  assert.deepEqual(links.slice(0, 2).map(([, href, label]) => [href, label.trim()]), [
    ['#sdhis', '변압기 제조사 견적 자동화 보기'],
    ['#sav', '직접 만든 AI 개발 도구 보기'],
  ]);
  assert.doesNotMatch(cover, /\bquote-preview\b/);
});

test('the field case shows a worked quote with a before, automated step, and human review', async () => {
  const html = await readFile(path.join(APP_ROOT, 'index.html'), 'utf8');
  const field = html.match(/<section\b[^>]*\bid="sdhis"[^>]*>([\s\S]*?)<\/section>/)?.[1];
  assert.ok(field, 'missing field case slide');
  const example = field.match(/<figure\b[^>]*>([\s\S]*?)<\/figure>/)?.[1];
  assert.ok(example, 'missing worked quote');
  assert.match(example, /<figcaption\b[^>]*>[\s\S]*?견적[\s\S]*?<\/figcaption>/);
  const steps = [...example.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map(([, step]) => step);
  assert.equal(steps.length, 3);
  assert.match(steps[0], /도입 전[\s\S]*?가정/);
  assert.match(steps[1], /도입 후/);
  assert.match(steps[2], /담당자[\s\S]*?(검토|확인)/);
  assert.match(example, /가상 문의/);
  assert.match(example, /href="https:\/\/github\.com\/Technoetic\/dh-instantquote\/blob\/[a-f0-9]{40}\/README\.md"/i);
});

test('computeInternationalAge updates dynamically on birthday in KST (1988-12-20)', () => {
  assert.equal(computeInternationalAge('1988-12-20', new Date('2026-11-17T09:00:00+09:00')), 37);
  assert.equal(computeInternationalAge('1988-12-20', new Date('2026-12-19T23:59:59+09:00')), 37);
  assert.equal(computeInternationalAge('1988-12-20', new Date('2026-12-20T00:00:00+09:00')), 38);
});

test('external CDN resources enforce SRI+CORS, target=_blank uses noopener, and local assets exist', async () => {
  const [indexHtml, cvHtml] = await Promise.all([
    readFile(path.join(APP_ROOT, 'index.html'), 'utf8'),
    readFile(path.join(APP_ROOT, 'cv.html'), 'utf8'),
  ]);

  for (const [name, html] of [['index.html', indexHtml], ['cv.html', cvHtml]]) {
    const extTags = [
      ...html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)=["']https?:\/\/[^"']+["'][^>]*>/gi),
    ].map(m => m[0]);

    for (const tag of extTags) {
      if (/rel=["'](?:canonical|icon)["']/i.test(tag)) continue;
      assert.match(tag, /\bintegrity=["']sha384-[A-Za-z0-9+/=]+["']/, `${name} tag missing SRI: ${tag}`);
      assert.match(tag, /\bcrossorigin=["']anonymous["']/, `${name} tag missing crossorigin: ${tag}`);
    }

    for (const blankTag of html.matchAll(/<a\b[^>]*\btarget=["']_blank["'][^>]*>/gi)) {
      assert.match(blankTag[0], /\brel=["'][^"']*\bnoopener\b[^"']*["']/, `${name} missing rel=noopener`);
    }

    assert.match(html, /property="og:image"\s+content="https:\/\/technoetic\.github\.io\/ax-portfolio\/assets\/og-card\.png"/);
    assert.match(html, /name="twitter:image"\s+content="https:\/\/technoetic\.github\.io\/ax-portfolio\/assets\/og-card\.png"/);

    const localRefs = [
      ...html.matchAll(/\b(?:src|href)=["'](?!https?:\/\/|mailto:|tel:|data:|#)([^"'?#]+)["']/gi),
    ].map(m => m[1]);

    for (const ref of localRefs) {
      const resolved = path.resolve(APP_ROOT, ref);
      const info = await stat(resolved);
      assert.ok(info.isFile() && info.size > 0, `${name} references missing local file: ${ref}`);
    }
  }

  // Verify og-card.png dimensions (1200x630 PNG IHDR) and hdclabs-t.png lightweight budget (< 60 KB)
  const ogBytes = await readFile(path.join(APP_ROOT, 'assets', 'og-card.png'));
  assert.equal(ogBytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(ogBytes.readUInt32BE(16), 1200);
  assert.equal(ogBytes.readUInt32BE(20), 630);

  const hdcStat = await stat(path.join(APP_ROOT, 'assets', 'logos', 'hdclabs-t.png'));
  assert.ok(hdcStat.size < 60 * 1024, `hdclabs-t.png should be lightweight (<60KB), got ${hdcStat.size}`);
});

test('source and public HTML contain no secret values or local filesystem paths', async () => {
  const files = [
    path.join(APP_ROOT, 'index.html'),
    path.join(APP_ROOT, 'cv.html'),
    path.join(APP_ROOT, 'README.md'),
    ...(await walkFiles(path.join(APP_ROOT, 'src'))),
  ];
  const banned = [
    [/[A-Za-z]:[\\/]Users[\\/]/i, 'Windows user path'],
    [/(^|[\s"'`(])\/(Users|home)\/[A-Za-z]/m, 'Unix home path'],
    [/\b(sk-[A-Za-z0-9-]{12,}|ghp_[A-Za-z0-9]{20,}|github_pat_\w{20,}|AKIA[0-9A-Z]{16})/, 'credential token'],
  ];

  for (const file of files) {
    const text = await readFile(file, 'utf8');
    for (const [pattern, label] of banned) {
      assert.ok(!pattern.test(text), `${path.relative(APP_ROOT, file)}: ${label}`);
    }
  }
});

test('jeon-munjun-portfolio.pdf is a valid tagged 3-page PDF with updated links and zero retired URLs', async () => {
  const pdfBytes = await readFile(path.join(APP_ROOT, 'jeon-munjun-portfolio.pdf'));
  assert.equal(pdfBytes.subarray(0, 5).toString('ascii'), '%PDF-');
  assert.ok(pdfBytes.length > 50 * 1024 && pdfBytes.length < 2 * 1024 * 1024);

  const latin = pdfBytes.toString('latin1');
  assert.match(latin, /\/StructTreeRoot\b/, 'PDF must include tagged structure');
  assert.match(latin, /\/Outlines\b/, 'PDF must include document outlines');

  const pageMatches = latin.match(/\/Type\s*\/Page\b/g) || [];
  assert.equal(pageMatches.length, 3, `Expected 3 A4 pages, found ${pageMatches.length}`);

  assert.match(latin, /https:\/\/github\.com\/Technoetic\/dh-instantquote\/blob\/[a-f0-9]{40}\/README\.md/i);
  assert.match(latin, /https:\/\/github\.com\/Technoetic\/agentic-vault/);
  assert.match(latin, /https:\/\/github\.com\/Technoetic\/semantic-crosscheck/);
  assert.match(latin, /https:\/\/github\.com\/Technoetic\/md-viz/);
  assert.match(latin, /https:\/\/github\.com\/Technoetic\/webapp6/);
  assert.match(latin, /https:\/\/github\.com\/Technoetic\/close-to-tray-helper/);
  assert.match(latin, /https:\/\/technoetic\.github\.io\/reference-atlas\//);

  assert.ok(!latin.includes('nova.igrowth.kr'), 'PDF must not contain dead nova.igrowth.kr URI');
  assert.ok(!latin.includes('claude-code-commands'), 'PDF must not contain retired claude-code-commands URI');
  assert.ok(!latin.includes('harness20'), 'PDF must not contain retired harness20 URI');
});

test('#sav explains the shared vault and session flow in native HTML', async () => {
  const html = await readFile(path.join(APP_ROOT, 'index.html'), 'utf8');
  const slide = html.match(/<section\b[^>]*\bid="sav"[^>]*>([\s\S]*?)<\/section>/)?.[1];
  const figure = slide?.match(/<figure\b[^>]*>([\s\S]*?)<\/figure>/)?.[1];
  assert.ok(figure, 'missing Agentic Vault figure');
  assert.doesNotMatch(figure, /<(?:img|picture|canvas|image)\b/i);
  assert.doesNotMatch(figure, /<figcaption\b/i);
  assert.match(slide, /<figure\b[^>]*aria-label="[^"]+"/);
  for (const host of ['claude', 'codex', 'antigravity']) {
    assert.match(figure, new RegExp(`<button\\b[^>]*data-av-host="${host}"`));
    assert.match(figure, new RegExp(`data-pulse="${host}"`));
  }
  assert.equal([...figure.matchAll(/<button\b/g)].length, 3, 'only the three host selectors are needed');
  assert.match(figure, /aria-live="polite"/);

  const listItems = list => [...list.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)]
    .map(([, item]) => item.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
  const hosts = figure.match(/<ul\b[^>]*>([\s\S]*?)<\/ul>/)?.[1];
  assert.ok(hosts, 'the tools sharing the vault need a list');
  const names = listItems(hosts);
  assert.equal(names.length, 3);
  for (const host of ['Claude Code', 'Codex', 'Antigravity']) {
    assert.ok(names.some(name => name.includes(host)), 'missing host ' + host);
  }
  assert.match(figure.replace(/<[^>]+>/g, ' '), /공유\s+Markdown\s+볼트/);

  const flow = figure.match(/<ol\b[^>]*>([\s\S]*?)<\/ol>/)?.[1];
  assert.ok(flow, 'the session flow needs an ordered list');
  const steps = listItems(flow);
  assert.equal(steps.length, 3);
  assert.match(steps[0], /세션 시작/);
  assert.match(steps[1], /작업 기록/);
  assert.match(steps[2], /다음 세션 인계/);
  for (const [svg] of figure.matchAll(/<svg\b[^>]*>/g)) {
    assert.match(svg, /\baria-hidden="true"/, 'diagram connectors and icons are decorative');
  }
});

test('#sxc, #sref, #smv, #sw6, and #sctt use lightweight 960x640 WebP diagrams without the removed sxc animation toggle', async () => {
  const [indexHtml, deckJs] = await Promise.all([
    readFile(path.join(APP_ROOT, 'index.html'), 'utf8'),
    readFile(path.join(APP_ROOT, 'src', 'js', 'screens', 'deck-screen.js'), 'utf8'),
  ]);

  const expectedDiagrams = [
    ['sxc', 'assets/semantic-crosscheck/semantic-crosscheck-hero.webp'],
    ['sref', 'assets/reference-atlas/reference-map.webp'],
    ['smv', 'assets/md-viz/md-viz-hero.webp'],
    ['sw6', 'assets/webapp6/webapp6-hero.webp'],
    ['sctt', 'assets/close-to-tray-helper/close-to-tray-hero.webp'],
  ];

  for (const [id, relPath] of expectedDiagrams) {
    const slide = indexHtml.match(new RegExp(`<section\\b[^>]*\\bid="${id}"[^>]*>([\\s\\S]*?)<\\/section>`))?.[1];
    assert.ok(slide, `missing #${id} slide`);
    assert.ok(slide.includes(`src="${relPath}"`), `#${id} must reference ${relPath}`);
    assert.ok(slide.includes('width="960" height="640"'), `#${id} diagram must declare 960x640 dimensions`);

    const bytes = await readFile(path.join(APP_ROOT, relPath));
    assert.equal(bytes.subarray(0, 4).toString('ascii'), 'RIFF', `${relPath} missing RIFF header`);
    assert.equal(bytes.subarray(8, 12).toString('ascii'), 'WEBP', `${relPath} missing WEBP signature`);
    assert.ok(bytes.length < 100 * 1024, `${relPath} should stay under 100 KB, got ${bytes.length}`);
  }

  assert.doesNotMatch(indexHtml, /sxc-animation-toggle/);
  assert.doesNotMatch(deckJs, /sxc-animation-toggle|_initSxcMotionToggle/);
});
