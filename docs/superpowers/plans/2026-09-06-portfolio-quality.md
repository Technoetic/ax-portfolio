# Portfolio Quality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the audited usability and evidence-presentation problems and publish a coherent, accessible portfolio with a searchable CV PDF.

**Architecture:** Keep static HTML and the existing deck. Extract the existing stylesheet and browser script into dedicated assets so content, layout, and navigation can be worked on independently. Browser tests serve local files and exercise real Chromium behavior; deployment needs no Node server.

**Tech Stack:** HTML, CSS, vanilla JavaScript, Node 22+, Playwright 1.63.0, axe-core/playwright 4.13.0, Chromium PDF export.

**Spec:** `docs/superpowers/specs/2026-09-06-portfolio-quality.md`

## Global Constraints

- Preserve unrelated user content and projects; no invented client results or metrics.
- Maintain existing section IDs used by project dialogs; navigation discovers current DOM order.
- Support 320px minimum viewport and JavaScript-disabled reading.
- Keep scripts and dependencies used for tests/export out of browser runtime requirements.

## Task 1: Responsive layout and accessibility

**Files:** `assets/portfolio.css`, `tests/layout.test.mjs`.
**Interfaces:** Existing IDs/classes plus `.site-header`, `.section-nav`, `#section-select`, `.hero-actions`, `.action-link`, `.case-grid`, `.case-card`, `.case-meta`, `.snapshot-note`, `.sr-only`, `.skip-link` added by the coordinator. The header is fixed, the footer is reserved in every slide.

- [x] Add failing browser assertions for CV top content at 390px and blog horizontal overflow at 320px.
- [x] Fix safe vertical alignment, grid minimum sizing, narrow career/command columns, card wrapping, footer spacing, touch target sizes, reduced motion, and no-JS layout.
- [x] Verify every slide and expanded command list at all specified widths.

## Task 2: Navigation and dialogs

**Files:** `assets/portfolio.js`, `tests/navigation.test.mjs`.
**Interfaces:** `a[data-slide-target][href="#id"]`, `select#section-select`, `#deck > .slide` with `data-title`. Existing step/detail dialog IDs remain.

- [x] Reproduce modal swipe and contribution-chart pan changing the underlying slide.
- [x] Guard gestures and editable/interactive keyboard targets. Contain dialog focus and restore the launcher after close.
- [x] Implement hash entry, history back/forward, labeled section selection, current-section announcements, and accessible graph names.
- [x] Confirm semantic links and controls work with mouse, keyboard, and touch.

## Task 3: Evidence-led content

**Files:** `index.html`, `assets/shots/sajukyung.jpg`, `assets/metrics.json`.

- [x] Add landing actions and a DHIS scope case using only confirmed public facts.
- [x] Reorder retained sections to show projects first, remove duplicated profile/experience slides, and retain full history in the CV.
- [x] Update dated metrics consistently and align the current Saju demo title/thumbnail.
- [x] Visually inspect landing/case/project slides with actual web fonts and animations.

## Task 4: CV and searchable PDF

**Files:** `cv.html`, `scripts/export-pdf.mjs`, `tests/cv.test.mjs`, `jeon-munjun-portfolio.pdf`.

- [x] Assert CV links are accessible and print media retains readable text.
- [x] Update CV facts, improve print CSS, and export Chromium text PDF with explicit local output.
- [x] Verify extracted Korean text, page bounds, and hyperlinks; inspect rendered pages.

## Task 5: Integration and delivery

**Files:** `package.json`, `tests/browser.mjs`, `.github/workflows/verify.yml`, `README.md`.

- [x] Run local browser regression and full active-slide axe checks.
- [x] Run independent content/code review and correct any material findings.
- Delivery: commit and open the reviewed PR; merge after CI passes, then verify Pages and published file hashes. Deployment status is recorded by the PR and GitHub Actions.
