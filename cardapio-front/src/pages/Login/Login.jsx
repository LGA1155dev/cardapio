import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";
import { useAuth } from "../../hooks/useAuth";
import { authService } from "../../services/api";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@500;600;700&display=swap');

.ll-root{
  --bg:#05070C; --bg-2:#090C14; --panel:#0E1420;
  --electric:#3B82F6; --electric-2:#60A5FA; --electric-deep:#1D4ED8;
  --line:rgba(255,255,255,.09); --grid-line:rgba(255,255,255,.05);
  --text:#F3F5F9; --text-soft:#AEB6C4; --text-mute:#6B7789;
  --danger:#F87171;
  --glass:rgba(16,21,32,.58);
  --input-bg:rgba(255,255,255,.03); --input-bg-focus:rgba(255,255,255,.055);
  --shadow-card:0 30px 90px rgba(0,0,0,.55);
  --shadow-btn:0 10px 30px rgba(37,99,235,.4);
  --mesh-op:1;
  --three-op:.9;
}
.ll-root.light{
  --bg:#F4F7FC; --bg-2:#E9F0FA; --panel:#FFFFFF;
  --electric:#2563EB; --electric-2:#3B82F6; --electric-deep:#1D4ED8;
  --line:rgba(15,23,42,.10); --grid-line:rgba(15,23,42,.06);
  --text:#0F172A; --text-soft:#475569; --text-mute:#8592A6;
  --danger:#DC2626;
  --glass:rgba(255,255,255,.60);
  --input-bg:rgba(15,23,42,.025); --input-bg-focus:rgba(15,23,42,.045);
  --shadow-card:0 30px 80px rgba(15,23,42,.16);
  --shadow-btn:0 10px 26px rgba(37,99,235,.28);
  --mesh-op:.55;
  --three-op:.55;
}

.ll-root *,.ll-root *::before,.ll-root *::after{box-sizing:border-box;margin:0;padding:0}
.ll-root{font-family:'Inter',system-ui,sans-serif;background:var(--bg);color:var(--text);width:100%;min-height:100vh;position:relative;overflow:hidden;-webkit-font-smoothing:antialiased;transition:background .5s ease,color .5s ease}
.ll-root button,.ll-root input{font-family:inherit}
.ll-root button{cursor:pointer;border:none;outline:none;background:none}
.ll-root svg{display:block}
.mono{font-family:'JetBrains Mono',monospace}
.ll-root :focus-visible{outline:2px solid var(--electric-2);outline-offset:3px}

.ll-bg{position:fixed;inset:0;z-index:0;overflow:hidden;background:radial-gradient(ellipse 120% 80% at 50% -10%,var(--bg-2) 0%,var(--bg) 60%);transition:background .5s ease}
.ll-mesh{position:absolute;border-radius:50%;filter:blur(110px);will-change:transform;opacity:var(--mesh-op);transition:opacity .5s ease}
.ll-m1{width:620px;height:620px;background:radial-gradient(circle,rgba(59,130,246,.55),transparent 70%);top:-220px;left:-160px;animation:llMesh1 16s ease-in-out infinite}
.ll-m2{width:520px;height:520px;background:radial-gradient(circle,rgba(29,78,216,.45),transparent 70%);bottom:-220px;right:-140px;animation:llMesh2 19s ease-in-out infinite}
.ll-m3{width:420px;height:420px;background:radial-gradient(circle,rgba(96,165,250,.28),transparent 70%);top:38%;left:48%;animation:llMesh3 21s ease-in-out infinite}
@keyframes llMesh1{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(60px,40px) scale(1.12)}}
@keyframes llMesh2{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-50px,-30px) scale(1.08)}}
@keyframes llMesh3{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-46%,-54%) scale(1.15)}}
.ll-noise{position:absolute;inset:0;opacity:.035;pointer-events:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.ll-grid{position:absolute;inset:-60px;background-image:linear-gradient(var(--grid-line) 1px,transparent 1px),linear-gradient(90deg,var(--grid-line) 1px,transparent 1px);background-size:52px 52px;mask-image:radial-gradient(ellipse 65% 55% at 50% 40%,#000 30%,transparent 85%);-webkit-mask-image:radial-gradient(ellipse 65% 55% at 50% 40%,#000 30%,transparent 85%);animation:llGridDrift 26s linear infinite}
.ll-grid.two{background-size:130px 130px;opacity:.6;animation:llGridDrift2 40s linear infinite}
@keyframes llGridDrift{0%{transform:translate(0,0)}100%{transform:translate(52px,52px)}}
@keyframes llGridDrift2{0%{transform:translate(0,0)}100%{transform:translate(-130px,65px)}}
.ll-three-canvas{position:absolute;inset:0;width:100%;height:100%;opacity:var(--three-op);transition:opacity .5s ease;touch-action:none}
.ll-spot{position:fixed;inset:0;z-index:1;pointer-events:none;background:radial-gradient(480px circle at var(--mx,50%) var(--my,30%),rgba(59,130,246,.14),transparent 62%);transition:opacity .3s}
.ll-root.light .ll-spot{background:radial-gradient(480px circle at var(--mx,50%) var(--my,30%),rgba(37,99,235,.08),transparent 62%)}

.ll-shell{position:relative;z-index:2;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:32px 20px}
.ll-topbar{position:fixed;top:24px;left:0;right:0;z-index:6;display:flex;align-items:center;justify-content:space-between;padding:0 28px}
@media(max-width:600px){.ll-topbar{position:static;margin-bottom:20px;padding:0}.ll-shell{padding-top:18px}}
.ll-brand-badge{display:flex;align-items:center;gap:10px;animation:llFadeDown .6s cubic-bezier(.16,1,.3,1) both}
@media(max-width:600px){.ll-brand-badge{justify-content:center;width:100%}}
.ll-mark{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,var(--electric),var(--electric-2));display:flex;align-items:center;justify-content:center;box-shadow:var(--shadow-btn);flex-shrink:0}
.ll-mark svg{width:18px;height:18px;color:#fff}
.ll-brand-words b{display:block;color:var(--text);font-size:14px;font-weight:800;transition:color .5s}
.ll-brand-words small{display:block;color:var(--text-mute);font-size:8.5px;letter-spacing:1.6px;text-transform:uppercase;font-weight:600;transition:color .5s}
@keyframes llFadeDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:none}}
.ll-theme-btn{width:38px;height:38px;border-radius:10px;border:1px solid var(--line);background:var(--input-bg);display:flex;align-items:center;justify-content:center;color:var(--text-soft);transition:border-color .2s,background .2s,color .2s,transform .2s;animation:llFadeDown .6s cubic-bezier(.16,1,.3,1) both}
@media(max-width:600px){.ll-theme-btn{position:fixed;top:24px;right:24px}}
.ll-theme-btn:hover{border-color:var(--electric-2);color:var(--electric-2)}
.ll-theme-btn:active{transform:scale(.9)}
.ll-theme-btn svg{width:17px;height:17px}
.ll-theme-icon-enter{animation:llThemePop .35s cubic-bezier(.34,1.6,.64,1) both}
@keyframes llThemePop{from{transform:rotate(-90deg) scale(.4);opacity:0}to{transform:rotate(0) scale(1);opacity:1}}

.ll-card{width:100%;max-width:404px;background:var(--glass);backdrop-filter:blur(26px) saturate(140%);-webkit-backdrop-filter:blur(26px) saturate(140%);border:1px solid var(--line);border-radius:22px;padding:38px 34px 32px;box-shadow:var(--shadow-card);position:relative;animation:llCardIn .7s cubic-bezier(.16,1,.3,1) both,llFloat 7s ease-in-out 1s infinite;transition:background .5s ease,border-color .5s ease}
.ll-card::before{content:'';position:absolute;inset:-1px;border-radius:22px;padding:1px;background:linear-gradient(140deg,rgba(96,165,250,.35),transparent 30%,transparent 70%,rgba(59,130,246,.25));-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none}
@keyframes llCardIn{from{opacity:0;transform:translateY(22px) scale(.97)}to{opacity:1;transform:none}}
@keyframes llFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
.ll-head{text-align:center;margin-bottom:28px}
.ll-kicker{display:inline-flex;align-items:center;gap:6px;background:rgba(59,130,246,.1);border:1px solid rgba(59,130,246,.25);border-radius:99px;padding:5px 12px;font-size:10.5px;font-weight:700;color:var(--electric-2);letter-spacing:.6px;margin-bottom:16px;animation:llFadeUp .5s cubic-bezier(.16,1,.3,1) .05s both}
.ll-head h1{font-size:23px;font-weight:800;color:var(--text);letter-spacing:0;margin-bottom:7px;animation:llFadeUp .5s cubic-bezier(.16,1,.3,1) .1s both;transition:color .5s}
.ll-head p{font-size:13px;color:var(--text-mute);animation:llFadeUp .5s cubic-bezier(.16,1,.3,1) .15s both}
@keyframes llFadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.ll-field{margin-bottom:16px;animation:llFadeUp .5s cubic-bezier(.16,1,.3,1) both}
.ll-field.f0{animation-delay:.18s}.ll-field.f1{animation-delay:.2s}.ll-field.f2{animation-delay:.25s}.ll-field.f3{animation-delay:.3s}
.ll-label{display:block;font-size:11px;font-weight:600;color:var(--text-soft);margin-bottom:7px}
.ll-input-wrap{position:relative;display:flex;align-items:center;border:1.5px solid var(--line);border-radius:12px;background:var(--input-bg);transition:background .25s ease}
.ll-input-wrap:focus-within{background:var(--input-bg-focus)}
.ll-input-wrap.err{border-color:var(--danger);animation:llShake .4s}
@keyframes llShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(5px)}60%{transform:translateX(-4px)}80%{transform:translateX(3px)}}
.ll-input-ico{width:42px;display:flex;align-items:center;justify-content:center;color:var(--text-mute);flex-shrink:0;transition:color .25s}
.ll-input-wrap:focus-within .ll-input-ico{color:var(--electric-2)}
.ll-input-ico svg{width:16px;height:16px}
.ll-input-wrap input{flex:1;border:none;background:transparent;font-size:14px;color:var(--text);padding:12.5px 6px 12.5px 0;min-width:0}
.ll-input-wrap input:focus{outline:none}
.ll-input-wrap input::placeholder{color:var(--text-mute)}
.ll-eye-btn{width:42px;display:flex;align-items:center;justify-content:center;color:var(--text-mute);flex-shrink:0;transition:color .15s}
.ll-eye-btn:hover{color:var(--electric-2)}
.ll-eye-btn svg{width:16px;height:16px}
.ll-err-msg{font-size:11px;color:var(--danger);font-weight:600;margin-top:6px}
.ll-row{display:flex;align-items:center;justify-content:space-between;margin:2px 0 24px;font-size:12px;animation:llFadeUp .5s cubic-bezier(.16,1,.3,1) .3s both}
.ll-remember{display:flex;align-items:center;gap:8px;color:var(--text-soft);cursor:pointer;user-select:none}
.ll-checkbox{width:16px;height:16px;border-radius:5px;border:1.5px solid var(--line);display:flex;align-items:center;justify-content:center;transition:background .15s,border-color .15s;flex-shrink:0}
.ll-checkbox.on{background:var(--electric);border-color:var(--electric)}
.ll-checkbox svg{width:11px;height:11px;color:#fff}
.ll-forgot{color:var(--electric-2);font-weight:600;text-decoration:none;transition:opacity .15s}
.ll-forgot:hover{opacity:.75}
.ll-submit{width:100%;display:flex;align-items:center;justify-content:center;gap:8px;padding:14px;border-radius:12px;background:linear-gradient(135deg,var(--electric-deep),var(--electric) 55%,var(--electric-2));color:#fff;font-size:14.5px;font-weight:700;letter-spacing:.1px;box-shadow:var(--shadow-btn);transition:transform .18s cubic-bezier(.34,1.5,.64,1),box-shadow .25s;position:relative;overflow:hidden;isolation:isolate;animation:llFadeUp .5s cubic-bezier(.16,1,.3,1) .35s both}
.ll-submit::after{content:'';position:absolute;top:0;left:-60%;width:40%;height:100%;background:linear-gradient(120deg,transparent,rgba(255,255,255,.35),transparent);transform:skewX(-20deg);transition:left .6s ease;z-index:1}
.ll-submit:hover::after{left:140%}
.ll-submit:hover{transform:translateY(-2px);box-shadow:0 16px 40px rgba(37,99,235,.5)}
.ll-submit:active{transform:scale(.97)}
.ll-submit:disabled{cursor:default;opacity:.78}
.ll-submit span,.ll-submit svg{position:relative;z-index:2}
.ll-spin{animation:llSpin .8s linear infinite}
@keyframes llSpin{to{transform:rotate(360deg)}}
.ll-success-pop{animation:llPop .4s cubic-bezier(.34,1.6,.64,1) both}
@keyframes llPop{from{transform:scale(.5);opacity:0}to{transform:scale(1);opacity:1}}
.ll-divider{display:flex;align-items:center;gap:12px;margin:24px 0;color:var(--text-mute);font-size:11px;font-weight:600;animation:llFadeUp .5s cubic-bezier(.16,1,.3,1) .4s both}
.ll-divider::before,.ll-divider::after{content:'';flex:1;height:1px;background:var(--line)}
.ll-google-btn{width:100%;display:flex;align-items:center;justify-content:center;gap:10px;padding:13px;border-radius:12px;background:#fff;border:1.5px solid rgba(15,23,42,.14);color:#1F1F1F;font-size:14px;font-weight:700;box-shadow:0 2px 10px rgba(0,0,0,.06);transition:box-shadow .2s,transform .18s cubic-bezier(.34,1.5,.64,1),border-color .2s;animation:llFadeUp .5s cubic-bezier(.16,1,.3,1) .18s both}
.ll-google-btn:hover{box-shadow:0 8px 22px rgba(0,0,0,.14);border-color:rgba(15,23,42,.22);transform:translateY(-2px)}
.ll-google-btn:active{transform:scale(.97)}
.ll-google-btn:disabled{opacity:.7;cursor:default;transform:none}
.ll-google-spin{animation:llSpin .8s linear infinite}
.ll-social-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px;animation:llFadeUp .5s cubic-bezier(.16,1,.3,1) .45s both}
.ll-social-btn{display:flex;align-items:center;justify-content:center;gap:8px;padding:11px;border:1.5px solid var(--line);border-radius:11px;font-size:13px;font-weight:600;color:var(--text-soft);background:var(--input-bg);transition:border-color .2s,background .2s,color .2s}
.ll-social-btn:hover{border-color:var(--electric-2);background:var(--input-bg-focus);color:var(--text)}
.ll-guest-btn{width:100%;display:flex;align-items:center;justify-content:center;gap:8px;padding:12px;border-radius:11px;border:1.5px dashed var(--line);color:var(--text-mute);font-size:13px;font-weight:600;background:transparent;transition:border-color .2s,color .2s,background .2s,transform .15s;margin-bottom:24px;animation:llFadeUp .5s cubic-bezier(.16,1,.3,1) .5s both}
.ll-guest-btn:hover{border-color:var(--electric-2);color:var(--electric-2);background:var(--input-bg)}
.ll-guest-btn:active{transform:scale(.98)}
.ll-guest-btn:disabled{opacity:.55;cursor:default;transform:none}
.ll-guest-btn svg{width:15px;height:15px}
.ll-terms-row{display:flex;align-items:flex-start;gap:9px;margin:2px 0 22px;font-size:11.5px;color:var(--text-soft);line-height:1.5;animation:llFadeUp .5s cubic-bezier(.16,1,.3,1) .32s both}
.ll-terms-row .ll-checkbox{margin-top:1px}
.ll-terms-row button.txt{color:var(--text-soft);cursor:pointer;user-select:none;text-align:left;background:none;border:none;font:inherit}
.ll-terms-row a{color:var(--electric-2);font-weight:600;text-decoration:none}
.ll-terms-row a:hover{text-decoration:underline}
.ll-footer-txt{text-align:center;font-size:12.5px;color:var(--text-mute);animation:llFadeUp .5s cubic-bezier(.16,1,.3,1) .5s both}
.ll-footer-txt a,.ll-mode-btn{color:var(--electric-2);font-weight:700;text-decoration:none;background:none;border:none;cursor:pointer;font-size:inherit;padding:0}
.ll-footer-txt a:hover,.ll-mode-btn:hover{text-decoration:underline}
.ll-toast{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);background:var(--panel);border:1px solid var(--line);color:var(--text);padding:13px 22px;border-radius:12px;font-size:12.5px;font-weight:600;box-shadow:var(--shadow-card);display:flex;align-items:center;gap:10px;z-index:999;max-width:90vw;animation:llToastIn .35s cubic-bezier(.16,1,.3,1) both,llToastOut .35s ease 2.6s both}
.ll-toast svg{width:16px;height:16px;color:var(--electric-2);flex-shrink:0}
@keyframes llToastIn{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
@keyframes llToastOut{to{opacity:0;transform:translateX(-50%) translateY(10px)}}
@keyframes llDrift{0%{transform:translate3d(0,0,0);opacity:0}12%{opacity:var(--op,.3)}100%{transform:translate3d(40px,-110vh,0);opacity:0}}

@media(prefers-reduced-motion:reduce){
  .ll-root *{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}
  .ll-mesh,.ll-card,.ll-grid{animation:none!important}
  .ll-spot{display:none}
}
@media(max-width:480px){.ll-card{padding:30px 22px 26px;border-radius:18px}}
`;

function IconBase({ children, size = 18, className = "", ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {children}
    </svg>
  );
}

const Leaf = (props) => <IconBase {...props}><path d="M11 20A7 7 0 0 1 4 13C4 7 11 4 20 4c0 9-3 16-9 16Z" /><path d="M7 17c3-4 6-6 11-8" /></IconBase>;
const Mail = (props) => <IconBase {...props}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></IconBase>;
const Lock = (props) => <IconBase {...props}><rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></IconBase>;
const UserRound = (props) => <IconBase {...props}><circle cx="12" cy="8" r="4" /><path d="M4 20c1.7-4 14.3-4 16 0" /></IconBase>;
const Eye = (props) => <IconBase {...props}><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></IconBase>;
const EyeOff = (props) => <IconBase {...props}><path d="M3 3l18 18" /><path d="M10.6 10.6A3 3 0 0 0 13.4 13.4" /><path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a18.6 18.6 0 0 1-3 4.1" /><path d="M6.5 6.9C3.7 8.7 2 12 2 12s3.5 7 10 7a10.6 10.6 0 0 0 4.1-.8" /></IconBase>;
const ArrowRight = (props) => <IconBase {...props}><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></IconBase>;
const Loader2 = (props) => <IconBase {...props}><path d="M21 12a9 9 0 1 1-6.2-8.6" /></IconBase>;
const CheckCircle2 = (props) => <IconBase {...props}><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-5" /></IconBase>;
const ShieldCheck = (props) => <IconBase {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-5" /></IconBase>;
const Sparkles = (props) => <IconBase {...props}><path d="m12 3-1.9 5.1L5 10l5.1 1.9L12 17l1.9-5.1L19 10l-5.1-1.9L12 3Z" /><path d="M5 3v4" /><path d="M3 5h4" /><path d="M19 17v4" /><path d="M17 19h4" /></IconBase>;
const Sun = (props) => <IconBase {...props}><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></IconBase>;
const Moon = (props) => <IconBase {...props}><path d="M20.9 13.5A8.5 8.5 0 0 1 10.5 3.1a7 7 0 1 0 10.4 10.4Z" /></IconBase>;

function ThreeBackdrop({ theme }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({});

  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    camera.position.set(0, 0, 4.8);

    const outerMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, wireframe: true, transparent: true, opacity: 0.32 });
    const outer = new THREE.Mesh(new THREE.TorusKnotGeometry(1.25, 0.36, 170, 24, 2, 3), outerMat);
    scene.add(outer);

    const innerMat = new THREE.MeshBasicMaterial({ color: 0x1d4ed8, wireframe: true, transparent: true, opacity: 0.14 });
    const inner = new THREE.Mesh(new THREE.TorusKnotGeometry(1.15, 0.2, 120, 16, 2, 3), innerMat);
    scene.add(inner);

    const count = 500;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 1;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const pMat = new THREE.PointsMaterial({ color: 0x60a5fa, size: 0.03, transparent: true, opacity: 0.4 });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    stateRef.current = { renderer, scene, camera, outer, inner, outerMat, innerMat, particles };

    function resize() {
      const parent = canvas.parentElement;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }

    resize();
    window.addEventListener("resize", resize);

    let px = 0;
    let py = 0;
    const onPointerMove = (clientX, clientY) => {
      px = (clientX / window.innerWidth - 0.5) * 2;
      py = (clientY / window.innerHeight - 0.5) * 2;
    };
    const onMouseMove = (event) => onPointerMove(event.clientX, event.clientY);
    const onTouchMove = (event) => {
      if (event.touches && event.touches[0]) onPointerMove(event.touches[0].clientX, event.touches[0].clientY);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove, { passive: true });

    let raf;
    let t = 0;
    function animate() {
      raf = requestAnimationFrame(animate);
      t += 0.0045;
      outer.rotation.x = t * 0.35 + py * 0.35;
      outer.rotation.y = t * 0.5 + px * 0.45;
      inner.rotation.x = -t * 0.28 - py * 0.2;
      inner.rotation.y = t * 0.4 + px * 0.25;
      particles.rotation.y = t * 0.05 + px * 0.08;
      particles.rotation.x = Math.sin(t * 0.3) * 0.1;
      outerMat.opacity = 0.26 + Math.sin(t * 1.1) * 0.06;
      renderer.render(scene, camera);
    }

    if (reduce) renderer.render(scene, camera);
    else animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      outer.geometry.dispose();
      outerMat.dispose();
      inner.geometry.dispose();
      innerMat.dispose();
      pGeo.dispose();
      pMat.dispose();
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    const state = stateRef.current;
    if (!state.outerMat) return;
    if (theme === "light") {
      state.outerMat.color.set(0x1d4ed8);
      state.innerMat.color.set(0x2563eb);
      state.particles.material.color.set(0x2563eb);
      state.particles.material.opacity = 0.3;
    } else {
      state.outerMat.color.set(0x3b82f6);
      state.innerMat.color.set(0x1d4ed8);
      state.particles.material.color.set(0x60a5fa);
      state.particles.material.opacity = 0.4;
    }
  }, [theme]);

  return <canvas ref={canvasRef} className="ll-three-canvas" aria-hidden="true" />;
}

function useParticles(count = 14) {
  return useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: Math.random() * 2 + 1,
        duration: Math.random() * 14 + 12,
        delay: Math.random() * -20,
        opacity: Math.random() * 0.3 + 0.15,
      })),
    [count],
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { login, registerAndLogin, loading, error } = useAuth({ autoCheck: false });
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("cardapio-theme");
    if (saved === "dark" || saved === "light") return saved;
    return "dark";
  });
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const [guestStatus, setGuestStatus] = useState("idle");
  const [toast, setToast] = useState(null);

  const spotRef = useRef(null);
  const rafRef = useRef(null);
  const particles = useParticles(14);

  useEffect(() => {
    localStorage.setItem("cardapio-theme", theme);
  }, [theme]);

  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return undefined;
    let pending = null;
    const onMove = (event) => {
      pending = { x: event.clientX, y: event.clientY };
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        if (spotRef.current && pending) {
          spotRef.current.style.setProperty("--mx", `${pending.x}px`);
          spotRef.current.style.setProperty("--my", `${pending.y}px`);
        }
        rafRef.current = null;
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!error) return;
    setStatus("idle");
    setErrors((current) => ({ ...current, auth: error }));
  }, [error]);

  const validate = () => {
    const next = {};
    if (mode === "register" && !name.trim()) next.name = "Informe seu nome.";
    if (!email.trim()) next.email = "Informe seu e-mail.";
    else if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "E-mail invalido.";
    if (!password) next.password = "Informe sua senha.";
    else if (mode === "register" && password.length < 6) next.password = "Use pelo menos 6 caracteres.";
    return next;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setStatus("loading");
    const ok = mode === "register"
      ? await registerAndLogin({ nome: name.trim(), email: email.trim(), password })
      : await login(email.trim(), password);

    if (ok) {
      setStatus("success");
      setToast(mode === "register" ? "Conta criada com sucesso." : "Login validado com sucesso.");
      setTimeout(() => navigate("/refeicao"), 650);
      return;
    }

    setStatus("idle");
  };

  const handleGuest = () => {
    if (status !== "idle" || guestStatus !== "idle") return;
    authService.enterGuest();
    setGuestStatus("success");
    setToast("Acesso liberado como convidado.");
    setTimeout(() => navigate("/refeicao"), 450);
  };

  const busy = loading || status === "loading" || guestStatus === "loading";
  const authError = errors.auth && !errors.email && !errors.password ? errors.auth : "";

  return (
    <div className={`ll-root${theme === "light" ? " light" : ""}`}>
      <style>{CSS}</style>

      <div className="ll-bg" aria-hidden="true">
        <div className="ll-mesh ll-m1" />
        <div className="ll-mesh ll-m2" />
        <div className="ll-mesh ll-m3" />
        <ThreeBackdrop theme={theme} />
        <div className="ll-grid" />
        <div className="ll-grid two" />
        <div className="ll-noise" />
        {particles.map((particle) => (
          <span
            key={particle.id}
            className="ll-particle"
            style={{
              position: "absolute",
              left: `${particle.left}%`,
              bottom: "-10px",
              width: particle.size,
              height: particle.size,
              borderRadius: "50%",
              background: "var(--electric-2)",
              pointerEvents: "none",
              animation: `llDrift ${particle.duration}s linear infinite`,
              animationDelay: `${particle.delay}s`,
              opacity: particle.opacity,
            }}
          />
        ))}
      </div>
      <div className="ll-spot" ref={spotRef} aria-hidden="true" />

      {toast && (
        <div className="ll-toast" role="status">
          <ShieldCheck />
          {toast}
        </div>
      )}

      <div className="ll-topbar">
        <div className="ll-brand-badge">
          <div className="ll-mark"><Leaf /></div>
          <div className="ll-brand-words">
            <b>Polivalente</b>
            <small>Cardapio da Semana</small>
          </div>
        </div>
        <button
          type="button"
          className="ll-theme-btn"
          onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
          aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
          title={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
        >
          <span className="ll-theme-icon-enter" key={theme}>
            {theme === "dark" ? <Sun /> : <Moon />}
          </span>
        </button>
      </div>

      <div className="ll-shell">
        <form className="ll-card" onSubmit={handleSubmit} noValidate>
          <div className="ll-head">
            <span className="ll-kicker mono">
              <Sparkles size={11} /> ACESSO RESTRITO
            </span>
            <h1>{mode === "register" ? "Criar conta" : "Bem-vindo de volta"}</h1>
            <p>{mode === "register" ? "Cadastre-se para acessar o cardapio da escola." : "Entre com sua conta para acessar o painel da escola."}</p>
          </div>

          {mode === "register" && (
            <div className="ll-field f0">
              <label className="ll-label" htmlFor="ll-name">Nome</label>
              <div className={`ll-input-wrap${errors.name ? " err" : ""}`}>
                <span className="ll-input-ico"><UserRound /></span>
                <input
                  id="ll-name"
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    if (errors.name || errors.auth) setErrors((current) => ({ ...current, name: undefined, auth: undefined }));
                  }}
                  autoComplete="name"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "ll-name-err" : undefined}
                />
              </div>
              {errors.name && <div className="ll-err-msg" id="ll-name-err">{errors.name}</div>}
            </div>
          )}

          <div className="ll-field f1">
            <label className="ll-label" htmlFor="ll-email">E-mail</label>
            <div className={`ll-input-wrap${errors.email ? " err" : ""}`}>
              <span className="ll-input-ico"><Mail /></span>
              <input
                id="ll-email"
                type="email"
                placeholder="voce@escola.com.br"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (errors.email || errors.auth) setErrors((current) => ({ ...current, email: undefined, auth: undefined }));
                }}
                autoComplete="email"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "ll-email-err" : undefined}
              />
            </div>
            {errors.email && <div className="ll-err-msg" id="ll-email-err">{errors.email}</div>}
          </div>

          <div className="ll-field f2">
            <label className="ll-label" htmlFor="ll-pass">Senha</label>
            <div className={`ll-input-wrap${errors.password ? " err" : ""}`}>
              <span className="ll-input-ico"><Lock /></span>
              <input
                id="ll-pass"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (errors.password || errors.auth) setErrors((current) => ({ ...current, password: undefined, auth: undefined }));
                }}
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "ll-pass-err" : undefined}
              />
              <button
                type="button"
                className="ll-eye-btn"
                onClick={() => setShowPassword((show) => !show)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
            {errors.password && <div className="ll-err-msg" id="ll-pass-err">{errors.password}</div>}
          </div>

          {authError && <div className="ll-err-msg" style={{ marginTop: "-6px", marginBottom: "16px" }}>{authError}</div>}

          <div className="ll-row">
            <label className="ll-remember">
              <button
                type="button"
                className={`ll-checkbox${remember ? " on" : ""}`}
                onClick={() => setRemember((current) => !current)}
                aria-pressed={remember}
              >
                {remember && <CheckCircle2 />}
              </button>
              Lembrar de mim
            </label>
            <a className="ll-forgot" href="#" onClick={(event) => event.preventDefault()}>Esqueceu a senha?</a>
          </div>

          <button className="ll-submit" type="submit" disabled={busy}>
            {status === "idle" && (
              <><span>{mode === "register" ? "Criar conta" : "Entrar"}</span><ArrowRight size={16} /></>
            )}
            {status === "loading" && (
              <><Loader2 className="ll-spin" size={17} /><span>{mode === "register" ? "Criando..." : "Verificando..."}</span></>
            )}
            {status === "success" && (
              <span className="ll-success-pop" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle2 size={17} /> Acesso liberado
              </span>
            )}
          </button>

          <div className="ll-divider">ou continue com</div>
          <div className="ll-social-row">
            <button type="button" className="ll-social-btn" onClick={(event) => event.preventDefault()}>Google</button>
            <button type="button" className="ll-social-btn" onClick={(event) => event.preventDefault()}>Microsoft</button>
          </div>

          <button
            type="button"
            className="ll-guest-btn"
            onClick={handleGuest}
            disabled={busy}
          >
            <UserRound /><span>Entrar como convidado</span>
          </button>

          <div className="ll-footer-txt">
            {mode === "login" ? "Nao tem uma conta? " : "Ja tem uma conta? "}
            <button
              type="button"
              className="ll-mode-btn"
              onClick={() => {
                setMode((current) => (current === "login" ? "register" : "login"));
                setErrors({});
                setStatus("idle");
              }}
            >
              {mode === "login" ? "Cadastre-se" : "Entrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
