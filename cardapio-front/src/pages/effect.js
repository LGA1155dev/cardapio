/* ============================================================
   effects.js — Efeitos visuais JavaScript
   Importado em Refeicoes.jsx:  import * as FX from "./effects"
   ============================================================ */

/* ── 1. CURSOR MAGNÉTICO ─────────────────────────────────── */
export function initMagneticCursor(dotRef, ringRef) {
  let mx = -999, my = -999;
  let rx = -999, ry = -999;
  let raf = null;

  const lerp = (a, b, t) => a + (b - a) * t;

  const tick = () => {
    rx = lerp(rx === -999 ? mx : rx, mx, 0.14);
    ry = lerp(ry === -999 ? my : ry, my, 0.14);

    if (dotRef.current) {
      dotRef.current.style.transform = `translate(${mx - 6}px, ${my - 6}px)`;
    }
    if (ringRef.current) {
      ringRef.current.style.transform = `translate(${rx - 18}px, ${ry - 18}px)`;
    }
    raf = requestAnimationFrame(tick);
  };

  const onMove = (e) => { mx = e.clientX; my = e.clientY; };
  const onEnterBtn = () => {
    if (dotRef.current)  dotRef.current.classList.add("cursor-dot--hover");
    if (ringRef.current) ringRef.current.classList.add("cursor-ring--hover");
  };
  const onLeaveBtn = () => {
    if (dotRef.current)  dotRef.current.classList.remove("cursor-dot--hover");
    if (ringRef.current) ringRef.current.classList.remove("cursor-ring--hover");
  };

  window.addEventListener("mousemove", onMove);
  document.querySelectorAll("button, a, .mc, .fp").forEach((el) => {
    el.addEventListener("mouseenter", onEnterBtn);
    el.addEventListener("mouseleave", onLeaveBtn);
  });

  raf = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("mousemove", onMove);
  };
}

/* ── 2. CANVAS PARTICLES LOADING ────────────────────────── */
export function drawLoadingCanvas(canvas, t) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#04080f";
  ctx.fillRect(0, 0, W, H);

  const COLS = 30, ROWS = 20;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const phase  = ((r * COLS + c) / (ROWS * COLS)) * Math.PI * 8;
      const wave   = Math.sin(t * 0.04 + phase) * 0.5 + 0.5;
      const dist   = Math.hypot((c / (COLS - 1)) * W - W / 2, (r / (ROWS - 1)) * H - H / 2) / Math.hypot(W / 2, H / 2);
      const ripple = Math.sin(t * 0.065 - dist * 9) * 0.5 + 0.5;
      const alpha  = wave * 0.25 + ripple * 0.2;
      const size   = 1.2 + ripple * 2.2;

      ctx.beginPath();
      ctx.arc(
        (c / (COLS - 1)) * W,
        (r / (ROWS - 1)) * H,
        size, 0, Math.PI * 2
      );
      ctx.fillStyle = `rgba(96,165,250,${alpha})`;
      ctx.fill();
    }
  }

  /* central pulse rings */
  for (let i = 0; i < 3; i++) {
    const R = 55 + i * 30 + Math.sin(t * 0.04 + i * 1.2) * 10;
    const alpha = 0.3 - i * 0.08 + Math.sin(t * 0.04 + i) * 0.05;
    const g = ctx.createRadialGradient(W / 2, H / 2, R * 0.2, W / 2, H / 2, R);
    g.addColorStop(0, "rgba(59,130,246,0)");
    g.addColorStop(0.7, `rgba(59,130,246,${alpha * 0.5})`);
    g.addColorStop(1, `rgba(96,165,250,${alpha})`);
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, R, 0, Math.PI * 2);
    ctx.strokeStyle = g;
    ctx.lineWidth = 1.5 - i * 0.3;
    ctx.stroke();
  }
}

/* ── 3. PARTICLE SPHERE (intro) ─────────────────────────── */
export function createParticleSphere(N = 1800) {
  const particles = [];
  for (let i = 0; i < N; i++) {
    const phi   = Math.acos(1 - (2 * (i + 0.5)) / N);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    const r     = 0.85 + Math.random() * 0.3;
    particles.push({
      bx:     Math.sin(phi) * Math.cos(theta) * r,
      by:     Math.cos(phi) * r,
      bz:     Math.sin(phi) * Math.sin(theta) * r,
      ox: 0, oy: 0,
      size:   1.1 + Math.random() * 2.4,
      speed:  0.00025 + Math.random() * 0.0006,
      offset: Math.random() * Math.PI * 2,
      hShift: Math.random() * 30 - 15,
    });
  }
  return particles;
}

export function drawSphere(canvas, particles, t, scroll, mx, my) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;

  ctx.clearRect(0, 0, W, H);

  const bgG = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7);
  bgG.addColorStop(0, "#070e20");
  bgG.addColorStop(0.5, "#040812");
  bgG.addColorStop(1, "#020508");
  ctx.fillStyle = bgG;
  ctx.fillRect(0, 0, W, H);

  const scrollPct  = Math.min(scroll / (H * 1.5), 1);
  const scale      = 170 + scrollPct * (Math.max(W, H) * 1.5 - 170);
  const cx = W / 2, cy = H / 2;
  const mdist      = Math.hypot(mx - cx, my - cy);
  const mInfluence = Math.max(0, 1 - mdist / 350);

  particles.forEach((p) => {
    const angle = t * p.speed + p.offset;
    const cosA = Math.cos(angle), sinA = Math.sin(angle);

    /* Y-axis rotation */
    const rx = p.bx * cosA - p.bz * sinA;
    const rz = p.bx * sinA + p.bz * cosA;
    const ry = p.by;

    const z  = rz * 0.3 + 1.3;
    const px = cx + (rx * scale) / z;
    const py = cy + (ry * scale) / z;

    /* mouse repulsion */
    const dfm  = Math.hypot(px - mx, py - my);
    const dStr = Math.max(0, 1 - dfm / 200) * 60 * mInfluence;
    const ang2 = Math.atan2(py - my, px - mx);
    p.ox += (Math.cos(ang2) * dStr - p.ox) * 0.1;
    p.oy += (Math.sin(ang2) * dStr - p.oy) * 0.1;

    const depthA = (rz + 1) / 2;
    const alpha  = (0.3 + depthA * 0.7) * (1 - scrollPct * 0.55);
    const hue    = 205 + depthA * 25 + p.hShift;
    const sat    = 75 + depthA * 25;
    const lgt    = 48 + depthA * 42;

    ctx.beginPath();
    ctx.arc(
      px + p.ox,
      py + p.oy,
      (p.size * (0.55 + depthA * 0.9)) / z,
      0, Math.PI * 2
    );
    ctx.fillStyle = `hsla(${hue},${sat}%,${lgt}%,${alpha})`;
    ctx.fill();
  });

  /* inner glow */
  const ig = ctx.createRadialGradient(cx, cy, 0, cx, cy, scale * 0.48);
  ig.addColorStop(0, `rgba(96,165,250,${0.07 + scrollPct * 0.09})`);
  ig.addColorStop(0.6, "rgba(59,130,246,0.025)");
  ig.addColorStop(1, "transparent");
  ctx.fillStyle = ig;
  ctx.fillRect(0, 0, W, H);

  /* outer halo rings */
  for (let i = 0; i < 2; i++) {
    const phase = i * 0.5;
    ctx.beginPath();
    ctx.arc(cx, cy, scale * (0.97 + i * 0.04), 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(96,165,250,${(0.14 + Math.sin(t * 0.02 + phase) * 0.07) * (1 - scrollPct)})`;
    ctx.lineWidth = 1.2 - i * 0.4;
    ctx.stroke();
  }

  /* nebula wisps */
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + t * 0.005;
    const wx = cx + Math.cos(angle) * scale * 0.7;
    const wy = cy + Math.sin(angle) * scale * 0.35;
    const wg = ctx.createRadialGradient(wx, wy, 0, wx, wy, scale * 0.28);
    wg.addColorStop(0, `rgba(99,102,241,${0.06 * (1 - scrollPct)})`);
    wg.addColorStop(1, "transparent");
    ctx.fillStyle = wg;
    ctx.fillRect(0, 0, W, H);
  }
}

/* ── 4. SCROLL REVEAL (IntersectionObserver) ─────────────── */
export function initScrollReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("sr--visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  const targets = document.querySelectorAll(".sr");
  targets.forEach((el) => observer.observe(el));

  return () => observer.disconnect();
}

/* ── 5. PARALLAX ON HERO ─────────────────────────────────── */
export function initHeroParallax(forkRef, eyebrowRef, h1Ref) {
  const onScroll = () => {
    const y = window.scrollY;
    const pct = Math.min(y / window.innerHeight, 1);

    if (forkRef.current)
      forkRef.current.style.transform = `translateY(${y * 0.22}px) rotate(${-2 + pct * 6}deg)`;
    if (eyebrowRef.current)
      eyebrowRef.current.style.transform = `translateY(${y * 0.08}px)`;
    if (h1Ref.current)
      h1Ref.current.style.transform = `translateY(${y * 0.12}px)`;
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
}

/* ── 6. TILT 3D on card ──────────────────────────────────── */
export function getTiltTransform(hov, tilt) {
  if (!hov) return "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)";
  return `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(-12px) scale(1.03)`;
}

export function calcTilt(e, el) {
  const rect = el.getBoundingClientRect();
  const cx   = rect.left + rect.width  / 2;
  const cy   = rect.top  + rect.height / 2;
  return {
    x: ((e.clientY - cy) / (rect.height / 2)) * -11,
    y: ((e.clientX - cx) / (rect.width  / 2)) *  11,
  };
}

/* ── 7. RIPPLE CLICK ─────────────────────────────────────── */
export function createRipple(e, containerEl) {
  const rect   = containerEl.getBoundingClientRect();
  const size   = Math.max(rect.width, rect.height) * 2;
  const x      = e.clientX - rect.left - size / 2;
  const y      = e.clientY - rect.top  - size / 2;

  const ripple = document.createElement("span");
  ripple.className = "ripple-burst";
  ripple.style.cssText = `
    position:absolute;
    width:${size}px; height:${size}px;
    left:${x}px; top:${y}px;
    border-radius:50%;
    background:rgba(96,165,250,0.18);
    transform:scale(0);
    animation:ripple-burst .6s ease-out forwards;
    pointer-events:none;
    z-index:0;
  `;
  containerEl.style.position = "relative";
  containerEl.style.overflow = "hidden";
  containerEl.appendChild(ripple);
  setTimeout(() => ripple.remove(), 650);
}

/* ── 8. TYPING EFFECT ────────────────────────────────────── */
export function typeText(el, text, speed = 55) {
  let i = 0;
  el.textContent = "";
  const iv = setInterval(() => {
    el.textContent += text[i++];
    if (i >= text.length) clearInterval(iv);
  }, speed);
  return () => clearInterval(iv);
}

/* ── 9. GLITCH TEXT EFFECT ───────────────────────────────── */
export function startGlitch(el) {
  const original = el.textContent;
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%";
  let frame = 0;
  let raf;

  const tick = () => {
    frame++;
    if (frame > 14) {
      el.textContent = original;
      return;
    }
    el.textContent = original
      .split("")
      .map((ch, i) =>
        i < frame * 2 ? ch : chars[Math.floor(Math.random() * chars.length)]
      )
      .join("");
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

/* ── 10. NAV INDICATOR UNDERLINE ─────────────────────────── */
export function animateNavUnderline(linkEl, container) {
  const indicator = container.querySelector(".nav__indicator");
  if (!indicator || !linkEl) return;
  const rect     = linkEl.getBoundingClientRect();
  const parentR  = container.getBoundingClientRect();
  indicator.style.width = `${rect.width}px`;
  indicator.style.left  = `${rect.left - parentR.left}px`;
  indicator.style.opacity = "1";
}

/* ── 11. SECTION COUNTER ANIMATE ─────────────────────────── */
export function animateCounter(el, target, duration = 1400) {
  const start  = performance.now();
  const update = (now) => {
    const t = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 4);
    el.textContent = Math.round(ease * target);
    if (t < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

/* ── 12. FLOATING LABELS for filter pills ────────────────── */
export function floatIn(els, stagger = 55) {
  els.forEach((el, i) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(12px)";
    setTimeout(() => {
      el.style.transition = "opacity .35s ease, transform .35s ease";
      el.style.opacity    = "1";
      el.style.transform  = "translateY(0)";
    }, i * stagger);
  });
}

/* ── 13. SPARKLE on hover ────────────────────────────────── */
export function spawnSparkles(el, color = "#60a5fa") {
  for (let i = 0; i < 8; i++) {
    const s = document.createElement("div");
    const angle  = (i / 8) * Math.PI * 2;
    const dist   = 28 + Math.random() * 22;
    const size   = 3 + Math.random() * 4;
    const rect   = el.getBoundingClientRect();

    s.style.cssText = `
      position:fixed;
      left:${rect.left + rect.width  / 2}px;
      top:${rect.top  + rect.height / 2}px;
      width:${size}px; height:${size}px;
      border-radius:50%;
      background:${color};
      box-shadow:0 0 6px ${color};
      pointer-events:none;
      z-index:9998;
      transition:none;
      animation: sparkle-out .55s ease-out ${i * 0.04}s forwards;
      --tx:${Math.cos(angle) * dist}px;
      --ty:${Math.sin(angle) * dist}px;
    `;
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 600 + i * 40);
  }
}

/* ── 14. SCROLL PROGRESS BAR ─────────────────────────────── */
export function initScrollProgress(barRef) {
  const onScroll = () => {
    const el  = document.documentElement;
    const pct = el.scrollTop / (el.scrollHeight - el.clientHeight);
    if (barRef.current)
      barRef.current.style.transform = `scaleX(${pct})`;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
}

/* ── 15. AURORA BACKGROUND ───────────────────────────────── */
export function drawAurora(canvas, t) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const blobs = [
    { x: 0.2, y: 0.4, r: 0.45, hue: 220, speed: 0.0008 },
    { x: 0.75, y: 0.5, r: 0.38, hue: 260, speed: 0.0011 },
    { x: 0.5, y: 0.8, r: 0.35, hue: 190, speed: 0.0009 },
  ];

  blobs.forEach((b) => {
    const x   = W * (b.x + Math.sin(t * b.speed) * 0.15);
    const y   = H * (b.y + Math.cos(t * b.speed * 1.3) * 0.1);
    const rad = Math.min(W, H) * b.r;
    const g   = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, `hsla(${b.hue},80%,55%,0.07)`);
    g.addColorStop(0.5, `hsla(${b.hue},70%,45%,0.035)`);
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  });
}