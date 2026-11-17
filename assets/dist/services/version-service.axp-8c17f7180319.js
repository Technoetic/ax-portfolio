const VALID_BUILD_ID = /^[a-z\d][a-z\d._-]{2,79}$/i;

export class VersionService {
  constructor({
    baseUrl,
    loadedBuild,
    fetcher = globalThis.fetch?.bind(globalThis),
    timeoutMs = 1800,
    randomId = () => crypto.randomUUID(),
  }) {
    if (!loadedBuild || !VALID_BUILD_ID.test(loadedBuild)) {
      throw new Error('Loaded build identity from HTML metadata is required');
    }
    this.baseUrl = new URL(baseUrl);
    this.loadedBuild = loadedBuild;
    this.fetcher = fetcher;
    this.timeoutMs = timeoutMs;
    this.randomId = randomId;
    this.pendingBuild = null;
    this.status = 'idle';
    this.lastError = null;
    this.inFlight = null;
    this.requestSeq = 0;
    this.appliedSeq = 0;
  }

  async refresh() {
    if (this.inFlight) return this.inFlight;
    const seq = ++this.requestSeq;
    const task = this._fetchVersion(seq).finally(() => {
      if (this.inFlight === task) this.inFlight = null;
    });
    this.inFlight = task;
    return task;
  }

  async _fetchVersion(seq) {
    if (typeof this.fetcher !== 'function') {
      this.status = 'unavailable';
      return { changed: !!this.pendingBuild, buildId: this.pendingBuild, status: this.status };
    }
    const controller = new AbortController();
    let timer = null;
    try {
      const request = (async () => {
        const url = new URL('version.json', this.baseUrl);
        url.searchParams.set('_axp_check', this.randomId());
        const response = await this.fetcher(url, {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Version endpoint returned HTTP ${response.status}`);
        }
        const body = await response.json();
        if (!body || typeof body.buildId !== 'string' || !VALID_BUILD_ID.test(body.buildId)) {
          throw new Error('Invalid version payload');
        }
        return body.buildId;
      })();
      const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new Error('Version request timed out'));
        }, this.timeoutMs);
      });
      const serverBuild = await Promise.race([request, timeout]);
      if (seq >= this.appliedSeq) {
        this.appliedSeq = seq;
        // Strict inequality detects both forward deploys (A -> B) and rollbacks (B -> A).
        this.pendingBuild = serverBuild !== this.loadedBuild ? serverBuild : null;
        this.status = 'available';
        this.lastError = null;
      }
    } catch (error) {
      if (seq >= this.appliedSeq) {
        this.status = 'unavailable';
        this.lastError = error;
      }
    } finally {
      if (timer !== null) clearTimeout(timer);
    }
    return {
      changed: !!this.pendingBuild,
      buildId: this.pendingBuild,
      status: this.status,
    };
  }

  async navigation(targetHref, readState = () => ({ dirty: false, saving: false })) {
    await this.refresh();
    // Re-read dirty and save-in-flight immediately before deciding on the transition.
    const state = (typeof readState === 'function' ? readState() : null) || {};
    const unsafe = Boolean(state.dirty || state.saving);
    return {
      kind: unsafe ? 'protect' : this.pendingBuild ? 'reload' : 'spa',
      target: targetHref,
      changed: Boolean(this.pendingBuild),
      buildId: this.pendingBuild,
    };
  }
}
