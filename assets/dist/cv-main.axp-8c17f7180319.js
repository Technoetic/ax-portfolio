import { EntryService } from './services/entry-service.axp-8c17f7180319.js';
import { VersionService } from './services/version-service.axp-8c17f7180319.js';
import { CvScreen } from './screens/cv-screen.axp-8c17f7180319.js';

function bootCv() {
  const loadedBuild = document.querySelector('meta[name="app-build-id"]')?.content || '';
  const baseUrl = new URL('./', location.href);
  baseUrl.search = '';
  baseUrl.hash = '';

  const version = new VersionService({ baseUrl, loadedBuild });
  const screen = new CvScreen({ root: document, version });
  document.body.dataset.buildId = loadedBuild;
  screen.mount();

  const entry = new EntryService({
    version,
    currentURL: location.href,
    replace: url => location.replace(url),
    cleanUrl: url => history.replaceState(history.state, '', url),
  });

  entry.start({
    canReplace: () => !screen.hasUserInteracted && !screen.readEditState().dirty && !screen.readEditState().saving,
  }).then(outcome => {
    if (outcome !== 'replaced') screen.syncBanner();
  });
}

if (document.getElementById('main')) bootCv();
else document.addEventListener('DOMContentLoaded', bootCv, { once: true });
