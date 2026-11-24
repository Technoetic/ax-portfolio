const HOSTS = { claude: 'Claude Code', codex: 'Codex', antigravity: 'Antigravity' };
const PREVIEW = { source: 'claude', target: 'codex' };
const PHASES = [
  { name: 'send', ms: 700, note: '작업 기록 보내는 중' },
  { name: 'store', ms: 550, note: 'Markdown 노트에 저장' },
  { name: 'receive', ms: 850, note: '다음 도구로 불러오는 중' },
];

export class VaultInteraction {
  constructor({ root = document, onInteract } = {}) {
    this.slide = root.getElementById('sav');
    this.map = this.slide?.querySelector('.av-map');
    if (!this.map) return;
    this.hosts = [...this.map.querySelectorAll('[data-av-host]')];
    this.status = this.map.querySelector('[data-av-status]');
    this.note = this.map.querySelector('[data-av-note]');
    if (!this.note || !this.status || this.hosts.length !== 3) return;

    this.root = root;
    this.win = root.defaultView;
    this.media = this.win.matchMedia?.('(prefers-reduced-motion: reduce)');
    this.abort = new AbortController();
    this.previewPlayed = false;
    this.active = false;
    this.pageHidden = false;
    this.owner = PREVIEW.source;
    this.lastRoute = PREVIEW;
    this.pending = null;
    this.timer = null;
    this.observer = null;
    this.initialNote = this.note.textContent;
    this.initialStatus = this.status.textContent;
    const options = { signal: this.abort.signal };
    for (const button of this.hosts) {
      button.disabled = false;
      button.setAttribute('aria-pressed', String(button.dataset.avHost === this.owner));
      button.addEventListener('click', () => {
        if (!this.available) return;
        onInteract?.();
        const target = button.dataset.avHost;
        let source = this.owner;
        if (target === source) {
          const previous = this.pending ?? this.lastRoute;
          source = previous.target === target ? previous.source : previous.target;
        }
        this.start({ source, target });
      }, options);
    }
    this.media?.addEventListener('change', () => {
      if (this.media.matches) this.finish();
      else this.observe();
    }, options);
    root.addEventListener('visibilitychange', () => this.observe(), options);
    this.win.addEventListener('pagehide', () => {
      this.pageHidden = true;
      this.observe();
    }, options);
    this.win.addEventListener('pageshow', () => {
      this.pageHidden = false;
      this.observe();
    }, options);
    Object.assign(this.map.dataset, { avReady: 'true', ...PREVIEW, phase: 'idle' });
  }

  get available() {
    return this.active && !this.root.hidden && !this.pageHidden;
  }

  activateSlide(slide) {
    if (!this.abort || this.active === (slide === this.slide)) return;
    this.active = slide === this.slide;
    this.observe();
  }

  observe() {
    this.observer?.disconnect();
    this.observer = null;
    if (!this.available) {
      this.finish();
      return;
    }
    if (!this.win.IntersectionObserver) return;
    this.observer = new this.win.IntersectionObserver((entries, observer) => {
      if (observer !== this.observer) return;
      const entry = entries[entries.length - 1];
      if (!entry.isIntersecting) this.finish();
      else if (entry.intersectionRatio >= 0.32 && !this.previewPlayed && !this.media?.matches) {
        this.start(PREVIEW);
      }
    }, { threshold: [0, 0.32] });
    this.observer.observe(this.map);
  }

  start({ source, target }) {
    this.previewPlayed = true;
    this.win.clearTimeout(this.timer);
    const route = { source, target };
    this.pending = route;
    Object.assign(this.map.dataset, route);
    for (const button of this.hosts) button.setAttribute('aria-pressed', String(button.dataset.avHost === target));
    if (this.media?.matches) {
      this.finish();
      return;
    }
    this.status.textContent = HOSTS[source] + ' → ' + HOSTS[target] + ' · 작업 인계 중';
    // Drop the old send animation before replaying or replacing its route.
    if (this.map.dataset.phase === 'send') {
      this.map.dataset.phase = 'idle';
      void this.map.offsetWidth;
    }
    const advance = index => {
      if (this.pending !== route) return;
      if (index === PHASES.length) {
        this.finish();
        return;
      }
      const phase = PHASES[index];
      this.map.dataset.phase = phase.name;
      this.note.textContent = phase.note;
      this.timer = this.win.setTimeout(() => advance(index + 1), phase.ms);
    };
    advance(0);
  }

  finish() {
    if (!this.pending) return;
    this.win.clearTimeout(this.timer);
    this.timer = null;
    this.lastRoute = this.pending;
    this.owner = this.pending.target;
    this.pending = null;
    this.map.dataset.phase = 'done';
    this.note.textContent = this.initialNote;
    this.status.textContent = HOSTS[this.owner] + '에서 열었습니다. 다음 도구를 선택하세요.';
  }

  dispose() {
    if (!this.abort) return;
    this.active = false;
    this.observe();
    this.abort.abort();
    this.abort = null;
    this.note.textContent = this.initialNote;
    this.status.textContent = this.initialStatus;
    delete this.map.dataset.avReady;
    this.map.dataset.phase = 'idle';
    for (const button of this.hosts) button.disabled = true;
  }
}
