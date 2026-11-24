# AX 엔지니어 전문준 · 포트폴리오

빌딩 HMI 11년 현장 경험, DHIS 업무 자동화, Claude Code · Codex · Antigravity용 개발 플러그인과 연구 출처 지도를 소개하는 정적 웹 포트폴리오입니다.

[포트폴리오](https://technoetic.github.io/ax-portfolio/) · [이력서](https://technoetic.github.io/ax-portfolio/cv.html) · [PDF](https://technoetic.github.io/ax-portfolio/jeon-munjun-portfolio.pdf)

## 구성

- `src/templates/` — `index.html`(15개 섹션 덱)과 `cv.html`(웹 이력서) 원본 템플릿
- `src/css/` — 디자인 토큰(`tokens.css`), 기본 스타일(`base.css`), 컴포넌트(`components.css`, `reference-atlas-slide.css`), 이력서 레이어(`cv-*.css`)
- `src/js/` — 책임별 ES 모듈(`main.js`, `cv-main.js`, `DeckScreen`, `CvScreen`, `VersionService`, `EntryService`, `AmbientVisuals`, `ActivityCharts`, 공통 유틸리티)
- `scripts/build.mjs` — 외부 빌드 의존성 없이 내용 해시 정적 자산(`assets/dist/*`), `index.html`, `cv.html`, `version.json`, `pages-manifest.json` 생성
- `cv.html`, `jeon-munjun-portfolio.pdf` — 웹 이력서와 검색·북마크·태그를 갖춘 A4 3쪽 PDF
- `assets/metrics.json` — 공개 수치·릴리스 버전의 출처와 항목별 확인일(`asOf`)

## 탐색과 배포 갱신 (웹앱 제작 6원칙)

목차, 슬라이드 점, 이전/다음 버튼, 키보드 `←` `→` / `Space` / `PageUp` / `PageDown` / `Home` / `End`, 마우스 휠, 터치 스와이프를 지원합니다. 각 섹션은 해시 URL(`#s0`~`#s8`)로 공유하고 새로고침·뒤로 가기로 복원할 수 있습니다. 은퇴한 이전 섹션 주소(`#s4`, `#s5`)는 `#sav`로, `reference-atlas.html`은 `index.html#sref`로 자동 연결됩니다.

각 HTML 문서는 빌드 식별자(`<meta name="app-build-id">`)를 내장하고 `version.json`(`cache: 'no-store'`)과 동일성(`serverBuild !== loadedBuild`)으로 배포 변경을 확인합니다. 이미 열린 탭에서 새 배포가 감지되면 강제 새로고침 대신 다음 안전한 화면 이동에서 대상 URL을 전체 문서로 자동 로드합니다.

Three.js와 GSAP은 선택적 배경 효과에만 비동기로 사용하며 SRI(`integrity`)를 검증합니다. JavaScript가 비활성화되면 전체 문서를 세로로 읽을 수 있고, `prefers-reduced-motion` 설정을 존중합니다.

## 로컬 빌드와 검증

Node.js 22 이상을 사용하며 런타임·빌드 외부 패키지 의존성이 없습니다.

```sh
npm run build
npm test
python -m http.server 8000 --bind 127.0.0.1
```

`npm test`와 GitHub Actions(`verify.yml`)는 빌드 산출물 동기화, `assets/dist/` 보유 빌드 세대 상한(`<= 2`), `#s5` 제거 및 구 해시(`#s4`·`#s5`) 치환, `VersionService`·`EntryService` 배포 전환 상태 기계(A→B 전환·시작 경합·B→A 롤백·루프 방지·입력 보호), 외부 CDN SRI 해시, 내부 자산 참조 무결성, `index.html`↔`cv.html`↔`metrics.json` 동적 수치 정합성, 비밀·로컬 경로 미포함, PDF 구조 무결성을 검증합니다.

## PDF 재생성

Aside CLI가 설치되고 브라우저가 준비되어 있어야 합니다. Windows에서는 검토한 시작 helper를 `ASIDE_BOOTSTRAP`에 지정합니다.

```powershell
$env:ASIDE_BOOTSTRAP = 'C:/tools/aside-up.ps1'
npm run export:pdf
```

exporter는 로컬 `127.0.0.1` 루프백 서버에서 `cv.html`을 열어 상대 링크를 공개 주소로 변환한 뒤 A4 태그드 PDF(`generateTaggedPDF: true`, `generateDocumentOutline: true`)를 생성하고 자신이 연 탭만 닫습니다. GitHub Release `v1.0` 첨부 PDF도 동일한 파일 바이트로 유지합니다.

## 주요 갱신 기록

- **2026-11-24:** 에이전틱 볼트 소개(`#sav`)와 이력서의 버전을 [공개판 v0.57.0](https://github.com/Technoetic/agentic-vault/releases/tag/v0.57.0)으로 갱신했습니다. 소개에는 독립 플러그인으로 분리된 `webapp6`와 [공개판 이후 자비스 Telegram 연동·내장 `/aside-repl` 명령 제거](https://github.com/Technoetic/agentic-vault/blob/435425e02735b32c9d806d8e694c3a22ddac3fc1/docs/releases/unreleased.md)를 반영했습니다.
- **2026-11-23:** 웹앱 제작 6원칙·선택 모션 규칙 3호스트 플러그인 `webapp6`([v0.2.0](https://github.com/Technoetic/webapp6/releases/tag/v0.2.0), `#sw6`) 전용 슬라이드와 통일 `960×640` WebP 구조도(`assets/webapp6/webapp6-hero.webp`)를 추가해 `#sav`·`#sxc`·`#sref`·`#smv`·`#sw6`·`#sctt` 6개 슬라이드의 데스크톱 우측 이미지 좌표를 동일하게 고정했습니다. `md-viz`([v0.4.0](https://github.com/Technoetic/md-viz/releases/tag/v0.4.0), 무설치 Python stdlib 시각화 엔진 및 구조도 갱신), `agentic-vault`([v0.56.0](https://github.com/Technoetic/agentic-vault/releases/tag/v0.56.0)), `semantic-crosscheck`([v0.33.0](https://github.com/Technoetic/semantic-crosscheck/releases/tag/v0.33.0)), [Reference Atlas](https://technoetic.github.io/reference-atlas/)(229개 출처·453건 인용), GitHub 공개 저장소(165개·Pages 146개)·활동 차트(`2026.02.01–11.23`)·언어 분포 및 네이버 기술 블로그(348편)를 `index.html`·`cv.html`(6카드 2×3)·A4 3쪽 태그드 `jeon-munjun-portfolio.pdf`·Release `v1.0`에 일괄 동기화했습니다.
- **2026-11-22:** Markdown 시각화 3호스트 플러그인 `md-viz`([v0.3.0](https://github.com/Technoetic/md-viz/releases/tag/v0.3.0), `#smv`)와 Windows 무DLL 트레이 격납·`aside-repl` 번들 도우미 `close-to-tray-helper`([v0.2.1](https://github.com/Technoetic/close-to-tray-helper/releases/tag/v0.2.1), `#sctt`) 전용 슬라이드 및 통합 `960×640` WebP 구조도를 추가해 `#sav`·`#sxc`·`#sref`·`#smv`·`#sctt` 5개 슬라이드의 데스크톱 우측 이미지 좌표를 동일하게 고정했습니다. `agentic-vault`([v0.54.1](https://github.com/Technoetic/agentic-vault/releases/tag/v0.54.1)), `semantic-crosscheck`([v0.31.1](https://github.com/Technoetic/semantic-crosscheck/releases/tag/v0.31.1)), [Reference Atlas](https://technoetic.github.io/reference-atlas/)(220개 출처·428건 인용), GitHub 공개 저장소(162개·Pages 144개)·활동 차트(`2026.02.01–11.22`)·언어 분포 및 네이버 기술 블로그(344편)를 `index.html`·`cv.html`·A4 3쪽 태그드 `jeon-munjun-portfolio.pdf`·Release `v1.0`에 일괄 동기화했습니다.
- **2026-11-21:** `agentic-vault` [v0.54.0](https://github.com/Technoetic/agentic-vault/releases/tag/v0.54.0), `semantic-crosscheck` [v0.30.0](https://github.com/Technoetic/semantic-crosscheck/releases/tag/v0.30.0), [Reference Atlas](https://technoetic.github.io/reference-atlas/)(197개 출처·367건 인용), GitHub 공개 저장소(158개·Pages 142개)·활동 차트(`2026.02.01–11.21`)·언어 분포 및 네이버 기술 블로그(343편)를 `2026-11-21` 기준으로 `index.html`·`cv.html`·`jeon-munjun-portfolio.pdf`·Release `v1.0`에 일괄 동기화했습니다. `cv.html`/PDF에도 `dh-instantquote` 견적 데모 링크를 연결하고, `#sbcp`·`#scv` 사주경 문구를 소스 공개 기준으로 정렬했으며, `#sdhis` `1440×900` 세로 오버플로 해소와 `assets/dist/` 보유 세대 상한(`<= 2`) 및 `metrics.json` 동적 정합성 테스트를 추가했습니다.
- **2026-11-18:** 표지 CTA와 `#sdhis`를 변압기 제조사 견적 자동화 3단계 사례(`dh-instantquote` 공개 데모 연계) 중심으로 개편하고, 표지 일러스트(`quote-preview`)와 부트캠프 데모 배지·사주경 라이브 링크를 정리했습니다.
- **2026-11-17:** 웹앱 제작 6원칙에 맞춰 JS·CSS 소스를 모듈·레이어로 분리하고 내용 해시 자산과 `version.json` 기반 열린 탭 자동 문서 전환을 적용했습니다. 커스텀 슬래시 커맨드 섹션(`#s5`)과 전용 모달·폰트(`D2Coding`)를 제거하고 `#s5` 주소를 `#sav`로 연결했습니다. `agentic-vault` [v0.51.0](https://github.com/Technoetic/agentic-vault/releases/tag/v0.51.0)(Claude Code · Codex · Antigravity 3호스트), `semantic-crosscheck` [v0.28.0](https://github.com/Technoetic/semantic-crosscheck/releases/tag/v0.28.0), [Reference Atlas](https://technoetic.github.io/reference-atlas/)(190개 출처·350건 인용), 공개 저장소 수(155개·GitHub Pages 배포 139개)를 `index.html`·`cv.html`·`jeon-munjun-portfolio.pdf`·GitHub Release `v1.0`에 일괄 동기화했습니다.
- **2026-11-07:** Reference Atlas 전용 소개 장(`#sref`) 연결 및 빌딩 HMI 경력 요약 연수(11년, 2014.10–2025.10) 정합화.
- **2026-10-31:** 하네스 14 소개 섹션(`#s4`) 정리 및 `#sav` 치환.
- **2026-10-14:** `semantic-crosscheck` 소개 장(`#sxc`) 및 재생/정지 선택형 동작 도식 추가.

## 라이선스

저장소 코드는 [MIT License](LICENSE)를 따릅니다.
