# AX 엔지니어 전문준 · 포트폴리오

빌딩 HMI 현장 경험, DHIS 업무 자동화, Claude Code·Codex 개발 플러그인을 소개하는 정적 웹 포트폴리오입니다.

[포트폴리오](https://technoetic.github.io/ax-portfolio/) · [이력서](https://technoetic.github.io/ax-portfolio/cv.html) · [PDF](https://technoetic.github.io/ax-portfolio/jeon-munjun-portfolio.pdf)

## 구성

- `index.html` — 실무 사례와 대표 프로젝트부터 탐색하는 12개 섹션
- `assets/portfolio.css`, `assets/portfolio.js` — 반응형 화면과 탐색·모달
- `cv.html` — 화면과 인쇄에 맞춘 이력서
- `jeon-munjun-portfolio.pdf` — 검색·복사·링크·목차를 지원하는 이력서 PDF
- `steps-data.js`, `commands-data.js` — 하네스 단계와 커맨드 본문
- `assets/metrics.json` — 공개 수치의 출처와 기준일
- `tests/` — 실제 Chromium에서 실행하는 화면·입력·접근성·PDF 검사

## 탐색과 호환성

목차, 프로젝트 바로가기, 이전/다음 버튼, 키보드 ← → / Space / Home / End를 지원합니다. 섹션 URL을 공유하거나 브라우저 뒤로 가기로 돌아올 수 있습니다. 본문은 세로로 스크롤하며, 차트의 가로 스크롤과 모달 내부 조작은 배경 페이지를 넘기지 않습니다. 모달은 Tab으로 탐색하고 Esc로 닫습니다.

Three.js와 GSAP은 배경 효과에만 사용하며 CDN 로딩과 관계없이 탐색을 초기화합니다. marked가 없으면 단계 본문을 원문으로 표시합니다. JavaScript가 비활성화되거나 로드되지 않으면 전체 문서를 세로로 읽고 프로젝트·이력서·연락처 링크를 사용할 수 있습니다. 모션 감소 설정을 존중합니다.

## 로컬 실행과 검증

Node.js 22 이상을 사용합니다. 사이트 배포에는 빌드가 필요 없습니다.

```sh
npm ci --ignore-scripts
npx playwright install chromium
python -m http.server 8000
```

`http://localhost:8000`에서 확인합니다. 별도 터미널에서 검증합니다.

```sh
npm test
npm run export:pdf
```

테스트는 자체 임시 서버를 사용합니다. 320·390·768·1280·1440px 레이아웃, 터치와 키보드, URL 이동, JavaScript 없는 읽기, WCAG A/AA 자동 검사와 PDF 출력을 확인합니다. 자동 접근성 검사는 수동 보조기기 검토를 전부 대신하지 않습니다.

PDF는 로컬 시스템 폰트로 `cv.html`에서 생성합니다. Linux에서는 먼저 `fonts-noto-cjk`를 설치하세요. 다른 경로로 내보내려면 `npm run export:pdf -- output.pdf`를 사용합니다. 문서의 상대 링크는 공개 주소로 변환됩니다.

2026-10-03 PDF는 Aside CLI로 생성했습니다. 로컬 HTTP 서버에서 `cv.html`을 열고 외부 폰트 스타일시트를 제외한 뒤 상대 링크를 공개 주소로 변환합니다. `page.pdf`에는 CDP 옵션 `paperWidth: 8.2677165354`, `paperHeight: 11.6929133858`, `preferCSSPageSize: true`, `generateTaggedPDF: true`, `generateDocumentOutline: true`를 사용합니다. 출력물의 A4 3쪽, 검색 가능한 한글, 문서 목차·태그·공개 링크를 확인했습니다. 브라우저 도구 사용에 별도 정책이 있는 환경에서는 그 정책을 따르세요.

## 콘텐츠 갱신과 배포

사이트의 제목·목차·단계 창·이력서는 **하네스 36**으로 표시합니다.

하네스 소개와 단계 본문은 [Harness50 v2.13.0](https://github.com/Technoetic/harness50/releases/tag/v2.13.0), 커밋 `aa4c622cf05d88a51f4b5defb68d0251d8f4fde6` 기준입니다(2026-10-03 갱신). 새 실행은 조사 14단계를 제거한 `research-free-36-v1` 프로필을 사용하며, 기존 50단계 진행 기록은 계속 지원합니다. `assets/harness50-source.json`에 원본 36개 파일과 표시 본문의 SHA256을 기록했습니다. `steps-data.js`는 해당 커밋의 `assets/profiles/research-free-36-v1/steps/step001.md`~`step036.md`에서 YAML frontmatter와 앞뒤 공백만 제외한 본문을 담습니다. 갱신할 때는 같은 원본으로 본문과 `assets/portfolio.js`의 대체 제목 목록을 함께 맞추고, `index.html`·`cv.html`의 버전·설명 및 PDF도 갱신합니다. 데이터·대체 제목·해시의 일치 여부는 `node --test tests/harness-data.test.mjs`로 브라우저 없이 확인할 수 있습니다.

수치를 바꿀 때는 출처를 다시 확인하고 `assets/metrics.json`, `index.html`, `cv.html`의 값과 기준일을 함께 갱신한 뒤 PDF를 재생성합니다. GitHub 저장소 수는 GitHub 사용자 API 기준이며, 블로그·활동·언어 차트는 명시된 날짜의 스냅샷입니다. 확인되지 않은 고객사 효과나 수치는 넣지 않습니다.

GitHub Actions가 PR과 push에서 브라우저 검사를 실행합니다. 검증 후 `main`에 반영하면 GitHub Pages가 저장소 루트의 정적 파일을 배포합니다.
