// CSS draws every scene. This controller starts a short sequence only while its artwork is visible.
const SCENE_MS = 4600;
const ENTRY_RATIO = 0.2;
const REPLAY_ENTRY_RATIO = 0.6;

export class ProjectMotion {
  constructor({ root = document, onInteract } = {}) {
    this.root = root;
    this.win = root.defaultView;
    this.onInteract = onInteract;
    this.motion = this.win.matchMedia?.('(prefers-reduced-motion: reduce)');
    this.events = new AbortController();
    this.figure = null;
    this.art = null;
    this.observer = null;
    this.slideEvents = null;
    this.timer = null;
    this.frame = null;
    this.inView = false;
    this.canAutoplay = false;
    this.pageHidden = false;

    const options = { signal: this.events.signal };
    const refresh = () => this.syncPlayback();
    this.motion?.addEventListener?.('change', refresh, options);
    root.addEventListener('visibilitychange', refresh, options);
    this.win.addEventListener('pagehide', () => {
      this.pageHidden = true;
      refresh();
    }, options);
    this.win.addEventListener('pageshow', () => {
      if (!this.pageHidden) return;
      this.pageHidden = false;
      refresh();
    }, options);
  }

  get visible() {
    return this.inView && !this.root.hidden && !this.pageHidden && !this.motion?.matches;
  }

  activateSlide(slide) {
    const next = slide?.querySelector('.project-demo') ?? null;
    if (next === this.figure) return;
    this.stop();
    this.figure?.removeAttribute('data-replay-ready');
    this.slideEvents?.abort();
    this.observer?.disconnect();
    this.observer = null;
    this.figure = next;
    this.lastChoice = null;
    this.art = next?.querySelector('.demo-art');
    this.inView = false;
    this.canAutoplay = false;
    if (!this.art) return;

    this.slideEvents = new AbortController();
    const options = { signal: this.slideEvents.signal };
    const select = event => {
      const radio = event.target;
      if (radio.type !== 'radio' || !radio.checked) return;
      // Pointer activation sends both click and change. Native keyboard selection may send change alone.
      if (event.type === 'change' && this.lastChoice === radio) return;
      this.onInteract?.();
      this.play();
    };
    next.addEventListener('click', select, options);
    next.addEventListener('change', select, options);
    const replay = next.querySelector('[data-demo-replay]');
    if (replay) {
      replay.addEventListener('click', () => {
        this.onInteract?.();
        this.play();
      }, options);
      next.setAttribute('data-replay-ready', '');
    }
    this.art.addEventListener('pointermove', event => this.tilt(event), options);
    this.art.addEventListener('pointerleave', () => this.resetTilt(), options);

    if (!this.win.IntersectionObserver) {
      // Selection still plays on demand in browsers without a viewport observer.
      this.inView = true;
      return;
    }
    // Let visitors reach the command before its first timed reveal on a scrolling slide.
    const autoplayRatio = replay ? REPLAY_ENTRY_RATIO : ENTRY_RATIO;
    this.observer = new this.win.IntersectionObserver((entries, observer) => {
      if (observer !== this.observer) return;
      const entry = entries[entries.length - 1];
      const visible = entry.isIntersecting && entry.intersectionRatio >= ENTRY_RATIO;
      const canAutoplay = visible && entry.intersectionRatio >= autoplayRatio;
      if (visible === this.inView && canAutoplay === this.canAutoplay) return;
      this.inView = visible;
      this.canAutoplay = canAutoplay;
      this.syncPlayback();
    }, { threshold: replay ? [0, ENTRY_RATIO, autoplayRatio] : [0, ENTRY_RATIO] });
    this.observer.observe(this.art);
  }

  syncPlayback() {
    if (!this.visible || !this.canAutoplay) this.stop();
    else if (this.observer && this.timer === null) this.play();
  }

  play() {
    this.lastChoice = this.figure?.querySelector('input:checked');
    if (!this.visible || !this.figure) return;
    this.win.clearTimeout(this.timer);
    if (this.figure.hasAttribute('data-playing')) {
      this.figure.removeAttribute('data-playing');
      // Flush the reset so tapping a selected radio retraces the same scene from its first frame.
      void this.art.offsetWidth;
    }
    this.figure.setAttribute('data-playing', '');
    this.timer = this.win.setTimeout(() => {
      this.figure.removeAttribute('data-playing');
      this.timer = null;
    }, SCENE_MS);
  }

  tilt(event) {
    if (!this.visible || event.pointerType !== 'mouse') return;
    this.pointerX = event.clientX;
    this.pointerY = event.clientY;
    if (this.frame !== null) return;
    this.frame = this.win.requestAnimationFrame(() => {
      this.frame = null;
      const rect = this.art.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = (this.pointerX - rect.left) / rect.width - 0.5;
      const y = (this.pointerY - rect.top) / rect.height - 0.5;
      this.art.style.setProperty('--demo-yaw', (x * 7).toFixed(2) + 'deg');
      this.art.style.setProperty('--demo-pitch', (-y * 5).toFixed(2) + 'deg');
    });
  }

  resetTilt() {
    if (this.frame !== null) this.win.cancelAnimationFrame(this.frame);
    this.frame = null;
    this.art?.style.removeProperty('--demo-yaw');
    this.art?.style.removeProperty('--demo-pitch');
  }

  stop() {
    this.win.clearTimeout(this.timer);
    this.timer = null;
    this.figure?.removeAttribute('data-playing');
    this.resetTilt();
  }

  dispose() {
    this.activateSlide(null);
    this.events.abort();
  }
}
