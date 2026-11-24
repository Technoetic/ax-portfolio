const DEFAULT_DURATION_MS = 1400;
const formatters = new Map();

export function easeOutCubic(progress) {
  const clamped = Math.min(1, Math.max(0, Number(progress) || 0));
  return 1 - (1 - clamped) ** 3;
}

export function formatCount(value, { locale = 'ko-KR', decimals = 0, format = 'decimal', currency } = {}) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '0';
  const safeDecimals = Math.max(0, Math.min(6, Number(decimals) || 0));
  const style = format === 'percent' ? 'percent' : (format === 'currency' && currency ? 'currency' : 'decimal');
  const key = `${locale}|${style}|${safeDecimals}|${currency || ''}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    const options = {
      style,
      minimumFractionDigits: safeDecimals,
      maximumFractionDigits: safeDecimals,
    };
    if (style === 'currency' && currency) options.currency = currency;
    formatter = new Intl.NumberFormat(locale, options);
    formatters.set(key, formatter);
  }
  return formatter.format(numeric);
}

export function parseDurationToken(raw, fallback = DEFAULT_DURATION_MS) {
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) return raw;
  const text = String(raw ?? '').trim();
  const match = text.match(/^(\d+(?:\.\d+)?)(ms|s)$/i);
  if (!match) return fallback;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) return fallback;
  return match[2].toLowerCase() === 's' ? amount * 1000 : amount;
}

function readDurationToken(root, fallback = DEFAULT_DURATION_MS) {
  try {
    const target = root?.documentElement || globalThis.document?.documentElement;
    if (!target || typeof globalThis.getComputedStyle !== 'function') return fallback;
    return parseDurationToken(globalThis.getComputedStyle(target).getPropertyValue('--motion-countup-duration'), fallback);
  } catch {
    return fallback;
  }
}

export class CountUp {
  constructor({ root = document, locale = 'ko-KR', duration, reducedMotion, mode = 'viewport' } = {}) {
    this.root = root;
    this.locale = locale;
    this.mode = mode;
    this.duration = duration != null ? parseDurationToken(duration) : readDurationToken(root);
    this.abort = new AbortController();
    this.disposed = false;
    this.frame = null;
    this.observers = new Map();
    this.scrollendBound = new WeakSet();
    this.entries = new Map();
    this.active = new Set();
    this.reducedQuery = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)') || null;
    this.forcedReduced = reducedMotion === true;
    this.tick = now => this._onFrame(now);

    if (this.root?.documentElement?.dataset) {
      this.root.documentElement.dataset.countupActive = '1';
    }
    this._collectEntries(this.root);
    this._attachListeners();

    if (this.mode === 'viewport') {
      if (!this._shouldAnimate()) this.finishAll();
      else this._prepareScope(this.root, null, { immediate: false });
    }
  }

  _isReduced() {
    return this.forcedReduced || Boolean(this.reducedQuery?.matches);
  }

  _shouldAnimate() {
    return !this._isReduced() && typeof globalThis.requestAnimationFrame === 'function';
  }

  _collectEntries(container) {
    const nodes = container?.querySelectorAll?.('[data-countup-target]') || [];
    for (const el of nodes) {
      if (this.entries.has(el)) continue;
      const target = Number(el.dataset?.countupTarget);
      if (!Number.isFinite(target)) continue;
      const decimals = Number(el.dataset?.countupDecimals) || 0;
      const format = el.dataset?.countupFormat || 'decimal';
      const currency = el.dataset?.countupCurrency || undefined;
      const formatOptions = { locale: this.locale, decimals, format, currency };
      const finalText = formatCount(target, formatOptions);
      const zeroText = formatCount(0, formatOptions);
      this.entries.set(el, {
        el,
        target,
        decimals,
        formatOptions,
        finalText,
        zeroText,
        lastText: el.textContent,
        startTime: 0,
        state: 'pending',
        scrollRoot: null,
      });
    }
  }

  _attachListeners() {
    const options = { signal: this.abort.signal };
    this.reducedQuery?.addEventListener?.('change', event => {
      if (event.matches) this.finishAll();
    }, options);
    globalThis.addEventListener?.('beforeprint', () => this.finishAll(), options);
    globalThis.addEventListener?.('pagehide', () => this._pauseForPageHide(), options);
    globalThis.addEventListener?.('pageshow', event => {
      if (event?.persisted) this._resumeFromBFCache();
    }, options);
    if (this.mode === 'viewport') {
      globalThis.addEventListener?.('scrollend', () => this.syncScope(null), { passive: true, signal: this.abort.signal });
    }
  }

  activateScope(container, { immediate = false } = {}) {
    if (this.disposed || !container) return;
    this._collectEntries(container);
    if (immediate || !this._shouldAnimate()) {
      for (const entry of this._entriesIn(container)) this._settle(entry);
      return;
    }
    this._prepareScope(container, container, { immediate: false });
  }

  _entriesIn(container) {
    if (!container || container === this.root) return [...this.entries.values()];
    const result = [];
    for (const entry of this.entries.values()) {
      if (container.contains?.(entry.el)) result.push(entry);
    }
    return result;
  }

  _bounds(scrollRoot) {
    if (scrollRoot && scrollRoot !== this.root && typeof scrollRoot.getBoundingClientRect === 'function') {
      const rect = scrollRoot.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom };
    }
    return { top: 0, bottom: Number(globalThis.innerHeight) || 900 };
  }

  _prepareScope(container, scrollRoot, { immediate = false } = {}) {
    const bounds = this._bounds(scrollRoot);
    const hasIO = typeof globalThis.IntersectionObserver === 'function';
    const toObserve = [];
    const entries = this._entriesIn(container);

    for (const entry of entries) {
      if (entry.state === 'done' || entry.state === 'running') continue;
      entry.scrollRoot = scrollRoot;
      if (immediate || entry.target === 0) {
        this._settle(entry);
        continue;
      }
      const rect = entry.el.getBoundingClientRect?.();
      if (rect && rect.bottom <= bounds.top) {
        this._settle(entry);
        continue;
      }
      if (!rect || rect.top < bounds.bottom || !hasIO) {
        this._writeText(entry, entry.zeroText);
        this._startEntry(entry);
      } else {
        this._writeText(entry, entry.zeroText);
        toObserve.push(entry);
      }
    }

    if (toObserve.length && hasIO) {
      const observer = this._ensureObserver(scrollRoot);
      for (const entry of toObserve) observer.observe(entry.el);
      if (scrollRoot && scrollRoot !== this.root && !this.scrollendBound.has(scrollRoot)) {
        this.scrollendBound.add(scrollRoot);
        scrollRoot.addEventListener?.('scrollend', () => this.syncScope(scrollRoot), {
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
        const entry = this.entries.get(record.target);
        if (!entry || entry.state !== 'pending') continue;
        const rect = record.boundingClientRect;
        if (record.isIntersecting || (rect && rect.top < bounds.bottom)) {
          observer.unobserve(record.target);
          if (rect && rect.bottom <= bounds.top) this._settle(entry);
          else this._startEntry(entry);
        }
      }
    }, { root: key, threshold: 0, rootMargin: '100000px 0px 40px 0px' });
    this.observers.set(key, observer);
    return observer;
  }

  syncScope(scrollRoot = null, { settleAbove = false } = {}) {
    if (this.disposed) return;
    if (!this._shouldAnimate()) {
      this.finishAll();
      return;
    }
    const bounds = this._bounds(scrollRoot);
    const observer = this.observers.get(scrollRoot || null);
    for (const entry of this.entries.values()) {
      if (entry.state === 'done') continue;
      if ((entry.scrollRoot || null) !== (scrollRoot || null)) continue;
      const rect = entry.el.getBoundingClientRect?.();
      if (!rect) continue;
      if (rect.bottom <= bounds.top || (settleAbove && rect.top < bounds.top)) {
        observer?.unobserve(entry.el);
        this._settle(entry);
      } else if (entry.state === 'pending' && rect.top < bounds.bottom) {
        observer?.unobserve(entry.el);
        this._startEntry(entry);
      }
    }
  }

  _startEntry(entry) {
    if (this.disposed || entry.state !== 'pending') return;
    if (!this._shouldAnimate() || entry.target === 0) {
      this._settle(entry);
      return;
    }
    entry.state = 'running';
    entry.startTime = globalThis.performance?.now?.() ?? Date.now();
    this.active.add(entry);
    if (this.frame === null) {
      this.frame = globalThis.requestAnimationFrame(this.tick);
    }
  }

  _onFrame(now) {
    this.frame = null;
    if (this.disposed) return;
    const currentNow = Number.isFinite(now) ? now : (globalThis.performance?.now?.() ?? Date.now());
    for (const entry of [...this.active]) {
      const elapsed = Math.max(0, currentNow - entry.startTime);
      const progress = this.duration > 0 ? Math.min(1, elapsed / this.duration) : 1;
      if (progress >= 1) {
        this._settle(entry);
        continue;
      }
      const eased = easeOutCubic(progress);
      const raw = entry.target * eased;
      const value = (entry.decimals > 0 || entry.formatOptions.format === 'percent') ? raw : Math.round(raw);
      this._writeText(entry, formatCount(value, entry.formatOptions));
    }
    if (this.active.size > 0 && !this.disposed) {
      this.frame = globalThis.requestAnimationFrame(this.tick);
    }
  }

  _writeText(entry, text) {
    if (entry.lastText === text) return;
    entry.lastText = text;
    entry.el.textContent = text;
  }

  _settle(entry) {
    this.active.delete(entry);
    entry.state = 'done';
    this._writeText(entry, entry.finalText);
  }

  finishAll() {
    this._cancelFrame();
    this._disconnectObservers();
    for (const entry of this.entries.values()) this._settle(entry);
  }

  _pauseForPageHide() {
    this._cancelFrame();
    this._disconnectObservers();
    for (const entry of [...this.active]) {
      entry.state = 'interrupted';
      this.active.delete(entry);
    }
  }

  _resumeFromBFCache() {
    if (this.disposed) return;
    if (!this._shouldAnimate()) {
      this.finishAll();
      return;
    }
    const hasIO = typeof globalThis.IntersectionObserver === 'function';
    for (const entry of this.entries.values()) {
      if (entry.state === 'interrupted') {
        this._settle(entry);
      } else if (entry.state === 'pending' && (this.mode === 'viewport' || entry.scrollRoot)) {
        const bounds = this._bounds(entry.scrollRoot);
        const rect = entry.el.getBoundingClientRect?.();
        if (rect && rect.bottom <= bounds.top) {
          this._settle(entry);
        } else if (!rect || rect.top < bounds.bottom || !hasIO) {
          this._startEntry(entry);
        } else {
          this._ensureObserver(entry.scrollRoot).observe(entry.el);
        }
      }
    }
  }

  _cancelFrame() {
    if (this.frame !== null) {
      globalThis.cancelAnimationFrame?.(this.frame);
      this.frame = null;
    }
  }

  _disconnectObservers() {
    for (const observer of this.observers.values()) observer.disconnect();
    this.observers.clear();
  }

  dispose() {
    this.disposed = true;
    this._cancelFrame();
    this._disconnectObservers();
    this.active.clear();
    this.abort.abort();
  }
}
