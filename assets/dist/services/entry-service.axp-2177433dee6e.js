import { BOOTSTRAP_PARAM, buildReloadUrl, cleanBootstrapUrl } from '../shared/routes.axp-2177433dee6e.js';

export class EntryService {
  constructor({
    version,
    currentURL,
    replace,
    cleanUrl = null,
    randomId = () => crypto.randomUUID(),
    paramName = BOOTSTRAP_PARAM,
  }) {
    this.version = version;
    this.currentURL = currentURL;
    this.replace = replace;
    this.cleanUrl = cleanUrl;
    this.randomId = randomId;
    this.paramName = paramName;
  }

  async start({ canReplace = () => true } = {}) {
    const initialUrl = new URL(this.currentURL);
    const hadBootstrap = initialUrl.searchParams.has(this.paramName);
    await this.version.refresh();

    if (!this.version.pendingBuild) {
      if (hadBootstrap && typeof this.cleanUrl === 'function') {
        this.cleanUrl(cleanBootstrapUrl(this.currentURL, this.paramName));
      }
      return 'continue';
    }

    const attempted = initialUrl.searchParams.get(this.paramName) || '';
    if (attempted.startsWith(`${this.version.pendingBuild}-`)) {
      if (typeof this.cleanUrl === 'function') {
        this.cleanUrl(cleanBootstrapUrl(this.currentURL, this.paramName));
      }
      return 'loop-guarded';
    }

    if (!canReplace()) {
      return 'deferred';
    }

    const targetHref = buildReloadUrl(
      this.currentURL,
      this.version.pendingBuild,
      this.randomId(),
      this.paramName,
    );
    this.replace(targetHref);
    return 'replaced';
  }
}
