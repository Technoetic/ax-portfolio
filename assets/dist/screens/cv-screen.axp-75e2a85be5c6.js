import { buildReloadUrl } from '../shared/routes.axp-75e2a85be5c6.js';

export class CvScreen {
  constructor({
    root = document,
    version,
    countUp = null,
    reveal = null,
    assign = url => location.assign(url),
    replace = url => location.replace(url),
  }) {
    this.root = root;
    this.version = version;
    this.countUp = countUp;
    this.reveal = reveal;
    this.assign = assign;
    this.replace = replace;
    this.abort = new AbortController();
    this.hasUserInteracted = false;
    this.editState = { dirty: false, saving: false };
    this.disposed = false;
  }

  readEditState() {
    return { ...this.editState };
  }

  mount() {
    this.banner = this.root.getElementById('cv-update-status');
    const signal = this.abort.signal;

    const backgroundCheck = async () => {
      await this.version.refresh();
      if (!this.disposed) this.syncBanner();
    };
    window.addEventListener('focus', backgroundCheck, { signal });
    window.addEventListener('pageshow', event => {
      if (event.persisted) backgroundCheck();
    }, { signal });
    this.root.addEventListener('visibilitychange', () => {
      if (!this.root.hidden) backgroundCheck();
    }, { signal });

    this.root.addEventListener('click', event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!anchor || anchor.hasAttribute('download') || anchor.target === '_blank') return;
      const rawHref = anchor.getAttribute('href') || '';
      if (/^(mailto:|tel:)/i.test(rawHref)) return;

      let resolved;
      try {
        resolved = new URL(rawHref, location.href);
      } catch {
        return;
      }
      if (resolved.origin !== location.origin) return;

      this.hasUserInteracted = true;
      event.preventDefault();
      this._handleInternalNavigation(resolved);
    }, { signal });
    window.addEventListener('hashchange', () => {
      this.reveal?.syncScope(null, { immediate: true });
      this.countUp?.syncScope(null, { settleAbove: true });
    }, { signal });

    if (location.hash && location.hash.length > 1) {
      let hashId = '';
      try {
        hashId = decodeURIComponent(location.hash.slice(1));
      } catch {
        hashId = '';
      }
      const targetEl = hashId ? this.root.getElementById(hashId) : null;
      targetEl?.scrollIntoView({ behavior: 'instant', block: 'start' });
      this.reveal?.syncScope(null, { immediate: true });
      this.countUp?.syncScope(null, { settleAbove: true });
    }
  }

  async _handleInternalNavigation(targetUrl) {
    const decision = await this.version.navigation(targetUrl.href, () => this.readEditState());
    if (this.disposed) return;
    if (decision.kind === 'protect') {
      this.syncBanner();
      return;
    }
    if (decision.kind === 'reload') {
      this.assign(buildReloadUrl(targetUrl.href, decision.buildId));
      return;
    }
    const sameDocument = targetUrl.pathname === location.pathname && targetUrl.search === location.search;
    if (sameDocument && targetUrl.hash) {
      if (location.hash !== targetUrl.hash) {
        history.pushState(history.state, '', targetUrl.hash);
      }
      let hashId = '';
      try {
        hashId = decodeURIComponent(targetUrl.hash.slice(1));
      } catch {
        hashId = '';
      }
      const targetEl = hashId ? this.root.getElementById(hashId) : null;
      const reduced = Boolean(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
      targetEl?.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'start' });
      this.reveal?.syncScope(null);
      this.countUp?.syncScope(null);
      return;
    }
    this.assign(targetUrl.href);
  }

  syncBanner() {
    if (!this.banner) return;
    if (this.version.pendingBuild) {
      this.banner.hidden = false;
      this.banner.textContent = '새 버전이 배포됐습니다. 다음 목차 또는 페이지 이동 시 최신 문서로 자동 전환됩니다.';
    } else {
      this.banner.hidden = true;
      this.banner.textContent = '';
    }
  }

  dispose() {
    this.disposed = true;
    this.countUp?.dispose();
    this.reveal?.dispose();
    this.abort.abort();
  }
}
