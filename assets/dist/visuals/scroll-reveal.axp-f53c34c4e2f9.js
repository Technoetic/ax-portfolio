const DEFAULT_CLEANUP_MS = 1000;

export class ScrollReveal {
  constructor({ root = document, selector = '[data-reveal]', reducedMotion, mode = 'viewport' } = {}) {
    this.root = root;
    this.selector = selector;
    this.mode = mode;
    this.abort = new AbortController();
    this.disposed = false;
    this.observers = new Map();
    this.pending = new Map(); // el -> scrollRoot
    this.timers = new Set();
    this.enteringCleanups = new Map();
    this.scrollendBound = new WeakSet();
    this.reducedQuery = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)') || null;
    this.forcedReduced = reducedMotion === true;

    this._attachListeners();

    if (this.mode === 'viewport') {
      this.observeScope(this.root, null);
    }
  }

  _isReduced() {
    return this.forcedReduced || Boolean(this.reducedQuery?.matches);
  }

  _attachListeners() {
    const options = { signal: this.abort.signal };
    this.reducedQuery?.addEventListener?.('change', event => {
      if (event.matches) this.revealAll();
    }, options);
    this.root?.addEventListener?.('focusin', event => {
      const target = event.target?.closest?.('.reveal-pending');
      if (target) this.reveal(target);
    }, options);
    globalThis.addEventListener?.('beforeprint', () => this.revealAll(), options);
    globalThis.addEventListener?.('pagehide', () => this._pauseForPageHide(), options);
    globalThis.addEventListener?.('pageshow', event => {
      if (event?.persisted) this._resumeFromBFCache();
    }, options);
    if (this.mode === 'viewport') {
      globalThis.addEventListener?.('scrollend', () => this.syncScope(null), { passive: true, signal: this.abort.signal });
    }
  }

  _bounds(scrollRoot) {
    if (scrollRoot && scrollRoot !== this.root && typeof scrollRoot.getBoundingClientRect === 'function') {
      const rect = scrollRoot.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom };
    }
    return { top: 0, bottom: Number(globalThis.innerHeight) || 900 };
  }

  observeScope(container, scrollRoot = null, { immediate = false } = {}) {
    if (this.disposed || !container) return;
    const nodes = [...(container.querySelectorAll?.(this.selector) || [])];
    if (!nodes.length) return;

    const hasIO = typeof globalThis.IntersectionObserver === 'function';
    if (immediate || this._isReduced() || !hasIO) {
      for (const el of nodes) this._markRevealed(el);
      return;
    }

    const bounds = this._bounds(scrollRoot);
    const belowFold = [];

    for (const el of nodes) {
      if (el.classList?.contains('is-revealed')) continue;
      const rect = el.getBoundingClientRect?.();
      if (!rect || rect.top < bounds.bottom) {
        this._markRevealed(el);
      } else {
        el.classList?.add('reveal-pending');
        this.pending.set(el, scrollRoot || null);
        belowFold.push(el);
      }
    }

    if (belowFold.length) {
      const observer = this._ensureObserver(scrollRoot);
      for (const el of belowFold) observer.observe(el);
      if (scrollRoot && scrollRoot !== this.root && !this.scrollendBound.has(scrollRoot)) {
        this.scrollendBound.add(scrollRoot);
        scrollRoot.addEventListener?.('scrollend', () => this.syncScope(scrollRoot), {
          passive: true,
          signal: this.abort.signal,
        });
      }
    }
  }

  activateSlide(slideElement, { immediate = false } = {}) {
    if (this.disposed || !slideElement) return;
    const nodes = [...(slideElement.querySelectorAll?.(this.selector) || [])];
    if (!nodes.length) return;

    const hasIO = typeof globalThis.IntersectionObserver === 'function';
    if (immediate || this._isReduced() || !hasIO) {
      for (const el of nodes) this._markRevealed(el);
      return;
    }

    const bounds = this._bounds(slideElement);
    const belowFold = [];

    for (const el of nodes) {
      if (el.classList?.contains('is-revealed')) continue;
      const rect = el.getBoundingClientRect?.();
      if (!rect || rect.top < bounds.bottom) {
        // Already in the newly activated slide viewport: mark revealed without blocking paint.
        this._markRevealed(el);
      } else {
        el.classList?.add('reveal-pending');
        this.pending.set(el, slideElement);
        belowFold.push(el);
      }
    }

    if (belowFold.length) {
      const observer = this._ensureObserver(slideElement);
      for (const el of belowFold) observer.observe(el);
      if (!this.scrollendBound.has(slideElement)) {
        this.scrollendBound.add(slideElement);
        slideElement.addEventListener?.('scrollend', () => this.syncScope(slideElement), {
          passive: true,
          signal: this.abort.signal,
        });
      }
    }
  }

  _ensureObserver(scrollRoot) {
    const key = scrollRoot || null;
    if (this.observers.has(key)) return this.observers.get(key);
    const observer = new globalThis.IntersectionObserver(records => {
      if (this.disposed) return;
      const bounds = this._bounds(key);
      for (const record of records) {
        if (!this.pending.has(record.target)) continue;
        const rect = record.boundingClientRect;
        if (record.isIntersecting || (rect && rect.top < bounds.bottom)) {
          this.reveal(record.target, { immediate: Boolean(rect && rect.bottom <= bounds.top) });
        }
      }
    }, { root: key, threshold: 0, rootMargin: '100000px 0px 40px 0px' });
    this.observers.set(key, observer);
    return observer;
  }

  syncScope(scrollRoot = null, { immediate = false } = {}) {
    if (this.disposed) return;
    if (this._isReduced()) {
      this.revealAll();
      return;
    }
    const key = scrollRoot || null;
    const bounds = this._bounds(key);
    for (const [el, elRoot] of [...this.pending.entries()]) {
      if (elRoot !== key) continue;
      const rect = el.getBoundingClientRect?.();
      if (!rect || rect.top < bounds.bottom) {
        this.reveal(el, { immediate: immediate || Boolean(rect && rect.bottom <= bounds.top) });
      }
    }
  }

  reveal(el, { immediate = false } = {}) {
    if (!el) return;
    const scrollRoot = this.pending.get(el) ?? null;
    this.observers.get(scrollRoot)?.unobserve(el);
    this.pending.delete(el);
    if (immediate || this._isReduced()) {
      this._markRevealed(el);
      return;
    }
    this.enteringCleanups.get(el)?.();
    el.classList?.add('reveal-entering');
    el.classList?.remove('reveal-pending');

    let finished = false;
    const onEnd = event => {
      if (event && event.target !== el) return;
      finish();
    };
    const cleanup = () => {
      el.removeEventListener?.('transitionend', onEnd);
      if (timer != null) {
        globalThis.clearTimeout?.(timer);
        this.timers.delete(timer);
      }
      this.enteringCleanups.delete(el);
    };
    const finish = () => {
      if (finished) return;
      finished = true;
      cleanup();
      el.classList?.remove('reveal-entering');
      el.classList?.add('is-revealed');
    };

    el.addEventListener?.('transitionend', onEnd, { signal: this.abort.signal });
    const timer = globalThis.setTimeout?.(() => finish(), DEFAULT_CLEANUP_MS);
    if (timer != null) this.timers.add(timer);
    this.enteringCleanups.set(el, cleanup);
  }

  _markRevealed(el) {
    const scrollRoot = this.pending.get(el) ?? null;
    this.observers.get(scrollRoot)?.unobserve(el);
    this.pending.delete(el);
    this.enteringCleanups.get(el)?.();
    el.classList?.remove('reveal-pending', 'reveal-entering');
    el.classList?.add('is-revealed');
    if (typeof el.getAnimations === 'function') {
      for (const anim of el.getAnimations()) {
        try { anim.cancel(); } catch {}
      }
    }
  }

  revealAll() {
    this._disconnectObservers();
    for (const el of [...this.pending.keys()]) this._markRevealed(el);
    const nodes = this.root?.querySelectorAll?.('.reveal-pending, .reveal-entering') || [];
    for (const el of nodes) this._markRevealed(el);
  }

  _pauseForPageHide() {
    this._disconnectObservers();
  }

  _resumeFromBFCache() {
    if (this.disposed) return;
    if (this._isReduced()) {
      this.revealAll();
      return;
    }
    const hasIO = typeof globalThis.IntersectionObserver === 'function';
    for (const [el, scrollRoot] of [...this.pending.entries()]) {
      const bounds = this._bounds(scrollRoot);
      const rect = el.getBoundingClientRect?.();
      if (!rect || rect.top < bounds.bottom) {
        this.reveal(el, { immediate: Boolean(rect && rect.bottom <= bounds.top) });
      } else if (hasIO) {
        this._ensureObserver(scrollRoot).observe(el);
      }
    }
  }

  _disconnectObservers() {
    for (const observer of this.observers.values()) observer.disconnect();
    this.observers.clear();
  }

  dispose() {
    this.disposed = true;
    this._disconnectObservers();
    for (const cleanup of [...this.enteringCleanups.values()]) cleanup();
    this.enteringCleanups.clear();
    for (const timer of this.timers) globalThis.clearTimeout?.(timer);
    this.timers.clear();
    this.pending.clear();
    this.abort.abort();
  }
}
