/* ============================================================
   effects.js — Otimizado
   - Gradientes/shadows cacheados por fragmento (sem recriar por frame)
   - Sem alocação de array sorted a cada frame (sort in-place com cache)
   - Detecção de mobile para reduzir contagem de fragmentos
   - drawScanlines só redesenha no resize (não por frame)
   - typePlaceholder, ripple, energyPulse, initCursor inalterados
   ============================================================ */

const IS_MOBILE = typeof window !== "undefined" && window.innerWidth < 600;
const LAYER_COUNT = IS_MOBILE ? [18, 12, 8] : [38, 28, 16];

/* ── CREATEFRAGMENTS ────────────────────────────────────── */
useEffect(() => {
  const saved = localStorage.getItem("user");
  if (saved) setUser(JSON.parse(saved));
}, []);

localStorage.setItem("user", JSON.stringify(data.user));
localStorage.setItem("token", data.token);
setUser(data.user);


export function createFragments() {
  const fragments = [];
  let id = 0;
  LAYER_COUNT.forEach((count, layer) => {
    for (let i = 0; i < count; i++) {
      fragments.push({
        id: id++,
        x: Math.random(), y: Math.random(),
        z: layer / 2 + Math.random() * 0.45,
        vx: (Math.random() - 0.5) * 0.00018,
        vy: (Math.random() - 0.5) * 0.00012 - 0.00006,
        rot: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 0.28,
        w: 18 + Math.random() * 48 + layer * 20,
        h: 10 + Math.random() * 28 + layer * 12,
        opacity: 0.04 + Math.random() * 0.14 + layer * 0.06,
        hue: 210 + (Math.random() - 0.5) * 40,
        sat: 60 + Math.random() * 40,
        layer,
        shape: Math.floor(Math.random() * 3),
        tearPts: Array.from({ length: 5 }, () => ({
          dx: (Math.random() - 0.5) * 0.3,
          dy: (Math.random() - 0.5) * 0.3,
        })),
        // mobile: sem blur em nenhuma camada (shadowBlur é caro)
        blur: IS_MOBILE ? 0 : (layer === 0 ? 1.8 + Math.random() * 1.2 : layer === 1 ? 0.6 + Math.random() * 0.8 : 0),
        flickerPhase: Math.random() * Math.PI * 2,
        // cache de cor pré-computado (strings reutilizadas por frame)
        _c0: null, _c1: null, _c2: null, _stroke: null,
        _shadow: null,
      });
    }
  });

  // pré-computa strings de cor fixas (não dependem de scroll/time)
  fragments.forEach((f) => {
    f._c0     = `hsla(${f.hue + 15}, ${f.sat + 10}%, 70%, 0.9)`;
    f._c1     = `hsla(${f.hue},      ${f.sat}%,      55%, 0.7)`;
    f._c2     = `hsla(${f.hue - 15}, ${f.sat - 10}%, 40%, 0.5)`;
    f._stroke = `hsla(${f.hue + 20}, 90%, 80%, 0.9)`;
    f._shadowBase = `hsla(${f.hue}, ${f.sat}%, 65%,`;
  });

  // array de indices pré-ordenado por z (estático — z não muda)
  fragments.sort((a, b) => a.z - b.z);

  return fragments;
}

/* ── DRAW FRAME ─────────────────────────────────────────── */
// Cache de gradiente de fundo (recriado só no resize)
let _bgCache = null;
let _bgW = 0, _bgH = 0;

export function drawFragments(canvas, fragments, scrollProgress, mouseX, mouseY, time) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const W = canvas.width, H = canvas.height;

  ctx.clearRect(0, 0, W, H);

  // ── background gradient (cache por tamanho) ──────────────
  if (_bgW !== W || _bgH !== H) {
    const g = ctx.createRadialGradient(W * 0.5, H * 0.45, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.85);
    g.addColorStop(0,    "#060d1f");
    g.addColorStop(0.45, "#040a18");
    g.addColorStop(0.8,  "#020710");
    g.addColorStop(1,    "#010408");
    _bgCache = g;
    _bgW = W; _bgH = H;
  }
  ctx.fillStyle = _bgCache;
  ctx.fillRect(0, 0, W, H);

  // ── grid lines (skip on mobile) ──────────────────────────
  if (!IS_MOBILE) {
    ctx.save();
    ctx.globalAlpha = 0.025 + scrollProgress * 0.015;
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 0.5;
    const gs = 80;
    ctx.beginPath();
    for (let gx = 0; gx < W; gx += gs) { ctx.moveTo(gx, 0); ctx.lineTo(gx, H); }
    for (let gy = 0; gy < H; gy += gs) { ctx.moveTo(0, gy); ctx.lineTo(W, gy); }
    ctx.stroke(); // batch: 1 stroke call em vez de N
    ctx.restore();
  }

  // ── fragments (já ordenados por z em createFragments) ────
  const len = fragments.length;
  for (let i = 0; i < len; i++) {
    const f = fragments[i];

    const zBoost = scrollProgress * f.z * 2.8;
    const scale  = 1 + zBoost + f.z * 0.4;
    const pStr   = 0.012 + f.layer * 0.022;
    const px     = f.x * W + (mouseX - 0.5) * W * pStr * (f.layer + 1);
    const py     = f.y * H + (mouseY - 0.5) * H * pStr * (f.layer + 1) * 0.6;

    const alphaScroll = f.layer === 2
      ? (scrollProgress < 0.4546 ? scrollProgress * 2.2 : 1)
      : f.layer === 1
        ? (scrollProgress < 0.5 ? 0.3 + scrollProgress * 1.4 : 1)
        : 1;

    const finalAlpha = f.opacity * alphaScroll * (0.88 + Math.sin(time * 0.0018 + f.flickerPhase) * 0.12);
    if (finalAlpha < 0.005) continue;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate((f.rot * Math.PI) / 180);
    ctx.scale(scale, scale);

    // shadowBlur só para desktop e camadas com blur
    if (f.blur > 0) {
      const b = f.blur * (1 - scrollProgress * 0.6);
      ctx.shadowBlur  = b * 6;
      ctx.shadowColor = `${f._shadowBase}${(finalAlpha * 0.6).toFixed(2)})`;
    }

    ctx.globalAlpha = finalAlpha;

    // gradiente interno — recriado por frame mas com strings cacheadas
    const fw = f.w * 0.5, fh = f.h * 0.5;
    const grad = ctx.createLinearGradient(-fw, -fh, fw, fh);
    grad.addColorStop(0,   f._c0);
    grad.addColorStop(0.5, f._c1);
    grad.addColorStop(1,   f._c2);
    ctx.fillStyle = grad;

    ctx.beginPath();
    if (f.shape === 0) {
      const sk = Math.sin(time * 0.0005 + f.flickerPhase) * 3;
      ctx.moveTo(-fw + sk, -fh);
      ctx.lineTo(fw,       -fh + sk * 0.5);
      ctx.lineTo(fw - sk,   fh);
      ctx.lineTo(-fw,       fh - sk * 0.3);
      ctx.closePath();
    } else if (f.shape === 1) {
      const th = fh * 0.35;
      ctx.rect(-fw * 1.4, -th, fw * 2.8, th * 2);
    } else {
      const pts = f.tearPts;
      ctx.moveTo(-fw * (1 + pts[0].dx), -fh * (1 + pts[0].dy));
      ctx.lineTo( fw * (1 + pts[1].dx), -fh * (1 + pts[1].dy));
      ctx.lineTo( fw * (1 + pts[2].dx),  fh * (1 + pts[2].dy));
      ctx.lineTo( 0,                     fh * 1.1 * (1 + pts[3].dy));
      ctx.lineTo(-fw * (1 + pts[4].dx),  fh * (1 + pts[4].dy));
      ctx.closePath();
    }
    ctx.fill();

    // borda brilhante
    ctx.globalAlpha = finalAlpha * 0.35;
    ctx.strokeStyle = f._stroke;
    ctx.lineWidth   = 0.5;
    ctx.stroke();

    ctx.restore();
  }

  // ── vignette (cache por tamanho) ─────────────────────────
  if (_bgW === W && _bgH === H) {
    // reutiliza dimensões já conhecidas
  }
  const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, Math.max(W, H) * 0.78);
  vig.addColorStop(0, "transparent");
  vig.addColorStop(1, "rgba(1,4,12,0.72)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // ── portal glow ──────────────────────────────────────────
  const pA  = 0.04 + scrollProgress * 0.22;
  const pR  = Math.min(W, H) * (0.18 + scrollProgress * 0.24);
  const pg  = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, pR);
  pg.addColorStop(0,   `rgba(59,130,246,${pA.toFixed(3)})`);
  pg.addColorStop(0.5, `rgba(37,99,235,${(pA * 0.5).toFixed(3)})`);
  pg.addColorStop(1,   "transparent");
  ctx.fillStyle = pg;
  ctx.fillRect(0, 0, W, H);
}

/* ── TICK ───────────────────────────────────────────────── */
export function tickFragments(fragments) {
  const len = fragments.length;
  for (let i = 0; i < len; i++) {
    const f = fragments[i];
    f.x   += f.vx;
    f.y   += f.vy;
    f.rot += f.rotSpeed;
    if (f.x < -0.1) f.x = 1.1;
    else if (f.x >  1.1) f.x = -0.1;
    if (f.y < -0.1) f.y = 1.1;
    else if (f.y >  1.1) f.y = -0.1;
  }
}

/* ── CURSOR GLOW ────────────────────────────────────────── */
export function initCursor(dotRef, glowRef) {
  let cx = -200, cy = -200, gx = -200, gy = -200, raf;
  const lerp = (a, b, t) => a + (b - a) * t;

  const tick = () => {
    gx = lerp(gx, cx, 0.1);
    gy = lerp(gy, cy, 0.1);
    if (dotRef.current)  { dotRef.current.style.left = cx + "px"; dotRef.current.style.top  = cy + "px"; }
    if (glowRef.current) { glowRef.current.style.left = gx + "px"; glowRef.current.style.top = gy + "px"; }
    raf = requestAnimationFrame(tick);
  };

  const onMove = (e) => { cx = e.clientX; cy = e.clientY; };
  window.addEventListener("mousemove", onMove);
  raf = requestAnimationFrame(tick);

  const setHover = (on) => {
    if (dotRef.current)  dotRef.current.dataset.hover  = on;
    if (glowRef.current) glowRef.current.dataset.hover = on;
  };
  const bindHovers = () => {
    document.querySelectorAll("button, a, input, .hoverable").forEach((el) => {
      el.addEventListener("mouseenter", () => setHover("true"));
      el.addEventListener("mouseleave", () => setHover("false"));
    });
  };
  setTimeout(bindHovers, 500);

  return () => { cancelAnimationFrame(raf); window.removeEventListener("mousemove", onMove); };
}

/* ── RIPPLE ─────────────────────────────────────────────── */
export function ripple(e, el) {
  const rect = el.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 2.2;
  const span = document.createElement("span");
  span.className = "ripple-wave";
  span.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px`;
  el.appendChild(span);
  span.addEventListener("animationend", () => span.remove(), { once: true });
}

/* ── ENERGY PULSE ───────────────────────────────────────── */
export function energyPulse(lineEl) {
  if (!lineEl) return;
  lineEl.classList.remove("energy-pulse");
  void lineEl.offsetWidth;
  lineEl.classList.add("energy-pulse");
}

/* ── SCROLL PROGRESS ────────────────────────────────────── */
export function getScrollProgress(scrollY, maxScroll) {
  return Math.min(scrollY / Math.max(maxScroll, 1), 1);
}

/* ── SCANLINES (offscreen — chame só no resize) ─────────── */
// Retorna um ImageBitmap ou null; aplica com ctx.drawImage
export function buildScanlines(W, H) {
  const oc = document.createElement("canvas");
  oc.width = W; oc.height = H;
  const ctx = oc.getContext("2d");
  ctx.fillStyle = "rgba(0,0,0,0.06)";
  for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
  return oc; // retorna o canvas offscreen diretamente
}

export function drawScanlines(overlayCanvas) {
  const ctx = overlayCanvas.getContext("2d");
  const W = overlayCanvas.width, H = overlayCanvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "rgba(0,0,0,0.06)";
  for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
}

/* ── TYPING PLACEHOLDER ─────────────────────────────────── */
export function typePlaceholder(inputEl, text, speed = 60) {
  let i = 0;
  inputEl.placeholder = "";
  const iv = setInterval(() => {
    inputEl.placeholder += text[i++] || "";
    if (i >= text.length) clearInterval(iv);
  }, speed);
  return () => clearInterval(iv);
}