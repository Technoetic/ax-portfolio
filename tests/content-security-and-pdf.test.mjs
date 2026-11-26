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
  const hook = metrics.pluginReleases['backtick-check-hook'];
  const hookRepo = 'https://github.com/Technoetic/backtick-check-hook';
  const ctt = metrics.utilityReleases['close-to-tray-helper'];
  const atlas = metrics.referenceAtlas;
  const esc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  assert.ok(Number.isInteger(metrics.publicRepos.value) && metrics.publicRepos.value > 0);
  assert.ok(Number.isInteger(metrics.githubPagesRepos.value) && metrics.githubPagesRepos.value > 0);
  assert.ok(Number.isInteger(metrics.blogPosts.value) && metrics.blogPosts.value > 0);
  assert.deepEqual(av.hosts, ['Claude Code', 'Codex', 'Antigravity']);
  assert.deepEqual(mv.hosts, ['Claude Code', 'Codex', 'Antigravity']);
  assert.deepEqual(w6.hosts, ['Claude Code', 'Codex', 'Antigravity']);
  assert.deepEqual(hook.hosts, ['Claude Code', 'Codex', 'Antigravity']);
  assert.equal(hook.source, `${hookRepo}/releases/tag/v${hook.version}`);
  for (const featured of [metrics.featuredPlugins, metrics.featuredTools]) {
    assert.ok(featured.projects.includes('backtick-check-hook'));
    assert.equal(featured.value, featured.projects.length);
  }
  const ci = hook.verification;
  assert.equal(ci.windowsTestExecutions,
    ci.windowsPythonVersions.length * ci.windowsCodePages.length * ci.testsPerWindowsJob);
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

  const scv = indexHtml.match(/<section\b[^>]*\bid="scv"[^>]*>([\s\S]*?)<\/section>/)?.[1] || '';
  const hookTile = [...scv.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)]
    .find(([tag]) => tag.includes('href="#sbt"'))?.[0];
  assert.ok(hookTile, 'missing link from the #scv project list to #sbt');
  const hookLink = hookTile.slice(0, hookTile.indexOf('>') + 1);
  assert.match(hookLink, /\bdata-slide-target\b/);
  assert.doesNotMatch(hookLink, /\btarget="_blank"/);
  assert.ok(hookTile.includes('백틱 검사 훅'));
  assert.ok(hookTile.includes(`v${hook.version}`), '#scv project link needs the current hook version');

  const hookSlide = indexHtml.match(/<section\b[^>]*\bid="sbt"[^>]*>([\s\S]*?)<\/section>/)?.[1];
  assert.ok(hookSlide, 'missing backtick-check-hook slide');
  assert.ok(hookSlide.includes(`v${hook.version}`), '#sbt needs the current hook version');
  assert.ok(hookSlide.includes(`href="${hookRepo}"`), '#sbt must link to the project repository');
  assert.ok(hookSlide.includes(`href="${ci.source}"`), '#sbt must link to the recorded CI run');
  assert.ok(hookSlide.includes(ci.windowsTestExecutions.toLocaleString('ko-KR')), '#sbt needs the CI test total');

  const hookCard = [...cvHtml.matchAll(/<article\b[^>]*>[\s\S]*?<\/article>/g)]
    .find(([tag]) => tag.includes(`href="${hookRepo}"`))?.[0];
  assert.ok(hookCard, 'missing backtick-check-hook project card in the CV');
  assert.ok(hookCard.includes(`v${hook.version}`));
  assert.ok(hookCard.includes(`href="${ci.source}"`), 'hook card must link to the recorded CI run');

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
  const metrics = JSON.parse(await readFile(path.join(APP_ROOT, 'assets', 'metrics.json'), 'utf8'));
  const hookCi = metrics.pluginReleases['backtick-check-hook'].verification.source;
  for (const url of ['https://github.com/Technoetic/backtick-check-hook', hookCi]) {
    assert.ok(latin.includes(`/URI (${url})`), `missing printed hook card link: ${url}`);
  }
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

test('each project demo offers native controls, a visual example and a matching description for every choice', async () => {
  const html = await readFile(path.join(APP_ROOT, 'index.html'), 'utf8');
  const groups = new Set();
  for (const id of ['sxc', 'sref', 'smv', 'sbt', 'sw6', 'sctt']) {
    const slide = html.match(new RegExp(`<section\\b[^>]*\\bid="${id}"[^>]*>([\\s\\S]*?)<\\/section>`))?.[1];
    assert.ok(slide, `missing #${id}`);
    const figure = slide.match(/<figure\b[^>]*aria-label="[^"]+"[^>]*>([\s\S]*?)<\/figure>/)?.[1];
    assert.ok(figure, `#${id} needs a named figure`);
    assert.doesNotMatch(slide, /<(?:img|picture|canvas|image)\b|\.webp\b/i);
    assert.match(figure, /<legend\b[^>]*>[^<]+<\/legend>/);
    const radios = [...figure.matchAll(/<input\b[^>]*\btype="radio"[^>]*>/g)].map(match => match[0]);
    assert.ok(radios.length >= 2);
    assert.equal(radios.filter(radio => /\schecked\b/.test(radio)).length, 1);
    const names = new Set(radios.map(radio => radio.match(/\bname="([^"]+)"/)?.[1]));
    assert.equal(names.size, 1);
    const [name] = names;
    assert.ok(name && !groups.has(name), 'each slide needs an independent radio group');
    groups.add(name);
    const values = radios.map(radio => radio.match(/\bvalue="(\d+)"/)?.[1]);
    assert.ok(values.every(Boolean));
    assert.equal(new Set(values).size, radios.length);
    const readoutStart = figure.indexOf('class="demo-readout"');
    assert.notEqual(readoutStart, -1, `#${id} needs a description area`);
    const readout = figure.slice(readoutStart);
    if (id === 'sbt') {
      assert.equal(values.length, 3, '#sbt demonstrates three shell commands');
      const artwork = figure.slice(0, readoutStart);
      const replays = [...artwork.matchAll(/<button\b[^>]*\bdata-demo-replay\b[^>]*>[\s\S]*?<\/button>/g)];
      assert.equal(replays.length, 1, 'one replay control serves the selected case');
      assert.match(replays[0][0], /\btype="button"/);
      assert.match(replays[0][0], /다시\s*재생/);
      const examples = [...artwork.matchAll(/<div\b[^>]*\bdata-view="(\d+)"[^>]*>/g)];
      assert.deepEqual(examples.map(([, value]) => value), values, '#sbt needs a code sample for each choice');
      // Keep tab characters intact when reading the printed PowerShell example.
      const plainText = markup => markup.replace(/<[^>]+>/g, '')
        .replace(/&#(?:96|x60);/gi, '\x60').replace(/&#(?:9|x0?9);/gi, '\t');
      const outcomes = ['명령 x', 'probe x text', 'a\tb'];
      for (const [index, example] of examples.entries()) {
        const body = artwork.slice(example.index, examples[index + 1]?.index);
        const code = body.match(/<pre\b[^>]*>\s*<code\b[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/)?.[1];
        assert.ok(code?.trim(), `#sbt example ${example[1]} needs readable code`);
        assert.match(code, /<mark\b[^>]*>[\s\S]*?<\/mark>/);
        if (example[1] === '2') {
          const columns = [...plainText(code).matchAll(/\x60/g)].map(tick => tick.index + 1);
          assert.deepEqual(columns, [61, 63], 'the two marked backticks must stay at the reported positions');
        }
        const output = body.match(/<samp\b[^>]*>[\s\S]*?<\/samp>/)?.[0];
        assert.ok(output, `#sbt example ${example[1]} needs a shell interpretation`);
        assert.equal(plainText(output).trim(), outcomes[index]);
      }
    } else {
      const art = figure.match(/<svg\b[^>]*>[\s\S]*?<\/svg>/)?.[0];
      assert.ok(art);
      assert.match(art, /<svg\b[^>]*aria-hidden="true"/);
      for (const value of values) {
        assert.ok(art.includes(`data-view="${value}"`), `#${id} has no drawing for choice ${value}`);
      }
    }
    for (const value of values) {
      const radio = radios.find(input => input.includes(`value="${value}"`));
      const descriptionId = radio.match(/\baria-describedby="([^"]+)"/)?.[1];
      assert.ok(descriptionId && readout.includes(`data-view="${value}" id="${descriptionId}"`),
        `#${id} choice ${value} needs its own accessible description`);
    }
  }
  assert.doesNotMatch(html, /sxc-animation-toggle/);
});

test('#sw6 presents the six original principles in order with matching controls and scenes', async () => {
  const html = await readFile(path.join(APP_ROOT, 'index.html'), 'utf8');
  const slide = html.match(/<section\b[^>]*\bid="sw6"[^>]*>([\s\S]*?)<\/section>/)?.[1];
  assert.ok(slide, 'missing webapp6 slide');
  const controls = [...slide.matchAll(/<label>\s*<input\b[^>]*\bvalue="(\d+)"[^>]*>\s*<span>([^<]+)<\/span>/g)];
  const principles = [
    ['JS', /JavaScript/], ['CSS', /CSS/], ['라우팅', /클라이언트 사이드 라우팅/],
    ['비동기', /비동기/], ['클래스', /클래스/], ['배포', /하드 리프레시/],
  ];
  assert.equal(controls.length, principles.length);
  for (const [index, [label, heading]] of principles.entries()) {
    const number = index + 1;
    assert.equal(controls[index][1], String(number));
    assert.equal(controls[index][2], label);
    const detail = slide.match(new RegExp(`\\bid="sw6-detail-${number}"[^>]*>\\s*<strong>([^<]+)</strong>`));
    assert.ok(detail, `missing heading for principle ${number}`);
    assert.match(detail[1], heading);
  }
  const art = slide.match(/<div class="demo-art">\s*(<svg\b[\s\S]*?<\/svg>)/)?.[1];
  assert.ok(art, 'missing principles artwork');
  const scenes = art.split(/(?=<g data-view=")/);
  assert.match(scenes.find(scene => scene.startsWith('<g data-view="3">')) ?? '', />404</);
  assert.match(scenes.find(scene => scene.startsWith('<g data-view="5">')) ?? '', /QuoteView[\s\S]*QuoteService/);
});
