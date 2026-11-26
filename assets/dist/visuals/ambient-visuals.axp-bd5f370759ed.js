export class AmbientVisuals {
  constructor({ root = document, reducedMotion = false } = {}) {
    this.root = root;
    this.reducedMotion = reducedMotion;
    this.abort = new AbortController();
    this.setIntensityFn = null;
    this.rafId = null;
    this.resizeTimer = null;
  }

  start(initialStrong = true) {
    const glow1 = this.root.getElementById('glow1');
    const glow2 = this.root.getElementById('glow2');
    const mouse = { x: -9999, y: -9999 };

    if (!this.reducedMotion && glow1 && glow2) {
      window.addEventListener('mousemove', event => {
        mouse.x = event.clientX;
        mouse.y = event.clientY;
        const x = event.clientX / innerWidth - 0.5;
        const y = event.clientY / innerHeight - 0.5;
        glow1.style.transform = `translate(${x * 40}px, ${y * 40}px)`;
        glow2.style.transform = `translate(${x * -30}px, ${y * -30}px)`;
      }, { signal: this.abort.signal });
      window.addEventListener('mouseleave', () => {
        mouse.x = -9999;
        mouse.y = -9999;
      }, { signal: this.abort.signal });
    }

    const usedThree = this._initThree();
    const netCanvas = this.root.getElementById('net');
    if (usedThree && netCanvas) {
      netCanvas.style.display = 'none';
    } else if (!usedThree && !this.reducedMotion && netCanvas) {
      this._initCanvasNetwork(netCanvas, mouse);
    }

    this.setIntensity(initialStrong);
  }

  setIntensity(strong) {
    if (typeof this.setIntensityFn === 'function') {
      this.setIntensityFn(Boolean(strong));
    }
  }

  _initThree() {
    if (typeof globalThis.THREE === 'undefined' || this.reducedMotion) return false;
    const canvas = this.root.getElementById('three');
    if (!canvas) return false;
    let renderer;
    try {
      renderer = new globalThis.THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    } catch {
      return false;
    }
    const THREE = globalThis.THREE;
    canvas.style.display = 'block';
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
    cam.position.z = 14;

    const N = 2600;
    const R = 7;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const phi = i * Math.PI * (3 - Math.sqrt(5));
      pos[i * 3] = Math.cos(phi) * r * R;
      pos[i * 3 + 1] = y * R;
      pos[i * 3 + 2] = Math.sin(phi) * r * R;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: 0x60a5fa, size: 0.06, transparent: true, opacity: 0.85, sizeAttenuation: true });
    const sphere = new THREE.Points(geo, mat);
    scene.add(sphere);

    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(4.2, 1),
      new THREE.MeshBasicMaterial({ color: 0x3b82f6, wireframe: true, transparent: true, opacity: 0.12 }),
    );
    scene.add(core);

    const M = 400;
    const p2 = new Float32Array(M * 3);
    for (let i = 0; i < M * 3; i++) {
      const r = Math.sin(i * 12.9898) * 43758.5453;
      p2[i] = (r - Math.floor(r)) * 24 - 12;
    }
    const g2 = new THREE.BufferGeometry();
    g2.setAttribute('position', new THREE.BufferAttribute(p2, 3));
    const dust = new THREE.Points(g2, new THREE.PointsMaterial({ color: 0x7d8896, size: 0.04, transparent: true, opacity: 0.5 }));
    scene.add(dust);

    let tx = 0;
    let ty = 0;
    const resize = () => {
      renderer.setSize(innerWidth, innerHeight);
      cam.aspect = innerWidth / innerHeight;
      cam.updateProjectionMatrix();
    };
    window.addEventListener('resize', resize, { signal: this.abort.signal });
    resize();
    window.addEventListener('mousemove', event => {
      tx = event.clientX / innerWidth - 0.5;
      ty = event.clientY / innerHeight - 0.5;
    }, { signal: this.abort.signal });

    let running = true;
    const loop = () => {
      if (!running || this.abort.signal.aborted) return;
      sphere.rotation.y += 0.0016;
      sphere.rotation.x += 0.0006;
      core.rotation.y -= 0.001;
      core.rotation.x += 0.0008;
      dust.rotation.y += 0.0004;
      cam.position.x += (tx * 4 - cam.position.x) * 0.04;
      cam.position.y += (-ty * 4 - cam.position.y) * 0.04;
      cam.lookAt(0, 0, 0);
      renderer.render(scene, cam);
      this.rafId = requestAnimationFrame(loop);
    };
    loop();

    this.root.addEventListener('visibilitychange', () => {
      running = !this.root.hidden;
      if (running) loop();
      else if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    }, { signal: this.abort.signal });

    const gsap = globalThis.gsap;
    if (typeof gsap !== 'undefined') {
      sphere.scale.set(0.3, 0.3, 0.3);
      gsap.to(sphere.scale, { x: 1, y: 1, z: 1, duration: 2.2, ease: 'power3.out' });
      gsap.from(cam.position, { z: 26, duration: 2.4, ease: 'power2.out' });
    }

    this.setIntensityFn = strong => {
      const o1 = strong ? 0.85 : 0.35;
      const o2 = strong ? 0.12 : 0.05;
      const od = strong ? 0.5 : 0.22;
      const z = strong ? 14 : 17;
      if (typeof globalThis.gsap !== 'undefined') {
        globalThis.gsap.to(mat, { opacity: o1, duration: 0.8 });
        globalThis.gsap.to(core.material, { opacity: o2, duration: 0.8 });
        globalThis.gsap.to(dust.material, { opacity: od, duration: 0.8 });
        globalThis.gsap.to(cam.position, { z, duration: 0.9, ease: 'power2.out' });
      } else {
        mat.opacity = o1;
        core.material.opacity = o2;
        dust.material.opacity = od;
      }
    };
    return true;
  }

  _initCanvasNetwork(canvas, mouse) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let nodes = [];
    const LINK = 165;
    const PULL = 170;
    const MAXV = 0.35;
    const countNodes = () => Math.min(100, Math.floor((innerWidth * innerHeight) / 18000));

    const build = () => {
      const n = countNodes();
      nodes = [];
      for (let i = 0; i < n; i++) {
        nodes.push({
          x: Math.random() * innerWidth,
          y: Math.random() * innerHeight,
          vx: (Math.random() - 0.5) * MAXV,
          vy: (Math.random() - 0.5) * MAXV,
          r: 1.2 + Math.random() * 1.8,
        });
      }
    };

    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = innerWidth * dpr;
      canvas.height = innerHeight * dpr;
      canvas.style.width = `${innerWidth}px`;
      canvas.style.height = `${innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    };

    const step = () => {
      if (this.abort.signal.aborted) return;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (const p of nodes) {
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const d = Math.hypot(dx, dy);
        if (d < PULL && d > 0) {
          const f = (1 - d / PULL) * 0.6;
          p.vx += (dx / d) * f * 0.08;
          p.vy += (dy / d) * f * 0.08;
        }
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.99;
        p.vy *= 0.99;
        const sp = Math.hypot(p.vx, p.vy);
        if (sp > MAXV * 2) {
          p.vx *= (MAXV * 2) / sp;
          p.vy *= (MAXV * 2) / sp;
        }
        if (p.x < 0 || p.x > innerWidth) p.vx *= -1;
        if (p.y < 0 || p.y > innerHeight) p.vy *= -1;
        p.x = Math.max(0, Math.min(innerWidth, p.x));
        p.y = Math.max(0, Math.min(innerHeight, p.y));
      }
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < LINK) {
            const o = 1 - d / LINK;
            const mm = Math.min(Math.hypot(mouse.x - a.x, mouse.y - a.y), Math.hypot(mouse.x - b.x, mouse.y - b.y));
            const boost = mm < PULL ? (1 - mm / PULL) * 0.6 : 0;
            ctx.strokeStyle = `rgba(96,165,250,${o * 0.32 + boost})`;
            ctx.lineWidth = 0.7 + boost;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      for (const p of nodes) {
        const dm = Math.hypot(mouse.x - p.x, mouse.y - p.y);
        const near = dm < PULL;
        ctx.fillStyle = near ? `rgba(96,165,250,${0.9 - (dm / PULL) * 0.6})` : 'rgba(125,136,150,0.55)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 7);
        ctx.fill();
        if (near) {
          ctx.fillStyle = `rgba(59,130,246,${(1 - dm / PULL) * 0.15})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 4, 0, 7);
          ctx.fill();
        }
      }
      this.rafId = requestAnimationFrame(step);
    };

    window.addEventListener('resize', () => {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(resize, 200);
    }, { signal: this.abort.signal });
    resize();
    step();
    this.root.addEventListener('visibilitychange', () => {
      if (this.root.hidden) {
        if (this.rafId !== null) cancelAnimationFrame(this.rafId);
      } else {
        step();
      }
    }, { signal: this.abort.signal });
  }

  dispose() {
    this.abort.abort();
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    if (this.resizeTimer !== null) clearTimeout(this.resizeTimer);
  }
}
