import assert from 'node:assert/strict';
import test from 'node:test';
import { PgBindingDemo } from '../src/js/visuals/pg-binding-demo.js';

function setup() {
  const node = () => Object.assign(new EventTarget(), {
    dataset: {}, textContent: '', setAttribute(name, value) { this[name] = value; },
  });
  const [root, win, figure, form, input, values, result, media, tourButton, tourLabel] = Array.from({ length: 10 }, node);
  input.defaultValue = input.value = 'min@example.org';
  form.contains = element => [input, tourButton].includes(element);
  const samples = ['min@example.org', "o'neil@example.org", 'guest@example.org'].map(email => {
    const sample = node();
    sample.dataset.pgSample = email;
    return sample;
  });
  const slide = { querySelector: () => figure };
  root.getElementById = () => slide;
  root.defaultView = win;
  figure.querySelectorAll = () => samples;
  figure.querySelector = selector => ({
    '[data-pg-form]': form, '[data-pg-input]': input, '[data-pg-values]': values, '[data-pg-result]': result,
    '[data-pg-tour]': tourButton, '[data-pg-tour-label]': tourLabel,
  })[selector];
  win.matchMedia = () => media;
  const timers = new Map();
  let nextTimer = 0;
  let now = 0;
  win.setTimeout = (action, ms) => { timers.set(++nextTimer, { action, due: now + ms }); return nextTimer; };
  win.clearTimeout = id => timers.delete(id);
  let observe;
  win.IntersectionObserver = class {
    constructor(callback) { observe = callback; }
    observe() {}
    disconnect() {}
  };
  let interactions = 0;
  const controller = new PgBindingDemo({ root, onInteract: () => interactions++ });
  controller.activateSlide(slide);
  const edit = value => { input.value = value; input.dispatchEvent(new Event('input')); };
  const advance = ms => {
    const end = now + ms;
    while (timers.size) {
      const [id, timer] = [...timers].sort((a, b) => a[1].due - b[1].due)[0];
      if (timer.due > end) break;
      now = timer.due;
      timers.delete(id);
      timer.action();
    }
    now = end;
  };
  return { root, win, media, controller, figure, slide, form, input, values, result, samples, timers, edit, advance,
    tourButton, tourLabel, interactions: () => interactions,
    seen: ratio => observe([{ isIntersecting: ratio > 0, intersectionRatio: ratio }]) };
}

test('edits and example buttons change a single literal bound value and use exact local lookup', () => {
  const f = setup();
  assert.equal(f.figure.dataset.pgReady, '');
  assert.equal(f.samples[0]['aria-pressed'], 'true');
  f.samples[1].dispatchEvent(new Event('click'));
  assert.equal(f.input.value, "o'neil@example.org");
  assert.deepEqual(JSON.parse(f.values.textContent), [f.input.value]);
  assert.equal(f.result.textContent, '1행 · id 27');
  assert.equal(f.samples[0]['aria-pressed'], 'false');
  assert.equal(f.samples[1]['aria-pressed'], 'true');
  f.edit(' "이름" & <값> ');
  assert.deepEqual(JSON.parse(f.values.textContent), [' "이름" & <값> ']);
  assert.equal(f.result.textContent, '0행');
  assert.equal(f.figure.dataset.pgMatch, 'no');
  assert.ok(f.samples.every(sample => sample['aria-pressed'] === 'false'));
  f.edit('');
  assert.equal(f.values.textContent, '[""]');
  assert.match(f.result.textContent, /입력/);
  assert.equal(f.timers.size, 0);
});

test('the first visible visit previews each real sample once and never marks the visitor as dirty', () => {
  const f = setup();
  f.seen(0.1);
  assert.equal(f.timers.size, 0);
  f.seen(0.6);
  assert.equal(f.figure.dataset.pgPlaying, '');
  assert.equal(f.figure.dataset.pgTouring, '');
  assert.equal(f.tourButton['aria-pressed'], 'true');
  assert.equal(f.result.textContent, '1행 · id 12');
  f.advance(1850);
  assert.deepEqual(JSON.parse(f.values.textContent), ["o'neil@example.org"]);
  assert.equal(f.samples[1]['aria-pressed'], 'true');
  assert.equal(f.result.textContent, '1행 · id 27');
  f.advance(1850);
  assert.deepEqual(JSON.parse(f.values.textContent), ['guest@example.org']);
  assert.equal(f.result.textContent, '0행');
  f.advance(1600);
  assert.equal(f.figure.dataset.pgTouring, undefined);
  assert.equal(f.tourButton['aria-pressed'], 'false');
  assert.equal(f.interactions(), 0);
  f.seen(0.8);
  assert.equal(f.timers.size, 0);
});

test('focus, typing, form submission and navigation cancel tours without overwriting the last edit', () => {
  const f = setup();
  f.seen(1);
  const queued = [...f.timers.values()].find(timer => timer.due === 1850);
  f.form.dispatchEvent(new Event('focusin'));
  assert.equal(f.timers.size, 0);
  assert.equal(f.tourButton['aria-pressed'], 'false');
  f.edit('custom@example.org');
  f.edit('guest@example.org');
  queued.action();
  assert.equal(f.input.value, 'guest@example.org');
  f.advance(180);
  assert.equal(f.figure.dataset.pgPlaying, '');
  assert.equal(f.form.dispatchEvent(new Event('submit', { cancelable: true })), false);
  f.advance(1600);
  f.form.dispatchEvent(new Event('submit', { cancelable: true }));
  f.controller.activateSlide(null);
  assert.equal(f.timers.size, 0);
  assert.equal(f.figure.dataset.pgPlaying, undefined);
  f.controller.activateSlide(f.slide);
  f.seen(1);
  assert.equal(f.input.value, 'guest@example.org');
  assert.equal(f.timers.size, 0);
});

test('an empty focused field or a browser-restored field is never overwritten by first entry', () => {
  const f = setup();
  f.form.dispatchEvent(new Event('focusin'));
  f.edit('');
  f.seen(1);
  f.controller.activateSlide(null);
  f.controller.activateSlide(f.slide);
  f.seen(1);
  assert.equal(f.input.value, '');
  assert.equal(f.timers.size, 0);

  const restored = setup();
  restored.input.value = 'restored@example.org';
  restored.seen(1);
  assert.equal(restored.input.value, 'restored@example.org');
  assert.deepEqual(JSON.parse(restored.values.textContent), ['restored@example.org']);
  assert.equal(restored.timers.size, 0);
});

test('the tour button can replay and stop; a late previous step cannot override a newer tour', () => {
  const f = setup();
  const toggle = () => f.tourButton.dispatchEvent(new Event('click'));
  toggle();
  const stale = [...f.timers.values()].find(timer => timer.due === 1850);
  f.advance(1850);
  toggle();
  const stopped = f.input.value;
  assert.equal(f.timers.size, 0);
  f.advance(2000);
  assert.equal(f.input.value, stopped);
  toggle();
  stale.action();
  assert.equal(f.input.value, 'min@example.org');
  f.controller.activateSlide(null);
  assert.equal(f.timers.size, 0);
});

test('reduced motion and backgrounded pages settle promptly and retain the latest result', () => {
  const f = setup();
  f.seen(1);
  f.root.hidden = true;
  f.root.dispatchEvent(new Event('visibilitychange'));
  assert.equal(f.timers.size, 0);
  f.root.hidden = false;
  f.samples[0].dispatchEvent(new Event('click'));
  assert.equal(f.figure.dataset.pgPlaying, '');
  f.media.matches = true;
  f.media.dispatchEvent(new Event('change'));
  assert.equal(f.figure.dataset.pgPlaying, undefined);
  assert.equal(f.tourButton.disabled, true);
  f.tourButton.dispatchEvent(new Event('click'));
  assert.equal(f.figure.dataset.pgTouring, undefined);
  f.samples[1].dispatchEvent(new Event('click'));
  assert.equal(f.result.textContent, '1행 · id 27');
  assert.equal(f.timers.size, 0);
  f.controller.dispose();
  f.samples[2].dispatchEvent(new Event('click'));
  assert.equal(f.input.value, "o'neil@example.org");
  assert.equal(f.figure.dataset.pgReady, undefined);
});

test('BFCache hides the tour and restores the current field without scheduling another example', () => {
  const f = setup();
  f.seen(1);
  f.advance(1850);
  f.win.dispatchEvent(new Event('pagehide'));
  assert.equal(f.timers.size, 0);
  f.input.value = 'browser-restored@example.org';
  f.win.dispatchEvent(new Event('pageshow'));
  f.seen(1);
  assert.deepEqual(JSON.parse(f.values.textContent), ['browser-restored@example.org']);
  assert.equal(f.timers.size, 0);
});
