import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FiEdit2, FiMoon, FiSun, FiTrash2 } from "react-icons/fi";
import { api } from "../../services/api";

const VegetableModel = lazy(() => import("../../components/VegetableModel.jsx"));

const DAYS = [
  "Todos",
  "Segunda-feira",
  "Terca-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sabado",
  "Sábado",
];

const WEEK_ANCHOR = {
  date: "2026-08-24",
  trimestre: 2,
  semana: 4,
};

const MEAL_TYPES = [
  { key: "CAFE_DA_MANHA", label: "Café da manhã", itemLabel: "café da manhã", icon: "☕" },
  { key: "ALMOCO", label: "Almoço", itemLabel: "almoço", icon: "🍛" },
  { key: "SUCO", label: "Sucos", itemLabel: "suco", icon: "🥤" },
  { key: "SOBREMESA", label: "Sobremesas", itemLabel: "sobremesa", icon: "🍰" },
];

const normalizeType = (tipo) => {
  const normalized = (tipo || "ALMOCO")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-]+/g, "_");

  if (normalized === "CAFE" || normalized === "CAFE_DA_MANHA" || normalized === "CAFES_DA_MANHA") return "CAFE_DA_MANHA";
  if (normalized === "ALMOCO" || normalized === "ALMOCOS") return "ALMOCO";
  if (normalized === "SUCO" || normalized === "SUCOS") return "SUCO";
  if (normalized === "SOBREMESA" || normalized === "SOBREMESAS") return "SOBREMESA";
  return "ALMOCO";
};
const getTypeMeta = (tipo) => MEAL_TYPES.find((type) => type.key === normalizeType(tipo)) || MEAL_TYPES[0];

const getCurrentWeekInfo = () => {
  const anchor = new Date(`${WEEK_ANCHOR.date}T00:00:00`);
  const now = new Date();
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const diffWeeks = Math.max(0, Math.floor((now - anchor) / msPerWeek));

  return {
    trimestre: WEEK_ANCHOR.trimestre,
    semana: WEEK_ANCHOR.semana + diffWeeks,
  };
};

const DAY_META = {
  "Segunda-feira": { short: "SEG", date: "20", order: 1 },
  "Terca-feira": { short: "TER", date: "21", order: 2 },
  "Terça-feira": { short: "TER", date: "21", order: 2 },
  "Quarta-feira": { short: "QUA", date: "22", order: 3 },
  "Quinta-feira": { short: "QUI", date: "23", order: 4 },
  "Sexta-feira": { short: "SEX", date: "24", order: 5 },
  Sabado: { short: "SAB", date: "25", order: 6 },
  "Sábado": { short: "SAB", date: "25", order: 6 },
  Domingo: { short: "DOM", date: "26", order: 7 },
};

const FEATURES = [
  { ico: "01", t: "Planejado por nutricionistas", d: "Cada cardapio passa por uma equipe especializada em nutricao escolar." },
  { ico: "02", t: "Ingredientes frescos", d: "Priorizamos produtos frescos, de estacao e fornecedores de confianca." },
  { ico: "03", t: "Refeicoes balanceadas", d: "Proteinas, carboidratos, fibras e vitaminas em cada prato do dia." },
  { ico: "04", t: "Habitos que transformam", d: "Educando o paladar dos alunos para escolhas mais saudaveis." },
];

const SCHOOL_PHONE = "(32) 3261-3100";
const SCHOOL_HOURS = "Segunda a sexta, 6h30 as 22h";
const SCHOOL_ADDRESS = "R. João Carlos Knop, 2-130 - São José, São João Nepomuceno - MG, 36680-000";

const normalizeRefeicao = (refeicao) => ({
  ...refeicao,
  image: refeicao.image || refeicao.imageUrl || "https://via.placeholder.com/700x520",
  tag: normalizeType(refeicao.tipo || refeicao.tag || "ALMOCO"),
  tipo: normalizeType(refeicao.tipo || refeicao.tag || "ALMOCO"),
  trimestre: refeicao.trimestre || WEEK_ANCHOR.trimestre,
  semana: refeicao.semana || WEEK_ANCHOR.semana,
  dayWeek: refeicao.dayWeek || "",
  price: refeicao.price || "",
  calories: refeicao.calories || 0,
});

const toBackendRefeicao = (refeicao) => ({
  name: refeicao.name,
  description: refeicao.description,
  dayWeek: refeicao.dayWeek || "",
  calories: refeicao.calories || 0,
  imageUrl: refeicao.image || refeicao.imageUrl,
  trimestre: refeicao.trimestre || WEEK_ANCHOR.trimestre,
  semana: refeicao.semana || WEEK_ANCHOR.semana,
  tipo: normalizeType(refeicao.tipo || refeicao.tag),
});

const sortByDay = (a, b) => {
  const dayOrderA = DAY_META[a.dayWeek]?.order || 99;
  const dayOrderB = DAY_META[b.dayWeek]?.order || 99;
  if (dayOrderA !== dayOrderB) return dayOrderA - dayOrderB;

  const orderA = MEAL_TYPES.findIndex((type) => type.key === normalizeType(a.tipo));
  const orderB = MEAL_TYPES.findIndex((type) => type.key === normalizeType(b.tipo));
  const typeOrderA = orderA === -1 ? 99 : orderA;
  const typeOrderB = orderB === -1 ? 99 : orderB;
  return typeOrderA - typeOrderB || a.name.localeCompare(b.name);
};

const isAdminRole = (role) => {
  const normalized = (role || "").trim().toUpperCase();
  return normalized === "ADMIN" || normalized === "ROLE_ADMIN";
};

const getInitialTheme = () => {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem("cardapio-theme");
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700;9..144,900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

:root{
  --cream:#F3F8FF; --cream2:#E7F0FF; --paper:#FFFFFF;
  --ink:#0F2747; --ink-soft:#475B74; --muted:#72829A;
  --forest:#1D5FBF; --forest-deep:#0B326F; --sage:#91B8F6;
  --mustard:#2F80ED; --mustard-deep:#1454B8; --coral:#1BA6A6;
  --line:rgba(29,95,191,0.14); --shadow:rgba(15,39,71,0.12);
}
.pl-root *,.pl-root *::before,.pl-root *::after{box-sizing:border-box}
.pl-root{font-family:'Plus Jakarta Sans',sans-serif;background:linear-gradient(180deg,#f7fbff 0%,var(--cream) 46%,#eef5ff 100%);color:var(--ink);min-height:100vh;overflow-x:hidden;width:100%;position:relative;transition:background .25s ease,color .25s ease}
.pl-root.dark{
  --cream:#0D1628; --cream2:#14233B; --paper:#111D31;
  --ink:#EFF6FF; --ink-soft:#C7D2E5; --muted:#93A4BD;
  --forest:#60A5FA; --forest-deep:#DBEAFE; --sage:#315A93;
  --mustard:#93C5FD; --mustard-deep:#93C5FD; --coral:#5EEAD4;
  --line:rgba(147,197,253,0.18); --shadow:rgba(0,0,0,0.38);
  background:linear-gradient(180deg,#081225 0%,#0d1628 48%,#0b1322 100%);
}
.pl-root img{display:block;max-width:100%}
.pl-root button{font-family:inherit;cursor:pointer;border:none;outline:none;background:none}
.pl-root em{font-style:normal;color:var(--forest)}
.pl-root :focus-visible{outline:3px solid rgba(47,128,237,.45);outline-offset:3px}
.pl-root.dark :focus-visible{outline-color:rgba(147,197,253,.7)}
.serif{font-family:'Fraunces',serif}

#pl-splash{position:fixed;inset:0;z-index:9999;background:linear-gradient(145deg,#071d45,#0e4ca4);display:flex;flex-direction:column;align-items:center;justify-content:center;transition:opacity .6s ease,transform .6s ease}
#pl-splash.gone{opacity:0;transform:scale(1.05);pointer-events:none}
.pl-sp-mark{width:76px;height:76px;border-radius:22px;background:var(--paper);display:flex;align-items:center;justify-content:center;font-size:30px;box-shadow:0 18px 48px rgba(0,0,0,.24);animation:plSpMark .9s cubic-bezier(.34,1.56,.64,1) both}
@keyframes plSpMark{0%{transform:scale(.3) rotate(-12deg);opacity:0}60%{transform:scale(1.12) rotate(4deg);opacity:1}100%{transform:scale(1) rotate(0)}}
.pl-sp-name{margin-top:22px;font-size:19px;font-weight:700;color:var(--cream);letter-spacing:3px;text-transform:uppercase;font-family:'Fraunces',serif;animation:plUp .5s ease .3s both}
.pl-sp-sub{font-size:10px;color:#cfe1ff;letter-spacing:3px;text-transform:uppercase;margin-top:6px;animation:plUp .5s ease .4s both}
.pl-sp-bar{width:120px;height:2px;background:rgba(255,255,255,.15);border-radius:99px;margin-top:32px;overflow:hidden}
.pl-sp-fill{height:100%;background:#9ec5ff;border-radius:99px;width:0;animation:plFill 1.3s cubic-bezier(.4,0,.2,1) .2s forwards}
@keyframes plFill{to{width:100%}}
@keyframes plUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}

.pl-topbar{position:sticky;top:0;z-index:200;background:rgba(255,255,255,0.9);backdrop-filter:blur(16px);border-bottom:1px solid var(--line);box-shadow:0 10px 30px rgba(15,39,71,.05)}
.pl-tb-inner{max-width:1180px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;padding:0 24px;height:68px;gap:14px}
.pl-brand{display:flex;align-items:center;gap:11px}
.pl-mark{width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#0e4ca4,#2f80ed);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;color:#fff;box-shadow:0 10px 22px rgba(29,95,191,.22)}
.pl-words b{display:block;font-size:14.5px;font-weight:700;color:var(--ink);font-family:'Fraunces',serif}
.pl-words small{font-size:9px;color:var(--muted);letter-spacing:1.6px;text-transform:uppercase}
.pl-tb-nav{display:flex;gap:6px}
.pl-tb-nav button,.pl-admin-link{font-size:13px;font-weight:600;color:var(--ink-soft);padding:9px 15px;border-radius:99px;transition:background .2s,color .2s;text-decoration:none}
.pl-tb-nav button:hover,.pl-admin-link:hover{background:var(--cream2);color:var(--forest-deep)}
.pl-tb-nav button.on{background:var(--forest);color:#fff}
.pl-admin-link{background:#dbeafe;color:var(--forest-deep);font-weight:800}
.pl-call-btn{display:flex;align-items:center;gap:7px;background:var(--forest);color:#fff;padding:9px 15px;border-radius:99px;font-size:12.5px;font-weight:700;box-shadow:0 6px 16px rgba(47,82,51,.28);transition:transform .15s}
.pl-call-btn:active{transform:scale(.94)}
.pl-theme-btn{width:42px;height:42px;border-radius:12px;border:1px solid var(--line);background:var(--paper);color:var(--forest-deep);display:flex;align-items:center;justify-content:center;box-shadow:0 8px 18px rgba(15,39,71,.08);transition:background .2s,border-color .2s,color .2s,transform .15s}
.pl-theme-btn:hover{background:var(--cream2);border-color:rgba(29,95,191,.3);color:var(--forest)}
.pl-theme-btn:active{transform:scale(.94)}
.pl-theme-btn svg{width:18px;height:18px}
.pl-top-actions{display:flex;align-items:center;gap:10px}
@media(max-width:860px){.pl-tb-nav{display:none}.pl-tb-inner{padding:0 16px}.pl-call-btn{font-size:0;padding:10px 12px}.pl-call-btn span{font-size:16px}.pl-theme-btn{width:40px;height:40px}}

.pl-reveal-wrap{display:grid;grid-template-rows:0fr;transition:grid-template-rows .5s cubic-bezier(.4,0,.2,1);max-width:1180px;margin:0 auto;padding:0 24px}
.pl-reveal-wrap.open{grid-template-rows:1fr}
.pl-reveal-inner{overflow:hidden;min-height:0}
.pl-contact-card{margin-top:14px;margin-bottom:8px;background:linear-gradient(135deg,#0b326f,#155fc7);border-radius:20px;padding:22px 26px;display:flex;flex-wrap:wrap;gap:22px;align-items:center;justify-content:space-between;animation:plCardIn .4s ease both;box-shadow:0 18px 42px rgba(11,50,111,.18)}
@keyframes plCardIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
.pl-contact-item{display:flex;align-items:center;gap:12px;color:#fff}
.pl-contact-ico{width:42px;height:42px;border-radius:12px;background:rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
.pl-contact-item b{display:block;font-size:14.5px;font-weight:700}
.pl-contact-item span{font-size:11.5px;color:rgba(255,255,255,.6)}

.pl-hero{padding:54px 24px 48px;position:relative;overflow:hidden;background:linear-gradient(180deg,#ffffff 0%,#edf5ff 100%)}
.pl-hero::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(47,128,237,.09),transparent 42%),linear-gradient(0deg,rgba(255,255,255,.72),rgba(255,255,255,.36));pointer-events:none}
.pl-root.dark .pl-topbar{background:rgba(13,22,40,.9);box-shadow:0 12px 32px rgba(0,0,0,.24)}
.pl-root.dark .pl-hero{background:linear-gradient(180deg,#0b172a 0%,#0f1e35 100%)}
.pl-root.dark .pl-hero::before{background:linear-gradient(135deg,rgba(96,165,250,.13),transparent 45%),linear-gradient(0deg,rgba(13,22,40,.2),rgba(13,22,40,.55))}
.pl-hero-inner{max-width:1180px;margin:0 auto;position:relative;display:grid;grid-template-columns:minmax(0,1fr) minmax(320px,460px);gap:42px;align-items:center}
.pl-eyebrow{display:inline-flex;align-items:center;gap:7px;background:var(--paper);border:1px solid var(--line);border-radius:99px;padding:7px 15px;font-size:11.5px;font-weight:700;color:var(--forest);margin-bottom:18px}
.pl-hero h1{font-family:'Fraunces',serif;font-size:clamp(34px,5.2vw,62px);font-weight:700;line-height:1.05;letter-spacing:0;margin:0 0 14px;color:var(--forest-deep)}
.pl-hero p{font-size:14.5px;color:var(--ink-soft);line-height:1.7;max-width:520px;margin:0 0 26px}
.pl-hero-actions{display:flex;gap:12px;flex-wrap:wrap}
.pl-primary,.pl-secondary{display:inline-flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;border-radius:12px;font-size:12px;font-weight:800;padding:12px 18px;transition:transform .16s,box-shadow .16s,background .16s}
.pl-primary{background:var(--forest);color:#fff;box-shadow:0 12px 26px rgba(29,95,191,.28)}
.pl-secondary{background:var(--paper);color:var(--forest-deep);border:1px solid var(--line)}
.pl-primary:hover{background:#174f9f;box-shadow:0 16px 32px rgba(29,95,191,.32)}
.pl-secondary:hover{background:#f8fbff}
.pl-primary:active,.pl-secondary:active{transform:scale(.96)}
.pl-model-wrap{min-height:430px;position:relative;display:flex;align-items:center;justify-content:center}
.pl-model-card{position:relative;width:min(100%,430px);height:430px;border-radius:28px;background:linear-gradient(145deg,rgba(255,255,255,.95),rgba(225,239,255,.92));border:1px solid rgba(29,95,191,.14);box-shadow:0 28px 70px rgba(15,39,71,.14);overflow:hidden}
.pl-model-card::before{content:'';position:absolute;inset:26px;border-radius:24px;background:radial-gradient(circle at 50% 42%,rgba(47,128,237,.2),rgba(147,197,253,.12) 42%,transparent 72%);border:1px solid rgba(29,95,191,.12)}
.pl-model-card::after{content:'';position:absolute;left:18%;right:18%;bottom:38px;height:26px;background:rgba(15,39,71,.16);filter:blur(16px);border-radius:50%}
.pl-root.dark .pl-model-card{background:linear-gradient(145deg,rgba(17,29,49,.96),rgba(20,35,59,.9));border-color:rgba(147,197,253,.2);box-shadow:0 30px 80px rgba(0,0,0,.36)}
.pl-root.dark .pl-model-card::before{background:radial-gradient(circle at 50% 42%,rgba(96,165,250,.22),rgba(49,90,147,.14) 45%,transparent 72%);border-color:rgba(147,197,253,.16)}
.pl-root.dark .pl-model-card::after{background:rgba(0,0,0,.34)}
.pl-root .vegetable-model{width:100%;height:100%;min-height:360px;position:relative;z-index:2}
.pl-root .vegetable-model canvas{display:block;border-radius:24px;background:transparent}
.pl-root .vegetable-model__ring{inset:18%;border-color:rgba(29,95,191,.16);box-shadow:none;animation:none}
.pl-root .vegetable-model__ring--two{inset:28% 9%;border-color:rgba(47,128,237,.14)}
.pl-root .vegetable-model__spark{display:none}
@media(max-width:900px){.pl-hero-inner{grid-template-columns:1fr;text-align:center}.pl-hero p{margin-left:auto;margin-right:auto}.pl-hero-actions{justify-content:center}.pl-model-wrap{min-height:340px}.pl-model-card{height:340px;width:min(100%,360px)}}
@media(max-width:560px){.pl-hero{padding:34px 16px 30px}.pl-model-wrap{min-height:280px}.pl-model-card{height:280px}.pl-root .vegetable-model{min-height:260px}.pl-hero h1{font-size:34px}}

.pl-tabs{display:flex;gap:9px;justify-content:center;overflow-x:auto;padding:4px 4px 30px;scrollbar-width:none}
.pl-tabs::-webkit-scrollbar{display:none}
.pl-tab{flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:2px;padding:10px 18px;border-radius:14px;border:1px solid var(--line);background:var(--paper);transition:all .25s cubic-bezier(.34,1.4,.64,1);position:relative}
.pl-tab b{font-size:12px;font-weight:800;letter-spacing:.5px;color:var(--ink-soft)}
.pl-tab span{font-size:9.5px;color:var(--muted)}
.pl-tab.on{background:var(--forest);border-color:var(--forest);transform:translateY(-3px);box-shadow:0 12px 26px rgba(29,95,191,.24)}
.pl-tab.on b,.pl-tab.on span{color:#fff}
.pl-tab .dot{position:absolute;top:6px;right:8px;width:6px;height:6px;border-radius:50%;background:var(--mustard)}

.pl-ticket{max-width:900px;margin:0 auto;background:var(--paper);border:1px solid var(--line);border-radius:24px;box-shadow:0 24px 60px var(--shadow);display:grid;grid-template-columns:270px 1fr;position:relative;overflow:hidden}
.pl-ticket::before,.pl-ticket::after{content:'';position:absolute;top:50%;transform:translateY(-50%);width:26px;height:26px;border-radius:50%;background:var(--cream);z-index:2}
.pl-ticket::before{left:-13px}.pl-ticket::after{right:-13px}
.pl-t-img{position:relative;overflow:hidden;background:#dbeafe}
.pl-t-img img{width:100%;height:100%;object-fit:cover;min-height:250px}
.pl-t-ribbon{position:absolute;top:14px;left:14px;background:#dbeafe;color:var(--forest-deep);font-size:10px;font-weight:800;letter-spacing:.5px;padding:5px 12px;border-radius:99px;text-transform:uppercase;box-shadow:0 6px 16px rgba(29,95,191,.18)}
.pl-t-body{padding:24px 28px 24px 32px;border-left:2px dashed var(--line);display:flex;flex-direction:column;justify-content:center}
.pl-t-day{font-size:11px;font-weight:800;color:var(--forest);text-transform:uppercase;letter-spacing:1.6px;margin-bottom:8px}
.pl-t-day span{color:var(--muted);font-weight:600;text-transform:none;letter-spacing:0}
.pl-t-dish{font-family:'Fraunces',serif;font-size:24px;font-weight:600;line-height:1.28;margin-bottom:9px}
.pl-t-desc{font-size:12.5px;color:var(--ink-soft);line-height:1.65;margin-bottom:14px}
.pl-t-meta{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px}
.pl-chip{font-size:10.5px;font-weight:700;padding:5px 12px;border-radius:99px;background:var(--cream2);color:var(--forest-deep);border:1px solid var(--line)}
.pl-chip.kcal{background:var(--forest);color:#fff;border-color:transparent}
.pl-ticket-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}
.pl-mini-btn{background:var(--cream2);color:var(--forest-deep);font-size:11px;font-weight:800;border-radius:10px;padding:8px 12px;border:1px solid var(--line)}
.pl-mini-btn:hover{background:#dbeafe;color:#082f68}
.pl-mini-btn.danger{background:#fff1f1;color:#9f1d1d}
.pl-root.dark .pl-mini-btn:hover{background:#1e3a5f;color:#eff6ff}
.pl-root.dark .pl-mini-btn.danger{background:#3a1821;color:#fecaca;border-color:rgba(248,113,113,.24)}
@media(max-width:640px){.pl-ticket{grid-template-columns:1fr;border-radius:24px}.pl-ticket::before,.pl-ticket::after{left:50%;top:auto;transform:translateX(-50%)}.pl-ticket::before{top:-13px}.pl-ticket::after{bottom:-13px;top:auto}.pl-t-img{border-radius:24px 24px 0 0}.pl-t-img img{min-height:190px}.pl-t-body{border-left:none;border-top:2px dashed var(--line);padding:22px 20px}}

.pl-rate-block{border-top:1px dashed var(--line);padding-top:14px}
.pl-rate-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:9px;gap:12px;flex-wrap:wrap}
.pl-rate-avg{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--ink-soft);font-weight:700}
.pl-rate-avg b{color:var(--forest);font-size:14px}
.pl-stars{position:relative;display:inline-flex;gap:4px}
.pl-star-btn{font-size:22px;line-height:1;filter:grayscale(1) opacity(.35);transition:transform .18s cubic-bezier(.34,1.6,.64,1),filter .18s}
.pl-star-btn:hover{transform:scale(1.18)}.pl-star-btn.active{filter:none;transform:scale(1.05)}.pl-star-btn:active{transform:scale(.85)}
.pl-star-btn:disabled{cursor:not-allowed}.pl-star-btn:disabled:hover{transform:none}
.pl-rate-thanks{font-size:11px;font-weight:700;color:var(--forest);display:flex;align-items:center;gap:5px;animation:plUp .3s ease both}
.pl-comments{border-top:1px dashed var(--line);margin-top:14px;padding-top:14px;display:grid;gap:10px}
.pl-comments-head{font-size:12px;font-weight:900;color:var(--forest);letter-spacing:.8px;text-transform:uppercase}
.pl-comment{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;background:var(--cream2);border:1px solid var(--line);border-radius:12px;padding:10px 12px}
.pl-comment b{display:block;font-size:12px;color:var(--ink)}
.pl-comment p{margin:3px 0 0;font-size:12px;line-height:1.55;color:var(--ink-soft)}
.pl-like{flex-shrink:0;border:1px solid var(--line);border-radius:999px;background:var(--paper);color:var(--forest-deep);font-size:11px;font-weight:900;padding:6px 9px}
.pl-like.on{background:#fee2e2;color:#b91c1c;border-color:rgba(185,28,28,.18)}
.pl-comment-form{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px}
.pl-comment-form input{min-width:0;border:1px solid var(--line);border-radius:10px;background:var(--paper);color:var(--ink);padding:10px 12px;font:inherit;font-size:12px}
.pl-comment-form button{border-radius:10px;background:var(--forest);color:#fff;font-size:12px;font-weight:900;padding:10px 13px}
.pl-comment-form button:disabled{opacity:.55;cursor:not-allowed}
.pl-comment-muted,.pl-comment-error{font-size:12px;font-weight:700;color:var(--muted)}
.pl-comment-error{color:#9f1d1d}
.pl-toast{position:fixed;top:84px;right:18px;z-index:650;background:var(--forest-deep);color:#fff;border-radius:14px;padding:12px 14px;font-size:12px;font-weight:800;box-shadow:0 18px 42px rgba(0,0,0,.22)}

.pl-section{padding:52px 24px;max-width:1180px;margin:0 auto}
.pl-sec-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:24px;flex-wrap:wrap}
.pl-sec-eyebrow{font-size:10.5px;font-weight:800;color:var(--mustard-deep);letter-spacing:2px;text-transform:uppercase;margin-bottom:6px}
.pl-sec-h{font-family:'Fraunces',serif;font-size:clamp(20px,2.6vw,28px);font-weight:600}
.pl-sec-sub{font-size:12.5px;color:var(--muted);margin-top:5px}
.pl-status{background:var(--paper);border:1px solid var(--line);border-radius:16px;padding:12px 16px;color:var(--ink-soft);font-size:12px;font-weight:700}

.pl-week-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:14px}
@media(max-width:980px){.pl-week-grid{grid-template-columns:repeat(3,1fr)}}@media(max-width:560px){.pl-week-grid{grid-template-columns:repeat(2,1fr)}.pl-section{padding:42px 16px}}
.pl-week-card{background:var(--paper);border:1px solid var(--line);border-radius:16px;overflow:hidden;cursor:pointer;transition:transform .2s,box-shadow .2s,border-color .2s;opacity:0;transform:translateY(16px);position:relative}
.pl-week-card.in{opacity:1;transform:none}
.pl-week-card:hover{transform:translateY(-4px);box-shadow:0 16px 34px var(--shadow);border-color:var(--forest)}
.pl-week-card.active{border-color:var(--forest);box-shadow:0 0 0 2px rgba(29,95,191,.18),0 18px 36px rgba(29,95,191,.14)}
.pl-wc-img{position:relative;height:112px}
.pl-wc-img img{width:100%;height:100%;object-fit:cover}
.pl-wc-badge{position:absolute;top:8px;left:8px;background:rgba(11,50,111,.78);color:#fff;font-size:9px;font-weight:800;letter-spacing:.5px;padding:3px 8px;border-radius:99px}
.pl-wc-badge.esp{background:var(--mustard);color:var(--forest-deep)}
.pl-wc-rate{position:absolute;bottom:8px;right:8px;background:rgba(255,255,255,.92);color:var(--forest-deep);font-size:9.5px;font-weight:800;padding:3px 7px;border-radius:99px;display:flex;align-items:center;gap:3px}
.pl-wc-body{padding:11px 12px 13px}
.pl-wc-day{font-size:9.5px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:3px}
.pl-wc-dish{font-size:11.8px;font-weight:700;line-height:1.4;color:var(--ink)}
.pl-wc-actions{position:absolute;top:8px;right:8px;display:flex;gap:6px;z-index:3}
.pl-icon-btn{width:30px;height:30px;border-radius:999px;background:rgba(255,255,255,.94);box-shadow:0 6px 16px rgba(0,0,0,.16);font-size:13px;display:flex;align-items:center;justify-content:center;color:var(--forest-deep)}
.pl-icon-btn svg{width:14px;height:14px}
.pl-icon-btn.danger{color:#9f1d1d}
.pl-empty{background:var(--paper);border:1px dashed var(--line);border-radius:22px;padding:28px;text-align:center;color:var(--ink-soft);font-size:13px;font-weight:700}

.pl-filter-row{display:flex;gap:9px;overflow-x:auto;padding:2px 0 24px;scrollbar-width:none}
.pl-filter-row::-webkit-scrollbar{display:none}
.pl-filter{flex-shrink:0;padding:10px 14px;border-radius:999px;background:var(--paper);border:1px solid var(--line);color:var(--ink-soft);font-size:12px;font-weight:800}
.pl-filter.on{background:var(--forest);color:#fff;border-color:var(--forest);box-shadow:0 10px 24px rgba(47,82,51,.22)}
.pl-root.dark .pl-filter.on,.pl-root.dark .pl-tab.on,.pl-root.dark .pl-primary,.pl-root.dark .pl-call-btn,.pl-root.dark .pl-save,.pl-root.dark .pl-fab{background:#2563eb;color:#fff}
.pl-root.dark .pl-chip.kcal{background:#2563eb;color:#fff}
.pl-root.dark .pl-admin-link{background:#17365f;color:#dbeafe}
.pl-root.dark .pl-wc-rate{background:rgba(17,29,49,.94);color:#dbeafe}

.pl-desserts-rail{display:flex;gap:16px;overflow-x:auto;padding-bottom:6px;scrollbar-width:none}.pl-desserts-rail::-webkit-scrollbar{display:none}
@media(min-width:900px){.pl-desserts-rail{display:grid;grid-template-columns:repeat(5,1fr);overflow-x:visible}}
.pl-d-card{flex-shrink:0;width:160px;opacity:0;transform:translateY(14px);transition:opacity .5s,transform .5s}
@media(min-width:900px){.pl-d-card{width:auto}}.pl-d-card.in{opacity:1;transform:none}
.pl-d-img{position:relative;height:130px;border-radius:18px;overflow:hidden;margin-bottom:10px}.pl-d-img img{width:100%;height:100%;object-fit:cover}
.pl-d-emoji{position:absolute;bottom:8px;left:8px;background:var(--paper);width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 4px 10px var(--shadow)}
.pl-d-name{font-size:13px;font-weight:700;color:var(--ink)}.pl-d-sub{font-size:11px;color:var(--muted);margin-top:2px}

.pl-feat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
@media(max-width:860px){.pl-feat-grid{grid-template-columns:1fr 1fr}}@media(max-width:480px){.pl-feat-grid{grid-template-columns:1fr}}
.pl-feat-card{background:var(--paper);border:1px solid var(--line);border-radius:16px;padding:24px 20px;transition:transform .2s,box-shadow .2s}
.pl-feat-card:hover{transform:translateY(-4px);box-shadow:0 16px 34px var(--shadow)}
.pl-f-ico{width:38px;height:38px;border-radius:12px;background:var(--cream2);color:var(--forest);font-size:12px;font-weight:800;margin-bottom:13px;display:flex;align-items:center;justify-content:center}.pl-f-t{font-size:13.5px;font-weight:700;margin-bottom:5px}.pl-f-d{font-size:11.5px;color:var(--muted);line-height:1.65}

.pl-stats{background:linear-gradient(135deg,#082b61,#155fc7);padding:52px 24px;text-align:center;color:#fff}
.pl-stats-inner{max-width:760px;margin:0 auto}.pl-stats h3{font-family:'Fraunces',serif;font-size:clamp(22px,3vw,30px);font-weight:600;margin-bottom:10px}
.pl-stats p{font-size:13.5px;color:rgba(255,255,255,.72);line-height:1.7;max-width:520px;margin:0 auto}
.pl-s-row{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:24px}.pl-s-box{border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.1);border-radius:16px;padding:18px 12px}.pl-s-box strong{display:block;font-size:26px;font-weight:800;line-height:1}.pl-s-lbl{display:block;margin-top:8px;font-size:10px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,.68)}

.pl-foot{padding:40px 24px 90px;background:var(--cream)}.pl-foot-inner{max-width:1180px;margin:0 auto;display:flex;flex-wrap:wrap;gap:24px;align-items:center;justify-content:space-between;border-top:1px solid var(--line);padding-top:24px}.pl-foot-brand{display:flex;align-items:center;gap:10px}.pl-foot-copy{font-size:11px;color:var(--muted)}
.pl-fab{position:fixed;bottom:82px;right:16px;width:44px;height:44px;border-radius:50%;background:var(--forest);color:#fff;font-size:17px;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 22px rgba(47,82,51,.35);opacity:0;pointer-events:none;transition:opacity .3s,transform .2s;z-index:199}.pl-fab.vis{opacity:1;pointer-events:auto}
@media(min-width:769px){.pl-fab{bottom:24px;right:24px}}
.pl-bnav{display:none;position:fixed;bottom:0;left:0;right:0;background:rgba(255,255,255,0.96);backdrop-filter:blur(16px);border-top:1px solid var(--line);justify-content:space-around;align-items:center;height:64px;z-index:200}
.pl-root.dark .pl-bnav{background:rgba(13,22,40,.96)}
@media(max-width:768px){.pl-bnav{display:flex}.pl-foot{padding-bottom:100px}}
.pl-bn-item{display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 14px;border-radius:14px;font-size:9.5px;font-weight:700;color:var(--muted);transition:transform .15s}.pl-bn-ico{font-size:19px;filter:grayscale(1) opacity(.55)}.pl-bn-item.on{color:var(--forest)}.pl-bn-item.on .pl-bn-ico{filter:none}

.pl-modal-bg{position:fixed;inset:0;z-index:500;background:rgba(8,30,68,.58);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:20px}
.pl-modal,.pl-edit{width:min(100%,720px);max-height:92vh;overflow:auto;background:var(--paper);border-radius:28px;box-shadow:0 30px 80px rgba(0,0,0,.32);border:1px solid rgba(255,255,255,.55)}
.pl-modal-img{height:260px;position:relative;overflow:hidden;border-radius:28px 28px 0 0}.pl-modal-img img{width:100%;height:100%;object-fit:cover}.pl-modal-fade{position:absolute;inset:0;background:linear-gradient(to top,rgba(32,40,31,.78),transparent 62%)}
.pl-close{position:absolute;top:14px;right:14px;width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.92);font-weight:800;color:var(--forest-deep);z-index:2}
.pl-modal-title{position:absolute;left:24px;right:70px;bottom:22px;color:#fff}.pl-modal-title span{font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase}.pl-modal-title h2{font-family:'Fraunces',serif;font-size:30px;line-height:1.15;margin:6px 0 0}
.pl-modal-body{padding:24px}.pl-modal-body p{font-size:14px;line-height:1.7;color:var(--ink-soft)}
.pl-modal-stats{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:20px}.pl-modal-stat{background:var(--cream2);border:1px solid var(--line);border-radius:18px;padding:16px}.pl-modal-stat b{display:block;font-size:11px;color:var(--muted);letter-spacing:1.2px}.pl-modal-stat span{display:block;font-size:18px;color:var(--forest-deep);font-weight:800;margin-top:6px}
.pl-edit{padding:24px}.pl-edit-top{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:18px}.pl-edit-top h2{font-family:'Fraunces',serif;margin:4px 0 0}.pl-edit-over{font-size:10px;font-weight:800;color:var(--mustard-deep);letter-spacing:2px}
.pl-field{display:grid;gap:7px;margin-bottom:14px}.pl-field span{font-size:11px;font-weight:800;color:var(--forest);letter-spacing:.8px}.pl-field input,.pl-field textarea,.pl-field select{width:100%;border:1px solid var(--line);background:var(--cream);border-radius:14px;padding:12px 13px;color:var(--ink);font:inherit;font-size:13px;outline:none}.pl-edit-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.pl-edit-preview{width:100%;height:170px;object-fit:cover;border-radius:16px;margin:8px 0 14px}.pl-error{background:#fff1f1;color:#9f1d1d;border:1px solid rgba(159,29,29,.18);border-radius:14px;padding:10px 12px;font-size:12px;font-weight:700}.pl-edit-actions{display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap}.pl-ghost,.pl-save{border-radius:999px;padding:11px 15px;font-size:12px;font-weight:800}.pl-ghost{background:var(--cream2);color:var(--forest-deep)}.pl-save{background:var(--forest);color:#fff}.pl-save:disabled{opacity:.6;cursor:not-allowed}
.pl-root.dark .pl-field input,.pl-root.dark .pl-field textarea,.pl-root.dark .pl-field select{background:#0b1322;color:#eff6ff}
.pl-root.dark .pl-modal,.pl-root.dark .pl-edit{border-color:rgba(147,197,253,.18)}
.pl-undo{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:600;background:var(--forest-deep);color:#fff;border-radius:18px;padding:14px 16px;box-shadow:0 18px 42px rgba(0,0,0,.28);display:flex;align-items:center;gap:18px;max-width:min(92vw,560px)}.pl-undo strong{display:block;font-size:13px}.pl-undo span{display:block;font-size:11px;color:rgba(255,255,255,.7);margin-top:2px}.pl-undo button{background:var(--mustard);color:var(--forest-deep);border-radius:999px;padding:9px 12px;font-size:11px;font-weight:800;white-space:nowrap}.pl-undo--error{background:#7f1d1d}
@media(max-width:560px){.pl-edit-grid,.pl-modal-stats,.pl-s-row{grid-template-columns:1fr}.pl-modal-img{height:210px}.pl-modal-title h2{font-size:24px}.pl-undo{align-items:flex-start;flex-direction:column;bottom:76px}.pl-undo button{width:100%}}
@media(prefers-reduced-motion:reduce){.pl-root *{animation-duration:.001ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important;transition-duration:.001ms!important}.pl-week-card,.pl-d-card{opacity:1;transform:none}}
`;

function useReveal() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return [ref, inView];
}

function Reveal({ as: Tag = "div", className = "", delay = 0, children, ...rest }) {
  const [ref, inView] = useReveal();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!inView) return undefined;
    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [inView, delay]);

  return (
    <Tag ref={ref} className={`${className}${show ? " in" : ""}`} {...rest}>
      {children}
    </Tag>
  );
}

function CountUp({ target, suffix = "" }) {
  const value = Number(target || 0);
  const formatted = Number.isInteger(value) ? value : value.toFixed(1);

  return <strong>{formatted}{suffix}</strong>;
}

function StarRating({ item, canInteract, summary, onRated }) {
  const [hover, setHover] = useState(0);
  const userRating = summary?.minhaNota || 0;
  const avg = Number(summary?.media || 0);
  const label = summary?.textoQuantidade || `${summary?.quantidade || 0} pessoas avaliaram`;

  const rate = async (val) => {
    if (!canInteract || userRating) return;
    await onRated?.(item, val);
  };

  return (
    <div className="pl-rate-block">
      <div className="pl-rate-head">
        <div className="pl-rate-avg">
          <b>★ {avg.toFixed(1)}</b> ({label})
        </div>
        {userRating > 0 && <div className="pl-rate-thanks">✓ Obrigado pela nota!</div>}
      </div>
      <div className="pl-stars">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={`pl-star-btn${n <= (hover || userRating) ? " active" : ""}`}
            disabled={!canInteract || !!userRating}
            onMouseEnter={() => canInteract && !userRating && setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => rate(n)}
            aria-label={`Avaliar com ${n} estrelas`}
            title={!canInteract ? "Faça login para avaliar" : undefined}
          >
            {n <= (hover || userRating) ? "★" : "☆"}
          </button>
        ))}
      </div>
    </div>
  );
}

function CommentsBlock({ item, canInteract, onUnauthorized }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadComments = useCallback(async () => {
    if (!item?.id) return;
    setLoading(true);
    setError("");

    try {
      const response = await api.get(`/refeicao/${item.id}/comentarios`);
      setComments(response.data || []);
    } catch {
      setComments([]);
      setError("Nao foi possivel carregar os comentarios.");
    } finally {
      setLoading(false);
    }
  }, [item?.id]);

  useEffect(() => {
    setText("");
    loadComments();
  }, [loadComments]);

  const submit = async (event) => {
    event.preventDefault();
    if (!canInteract) {
      onUnauthorized?.("Faça login para comentar.");
      return;
    }
    if (!text.trim()) return;

    setSaving(true);
    setError("");
    try {
      const response = await api.post(`/refeicao/${item.id}/comentarios`, { texto: text.trim() });
      setComments((current) => [...current, response.data]);
      setText("");
    } catch (err) {
      setError(err.response?.data?.message || "Nao foi possivel comentar.");
    } finally {
      setSaving(false);
    }
  };

  const like = async (comment) => {
    if (!canInteract) {
      onUnauthorized?.("Faça login para curtir comentarios.");
      return;
    }

    try {
      const response = await api.post(`/refeicao/comentarios/${comment.id}/likes`);
      setComments((current) => current.map((item) => (
        item.id === comment.id ? response.data : item
      )));
    } catch (err) {
      setError(err.response?.data?.message || "Nao foi possivel curtir.");
    }
  };

  return (
    <div className="pl-comments">
      <div className="pl-comments-head">Comentários</div>
      {loading && <div className="pl-comment-muted">Carregando comentários...</div>}
      {!loading && comments.length === 0 && <div className="pl-comment-muted">0 comentários</div>}
      {comments.map((comment) => (
        <div className="pl-comment" key={comment.id}>
          <div>
            <b>{comment.usuarioNome}</b>
            <p>{comment.texto}</p>
          </div>
          <button
            type="button"
            className={`pl-like${comment.curtidoPorMim ? " on" : ""}`}
            onClick={() => like(comment)}
            title={canInteract ? "Curtir comentario" : "Faça login para curtir"}
          >
            ♥ {comment.likes || 0}
          </button>
        </div>
      ))}
      <form className="pl-comment-form" onSubmit={submit}>
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={canInteract ? "Escreva um comentário" : "Faça login para comentar"}
          disabled={!canInteract || saving}
        />
        <button type="submit" disabled={!canInteract || saving || !text.trim()}>
          {saving ? "Enviando..." : "Enviar"}
        </button>
      </form>
      {error && <div className="pl-comment-error">{error}</div>}
    </div>
  );
}

function MealDetailsModal({ item, onClose }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="pl-modal-bg" onClick={onClose}>
      <div className="pl-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pl-modal-img">
          <img src={item.image} alt={item.name} />
          <div className="pl-modal-fade" />
          <button type="button" className="pl-close" onClick={onClose}>X</button>
          <div className="pl-modal-title">
            <span>Semana {item.semana} · {item.trimestre}º trimestre · {getTypeMeta(item.tipo).label}</span>
            <h2>{item.name}</h2>
          </div>
        </div>
        <div className="pl-modal-body">
          <p>{item.description}</p>
          <div className="pl-modal-stats">
            <div className="pl-modal-stat">
              <b>CALORIAS</b>
              <span>{item.calories} kcal</span>
            </div>
            <div className="pl-modal-stat">
              <b>CATEGORIA</b>
              <span>{item.tag}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditMealModal({ item, onClose, onSave }) {
  const [form, setForm] = useState({
    name: item.name || "",
    trimestre: item.trimestre || WEEK_ANCHOR.trimestre,
    semana: item.semana || WEEK_ANCHOR.semana,
    tipo: normalizeType(item.tipo),
    description: item.description || "",
    calories: item.calories || 0,
    image: item.image || item.imageUrl || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      await onSave({
        ...item,
        ...form,
        trimestre: Number(form.trimestre),
        semana: Number(form.semana),
        tipo: normalizeType(form.tipo),
        calories: Number(form.calories) || 0,
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Nao foi possivel salvar a refeicao");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pl-modal-bg" onClick={onClose}>
      <form className="pl-edit" onSubmit={submit} onClick={(e) => e.stopPropagation()}>
        <div className="pl-edit-top">
          <div>
            <span className="pl-edit-over">ADMIN</span>
            <h2>Editar prato</h2>
          </div>
          <button type="button" className="pl-close" onClick={onClose}>X</button>
        </div>

        <label className="pl-field">
          <span>Nome</span>
          <input value={form.name} onChange={(e) => update("name", e.target.value)} required />
        </label>

        <label className="pl-field">
          <span>Descricao</span>
          <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows="4" required />
        </label>

        <div className="pl-edit-grid">
          <label className="pl-field">
            <span>Trimestre</span>
            <select value={form.trimestre} onChange={(e) => update("trimestre", Number(e.target.value))}>
              {[1, 2, 3, 4].map((trimestre) => (
                <option key={trimestre} value={trimestre}>{trimestre}º trimestre</option>
              ))}
            </select>
          </label>

          <label className="pl-field">
            <span>Semana</span>
            <input
              type="number"
              min="1"
              max="60"
              value={form.semana}
              onChange={(e) => update("semana", e.target.value)}
              required
            />
          </label>
        </div>

        <div className="pl-edit-grid">
          <label className="pl-field">
            <span>Tipo</span>
            <select value={form.tipo} onChange={(e) => update("tipo", e.target.value)}>
              {MEAL_TYPES.map((type) => (
                <option key={type.key} value={type.key}>{type.label}</option>
              ))}
            </select>
          </label>

          <label className="pl-field">
            <span>Calorias</span>
            <input
              type="number"
              min="0"
              value={form.calories}
              onChange={(e) => update("calories", e.target.value)}
              required
            />
          </label>
        </div>

        <label className="pl-field">
          <span>Imagem URL</span>
          <input value={form.image} onChange={(e) => update("image", e.target.value)} />
        </label>

        {form.image && <img className="pl-edit-preview" src={form.image} alt="Previa da refeicao" />}
        {error && <p className="pl-error">{error}</p>}

        <div className="pl-edit-actions">
          <button type="button" className="pl-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="pl-save" disabled={saving}>
            {saving ? "Salvando..." : "Salvar alteracoes"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function Refeicoes() {
  const [splashGone, setSplashGone] = useState(false);
  const [splashRemoved, setSplashRemoved] = useState(false);
  const [theme, setTheme] = useState(getInitialTheme);
  const [refeicoes, setRefeicoes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [undoDelete, setUndoDelete] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [navOn, setNavOn] = useState("hoje");
  const [fabVis, setFabVis] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [loadingMeals, setLoadingMeals] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [ratingSummaries, setRatingSummaries] = useState({});
  const [filter, setFilter] = useState("Todos");

  const introRef = useRef(null);
  const semanaRef = useRef(null);
  const sobreRef = useRef(null);
  const undoTimerRef = useRef(null);
  const isAdmin = isAdminRole(localStorage.getItem("role"));
  const isAuthenticated = Boolean(localStorage.getItem("token")) && localStorage.getItem("authMode") !== "guest";
  const currentWeek = useMemo(() => getCurrentWeekInfo(), []);

  useEffect(() => {
    localStorage.setItem("cardapio-theme", theme);
  }, [theme]);

  useEffect(() => {
    const t1 = setTimeout(() => setSplashGone(true), 650);
    const t2 = setTimeout(() => setSplashRemoved(true), 1050);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoadingMeals(true);

    api
      .get("/refeicao")
      .then((response) => {
        if (!mounted) return;
        const meals = response.data.map(normalizeRefeicao).sort(sortByDay);
        setRefeicoes(meals);
        setActiveId((current) => current || meals[0]?.id || null);
        setFetchError("");
      })
      .catch(() => {
        if (!mounted) return;
        setRefeicoes([]);
        setActiveId(null);
        setFetchError("Nao foi possivel carregar as refeicoes do banco de dados agora.");
      })
      .finally(() => {
        if (mounted) setLoadingMeals(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const currentWeekMeals = useMemo(() => (
    refeicoes.filter((refeicao) => (
      refeicao.trimestre === currentWeek.trimestre && refeicao.semana === currentWeek.semana
    ))
  ), [currentWeek.semana, currentWeek.trimestre, refeicoes]);

  useEffect(() => {
    if (currentWeekMeals.length === 0) {
      setRatingSummaries({});
      return undefined;
    }

    let mounted = true;
    Promise.all(
      currentWeekMeals.map((meal) => (
        api.get(`/refeicao/${meal.id}/avaliacoes`)
          .then((response) => [meal.id, response.data])
          .catch(() => [meal.id, { media: 0, quantidade: 0, textoQuantidade: "0 pessoas avaliaram" }])
      ))
    ).then((entries) => {
      if (!mounted) return;
      setRatingSummaries(Object.fromEntries(entries));
    });

    return () => {
      mounted = false;
    };
  }, [currentWeekMeals]);

  useEffect(() => {
    const onScroll = () => setFabVis(window.scrollY > 260);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 1900);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  const filtered = useMemo(() => {
    if (filter === "Todos") return currentWeekMeals;
    return currentWeekMeals.filter((refeicao) => refeicao.dayWeek === filter);
  }, [currentWeekMeals, filter]);

  const availableDays = useMemo(() => {
    const unique = [...new Set(currentWeekMeals.map((refeicao) => refeicao.dayWeek))];
    return unique.sort((a, b) => (DAY_META[a]?.order || 99) - (DAY_META[b]?.order || 99));
  }, [currentWeekMeals]);

  const activeMeal = useMemo(() => (
    currentWeekMeals.find((refeicao) => refeicao.id === activeId) || filtered[0] || currentWeekMeals[0] || null
  ), [activeId, currentWeekMeals, filtered]);

  const sections = useMemo(() => (
    MEAL_TYPES.map((type) => ({
      ...type,
      meals: currentWeekMeals.filter((meal) => normalizeType(meal.tipo) === type.key),
    })).filter((section) => section.meals.length > 0)
  ), [currentWeekMeals]);

  const stats = useMemo(() => {
    const summaries = Object.values(ratingSummaries);
    const totalRatings = summaries.reduce((total, summary) => total + Number(summary?.quantidade || 0), 0);
    const ratingSum = summaries.reduce((total, summary) => {
      const quantidade = Number(summary?.quantidade || 0);
      const media = Number(summary?.media || 0);
      return total + (quantidade * media);
    }, 0);
    const averageRating = totalRatings > 0 ? ratingSum / totalRatings : 0;

    return [
      { t: currentWeekMeals.length, s: "", lbl: "refeicoes da semana" },
      { t: availableDays.length, s: "", lbl: "dias com cardapio" },
      { t: totalRatings > 0 ? averageRating : 0, s: "/5", lbl: totalRatings > 0 ? "media das avaliacoes" : "sem avaliacoes ainda" },
    ];
  }, [availableDays.length, currentWeekMeals.length, ratingSummaries]);

  const scrollToRef = (ref, key) => {
    setNavOn(key);
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const pickMeal = (meal) => {
    setActiveId(meal.id);
    setFilter(meal.dayWeek);
    introRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setNavOn("hoje");
  };

  const handleRated = async (meal, val) => {
    if (!isAuthenticated) {
      setToast("Faça login para avaliar comidas.");
      return;
    }

    try {
      const response = await api.post(`/refeicao/${meal.id}/avaliacoes`, { nota: val });
      setRatingSummaries((current) => ({ ...current, [meal.id]: response.data }));
      setToast(`Nota ${val} enviada para ${meal.name}!`);
    } catch (err) {
      setToast(err.response?.data?.message || "Nao foi possivel avaliar agora.");
    }
  };

  const handleSaveMeal = async (meal) => {
    const response = await api.put(`/refeicao/${meal.id}`, toBackendRefeicao(meal));
    const updated = normalizeRefeicao(response.data);

    setRefeicoes((current) => current.map((refeicao) => (
      refeicao.id === updated.id ? updated : refeicao
    )).sort(sortByDay));
    setSelected((current) => current?.id === updated.id ? updated : current);
    setActiveId(updated.id);
  };

  const handleDeleteMeal = async (meal) => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);

    setRefeicoes((current) => current.filter((refeicao) => refeicao.id !== meal.id));
    setSelected((current) => current?.id === meal.id ? null : current);
    setEditing((current) => current?.id === meal.id ? null : current);
    setUndoDelete({ meal, status: "pending" });

    try {
      await api.delete(`/refeicao/${meal.id}`);
      undoTimerRef.current = setTimeout(() => {
        setUndoDelete(null);
        undoTimerRef.current = null;
      }, 5000);
    } catch (err) {
      setRefeicoes((current) => (
        current.some((refeicao) => refeicao.id === meal.id)
          ? current
          : [...current, meal].sort(sortByDay)
      ));
      setUndoDelete({
        meal,
        status: "error",
        message: err.response?.data?.message || "Nao foi possivel remover a refeicao",
      });
    }
  };

  const handleUndoDelete = async () => {
    if (!undoDelete?.meal) return;
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }

    const meal = undoDelete.meal;
    setUndoDelete({ meal, status: "restoring" });

    try {
      const response = await api.post("/refeicao", toBackendRefeicao(meal));
      const restored = normalizeRefeicao(response.data);
      setRefeicoes((current) => (
        current.some((refeicao) => refeicao.id === restored.id)
          ? current
          : [...current, restored].sort(sortByDay)
      ));
      setActiveId(restored.id);
      setUndoDelete(null);
    } catch (err) {
      setUndoDelete({
        meal,
        status: "error",
        message: err.response?.data?.message || "Nao foi possivel desfazer a remocao",
      });
    }
  };

  const openEdit = useCallback((event, meal) => {
    event.stopPropagation();
    setEditing(meal);
  }, []);

  const deleteMeal = useCallback((event, meal) => {
    event.stopPropagation();
    handleDeleteMeal(meal);
  }, []);

  return (
    <div className={`pl-root ${theme}`}>
      <style>{CSS}</style>

      {!splashRemoved && (
        <div id="pl-splash" className={splashGone ? "gone" : ""}>
          <div className="pl-sp-mark">🍃</div>
          <div className="pl-sp-name">Polivalente</div>
          <div className="pl-sp-sub">Semana {currentWeek.semana} - {currentWeek.trimestre}º Trimestre</div>
          <div className="pl-sp-bar"><div className="pl-sp-fill" /></div>
        </div>
      )}

      {toast && <div className="pl-toast">{toast}</div>}

      <header className="pl-topbar">
        <div className="pl-tb-inner">
          <div className="pl-brand">
            <div className="pl-mark">🍃</div>
            <div className="pl-words">
              <b>Polivalente</b>
              <small>Semana {currentWeek.semana} - {currentWeek.trimestre}º Trimestre</small>
            </div>
          </div>
          <nav className="pl-tb-nav">
            <button type="button" className={navOn === "hoje" ? "on" : ""} onClick={() => scrollToRef(introRef, "hoje")}>Hoje</button>
            <button type="button" className={navOn === "semana" ? "on" : ""} onClick={() => scrollToRef(semanaRef, "semana")}>Semana</button>
            <button type="button" className={navOn === "sobre" ? "on" : ""} onClick={() => scrollToRef(sobreRef, "sobre")}>Sobre</button>
            {isAdmin && <Link className="pl-admin-link" to="/admin">Painel admin</Link>}
          </nav>
          <div className="pl-top-actions">
            <button
              type="button"
              className="pl-theme-btn"
              onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
              aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
              title={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
            >
              {theme === "dark" ? <FiSun aria-hidden="true" /> : <FiMoon aria-hidden="true" />}
            </button>
            <button type="button" className="pl-call-btn" onClick={() => setContactOpen((open) => !open)}>
              <span>📞</span> Contato da escola {contactOpen ? "▲" : "▼"}
            </button>
          </div>
        </div>

        <div className={`pl-reveal-wrap${contactOpen ? " open" : ""}`}>
          <div className="pl-reveal-inner">
            <div className="pl-contact-card">
              <div className="pl-contact-item">
                <div className="pl-contact-ico">📞</div>
                <div><b>{SCHOOL_PHONE}</b><span>Toque para ligar</span></div>
              </div>
              <div className="pl-contact-item">
                <div className="pl-contact-ico">🕐</div>
                <div><b>{SCHOOL_HOURS}</b><span>Horario de funcionamento</span></div>
              </div>
              <div className="pl-contact-item">
                <div className="pl-contact-ico">📍</div>
                <div><b>{SCHOOL_ADDRESS}</b><span>Endereco</span></div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="pl-hero hero" ref={introRef}>
        <div className="pl-hero-inner">
          <div>
            <span className="pl-eyebrow">Semana {currentWeek.semana} — {currentWeek.trimestre}º Trimestre</span>
            <h1>O que tem para <em>comer</em> nesta semana?</h1>
            <p>
              Cardapio elaborado por nutricionistas, com ingredientes frescos e selecionados.
              Toque em um dia para ver a refeicao completa, comentarios e avaliacoes reais.
            </p>
            <div className="pl-hero-actions">
              <button type="button" className="pl-primary" onClick={() => scrollToRef(semanaRef, "semana")}>Ver semana</button>
              {isAdmin && <Link className="pl-secondary" to="/admin">Publicar comida</Link>}
            </div>
          </div>

          <div className="pl-model-wrap">
            <div className="pl-model-card">
              <Suspense fallback={<div className="vegetable-model vegetable-model--loading" />}>
                <VegetableModel />
              </Suspense>
            </div>
          </div>
        </div>
      </section>

      <section className="pl-section">
        <div className="pl-tabs">
          {availableDays.map((day) => (
            <button
              key={day}
              type="button"
              className={`pl-tab${activeMeal?.dayWeek === day ? " on" : ""}`}
              onClick={() => {
                setFilter(day);
                const meal = currentWeekMeals.find((refeicao) => refeicao.dayWeek === day);
                if (meal) setActiveId(meal.id);
              }}
            >
              {currentWeekMeals.some((meal) => meal.dayWeek === day && normalizeType(meal.tipo) !== "ALMOCO") && <span className="dot" />}
              <b>{DAY_META[day]?.short || day.slice(0, 3).toUpperCase()}</b>
              <span>{DAY_META[day]?.date || ""}</span>
            </button>
          ))}
        </div>

        {fetchError && <div className="pl-status">{fetchError}</div>}
        {loadingMeals && <div className="pl-status">Carregando refeicoes...</div>}
        {!loadingMeals && !activeMeal && (
          <div className="pl-empty">
            Nenhuma refeicao cadastrada para a Semana {currentWeek.semana} — {currentWeek.trimestre}º Trimestre.
            {isAdmin && " Use o painel admin para publicar a primeira comida."}
          </div>
        )}

        {activeMeal && (
          <div className="pl-ticket">
            <div className="pl-t-img">
              {normalizeType(activeMeal.tipo) !== "ALMOCO" && <span className="pl-t-ribbon">{getTypeMeta(activeMeal.tipo).label}</span>}
              <img src={activeMeal.image} alt={activeMeal.name} />
            </div>
            <div className="pl-t-body">
              <div className="pl-t-day">{activeMeal.dayWeek} <span>· {getTypeMeta(activeMeal.tipo).itemLabel}</span></div>
              <div className="pl-t-dish serif">{activeMeal.name}</div>
              <div className="pl-t-desc">{activeMeal.description}</div>
              <div className="pl-t-meta">
                <span className="pl-chip kcal">🔥 {activeMeal.calories} kcal</span>
                <span className="pl-chip">{getTypeMeta(activeMeal.tipo).label}</span>
                {activeMeal.price && <span className="pl-chip">{activeMeal.price}</span>}
              </div>
              <StarRating
                item={activeMeal}
                canInteract={isAuthenticated}
                summary={ratingSummaries[activeMeal.id]}
                onRated={handleRated}
              />
              <CommentsBlock
                item={activeMeal}
                canInteract={isAuthenticated}
                onUnauthorized={setToast}
              />
              <div className="pl-ticket-actions">
                <button type="button" className="pl-mini-btn" onClick={() => setSelected(activeMeal)}>Ver detalhes</button>
                {isAdmin && (
                  <>
                    <button type="button" className="pl-mini-btn" onClick={() => setEditing(activeMeal)}>Editar</button>
                    <button type="button" className="pl-mini-btn danger" onClick={() => handleDeleteMeal(activeMeal)}>Remover</button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="pl-section" ref={semanaRef}>
        <div className="pl-sec-head">
          <div>
            <div className="pl-sec-eyebrow">Visao geral</div>
            <div className="pl-sec-h">Semana {currentWeek.semana} — {currentWeek.trimestre}º Trimestre</div>
            <div className="pl-sec-sub">Dados antigos continuam no banco; aqui aparece a semana atual.</div>
          </div>
        </div>

        <div className="pl-filter-row">
          {["Todos", ...availableDays].map((day) => (
            <button
              key={day}
              type="button"
              className={`pl-filter${filter === day ? " on" : ""}`}
              onClick={() => setFilter(day)}
            >
              {day}
            </button>
          ))}
        </div>

        <div className="pl-week-grid">
          {filtered.map((meal, index) => (
            <Reveal
              as="article"
              key={meal.id}
              className={`pl-week-card${meal.id === activeMeal?.id ? " active" : ""}`}
              delay={index * 70}
              onClick={() => pickMeal(meal)}
            >
              {isAdmin && (
                <div className="pl-wc-actions">
                  <button type="button" className="pl-icon-btn" title={`Editar ${meal.name}`} aria-label={`Editar ${meal.name}`} onClick={(event) => openEdit(event, meal)}><FiEdit2 /></button>
                  <button type="button" className="pl-icon-btn danger" title={`Remover ${meal.name}`} aria-label={`Remover ${meal.name}`} onClick={(event) => deleteMeal(event, meal)}><FiTrash2 /></button>
                </div>
              )}
              <div className="pl-wc-img">
                <span className={`pl-wc-badge${normalizeType(meal.tipo) !== "ALMOCO" ? " esp" : ""}`}>
                  {getTypeMeta(meal.tipo).label}
                </span>
                <span className="pl-wc-rate">★ {Number(ratingSummaries[meal.id]?.media || 0).toFixed(1)}</span>
                <img src={meal.image} alt={meal.name} />
              </div>
              <div className="pl-wc-body">
                <div className="pl-wc-day">{meal.dayWeek}</div>
                <div className="pl-wc-dish">{meal.name}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="pl-section" ref={sobreRef}>
        <div className="pl-sec-head">
          <div>
            <div className="pl-sec-eyebrow">Por que a Polivalente</div>
            <div className="pl-sec-h">Nutricao que transforma o aprendizado</div>
          </div>
        </div>
        <div className="pl-feat-grid">
          {FEATURES.map((feature) => (
            <div className="pl-feat-card" key={feature.t}>
              <span className="pl-f-ico">{feature.ico}</span>
              <div className="pl-f-t">{feature.t}</div>
              <div className="pl-f-d">{feature.d}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="pl-stats">
        <div className="pl-stats-inner">
          <h3 className="serif">Comer bem e aprender melhor</h3>
          <p>Uma escola que cuida da alimentacao cuida do futuro dos seus alunos. Cada refeicao e um investimento no aprendizado.</p>
          <div className="pl-s-row">
            {stats.map((stat) => (
              <div className="pl-s-box" key={stat.lbl}>
                <CountUp target={stat.t} suffix={stat.s} />
                <span className="pl-s-lbl">{stat.lbl}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="pl-foot">
        <div className="pl-foot-inner">
          <div className="pl-foot-brand">
            <div className="pl-mark">🍃</div>
            <div className="pl-words"><b>Polivalente</b><small>Escola que Transforma</small></div>
          </div>
          <div className="pl-foot-copy">© 2025 Polivalente Escola. Cardapio sujeito a alteracoes.</div>
        </div>
      </footer>

      <button type="button" className={`pl-fab${fabVis ? " vis" : ""}`} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>↑</button>

      <div className="pl-bnav">
        <button type="button" className={`pl-bn-item${navOn === "hoje" ? " on" : ""}`} onClick={() => scrollToRef(introRef, "hoje")}>
          <span className="pl-bn-ico">🍽️</span>Hoje
        </button>
        <button type="button" className={`pl-bn-item${navOn === "semana" ? " on" : ""}`} onClick={() => scrollToRef(semanaRef, "semana")}>
          <span className="pl-bn-ico">📅</span>Semana
        </button>
        <button type="button" className={`pl-bn-item${navOn === "sobre" ? " on" : ""}`} onClick={() => scrollToRef(sobreRef, "sobre")}>
          <span className="pl-bn-ico">ℹ️</span>Sobre
        </button>
      </div>

      {selected && <MealDetailsModal item={selected} onClose={() => setSelected(null)} />}
      {editing && <EditMealModal item={editing} onClose={() => setEditing(null)} onSave={handleSaveMeal} />}

      {undoDelete && (
        <div className={`pl-undo pl-undo--${undoDelete.status}`} role="status">
          <div>
            <strong>{undoDelete.status === "error" ? "Algo deu errado" : "Refeicao removida"}</strong>
            <span>{undoDelete.message || `${undoDelete.meal.name} saiu do cardapio.`}</span>
          </div>
          {undoDelete.status !== "error" && (
            <button
              type="button"
              onClick={handleUndoDelete}
              disabled={undoDelete.status === "restoring"}
            >
              {undoDelete.status === "restoring" ? "Restaurando..." : "Desfazer alteracao"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
