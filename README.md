# AX 엔지니어 전문준 · 포트폴리오

빌딩 HMI 현장 경험, DHIS 업무 자동화, Claude Code·Codex 개발 플러그인을 소개하는 정적 웹 포트폴리오입니다.

[포트폴리오](https://technoetic.github.io/ax-portfolio/) · [이력서](https://technoetic.github.io/ax-portfolio/cv.html) · [PDF](https://technoetic.github.io/ax-portfolio/jeon-munjun-portfolio.pdf)

## 구성

- `index.html` — 실무 사례와 대표 프로젝트를 소개하는 12개 섹션
- `assets/portfolio.css`, `assets/portfolio.js` — 반응형 화면과 탐색·모달
- `cv.html`, `jeon-munjun-portfolio.pdf` — 웹 이력서와 검색 가능한 A4 PDF
- `steps-data.js` — 공개 하네스 20의 전체 단계 본문
- `commands-data.js` — 별도 Claude Code 커스텀 커맨드 저장소의 본문
- `assets/metrics.json` — 공개 수치·버전의 출처와 기준일
- `assets/harness50-source.json` — 단계 원본·표시 본문의 SHA256. 기존 파일 이름은 유지합니다.

## 탐색과 호환성

목차, 프로젝트 바로가기, 이전/다음 버튼, 키보드 ← → / Space / Home / End를 지원합니다. 섹션 URL을 공유하고 브라우저 뒤로 가기로 돌아올 수 있습니다. 본문은 세로로 스크롤하며 차트와 모달 안의 조작은 배경 페이지를 넘기지 않습니다. 모달은 Tab으로 탐색하고 Esc로 닫습니다.

Three.js와 GSAP은 배경 효과에만 사용하며 CDN 로딩과 관계없이 탐색을 초기화합니다. marked가 없으면 단계 본문을 원문으로 표시합니다. JavaScript가 비활성화되면 전체 문서를 세로로 읽고 프로젝트·이력서·연락처 링크를 사용할 수 있습니다. 모션 감소 설정을 존중합니다.

## 로컬 실행과 검증

Node.js 22 이상을 사용합니다. 정적 사이트 배포에는 빌드가 필요 없습니다.

```sh
npm ci --ignore-scripts
npm test
python -m http.server 8000 --bind 127.0.0.1
```

`http://127.0.0.1:8000`에서 확인합니다. `npm test`와 GitHub Actions는 브라우저 없는 단계 데이터·원본 해시·대체 제목 계약 검사 4개를 실행합니다. Playwright를 설치하거나 실행하지 않습니다. 이전 브라우저 테스트 파일은 보존하지만 현재 기본 검사에서는 실행하지 않습니다.

화면·키보드·모달·원문/대체 목록·좁은 화면과 PDF는 **Aside CLI**로 별도 확인합니다. 이번 갱신의 실제 범위와 결과는 [검증 기록](docs/verification/2026-10-06-portfolio-refresh.md)에 있습니다. 이전 브라우저 검사 35개의 결과를 이번 실행 결과로 재사용하지 않습니다. 자동 검사만으로 모든 접근성·보조기기 검토가 끝났다고 주장하지 않습니다.

## PDF 재생성

Aside CLI가 설치되고 로그인된 브라우저가 준비되어 있어야 합니다. Windows에서는 검토한 시작 helper를 `ASIDE_BOOTSTRAP`에 지정합니다. 이 helper는 **각 Aside 호출 전에** 실행되며 설정이 없으면 PDF 내보내기를 중단합니다. 별도 CLI 경로가 필요하면 `ASIDE_CLI`를 사용합니다.

```powershell
$env:ASIDE_BOOTSTRAP = 'C:/tools/aside-up.ps1'
npm run export:pdf
```

첫 줄은 자신의 helper 경로로 바꿉니다. 다른 출력 위치는 `npm run export:pdf -- output.pdf`로 지정합니다. exporter는 로컬 CV의 외부 폰트 스타일시트를 제외하고 시스템 한글 폰트를 사용하며 상대 링크를 공개 주소로 바꿉니다. 브라우저 창을 닫지 않고 자신이 연 탭만 닫습니다.

Aside의 CDP 옵션 `paperWidth:8.2677165354`, `paperHeight:11.6929133858`, `preferCSSPageSize:true`, `generateTaggedPDF:true`, `generateDocumentOutline:true`를 요청합니다. exporter 출력의 `tagged_requested`는 요청한 옵션이며 실제 A4 크기·태그·목차·한글·링크는 생성된 PDF에서 따로 확인합니다.

## 콘텐츠 갱신과 배포

2026-10-06 기준 **하네스 20 v4.0.0**, **Agentic Vault v0.18.0**을 표시합니다. 하네스 단계 본문은 [v4.0.0](https://github.com/Technoetic/harness20/releases/tag/v4.0.0), 커밋 `a6966675cb1f8dc90a2eb8d533bcb7f2664ec6e4`의 `planning-first-20-v1` 프로필과 연결했습니다. 기획부터 새 20단계로 시작하고 기존 36·50단계 기록과 재개 경로를 보존합니다.

`steps-data.js`는 공개 태그의 `assets/profiles/planning-first-20-v1/steps/step001.md`~`step020.md`에서 YAML frontmatter와 앞뒤 공백만 제외한 전체 본문입니다. source metadata에는 canonical index와 원본 20개/표시 본문의 SHA256을 기록합니다. 본문·대체 제목·메타데이터·화면·CV·PDF를 함께 갱신합니다. 별도 커스텀 커맨드 20개와 하네스 작업 20단계는 서로 다른 자료입니다.

두 플러그인은 제공된 OWASP LLM Top 10 문서를 기준으로 호스트 통제를 보강했습니다. 표시는 OWASP 인증·전체 환경 안전성 보증이 아닙니다. 하네스 20의 생성 HTML 네이티브 실행은 호스트 네트워크 격리 지원 전까지 차단하며 변경된 훅은 사용자 신뢰 검토가 필요합니다. 현재 공개 근거와 제약은 [하네스 보안 문서](https://github.com/Technoetic/harness20/blob/main/docs/SECURITY.md), [Agentic Vault 보안 문서](https://github.com/Technoetic/agentic-vault/blob/master/docs/SECURITY.md), 각 릴리스의 `verification.json`을 확인합니다.

GitHub 공개 저장소 수 139개는 2026-10-06 공개 사용자 API 관측값입니다. 블로그·활동·언어 차트는 표시된 과거 스냅샷 기준일을 유지합니다. 확인하지 않은 고객사 효과나 내부 회사 자료를 추가하지 않습니다.

GitHub Actions의 정적 검증 후 `main`에 반영하면 GitHub Pages가 저장소 루트의 정적 파일을 배포합니다. 공개 주소에서 내려받은 파일 해시와 화면·단계 탐색까지 확인한 뒤 배포 완료로 기록합니다.
