import { syncKoreanAgeElements } from './shared/korean-age.axp-aff926c8842e.js';
import { EntryService } from './services/entry-service.axp-aff926c8842e.js';
import { VersionService } from './services/version-service.axp-aff926c8842e.js';
import { ActivityCharts } from './visuals/activity-charts.axp-aff926c8842e.js';
import { AmbientVisuals } from './visuals/ambient-visuals.axp-aff926c8842e.js';
import { CountUp } from './visuals/count-up.axp-aff926c8842e.js';
import { ScrollReveal } from './visuals/scroll-reveal.axp-aff926c8842e.js';
import { DeckScreen } from './screens/deck-screen.axp-aff926c8842e.js';

function bootPortfolio() {
  const loadedBuild = document.querySelector('meta[name="app-build-id"]')?.content || '';
  const baseUrl = new URL('./', location.href);
  baseUrl.search = '';
  baseUrl.hash = '';

  const reducedMotion = Boolean(
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  syncKoreanAgeElements(document);

  const version = new VersionService({ baseUrl, loadedBuild });
  const charts = new ActivityCharts({ root: document, reducedMotion });
  const visuals = new AmbientVisuals({ root: document, reducedMotion });
  const countUp = new CountUp({ root: document, reducedMotion, mode: 'slide' });
  const reveal = new ScrollReveal({ root: document, reducedMotion, mode: 'slide' });
  const deck = new DeckScreen({ root: document, version, charts, visuals, countUp, reveal, reducedMotion });

  document.body.dataset.buildId = loadedBuild;
  charts.mount();
  deck.mount();

  const startVisuals = () => visuals.start(deck.currentIndex === 0);
  if (document.readyState === 'complete') startVisuals();
  else window.addEventListener('load', startVisuals, { once: true });

  const entry = new EntryService({
    version,
    currentURL: location.href,
    replace: url => location.replace(url),
    cleanUrl: url => history.replaceState(history.state, '', url),
  });

  entry.start({
    canReplace: () => !deck.hasUserInteracted && !deck.readEditState().dirty && !deck.readEditState().saving,
  }).then(outcome => {
    if (outcome !== 'replaced') deck.syncUpdateBanner();
  });
}

if (document.getElementById('deck')) bootPortfolio();
else document.addEventListener('DOMContentLoaded', bootPortfolio, { once: true });
