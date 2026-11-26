import assert from 'node:assert/strict';
import test from 'node:test';
import { ProjectMotion } from '../src/js/visuals/project-motion.js';

function scene({ hasReplay = false } = {}) {
  const radios = [{ type: 'radio', checked: true }, { type: 'radio', checked: false }];
  const replay = hasReplay ? new EventTarget() : null;
  const art = Object.assign(new EventTarget(), {
    style: { removeProperty() {} },
  });
  const attributes = new Set();
  const figure = Object.assign(new EventTarget(), {
    hasAttribute: name => attributes.has(name),
    setAttribute: name => attributes.add(name),
    removeAttribute: name => attributes.delete(name),
    querySelector(key) {
      if (key === '.demo-art') return art;
      if (key === '[data-demo-replay]') return replay;
      if (key === 'input:checked') return radios.find(radio => radio.checked);
      return null;
    },
  });
  return {
    slide: { querySelector: () => figure }, art, replay,
    playing: () => attributes.has('data-playing'),
    replayReady: () => attributes.has('data-replay-ready'),
    choose(index, type) {
      radios.forEach((radio, i) => { radio.checked = i === index; });
      // Node's EventTarget has no DOM ancestry. Deliver the native radio's bubbling event at the figure.
      const event = new Event(type, { bubbles: true });
      Object.defineProperty(event, 'target', { value: radios[index] });
      figure.dispatchEvent(event);
    },
  };
}

function fixture() {
  const root = Object.assign(new EventTarget(), { hidden: false });
  const win = root.defaultView = new EventTarget();
  const media = Object.assign(new EventTarget(), { matches: false });
  win.matchMedia = () => media;
  const timers = new Map(), frames = new Map(), observers = [];
  let nextId = 0, inputs = 0;
  win.setTimeout = (action, delay) => { timers.set(++nextId, { action, delay }); return nextId; };
  win.clearTimeout = id => timers.delete(id);
  win.requestAnimationFrame = action => { frames.set(++nextId, action); return nextId; };
  win.cancelAnimationFrame = id => frames.delete(id);
  win.IntersectionObserver = class {
    constructor(callback, { threshold }) {
      this.callback = callback;
      this.thresholds = threshold;
      observers.push(this);
    }
    observe(target) { this.target = target; }
    disconnect() { this.target = null; }
    report(ratio) { this.callback([{ intersectionRatio: ratio, isIntersecting: ratio > 0 }], this); }
  };
  const controller = new ProjectMotion({ root, onInteract: () => inputs++ });
  const first = scene({ hasReplay: true });
  controller.activateSlide(first.slide);
  return {
    first, root, win, media, timers, frames, observers, controller,
    inputs: () => inputs, visible: ratio => observers.at(-1).report(ratio),
    finish() {
      assert.equal(timers.size, 1);
      const [id, timer] = [...timers][0];
      assert.ok(timer.delay > 0 && timer.delay < 5000);
      timers.delete(id);
      timer.action();
    },
  };
}

test('entry, click replay and keyboard changes each trigger one finite animation', () => {
  const f = fixture();
  f.visible(0.1);
  assert.equal(f.first.playing(), false);
  f.visible(0.6);
  assert.equal(f.first.playing(), true);
  assert.equal(f.inputs(), 0);
  f.finish();
  assert.equal(f.first.playing(), false);
  f.first.choose(0, 'click');
  assert.equal(f.first.playing(), true);
  f.first.choose(1, 'click');
  const [timerAfterClick] = f.timers.keys();
  f.first.choose(1, 'change');
  assert.deepEqual([...f.timers.keys()], [timerAfterClick]);
  assert.equal(f.inputs(), 2);
  f.first.choose(0, 'change');
  assert.equal(f.inputs(), 3);
  f.finish();
  f.visible(1);
  assert.equal(f.first.playing(), false);
});

test('a partially visible replay console waits for the reader or an explicit replay', () => {
  const f = fixture();
  assert.ok(f.observers[0].thresholds.includes(0.6), 'the browser must notify when the console reaches 60%');
  f.visible(0.36);
  assert.equal(f.first.playing(), false);
  f.first.replay.dispatchEvent(new Event('click'));
  assert.equal(f.first.playing(), true);
  const [manualTimer] = f.timers.keys();
  f.visible(0.6);
  assert.deepEqual([...f.timers.keys()], [manualTimer], 'scrolling must not restart an explicit replay');
  f.visible(0.36);
  assert.equal(f.first.playing(), false);
  f.visible(0.6);
  assert.equal(f.first.playing(), true);
  f.visible(0.36);
  assert.equal(f.first.playing(), false, 'a nearly hidden console should end automatic playback');
  f.visible(0.19);
  f.first.replay.dispatchEvent(new Event('click'));
  assert.equal(f.first.playing(), false);

  const other = scene();
  f.controller.activateSlide(other.slide);
  f.visible(0.2);
  assert.equal(other.playing(), true, 'other diagrams still start at 20% visibility');
  f.controller.dispose();
});

test('viewport, motion preference, tab visibility and BFCache suspend and restore the active scene', () => {
  const f = fixture();
  const expectPlaying = active => {
    assert.equal(f.first.playing(), active);
    assert.equal(f.timers.size, Number(active));
  };
  f.visible(1);
  f.visible(0);
  f.first.replay.dispatchEvent(new Event('click'));
  expectPlaying(false);
  f.visible(1);
  expectPlaying(true);
  f.media.matches = true;
  f.media.dispatchEvent(new Event('change'));
  f.first.choose(1, 'click');
  f.first.replay.dispatchEvent(new Event('click'));
  expectPlaying(false);
  f.media.matches = false;
  f.media.dispatchEvent(new Event('change'));
  expectPlaying(true);
  f.root.hidden = true;
  f.root.dispatchEvent(new Event('visibilitychange'));
  f.first.replay.dispatchEvent(new Event('click'));
  expectPlaying(false);
  f.win.dispatchEvent(new Event('pagehide'));
  f.root.hidden = false;
  f.root.dispatchEvent(new Event('visibilitychange'));
  expectPlaying(false);
  f.win.dispatchEvent(new Event('pageshow'));
  expectPlaying(true);
});

test('the replay button restarts the selected case and detaches when its slide leaves', () => {
  const f = fixture();
  assert.equal(f.first.replayReady(), true);
  f.visible(1);
  f.first.choose(1, 'change');
  const [oldTimer] = f.timers.keys();
  f.first.replay.dispatchEvent(new Event('click'));
  assert.equal(f.inputs(), 2);
  assert.equal(f.first.playing(), true);
  assert.ok(!f.timers.has(oldTimer), 'a replay should restart the sequence from the beginning');
  f.finish();
  f.first.replay.dispatchEvent(new Event('click'));
  assert.equal(f.first.playing(), true);
  f.finish();

  const other = scene();
  f.controller.activateSlide(other.slide);
  f.visible(1);
  f.finish();
  assert.equal(f.first.replayReady(), false);
  assert.equal(other.replayReady(), false, 'a project without a replay button needs no enhancement');
  f.first.replay.dispatchEvent(new Event('click'));
  assert.equal(other.playing(), false, 'a detached control must not restart another project');
  assert.equal(f.inputs(), 3);
  f.controller.dispose();
});

test('leaving a slide and disposing cancel work and ignore late callbacks from old scenes', () => {
  const f = fixture(), second = scene();
  f.visible(1);
  const oldObserver = f.observers[0];
  f.controller.activateSlide(second.slide);
  assert.equal(f.first.playing(), false);
  assert.equal(oldObserver.target, null);
  oldObserver.report(1);
  f.first.choose(1, 'click');
  assert.equal(f.inputs(), 0);
  assert.equal(second.playing(), false);
  f.visible(1);
  const move = () => second.art.dispatchEvent(Object.assign(new Event('pointermove'), {
    pointerType: 'mouse', clientX: 40, clientY: 35,
  }));
  move();
  assert.equal(f.frames.size, 1);
  f.controller.dispose();
  f.visible(1);
  second.choose(1, 'change');
  move();
  f.media.dispatchEvent(new Event('change'));
  f.root.dispatchEvent(new Event('visibilitychange'));
  f.win.dispatchEvent(new Event('pageshow'));
  assert.equal(f.observers.at(-1).target, null);
  assert.equal(second.playing(), false);
  assert.equal(f.timers.size, 0);
  assert.equal(f.frames.size, 0);
  assert.equal(f.inputs(), 0);
});

test('without a viewport observer, only an explicit selection starts the scene', () => {
  const f = fixture();
  delete f.win.IntersectionObserver;
  const second = scene();
  f.controller.activateSlide(second.slide);
  assert.equal(second.playing(), false);
  second.choose(1, 'click');
  assert.equal(second.playing(), true);
  f.win.dispatchEvent(new Event('pagehide'));
  f.win.dispatchEvent(new Event('pageshow'));
  assert.equal(second.playing(), false);
  assert.equal(f.timers.size, 0);
  f.controller.dispose();
});
