import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const source = await read('commands-data.js');
const context = { window: {} };
runInNewContext(source, context, { timeout: 1000 });
const commands = JSON.parse(JSON.stringify(context.window.CMDS_FULL));
const page = await read('index.html');
const runtime = await read('assets/portfolio.js');
const slide = page.match(/<section\b[^>]*\bid="s5"[^>]*>[\s\S]*?<\/section>/)?.[0];
assert.ok(slide, 'The tooling slide (#s5) must exist');
const rowNames = text => [...text.matchAll(/<div class="cmd-row clickable" data-cmd="([^"]+)">/g)].map(match => match[1]);
const listed = rowNames(slide);
const hidden = rowNames(slide.slice(slide.indexOf('<span class="more-lines">')));

test('command bodies name the claude-code-commands commit they were copied from', () => {
  assert.match(source, /^\/\/ source: Technoetic\/claude-code-commands@[0-9a-f]{40}, generated \d{4}-\d{2}-\d{2}\r?\n/);
});

test('the tooling slide lists exactly the commands that have bodies, with matching counters', () => {
  assert.deepEqual([...listed].sort(), Object.keys(commands).sort());
  assert.equal(new Set(listed).size, listed.length, 'Each command is listed once');
  for (const [name, body] of Object.entries(commands)) {
    assert.ok(body.trim().length >= 200, `/${name} needs a real body`);
  }
  assert.ok(slide.includes(`# ${listed.length} custom slash commands`), 'Header count matches the list');
  assert.match(slide, new RegExp(`<div class="bignum[^"]*">${listed.length}</div>`), 'Big number matches the list');
  // The collapsed label is written in the HTML and restored by the toggle in portfolio.js.
  const labels = [page, runtime].flatMap(text => [...text.matchAll(/… \+ (\d+) more/g)].map(match => Number(match[1])));
  assert.ok(labels.length >= 2, 'The collapsed label exists in the page and the toggle');
  assert.ok(labels.every(count => count === hidden.length), 'Every collapsed label matches the hidden rows');
  assert.ok(hidden.length > 0 && hidden.length < listed.length);
});

test('command bodies carry no secret printing, piracy advice, local paths or credentials', () => {
  const banned = [
    [/sci-hub|libgen/i, 'piracy site'],
    [/[A-Za-z]:[\\/]Users[\\/]/i, 'Windows user path'],
    [/(^|[\s"'`(])\/(Users|home)\/[A-Za-z]/m, 'Unix home path'],
    [/\becho\s+["']?\$\{?\w*(KEY|TOKEN|SECRET|PASSWORD|COOKIE)\b/i, 'secret printed to the console'],
    [/\b(sk-[A-Za-z0-9-]{12,}|ghp_[A-Za-z0-9]{20,}|github_pat_\w{20,}|xox[abprs]-[\w-]{10,}|AKIA[0-9A-Z]{16})/, 'credential-like value'],
  ];
  for (const [name, body] of Object.entries(commands)) {
    for (const [pattern, label] of banned) {
      // Report only the command and rule, so a failing run never copies a matched value into the public CI log.
      assert.ok(!pattern.test(body), `/${name}: ${label}`);
    }
  }
});
