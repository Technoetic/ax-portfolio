// Navigation is independent of optional CDN graphics and Markdown libraries.
function initPortfolio(){
  const REDUCED=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion:reduce)').matches);
  /* ===== 데이터 (실측, 2026-08-07) ===== */
  const GRASS = [["2026-02-01",0],["2026-02-02",0],["2026-02-03",0],["2026-02-04",0],["2026-02-05",0],["2026-02-06",0],["2026-02-07",0],["2026-02-08",0],["2026-02-09",0],["2026-02-10",0],["2026-02-11",0],["2026-02-12",0],["2026-02-13",0],["2026-02-14",0],["2026-02-15",0],["2026-02-16",0],["2026-02-17",0],["2026-02-18",0],["2026-02-19",0],["2026-02-20",0],["2026-02-21",0],["2026-02-22",0],["2026-02-23",1],["2026-02-24",1],["2026-02-25",0],["2026-02-26",0],["2026-02-27",0],["2026-02-28",0],["2026-03-01",0],["2026-03-02",0],["2026-03-03",1],["2026-03-04",0],["2026-03-05",1],["2026-03-06",0],["2026-03-07",0],["2026-03-08",1],["2026-03-09",1],["2026-03-10",1],["2026-03-11",1],["2026-03-12",1],["2026-03-13",0],["2026-03-14",1],["2026-03-15",0],["2026-03-16",1],["2026-03-17",1],["2026-03-18",1],["2026-03-19",1],["2026-03-20",0],["2026-03-21",1],["2026-03-22",1],["2026-03-23",1],["2026-03-24",0],["2026-03-25",1],["2026-03-26",1],["2026-03-27",1],["2026-03-28",1],["2026-03-29",1],["2026-03-30",1],["2026-03-31",1],["2026-04-01",1],["2026-04-02",0],["2026-04-03",0],["2026-04-04",0],["2026-04-05",0],["2026-04-06",1],["2026-04-07",0],["2026-04-08",0],["2026-04-09",4],["2026-04-10",0],["2026-04-11",0],["2026-04-12",1],["2026-04-13",1],["2026-04-14",1],["2026-04-15",0],["2026-04-16",0],["2026-04-17",1],["2026-04-18",0],["2026-04-19",1],["2026-04-20",0],["2026-04-21",1],["2026-04-22",0],["2026-04-23",1],["2026-04-24",0],["2026-04-25",0],["2026-04-26",1],["2026-04-27",0],["2026-04-28",0],["2026-04-29",0],["2026-04-30",1],["2026-05-01",0],["2026-05-02",0],["2026-05-03",0],["2026-05-04",0],["2026-05-05",0],["2026-05-06",0],["2026-05-07",0],["2026-05-08",1],["2026-05-09",0],["2026-05-10",0],["2026-05-11",1],["2026-05-12",0],["2026-05-13",2],["2026-05-14",1],["2026-05-15",4],["2026-05-16",3],["2026-05-17",0],["2026-05-18",1],["2026-05-19",1],["2026-05-20",1],["2026-05-21",0],["2026-05-22",0],["2026-05-23",1],["2026-05-24",0],["2026-05-25",0],["2026-05-26",2],["2026-05-27",1],["2026-05-28",1],["2026-05-29",1],["2026-05-30",1],["2026-05-31",1],["2026-06-01",1],["2026-06-02",2],["2026-06-03",2],["2026-06-04",4],["2026-06-05",0],["2026-06-06",0],["2026-06-07",1],["2026-06-08",1],["2026-06-09",1],["2026-06-10",1],["2026-06-11",1],["2026-06-12",0],["2026-06-13",0],["2026-06-14",1],["2026-06-15",1],["2026-06-16",1],["2026-06-17",0],["2026-06-18",1],["2026-06-19",1],["2026-06-20",1],["2026-06-21",0],["2026-06-22",0],["2026-06-23",1],["2026-06-24",0],["2026-06-25",1],["2026-06-26",0],["2026-06-27",0],["2026-06-28",1],["2026-06-29",0],["2026-06-30",1],["2026-07-01",1],["2026-07-02",1],["2026-07-03",1],["2026-07-04",2],["2026-07-05",0],["2026-07-06",0],["2026-07-07",1],["2026-07-08",0],["2026-07-09",0],["2026-07-10",0],["2026-07-11",0],["2026-07-12",0],["2026-07-13",0],["2026-07-14",1],["2026-07-15",0],["2026-07-16",0],["2026-07-17",4],["2026-07-18",0],["2026-07-19",0],["2026-07-20",0],["2026-07-21",0],["2026-07-22",0],["2026-07-23",1],["2026-07-24",0],["2026-07-25",0],["2026-07-26",1],["2026-07-27",2],["2026-07-28",0],["2026-07-29",0],["2026-07-30",1],["2026-07-31",0],["2026-08-01",0],["2026-08-02",2],["2026-08-03",0],["2026-08-04",0],["2026-08-05",1],["2026-08-06",3],["2026-08-07",1]];
  const LANGS = [["JavaScript",55],["HTML",53],["Python",5],["PowerShell",5],["TypeScript",3],["CSS",3]];
  const STEPS = [[1,"하네스 프리플라이트 체크"],[2,"프로젝트 분석 및 Context 전략 수립"],[3,"Playwright 환경 테스트"],[4,"@axe-core/playwright 환경 설치"],[5,"c8 코드 커버리지 환경 설치"],[6,"Vitest/Jest 유닛 테스트 러너 환경 설치"],[7,"번들 분석 도구 환경 설치"],[8,"jscpd 코드 중복 탐지 환경 설치"],[9,"Semgrep 정적 분석 환경 설치"],[10,"knip 미사용 코드 탐지 환경 설치"],[11,"tokei 코드 통계 환경 설치"],[12,"Lighthouse CI 웹 성능 감사 환경 설치"],[13,"stylelint CSS 린팅 환경 설치"],[14,"Biome 포매팅/린팅 환경 설치"],[15,"madge 순환 의존성 탐지 환경 설치"],[16,"전체 조사"],[17,"GitHub 조사"],[18,"API 계약 문서 조사"],[19,"참고 레포지토리 클론 및 코드 분석"],[20,"Awwwards 사이트 선정"],[21,"의존성 게이트 검증"],[22,"Awwwards 데이터 수집"],[23,"Awwwards 디자인 패턴 분석"],[24,"Awwwards 조사 충분성 검증"],[25,"기획: 전체 조사결과 기반 (독립 검증 루프)"],[26,"기획 보강: GitHub 조사결과"],[27,"기획 보강: API 계약 문서 조사결과"],[28,"기획 보강: 참고 레포 코드 분석"],[29,"기획 보강: Awwwards UX/UI·레이아웃 조사결과"],[30,"통합 설계 (레이아웃 + 전체)"],[31,"환경 준비"],[32,"구현 파일 인덱싱 (tokei)"],[33,"jscpd 코드 중복 베이스라인 수집"],[34,"knip 미사용 코드 베이스라인 수집"],[35,"컨텍스트 윈도우 제한 방지"],[36,"인코딩 규칙 (모지바케 방지)"],[37,"구현"],[38,"빌드 스모크 테스트 (구현 완료 게이트)"],[39,"레이아웃 스크린샷 검증 (독립 검증 루프)"],[40,"조사 스크린샷 vs 구현 스크린샷 비교 검증 (독립 검증 루프)"],[41,"JavaScript 모듈화"],[42,"CSS 파일 분리 (컨텍스트 최적화)"],[43,"Awwwards 디자인 검증 및 CSS 보강 (독립 검증 루프)"],[44,"HTML 컴포넌트화"],[45,"E2E 테스트"],[46,"Playwright 스크린샷 기반 상세 E2E 테스트"],[47,"키보드 인터랙션 시각 검증"],[48,"마우스 인터랙션 시각 검증"],[49,"Playwright 디자인 시각 검증 (독립 검증 루프)"],[50,"콘솔 에러 수집 및 해결"]];

  /* 잔디 렌더 */
  (function(){
    const wrap=document.getElementById('grass');
    const colors=['var(--grass-0)','var(--grass-1)','var(--grass-2)','var(--grass-3)','var(--grass-4)'];
    const activeDays=GRASS.filter(([,lv])=>lv>0).length;
    wrap.setAttribute('role','img');
    wrap.setAttribute('aria-label','2026년 2월부터 2026년 8월까지 GitHub 커밋 활동 히트맵, 총 '+activeDays+'일 활동');
    // 잔디 stagger를 마지막 셀 기준 ~600ms 이내로 압축 (212셀 × 4ms=848ms → 너무 길지 않게)
    const N=GRASS.length, span=600;
    GRASS.forEach(([date,lv],i)=>{
      const c=document.createElement('div');
      c.className='cell';c.setAttribute('aria-hidden','true');
      c.style.background=colors[lv]||colors[0];
      c.style.transitionDelay=Math.round(i/N*span)+'ms';
      c.title=date+' · level '+lv;
      wrap.appendChild(c);
    });
  })();

  /* 언어 막대 */
  (function(){
    const wrap=document.getElementById('langs');
    wrap.setAttribute('role','list');
    wrap.setAttribute('aria-label','GitHub 레포지토리 언어 분포');
    const max=Math.max(...LANGS.map(l=>l[1]));
    LANGS.forEach(([nm,ct])=>{
      const row=document.createElement('div');row.className='lang-row';
      row.setAttribute('role','listitem');
      row.setAttribute('aria-label',nm+' '+ct+'개 레포');
      row.innerHTML='<span class="nm">'+nm+'</span><span class="bar" role="progressbar" aria-label="'+nm+' 저장소 수" aria-valuenow="'+ct+'" aria-valuemin="0" aria-valuemax="'+max+'"><i data-w="'+(ct/max*100)+'"></i></span><span class="ct">'+ct+'</span>';
      wrap.appendChild(row);
    });
  })();

  const slides=[...document.querySelectorAll('#deck > .slide')];
  const total=slides.length;
  let cur=0, done=new Set();
  const counter=document.getElementById('counter');
  const progress=document.getElementById('progress');
  const dotsWrap=document.getElementById('dots');
  const sectionSelect=document.getElementById('section-select');
  const sectionStatus=document.getElementById('section-status');
  const prev=document.getElementById('prev'), next=document.getElementById('next');
  const sectionTitle=slide=>slide.dataset.title||slide.querySelector('h1,h2')?.textContent.trim()||slide.id;
  let closeAllDialogs=()=>{};
  const activeDialog=()=>document.querySelector('#stepDetail.open')||document.querySelector('#stepModal.open');
  const interactive=target=>target instanceof Element&&!!target.closest('a,button,input,textarea,select,summary,[role="button"],[contenteditable=""],[contenteditable="true"]');

  slides.forEach((slide,i)=>{
    slide.tabIndex=-1;
    const b=document.createElement('button');
    b.type='button';
    b.setAttribute('aria-label',(i+1)+'. '+sectionTitle(slide));
    b.setAttribute('aria-controls',slide.id);
    b.addEventListener('click',()=>go(i));
    dotsWrap.appendChild(b);
  });
  const dots=[...dotsWrap.children];
  if(sectionSelect){
    sectionSelect.replaceChildren(...slides.map((slide,i)=>new Option((i+1)+'. '+sectionTitle(slide),slide.id)));
    sectionSelect.addEventListener('change',()=>go(slides.findIndex(slide=>slide.id===sectionSelect.value)));
  }
  if(sectionStatus){
    sectionStatus.setAttribute('role','status');
    sectionStatus.setAttribute('aria-live','polite');
    sectionStatus.setAttribute('aria-atomic','true');
  }

  function countUp(el){
    const t=+el.dataset.target;
    if(REDUCED){el.textContent=t.toLocaleString('en-US');return;}
    const dur=1100,start=performance.now();
    (function tick(now){
      const p=Math.min((now-start)/dur,1),e=1-Math.pow(1-p,3);
      el.textContent=Math.round(t*e).toLocaleString('en-US');
      if(p<1)requestAnimationFrame(tick);
    })(start);
  }

  function go(i,{historyMode='push',focus=false}={}){
    const previous=slides[cur];
    cur=Math.max(0,Math.min(total-1,i));
    if(activeDialog())closeAllDialogs();
    const moveFocus=focus||(previous!==slides[cur]&&previous.contains(document.activeElement));
    slides.forEach((s,idx)=>{
      s.classList.toggle('active',idx===cur);
      s.inert=idx!==cur;
      s.setAttribute('aria-hidden',String(idx!==cur));
    });
    dots.forEach((d,idx)=>{
      d.classList.toggle('on',idx===cur);
      if(idx===cur)d.setAttribute('aria-current','step');else d.removeAttribute('aria-current');
    });
    if(sectionSelect)sectionSelect.value=slides[cur].id;
    if(sectionStatus)sectionStatus.textContent=(cur+1)+' / '+total+' · '+sectionTitle(slides[cur]);
    prev.disabled=cur===0;next.disabled=cur===total-1;
    counter.textContent=String(cur+1).padStart(2,'0')+' / '+String(total).padStart(2,'0');
    progress.style.width=(total>1?cur/(total-1)*100:100)+'%';
    const hash='#'+encodeURIComponent(slides[cur].id);
    if(historyMode!=='none'&&location.hash!==hash)history[historyMode==='replace'?'replaceState':'pushState'](null,'',hash);
    if(moveFocus)slides[cur].focus({preventScroll:true});
    if(window.__setBgIntensity) window.__setBgIntensity(cur===0);
    if(slides[cur].id==='s6' && !done.has('s6')){
      done.add('s6');
      slides[cur].querySelectorAll('.num[data-target]').forEach(countUp);
      setTimeout(()=>document.querySelectorAll('#langs .bar i').forEach(b=>b.style.width=b.dataset.w+'%'),300);
    }
  }

  next.addEventListener('click',()=>go(cur+1));
  prev.addEventListener('click',()=>go(cur-1));
  function fromHash(){
    let id='';try{id=decodeURIComponent(location.hash.slice(1));}catch{}
    const index=slides.findIndex(slide=>slide.id===id);
    go(index<0?0:index,{historyMode:index<0?'replace':'none'});
  }
  window.addEventListener('popstate',fromHash);
  window.addEventListener('hashchange',fromHash);
  document.querySelectorAll('a[data-slide-target]').forEach(link=>link.addEventListener('click',e=>{
    if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    const id=link.hash.slice(1),index=slides.findIndex(slide=>slide.id===id);
    if(index<0)return;
    e.preventDefault();go(index,{focus:true});
  }));
  window.addEventListener('keydown',e=>{
    if(e.defaultPrevented||activeDialog()||interactive(e.target)||nestedScroller(e.target)||e.ctrlKey||e.metaKey||e.altKey)return;
    if(['ArrowRight','PageDown',' '].includes(e.key)){e.preventDefault();go(cur+1);}
    else if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();go(cur-1);}
    else if(e.key==='Home'){e.preventDefault();go(0);}else if(e.key==='End'){e.preventDefault();go(total-1);}
  });
  function nestedScroller(target){
    for(let el=target;el instanceof Element&&el!==document.body;el=el.parentElement){
      if(el.matches('.slide'))continue;
      const style=getComputedStyle(el);
      if((/(auto|scroll)/.test(style.overflowX)&&el.scrollWidth>el.clientWidth+2)||
         (/(auto|scroll)/.test(style.overflowY)&&el.scrollHeight>el.clientHeight+2))return true;
    }
    return false;
  }
  let touch=null;
  window.addEventListener('touchstart',e=>{
    touch=null;
    if(e.touches.length!==1||activeDialog()||interactive(e.target)||nestedScroller(e.target))return;
    touch={x:e.touches[0].clientX,y:e.touches[0].clientY,vertical:false};
  },{passive:true});
  window.addEventListener('touchmove',e=>{
    if(!touch)return;
    if(e.touches.length!==1){touch=null;return;}
    const dx=e.touches[0].clientX-touch.x,dy=e.touches[0].clientY-touch.y;
    if(Math.abs(dy)>15&&Math.abs(dy)>Math.abs(dx))touch.vertical=true;
  },{passive:true});
  window.addEventListener('touchcancel',()=>{touch=null;},{passive:true});
  window.addEventListener('touchend',e=>{
    const start=touch;touch=null;
    if(!start||start.vertical||activeDialog()||!e.changedTouches.length)return;
    const dx=e.changedTouches[0].clientX-start.x,dy=e.changedTouches[0].clientY-start.y;
    if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.3)go(cur+(dx<0?1:-1));
  },{passive:true});

  /* 마우스 휠 스크롤로 슬라이드 이동 (스로틀 + 모달/내부스크롤 보호) */
  let wheelLock=false;
  window.addEventListener('wheel',e=>{
    if(activeDialog()||nestedScroller(e.target)||interactive(e.target)||e.ctrlKey||Math.abs(e.deltaX)>Math.abs(e.deltaY))return;
    // 스크롤 가능한 내부 요소(코드패널 등) 위에서는 그 요소가 끝까지 스크롤되기 전까지 슬라이드 이동 보류
    for(let el=e.target;el&&el!==document.body;el=el.parentElement){
      if(el.scrollHeight>el.clientHeight+2){
        const cs=getComputedStyle(el);
        if(/(auto|scroll)/.test(cs.overflowY)){
          const atTop=el.scrollTop<=0, atBottom=el.scrollTop+el.clientHeight>=el.scrollHeight-2;
          if((e.deltaY>0&&!atBottom)||(e.deltaY<0&&!atTop))return; // 내부 스크롤 우선
        }
      }
    }
    if(Math.abs(e.deltaY)<8)return; // 미세 스크롤 무시
    if(wheelLock)return;
    wheelLock=true;
    go(cur+(e.deltaY>0?1:-1));
    setTimeout(()=>{wheelLock=false;},700); // 전환 애니메이션(.6s)보다 약간 길게
  },{passive:true});

  /* 마우스 패럴랙스 (글로우) */
  function startGraphics(){
  const g1=document.getElementById('glow1'),g2=document.getElementById('glow2');
  const mouse={x:-9999,y:-9999};
  if(!REDUCED){
    window.addEventListener('mousemove',e=>{
      mouse.x=e.clientX;mouse.y=e.clientY;
      const x=(e.clientX/innerWidth-.5),y=(e.clientY/innerHeight-.5);
      g1.style.transform='translate('+(x*40)+'px,'+(y*40)+'px)';
      g2.style.transform='translate('+(x*-30)+'px,'+(y*-30)+'px)';
    });
    window.addEventListener('mouseleave',()=>{mouse.x=-9999;mouse.y=-9999;});
  }

  /* ===== 3D 뉴럴 구체 (Three.js). 성공 시 2D 폴백 대신 사용 ===== */
  function initThree(){
    if(typeof THREE==='undefined'||REDUCED) return false;
    const canvas=document.getElementById('three');
    let renderer;
    try{ renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true}); }
    catch(e){ return false; }
    canvas.style.display='block';
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
    const scene=new THREE.Scene();
    const cam=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,0.1,100);
    cam.position.z=14;

    // 구 표면에 점 분포 (피보나치 구)
    const N=2600, R=7, pos=new Float32Array(N*3);
    for(let i=0;i<N;i++){
      const y=1-(i/(N-1))*2, r=Math.sqrt(1-y*y);
      const phi=i*Math.PI*(3-Math.sqrt(5));
      pos[i*3]=Math.cos(phi)*r*R; pos[i*3+1]=y*R; pos[i*3+2]=Math.sin(phi)*r*R;
    }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    const mat=new THREE.PointsMaterial({color:0x60a5fa,size:0.06,transparent:true,opacity:0.85,sizeAttenuation:true});
    const sphere=new THREE.Points(geo,mat);
    scene.add(sphere);

    // 안쪽 와이어 코어
    const core=new THREE.Mesh(new THREE.IcosahedronGeometry(4.2,1),
      new THREE.MeshBasicMaterial({color:0x3b82f6,wireframe:true,transparent:true,opacity:0.12}));
    scene.add(core);

    // 떠다니는 미세 입자
    const M=400, p2=new Float32Array(M*3);
    for(let i=0;i<M*3;i++){const r=Math.sin(i*12.9898)*43758.5453;p2[i]=(r-Math.floor(r))*24-12;}
    const g2=new THREE.BufferGeometry();g2.setAttribute('position',new THREE.BufferAttribute(p2,3));
    const dust=new THREE.Points(g2,new THREE.PointsMaterial({color:0x7d8896,size:0.04,transparent:true,opacity:0.5}));
    scene.add(dust);

    let tx=0,ty=0;
    function resize(){renderer.setSize(innerWidth,innerHeight);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();}
    window.addEventListener('resize',resize);resize();
    window.addEventListener('mousemove',e=>{tx=(e.clientX/innerWidth-.5);ty=(e.clientY/innerHeight-.5);});

    let raf,run=true;
    function loop(){
      if(!run)return;
      sphere.rotation.y+=0.0016; sphere.rotation.x+=0.0006;
      core.rotation.y-=0.0010; core.rotation.x+=0.0008;
      dust.rotation.y+=0.0004;
      // 마우스로 카메라 살짝 기울임 (패럴랙스)
      cam.position.x+=(tx*4-cam.position.x)*0.04;
      cam.position.y+=(-ty*4-cam.position.y)*0.04;
      cam.lookAt(0,0,0);
      renderer.render(scene,cam);
      raf=requestAnimationFrame(loop);
    }
    loop();
    document.addEventListener('visibilitychange',()=>{run=!document.hidden;if(run)loop();else cancelAnimationFrame(raf);});

    // GSAP: 등장 시 구가 부풀어오름 + 카메라 줌인
    if(typeof gsap!=='undefined'){
      sphere.scale.set(0.3,0.3,0.3);
      gsap.to(sphere.scale,{x:1,y:1,z:1,duration:2.2,ease:'power3.out'});
      gsap.from(cam.position,{z:26,duration:2.4,ease:'power2.out'});
    }
    // 슬라이드별 강도 조절 핸들 노출: 표지=강, 콘텐츠=약
    window.__setBgIntensity=function(strong){
      const o1=strong?0.85:0.35, o2=strong?0.12:0.05, od=strong?0.5:0.22;
      const z =strong?14:17;
      if(typeof gsap!=='undefined'){
        gsap.to(mat,{opacity:o1,duration:.8});
        gsap.to(core.material,{opacity:o2,duration:.8});
        gsap.to(dust.material,{opacity:od,duration:.8});
        gsap.to(cam.position,{z:z,duration:.9,ease:'power2.out'});
      }else{mat.opacity=o1;core.material.opacity=o2;dust.material.opacity=od;}
    };
    return true;
  }

  const usedThree = initThree();
  if(usedThree){ document.getElementById('net').style.display='none'; }
  // CSS owns the title transition; deep links must not capture a hidden GSAP end state.

  /* ===== 뉴럴 네트워크 배경 (Canvas 2D 폴백, Three 실패 시 + 모션 허용 시만) ===== */
  if(!usedThree && !REDUCED)(function(){
    const cv=document.getElementById('net'),ctx=cv.getContext('2d');
    let W,H,DPR,nodes=[],raf;
    const COUNT=()=>Math.min(100,Math.floor(innerWidth*innerHeight/18000));
    const LINK=165, PULL=170, MAXV=.35;
    function resize(){
      DPR=Math.min(devicePixelRatio||1,2);
      W=cv.width=innerWidth*DPR;H=cv.height=innerHeight*DPR;
      cv.style.width=innerWidth+'px';cv.style.height=innerHeight+'px';
      ctx.setTransform(DPR,0,0,DPR,0,0);
      build();
    }
    function build(){
      const n=COUNT();nodes=[];
      for(let i=0;i<n;i++){
        nodes.push({
          x:Math.random()*innerWidth,y:Math.random()*innerHeight,
          vx:(Math.random()-.5)*MAXV,vy:(Math.random()-.5)*MAXV,
          r:1.2+Math.random()*1.8
        });
      }
    }
    function step(){
      ctx.clearRect(0,0,innerWidth,innerHeight);
      for(const p of nodes){
        // 마우스 인력
        const dx=mouse.x-p.x,dy=mouse.y-p.y,d=Math.hypot(dx,dy);
        if(d<PULL&&d>0){const f=(1-d/PULL)*0.6;p.vx+=dx/d*f*0.08;p.vy+=dy/d*f*0.08;}
        p.x+=p.vx;p.y+=p.vy;
        p.vx*=0.99;p.vy*=0.99;
        // 속도 한계 복원
        const sp=Math.hypot(p.vx,p.vy);if(sp>MAXV*2){p.vx*=MAXV*2/sp;p.vy*=MAXV*2/sp;}
        if(p.x<0||p.x>innerWidth)p.vx*=-1;
        if(p.y<0||p.y>innerHeight)p.vy*=-1;
        p.x=Math.max(0,Math.min(innerWidth,p.x));p.y=Math.max(0,Math.min(innerHeight,p.y));
      }
      // 연결선
      for(let i=0;i<nodes.length;i++){
        for(let j=i+1;j<nodes.length;j++){
          const a=nodes[i],b=nodes[j],dx=a.x-b.x,dy=a.y-b.y,d=Math.hypot(dx,dy);
          if(d<LINK){
            const o=(1-d/LINK);
            // 마우스 근처 연결선 강조
            const mm=Math.min(Math.hypot(mouse.x-a.x,mouse.y-a.y),Math.hypot(mouse.x-b.x,mouse.y-b.y));
            const boost=mm<PULL?(1-mm/PULL)*0.6:0;
            ctx.strokeStyle='rgba(96,165,250,'+(o*0.32+boost)+')';
            ctx.lineWidth=0.7+boost;
            ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
          }
        }
      }
      // 노드
      for(const p of nodes){
        const dm=Math.hypot(mouse.x-p.x,mouse.y-p.y);
        const near=dm<PULL;
        ctx.fillStyle=near?'rgba(96,165,250,'+(0.9-dm/PULL*0.6)+')':'rgba(125,136,150,0.55)';
        ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,7);ctx.fill();
        if(near){
          ctx.fillStyle='rgba(59,130,246,'+(1-dm/PULL)*0.15+')';
          ctx.beginPath();ctx.arc(p.x,p.y,p.r*4,0,7);ctx.fill();
        }
      }
      raf=requestAnimationFrame(step);
    }
    let rt;window.addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(resize,200);});
    resize();step();
    // 탭 비활성 시 정지(배터리 절약)
    document.addEventListener('visibilitychange',()=>{
      if(document.hidden){cancelAnimationFrame(raf);}else{step();}
    });
  })();

  // 슬래시 커맨드 '더보기' 토글
  window.__setBgIntensity?.(cur===0);
  }
  if(document.readyState==='complete')startGraphics();
  else window.addEventListener('load',startGraphics,{once:true});

  (function(){
    const btn=document.getElementById('moreBtn');
    if(!btn)return;
    const panel=btn.closest('.codepanel');
    const label=btn.querySelector('.more-label');
    btn.setAttribute('aria-expanded','false');
    function toggle(){
      const open=panel.classList.toggle('open');
      btn.setAttribute('aria-expanded',String(open));
      label.textContent=open?'접기':'… + 13 more';
    }
    btn.addEventListener('click',toggle);
    btn.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle();}});
  })();

  // 50단계 모달 (목록 + 상세 2단계, ←→ 단계 이동)
  (function(){
    const arrow=document.getElementById('stepArrow');
    const modal=document.getElementById('stepModal');
    const list=document.getElementById('stepList');
    const detail=document.getElementById('stepDetail');
    if(!arrow||!modal||!list||!detail)return;
    const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const md=body=>{
      if(typeof marked!=='undefined'){try{return '<div class="md">'+marked.parse(body)+'</div>';}catch{}}
      return '<div class="step-raw">'+esc(body)+'</div>';
    };
    const data=()=>window.STEPS_FULL||STEPS.map(([n,t])=>[n,t,'']);
    const dNo=document.getElementById('dNo'),dTitle=document.getElementById('dTitle'),dBody=document.getElementById('dBody');
    const dPrev=document.getElementById('dPrev'),dNext=document.getElementById('dNext');
    const dClose=detail.querySelector('button[data-dclose]');
    const background=[...document.querySelectorAll('#deck,.site-header,#dots,.nav,.hint,.skip-link')];
    let lastFocus=null,detailFocus=null,current=0,mode='step',curCmd=0;
    const dHint=detail.querySelector('.d-hint');
    const CMD_LIST=[...document.querySelectorAll('#s5 .cmd-row.clickable')].map(row=>row.dataset.cmd);
    const focusables=dialog=>[...dialog.querySelectorAll('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])')]
      .filter(el=>!el.disabled&&!el.closest('[inert]')&&el.getClientRects().length);
    function syncDialogs(){
      const detailOpen=detail.classList.contains('open');
      const listOpen=modal.classList.contains('open');
      modal.inert=detailOpen||!listOpen;
      modal.setAttribute('aria-hidden',String(detailOpen||!listOpen));
      detail.inert=!detailOpen;
      detail.setAttribute('aria-hidden',String(!detailOpen));
      background.forEach(el=>{el.inert=listOpen||detailOpen;});
    }
    modal.tabIndex=-1;detail.tabIndex=-1;
    syncDialogs();
    function enterDetail(){
      const wasOpen=detail.classList.contains('open');
      if(!wasOpen)detailFocus=document.activeElement;
      detail.classList.add('open');
      syncDialogs();
      if(!wasOpen||document.activeElement.disabled)dClose.focus();
    }
    function closeDetail(){
      if(!detail.classList.contains('open'))return;
      detail.classList.remove('open');
      syncDialogs();
      if(detailFocus?.isConnected&&!detailFocus.closest('[inert]'))detailFocus.focus({preventScroll:true});
    }
    function showDetail(idx){
      mode='step';
      const steps=data();
      current=Math.max(0,Math.min(steps.length-1,idx));
      const [n,title,body]=steps[current];
      dNo.textContent=String(n).padStart(3,'0');
      dTitle.textContent=title;
      dBody.innerHTML=md(body||'(본문 없음)');dBody.scrollTop=0;
      dPrev.disabled=current===0;dNext.disabled=current===steps.length-1;
      dPrev.setAttribute('aria-label','이전 단계');dNext.setAttribute('aria-label','다음 단계');
      dHint.textContent='← → 로 단계 이동 · Esc 닫기';
      enterDetail();
    }
    function showCmd(idx){
      if(!CMD_LIST.length)return;
      mode='cmd';curCmd=(idx+CMD_LIST.length)%CMD_LIST.length;
      const cmd=CMD_LIST[curCmd];
      dNo.textContent='/';dTitle.textContent='/'+cmd;
      dBody.innerHTML=md(window.CMDS_FULL?.[cmd]||'(본문 없음)');dBody.scrollTop=0;
      dPrev.disabled=false;dNext.disabled=false;
      dPrev.setAttribute('aria-label','이전 커맨드');dNext.setAttribute('aria-label','다음 커맨드');
      dHint.textContent='← → 로 커맨드 이동 · Esc 닫기';
      enterDetail();
    }
    function navigateDetail(delta){mode==='cmd'?showCmd(curCmd+delta):showDetail(current+delta);}
    dPrev.addEventListener('click',()=>navigateDetail(-1));
    dNext.addEventListener('click',()=>navigateDetail(1));
    detail.querySelectorAll('[data-dclose]').forEach(el=>el.addEventListener('click',closeDetail));
    document.querySelectorAll('#s5 .cmd-row.clickable').forEach((row,i)=>{
      const trigger=row.querySelector('.f');
      trigger.setAttribute('role','button');trigger.tabIndex=0;
      trigger.addEventListener('click',()=>showCmd(i));
      trigger.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();showCmd(i);}});
    });
    let renderedData=null;
    function renderList(){
      const steps=data();
      if(renderedData===steps)return;
      renderedData=steps;
      list.innerHTML=steps.map(([n,title],index)=>
        '<div class="step-item" data-n="'+n+'"><div class="step-row" role="button" tabindex="0" data-idx="'+index+'">'+
        '<span class="no">'+String(n).padStart(3,'0')+'</span><span class="ti">'+esc(title)+'</span><span class="caret" aria-hidden="true">›</span></div></div>').join('');
      list.querySelectorAll('.step-row').forEach(row=>{
        const open=()=>showDetail(+row.dataset.idx);
        row.addEventListener('click',open);
        row.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});
      });
    }
    function openList(){
      renderList();lastFocus=document.activeElement;
      modal.classList.add('open');list.scrollTop=0;syncDialogs();
      modal.querySelector('.modal-close').focus();
    }
    function closeList(){
      if(!modal.classList.contains('open'))return;
      closeDetail();modal.classList.remove('open');syncDialogs();
      if(lastFocus?.isConnected&&!lastFocus.closest('[inert]'))lastFocus.focus({preventScroll:true});
    }
    closeAllDialogs=()=>{closeDetail();closeList();};
    arrow.addEventListener('click',openList);
    arrow.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openList();}});
    modal.querySelectorAll('[data-close]').forEach(el=>el.addEventListener('click',closeList));
    window.addEventListener('keydown',e=>{
      const dialog=activeDialog();
      if(!dialog)return;
      if(e.key==='Tab'){
        const items=focusables(dialog),first=items[0],last=items.at(-1);
        if(!first){e.preventDefault();dialog.focus();}
        else if(e.shiftKey&&(document.activeElement===first||!dialog.contains(document.activeElement))){e.preventDefault();last.focus();}
        else if(!e.shiftKey&&(document.activeElement===last||!dialog.contains(document.activeElement))){e.preventDefault();first.focus();}
      }else if(e.key==='Escape'){
        e.preventDefault();dialog===detail?closeDetail():closeList();
      }else if(dialog===detail&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!e.target.matches('input,textarea,select,[contenteditable="true"]')){
        if(e.key==='ArrowRight'){e.preventDefault();navigateDetail(1);}
        if(e.key==='ArrowLeft'){e.preventDefault();navigateDetail(-1);}
      }
    });
    document.addEventListener('focusin',e=>{
      const dialog=activeDialog();
      if(dialog&&!dialog.contains(e.target))(focusables(dialog)[0]||dialog).focus();
    });
  })();

  document.documentElement.classList.add('js');
  fromHash();
  document.getElementById('loader')?.remove();
}

if(document.getElementById('deck'))initPortfolio();
else document.addEventListener('DOMContentLoaded',initPortfolio,{once:true});
