# AX 엔지니어 전문준 · 포트폴리오

빌딩 HMI 10년에서 AI 엔지니어로. 인터랙티브 웹 포트폴리오.

🔗 **Live:** https://technoetic.github.io/ax-portfolio/

## 구성
- `index.html` — 9슬라이드 인터랙티브 덱 (단일 파일 · 의존성은 CDN)
- `steps-data.js` — 하네스 107 step 본문 데이터
- `commands-data.js` — 커스텀 슬래시 커맨드 20개 본문 데이터
- `assets/logos/` — 담당 현장·경력사 로고

## 기술
Three.js(3D 파티클 배경) · GSAP(모션) · marked(마크다운 렌더) · Pretendard/D2Coding 웹폰트.
CDN 실패 시 모두 폴백(3D→Canvas 2D, 마크다운→원문, 폰트→기본).

## 조작
← → / Space 슬라이드 이동 · 하네스 화살표·슬래시 커맨드·step 클릭 시 본문 모달.
