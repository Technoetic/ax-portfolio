// This slide models one fixed equality lookup against two local example rows.
const PEOPLE = new Map([['min@example.org', 12], ["o'neil@example.org", 27]]);
const PLAYBACK_MS = 1600;
// Three examples take 1700 + 1700 + 1600 = 5000 ms, so the automatic run never exceeds five seconds.
const SAMPLE_INTERVAL_MS = 1700;

export class PgBindingDemo {
  constructor({ root = document, onInteract } = {}) {
    this.slide = root.getElementById('spg');
    this.figure = this.slide?.querySelector('[data-pg-demo]');
    if (!this.figure) return;
    this.input = this.figure.querySelector('[data-pg-input]');
    this.values = this.figure.querySelector('[data-pg-values]');
    this.result = this.figure.querySelector('[data-pg-result]');
    this.samples = this.figure.querySelectorAll('[data-pg-sample]');
    const form = this.figure.querySelector('[data-pg-form]');
    this.root = root;
    this.win = root.defaultView;
    this.motion = this.win.matchMedia?.('(prefers-reduced-motion: reduce)');
    this.events = new AbortController();
    this.timer = null;
    this.tour = null;
    this.active = false;
    // previewed: the current visit has already played the examples or the visitor took over.
    this.previewed = false;
    // typed: the visitor wrote their own value, which a later visit must not overwrite.
    this.typed = false;
    this.pageHidden = false;
    const options = { signal: this.events.signal };

    const update = (typing = false) => {
      this.previewed = true;
      onInteract?.();
      this.stopTour();
      this.render();
      if (typing) {
        this.stop();
        if (this.canAnimate && this.input.value !== '') this.timer = this.win.setTimeout(() => this.play(), 180);
      } else {
        this.play();
      }
    };
    this.input.addEventListener('input', () => {
      this.typed = true;
      update(true);
    }, options);
    form.addEventListener('focusin', () => {
      this.previewed = true;
      onInteract?.();
      this.pause();
    }, options);
    for (const sample of this.samples) {
      sample.addEventListener('click', () => {
        this.input.value = sample.dataset.pgSample;
        this.typed = false;
        update();
      }, options);
    }
    // Enter in the single field still submits the form without a visible button.
    form.addEventListener('submit', event => {
      event.preventDefault();
      update();
    }, options);
    root.addEventListener('visibilitychange', () => { if (root.hidden) this.pause(); }, options);
    this.win.addEventListener('pagehide', () => {
      this.pageHidden = true;
      this.pause();
    }, options);
    this.win.addEventListener('pageshow', () => {
      this.pageHidden = false;
      this.render();
    }, options);
    const syncMotion = () => {
      if (!this.motion?.matches) return;
      this.previewed = true;
      this.pause();
    };
    this.motion?.addEventListener('change', syncMotion, options);
    syncMotion();
    if (this.win.IntersectionObserver) {
      this.observer = new this.win.IntersectionObserver(entries => {
        const entry = entries[entries.length - 1];
        if (!entry.isIntersecting) this.pause();
        else if (entry.intersectionRatio >= 0.35 && !this.previewed && this.canAnimate) {
          this.previewed = true;
          // A browser can restore form state without sending an input event, so only a sample value replays.
          if (!this.typed && this.isSample(this.input.value) && !form.contains(root.activeElement)) this.startTour();
          else this.render();
        }
      }, { threshold: [0, 0.35] });
    }
    this.render();
    this.figure.dataset.pgReady = '';
  }

  render() {
    const email = this.input.value;
    const id = PEOPLE.get(email);
    this.values.textContent = JSON.stringify([email]);
    this.figure.dataset.pgMatch = id === undefined ? 'no' : 'yes';
    const result = email === '' ? '이메일을 입력하세요' : id === undefined ? '0행' : `1행 · id ${id}`;
    if (this.result.textContent !== result) this.result.textContent = result;
    for (const sample of this.samples) {
      sample.setAttribute('aria-pressed', String(email === sample.dataset.pgSample));
    }
  }

  isSample(value) {
    return [...this.samples].some(sample => sample.dataset.pgSample === value);
  }

  get canAnimate() {
    return this.active && !this.pageHidden && !this.root.hidden && !this.motion?.matches;
  }

  activateSlide(slide) {
    if (!this.figure || this.active === (slide === this.slide)) return;
    this.active = slide === this.slide;
    if (this.active) {
      // Every visit to the slide plays the examples once while it is visible.
      // A run cut short by scrolling away or hiding the tab starts again on the next visit.
      this.previewed = Boolean(this.motion?.matches);
      this.observer?.observe(this.figure);
    } else {
      this.observer?.disconnect();
      this.pause();
    }
  }

  play() {
    const replay = 'pgPlaying' in this.figure.dataset;
    this.stop();
    if (!this.canAnimate || this.input.value === '') return;
    if (replay) void this.figure.offsetWidth;
    this.figure.dataset.pgPlaying = '';
    this.timer = this.win.setTimeout(() => this.stop(), PLAYBACK_MS);
  }

  stop() {
    this.win.clearTimeout(this.timer);
    this.timer = null;
    delete this.figure.dataset.pgPlaying;
  }

  startTour() {
    if (!this.canAnimate || this.tour) return;
    const tour = this.tour = { timer: null };
    this.figure.dataset.pgTouring = '';
    this.result.setAttribute('aria-live', 'off');
    const show = index => {
      if (this.tour !== tour) return;
      this.input.value = this.samples[index].dataset.pgSample;
      this.render();
      this.play();
      const last = index + 1 === this.samples.length;
      tour.timer = this.win.setTimeout(() => {
        if (this.tour !== tour) return;
        if (last) this.stopTour();
        else show(index + 1);
      }, last ? PLAYBACK_MS : SAMPLE_INTERVAL_MS);
    };
    show(0);
  }

  stopTour() {
    if (!this.tour) return;
    this.win.clearTimeout(this.tour.timer);
    this.tour = null;
    delete this.figure.dataset.pgTouring;
    this.result.setAttribute('aria-live', 'polite');
  }

  pause() {
    this.stopTour();
    this.stop();
  }

  dispose() {
    if (!this.figure) return;
    this.active = false;
    this.observer?.disconnect();
    this.pause();
    this.events.abort();
    delete this.figure.dataset.pgReady;
  }
}
