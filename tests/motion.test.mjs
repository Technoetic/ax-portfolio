import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { APP_ROOT } from '../scripts/build.mjs';
import { CountUp, easeOutCubic, formatCount, parseDurationToken } from '../src/js/visuals/count-up.js';
import { ScrollReveal } from '../src/js/visuals/scroll-reveal.js';

test('the shipped deck stylesheet animates each stage of the backtick replay', async () => {
  const html = await readFile(path.join(APP_ROOT, 'index.html'), 'utf8');
  const asset = html.match(/href="([^"]*assets\/dist\/portfolio\.[^"]+\.css)"/)?.[1];
  assert.ok(asset, 'the deck should load its build-specific stylesheet');
  const css = await readFile(path.join(APP_ROOT, asset), 'utf8');
  const scoped = css.match(/#sbt\s+:is\(([^{}]+\[data-playing\][^{}]+)\)\s*\{((?:[^{}]|\{[^{}]*\})*)\}/);
  assert.ok(scoped, 'the backtick timeline needs a selection-scoped playback rule');
  const [, choices, timeline] = scoped;
  for (const value of ['1', '2', '3']) {
    assert.ok(choices.includes(`[data-playing]:has(input[value="${value}"]:checked) [data-view="${value}"]`));
  }
  const activeRules = [...timeline.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(([, , body]) => /\banimation(?:-name)?\s*:\s*bt-[\w-]+/.test(body));
  for (const stage of ['.bt-source', '.bt-wire', '.bt-command-flight', '.bt-unescaped', '.bt-tab-gap', '.bt-verdict']) {
    assert.ok(activeRules.some(([, selector]) => selector.includes(stage)), `missing playback animation for ${stage}`);
  }
});

function makeClassList(initial = []) {
  const set = new Set(initial);
  return {
    add(...names) { for (const n of names) set.add(n); },
    remove(...names) { for (const n of names) set.delete(n); },
    contains(name) { return set.has(name); },
  };
}

function makeElement({ dataset = {}, textContent = '', rect = { top: 100, bottom: 140 }, classes = [] } = {}) {
  const listeners = new Map();
  return {
    dataset: { ...dataset },
    textContent,
    classList: makeClassList(classes),
    _rect: rect,
    getBoundingClientRect() { return this._rect; },
    closest(selector) {
      if (selector === '.reveal-pending' && this.classList.contains('reveal-pending')) return this;
      return null;
    },
    addEventListener(type, fn, opts) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
      opts?.signal?.addEventListener?.('abort', () => listeners.get(type)?.delete(fn));
    },
    removeEventListener(type, fn) {
      listeners.get(type)?.delete(fn);
    },
    dispatch(type, event = {}) {
      for (const fn of [...(listeners.get(type) || [])]) fn({ target: this, ...event });
    },
  };
}

function installBrowserEnv(t, { reduced = false, innerHeight = 900 } = {}) {
  const keys = [
    'matchMedia', 'requestAnimationFrame', 'cancelAnimationFrame',
    'IntersectionObserver', 'addEventListener', 'removeEventListener',
    'innerHeight', 'performance', 'getComputedStyle', 'document',
  ];
  const saved = new Map(keys.map(k => [k, Object.getOwnPropertyDescriptor(globalThis, k)]));
  t.after(() => {
    for (const [k, d] of saved) {
      if (d) Object.defineProperty(globalThis, k, d);
      else delete globalThis[k];
    }
  });

  let now = 0;
  let nextFrameId = 1;
  const frames = new Map();
  const cancelledFrames = [];
  const globalListeners = new Map();
  const registeredEventTypes = [];
  const observers = [];
  const mediaListeners = new Set();
  const mediaState = {
    matches: reduced,
    addEventListener(type, fn, opts) {
      if (type !== 'change') return;
      mediaListeners.add(fn);
      opts?.signal?.addEventListener?.('abort', () => mediaListeners.delete(fn));
    },
  };

  globalThis.innerHeight = innerHeight;
  globalThis.performance = { now: () => now };
  globalThis.matchMedia = () => mediaState;
  globalThis.getComputedStyle = () => ({ getPropertyValue: () => '1400ms' });
  globalThis.document = { documentElement: {} };
  globalThis.requestAnimationFrame = cb => {
    const id = nextFrameId++;
    frames.set(id, cb);
    return id;
  };
  globalThis.cancelAnimationFrame = id => {
    cancelledFrames.push(id);
    frames.delete(id);
  };
  globalThis.addEventListener = (type, fn, opts) => {
    registeredEventTypes.push(type);
    if (!globalListeners.has(type)) globalListeners.set(type, new Set());
    globalListeners.get(type).add(fn);
    opts?.signal?.addEventListener?.('abort', () => globalListeners.get(type)?.delete(fn));
  };
  globalThis.removeEventListener = (type, fn) => {
    globalListeners.get(type)?.delete(fn);
  };

  class MockIntersectionObserver {
    constructor(callback, options) {
      this.callback = callback;
      this.options = options;
      this.observed = new Set();
      this.unobserved = [];
      this.disconnected = false;
      observers.push(this);
    }
    observe(target) { this.observed.add(target); }
    unobserve(target) { this.observed.delete(target); this.unobserved.push(target); }
    disconnect() { this.disconnected = true; this.observed.clear(); }
    trigger(entries) { this.callback(entries, this); }
  }
  globalThis.IntersectionObserver = MockIntersectionObserver;

  return {
    get frames() { return frames; },
    get cancelledFrames() { return cancelledFrames; },
    get observers() { return observers; },
    get registeredEventTypes() { return registeredEventTypes; },
    stepFrame(ms) {
      now = ms;
      const batch = [...frames.entries()];
      frames.clear();
      for (const [, cb] of batch) cb(ms);
    },
    emit(type, event = {}) {
      for (const fn of [...(globalListeners.get(type) || [])]) fn(event);
    },
  };
}

test('CountUp pure helpers format numbers safely without Korean style:unit and ease out smoothly', () => {
  assert.equal(easeOutCubic(0), 0);
  assert.equal(easeOutCubic(1), 1);
  assert.ok(easeOutCubic(0.5) > 0.8 && easeOutCubic(0.5) < 0.95);
  assert.equal(formatCount(1155), '1,155');
  assert.equal(formatCount(348), '348');
  assert.equal(formatCount(0.42, { format: 'percent' }), '42%');
  assert.equal(formatCount(100, { format: 'currency' }), '100');
  assert.equal(parseDurationToken('1400ms'), 1400);
  assert.equal(parseDurationToken('1.4s'), 1400);
});

test('CountUp supports slide activation once without recounting on revisit, beforeprint, BFCache, and dispose', t => {
  const env = installBrowserEnv(t);
  const el = makeElement({ dataset: { countupTarget: '348' }, textContent: '348', rect: { top: 200, bottom: 280 } });
  const slide = {
    contains: node => node === el,
    querySelectorAll: () => [el],
    getBoundingClientRect: () => ({ top: 0, bottom: 900 }),
    addEventListener() {},
  };
  const root = { querySelectorAll: () => [el] };

  const cu = new CountUp({ root, duration: 1000, mode: 'slide' });
  assert.ok(!env.registeredEventTypes.includes('unload'));
  // Idle until slide activates: retains final HTML text
  assert.equal(el.textContent, '348');

  // First slide activation counts 0 -> 348
  cu.activateScope(slide);
  assert.equal(el.textContent, '0');
  env.stepFrame(500);
  assert.equal(el.textContent, '305');
  env.stepFrame(1000);
  assert.equal(el.textContent, '348');
  assert.equal(env.frames.size, 0);

  // Revisiting slide never recounts from 0
  cu.activateScope(slide);
  assert.equal(el.textContent, '348');
  assert.equal(env.frames.size, 0);
  cu.dispose();

  // Viewport mode: beforeprint settles active + pending counters; pagehide/pageshow recovers BFCache
  const env2 = installBrowserEnv(t);
  const topEl = makeElement({ dataset: { countupTarget: '165' }, textContent: '165', rect: { top: 200, bottom: 260 } });
  const belowEl = makeElement({ dataset: { countupTarget: '348' }, textContent: '348', rect: { top: 1500, bottom: 1560 } });
  const cuVp = new CountUp({ root: { querySelectorAll: () => [topEl, belowEl] }, duration: 1000, mode: 'viewport' });
  assert.equal(topEl.textContent, '0');
  assert.equal(belowEl.textContent, '0');
  env2.emit('pagehide');
  assert.equal(env2.frames.size, 0);
  env2.emit('pageshow', { persisted: true });
  assert.equal(topEl.textContent, '165');
  assert.equal(belowEl.textContent, '0');
  env2.emit('beforeprint');
  assert.equal(belowEl.textContent, '348');
  cuVp.dispose();
});

test('ScrollReveal hides only below-fold targets, reveals once on IO/scrollend/focusin/beforeprint, and ignores child transitionend', t => {
  const env = installBrowserEnv(t, { innerHeight: 900 });
  const above = makeElement({ rect: { top: -120, bottom: -20 } });
  const visible = makeElement({ rect: { top: 250, bottom: 400 } });
  const below = makeElement({ rect: { top: 1300, bottom: 1500 } });
  const jumped = makeElement({ rect: { top: 2200, bottom: 2400 } });
  const root = {
    querySelectorAll: () => [above, visible, below, jumped],
    addEventListener() {},
  };

  const sr = new ScrollReveal({ root, mode: 'viewport' });
  assert.ok(!env.registeredEventTypes.includes('unload'));
  assert.ok(!env.registeredEventTypes.includes('scroll'));
  assert.ok(above.classList.contains('is-revealed'));
  assert.ok(visible.classList.contains('is-revealed'));
  assert.ok(below.classList.contains('reveal-pending'));
  assert.ok(jumped.classList.contains('reveal-pending'));
  assert.equal(env.observers[0].options.threshold, 0);
  assert.equal(env.observers[0].options.rootMargin, '100000px 0px 40px 0px');

  below._rect = { top: 600, bottom: 800 };
  env.observers[0].trigger([{ target: below, isIntersecting: true, boundingClientRect: below._rect }]);
  assert.ok(!below.classList.contains('reveal-pending'));
  assert.ok(below.classList.contains('reveal-entering'));
  // Bubbling transitionend from a child does NOT prematurely complete or detach listener
  below.dispatch('transitionend', { target: { child: true } });
  assert.ok(below.classList.contains('reveal-entering'));
  below.dispatch('transitionend', { target: below });
  assert.ok(!below.classList.contains('reveal-entering') && below.classList.contains('is-revealed'));

  // Fast End-key jump settled on scrollend
  jumped._rect = { top: -500, bottom: -300 };
  env.emit('scrollend');
  assert.ok(!jumped.classList.contains('reveal-pending') && jumped.classList.contains('is-revealed'));

  // Mid-transition beforeprint cancels running CSS transitions synchronously via getAnimations()
  let animCancelled = false;
  const mid = makeElement({ rect: { top: 1400, bottom: 1600 } });
  mid.getAnimations = () => [{ cancel() { animCancelled = true; } }];
  const sr2 = new ScrollReveal({ root: { querySelectorAll: sel => sel === '[data-reveal]' ? [mid] : [mid], addEventListener() {} }, mode: 'viewport' });
  mid._rect = { top: 600, bottom: 800 };
  env.observers.at(-1).trigger([{ target: mid, isIntersecting: true, boundingClientRect: mid._rect }]);
  assert.ok(mid.classList.contains('reveal-entering'));
  env.emit('beforeprint');
  assert.equal(animCancelled, true);
  assert.ok(!mid.classList.contains('reveal-entering') && mid.classList.contains('is-revealed'));
  sr2.dispose();
  sr.dispose();
});

test('deck and CV motion respect reduced motion, printing and accessible count-up totals', async () => {
  const [indexHtml, cvHtml, tokensCss, motionCss, cvMotionCss, countUpJs, revealJs, deckJs, metricsJson] = await Promise.all([
    readFile(path.join(APP_ROOT, 'index.html'), 'utf8'),
    readFile(path.join(APP_ROOT, 'cv.html'), 'utf8'),
    readFile(path.join(APP_ROOT, 'src/css/tokens.css'), 'utf8'),
    readFile(path.join(APP_ROOT, 'src/css/motion.css'), 'utf8'),
    readFile(path.join(APP_ROOT, 'src/css/cv-motion.css'), 'utf8'),
    readFile(path.join(APP_ROOT, 'src/js/visuals/count-up.js'), 'utf8'),
    readFile(path.join(APP_ROOT, 'src/js/visuals/scroll-reveal.js'), 'utf8'),
    readFile(path.join(APP_ROOT, 'src/js/screens/deck-screen.js'), 'utf8'),
    readFile(path.join(APP_ROOT, 'assets/metrics.json'), 'utf8'),
  ]);

  for (const token of ['--motion-countup-duration', '--motion-reveal-duration', '--motion-reveal-stagger', '--motion-reveal-distance', '--motion-ease-out']) {
    assert.ok(tokensCss.includes(token), `tokens.css missing ${token}`);
  }
  for (const css of [motionCss, cvMotionCss]) {
    assert.match(css, /\.scroll-progress\s*\{\s*display:\s*none;/);
    assert.match(css, /@supports\s*\(animation-timeline:\s*scroll\(\)\)/);
    assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
    assert.match(css, /@media\s+print/);
    assert.match(css, /font-variant-numeric:\s*tabular-nums/);
    assert.doesNotMatch(css, /visibility\s*:\s*hidden/i);
  }
  // Index has 11 KPI count-ups across #sav, #smv, #sw6, #scv, #s6, #s7
  const { featuredTools, publicRepos, githubPagesRepos, blogPosts } = JSON.parse(metricsJson);
  const indexCounters = [...indexHtml.matchAll(/data-countup-target="(\d+)"/g)].map(m => Number(m[1]));
  assert.deepEqual(indexCounters, [3, 10, 6, 11, publicRepos.value, featuredTools.value, blogPosts.value,
    publicRepos.value, featuredTools.value, githubPagesRepos.value, blogPosts.value]);
  // CV has 4 KPI count-ups in #about .stats
  const cvCounters = [...cvHtml.matchAll(/data-countup-target="(\d+)"/g)].map(m => Number(m[1]));
  assert.deepEqual(cvCounters, [11, featuredTools.value, publicRepos.value, blogPosts.value]);

  // Every countup-value carries explicit aria-hidden="true" and zero aria-live
  for (const html of [indexHtml, cvHtml]) {
    const spans = [...html.matchAll(/<span[^>]*class="countup-value[^"]*"[^>]*>/g)].map(m => m[0]);
    assert.ok(spans.length >= 4);
    for (const span of spans) {
      assert.match(span, /aria-hidden="true"/);
      assert.doesNotMatch(span, /aria-live/i);
    }
    assert.match(html, /<div class="scroll-progress" aria-hidden="true"><\/div>/);
  }

  // Zero unload listeners and zero style: 'unit' for Korean units
  for (const code of [countUpJs, revealJs, deckJs]) {
    assert.doesNotMatch(code, /addEventListener\(\s*['"]unload['"]/i);
  }
  assert.doesNotMatch(countUpJs, /style\s*:\s*['"]unit['"]/);
  // Deck progress bar uses compositor-only transform scaleX instead of layout width
  assert.doesNotMatch(deckJs, /this\.progress\.style\.width/);
  assert.match(deckJs, /this\.progress\.style\.transform\s*=\s*`scaleX/);
});
