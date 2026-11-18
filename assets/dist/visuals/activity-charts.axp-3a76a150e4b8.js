const GRASS_SNAPSHOT = [
  ['2026-02-01', 0], ['2026-02-02', 0], ['2026-02-03', 0], ['2026-02-04', 0], ['2026-02-05', 0],
  ['2026-02-06', 0], ['2026-02-07', 0], ['2026-02-08', 0], ['2026-02-09', 0], ['2026-02-10', 0],
  ['2026-02-11', 0], ['2026-02-12', 0], ['2026-02-13', 0], ['2026-02-14', 0], ['2026-02-15', 0],
  ['2026-02-16', 0], ['2026-02-17', 0], ['2026-02-18', 0], ['2026-02-19', 0], ['2026-02-20', 0],
  ['2026-02-21', 0], ['2026-02-22', 0], ['2026-02-23', 1], ['2026-02-24', 1], ['2026-02-25', 0],
  ['2026-02-26', 0], ['2026-02-27', 0], ['2026-02-28', 0], ['2026-03-01', 0], ['2026-03-02', 0],
  ['2026-03-03', 1], ['2026-03-04', 0], ['2026-03-05', 1], ['2026-03-06', 0], ['2026-03-07', 0],
  ['2026-03-08', 1], ['2026-03-09', 1], ['2026-03-10', 1], ['2026-03-11', 1], ['2026-03-12', 1],
  ['2026-03-13', 0], ['2026-03-14', 1], ['2026-03-15', 0], ['2026-03-16', 1], ['2026-03-17', 1],
  ['2026-03-18', 1], ['2026-03-19', 1], ['2026-03-20', 0], ['2026-03-21', 1], ['2026-03-22', 1],
  ['2026-03-23', 1], ['2026-03-24', 0], ['2026-03-25', 1], ['2026-03-26', 1], ['2026-03-27', 1],
  ['2026-03-28', 1], ['2026-03-29', 1], ['2026-03-30', 1], ['2026-03-31', 1], ['2026-04-01', 1],
  ['2026-04-02', 0], ['2026-04-03', 0], ['2026-04-04', 0], ['2026-04-05', 0], ['2026-04-06', 1],
  ['2026-04-07', 0], ['2026-04-08', 0], ['2026-04-09', 4], ['2026-04-10', 0], ['2026-04-11', 0],
  ['2026-04-12', 1], ['2026-04-13', 1], ['2026-04-14', 1], ['2026-04-15', 0], ['2026-04-16', 0],
  ['2026-04-17', 1], ['2026-04-18', 0], ['2026-04-19', 1], ['2026-04-20', 0], ['2026-04-21', 1],
  ['2026-04-22', 0], ['2026-04-23', 1], ['2026-04-24', 0], ['2026-04-25', 0], ['2026-04-26', 1],
  ['2026-04-27', 0], ['2026-04-28', 0], ['2026-04-29', 0], ['2026-04-30', 1], ['2026-05-01', 0],
  ['2026-05-02', 0], ['2026-05-03', 0], ['2026-05-04', 0], ['2026-05-05', 0], ['2026-05-06', 0],
  ['2026-05-07', 0], ['2026-05-08', 1], ['2026-05-09', 0], ['2026-05-10', 0], ['2026-05-11', 1],
  ['2026-05-12', 0], ['2026-05-13', 2], ['2026-05-14', 1], ['2026-05-15', 4], ['2026-05-16', 3],
  ['2026-05-17', 0], ['2026-05-18', 1], ['2026-05-19', 1], ['2026-05-20', 1], ['2026-05-21', 0],
  ['2026-05-22', 0], ['2026-05-23', 1], ['2026-05-24', 0], ['2026-05-25', 0], ['2026-05-26', 2],
  ['2026-05-27', 1], ['2026-05-28', 1], ['2026-05-29', 1], ['2026-05-30', 1], ['2026-05-31', 1],
  ['2026-06-01', 1], ['2026-06-02', 2], ['2026-06-03', 2], ['2026-06-04', 4], ['2026-06-05', 0],
  ['2026-06-06', 0], ['2026-06-07', 1], ['2026-06-08', 1], ['2026-06-09', 1], ['2026-06-10', 1],
  ['2026-06-11', 1], ['2026-06-12', 0], ['2026-06-13', 0], ['2026-06-14', 1], ['2026-06-15', 1],
  ['2026-06-16', 1], ['2026-06-17', 0], ['2026-06-18', 1], ['2026-06-19', 1], ['2026-06-20', 1],
  ['2026-06-21', 0], ['2026-06-22', 0], ['2026-06-23', 1], ['2026-06-24', 0], ['2026-06-25', 1],
  ['2026-06-26', 0], ['2026-06-27', 0], ['2026-06-28', 1], ['2026-06-29', 0], ['2026-06-30', 1],
  ['2026-07-01', 1], ['2026-07-02', 1], ['2026-07-03', 1], ['2026-07-04', 2], ['2026-07-05', 0],
  ['2026-07-06', 0], ['2026-07-07', 1], ['2026-07-08', 0], ['2026-07-09', 0], ['2026-07-10', 0],
  ['2026-07-11', 0], ['2026-07-12', 0], ['2026-07-13', 0], ['2026-07-14', 1], ['2026-07-15', 0],
  ['2026-07-16', 0], ['2026-07-17', 4], ['2026-07-18', 0], ['2026-07-19', 0], ['2026-07-20', 0],
  ['2026-07-21', 0], ['2026-07-22', 0], ['2026-07-23', 1], ['2026-07-24', 0], ['2026-07-25', 0],
  ['2026-07-26', 1], ['2026-07-27', 2], ['2026-07-28', 0], ['2026-07-29', 0], ['2026-07-30', 1],
  ['2026-07-31', 0], ['2026-08-01', 0], ['2026-08-02', 2], ['2026-08-03', 0], ['2026-08-04', 0],
  ['2026-08-05', 1], ['2026-08-06', 3], ['2026-08-07', 1],
];

const LANGS_SNAPSHOT = [
  ['JavaScript', 55],
  ['HTML', 53],
  ['Python', 5],
  ['PowerShell', 5],
  ['TypeScript', 3],
  ['CSS', 3],
];

export class ActivityCharts {
  constructor({ root = document, reducedMotion = false } = {}) {
    this.root = root;
    this.reducedMotion = reducedMotion;
    this.revealed = false;
    this.revealTimer = null;
  }

  mount() {
    this._renderGrass();
    this._renderLanguages();
  }

  _renderGrass() {
    const wrap = this.root.getElementById('grass');
    if (!wrap) return;
    wrap.replaceChildren();
    const colors = ['var(--grass-0)', 'var(--grass-1)', 'var(--grass-2)', 'var(--grass-3)', 'var(--grass-4)'];
    const activeDays = GRASS_SNAPSHOT.filter(([, lv]) => lv > 0).length;
    wrap.setAttribute('role', 'img');
    wrap.setAttribute('aria-label', `2026년 2월부터 2026년 8월까지 GitHub 커밋 활동 히트맵, 총 ${activeDays}일 활동`);
    const total = GRASS_SNAPSHOT.length;
    const span = 600;
    GRASS_SNAPSHOT.forEach(([date, lv], index) => {
      const cell = this.root.createElement('div');
      cell.className = 'cell';
      cell.setAttribute('aria-hidden', 'true');
      cell.style.background = colors[lv] || colors[0];
      cell.style.transitionDelay = `${Math.round((index / total) * span)}ms`;
      cell.title = `${date} · level ${lv}`;
      wrap.appendChild(cell);
    });
  }

  _renderLanguages() {
    const wrap = this.root.getElementById('langs');
    if (!wrap) return;
    wrap.replaceChildren();
    wrap.setAttribute('role', 'list');
    wrap.setAttribute('aria-label', 'GitHub 레포지토리 언어 분포');
    const max = Math.max(...LANGS_SNAPSHOT.map(item => item[1]));
    for (const [name, count] of LANGS_SNAPSHOT) {
      const row = this.root.createElement('div');
      row.className = 'lang-row';
      row.setAttribute('role', 'listitem');
      row.setAttribute('aria-label', `${name} ${count}개 레포`);

      const nm = this.root.createElement('span');
      nm.className = 'nm';
      nm.textContent = name;

      const bar = this.root.createElement('span');
      bar.className = 'bar';
      bar.setAttribute('role', 'progressbar');
      bar.setAttribute('aria-label', `${name} 저장소 수`);
      bar.setAttribute('aria-valuenow', String(count));
      bar.setAttribute('aria-valuemin', '0');
      bar.setAttribute('aria-valuemax', String(max));

      const fill = this.root.createElement('i');
      fill.dataset.w = String((count / max) * 100);
      bar.appendChild(fill);

      const ct = this.root.createElement('span');
      ct.className = 'ct';
      ct.textContent = String(count);

      row.append(nm, bar, ct);
      wrap.appendChild(row);
    }
  }

  revealMetrics(slideElement) {
    if (this.revealed || !slideElement) return;
    this.revealed = true;
    for (const num of slideElement.querySelectorAll('.num[data-target]')) {
      this._countUp(num);
    }
    const applyWidths = () => {
      for (const bar of this.root.querySelectorAll('#langs .bar i')) {
        bar.style.width = `${bar.dataset.w}%`;
      }
    };
    if (this.reducedMotion) {
      applyWidths();
    } else {
      this.revealTimer = setTimeout(applyWidths, 280);
    }
  }

  _countUp(element) {
    const target = Number(element.dataset.target || 0);
    if (this.reducedMotion) {
      element.textContent = target.toLocaleString('en-US');
      return;
    }
    const duration = 1000;
    const start = performance.now();
    const tick = now => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = Math.round(target * eased).toLocaleString('en-US');
      if (progress < 1) requestAnimationFrame(tick);
    };
    tick(start);
  }

  dispose() {
    if (this.revealTimer !== null) clearTimeout(this.revealTimer);
  }
}
