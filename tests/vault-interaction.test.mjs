import assert from 'node:assert/strict';
import test from 'node:test';
import { VaultInteraction } from '../src/js/visuals/vault-interaction.js';

function fixture({ reduced = false } = {}) {
  const node = (textContent = '') => Object.assign(new EventTarget(), { dataset: {}, textContent });
  const root = node();
  const win = root.defaultView = node();
  const media = Object.assign(node(), { matches: reduced });
  win.matchMedia = () => media;
  const timers = new Map();
  let nextTimer = 0;
  win.setTimeout = (action, delay) => { timers.set(++nextTimer, { action, delay }); return nextTimer; };
  win.clearTimeout = id => timers.delete(id);
  const observers = [];
  win.IntersectionObserver = class {
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe(target) { this.target = target; }
    disconnect() { this.target = null; }
  };
  const map = node();
  const slide = { id: 'sav' };
  const status = node('다음 도구를 선택하세요.');
  const note = node('결정과 다음 할 일');
  const replay = node();
  const hosts = Object.fromEntries(['claude', 'codex', 'antigravity'].map(id => {
    const button = node();
    button.dataset.avHost = id;
    button.setAttribute = (name, value) => { button[name] = value; };
    return [id, button];
  }));
  slide.querySelector = () => map;
  root.getElementById = () => slide;
  map.querySelector = key => ({
    '[data-av-status]': status, '[data-av-note]': note, '[data-av-replay]': replay,
  })[key];
  map.querySelectorAll = () => Object.values(hosts);
  let interactions = 0;
  const controller = new VaultInteraction({ root, onInteract: () => { interactions++; } });
  controller.activateSlide(slide);
  const visible = (ratio = 1) => {
    const observer = observers.at(-1);
    observer.callback([{ target: map, isIntersecting: ratio > 0, intersectionRatio: ratio }], observer);
  };
  const tick = delay => {
    assert.equal(timers.size, 1);
    const [id, timer] = [...timers][0];
    assert.equal(timer.delay, delay);
    timers.delete(id);
    timer.action();
  };
  return { root, win, media, timers, map, slide, status, note, replay, hosts, controller, visible, tick,
    interactions: () => interactions, click: id => hosts[id].dispatchEvent(new Event('click')) };
}

test('only the first visible visit previews the route; replay and selecting a host transfer the same note', () => {
  const f = fixture();
  assert.equal(f.map.dataset.avReady, 'true');
  assert.equal(f.hosts.codex.disabled, false);
  f.visible(0.1);
  assert.equal(f.map.dataset.phase, 'idle');
  f.visible();
  assert.equal(f.map.dataset.phase, 'send');
  f.tick(700);
  assert.equal(f.map.dataset.phase, 'store');
  f.tick(550);
  assert.equal(f.map.dataset.phase, 'receive');
  f.tick(850);
  assert.equal(f.map.dataset.phase, 'done');
  assert.match(f.status.textContent, /Codex.*선택/);
  assert.equal(f.hosts.codex['aria-pressed'], 'true');
  assert.equal(f.interactions(), 0);
  f.controller.activateSlide({ id: 's0' });
  f.controller.activateSlide(f.slide);
  f.visible();
  assert.equal(f.timers.size, 0);
  f.click('antigravity');
  assert.equal(f.map.dataset.source, 'codex');
  assert.equal(f.map.dataset.target, 'antigravity');
  assert.equal(f.status.textContent, 'Codex → Antigravity · 작업 인계 중');
  f.tick(700); f.tick(550); f.tick(850);
  f.replay.dispatchEvent(new Event('click'));
  assert.equal(f.map.dataset.source, 'codex');
  assert.equal(f.map.dataset.target, 'antigravity');
  assert.equal(f.map.dataset.phase, 'send');
  assert.equal(f.interactions(), 2);
});

test('rapid retargets replace pending timers; leaving, BFCache and motion changes settle a handoff once', () => {
  const f = fixture();
  f.visible();
  const oldTimer = [...f.timers.values()][0];
  f.click('antigravity');
  oldTimer.action();
  assert.equal(f.map.dataset.phase, 'send');
  assert.equal(f.map.dataset.target, 'antigravity');
  f.tick(700);
  f.controller.activateSlide({ id: 's0' });
  assert.equal(f.timers.size, 0);
  assert.equal(f.map.dataset.phase, 'done');
  f.controller.activateSlide(f.slide);
  f.visible();
  f.click('claude');
  assert.equal(f.map.dataset.source, 'antigravity');
  f.win.dispatchEvent(new Event('pagehide'));
  assert.equal(f.timers.size, 0);
  f.win.dispatchEvent(new Event('pageshow'));
  f.visible();
  assert.equal(f.timers.size, 0);
  f.click('codex');
  f.media.matches = true;
  f.media.dispatchEvent(new Event('change'));
  assert.equal(f.timers.size, 0);
  assert.equal(f.map.dataset.phase, 'done');
  assert.equal(f.hosts.codex['aria-pressed'], 'true');
  f.controller.dispose();
  f.click('antigravity');
  assert.equal(f.timers.size, 0);
  assert.equal(f.hosts.antigravity.disabled, true);
});

test('each host selection ends at that host, including the first click on Claude and choosing the sender mid-flight', () => {
  const f = fixture();
  f.click('claude');
  assert.equal(f.map.dataset.source, 'codex');
  assert.equal(f.map.dataset.target, 'claude');
  f.tick(700); f.tick(550); f.tick(850);
  f.click('antigravity');
  f.tick(700);
  f.click('claude');
  assert.equal(f.map.dataset.source, 'antigravity');
  assert.equal(f.map.dataset.target, 'claude');
  f.tick(700); f.tick(550); f.tick(850);
  assert.equal(f.hosts.claude['aria-pressed'], 'true');
  assert.match(f.status.textContent, /Claude Code.*선택/);
});

test('reduced-motion visitors choose any destination instantly, including replay on the current tool', () => {
  const f = fixture({ reduced: true });
  f.visible();
  assert.equal(f.map.dataset.phase, 'idle');
  f.click('claude');
  assert.equal(f.map.dataset.source, 'codex');
  assert.equal(f.map.dataset.target, 'claude');
  assert.equal(f.map.dataset.phase, 'done');
  f.click('codex');
  f.click('codex');
  assert.equal(f.map.dataset.source, 'claude');
  assert.equal(f.map.dataset.target, 'codex');
  assert.equal(f.timers.size, 0);
  f.click('antigravity');
  assert.equal(f.map.dataset.source, 'codex');
  assert.match(f.status.textContent, /Antigravity.*선택/);
});
