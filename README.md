# AX 엔지니어 전문준 · 포트폴리오

빌딩 HMI 현장 경험, DHIS 업무 자동화, Claude Code·Codex 개발 플러그인을 소개하는 정적 웹 포트폴리오입니다.

[포트폴리오](https://technoetic.github.io/ax-portfolio/) · [이력서](https://technoetic.github.io/ax-portfolio/cv.html) · [PDF](https://technoetic.github.io/ax-portfolio/jeon-munjun-portfolio.pdf)

## 구성

- `index.html` — 실무 사례와 대표 프로젝트를 소개하는 12개 섹션
- `assets/portfolio.css`, `assets/portfolio.js` — 반응형 화면과 탐색·모달
- `cv.html`, `jeon-munjun-portfolio.pdf` — 웹 이력서와 검색 가능한 A4 PDF
- `steps-data.js` — 이전 하네스 소개의 보존용 단계 본문(현재 페이지에서 로드하지 않음)
- `commands-data.js` — 별도 Claude Code 커스텀 커맨드 저장소의 본문
- `assets/metrics.json` — 공개 수치·버전의 출처와 기준일
- `assets/harness50-source.json` — 단계 원본·표시 본문의 SHA256. 기존 파일 이름은 유지합니다.

2026-10-14에 [semantic-crosscheck](https://github.com/Technoetic/semantic-crosscheck) v0.1.1 소개를 추가했습니다. [프로젝트 바로가기](https://technoetic.github.io/ax-portfolio/#sxc)에서 PostgreSQL·온톨로지·시맨틱 레이어의 교차 검증 흐름과 설치 안내를 확인합니다. 원본 SVG와 GIF는 `assets/semantic-crosscheck/`에 두었으며 애니메이션은 사용자가 재생하고 정지합니다. 당시 소개 플러그인은 3개였으며, 2026-10-31부터 현재 소개 항목은 에이전틱 볼트와 semantic-crosscheck 2개로 구분합니다.

## 탐색과 호환성

목차, 프로젝트 바로가기, 이전/다음 버튼, 키보드 ← → / Space / Home / End를 지원합니다. 섹션 URL을 공유하고 브라우저 뒤로 가기로 돌아올 수 있습니다. 본문은 세로로 스크롤하며 차트와 모달 안의 조작은 배경 페이지를 넘기지 않습니다. 모달은 Tab으로 탐색하고 Esc로 닫습니다.

Three.js와 GSAP은 배경 효과에만 사용하며 CDN 로딩과 관계없이 탐색을 초기화합니다. marked가 없으면 커맨드 본문을 원문으로 표시합니다. JavaScript가 비활성화되면 전체 문서를 세로로 읽고 프로젝트·이력서·연락처 링크를 사용할 수 있습니다. 모션 감소 설정을 존중합니다.

## 로컬 실행과 검증

Node.js 22 이상을 사용합니다. 정적 사이트 배포에는 빌드가 필요 없습니다.

```sh
npm ci --ignore-scripts
npm test
python -m http.server 8000 --bind 127.0.0.1
```

`http://127.0.0.1:8000`에서 확인합니다. `npm test`와 GitHub Actions는 브라우저 없는 검사 6개를 실행합니다. 보존된 단계 데이터·원본 해시 계약 검사 3개와, 커맨드 본문의 출처 커밋 표기·목록 일치·알려진 형태의 위험 문구(키 echo, 개인 경로, 토큰 형식) 검사 3개입니다. Playwright를 설치하거나 실행하지 않습니다. 이전 브라우저 테스트 파일은 보존하지만 현재 기본 검사에서는 실행하지 않습니다.

화면·키보드·모달·원문/대체 목록·좁은 화면과 PDF는 **Aside CLI**로 별도 확인합니다. 이전 갱신의 실제 범위와 결과는 [2026-10-07 검증 기록](docs/verification/2026-10-07-review-fixes.md)과 [2026-10-06 검증 기록](docs/verification/2026-10-06-portfolio-refresh.md)에 있습니다. 이전 브라우저 검사 35개의 결과를 이번 실행 결과로 재사용하지 않습니다. 자동 검사만으로 모든 접근성·보조기기 검토가 끝났다고 주장하지 않습니다.

## PDF 재생성

Aside CLI가 설치되고 로그인된 브라우저가 준비되어 있어야 합니다. Windows에서는 검토한 시작 helper를 `ASIDE_BOOTSTRAP`에 지정합니다. 이 helper는 **각 Aside 호출 전에** 실행되며 설정이 없으면 PDF 내보내기를 중단합니다. 별도 CLI 경로가 필요하면 `ASIDE_CLI`를 사용합니다.

```powershell
$env:ASIDE_BOOTSTRAP = 'C:/tools/aside-up.ps1'
npm run export:pdf
```

첫 줄은 자신의 helper 경로로 바꿉니다. 다른 출력 위치는 `npm run export:pdf -- output.pdf`로 지정합니다. exporter는 로컬 CV의 외부 폰트 스타일시트를 제외하고 시스템 한글 폰트를 사용하며 상대 링크를 공개 주소로 바꿉니다. 브라우저 창을 닫지 않고 자신이 연 탭만 닫습니다.

Aside의 CDP 옵션 `paperWidth:8.2677165354`, `paperHeight:11.6929133858`, `preferCSSPageSize:true`, `generateTaggedPDF:true`, `generateDocumentOutline:true`를 요청합니다. exporter 출력의 `tagged_requested`는 요청한 옵션이며 실제 A4 크기·태그·목차·한글·링크는 생성된 PDF에서 따로 확인합니다.

## 콘텐츠 갱신과 배포

2026-10-31에 하네스 14 소개 섹션·단계 목록과 관련 프로젝트 링크를 포트폴리오 및 이력서에서 제거했습니다. 기존 `#s4` 링크는 에이전틱 볼트의 `#sav`로 치환하며 다른 섹션 ID는 유지합니다. 커스텀 커맨드 20개의 상세창은 단계 목록과 분리해 계속 제공합니다.

에이전틱 볼트는 [v0.35.1](https://github.com/Technoetic/agentic-vault/releases/tag/v0.35.1)을 소개합니다. 메모리·세션 인계와 함께 웹앱 제작 6원칙을 Claude Code·Codex 공통 스킬로 참조합니다. 지침 제공은 기존 앱의 자동 변경이나 하네스의 모든 실행 기능을 대체한다는 뜻이 아닙니다.

튜토리얼 결과물과 다른 공개 프로젝트는 계속 표시합니다. `assets/metrics.json`의 `dualHostPlugins`는 현재 포트폴리오에 소개하는 2개 프로젝트의 수이며 모든 과거 공개 플러그인의 총수가 아닙니다. 이전 하네스 버전은 `retiredShowcases`에 보존합니다.

`steps-data.js`와 `assets/harness50-source.json`은 이전 공개 태그 v4.2.0/커밋 `49735c60747ac8d9d64165ec8c1beb3c1cbc082e`의 보존 자료입니다. 페이지가 이를 로드하지 않으며, 기존 원본 해시 검사는 보존 자료의 출처만 확인합니다. 커스텀 커맨드 20개는 별도 자료로 계속 로드합니다.

GitHub 공개 저장소 수 139개는 2026-10-06 공개 사용자 API 관측값입니다. 블로그·활동·언어 차트는 표시된 과거 스냅샷 기준일을 유지합니다. 확인하지 않은 고객사 효과나 내부 회사 자료를 추가하지 않습니다.

GitHub Actions의 정적 검증 후 `main`에 반영하면 GitHub Pages가 저장소 루트의 정적 파일을 배포합니다. 공개 주소에서 내려받은 파일 해시와 화면·커맨드 탐색까지 확인한 뒤 배포 완료로 기록합니다.
