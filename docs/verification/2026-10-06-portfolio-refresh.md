# 2026-10-06 포트폴리오 갱신 검증

`task_id`: `portfolio-refresh-20261006`

## 변경과 공개 근거

기존 화면 구성과 탐색 동작을 유지하면서 하네스 36 소개를 **하네스 20 v4.0.0**으로 갱신했습니다. 기획부터 시작하는 전체 20단계 본문, 대체 제목, 원본 메타데이터, 웹 이력서와 PDF를 함께 맞췄습니다. Agentic Vault는 **v0.18.0**을 표시합니다.

- [하네스 20 v4.0.0](https://github.com/Technoetic/harness20/releases/tag/v4.0.0): 태그 커밋 `a6966675cb1f8dc90a2eb8d533bcb7f2664ec6e4`의 `planning-first-20-v1` 프로필
- [Agentic Vault v0.18.0](https://github.com/Technoetic/agentic-vault/releases/tag/v0.18.0)
- [공개 사용자 API](https://api.github.com/users/Technoetic): 2026-10-06 11:10 KST 관측 `public_repos:139`
- [하네스 보안 계약](https://github.com/Technoetic/harness20/blob/main/docs/SECURITY.md), [Agentic Vault 보안 계약](https://github.com/Technoetic/agentic-vault/blob/master/docs/SECURITY.md)

OWASP LLM Top 10 제공본에 따른 호스트 통제 보강을 설명합니다. OWASP 인증을 주장하지 않습니다. 생성 HTML의 네이티브 실행은 호스트 격리 지원 전까지 차단하며 변경된 훅은 직접 신뢰 검토해야 합니다. 기존 36·50단계 기록 보존과 새 20단계 실행을 구분했습니다. 별도 커스텀 커맨드 20개는 변경하지 않았습니다.

블로그 255편, 활동과 언어 차트는 기존 스냅샷 기준일을 유지했습니다. 내부 회사 자료나 확인하지 않은 현장 효과를 추가하지 않았습니다.

## artifact_paths

`index.html`, `cv.html`, `jeon-munjun-portfolio.pdf`, `steps-data.js`, `assets/portfolio.js`, `assets/harness50-source.json`, `assets/metrics.json`, `tests/harness-data.test.mjs`, `scripts/export-pdf.mjs`, `.github/workflows/verify.yml`, `README.md`, 이 기록.

## verification_commands_and_results

| 실행 또는 확인 | 현재 결과 |
|---|---|
| `npm ci --ignore-scripts` | GSAP만 설치, 감사 취약점 0개. Playwright 설치·실행 없음 |
| `npm test` | 브라우저 없는 원본·단계 데이터 계약 검사 **4/4 PASS**, 실패·스킵 0 |
| 공개 태그 원본과 표시 본문의 독립 재계산 | 원본 20개·정규화 본문 20개·실제 JS payload 20개·대체 제목 20개 일치 |
| `node --check scripts/export-pdf.mjs`, `git diff --check` | 모두 종료 0 |
| Aside CLI 단계 탐색 확인 | PC 1440px, 같은 출처 iframe 390px·320px, 본문 없는 PC 대체 목록의 **4가지 시나리오에서 각각 20개 단계** 확인 |
| Aside CLI 원문·키보드 확인 | 320px에서 marked 없는 원문 전체 일치, 마지막 단계 이동 한계와 이전 단계 이동 정상 |
| Aside CLI 추가 콘텐츠 확인 | Vault PC, 하네스·Vault 390/320px, 웹 CV 1440/390/320px의 8개 상태에서 최신 문구·링크·가로 넘침 실패 0 |
| 로컬 HTML 링크·자원 참조 독립 검사 | 52개 참조, 실패 0 |
| `npm run export:pdf` | Aside CLI 실제 생성, 종료 0, 638,724 bytes |
| 생성 PDF 검사와 독립 재검사 | **8/8 PASS**: A4 3쪽, 한글 검색, 갱신일, 구버전 제거, 목차, 구조 태그, 공개 링크, loopback 링크 없음 |
| PDF 직접 시각 확인 | 독립 검토자가 3쪽 모두 열어 확인. 글자 잘림·겹침 없음 |

좁은 화면은 브라우저 창 크기를 바꿨다고 주장하지 않습니다. 같은 출처 iframe 내부 viewport를 390px와 320px로 설정해 확인했습니다. 브라우저 화면 검증과 PDF 생성에는 Aside만 사용했고, PDF 구조·텍스트·렌더 검토에는 PyMuPDF를 사용했습니다. 이전 브라우저 검사 35개의 PASS를 이번 실행 결과로 재사용하지 않았습니다.

PDF exporter의 비동기 REPL 작업을 끝까지 기다리도록 수정했습니다. 생성 완료 전에 실행한 초기 PDF 검사는 이전 파일을 검사해 실패했습니다. 실제 내보내기 종료 후 새 파일을 다시 검사한 결과가 위의 8/8입니다. PDF 요청 옵션과 실제 태그·크기 검사를 구분합니다.

### 산출물 SHA-256

| 항목 | SHA-256 |
|---|---|
| canonical profile index | `ae0622c00276ea28f261ae81518e25706c52c704b95223e8fb339437ae0e8dab` |
| 20개 원본·본문 manifest | `52b433c95c8428052a7cd78176a884e1d5e6bb5557269dc29d65b559e12a3ff5` |
| 실제 PDF | `fc50c1f5dc5877e0709e07b6f23b34469bb914f8aeb9aa0e3d24c9063e4e6ee0` |

PDF는 A4 약 594.96×841.92pt이며 검색 가능한 문자 2,620자, 목차 17개, URI 링크 25개입니다. 실제 `StructTreeRoot`, `ToUnicode`, `Outlines`를 확인했습니다. 원본 해시와 표시 본문 해시는 frontmatter 정규화 때문에 서로 다른 값입니다.

## assumptions

공개 릴리스와 공개 사용자 API만을 최신 정보의 근거로 사용했습니다. 이 검증은 포트폴리오 콘텐츠·단계 탐색·PDF 갱신의 검증이며, 하네스 제품 자체의 전체 테스트를 이번 작업에서 다시 실행했다는 뜻이 아닙니다. 기존 CSS와 탐색 런타임은 유지했습니다.

## unresolved

모든 보조기기와 브라우저 조합의 접근성 검토는 수행하지 않았습니다. 네이티브 HTML 실행 제한과 훅 신뢰 검토는 제품의 현재 제약으로 남습니다. 원본 작업 공간의 기존 변경은 보존했습니다.

## next_safe_action

이 후보를 GitHub Actions의 현재 정적 검사 후 `main`에 반영하고, 해당 커밋의 GitHub Pages 배포 성공을 확인합니다. 공개 사이트에서 runtime 파일 8개의 SHA-256과 최신 표시·단계 탐색을 실제 확인한 뒤 배포 완료로 기록합니다.

## verified_by

Codex 읽기 전용 독립 검토자 `portfolio_repo_audit`, 2026-10-06. 원문 20개·현재 정적 검사 4개를 재실행하고 exporter 경로·비동기 처리·PDF 실제 구조·텍스트·3쪽 시각·참조 52개를 확인했습니다. 단계 payload 작성자와 다른 에이전트입니다. Aside 화면 실행은 주 작업자가 수행했으며 독립 검토자의 브라우저 재실행으로 표시하지 않습니다.
