import { BOOTSTRAP_PARAM, buildReloadUrl, cleanBootstrapUrl, parseSlideHash } from '../shared/routes.axp-4562a264193e.js';
import { VaultInteraction } from '../visuals/vault-interaction.axp-4562a264193e.js';
import { ProjectMotion } from '../visuals/project-motion.axp-4562a264193e.js';

export class DeckScreen {
  constructor({
    root = document,
    version,
    charts = null,
    visuals = null,
    countUp = null,
    reveal = null,
    reducedMotion = false,
    assign = url => location.assign(url),
    replace = url => location.replace(url),
  }) {
    this.root = root;
    this.version = version;
    this.charts = charts;
    this.visuals = visuals;
    this.countUp = countUp;
    this.reveal = reveal;
    this.reducedMotion = reducedMotion;
    this.assign = assign;
    this.replace = replace;
    this.abort = new AbortController();
    this.leaveTimers = new Map();
    this.slides = [...this.root.querySelectorAll('#deck > .slide')];
    this.slideIds = this.slides.map(slide => slide.id);
    this.total = this.slides.length;
    this.currentIndex = 0;
    this.navSeq = 0;
    this.wheelTimer = null;
    this.wheelLocked = false;
    this.hasUserInteracted = false;
    this.editState = { dirty: false, saving: false };
    this.disposed = false;
  }

  setEditState(patch) {
    this.editState = { ...this.editState, ...patch };
    this.syncUpdateBanner();
  }

  readEditState() {
    return { ...this.editState };
  }

  mount() {
    const interactions = { root: this.root, onInteract: () => { this.hasUserInteracted = true; } };
    this.vault = new VaultInteraction(interactions);
    this.projectMotion = new ProjectMotion(interactions);
    this.counter = this.root.getElementById('counter');
    this.progress = this.root.getElementById('progress');
    this.dotsWrap = this.root.getElementById('dots');
    this.sectionSelect = this.root.getElementById('section-select');
    this.sectionStatus = this.root.getElementById('section-status');
    this.updateBanner = this.root.getElementById('update-status');
    this.prevBtn = this.root.getElementById('prev');
    this.nextBtn = this.root.getElementById('next');

    this._buildNavigationControls();
    this._bindEvents();

    this.root.documentElement.classList.add('js');
    this._syncInitialHash();
    this.root.getElementById('loader')?.remove();
  }

  _sectionTitle(slide) {
    return slide.dataset.title || slide.querySelector('h1, h2')?.textContent.trim() || slide.id;
  }

  _buildNavigationControls() {
    this.dotsWrap?.replaceChildren();
    this.slides.forEach((slide, index) => {
      slide.tabIndex = -1;
      if (!this.dotsWrap) return;
      const button = this.root.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', `${index + 1}. ${this._sectionTitle(slide)}`);
      button.setAttribute('aria-controls', slide.id);
      button.addEventListener('click', () => {
        this.hasUserInteracted = true;
        this.navigateToIndex(index);
      }, { signal: this.abort.signal });
      this.dotsWrap.appendChild(button);
    });
    this.dots = this.dotsWrap ? [...this.dotsWrap.children] : [];

    if (this.sectionSelect) {
      this.sectionSelect.replaceChildren(
        ...this.slides.map((slide, index) => new Option(`${index + 1}. ${this._sectionTitle(slide)}`, slide.id)),
      );
      this.sectionSelect.addEventListener('change', () => {
        this.hasUserInteracted = true;
        const index = this.slides.findIndex(slide => slide.id === this.sectionSelect.value);
        if (index >= 0) this.navigateToIndex(index);
      }, { signal: this.abort.signal });
    }
  }

  _cleanBaseHref() {
    const clean = new URL(cleanBootstrapUrl(location.href, BOOTSTRAP_PARAM));
    clean.hash = '';
    return clean.href;
  }

  _syncInitialHash() {
    const parsed = parseSlideHash(location.hash, this.slideIds);
    const index = Math.max(0, this.slideIds.indexOf(parsed.id));
    const shouldReplace = parsed.aliased || parsed.unknown;
    this.showSlide(index, {
      historyMode: shouldReplace ? 'replace' : 'none',
      focus: false,
      immediate: true,
    });
  }

  async _onHistoryChange() {
    const parsed = parseSlideHash(location.hash, this.slideIds);
    const index = Math.max(0, this.slideIds.indexOf(parsed.id));
    const shouldReplace = parsed.aliased || parsed.unknown;
    await this.navigateToIndex(index, {
      historyMode: shouldReplace ? 'replace' : 'none',
      isHistoryNavigation: true,
    });
  }

  async navigateToIndex(targetIndex, { historyMode = 'push', focus = false, isHistoryNavigation = false } = {}) {
    if (this.disposed) return;
    const clamped = Math.max(0, Math.min(this.total - 1, targetIndex));
    if (!isHistoryNavigation && historyMode === 'push' && clamped === this.currentIndex) return;

    const targetSlide = this.slides[clamped];
    const targetHref = `${this._cleanBaseHref()}#${encodeURIComponent(targetSlide.id)}`;
    const seq = ++this.navSeq;

    const decision = await this.version.navigation(targetHref, () => this.readEditState());
    if (this.disposed || seq !== this.navSeq) return;

    this.syncUpdateBanner();

    if (decision.kind === 'protect') {
      if (this.updateBanner) {
        this.updateBanner.hidden = false;
        this.updateBanner.textContent = decision.changed
          ? '새 배포가 준비됐습니다. 진행 중인 입력·저장이 끝난 뒤 다음 이동에서 자동 적용됩니다.'
          : '진행 중인 입력·저장이 있어 현재 화면을 유지합니다.';
      }
      return;
    }

    if (decision.kind === 'reload') {
      const reloadHref = buildReloadUrl(targetHref, decision.buildId);
      if (isHistoryNavigation || historyMode === 'replace') {
        this.replace(reloadHref);
      } else {
        this.assign(reloadHref);
      }
      return;
    }

    this.showSlide(clamped, { historyMode, focus, immediate: false });
  }

  showSlide(index, { historyMode = 'push', focus = false, immediate = false } = {}) {
    const previous = this.slides[this.currentIndex];
    const nextIndex = Math.max(0, Math.min(this.total - 1, index));
    const nextSlide = this.slides[nextIndex];
    const changed = previous !== nextSlide;
    const moveFocus = focus || (changed && previous?.contains(this.root.activeElement));

    this.currentIndex = nextIndex;

    if (immediate || this.reducedMotion || !changed) {
      for (const timer of this.leaveTimers.values()) clearTimeout(timer);
      this.leaveTimers.clear();
      this.slides.forEach((slide, idx) => {
        const active = idx === nextIndex;
        slide.classList.remove('is-entering', 'is-leaving');
        slide.classList.toggle('active', active);
        slide.inert = !active;
        slide.setAttribute('aria-hidden', String(!active));
      });
    } else {
      if (previous) {
        clearTimeout(this.leaveTimers.get(previous));
        previous.classList.remove('active', 'is-entering');
        previous.classList.add('is-leaving');
        previous.inert = true;
        previous.setAttribute('aria-hidden', 'true');
        const timer = setTimeout(() => {
          previous.classList.remove('is-leaving');
          this.leaveTimers.delete(previous);
        }, 520);
        this.leaveTimers.set(previous, timer);
      }

      clearTimeout(this.leaveTimers.get(nextSlide));
      this.leaveTimers.delete(nextSlide);
      nextSlide.classList.remove('is-leaving', 'active');
      nextSlide.classList.add('is-entering');
      nextSlide.inert = false;
      nextSlide.setAttribute('aria-hidden', 'false');
      nextSlide.scrollTop = 0;
      void nextSlide.offsetWidth;
      nextSlide.classList.add('active');
      nextSlide.classList.remove('is-entering');
    }

    this.dots.forEach((dot, idx) => {
      const active = idx === nextIndex;
      dot.classList.toggle('on', active);
      if (active) dot.setAttribute('aria-current', 'step');
      else dot.removeAttribute('aria-current');
    });

    if (this.sectionSelect) this.sectionSelect.value = nextSlide.id;
    if (this.sectionStatus) {
      this.sectionStatus.textContent = `${nextIndex + 1} / ${this.total} · ${this._sectionTitle(nextSlide)}`;
    }
    if (this.prevBtn) this.prevBtn.disabled = nextIndex === 0;
    if (this.nextBtn) this.nextBtn.disabled = nextIndex === this.total - 1;
    if (this.counter) {
      this.counter.textContent = `${String(nextIndex + 1).padStart(2, '0')} / ${String(this.total).padStart(2, '0')}`;
    }
    if (this.progress) {
      const ratio = this.total > 1 ? nextIndex / (this.total - 1) : 1;
      this.progress.style.transform = `scaleX(${ratio})`;
    }

    const hash = `#${encodeURIComponent(nextSlide.id)}`;
    if (historyMode !== 'none' && location.hash !== hash) {
      history[historyMode === 'replace' ? 'replaceState' : 'pushState'](history.state, '', hash);
    }

    if (moveFocus) nextSlide.focus({ preventScroll: true });
    this.visuals?.setIntensity(nextIndex === 0);
    this.vault?.activateSlide(nextSlide);
    this.projectMotion?.activateSlide(nextSlide);
    this.reveal?.activateSlide(nextSlide);
    this.countUp?.activateScope(nextSlide);
    if (nextSlide.id === 's6') {
      this.charts?.revealMetrics(nextSlide);
    }
  }

  syncUpdateBanner() {
    if (!this.updateBanner) return;
    if (this.version.pendingBuild) {
      this.updateBanner.hidden = false;
      this.updateBanner.textContent = '새 버전이 배포됐습니다. 다음 섹션 이동 시 새 문서로 자동 전환됩니다.';
    } else {
      this.updateBanner.hidden = true;
      this.updateBanner.textContent = '';
    }
  }

  _isInteractive(target) {
    return target instanceof Element && Boolean(
      target.closest('a,button,input,textarea,select,summary,[role="button"],[contenteditable=""],[contenteditable="true"]'),
    );
  }

  _canScrollVertically(target, direction) {
    for (let el = target instanceof Element ? target : this.slides[this.currentIndex]; el && el !== this.root.body; el = el.parentElement) {
      if (el.scrollHeight > el.clientHeight + 2) {
        const style = getComputedStyle(el);
        if (/(auto|scroll)/.test(style.overflowY)) {
          if (direction === 0) return true;
          const atTop = el.scrollTop <= 1;
          const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2;
          if ((direction > 0 && !atBottom) || (direction < 0 && !atTop)) return true;
        }
      }
    }
    return false;
  }

  _insideHorizontalScroller(target) {
    for (let el = target; el instanceof Element && el !== this.root.body; el = el.parentElement) {
      if (el.matches('.slide')) continue;
      const style = getComputedStyle(el);
      if (/(auto|scroll)/.test(style.overflowX) && el.scrollWidth > el.clientWidth + 2) return true;
    }
    return false;
  }

  _bindEvents() {
    const signal = this.abort.signal;

    this.prevBtn?.addEventListener('click', () => {
      this.hasUserInteracted = true;
      this.navigateToIndex(this.currentIndex - 1);
    }, { signal });

    this.nextBtn?.addEventListener('click', () => {
      this.hasUserInteracted = true;
      this.navigateToIndex(this.currentIndex + 1);
    }, { signal });

    const onHistory = () => {
      this._onHistoryChange();
    };
    window.addEventListener('popstate', onHistory, { signal });
    window.addEventListener('hashchange', onHistory, { signal });

    // Background deployment checks on focus, visibility restore, and BFCache pageshow
    const backgroundCheck = async () => {
      await this.version.refresh();
      if (!this.disposed) this.syncUpdateBanner();
    };
    window.addEventListener('focus', backgroundCheck, { signal });
    window.addEventListener('pageshow', event => {
      if (event.persisted) backgroundCheck();
    }, { signal });
    this.root.addEventListener('visibilitychange', () => {
      if (!this.root.hidden) backgroundCheck();
    }, { signal });

    // Slide jump links & same-origin HTML links (cv.html)
    this.root.addEventListener('click', event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!anchor) return;

      if (anchor.hasAttribute('data-slide-target')) {
        const parsed = parseSlideHash(anchor.hash, this.slideIds);
        const index = this.slideIds.indexOf(parsed.id);
        if (index >= 0) {
          event.preventDefault();
          this.hasUserInteracted = true;
          this.navigateToIndex(index, { focus: true });
        }
        return;
      }

      if (anchor.hasAttribute('download') || anchor.target === '_blank') return;
      let resolved;
      try {
        resolved = new URL(anchor.getAttribute('href'), location.href);
      } catch {
        return;
      }
      if (resolved.origin === location.origin && /\.html$/i.test(resolved.pathname)) {
        event.preventDefault();
        this.hasUserInteracted = true;
        this._navigateDocumentLink(resolved.href);
      }
    }, { signal });

    window.addEventListener('keydown', event => {
      if (event.defaultPrevented || this._isInteractive(event.target) || event.ctrlKey || event.metaKey || event.altKey) return;
      if (this._insideHorizontalScroller(event.target) && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) return;

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        this.hasUserInteracted = true;
        this.navigateToIndex(this.currentIndex + 1);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        this.hasUserInteracted = true;
        this.navigateToIndex(this.currentIndex - 1);
      } else if (event.key === 'PageDown' || event.key === ' ') {
        if (this._canScrollVertically(event.target, 1)) return;
        event.preventDefault();
        this.hasUserInteracted = true;
        this.navigateToIndex(this.currentIndex + 1);
      } else if (event.key === 'PageUp') {
        if (this._canScrollVertically(event.target, -1)) return;
        event.preventDefault();
        this.hasUserInteracted = true;
        this.navigateToIndex(this.currentIndex - 1);
      } else if (event.key === 'Home') {
        event.preventDefault();
        this.hasUserInteracted = true;
        this.navigateToIndex(0);
      } else if (event.key === 'End') {
        event.preventDefault();
        this.hasUserInteracted = true;
        this.navigateToIndex(this.total - 1);
      }
    }, { signal });

    let touch = null;
    window.addEventListener('touchstart', event => {
      touch = null;
      if (event.touches.length !== 1 || this._isInteractive(event.target) || this._insideHorizontalScroller(event.target)) return;
      touch = { x: event.touches[0].clientX, y: event.touches[0].clientY, vertical: false };
    }, { passive: true, signal });

    window.addEventListener('touchmove', event => {
      if (!touch) return;
      if (event.touches.length !== 1) {
        touch = null;
        return;
      }
      const dx = event.touches[0].clientX - touch.x;
      const dy = event.touches[0].clientY - touch.y;
      if (Math.abs(dy) > 15 && Math.abs(dy) > Math.abs(dx)) touch.vertical = true;
    }, { passive: true, signal });

    window.addEventListener('touchcancel', () => {
      touch = null;
    }, { passive: true, signal });

    window.addEventListener('touchend', event => {
      const start = touch;
      touch = null;
      if (!start || start.vertical || !event.changedTouches.length) return;
      const dx = event.changedTouches[0].clientX - start.x;
      const dy = event.changedTouches[0].clientY - start.y;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) {
        this.hasUserInteracted = true;
        this.navigateToIndex(this.currentIndex + (dx < 0 ? 1 : -1));
      }
    }, { passive: true, signal });

    window.addEventListener('wheel', event => {
      if (
        this._insideHorizontalScroller(event.target) ||
        this._isInteractive(event.target) ||
        event.ctrlKey ||
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
      ) {
        return;
      }
      if (this._canScrollVertically(event.target, event.deltaY > 0 ? 1 : -1)) return;
      if (Math.abs(event.deltaY) < 8 || this.wheelLocked) return;
      this.wheelLocked = true;
      this.hasUserInteracted = true;
      this.navigateToIndex(this.currentIndex + (event.deltaY > 0 ? 1 : -1));
      this.wheelTimer = setTimeout(() => {
        this.wheelLocked = false;
      }, 680);
    }, { passive: true, signal });
  }

  async _navigateDocumentLink(targetHref) {
    const decision = await this.version.navigation(targetHref, () => this.readEditState());
    if (this.disposed) return;
    if (decision.kind === 'protect') {
      this.syncUpdateBanner();
      return;
    }
    if (decision.kind === 'reload') {
      this.assign(buildReloadUrl(targetHref, decision.buildId));
      return;
    }
    this.assign(targetHref);
  }

  dispose() {
    this.disposed = true;
    this.navSeq++;
    this.abort.abort();
    this.countUp?.dispose();
    this.vault?.dispose();
    this.projectMotion?.dispose();
    this.reveal?.dispose();
    this.charts?.dispose();
    for (const timer of this.leaveTimers.values()) clearTimeout(timer);
    this.leaveTimers.clear();
    if (this.wheelTimer !== null) clearTimeout(this.wheelTimer);
  }
}
