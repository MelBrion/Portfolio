/* ==========================================================================
   SITE CONFIG — fill these in to switch on the matching features
   ========================================================================== */
const CONFIG = {
  email: 'melbrionvirtual@gmail.com',
  cvUrl: '',       // direct link to your resume PDF (e.g. Google Drive "uc?export=download&id=...")
  calendlyUrl: '',  // e.g. 'https://calendly.com/your-name/discovery-call' — embeds a live booking calendar
  resumeMailUrl: '' // the Apps Script "Web app" URL from resume-mailer.gs — switches on resume-by-email
};
// Demo videos: set data-video="https://www.loom.com/share/..." (or a YouTube link) on any [data-video] button.

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const isMobile = window.innerWidth < 768;
const deepCopy = obj => JSON.parse(JSON.stringify(obj));
const sameJSON = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/* ==========================================================================
   SAVE PER CATEGORY — every admin editor works on a draft; the page only
   changes when that category's "Save changes" is clicked. Categories are
   registered at the end of this file (see registerCategory calls).
   ========================================================================== */
const CATEGORIES = {};
// Refresh every category's Save bar + the orange "unsaved" dot on its sidebar item
function markDirty() {
  Object.values(CATEGORIES).forEach(c => {
    const dirty = c.isDirty();
    if (c.bar) c.bar.hidden = !dirty;
    if (c.nav) c.nav.classList.toggle('dirty', dirty);
  });
}
const anyDirty = () => Object.values(CATEGORIES).some(c => c.isDirty());
// Ask Save / Discard / Keep editing for each dirty category; resolves false if the admin keeps editing
async function resolveUnsaved(keys = Object.keys(CATEGORIES)) {
  for (const key of keys) {
    const c = CATEGORIES[key];
    if (!c || !c.isDirty()) continue;
    const choice = await askUnsaved(c.label);
    if (choice === 'cancel') return false;
    if (choice === 'save') { if (c.save() === false) return false; }
    else c.discard();
    markDirty();
  }
  return true;
}
function askUnsaved(label) {
  return new Promise(resolve => {
    $('#unsavedTitle').textContent = label;
    window.__unsavedResolve = resolve;
    openModal('unsavedModal');
  });
}

/* ==========================================================================
   CONTENT (editable from the admin panel)
   ========================================================================== */
const defaultContent = {
  name: 'Romelito Briones',
  role: 'CREATIVE DEVELOPER',
  headline: 'I build digital experiences that matter.',
  description: 'Creative developer and digital designer turning ambitious ideas into fast, thoughtful, and memorable products.',
  tabs: ['RESUME & BIO', 'STACK', 'AI AGENTS', 'CALENDARS', 'WORKFLOWS', 'API & WEBHOOKS', 'FUNNELs', 'A2P APPROVALS']
};
let content = { ...defaultContent, ...(JSON.parse(localStorage.getItem('romelPortfolioContent') || 'null') || {}) };

function applyContent() {
  $$('[data-content="name"]').forEach(el => el.textContent = content.name);
  $$('[data-content="role"]').forEach(el => el.textContent = content.role);
  $('#heroHeadline').innerHTML = escapeHtml(content.headline).replace('digital experiences', '<span class="gradient-text">digital experiences</span>');
  $('#heroDescription').textContent = content.description;
  // Each built-in tab remembers its original position, so renaming still works after sections are reordered
  $$('.portfolio-tabs').forEach(nav => $$('a:not([data-custom])', nav).forEach((link, i) => {
    if (link.dataset.tab == null) link.dataset.tab = i;
    const label = content.tabs[Number(link.dataset.tab)];
    if (label) link.textContent = label;
  }));
}
applyContent();

/* ==========================================================================
   PRELOADER
   ========================================================================== */
function dismissLoader() {
  const loader = $('#pageLoader');
  if (!loader || loader.classList.contains('done')) return;
  loader.classList.add('done');
  document.body.classList.add('loaded');
}
window.addEventListener('load', () => setTimeout(dismissLoader, 800));
setTimeout(dismissLoader, 4000);

/* ==========================================================================
   SITE THEMES (only the admin can change them)
   ========================================================================== */
// colors: [background, main, accent 1, accent 2] — the 4 colors the admin can customize
const THEMES = {
  dark:     { label: 'Dark',     icon: 'fa-moon',  colors: ['#080C16', '#60BCE7', '#10E891', '#AAA4EF'] },
  slate:    { label: 'Slate',    icon: 'fa-circle-half-stroke', colors: ['#F8FAFC', '#0284C7', '#10B981', '#6366F1'], light: true },
  midnight: { label: 'Midnight', icon: 'fa-star',  colors: ['#0D0817', '#B48CFF', '#FF6EC7', '#7DD3FC'] },
  ocean:    { label: 'Ocean',    icon: 'fa-water', colors: ['#04101C', '#38BDF8', '#2DD4BF', '#93C5FD'] },
  sunny:    { label: 'Sunny',    icon: 'fa-sun',   colors: ['#FFFBEB', '#F5B400', '#37CA37', '#188BF6'], light: true },
  // Neon themes: no hand-written CSS — all shades are derived from their 4 colors, plus an extra glow (html.is-neon)
  neonpink:   { label: 'Neon Pink',   icon: 'fa-heart',           colors: ['#0A0310', '#FF2E97', '#00F0FF', '#B026FF'], neon: true },
  neongreen:  { label: 'Neon Green',  icon: 'fa-bolt',            colors: ['#030A04', '#39FF14', '#C6FF00', '#00FFB3'], neon: true },
  cyberpunk:  { label: 'Cyberpunk',   icon: 'fa-robot',           colors: ['#0D0221', '#FCEE0C', '#FF2A6D', '#05D9E8'], neon: true },
  neonblue:   { label: 'Neon Blue',   icon: 'fa-bolt-lightning',  colors: ['#02040F', '#2D6BFF', '#00E5FF', '#9D4EDD'], neon: true },
  sunsetneon: { label: 'Sunset Neon', icon: 'fa-fire',           colors: ['#12021C', '#FF6B00', '#FF2E97', '#FFE600'], neon: true },
  // Executive themes: calm, formal palettes for CEOs and business owners (derived from their 4 colors, no glow)
  executive:  { label: 'Executive',   icon: 'fa-briefcase',       colors: ['#0A1424', '#C9A961', '#E6D3A3', '#6E8DB8'], derived: true },
  onyx:       { label: 'Onyx',        icon: 'fa-gem',             colors: ['#121417', '#C7CCD4', '#8EA4C2', '#D9C7A3'], derived: true },
  ivory:      { label: 'Ivory',       icon: 'fa-feather-pointed', colors: ['#FAF7F0', '#1E3A5F', '#A8823F', '#5B7FA6'], derived: true, light: true },
  emeraldgold: { label: 'Emerald',     icon: 'fa-crown',           colors: ['#08201A', '#2FA37E', '#D4B26A', '#E8DCC0'], derived: true },
  bordeaux:   { label: 'Bordeaux',    icon: 'fa-wine-glass',      colors: ['#1A0D12', '#C9A47A', '#C25670', '#E8D5C0'], derived: true }
};
// Themes without a hand-written CSS block are painted entirely from their 4 colors
const isDerivedTheme = key => !!(THEMES[key].neon || THEMES[key].derived);
const COLOR_ROLES = ['Background', 'Main color', 'Accent 1', 'Accent 2'];
const LEGACY_THEMES = { emerald: 'sunny' }; // Emerald was replaced by Sunny
let customColors = (() => { try { return JSON.parse(localStorage.getItem('romelThemeColors')) || {}; } catch (e) { return {}; } })();
const themeColors = key => customColors[key] || THEMES[key].colors;

/* --- color math --- */
const hexToRgb = hex => { const n = parseInt(hex.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const rgbToHex = rgb => '#' + rgb.map(v => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('').toUpperCase();
const rgbStr = hex => hexToRgb(hex).join(', ');
const mix = (a, b, t) => { const x = hexToRgb(a), y = hexToRgb(b); return rgbToHex(x.map((v, i) => v + (y[i] - v) * t)); };
const luminance = hex => {
  const [r, g, b] = hexToRgb(hex).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; });
  return .2126 * r + .7152 * g + .0722 * b;
};
const contrast = (a, b) => { const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (l1 + .05) / (l2 + .05); };
// Darken (on light backgrounds) or lighten (on dark ones) until the color is readable as text
function readable(color, bg, min = 3.2) {
  const toward = luminance(bg) > .5 ? '#000000' : '#FFFFFF';
  let out = color;
  for (let t = .08; contrast(out, bg) < min && t <= 1; t += .08) out = mix(color, toward, t);
  return out;
}

// Turn the 4 picked colors into the full set of CSS variables the site uses
function deriveThemeVars([bg, main, a1, a2]) {
  const light = luminance(bg) > .5;
  const btnText = contrast(main, '#FFFFFF') >= contrast(main, '#0F172A') ? '#FFFFFF' : '#0F172A';
  const surface = light ? mix(bg, '#FFFFFF', .75) : mix(mix(bg, '#FFFFFF', .05), main, .08);
  const border = light ? mix(bg, main, .22) : mix(bg, main, .25);
  const txt = light ? { text: '#1E293B', strong: '#0F172A', soft: '#334155', muted: '#64748B', faint: '#64748B' }
                    : { text: '#E2E8F0', strong: '#FFFFFF', soft: '#CBD5E1', muted: '#94A3B8', faint: '#64748B' };
  const accent = light ? readable(main, bg) : main, accent2 = light ? readable(a1, bg) : a1;
  const g = light ? [readable(main, bg, 2.6), readable(a2, bg, 2.6), readable(a1, bg, 2.6)] : [main, a2, a1];
  const vars = {
    '--canvas': bg, '--canvas-rgb': rgbStr(bg),
    '--deep': light ? mix(bg, main, .06) : mix(bg, '#000000', .45),
    '--surface': surface, '--surface-rgb': rgbStr(surface),
    '--surface-2': light ? mix(bg, '#FFFFFF', .4) : mix(surface, '#FFFFFF', .05),
    '--border': border, '--border-soft': light ? border : `rgba(${rgbStr(border)}, .6)`,
    '--turq': main, '--accent-rgb': rgbStr(main), '--accent': accent,
    '--mint': a1, '--accent2-rgb': rgbStr(a1), '--accent-2': accent2,
    '--biloba': light ? readable(a2, bg, 2.6) : a2, '--biloba-rgb': rgbStr(a2),
    '--indigo': a2, '--indigo-rgb': rgbStr(a2),
    '--text': txt.text, '--strong': txt.strong, '--soft': txt.soft, '--muted': txt.muted, '--faint': txt.faint,
    '--header-bg': `rgba(${rgbStr(bg)}, ${light ? .94 : .95})`,
    '--card-bg': light ? surface : `linear-gradient(145deg, rgba(${rgbStr(surface)}, .78) 0%, rgba(${rgbStr(bg)}, .92) 100%)`,
    '--card-border': light ? border : `rgba(${rgbStr(main)}, .22)`,
    '--card-shadow': light ? '0 10px 25px -5px rgba(15, 23, 42, .06), 0 4px 6px -2px rgba(15, 23, 42, .03)'
                           : '0 15px 35px -5px rgba(0, 0, 0, .8), inset 0 1px 0 rgba(255, 255, 255, .08), inset 0 -1px 0 rgba(0, 0, 0, .6)',
    '--card-hover-border': light ? main : `rgba(${rgbStr(a1)}, .65)`,
    '--card-hover-shadow': light ? `0 20px 35px -8px rgba(${rgbStr(main)}, .22), 0 8px 10px -4px rgba(15, 23, 42, .05)`
                                 : `0 22px 45px -10px rgba(${rgbStr(bg)}, .95), 0 0 25px rgba(${rgbStr(a1)}, .35), inset 0 1px 0 rgba(255, 255, 255, .2)`,
    '--btn-grad': `linear-gradient(90deg, ${main} 0%, ${light ? mix(main, a1, .45) : a1} 100%)`,
    '--btn-text': btnText,
    '--btn-shadow': light ? `0 4px 14px rgba(${rgbStr(main)}, .35)` : `0 0 18px rgba(${rgbStr(main)}, .5), 0 0 35px rgba(${rgbStr(a1)}, .3)`,
    '--btn-shadow-hover': light ? `0 6px 20px rgba(${rgbStr(main)}, .5)` : `0 0 30px rgba(${rgbStr(main)}, .85), 0 0 50px rgba(${rgbStr(a1)}, .6)`,
    '--outline-bg': light ? '#FFFFFF' : bg,
    '--outline-border': light ? `linear-gradient(90deg, ${main}, ${main})` : `linear-gradient(90deg, ${main}, ${a2})`,
    '--outline-shadow': light ? '0 2px 8px rgba(15, 23, 42, .05)' : `0 0 14px rgba(${rgbStr(a2)}, .3)`,
    '--outline-shadow-hover': light ? `0 4px 16px rgba(${rgbStr(main)}, .25)` : `0 0 28px rgba(${rgbStr(main)}, .7), 0 0 45px rgba(${rgbStr(a2)}, .5)`,
    '--text-grad': `linear-gradient(135deg, ${g[0]} 0%, ${g[1]} 55%, ${g[2]} 100%)`,
    '--text-grad-alt': `linear-gradient(135deg, ${g[1]} 0%, ${g[0]} 50%, ${g[2]} 100%)`,
    '--line-grad': `linear-gradient(90deg, ${main} 0%, ${a2} 50%, ${a1} 100%)`,
    '--field-bg': light ? '#FFFFFF' : bg,
    '--grid-line': light ? 'rgba(15, 23, 42, .04)' : `rgba(${rgbStr(main)}, .035)`
  };
  return { vars, light };
}

const swatchHtml = colors => `<span class="swatch">${colors.slice(0, 3).map(c => `<i style="background:${c}"></i>`).join('')}</span>`;

// The site theme is chosen and edited in the admin sidebar ("Site Theme & Colors")
let currentTheme = 'dark', siteTheme = 'dark', appliedVars = [];
// preview = true shows a theme without saving it as the site theme (used by the color editor)
function applyTheme(theme, preview = false) {
  theme = LEGACY_THEMES[theme] || theme;
  if (!THEMES[theme]) theme = 'dark';
  currentTheme = theme;
  if (!preview) siteTheme = theme;
  const html = document.documentElement;
  Object.keys(THEMES).forEach(key => html.classList.remove('theme-' + key));
  if (theme !== 'dark') html.classList.add('theme-' + theme);
  appliedVars.forEach(name => html.style.removeProperty(name));
  appliedVars = [];
  let light = !!THEMES[theme].light, cache = null;
  const neon = !!THEMES[theme].neon;
  // Custom colors, or a theme with no CSS block of its own, are painted from derived variables
  const colors = customColors[theme] || (isDerivedTheme(theme) ? THEMES[theme].colors : null);
  if (colors) {
    const derived = deriveThemeVars(colors);
    Object.entries(derived.vars).forEach(([name, value]) => html.style.setProperty(name, value));
    appliedVars = Object.keys(derived.vars);
    light = derived.light;
    cache = { theme, light, neon, css: Object.entries(derived.vars).map(([n, v]) => `${n}:${v}`).join(';') };
  }
  html.classList.toggle('is-light', light);
  html.classList.toggle('is-neon', neon && !light);
  // cache so the head script can paint custom colors before the page loads (no flash)
  if (!preview) { try { localStorage.setItem('romelThemeCache', JSON.stringify(cache)); } catch (e) {} }
  if (typeof reseedParticles === 'function') reseedParticles();
}
function setSiteTheme(theme) {
  try { localStorage.setItem('romelTheme', theme); } catch (e) {}
  applyTheme(theme);
}

/* ==========================================================================
   CUSTOM CURSOR
   ========================================================================== */
let mouseX = -1000, mouseY = -1000, mouseOn = false;
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  const dot = $('#cursorDot'), glow = $('#cursorGlow');
  let dotX = 0, dotY = 0, glowX = 0, glowY = 0;
  window.addEventListener('mousemove', e => {
    if (!mouseOn) { mouseOn = true; dotX = glowX = e.clientX; dotY = glowY = e.clientY; document.body.classList.add('cursor-on'); }
    mouseX = e.clientX; mouseY = e.clientY;
  });
  document.addEventListener('mouseleave', () => { mouseOn = false; mouseX = mouseY = -1000; document.body.classList.remove('cursor-on'); });
  (function animateCursor() {
    if (mouseOn) {
      dotX += (mouseX - dotX) * .5; dotY += (mouseY - dotY) * .5;
      glowX += (mouseX - glowX) * .15; glowY += (mouseY - glowY) * .15;
      dot.style.left = dotX + 'px'; dot.style.top = dotY + 'px';
      glow.style.left = glowX + 'px'; glow.style.top = glowY + 'px';
    }
    requestAnimationFrame(animateCursor);
  })();
}

/* ==========================================================================
   NEURAL PARTICLE CANVAS (links, data pulses, cursor tether, click ripples)
   ========================================================================== */
const canvas = $('#bgCanvas');
const ctx = canvas.getContext('2d');
// Particle colors follow the active theme's CSS variables
let themeRgb = {};
function readThemeColors() {
  const css = getComputedStyle(document.documentElement), get = name => css.getPropertyValue(name).trim();
  themeRgb = { accent: get('--accent-rgb'), accent2: get('--accent2-rgb'), biloba: get('--biloba-rgb') };
}
readThemeColors();
const palette = () => [themeRgb.accent2, themeRgb.accent, themeRgb.biloba].map(rgb => `rgba(${rgb}, `);
const rand = (min, max) => Math.random() * (max - min) + min;
let particles = [], pulses = [], ripples = [];

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function makeParticle() {
  const colors = palette();
  return {
    x: rand(0, innerWidth), y: rand(0, innerHeight),
    vx: rand(-.175, .175), vy: rand(-.175, .175),
    base: rand(.9, 2.7), r: 1, pulse: rand(0, Math.PI * 2), pulseSpeed: rand(.01, .03),
    alpha: rand(.25, .7), alphaSpeed: rand(.003, .011) * (Math.random() > .5 ? 1 : -1),
    color: colors[Math.floor(Math.random() * colors.length)]
  };
}
function reseedParticles() {
  readThemeColors();
  const colors = palette();
  particles.forEach(p => p.color = colors[Math.floor(Math.random() * colors.length)]);
}
for (let i = 0; i < (isMobile ? 32 : 68); i++) particles.push(makeParticle());
window.addEventListener('click', e => ripples.push({ x: e.clientX, y: e.clientY, r: 2, alpha: .55, max: isMobile ? 80 : 150 }));

function renderCanvas() {
  requestAnimationFrame(renderCanvas);
  if (document.hidden) return;
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  const slate = document.documentElement.classList.contains('is-light');
  const linkDist = isMobile ? 80 : 130, mouseDist = isMobile ? 80 : 140;
  const stroke = themeRgb.accent;

  for (let i = 0; i < particles.length; i++) {
    const a = particles[i];
    for (let j = i + 1; j < particles.length; j++) {
      const b = particles[j], dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (dist < linkDist) {
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(${stroke}, ${(1 - dist / linkDist) * (slate ? .12 : .2)})`;
        ctx.lineWidth = .75; ctx.stroke();
        if (pulses.length < (isMobile ? 3 : 8) && Math.random() < .002) {
          pulses.push({ a, b, t: 0, speed: rand(.012, .03), color: `rgb(${Math.random() > .5 ? themeRgb.accent2 : themeRgb.accent})` });
        }
      }
    }
    if (mouseOn) {
      const md = Math.hypot(a.x - mouseX, a.y - mouseY);
      if (md < mouseDist) {
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouseX, mouseY);
        ctx.strokeStyle = `rgba(${themeRgb.accent2}, ${(1 - md / mouseDist) * .25})`;
        ctx.lineWidth = .85; ctx.stroke();
      }
    }
  }

  for (let i = pulses.length - 1; i >= 0; i--) {
    const p = pulses[i];
    p.t += p.speed;
    if (p.t >= 1) { pulses.splice(i, 1); continue; }
    ctx.globalAlpha = Math.sin(p.t * Math.PI) * .8;
    ctx.beginPath(); ctx.arc(p.a.x + (p.b.x - p.a.x) * p.t, p.a.y + (p.b.y - p.a.y) * p.t, 1.8, 0, Math.PI * 2);
    ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 8; ctx.fill();
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  }

  particles.forEach(p => {
    p.x += p.vx; p.y += p.vy;
    p.alpha += p.alphaSpeed;
    if (p.alpha > .7 || p.alpha < .2) p.alphaSpeed *= -1;
    p.pulse += p.pulseSpeed;
    p.r = p.base + Math.sin(p.pulse) * .5;
    if (p.x < -20) p.x = innerWidth + 20; else if (p.x > innerWidth + 20) p.x = -20;
    if (p.y < -20) p.y = innerHeight + 20; else if (p.y > innerHeight + 20) p.y = -20;
    ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(.5, p.r), 0, Math.PI * 2);
    ctx.fillStyle = p.color + p.alpha + ')'; ctx.shadowColor = p.color + '0.6)'; ctx.shadowBlur = 6; ctx.fill();
    ctx.shadowBlur = 0;
  });

  for (let i = ripples.length - 1; i >= 0; i--) {
    const r = ripples[i];
    r.r += 3.2; r.alpha *= .95;
    if (r.alpha <= .02 || r.r >= r.max) { ripples.splice(i, 1); continue; }
    ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${themeRgb.accent}, ${r.alpha})`; ctx.lineWidth = 1.2;
    ctx.shadowColor = `rgba(${themeRgb.accent2}, .5)`; ctx.shadowBlur = 10; ctx.stroke(); ctx.shadowBlur = 0;
  }
}
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) renderCanvas();

/* ==========================================================================
   SCROLL: progress bar, smooth anchor offset, scroll-spy, reveal
   ========================================================================== */
function updateScrollProgress() {
  const max = document.documentElement.scrollHeight - innerHeight;
  $('#scrollProgressBar').style.width = (max > 0 ? Math.min(Math.max(scrollY / max * 100, 0), 100) : 0) + '%';
}
window.addEventListener('scroll', updateScrollProgress, { passive: true });
window.addEventListener('resize', updateScrollProgress, { passive: true });
updateScrollProgress();

// Delegated so links added later (e.g. edited service cards) also scroll smoothly
document.addEventListener('click', e => {
  const link = e.target.closest('a[href^="#"]');
  if (!link || e.defaultPrevented) return;
  const id = link.getAttribute('href').slice(1);
  const target = id && document.getElementById(id);
  if (!target) return;
  e.preventDefault();
  const offset = innerWidth < 640 ? 70 : 85;
  window.scrollTo({ top: target.getBoundingClientRect().top + scrollY - offset, behavior: 'smooth' });
  closeMobileMenu();
});

const navTargets = $$('.portfolio-tabs a').map(a => document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);
const spy = new IntersectionObserver(entries => entries.forEach(entry => {
  if (!entry.isIntersecting) return;
  $$('.portfolio-tabs a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
}), { rootMargin: '-45% 0px -50% 0px' });
[...new Set(navTargets)].forEach(section => spy.observe(section));

const revealer = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) { entry.target.classList.add('visible'); revealer.unobserve(entry.target); }
}), { threshold: .12 });
$$('.reveal').forEach(el => revealer.observe(el));

/* ==========================================================================
   MOBILE MENU
   ========================================================================== */
const menuButton = $('#menuButton'), mobileMenu = $('#mobileMenu');
function closeMobileMenu() {
  mobileMenu.hidden = true;
  menuButton.setAttribute('aria-expanded', 'false');
  $('i', menuButton).className = 'fa-solid fa-bars';
}
menuButton.addEventListener('click', () => {
  const open = mobileMenu.hidden;
  mobileMenu.hidden = !open;
  menuButton.setAttribute('aria-expanded', String(open));
  $('i', menuButton).className = open ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
});
// Tapping outside the ☰ menu, or widening the window until the full nav shows, closes it
document.addEventListener('click', e => { if (!mobileMenu.hidden && !e.target.closest('#mobileMenu, #menuButton')) closeMobileMenu(); });
window.addEventListener('resize', () => { if (!mobileMenu.hidden && !menuButton.offsetParent) closeMobileMenu(); }, { passive: true });

// Every visit opens on the hero with the ☰ menu closed — the browser does not restore an old
// scroll position or open a #section from the address
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
function startAtHero() {
  closeMobileMenu();
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  window.scrollTo(0, 0);
}
startAtHero();
let visitorMoved = false; // a visitor who already started scrolling is never pulled back up
['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(ev => addEventListener(ev, () => visitorMoved = true, { once: true, passive: true }));
window.addEventListener('load', () => { if (!visitorMoved) startAtHero(); });
window.addEventListener('pageshow', e => { if (e.persisted) startAtHero(); });

/* ==========================================================================
   MODALS (generic open / close, backdrop click, Esc)
   ========================================================================== */
function openModal(id) {
  // Every "My Resume" button lands here. With a resume uploaded the client requests it by email
  // (or it opens directly until the mailer is connected); with none, the Gmail request popup shows.
  if (id === 'cvModal' && resumeSaved) {
    if (!CONFIG.resumeMailUrl) { openResume(); closeMobileMenu(); return; }
    id = 'resumeRequestModal';
    startResumeRequest();
  }
  $('#' + id).hidden = false;
  document.body.style.overflow = 'hidden';
  closeMobileMenu();
}
function closeModal(modal, force = false) {
  if (!modal || modal.hidden) return;
  // The image editor asks Save / Discard first when it has unsaved changes
  if (modal.id === 'imageEditModal' && !force && CATEGORIES.image && CATEGORIES.image.isDirty()) {
    resolveUnsaved(['image']).then(ok => { if (ok) closeModal(modal, true); });
    return;
  }
  // Closing the unsaved prompt any other way counts as "Keep editing"
  if (modal.id === 'unsavedModal' && window.__unsavedResolve) { window.__unsavedResolve('cancel'); window.__unsavedResolve = null; }
  // Closing the yes / no prompt any other way (Esc, clicking outside) counts as "no"
  if (modal.id === 'confirmModal' && window.__confirmResolve) { window.__confirmResolve(false); window.__confirmResolve = null; }
  // Closing Edit Font without Apply drops the preview
  if (modal.id === 'fontModal' && typeof revertFontPreview === 'function') revertFontPreview();
  modal.hidden = true;
  if (modal.id === 'videoModal') { $('#videoFrame').src = 'about:blank'; const v = $('#videoPlayer'); v.pause(); v.removeAttribute('src'); v.load(); }
  if (modal.id === 'lightboxModal') { $('#lightboxImg').src = ''; lb.zoom = 1; lb.x = lb.y = 0; }
  if (!$$('.modal').some(m => !m.hidden)) document.body.style.overflow = '';
}
$$('[data-open]').forEach(btn => btn.addEventListener('click', () => openModal(btn.dataset.open)));
$$('.modal').forEach(modal => {
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(modal); });
  $$('[data-close]', modal).forEach(btn => btn.addEventListener('click', () => closeModal(modal)));
});
window.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  // Only close the top-most dialog (the unsaved prompt sits above the image editor)
  const open = $$('.modal').filter(m => !m.hidden);
  if (open.length) return closeModal(open.find(m => m.id === 'unsavedModal') || open[open.length - 1]);
  if (typeof closeCmsPanel === 'function') closeCmsPanel();
});
$$('[data-unsaved]').forEach(btn => btn.addEventListener('click', () => {
  const resolve = window.__unsavedResolve;
  window.__unsavedResolve = null;
  closeModal($('#unsavedModal'), true);
  if (resolve) resolve(btn.dataset.unsaved);
}));

function toast(message) {
  let el = $('.toast');
  if (!el) { el = document.createElement('div'); el.className = 'toast'; document.body.appendChild(el); }
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('show'), 2600);
}

/* ==========================================================================
   LIGHTBOX — zoom (buttons, wheel, keys, pinch), drag/touch pan, dbl-click
   ========================================================================== */
const lb = { zoom: 1, x: 0, y: 0, dragging: false, startX: 0, startY: 0, pinchDist: 0, pinchZoom: 1 };
const lbModal = $('#lightboxModal'), lbViewport = $('#lightboxViewport'), lbPan = $('#lightboxPan');

function updateLightbox(smooth) {
  lbPan.style.transition = smooth ? 'transform .18s cubic-bezier(.16, 1, .3, 1)' : 'none';
  lbPan.style.transform = `translate(${lb.x}px, ${lb.y}px) scale(${lb.zoom})`;
  $('#lightboxZoomLevel').textContent = Math.round(lb.zoom * 100) + '%';
  lbViewport.style.cursor = lb.zoom > 1.02 ? (lb.dragging ? 'grabbing' : 'grab') : 'default';
}
function zoomLightbox(delta) {
  const next = Math.min(Math.max(lb.zoom + delta, .5), 4);
  if (Math.abs(next - lb.zoom) < .01) return;
  if (next <= 1) lb.x = lb.y = 0;
  lb.zoom = Math.round(next * 100) / 100;
  updateLightbox(true);
}
function resetLightbox() { lb.zoom = 1; lb.x = lb.y = 0; updateLightbox(true); }
function openLightbox(src, title) {
  $('#lightboxImg').src = src;
  $('#lightboxImg').alt = title || 'Preview';
  $('#lightboxTitle').textContent = title || 'Preview';
  $('#lightboxDirectLink').href = src;
  lb.zoom = 1; lb.x = lb.y = 0; lb.dragging = false;
  updateLightbox(false);
  openModal('lightboxModal');
}

$$('[data-zoom]').forEach(btn => btn.addEventListener('click', () => zoomLightbox(parseFloat(btn.dataset.zoom))));
$('#lightboxZoomLevel').addEventListener('click', resetLightbox);
$('#lightboxReset').addEventListener('click', resetLightbox);
$('#lightboxDirectLink').addEventListener('click', e => {
  // data: URIs can't be opened as top-level pages, so open them in a blank tab instead
  const src = $('#lightboxImg').src;
  if (!src.startsWith('data:')) return;
  e.preventDefault();
  const tab = window.open();
  if (tab) tab.document.write(`<body style="margin:0;background:#050811;display:grid;place-items:center;min-height:100vh"><img src="${src}" style="max-width:100%"></body>`);
});

lbViewport.addEventListener('wheel', e => { e.preventDefault(); zoomLightbox(e.deltaY < 0 ? .2 : -.2); }, { passive: false });
lbViewport.addEventListener('dblclick', () => {
  if (lb.zoom > 1.1) resetLightbox();
  else { lb.zoom = 2; lb.x = lb.y = 0; updateLightbox(true); }
});
lbViewport.addEventListener('mousedown', e => {
  if (e.button !== 0 || lb.zoom <= 1.02) return;
  lb.dragging = true; lb.startX = e.clientX - lb.x; lb.startY = e.clientY - lb.y;
  updateLightbox(false); e.preventDefault();
});
window.addEventListener('mousemove', e => {
  if (!lb.dragging) return;
  lb.x = e.clientX - lb.startX; lb.y = e.clientY - lb.startY;
  updateLightbox(false);
});
window.addEventListener('mouseup', () => { if (lb.dragging) { lb.dragging = false; updateLightbox(false); } });
lbViewport.addEventListener('touchstart', e => {
  if (e.touches.length === 1 && lb.zoom > 1.02) {
    lb.dragging = true; lb.startX = e.touches[0].clientX - lb.x; lb.startY = e.touches[0].clientY - lb.y;
  } else if (e.touches.length === 2) {
    lb.dragging = false;
    lb.pinchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    lb.pinchZoom = lb.zoom;
  }
}, { passive: true });
lbViewport.addEventListener('touchmove', e => {
  if (e.touches.length === 1 && lb.dragging) {
    lb.x = e.touches[0].clientX - lb.startX; lb.y = e.touches[0].clientY - lb.startY;
    updateLightbox(false); e.preventDefault();
  } else if (e.touches.length === 2 && lb.pinchDist > 0) {
    const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    lb.zoom = Math.round(Math.min(Math.max(lb.pinchZoom * dist / lb.pinchDist, .5), 4) * 100) / 100;
    updateLightbox(false); e.preventDefault();
  }
}, { passive: false });
lbViewport.addEventListener('touchend', e => { if (!e.touches.length) { lb.dragging = false; lb.pinchDist = 0; } });
document.addEventListener('keydown', e => {
  if (lbModal.hidden) return;
  const pan = { ArrowUp: [0, 50], ArrowDown: [0, -50], ArrowLeft: [50, 0], ArrowRight: [-50, 0] }[e.key];
  if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomLightbox(.25); }
  else if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomLightbox(-.25); }
  else if (e.key === '0') { e.preventDefault(); resetLightbox(); }
  else if (pan && lb.zoom > 1.02) { e.preventDefault(); lb.x += pan[0]; lb.y += pan[1]; updateLightbox(true); }
});

/* ==========================================================================
   GENERATED PREVIEW IMAGES (sample schemas — swap for real screenshots)
   ========================================================================== */
const svgUri = svg => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
const SVG_FONTS = { sans: "Montserrat, Arial, sans-serif", mono: "'JetBrains Mono', Consolas, monospace" };

function diagramSvg(title, steps, accent = '#60BCE7') {
  const W = 1200, H = 675, n = steps.length, pad = 80, gap = 44;
  const boxW = (W - pad * 2 - gap * (n - 1)) / n, y = 300;
  let links = '', nodes = '';
  steps.forEach((step, i) => {
    const x = pad + i * (boxW + gap), color = i === 0 ? '#10E891' : i === n - 1 ? '#AAA4EF' : accent;
    if (i < n - 1) {
      const x1 = x + boxW + 4, x2 = x + boxW + gap - 4;
      links += `<line x1="${x1}" y1="${y + 55}" x2="${x2 - 8}" y2="${y + 55}" stroke="${accent}" stroke-width="3" stroke-dasharray="6 6" opacity=".75"/><polygon points="${x2 - 10},${y + 47} ${x2},${y + 55} ${x2 - 10},${y + 63}" fill="${accent}"/>`;
    }
    nodes += `<rect x="${x}" y="${y}" width="${boxW}" height="110" rx="18" fill="#0E1A33" stroke="${color}" stroke-width="2"/>`
      + `<circle cx="${x + 26}" cy="${y + 30}" r="7" fill="${color}"/>`
      + `<text x="${x + 42}" y="${y + 35}" font-family="${SVG_FONTS.mono}" font-size="13" fill="#94A3B8">STEP ${String(i + 1).padStart(2, '0')}</text>`
      + `<text x="${x + 20}" y="${y + 78}" font-family="${SVG_FONTS.sans}" font-size="${boxW < 170 ? 16 : 19}" font-weight="700" fill="#FFFFFF">${escapeHtml(step)}</text>`;
  });
  return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`
    + `<defs><pattern id="g" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#60BCE7" stroke-opacity=".08"/></pattern>`
    + `<radialGradient id="r" cx="50%" cy="0%" r="85%"><stop offset="0" stop-color="${accent}" stop-opacity=".22"/><stop offset="1" stop-color="#080C16" stop-opacity="0"/></radialGradient></defs>`
    + `<rect width="100%" height="100%" fill="#080C16"/><rect width="100%" height="100%" fill="url(#g)"/><rect width="100%" height="100%" fill="url(#r)"/>`
    + `<text x="${pad}" y="110" font-family="${SVG_FONTS.mono}" font-size="16" letter-spacing="4" fill="${accent}">WORKFLOW SCHEMA</text>`
    + `<text x="${pad}" y="165" font-family="${SVG_FONTS.sans}" font-size="44" font-weight="800" fill="#FFFFFF">${escapeHtml(title)}</text>`
    + links + nodes
    + `<text x="${pad}" y="600" font-family="${SVG_FONTS.mono}" font-size="14" fill="#64748B">SAMPLE DIAGRAM</text></svg>`);
}

function approvalSvg(label) {
  const W = 800, H = 1000;
  const rows = [0, 1, 2, 3, 4].map(i => `<rect x="80" y="${430 + i * 70}" width="${[520, 600, 440, 560, 380][i]}" height="18" rx="9" fill="#1B3463"/><rect x="80" y="${458 + i * 70}" width="${[300, 260, 340, 220, 280][i]}" height="12" rx="6" fill="#132448"/>`).join('');
  return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`
    + `<rect width="100%" height="100%" fill="#080C16"/><rect x="40" y="40" width="720" height="920" rx="32" fill="#0E1A33" stroke="#1B3463" stroke-width="2"/>`
    + `<text x="80" y="130" font-family="${SVG_FONTS.mono}" font-size="20" letter-spacing="4" fill="#60BCE7">A2P 10DLC</text>`
    + `<text x="80" y="200" font-family="${SVG_FONTS.sans}" font-size="46" font-weight="800" fill="#FFFFFF">${escapeHtml(label)}</text>`
    + `<rect x="80" y="250" width="230" height="56" rx="28" fill="#10E891" fill-opacity=".15" stroke="#10E891" stroke-width="2"/>`
    + `<circle cx="112" cy="278" r="9" fill="#10E891"/><text x="134" y="286" font-family="${SVG_FONTS.mono}" font-size="22" font-weight="700" fill="#10E891">APPROVED</text>`
    + `<line x1="80" y1="370" x2="720" y2="370" stroke="#1B3463" stroke-width="2"/>` + rows
    + `<text x="80" y="900" font-family="${SVG_FONTS.mono}" font-size="16" fill="#64748B">SAMPLE — REPLACE WITH YOUR SCREENSHOT</text></svg>`);
}

$$('img[data-diagram]').forEach(img => img.src = diagramSvg(img.dataset.diagram, img.dataset.steps.split('|')));
$$('img[data-approval]').forEach(img => img.src = approvalSvg(img.dataset.approval));
$$('[data-lightbox]').forEach(el => el.addEventListener('click', () => openLightbox($('img', el).src, el.dataset.lightbox)));
// Uses the admin's uploaded screenshot (data-custom-src) when there is one, else the sample diagram
$$('[data-lightbox-src="diagram"]').forEach(btn => btn.addEventListener('click', () =>
  openLightbox(btn.dataset.customSrc || diagramSvg(btn.dataset.diagramTitle, btn.dataset.diagramSteps.split('|')), btn.dataset.diagramTitle)));

/* ==========================================================================
   VIDEO MODAL (Loom / YouTube / any embeddable URL)
   ========================================================================== */
function toEmbedUrl(url) {
  const loom = url.match(/loom\.com\/(?:share|embed)\/([\w-]+)/);
  if (loom) return `https://www.loom.com/embed/${loom[1]}?autoplay=1&hide_owner=true&hide_share=true&hide_title=true&hideEmbedTopBar=true`;
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?autoplay=1`;
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1`;
  return url;
}
const isVideoFile = url => /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(url) || url.startsWith('data:video/');
// Plays any link in the pop-up: Loom / YouTube / Vimeo embeds, or a direct video file
function playVideo(url, title, emptyText) {
  url = (url || '').trim();
  const file = !!url && isVideoFile(url);
  $('#videoTitle').textContent = title || 'Recording';
  $('#videoFrame').hidden = !url || file;
  $('#videoPlayer').hidden = !file;
  $('#videoEmpty').hidden = !!url;
  $('#videoEmpty p').textContent = emptyText || 'Demo recording coming soon.';
  $('#videoFrame').src = url && !file ? toEmbedUrl(url) : 'about:blank';
  // The volume slider controls uploaded videos; Loom / YouTube / Vimeo have volume in their own player
  $('#videoVolume').hidden = !file;
  if (file) {
    const v = $('#videoPlayer');
    v.muted = false;
    applyVideoVolume();
    v.src = url;
    v.play().catch(() => {});
  }
  // Phone videos (MP4 / MOV) carry AAC sound. A few embedded browsers (e.g. VS Code's preview) show the
  // picture but cannot play AAC, so say so instead of playing silently.
  const noSound = file && /\.(mp4|m4v|mov)(\?|#|$)/i.test(url) && !$('#videoPlayer').canPlayType('audio/mp4; codecs="mp4a.40.2"');
  $('#videoNote').hidden = !noSound;
  openModal('videoModal');
}

// Volume: slider 0–100%, mute button, and ↑ / ↓ keys while the video is open. Remembered on this device.
let videoVolume = 1, videoMuted = false;
try { const saved = parseFloat(localStorage.getItem('romelVideoVolume')); if (saved >= 0 && saved <= 1) videoVolume = saved; } catch (e) {}
function applyVideoVolume() {
  const v = $('#videoPlayer'), pct = Math.round(videoVolume * 100);
  v.volume = videoVolume;
  v.muted = videoMuted || videoVolume === 0;
  const range = $('#videoVolumeRange');
  range.value = pct;
  range.style.setProperty('--vol', (videoMuted ? 0 : pct) + '%');
  $('#videoVolumeValue').textContent = videoMuted ? 'Muted' : pct + '%';
  const icon = videoMuted || pct === 0 ? 'fa-volume-xmark' : pct < 50 ? 'fa-volume-low' : 'fa-volume-high';
  $('#videoMute i').className = 'fa-solid ' + icon;
  try { localStorage.setItem('romelVideoVolume', String(videoVolume)); } catch (e) {}
}
function setVideoVolume(value) {
  videoVolume = Math.min(1, Math.max(0, value));
  videoMuted = false;
  applyVideoVolume();
}
$('#videoVolumeRange').addEventListener('input', e => setVideoVolume(e.target.value / 100));
$('#videoMute').addEventListener('click', () => {
  if (videoMuted || videoVolume === 0) { videoMuted = false; if (videoVolume === 0) videoVolume = .5; }
  else videoMuted = true;
  applyVideoVolume();
});
// The player's own speaker / slider stays in step with ours
$('#videoPlayer').addEventListener('volumechange', e => {
  const v = e.target;
  if (Math.abs(v.volume - videoVolume) < .005 && v.muted === (videoMuted || videoVolume === 0)) return;
  videoVolume = v.volume;
  videoMuted = v.muted && v.volume > 0;
  applyVideoVolume();
});
document.addEventListener('keydown', e => {
  if ($('#videoModal').hidden || $('#videoVolume').hidden) return;
  if (e.target.matches && e.target.matches('input:not([type="range"]), textarea')) return;
  if (e.target === $('#videoVolumeRange') && e.key.startsWith('Arrow')) return; // the slider moves itself
  if (e.key === 'ArrowUp') { e.preventDefault(); setVideoVolume(videoVolume + .1); }
  if (e.key === 'ArrowDown') { e.preventDefault(); setVideoVolume(videoVolume - .1); }
  if (e.key === 'm' || e.key === 'M') $('#videoMute').click();
});
$$('[data-video]').forEach(btn => btn.addEventListener('click', () => playVideo(btn.dataset.video, btn.dataset.title)));

/* ==========================================================================
   TECH MARQUEE
   ========================================================================== */
// Icons the admin can pick for a tool: [Font Awesome class, search keywords, icon color]
const ICON_LIBRARY = [
  ['fa-brands fa-figma', 'figma design', '#A259FF'], ['fa-brands fa-html5', 'html5 web', '#E34F26'], ['fa-brands fa-css3-alt', 'css3 style', '#1572B6'],
  ['fa-brands fa-js', 'javascript js', '#F7DF1E'], ['fa-brands fa-react', 'react', '#61DAFB'], ['fa-brands fa-node-js', 'node nodejs', '#5FA04E'],
  ['fa-brands fa-vuejs', 'vue', '#42B883'], ['fa-brands fa-angular', 'angular', '#DD0031'], ['fa-brands fa-sass', 'sass scss', '#CC6699'],
  ['fa-brands fa-bootstrap', 'bootstrap', '#7952B3'], ['fa-brands fa-python', 'python', '#3776AB'], ['fa-brands fa-php', 'php', '#777BB4'],
  ['fa-brands fa-laravel', 'laravel', '#FF2D20'], ['fa-brands fa-wordpress', 'wordpress cms', '#21759B'], ['fa-brands fa-shopify', 'shopify shop store ecommerce', '#7AB55C'],
  ['fa-brands fa-wix', 'wix website builder', '#FAAD4D'], ['fa-brands fa-squarespace', 'squarespace website builder', '#94A3B8'], ['fa-brands fa-github', 'github git code', '#94A3B8'],
  ['fa-brands fa-gitlab', 'gitlab git', '#FC6D26'], ['fa-brands fa-git-alt', 'git version', '#F05032'], ['fa-brands fa-docker', 'docker container', '#2496ED'],
  ['fa-brands fa-aws', 'aws amazon cloud', '#FF9900'], ['fa-brands fa-cloudflare', 'cloudflare dns cdn', '#F38020'], ['fa-brands fa-npm', 'npm package', '#CB3837'],
  ['fa-brands fa-google', 'google workspace', '#4285F4'], ['fa-brands fa-google-drive', 'google drive storage', '#34A853'], ['fa-brands fa-microsoft', 'microsoft office', '#00A4EF'],
  ['fa-brands fa-apple', 'apple ios mac', '#94A3B8'], ['fa-brands fa-android', 'android mobile', '#3DDC84'], ['fa-brands fa-stripe', 'stripe payments', '#635BFF'],
  ['fa-brands fa-paypal', 'paypal payments', '#00457C'], ['fa-brands fa-slack', 'slack chat team', '#E01E5A'], ['fa-brands fa-discord', 'discord chat community', '#5865F2'],
  ['fa-brands fa-trello', 'trello board project', '#0079BF'], ['fa-brands fa-jira', 'jira project', '#0052CC'], ['fa-brands fa-hubspot', 'hubspot crm marketing', '#FF7A59'],
  ['fa-brands fa-salesforce', 'salesforce crm', '#00A1E0'], ['fa-brands fa-mailchimp', 'mailchimp email marketing', '#FFE01B'], ['fa-brands fa-dropbox', 'dropbox storage', '#0061FF'],
  ['fa-brands fa-facebook', 'facebook meta social ads', '#1877F2'], ['fa-brands fa-instagram', 'instagram social', '#E4405F'], ['fa-brands fa-linkedin', 'linkedin social', '#0A66C2'],
  ['fa-brands fa-youtube', 'youtube video', '#FF0000'], ['fa-brands fa-tiktok', 'tiktok social video', '#EE1D52'], ['fa-brands fa-whatsapp', 'whatsapp chat message', '#25D366'],
  ['fa-brands fa-telegram', 'telegram chat message', '#26A5E4'],
  ['fa-solid fa-layer-group', 'layers gohighlevel ghl stack', '#22C55E'], ['fa-solid fa-bolt', 'bolt zapier automation fast', '#FF4A00'], ['fa-solid fa-circle-nodes', 'nodes n8n network workflow', '#EA4B71'],
  ['fa-solid fa-gears', 'gears make settings automation', '#B042FF'], ['fa-solid fa-robot', 'robot ai agent bot', '#10E891'], ['fa-solid fa-brain', 'brain ai machine learning', '#F472B6'],
  ['fa-solid fa-wand-magic-sparkles', 'magic ai sparkles', '#A78BFA'], ['fa-solid fa-microchip', 'chip hardware tech', '#60BCE7'], ['fa-solid fa-code', 'code developer', '#38BDF8'],
  ['fa-solid fa-terminal', 'terminal command line', '#94A3B8'], ['fa-solid fa-database', 'database sql data', '#3ECF8E'], ['fa-solid fa-server', 'server hosting', '#64748B'],
  ['fa-solid fa-cloud', 'cloud hosting', '#60A5FA'], ['fa-solid fa-plug', 'plug api integration webhook', '#F59E0B'], ['fa-solid fa-diagram-project', 'diagram workflow pipeline', '#8B5CF6'],
  ['fa-solid fa-envelope', 'email mail', '#EF4444'], ['fa-solid fa-phone', 'phone call voice', '#22C55E'], ['fa-solid fa-comments', 'chat comments sms', '#0EA5E9'],
  ['fa-solid fa-headset', 'headset support voice ai', '#14B8A6'], ['fa-solid fa-calendar-check', 'calendar booking schedule', '#F97316'], ['fa-solid fa-chart-line', 'chart analytics reports', '#22C55E'],
  ['fa-solid fa-cart-shopping', 'cart shop ecommerce', '#F59E0B'], ['fa-solid fa-credit-card', 'card payments billing', '#6366F1'], ['fa-solid fa-bullhorn', 'bullhorn marketing ads', '#EC4899'],
  ['fa-solid fa-palette', 'palette design color', '#F472B6'], ['fa-solid fa-pen-nib', 'pen design illustrator', '#FB923C'], ['fa-solid fa-image', 'image photo photoshop', '#38BDF8'],
  ['fa-solid fa-video', 'video loom recording', '#625DF5'], ['fa-solid fa-mobile-screen', 'mobile app phone', '#64748B'], ['fa-solid fa-globe', 'globe website domain', '#0EA5E9'],
  ['fa-solid fa-lock', 'lock security', '#EAB308'], ['fa-solid fa-rocket', 'rocket launch deploy vercel', '#F43F5E'], ['fa-solid fa-file-lines', 'file document notion docs', '#94A3B8'],
  ['fa-solid fa-table', 'table sheets airtable spreadsheet', '#10B981'], ['fa-solid fa-list-check', 'tasks checklist clickup asana', '#7B68EE'], ['fa-solid fa-star', 'star favorite', '#FBBF24'],
  ['fa-solid fa-pen-ruler', 'pen ruler ui ux design', '#F472B6'], ['fa-solid fa-swatchbook', 'swatch brand identity colors', '#FB923C'], ['fa-solid fa-briefcase', 'briefcase work job business', '#A78BFA'],
  ['fa-solid fa-compass-drafting', 'compass drafting architecture plan', '#38BDF8'], ['fa-solid fa-lightbulb', 'lightbulb idea strategy', '#FACC15'], ['fa-solid fa-handshake', 'handshake partner client', '#34D399'],
  ['fa-solid fa-users', 'users team people community', '#60A5FA'], ['fa-solid fa-gauge-high', 'gauge speed performance seo', '#F87171'], ['fa-solid fa-magnifying-glass', 'search seo magnifying', '#94A3B8'],
  ['fa-solid fa-graduation-cap', 'graduation education training course', '#818CF8'], ['fa-solid fa-heart', 'heart love health', '#F43F5E'], ['fa-solid fa-trophy', 'trophy award results', '#F59E0B'],
  ['fa-solid fa-play', 'play video watch demo', '#60BCE7'], ['fa-solid fa-arrow-right', 'arrow next go', '#60BCE7'], ['fa-solid fa-paper-plane', 'send message contact', '#38BDF8'],
  ['fa-solid fa-download', 'download cv resume file', '#10E891'], ['fa-solid fa-file-arrow-down', 'cv resume download pdf', '#10E891']
];
const iconTone = icon => (ICON_LIBRARY.find(([cls]) => cls === icon) || [])[2] || '#60BCE7';
const DEFAULT_TOOLS = [
  ['fa-brands fa-figma', 'Figma'], ['fa-brands fa-html5', 'HTML5'], ['fa-brands fa-css3-alt', 'CSS3'], ['fa-brands fa-js', 'JavaScript'],
  ['fa-brands fa-react', 'React'], ['fa-brands fa-node-js', 'Node.js'], ['fa-brands fa-wordpress', 'WordPress'], ['fa-brands fa-github', 'GitHub'],
  ['fa-solid fa-layer-group', 'GoHighLevel'], ['fa-solid fa-bolt', 'Zapier'], ['fa-solid fa-circle-nodes', 'n8n'], ['fa-solid fa-gears', 'Make.com'],
  ['fa-solid fa-robot', 'AI Agents'], ['fa-brands fa-google', 'Google Workspace'], ['fa-brands fa-cloudflare', 'Cloudflare']
].map(([icon, name]) => ({ icon, name }));
// toolsSaved = what the page shows; tools = the editor's draft until "Save changes"
let toolsSaved = (() => { try { return JSON.parse(localStorage.getItem('romelTools')) || null; } catch (e) { return null; } })() || deepCopy(DEFAULT_TOOLS);
let tools = deepCopy(toolsSaved);

function fillMarquee(track, items) {
  const chips = items.map(({ icon, name }) => `<div class="tech-chip" style="--tone:${iconTone(icon)}"><i class="${icon}"></i><span>${escapeHtml(name)}</span></div>`).join('');
  track.innerHTML = chips + chips; // duplicated so the -50% loop is seamless
}
function renderMarquee() {
  const visible = toolsSaved.filter(t => t.name.trim());
  fillMarquee($('#marqueeTrack'), visible);
  fillMarquee($('#marqueeTrackReverse'), [...visible].reverse());
}
// Editor change: only the draft changes
function saveTools() {
  $('#resetTools').disabled = sameJSON(tools, DEFAULT_TOOLS);
  markDirty();
}
function commitTools() {
  const isDefault = sameJSON(tools, DEFAULT_TOOLS);
  try { isDefault ? localStorage.removeItem('romelTools') : localStorage.setItem('romelTools', JSON.stringify(tools)); }
  catch (e) { toast('Could not save — browser storage is full.'); return false; }
  toolsSaved = deepCopy(tools);
  renderMarquee();
}
function discardTools() {
  tools = deepCopy(toolsSaved);
  closeIconPicker();
  renderToolList();
}
renderMarquee();

/* --- Admin editor for the tools strip (sidebar → Tools & Technologies) --- */
let pickingIndex = null;
function renderToolList() {
  $('#toolList').innerHTML = tools.map((t, i) =>
    `<div class="tool-row${i === pickingIndex ? ' picking' : ''}" data-tool-index="${i}">`
    + `<button type="button" class="tool-icon" data-pick-icon="${i}" style="--tone:${iconTone(t.icon)}" title="Change icon"><i class="${t.icon}"></i></button>`
    + `<input type="text" class="tool-name" data-tool-name="${i}" value="${escapeHtml(t.name)}" maxlength="30" spellcheck="false" placeholder="Tool name">`
    + `<button type="button" class="tool-remove" data-remove-tool="${i}" title="Remove ${escapeHtml(t.name)}" aria-label="Remove tool"><i class="fa-solid fa-xmark"></i></button></div>`).join('')
    || '<p class="field-hint">No tools yet — add one below.</p>';
  $('#resetTools').disabled = JSON.stringify(tools) === JSON.stringify(DEFAULT_TOOLS);
}
/* Shared icon list: moved into whichever editor opens it, then calls back with the chosen icon */
const iconPicker = { current: '', onPick: null, onClose: null };
function renderIconGrid(query = '') {
  const q = query.trim().toLowerCase();
  const matches = ICON_LIBRARY.filter(([cls, words]) => !q || words.includes(q) || cls.includes(q));
  $('#iconGrid').innerHTML = matches.map(([cls, words, tone]) =>
    `<button type="button" data-icon="${cls}" style="--tone:${tone}" class="${cls === iconPicker.current ? 'current' : ''}" title="${words.split(' ')[0]}"><i class="${cls}"></i></button>`).join('')
    || '<p class="field-hint">No icons match that search.</p>';
}
function showIconPicker(mount, title, current, onPick, onClose) {
  if (iconPicker.onClose) iconPicker.onClose(); // another editor had it open
  Object.assign(iconPicker, { current, onPick, onClose });
  const picker = $('#iconPicker');
  mount.appendChild(picker);
  $('#iconPickerTitle').textContent = title;
  $('#iconSearch').value = '';
  renderIconGrid();
  picker.hidden = false;
  picker.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  $('#iconSearch').focus();
}
function hideIconPicker() {
  const onClose = iconPicker.onClose;
  Object.assign(iconPicker, { current: '', onPick: null, onClose: null });
  $('#iconPicker').hidden = true;
  if (onClose) onClose();
}
$('#iconGrid').addEventListener('click', e => {
  const btn = e.target.closest('[data-icon]');
  if (!btn || !iconPicker.onPick) return;
  iconPicker.onPick(btn.dataset.icon);
  hideIconPicker();
});
$('#iconSearch').addEventListener('input', e => renderIconGrid(e.target.value));
$('#closeIconPicker').addEventListener('click', hideIconPicker);

function openIconPicker(i) {
  hideIconPicker();
  pickingIndex = i;
  renderToolList();
  showIconPicker($('#toolsPickerMount'), `Icon for "${tools[i].name || 'New tool'}"`, tools[i].icon,
    icon => { tools[i].icon = icon; saveTools(); },
    () => { pickingIndex = null; renderToolList(); });
}
const closeIconPicker = () => { if (pickingIndex != null) hideIconPicker(); };
$('#toolList').addEventListener('click', e => {
  const pick = e.target.closest('[data-pick-icon]'), remove = e.target.closest('[data-remove-tool]');
  if (pick) openIconPicker(Number(pick.dataset.pickIcon));
  if (remove) {
    const i = Number(remove.dataset.removeTool), name = tools[i].name;
    closeIconPicker();
    tools.splice(i, 1);
    renderToolList();
    saveTools();
    toast(`Removed ${name || 'tool'}.`);
  }
});
$('#toolList').addEventListener('input', e => {
  if (e.target.dataset.toolName == null) return;
  tools[Number(e.target.dataset.toolName)].name = e.target.value;
  saveTools();
});
$('#addTool').addEventListener('click', () => {
  tools.push({ icon: 'fa-solid fa-star', name: 'New Tool' });
  saveTools();
  renderToolList();
  const input = $(`[data-tool-name="${tools.length - 1}"]`);
  input.focus();
  input.select();
});
$('#resetTools').addEventListener('click', () => {
  tools = deepCopy(DEFAULT_TOOLS);
  closeIconPicker();
  renderToolList();
  saveTools();
  toast('Default tools restored in the editor — click Save changes to apply.');
});
renderToolList();

const loadJSON = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch (e) { return fallback; } };
const clone = obj => JSON.parse(JSON.stringify(obj));
// Saves only when different from the default, so "reset" is simply removing the key
function saveIfChanged(key, value, defaults) {
  const isDefault = JSON.stringify(value) === JSON.stringify(defaults);
  try { isDefault ? localStorage.removeItem(key) : localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  return isDefault;
}

/* ==========================================================================
   CURRENT FOCUS card (sidebar → Current Focus): icon + bullet points
   ========================================================================== */
const DEFAULT_FOCUS = {
  icon: 'fa-solid fa-briefcase',
  bullets: [
    'Responsive, accessible, high-performance websites built for real business goals.',
    'Clear user journeys and polished interfaces rooted in usability and visual craft.',
    'Distinct visual systems that help products communicate with confidence.',
    'Smart automations and tools that make teams faster and more efficient.'
  ]
};
// focusSaved = what the page shows; focusCard = the editor's draft
let focusSaved = loadJSON('romelFocus', clone(DEFAULT_FOCUS));
let focusCard = deepCopy(focusSaved);

function renderFocus() {
  $('#focusIcon').innerHTML = `<i class="${focusSaved.icon}"></i>`;
  $('#focusList').innerHTML = focusSaved.bullets.filter(b => b.trim())
    .map(b => `<li><i class="fa-solid fa-circle-check"></i>${escapeHtml(b)}</li>`).join('');
}
function saveFocus() {
  $('#resetFocus').disabled = sameJSON(focusCard, DEFAULT_FOCUS);
  markDirty();
}
function commitFocus() {
  saveIfChanged('romelFocus', focusCard, DEFAULT_FOCUS);
  focusSaved = deepCopy(focusCard);
  renderFocus();
}
function discardFocus() {
  focusCard = deepCopy(focusSaved);
  hideIconPicker();
  renderFocusEditor();
}
function renderFocusEditor() {
  $('#focusIconBtn').innerHTML = `<i class="${focusCard.icon}"></i>`;
  $('#focusIconBtn').style.setProperty('--tone', iconTone(focusCard.icon));
  $('#focusBullets').innerHTML = focusCard.bullets.map((b, i) =>
    `<div class="tool-row"><textarea class="tool-name bullet-text" data-bullet="${i}" rows="2" maxlength="160" placeholder="Bullet point">${escapeHtml(b)}</textarea>`
    + `<button type="button" class="tool-remove" data-remove-bullet="${i}" title="Remove this bullet" aria-label="Remove bullet"><i class="fa-solid fa-xmark"></i></button></div>`).join('')
    || '<p class="field-hint">No bullet points — add one below.</p>';
  $('#resetFocus').disabled = JSON.stringify(focusCard) === JSON.stringify(DEFAULT_FOCUS);
}
$('#focusIconBtn').addEventListener('click', () => showIconPicker($('#focusPickerMount'), 'Icon for Current Focus', focusCard.icon,
  icon => { focusCard.icon = icon; saveFocus(); renderFocusEditor(); }));
$('#focusBullets').addEventListener('input', e => {
  if (e.target.dataset.bullet == null) return;
  focusCard.bullets[Number(e.target.dataset.bullet)] = e.target.value;
  saveFocus();
});
$('#focusBullets').addEventListener('click', e => {
  const btn = e.target.closest('[data-remove-bullet]');
  if (!btn) return;
  focusCard.bullets.splice(Number(btn.dataset.removeBullet), 1);
  saveFocus();
  renderFocusEditor();
  toast('Bullet removed.');
});
$('#addBullet').addEventListener('click', () => {
  focusCard.bullets.push('New point');
  saveFocus();
  renderFocusEditor();
  const input = $(`[data-bullet="${focusCard.bullets.length - 1}"]`);
  input.focus();
  input.select();
});
$('#resetFocus').addEventListener('click', () => {
  focusCard = clone(DEFAULT_FOCUS);
  saveFocus();
  renderFocusEditor();
  toast('Defaults restored in the editor — click Save changes to apply.');
});

/* ==========================================================================
   SERVICES "What I can do" (sidebar → Services): icon, title, text, link; add/remove
   ========================================================================== */
const DEFAULT_SERVICES = [
  { icon: 'fa-solid fa-code', title: 'Web Development', desc: 'Responsive, accessible, high-performance websites built for real business goals.', linkText: 'View builds', link: '#funnels', style: 'accent' },
  { icon: 'fa-solid fa-pen-ruler', title: 'UI / UX Design', desc: 'Clear user journeys and polished interfaces rooted in usability and visual craft.', linkText: 'See projects', link: '#funnels', style: 'accent' },
  { icon: 'fa-solid fa-swatchbook', title: 'Brand Identity', desc: 'Distinct visual systems that help products communicate with clarity and confidence.', linkText: 'Arc Space case', link: '#funnels', style: 'biloba' },
  { icon: 'fa-solid fa-diagram-project', title: 'Digital Systems', desc: 'Smart automations and tools that make teams faster, smoother, and more efficient.', linkText: 'Explore workflows', link: '#workflows', style: 'mint' }
];
// servicesSaved = what the page shows; services = the editor's draft
let servicesSaved = loadJSON('romelServices', clone(DEFAULT_SERVICES));
let services = deepCopy(servicesSaved);
let svcPicking = null;
// Card links can only point at sections of this page
const linkTargets = () => [['', 'No link'], ...$$('.desktop-nav a').map(a => [a.getAttribute('href'), a.textContent.trim()]), ['#contact', 'Contact']];
const safeLink = link => linkTargets().some(([href]) => href && href === link) ? link : '';

function renderServices() {
  const grid = $('#servicesGrid');
  grid.innerHTML = servicesSaved.map((s, i) => {
    if (s.hidden) return '';
    const link = safeLink(s.link);
    const foot = link && s.linkText.trim()
      ? `<div class="card-foot"><a class="nav-link link-${['accent', 'biloba', 'mint'].includes(s.style) ? s.style : 'accent'}" href="${link}">${escapeHtml(s.linkText)} &rarr;</a></div>` : '';
    return `<article class="card pad-md service reveal" data-svc-i="${i}"><div><div class="icon-box"><i class="${s.icon}"></i></div>`
      + `<h3>${escapeHtml(s.title)}</h3><p>${escapeHtml(s.desc)}</p></div>${foot}</article>`;
  }).join('');
  $$('.reveal', grid).forEach(el => revealer.observe(el));
  layoutServiceGrid();
}
// Pick a column count that fits the visible cards evenly (a short last row is centered by CSS)
function layoutServiceGrid() {
  const grid = $('#servicesGrid');
  // Admins still see page-editor-hidden cards (faded), so only visitors skip them
  const admin = document.body.classList.contains('role-admin');
  const n = [...grid.children].filter(el => admin || !el.classList.contains('card-hidden')).length;
  grid.style.setProperty('--cols', gridCols(n));
}
function gridCols(n) { return n <= 2 ? 2 : [3, 5, 6, 9].includes(n) ? 3 : 4; }
function saveServices() {
  $('#resetServices').disabled = sameJSON(services, DEFAULT_SERVICES);
  markDirty();
}
function commitServices() {
  saveIfChanged('romelServices', services, DEFAULT_SERVICES);
  servicesSaved = deepCopy(services);
  renderServices();
  if (typeof refreshEmptySpaces === 'function') refreshEmptySpaces();
}
function discardServices() {
  services = deepCopy(servicesSaved);
  if (svcPicking != null) hideIconPicker();
  renderServiceEditor();
}
function renderServiceEditor() {
  const targets = linkTargets();
  $('#svcList').innerHTML = services.map((s, i) =>
    `<div class="svc-item${i === svcPicking ? ' picking' : ''}${s.hidden ? ' is-off' : ''}">`
    + `<div class="svc-head"><button type="button" class="mini-btn" data-svc-toggle="${i}" title="${s.hidden ? 'Show this card' : 'Hide this card'}">${eyeIcon(!s.hidden)}</button>`
    + `<button type="button" class="tool-icon" data-svc-icon="${i}" style="--tone:${iconTone(s.icon)}" title="Change icon"><i class="${s.icon}"></i></button>`
    + `<input type="text" class="tool-name" data-svc-field="title" data-i="${i}" value="${escapeHtml(s.title)}" maxlength="40" placeholder="Card title">`
    + `<button type="button" class="tool-remove" data-remove-svc="${i}" title="Remove this card" aria-label="Remove card"><i class="fa-solid fa-xmark"></i></button></div>`
    + `<textarea class="tool-name svc-desc" data-svc-field="desc" data-i="${i}" rows="3" maxlength="200" placeholder="Short description">${escapeHtml(s.desc)}</textarea>`
    + `<div class="svc-link"><input type="text" class="tool-name" data-svc-field="linkText" data-i="${i}" value="${escapeHtml(s.linkText)}" maxlength="30" placeholder="Link text">`
    + `<select class="tool-name" data-svc-field="link" data-i="${i}" title="Where the link goes">${targets.map(([href, label]) => `<option value="${href}"${href === safeLink(s.link) ? ' selected' : ''}>${escapeHtml(label)}</option>`).join('')}</select></div></div>`).join('')
    || '<p class="field-hint">No cards — add one below.</p>';
  $('#resetServices').disabled = JSON.stringify(services) === JSON.stringify(DEFAULT_SERVICES);
}
$('#svcList').addEventListener('input', e => {
  const field = e.target.dataset.svcField;
  if (!field) return;
  services[Number(e.target.dataset.i)][field] = e.target.value;
  saveServices();
});
$('#svcList').addEventListener('click', e => {
  const pick = e.target.closest('[data-svc-icon]'), remove = e.target.closest('[data-remove-svc]'), toggle = e.target.closest('[data-svc-toggle]');
  if (toggle) {
    const s = services[Number(toggle.dataset.svcToggle)];
    if (s.hidden) delete s.hidden; else s.hidden = true;
    saveServices();
    renderServiceEditor();
    return;
  }
  if (pick) {
    const i = Number(pick.dataset.svcIcon);
    hideIconPicker();
    svcPicking = i;
    renderServiceEditor();
    showIconPicker($('#svcPickerMount'), `Icon for "${services[i].title || 'card'}"`, services[i].icon,
      icon => { services[i].icon = icon; saveServices(); },
      () => { svcPicking = null; renderServiceEditor(); });
  }
  if (remove) {
    const i = Number(remove.dataset.removeSvc), title = services[i].title;
    if (svcPicking != null) hideIconPicker();
    services.splice(i, 1);
    saveServices();
    renderServiceEditor();
    toast(`Removed "${title || 'card'}".`);
  }
});
$('#addService').addEventListener('click', () => {
  services.push({ icon: 'fa-solid fa-star', title: 'New Service', desc: 'Describe what this service includes.', linkText: 'Learn more', link: '#contact', style: 'accent' });
  saveServices();
  renderServiceEditor();
  const input = $(`[data-svc-field="title"][data-i="${services.length - 1}"]`);
  input.focus();
  input.select();
});
$('#resetServices').addEventListener('click', () => {
  services = clone(DEFAULT_SERVICES);
  if (svcPicking != null) hideIconPicker();
  saveServices();
  renderServiceEditor();
  toast('Default cards restored in the editor — click Save changes to apply.');
});

/* ==========================================================================
   HERO (sidebar → Hero): headline, description, badge, stat boxes, buttons, photo
   ========================================================================== */
const DEFAULT_HERO = {
  badge: { text: 'Available for select projects', show: true },
  stats: [
    { value: '3+', label: 'Years Building', color: 'turq', show: true },
    { value: '25+', label: 'Projects Shipped', color: 'biloba', show: true },
    { value: '100%', label: 'Committed', color: 'mint', show: true },
    { value: '∞', label: 'Curiosity', color: 'biloba', show: true }
  ],
  buttons: [
    { text: 'Start a Project', icon: 'fa-solid fa-calendar-check', link: '#contact', style: 'primary', show: true },
    { text: 'View My Work', icon: 'fa-solid fa-play', link: '#funnels', style: 'outline', show: true }
  ],
  photo: { src: '', show: true },
  video: { text: 'My Loom Video', link: '', show: true }
};
// A pasted http(s) link, or a file uploaded into the site's videos/ folder
const isUploadedVideo = url => /^videos\/[\w-]+\.(mp4|m4v|mov|webm|ogg)$/i.test(url || '');
const videoLink = url => { url = (url || '').trim(); return /^https?:\/\//i.test(url) || isUploadedVideo(url) ? url : ''; };
// heroSaved = what the page shows; hero + heroText (headline / description) = the editor's draft
let heroSaved = Object.assign(clone(DEFAULT_HERO), loadJSON('romelHero', {}));
let hero = deepCopy(heroSaved);
let heroText = { headline: content.headline, description: content.description };
const STAT_COLORS = { turq: 'Main color', mint: 'Accent 1', biloba: 'Accent 2' };
const heroButtonLinks = () => [...linkTargets().filter(([href]) => href), ['cv', 'My Resume']];
const eyeIcon = show => `<i class="fa-solid ${show ? 'fa-eye' : 'fa-eye-slash'}"></i>`;

function renderHero() {
  const hero = heroSaved; // the page always shows the saved hero
  const badge = $('#hero .pill-badge');
  badge.hidden = !hero.badge.show || !hero.badge.text.trim();
  badge.querySelector('span:last-child').textContent = hero.badge.text;

  const stats = hero.stats.filter(s => s.show && (s.value.trim() || s.label.trim()));
  const grid = $('#hero .stat-grid');
  grid.hidden = !stats.length;
  grid.style.setProperty('--stat-cols', Math.min(stats.length, 4) || 1);
  grid.innerHTML = stats.map(s => `<div class="card stat"><strong class="c-${STAT_COLORS[s.color] ? s.color : 'turq'}">${escapeHtml(s.value)}</strong><span>${escapeHtml(s.label)}</span></div>`).join('');

  const buttons = hero.buttons.filter(b => b.show && b.text.trim());
  const actions = $('#hero .hero-actions');
  actions.hidden = !buttons.length;
  actions.innerHTML = buttons.map(b => {
    const style = b.style === 'outline' ? 'outline' : 'primary';
    const icon = `<i class="${b.icon}${style === 'outline' ? ' accent' : ''}"></i>`;
    if (b.link === 'cv') return `<button type="button" class="btn btn-${style}" data-open="cvModal">${icon}<span>${escapeHtml(b.text)}</span></button>`;
    const href = safeLink(b.link) || '#contact';
    return `<a class="btn btn-${style} nav-link" href="${href}">${icon}<span>${escapeHtml(b.text)}</span></a>`;
  }).join('');

  $('.portrait-photo').src = hero.photo.src || 'Romel Photo.jpg';
  $('#hero .hero-visual').hidden = !hero.photo.show;
  $('#hero .hero-grid').classList.toggle('no-photo', !hero.photo.show);

  // Video button: under the photo, or beside the other buttons when the photo is hidden.
  // Without a link it only shows for the admin (dimmed), never for visitors.
  const video = Object.assign(clone(DEFAULT_HERO.video), hero.video);
  const vbtn = $('#heroVideoBtn');
  vbtn.querySelector('span').textContent = video.text.trim() || DEFAULT_HERO.video.text;
  vbtn.hidden = !video.show;
  vbtn.classList.toggle('no-link', !videoLink(video.link));
  (hero.photo.show ? $('#hero .hero-visual') : actions).appendChild(vbtn);
  vbtn.classList.toggle('in-actions', !hero.photo.show);
  if (!hero.photo.show && video.show && videoLink(video.link)) actions.hidden = false;
}
$('#hero .hero-actions').addEventListener('click', e => {
  const btn = e.target.closest('[data-open]');
  if (btn) openModal(btn.dataset.open);
});
$('#heroVideoBtn').addEventListener('click', () => {
  const video = Object.assign(clone(DEFAULT_HERO.video), heroSaved.video);
  playVideo(videoLink(video.link), video.text.trim() || DEFAULT_HERO.video.text,
    role === 'admin' ? 'No video yet. Paste your Loom link in Hero (Top Section) → Video button.' : 'Video coming soon.');
});
// Editor changes only touch the draft
function saveHero() { updateHeroResets(); markDirty(); }
function saveHeadlineContent() { updateHeroResets(); markDirty(); }
const heroDirty = () => !sameJSON(hero, heroSaved) || heroText.headline !== content.headline || heroText.description !== content.description;
function commitHero() {
  try {
    const isDefault = sameJSON(hero, DEFAULT_HERO);
    isDefault ? localStorage.removeItem('romelHero') : localStorage.setItem('romelHero', JSON.stringify(hero));
    content.headline = heroText.headline;
    content.description = heroText.description;
    localStorage.setItem('romelPortfolioContent', JSON.stringify(content));
  } catch (e) { toast('Could not save — the photo is too large for browser storage. Try a smaller one.'); return false; }
  heroSaved = deepCopy(hero);
  renderHero();
  applyContent();
}
function discardHero() {
  hero = deepCopy(heroSaved);
  heroText = { headline: content.headline, description: content.description };
  hideIconPicker();
  renderHeroEditor();
}

function updateHeroResets() {
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const changed = {
    headline: heroText.headline !== defaultContent.headline, description: heroText.description !== defaultContent.description,
    badge: !same(hero.badge, DEFAULT_HERO.badge), stats: !same(hero.stats, DEFAULT_HERO.stats),
    buttons: !same(hero.buttons, DEFAULT_HERO.buttons), photo: !same(hero.photo, DEFAULT_HERO.photo),
    video: !same(hero.video, DEFAULT_HERO.video)
  };
  $$('[data-hero-reset]').forEach(btn => btn.disabled = !changed[btn.dataset.heroReset]);
}
function renderHeroEditor() {
  $('#heroHeadlineInput').value = heroText.headline;
  $('#heroDescInput').value = heroText.description;
  $('#heroBadgeInput').value = hero.badge.text;
  $('#heroBadgeToggle').innerHTML = eyeIcon(hero.badge.show);
  $('#heroBadgeToggle').closest('.tool-row').classList.toggle('is-off', !hero.badge.show);

  $('#heroStats').innerHTML = hero.stats.map((s, i) =>
    `<div class="tool-row hero-stat-row${s.show ? '' : ' is-off'}">`
    + `<button type="button" class="mini-btn" data-stat-toggle="${i}" title="Show / hide">${eyeIcon(s.show)}</button>`
    + `<input type="text" class="tool-name stat-value" data-stat-field="value" data-i="${i}" value="${escapeHtml(s.value)}" maxlength="8" placeholder="3+">`
    + `<input type="text" class="tool-name" data-stat-field="label" data-i="${i}" value="${escapeHtml(s.label)}" maxlength="30" placeholder="Label">`
    + `<select class="tool-name stat-color" data-stat-field="color" data-i="${i}" title="Number color">${Object.entries(STAT_COLORS).map(([k, v]) => `<option value="${k}"${k === s.color ? ' selected' : ''}>${v}</option>`).join('')}</select>`
    + `<button type="button" class="tool-remove" data-stat-remove="${i}" title="Remove" aria-label="Remove stat"><i class="fa-solid fa-xmark"></i></button></div>`).join('')
    || '<p class="field-hint">No stat boxes.</p>';

  $('#heroButtons').innerHTML = hero.buttons.map((b, i) =>
    `<div class="svc-item${b.show ? '' : ' is-off'}"><div class="svc-head">`
    + `<button type="button" class="mini-btn" data-btn-toggle="${i}" title="Show / hide">${eyeIcon(b.show)}</button>`
    + `<button type="button" class="tool-icon" data-btn-icon="${i}" style="--tone:${iconTone(b.icon)}" title="Change icon"><i class="${b.icon}"></i></button>`
    + `<input type="text" class="tool-name" data-btn-field="text" data-i="${i}" value="${escapeHtml(b.text)}" maxlength="40" placeholder="Button text">`
    + `<button type="button" class="tool-remove" data-btn-remove="${i}" title="Remove" aria-label="Remove button"><i class="fa-solid fa-xmark"></i></button></div>`
    + `<div class="svc-link"><select class="tool-name" data-btn-field="link" data-i="${i}" title="What the button opens">${heroButtonLinks().map(([href, label]) => `<option value="${href}"${href === b.link ? ' selected' : ''}>${escapeHtml(label)}</option>`).join('')}</select>`
    + `<select class="tool-name" data-btn-field="style" data-i="${i}" title="Button style"><option value="primary"${b.style !== 'outline' ? ' selected' : ''}>Filled</option><option value="outline"${b.style === 'outline' ? ' selected' : ''}>Outline</option></select></div></div>`).join('')
    || '<p class="field-hint">No buttons.</p>';
  $('#addHeroButton').disabled = hero.buttons.length >= 4;

  $('#heroPhotoThumb').src = hero.photo.src || 'Romel Photo.jpg';
  $('#heroPhotoToggle').innerHTML = `<i class="fa-solid ${hero.photo.show ? 'fa-eye-slash' : 'fa-eye'} accent"></i><span>${hero.photo.show ? 'Hide Photo' : 'Show Photo'}</span>`;

  hero.video = Object.assign(clone(DEFAULT_HERO.video), hero.video);
  $('#heroVideoText').value = hero.video.text;
  const uploaded = isUploadedVideo(hero.video.link);
  $('#heroVideoLink').value = uploaded ? '' : hero.video.link;
  $('#heroVideoFileRow').hidden = !uploaded;
  $('#heroVideoFileName').textContent = uploaded ? (hero.video.fileName || hero.video.link.split('/').pop()) : '';
  $('#uploadHeroVideo span').textContent = uploaded ? 'Replace Video File' : 'Upload Video File';
  $('#heroVideoToggle').innerHTML = eyeIcon(hero.video.show);
  $('#heroVideoToggle').closest('.tool-row').classList.toggle('is-off', !hero.video.show);
  updateHeroResets();
}
$('#heroVideoText').addEventListener('input', e => { hero.video.text = e.target.value; saveHero(); });
$('#heroVideoLink').addEventListener('input', e => {
  // Typing a link replaces an uploaded file
  hero.video.link = e.target.value.trim();
  delete hero.video.fileName;
  $('#heroVideoFileRow').hidden = true;
  $('#uploadHeroVideo span').textContent = 'Upload Video File';
  saveHero();
});
$('#uploadHeroVideo').addEventListener('click', () => $('#heroVideoFile').click());
$('#heroVideoFile').addEventListener('change', e => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  if (!/\.(mp4|m4v|mov|webm|ogg)$/i.test(file.name)) return toast('Please choose an MP4, MOV or WebM video.');
  if (file.size > 95 * 1024 * 1024) return toast(`That video is ${Math.round(file.size / 1048576)} MB — the limit is 95 MB. Trim it or record at 1080p, then try again.`);
  // Sent to the local server (saved in the project's videos/ folder), with a progress bar
  const button = $('#uploadHeroVideo'), bar = $('#heroVideoProgress');
  button.disabled = true;
  bar.hidden = false;
  bar.firstElementChild.style.width = '0%';
  const xhr = new XMLHttpRequest();
  xhr.open('POST', `/__upload-video?name=${encodeURIComponent(file.name)}`);
  xhr.upload.onprogress = ev => { if (ev.lengthComputable) bar.firstElementChild.style.width = Math.round(ev.loaded / ev.total * 100) + '%'; };
  const done = () => { button.disabled = false; bar.hidden = true; };
  xhr.onload = () => {
    done();
    const path = xhr.responseText.trim();
    if (xhr.status !== 200 || !isUploadedVideo(path)) return toast(xhr.status === 413 ? 'That video is too large (max 95 MB).' : 'Upload failed — open the site from http://localhost:8000 and try again.');
    hero.video.link = path;
    hero.video.fileName = file.name;
    hero.video.show = true;
    saveHero();
    renderHeroEditor();
    toast('Video uploaded — click Save changes to put it on the button.');
  };
  xhr.onerror = () => { done(); toast('Upload failed — open the site from http://localhost:8000 and try again.'); };
  xhr.send(file);
});
$('#removeHeroVideoFile').addEventListener('click', () => {
  hero.video.link = '';
  delete hero.video.fileName;
  saveHero();
  renderHeroEditor();
});
$('#heroVideoToggle').addEventListener('click', () => { hero.video.show = !hero.video.show; saveHero(); renderHeroEditor(); });
$('#testHeroVideo').addEventListener('click', () => {
  const url = videoLink(hero.video.link);
  if (hero.video.link && !url) return toast('Paste a full link that starts with https://');
  playVideo(url, hero.video.text.trim() || DEFAULT_HERO.video.text, 'No video yet. Paste your Loom link above.');
});

// Text fields save as you type without rebuilding the editor (keeps the cursor in place)
$('#heroHeadlineInput').addEventListener('input', e => { heroText.headline = e.target.value; saveHeadlineContent(); });
$('#heroDescInput').addEventListener('input', e => { heroText.description = e.target.value; saveHeadlineContent(); });
$('#heroBadgeInput').addEventListener('input', e => { hero.badge.text = e.target.value; saveHero(); });
$('#heroBadgeToggle').addEventListener('click', () => { hero.badge.show = !hero.badge.show; saveHero(); renderHeroEditor(); });

$('#heroStats').addEventListener('input', e => {
  const field = e.target.dataset.statField;
  if (!field) return;
  hero.stats[Number(e.target.dataset.i)][field] = e.target.value;
  saveHero();
});
$('#heroStats').addEventListener('click', e => {
  const toggle = e.target.closest('[data-stat-toggle]'), remove = e.target.closest('[data-stat-remove]');
  if (toggle) { const s = hero.stats[Number(toggle.dataset.statToggle)]; s.show = !s.show; }
  else if (remove) hero.stats.splice(Number(remove.dataset.statRemove), 1);
  else return;
  saveHero();
  renderHeroEditor();
});
$('#addHeroStat').addEventListener('click', () => {
  hero.stats.push({ value: '10+', label: 'New Stat', color: 'turq', show: true });
  saveHero();
  renderHeroEditor();
  const input = $(`[data-stat-field="value"][data-i="${hero.stats.length - 1}"]`);
  input.focus();
  input.select();
});

$('#heroButtons').addEventListener('input', e => {
  const field = e.target.dataset.btnField;
  if (!field) return;
  hero.buttons[Number(e.target.dataset.i)][field] = e.target.value;
  saveHero();
});
$('#heroButtons').addEventListener('click', e => {
  const toggle = e.target.closest('[data-btn-toggle]'), remove = e.target.closest('[data-btn-remove]'), icon = e.target.closest('[data-btn-icon]');
  if (icon) {
    const i = Number(icon.dataset.btnIcon);
    return showIconPicker($('#heroPickerMount'), `Icon for "${hero.buttons[i].text || 'button'}"`, hero.buttons[i].icon,
      cls => { hero.buttons[i].icon = cls; saveHero(); renderHeroEditor(); });
  }
  if (toggle) { const b = hero.buttons[Number(toggle.dataset.btnToggle)]; b.show = !b.show; }
  else if (remove) { hideIconPicker(); hero.buttons.splice(Number(remove.dataset.btnRemove), 1); }
  else return;
  saveHero();
  renderHeroEditor();
});
$('#addHeroButton').addEventListener('click', () => {
  if (hero.buttons.length >= 4) return;
  hero.buttons.push({ text: 'New Button', icon: 'fa-solid fa-arrow-right', link: '#contact', style: 'outline', show: true });
  saveHero();
  renderHeroEditor();
  const input = $(`[data-btn-field="text"][data-i="${hero.buttons.length - 1}"]`);
  input.focus();
  input.select();
});

// Photo: resized to max 900px JPEG so it fits in browser storage and niches.js
$('#uploadHeroPhoto').addEventListener('click', () => $('#heroPhotoFile').click());
$('#heroPhotoFile').addEventListener('change', e => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file || !file.type.startsWith('image/')) return toast('Please choose an image file.');
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 900 / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      hero.photo.src = c.toDataURL('image/jpeg', .86);
      hero.photo.show = true;
      saveHero();
      renderHeroEditor();
      toast('Photo ready — click Save changes to put it on the page.');
    };
    img.onerror = () => toast('That image could not be read.');
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});
$('#heroPhotoToggle').addEventListener('click', () => { hero.photo.show = !hero.photo.show; saveHero(); renderHeroEditor(); });

$$('[data-hero-reset]').forEach(btn => btn.addEventListener('click', () => {
  const part = btn.dataset.heroReset;
  if (part === 'headline' || part === 'description') {
    heroText[part] = defaultContent[part];
    saveHeadlineContent();
  } else {
    if (part === 'buttons') hideIconPicker();
    hero[part] = clone(DEFAULT_HERO[part]);
    saveHero();
  }
  renderHeroEditor();
  toast(`${part[0].toUpperCase() + part.slice(1)} restored in the editor — click Save changes to apply.`);
}));

/* ==========================================================================
   IMAGES (admin hover "Edit image" button): upload / replace + caption for
   workflow schemas, A2P approvals, integration schemas and funnel previews.
   ========================================================================== */
let imageEdits = loadJSON('romelImages', {});
const MANAGED_IMAGES = [];
const projectTitle = art => ($('h3', art.closest('.project')) || {}).textContent || 'Project';
$$('#workflows .img-preview').forEach((el, i) => MANAGED_IMAGES.push({ id: `wf-${i}`, kind: 'preview', el, group: 'Workflow' }));
$$('#approvals .img-preview').forEach((el, i) => MANAGED_IMAGES.push({ id: `a2p-${i}`, kind: 'preview', el, group: 'A2P approval' }));
$$('#integrations [data-lightbox-src="diagram"]').forEach((el, i) => MANAGED_IMAGES.push({ id: `int-${i}`, kind: 'schema', el, group: 'Integration schema' }));
$$('#funnels .project-art').forEach((el, i) => MANAGED_IMAGES.push({ id: `fn-${i}`, kind: 'project', el, group: 'Project preview' }));
// Remember the originals so every image / caption can be restored
MANAGED_IMAGES.forEach(m => {
  m.origSrc = m.kind === 'preview' ? $('img', m.el).src : '';
  m.origCaption = m.kind === 'preview' ? m.el.dataset.lightbox : m.kind === 'schema' ? m.el.dataset.diagramTitle : projectTitle(m.el);
});
const imageById = id => MANAGED_IMAGES.find(m => m.id === id);
const imageCaption = m => (imageEdits[m.id] && imageEdits[m.id].caption) || m.origCaption;
const imageSrc = m => (imageEdits[m.id] && imageEdits[m.id].src) || m.origSrc;

function applyImage(m) {
  const custom = (imageEdits[m.id] || {}).src || '', caption = imageCaption(m);
  if (m.kind === 'preview') {
    $('img', m.el).src = imageSrc(m);
    m.el.dataset.lightbox = caption;
  } else if (m.kind === 'schema') {
    m.el.dataset.customSrc = custom;
    m.el.dataset.diagramTitle = caption;
  } else {
    // Funnel cards show a design mockup until a screenshot is uploaded; then the screenshot covers it and zooms
    m.el.classList.toggle('has-shot', !!custom);
    let shot = $('.project-shot', m.el);
    if (custom && !shot) { shot = document.createElement('img'); shot.className = 'project-shot'; shot.alt = ''; m.el.appendChild(shot); }
    if (shot) { shot.src = custom; shot.alt = caption; shot.hidden = !custom; }
    m.el.dataset.caption = caption;
  }
}
function saveImages(id, previous) {
  Object.keys(imageEdits).forEach(k => { if (!imageEdits[k].src && !imageEdits[k].caption) delete imageEdits[k]; });
  try { localStorage.setItem('romelImages', JSON.stringify(imageEdits)); }
  catch (e) {
    imageEdits[id] = previous; // roll back the change that didn't fit
    toast('Browser storage is full — replace or restore some other images first.');
    return false;
  }
  applyImage(imageById(id));
  return true;
}

// Admin-only "Edit image" buttons (CSS hides them for clients / visitors)
MANAGED_IMAGES.forEach(m => {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'img-edit-btn';
  btn.dataset.imgEdit = m.id;
  btn.innerHTML = '<i class="fa-solid fa-pen"></i><span>Edit image</span>';
  if (m.kind === 'schema') { btn.classList.add('inline'); m.el.after(btn); }
  else m.el.appendChild(btn);
  applyImage(m);
});
// Funnel screenshots open in the zoom viewer like the other images
$$('#funnels .project-art').forEach(art => art.addEventListener('click', e => {
  if (art.classList.contains('has-shot') && !e.target.closest('.img-edit-btn')) openLightbox($('.project-shot', art).src, art.dataset.caption);
}));

// The image editor works on imageDraft; the page changes only when "Save" is clicked
let editingImageId = null, imageDraft = { src: '', caption: '' };
const savedImage = id => ({ src: (imageEdits[id] || {}).src || '', caption: (imageEdits[id] || {}).caption || '' });
const imageDirty = () => !!editingImageId && !sameJSON(imageDraft, savedImage(editingImageId));
function renderImageEditor() {
  const m = imageById(editingImageId);
  const caption = imageDraft.caption || m.origCaption;
  const src = m.kind === 'schema' ? imageDraft.src || diagramSvg(m.el.dataset.diagramTitle, m.el.dataset.diagramSteps.split('|'))
    : m.kind === 'project' ? imageDraft.src : imageDraft.src || m.origSrc;
  $('#imgEditTitle').textContent = `${m.group}: ${caption}`;
  $('#imgEditPreview').src = src || '';
  $('#imgEditPreview').hidden = !src;
  $('#imgEditEmpty').hidden = !!src;
  if (document.activeElement !== $('#imgEditCaption')) $('#imgEditCaption').value = caption;
  $('#imgEditRestoreImg').disabled = !imageDraft.src;
  $('#imgEditRestoreCaption').disabled = !imageDraft.caption;
  $('#imgEditSave').disabled = !imageDirty();
  markDirty();
}
function commitImage() {
  const id = editingImageId, previous = imageEdits[id] ? { ...imageEdits[id] } : undefined;
  imageEdits[id] = { ...imageDraft };
  if (!saveImages(id, previous)) return false;
  renderImageEditor();
}
function discardImage() {
  if (!editingImageId) return;
  imageDraft = savedImage(editingImageId);
  renderImageEditor();
}
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-img-edit]');
  if (!btn) return;
  e.preventDefault();
  e.stopPropagation(); // don't also open the zoom viewer underneath
  editingImageId = btn.dataset.imgEdit;
  imageDraft = savedImage(editingImageId);
  renderImageEditor();
  openModal('imageEditModal');
}, true);
$('#imgEditSave').addEventListener('click', () => {
  if (commitImage() === false) return;
  toast('Image saved.');
  closeModal($('#imageEditModal'), true);
});

// Compress screenshots: max 1600px, WebP (JPEG fallback); shrink further if still heavy
function compressImage(file, done) {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const encode = (maxSide, quality) => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        const ctx2 = c.getContext('2d');
        ctx2.fillStyle = '#FFFFFF';
        ctx2.fillRect(0, 0, c.width, c.height);
        ctx2.drawImage(img, 0, 0, c.width, c.height);
        const webp = c.toDataURL('image/webp', quality);
        return webp.startsWith('data:image/webp') ? webp : c.toDataURL('image/jpeg', quality);
      };
      let data = encode(1600, .82);
      if (data.length > 700000) data = encode(1200, .72);
      done(data);
    };
    img.onerror = () => toast('That image could not be read.');
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}
$('#imgEditUpload').addEventListener('click', () => $('#imgEditFile').click());
$('#imgEditFile').addEventListener('change', e => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file || !file.type.startsWith('image/')) return toast('Please choose an image file.');
  if (file.size > 15 * 1024 * 1024) return toast('That image is too large (max 15 MB).');
  compressImage(file, data => {
    imageDraft.src = data;
    renderImageEditor();
    toast(`Image ready (${Math.round(data.length / 1024)} KB) — click Save to put it on the page.`);
  });
});
$('#imgEditRestoreImg').addEventListener('click', () => { imageDraft.src = ''; renderImageEditor(); });
$('#imgEditCaption').addEventListener('input', e => {
  const m = imageById(editingImageId), value = e.target.value;
  imageDraft.caption = value.trim() && value !== m.origCaption ? value : '';
  renderImageEditor();
});
$('#imgEditRestoreCaption').addEventListener('click', e => {
  e.preventDefault();
  imageDraft.caption = '';
  $('#imgEditCaption').value = imageById(editingImageId).origCaption;
  renderImageEditor();
});

/* ==========================================================================
   AI AGENT CHAT DEMO
   ========================================================================== */
function playChat() {
  const bubbles = $$('#chatDemo .bubble');
  bubbles.forEach(b => b.classList.remove('show'));
  bubbles.forEach((b, i) => setTimeout(() => b.classList.add('show'), 350 + i * 1100));
}
const chatObserver = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting) { playChat(); chatObserver.disconnect(); }
}, { threshold: .4 });
chatObserver.observe($('#chatDemo'));
$('#chatReplay').addEventListener('click', playChat);

/* ==========================================================================
   CALENDAR DEMO
   ========================================================================== */
(function buildCalendar() {
  const now = new Date(), year = now.getFullYear(), month = now.getMonth();
  const first = new Date(year, month, 1).getDay(), days = new Date(year, month + 1, 0).getDate();
  const slots = ['9:00 AM', '10:30 AM', '1:00 PM', '3:00 PM', '4:30 PM'];
  $('#calMonth').textContent = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  let html = ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => `<span class="dow">${d}</span>`).join('');
  html += '<span class="cal-day empty"></span>'.repeat(first);
  for (let d = 1; d <= days; d++) {
    const weekday = (first + d - 1) % 7, past = d < now.getDate();
    const state = weekday === 0 || weekday === 6 || past ? '' : (d * 7) % 5 === 0 ? 'booked' : 'open';
    html += `<button type="button" class="cal-day ${state}" data-day="${d}" ${state === 'open' ? '' : 'disabled'}>${d}</button>`;
  }
  const grid = $('#calGrid');
  grid.innerHTML = html;
  grid.addEventListener('click', e => {
    const day = e.target.closest('.cal-day.open');
    if (!day) return;
    $$('.cal-day.selected', grid).forEach(el => el.classList.remove('selected'));
    day.classList.add('selected');
    const free = slots.filter((_, i) => (Number(day.dataset.day) + i) % 3 !== 0);
    $('#calNote').innerHTML = `Open slots on day ${day.dataset.day}: <b>${free.join(' • ')}</b>`;
  });
})();

/* ==========================================================================
   WORKFLOW FILTER PILLS (exclusive)
   ========================================================================== */
const filterButtons = $$('.filter-btn');
// Counts only cards clients can see; categories left with no visible cards lose their button for clients
function syncWorkflowFilters() {
  const admin = document.body.classList.contains('role-admin');
  filterButtons.forEach(btn => {
    const cards = $$(`.auto-card[data-category="${btn.dataset.filter}"]`);
    const visible = cards.filter(c => !c.classList.contains('card-hidden')).length;
    $('.count', btn).textContent = admin ? cards.length : visible;
    btn.classList.toggle('no-cards', !visible);
  });
  const active = filterButtons.find(btn => btn.classList.contains('active'));
  if (!admin && active && active.classList.contains('no-cards')) {
    const next = filterButtons.find(btn => !btn.classList.contains('no-cards'));
    if (next) filterWorkflows(next.dataset.filter);
  }
}
function filterWorkflows(category) {
  filterButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.filter === category));
  $$('.auto-card').forEach(card => card.hidden = card.dataset.category !== category);
}
filterButtons.forEach(btn => btn.addEventListener('click', () => filterWorkflows(btn.dataset.filter)));
filterWorkflows(filterButtons[0].dataset.filter);

/* ==========================================================================
   CONTACT: tabs, calendar embed, Gmail compose form
   ========================================================================== */
$$('.tab-btn').forEach(btn => btn.addEventListener('click', () => {
  $$('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));
  $$('.tab-panel').forEach(panel => panel.hidden = panel.id !== btn.dataset.tab);
}));

const gmailUrl = (subject, body = '') => `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(CONFIG.email)}&su=${encodeURIComponent(subject)}${body ? '&body=' + encodeURIComponent(body) : ''}`;

if (CONFIG.calendlyUrl) {
  $('#callFallback').hidden = true;
  const widget = document.createElement('div');
  widget.className = 'calendly-inline-widget';
  widget.dataset.url = CONFIG.calendlyUrl + (CONFIG.calendlyUrl.includes('?') ? '&' : '?') + 'hide_gdpr_banner=1&background_color=080c16&text_color=ffffff&primary_color=60bce7';
  $('#calendlyMount').appendChild(widget);
  const script = document.createElement('script');
  script.src = 'https://assets.calendly.com/assets/external/widget.js';
  script.async = true;
  document.body.appendChild(script);
}
$('#callEmailLink').href = `mailto:${CONFIG.email}?subject=${encodeURIComponent('Discovery Call Request')}`;

$('#contactForm').addEventListener('submit', e => {
  e.preventDefault();
  const data = new FormData(e.currentTarget);
  const name = data.get('name'), email = data.get('email'), message = data.get('message');
  const body = `Hello ${content.name.split(' ')[0]},\n\nMy Name: ${name}\nMy Email: ${email}\n\nProject Details:\n${message}\n\nLooking forward to hearing from you!`;
  window.open(gmailUrl(`Project Inquiry - ${name}`, body), '_blank', 'noopener');
});

/* ==========================================================================
   CV MODAL
   ========================================================================== */
// Pre-written so the client only has to press Send
const resumeRequestSubject = () => `${content.name} Resume Request`;
const resumeRequestBody = () => `Hi ${content.name.trim().split(/\s+/)[0]},

I came across your portfolio and I'm interested in learning more about your experience. Could you please send me a copy of your resume?

Thank you, and I look forward to hearing from you.`;
$('#cvEmail').href = gmailUrl(resumeRequestSubject(), resumeRequestBody());

/* Resume by email: address → ready-made email → Send. resume-mailer.gs notifies Romel and emails the resume back. */
const resumeSteps = { email: $('#resumeEmailStep'), send: $('#resumeSendStep'), done: $('#resumeDoneStep') };
const showResumeStep = step => Object.entries(resumeSteps).forEach(([key, el]) => { el.hidden = key !== step; });
function startResumeRequest() {
  resumeSteps.email.reset();
  $('#resumeError').hidden = true;
  showResumeStep('email');
}
resumeSteps.email.addEventListener('submit', e => {
  e.preventDefault();
  $('#resumeFrom').textContent = $('#resumeEmail').value.trim();
  $('#resumeTo').textContent = content.name;
  $('#resumeSubject').textContent = resumeRequestSubject();
  $('#resumeMessage').value = resumeRequestBody();
  $('#resumeError').hidden = true;
  showResumeStep('send');
});
$('#resumeBack').addEventListener('click', () => showResumeStep('email'));
resumeSteps.send.addEventListener('submit', async e => {
  e.preventDefault();
  const email = $('#resumeEmail').value.trim(), send = $('#resumeSend'), label = $('span', send);
  send.disabled = true;
  label.textContent = 'Sending…';
  $('#resumeError').hidden = true;
  try {
    const r = await fetch(CONFIG.resumeMailUrl, { method: 'POST', body: new URLSearchParams({
      email,
      message: $('#resumeMessage').value,
      resumeUrl: new URL(resumeSaved.url, location.href).href,
      website: $('#resumeWebsite').value
    }) });
    const result = await r.json();
    if (!result.ok) throw new Error(result.error);
    $('#resumeDoneEmail').textContent = email;
    showResumeStep('done');
  } catch (err) {
    $('#resumeError').textContent = err.message === 'email'
      ? 'That email address doesn\'t look right. Please go back and check it.'
      : `Sorry, that didn't send. Please try again, or email me at ${CONFIG.email}.`;
    $('#resumeError').hidden = false;
  }
  send.disabled = false;
  label.textContent = 'Send';
});
if (CONFIG.cvUrl) $('#cvDownload').href = CONFIG.cvUrl;
else $('#cvDownload').hidden = true;

/* ==========================================================================
   ACCOUNT ROLES — Admin (view & control everything) / Client (view only)
   ========================================================================== */
const ADMIN = { email: 'admin@romel.dev', password: '1234' };
const store = {
  get: (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch (e) { return fallback; } },
  set: (key, value) => localStorage.setItem(key, JSON.stringify(value))
};
const cmsPanel = $('#cmsPanel'), sectionsPanel = $('#sectionsPanel');
let role = sessionStorage.getItem('romelRole') === 'admin' ? 'admin' : 'client';
let hiddenSections = store.get('romelHiddenSections', []);
// Content hidden with the eye in the sidebar CONTENT menu (tools / focus / services / cards)
let hiddenContent = store.get('romelHiddenContent', []);
// What each eye hides on the page. Page Cards hides every built-in section it manages (all but Hero).
const CONTENT_TARGETS = {
  tools: () => [$('#marqueeTrack').closest('.card')],
  focus: () => [$('#focusList').closest('.card')],
  services: () => [$('#services .section-head'), $('#servicesGrid')]
};
function applyContentVisibility() {
  Object.entries(CONTENT_TARGETS).forEach(([key, els]) => els().forEach(el => el && el.classList.toggle('content-hidden', hiddenContent.includes(key))));
}

// Every text element the admin can edit in place. Name / role / hero text are edited from the Content panel,
// and the Current Focus bullets + service cards from their own sidebar editors, so those are skipped here.
const EDITABLE = 'main h1, main h2, main h3, main h4, main p, main li, main .mono-sub, main .mono-label span, main .section-tag, main .pill-badge span, main .pill-tag, main .stat strong, main .stat span, main .btn span, main .chips span, main .tags span, main .flow-node, main .group-label, main .info-list a, main .info-cards a, main .info-cards strong, main .project-info a, .site-footer .copyright';
// Areas with their own sidebar editor. V2 = before the Hero editor existed; V3 = current.
const OWN_EDITOR_AREAS_V2 = '#servicesGrid, #focusList';
const OWN_EDITOR_AREAS = '#servicesGrid, #focusList, #hero .pill-badge, #hero .stat-grid, #hero .hero-actions';
function collectEditables(skipAreas) {
  // #heroVideoBtn has its own Hero setting and came later, so it never shifts the position keys
  const all = $$(EDITABLE).filter(el => !el.matches('[data-content], #heroHeadline, #heroDescription, #calNote') && !el.querySelector('[data-content]')
    && !el.closest('#heroVideoBtn')
    && !(skipAreas && el.closest(skipAreas)));
  return all.filter(el => !all.some(other => other !== el && other.contains(el)));
}
const editables = collectEditables(OWN_EDITOR_AREAS);

// Edits are keyed by position, so saves from older versions (which counted more elements) are remapped once.
let pageEdits = store.get('romelPageEditsV3', null);
if (!pageEdits) {
  const remap = (legacy, oldSkipAreas) => {
    const oldList = collectEditables(oldSkipAreas), out = {};
    Object.entries(legacy).forEach(([i, html]) => { const n = editables.indexOf(oldList[i]); if (n > -1) out[n] = html; });
    return out;
  };
  const v2 = store.get('romelPageEditsV2', null);
  pageEdits = v2 ? remap(v2, OWN_EDITOR_AREAS_V2) : remap(store.get('romelPageEdits', {}), null);
  store.set('romelPageEditsV3', pageEdits);
  localStorage.removeItem('romelPageEditsV2');
  localStorage.removeItem('romelPageEdits');
}
const originals = editables.map(el => el.innerHTML);
editables.forEach((el, i) => {
  el.dataset.editKey = i;
  if (pageEdits[i] != null) el.innerHTML = pageEdits[i];
});

// Inline text: typing changes the element (that's how editing works); nothing is stored until Save
const savedText = el => { const i = Number(el.dataset.editKey); return pageEdits[i] != null ? pageEdits[i] : originals[i]; };
function saveEdit(el) {
  el.classList.toggle('edited', isEdited(el));
  markDirty();
}
const textDirty = () => editables.some(el => el.innerHTML !== savedText(el));
function commitText() {
  editables.forEach(el => {
    const i = Number(el.dataset.editKey);
    if (el.innerHTML === originals[i]) delete pageEdits[i];
    else pageEdits[i] = el.innerHTML;
  });
  store.set('romelPageEditsV3', pageEdits);
}
function discardText() {
  editables.forEach(el => { el.innerHTML = savedText(el); el.classList.toggle('edited', isEdited(el)); });
  hideTextReset();
}
// The managed areas are drawn from saved data only after the edit keys above were assigned
renderFocus();
renderFocusEditor();
renderServices();
renderServiceEditor();
renderHero();
renderHeroEditor();
const isEdited = el => el.innerHTML !== originals[Number(el.dataset.editKey)];
editables.forEach(el => el.classList.toggle('edited', isEdited(el)));

function setEditing(on) {
  if (!on && !document.body.classList.contains('editing')) return;
  document.body.classList.toggle('editing', on);
  editables.forEach(el => on ? el.setAttribute('contenteditable', 'true') : el.removeAttribute('contenteditable'));
  $('#toggleEdit').classList.toggle('active', on);
  $('#toggleEdit span').textContent = on ? 'Done Editing' : 'Edit Text';
  if (on) toast('Click any text to edit it, then click Save changes in the sidebar.');
  else hideTextReset();
}

/* --- Per-text reset: a floating ↺ appears above an edited text while it is selected --- */
const textReset = document.createElement('button');
textReset.type = 'button';
textReset.className = 'text-reset';
textReset.hidden = true;
textReset.innerHTML = '<i class="fa-solid fa-rotate-left"></i><span>Reset text</span>';
textReset.title = 'Restore the original text';
document.body.appendChild(textReset);
let textResetTarget = null;
function hideTextReset() { textReset.hidden = true; textResetTarget = null; }
function placeTextReset(el) {
  if (!document.body.classList.contains('editing') || !isEdited(el)) return hideTextReset();
  textResetTarget = el;
  const r = el.getBoundingClientRect();
  textReset.hidden = false;
  textReset.style.top = Math.max(8, r.top - textReset.offsetHeight - 6) + 'px';
  textReset.style.left = Math.min(innerWidth - textReset.offsetWidth - 8, Math.max(8, r.right - textReset.offsetWidth)) + 'px';
}
document.addEventListener('focusin', e => { if (e.target.dataset && e.target.dataset.editKey) placeTextReset(e.target); });
document.addEventListener('input', e => { if (e.target.isContentEditable && e.target.dataset.editKey) { e.target.classList.toggle('edited', isEdited(e.target)); placeTextReset(e.target); } });
window.addEventListener('scroll', () => { if (textResetTarget) placeTextReset(textResetTarget); }, { passive: true });
textReset.addEventListener('mousedown', e => e.preventDefault()); // keep the text focused so the button stays put
textReset.addEventListener('click', () => {
  const el = textResetTarget;
  if (!el) return;
  el.innerHTML = originals[Number(el.dataset.editKey)];
  saveEdit(el);
  hideTextReset();
  toast('Original text restored — click Save changes to keep it.');
});
document.addEventListener('focusout', e => {
  if (!e.target.dataset || !e.target.dataset.editKey) return;
  saveEdit(e.target);
  if (e.target === textResetTarget) hideTextReset();
});
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.isContentEditable) { e.preventDefault(); e.target.blur(); } });
// While editing, clicks on text must not follow links or open modals
document.addEventListener('click', e => {
  if (document.body.classList.contains('editing') && e.target.closest('[contenteditable]')) { e.preventDefault(); e.stopPropagation(); }
}, true);

// Sections whose cards are all hidden (filled in by Page Cards) are dropped for clients like hidden sections
let autoEmptySections = new Set();
const hiddenByCardsEye = id => hiddenContent.includes('cards') && BUILTIN_SECTIONS.includes(id);
const hiddenForClients = id => hiddenSections.includes(id) || hiddenByCardsEye(id) || autoEmptySections.has(id);
function applyVisibility() {
  applyContentVisibility();
  $$('main section[id]').forEach(section => {
    // Sections hidden on purpose (eye / Sections panel) are removed for everyone, admin included, so the page closes up.
    // Sections that are only empty of cards stay visible (dimmed) for the admin so cards can be added back.
    const removed = hiddenSections.includes(section.id) || hiddenByCardsEye(section.id);
    section.classList.toggle('is-hidden', removed);
    section.classList.toggle('auto-empty', autoEmptySections.has(section.id));
    section.hidden = removed || (hiddenForClients(section.id) && role !== 'admin');
  });
  $$('.portfolio-tabs a').forEach(link => {
    const id = link.getAttribute('href').slice(1);
    link.hidden = hiddenSections.includes(id) || hiddenByCardsEye(id) || (role !== 'admin' && hiddenForClients(id));
  });
  syncWorkflowFilters();
}
/* ==========================================================================
   SECTIONS (sidebar → Sections): order (Hero always first), show / hide,
   and sections the admin adds (Text, Cards or Image)
   ========================================================================== */
const mainEl = $('main');
const BUILTIN_SECTIONS = $$('main > section[id]').map(s => s.id).filter(id => id !== 'hero');
const CUSTOM_TYPES = { text: 'Text', cards: 'Cards', image: 'Image' };
// Default order: the built-in sections, then added sections, with Contact kept last
const defaultOrder = customs => {
  const ids = customs.map(c => c.id);
  return BUILTIN_SECTIONS.includes('contact')
    ? [...BUILTIN_SECTIONS.filter(id => id !== 'contact'), ...ids, 'contact'] : [...BUILTIN_SECTIONS, ...ids];
};
// Drops unknown ids and slots any missing section back in at its default spot
function normalizeOrder(order, customs) {
  const all = defaultOrder(customs);
  const out = (Array.isArray(order) ? order : []).filter((id, i, a) => all.includes(id) && a.indexOf(id) === i);
  all.forEach((id, i) => {
    if (out.includes(id)) return;
    const next = all.slice(i + 1).find(n => out.includes(n));
    next ? out.splice(out.indexOf(next), 0, id) : out.push(id);
  });
  return out;
}
let customSections = store.get('romelCustomSections', []);
let sectionOrder = normalizeOrder(store.get('romelSectionOrder', null), customSections);

function customSectionHTML(c) {
  const head = '<div class="section-head reveal">'
    + (c.tag.trim() ? `<div class="section-tag"><i class="${escapeHtml(c.icon)}"></i> ${escapeHtml(c.tag)}</div>` : '')
    + (c.title.trim() ? `<h2>${escapeHtml(c.title)}</h2>` : '')
    + (c.intro.trim() ? `<p>${escapeHtml(c.intro)}</p>` : '') + '</div>';
  let body = '';
  if (c.type === 'text' && c.text.trim())
    body = `<div class="custom-text reveal">${c.text.trim().split(/\n\s*\n/).map(p => `<p>${escapeHtml(p.trim()).replace(/\n/g, '<br>')}</p>`).join('')}</div>`;
  if (c.type === 'cards' && c.cards.length)
    body = `<div class="card-grid flex-cards" style="--cols:${gridCols(c.cards.length)}">${c.cards.map(k =>
      `<article class="card pad-md service reveal"><div><div class="icon-box"><i class="${escapeHtml(k.icon)}"></i></div><h3>${escapeHtml(k.title)}</h3><p>${escapeHtml(k.text)}</p></div></article>`).join('')}</div>`;
  if (c.type === 'image')
    body = c.image ? `<figure class="custom-figure reveal"><img src="${c.image}" alt="${escapeHtml(c.caption || c.title)}">${c.caption.trim() ? `<figcaption>${escapeHtml(c.caption)}</figcaption>` : ''}</figure>`
      : '<p class="custom-empty">No image yet — upload one in Sections.</p>';
  return `<div class="container">${head}${body}</div>`;
}
// Builds the added sections, puts every section in the saved order, and makes the menu tabs follow
function renderSections() {
  $$('main > section.custom-section').forEach(s => { if (!customSections.some(c => c.id === s.id)) s.remove(); });
  customSections.forEach(c => {
    let s = document.getElementById(c.id);
    if (!s) {
      s = document.createElement('section');
      s.className = 'section custom-section';
      s.id = c.id;
      mainEl.appendChild(s);
      spy.observe(s);
    }
    s.innerHTML = customSectionHTML(c);
    $$('.reveal', s).forEach(el => revealer.observe(el));
  });
  sectionOrder.forEach(id => { const s = document.getElementById(id); if (s) mainEl.appendChild(s); });
  $$('.portfolio-tabs').forEach(nav => {
    $$('a[data-custom]', nav).forEach(a => a.remove());
    sectionOrder.forEach(id => {
      const c = customSections.find(x => x.id === id);
      let link = c ? null : $(`a[href="#${id}"]`, nav);
      if (c && c.nav.trim()) {
        link = document.createElement('a');
        link.href = '#' + id;
        link.className = nav.id === 'navLinks' ? 'nav-link nav-btn' : 'nav-link';
        link.dataset.custom = '';
        link.textContent = c.nav.trim();
      }
      if (link) nav.appendChild(link);
    });
  });
  applyVisibility();
}
renderSections();

// The Sections panel edits order + visibility; the page changes on Save.
// What an added section contains is edited from its own item in the sidebar CONTENT menu (see ADDED CONTENT).
let sectionsDraft = [...hiddenSections];
let orderDraft = [...sectionOrder];
let dragSection = null;
const pickerInPanel = () => sectionsPanel.contains($('#iconPicker'));

function sectionInfo(id) {
  const c = customSections.find(x => x.id === id);
  if (c) return { c, name: c.title.trim() || c.nav.trim() || 'Untitled section', sub: `Added section · ${CUSTOM_TYPES[c.type]}` };
  const s = document.getElementById(id);
  const label = $(`.desktop-nav a[href="#${id}"]:not([data-custom])`) || $('.section-tag', s) || $('h2', s);
  const h2 = $('h2', s);
  return { name: label ? label.textContent.trim() : id, sub: h2 && h2 !== label ? h2.textContent.trim() : '' };
}
function customEditorHTML(c) {
  const inp = (key, max, ph) => `<input type="text" class="tool-name" data-cs-field="${key}" value="${escapeHtml(c[key])}" maxlength="${max}" placeholder="${ph}">`;
  const area = (key, rows, max, ph) => `<textarea class="tool-name svc-desc" data-cs-field="${key}" rows="${rows}" maxlength="${max}" placeholder="${ph}">${escapeHtml(c[key])}</textarea>`;
  const field = (label, html) => `<label class="sec-field"><span>${label}</span>${html}</label>`;
  let html = `<div class="cs-form" data-cs="${c.id}">`
    + `<div class="sec-field"><span>Small label</span><div class="svc-head"><button type="button" class="tool-icon" data-cs-icon style="--tone:${iconTone(c.icon)}" title="Change label icon"><i class="${escapeHtml(c.icon)}"></i></button>${inp('tag', 40, 'e.g. Certificates')}</div></div>`
    + field('Title', inp('title', 80, 'Section title'))
    + field('Intro line', area('intro', 2, 300, 'Short sentence under the title (optional)'))
    + field('Menu tab (optional)', inp('nav', 24, 'Leave empty for no tab in the top menu'));
  if (c.type === 'text') html += field('Text', area('text', 6, 3000, 'Write your text. Leave a blank line between paragraphs.'));
  if (c.type === 'image') html += `<div class="sec-field"><span>Image</span>${c.image ? `<img class="sec-thumb" src="${c.image}" alt="">` : ''}`
    + `<button type="button" class="btn btn-outline btn-sm btn-block" data-cs-upload><i class="fa-solid fa-upload accent"></i><span>${c.image ? 'Replace Image' : 'Upload Image'}</span></button></div>`
    + field('Caption (optional)', inp('caption', 150, 'Text under the image'));
  if (c.type === 'cards') html += '<div class="sec-field"><span>Cards</span></div>' + c.cards.map((k, i) =>
    `<div class="svc-item"><div class="svc-head"><button type="button" class="tool-icon" data-cs-card-icon="${i}" style="--tone:${iconTone(k.icon)}" title="Change icon"><i class="${escapeHtml(k.icon)}"></i></button>`
    + `<input type="text" class="tool-name" data-cs-card="title" data-i="${i}" value="${escapeHtml(k.title)}" maxlength="40" placeholder="Card title">`
    + `<button type="button" class="tool-remove" data-cs-card-remove="${i}" title="Remove this card" aria-label="Remove card"><i class="fa-solid fa-xmark"></i></button></div>`
    + `<textarea class="tool-name svc-desc" data-cs-card="text" data-i="${i}" rows="3" maxlength="200" placeholder="Short description">${escapeHtml(k.text)}</textarea></div>`).join('')
    + '<button type="button" class="btn btn-outline btn-sm btn-block" data-cs-card-add><i class="fa-solid fa-plus accent"></i><span>Add Card</span></button>';
  return html + '</div>';
}
function buildSectionToggles() {
  const rows = orderDraft.map((id, i) => {
    const info = sectionInfo(id), shown = !sectionsDraft.includes(id);
    return `<div class="sec-row${shown ? '' : ' is-off'}" draggable="true" data-sec="${id}">`
      + '<span class="sec-grip" title="Drag to move"><i class="fa-solid fa-grip-vertical"></i></span>'
      + `<span class="sec-name"><b>${escapeHtml(info.name)}</b>${info.sub ? `<small>${escapeHtml(info.sub)}</small>` : ''}</span>`
      + `<button type="button" class="mini-btn" data-sec-move="-1"${i === 0 ? ' disabled' : ''} title="Move up" aria-label="Move up"><i class="fa-solid fa-arrow-up"></i></button>`
      + `<button type="button" class="mini-btn" data-sec-move="1"${i === orderDraft.length - 1 ? ' disabled' : ''} title="Move down" aria-label="Move down"><i class="fa-solid fa-arrow-down"></i></button>`
      + (info.c ? '<button type="button" class="mini-btn" data-sec-open title="Edit this content in the sidebar" aria-label="Edit"><i class="fa-solid fa-pen"></i></button>' : '')
      + `<button type="button" class="mini-btn" data-sec-toggle title="${shown ? 'Hide' : 'Show'} this section" aria-label="${shown ? 'Hide' : 'Show'}">${eyeIcon(shown)}</button>`
      + '</div>';
  }).join('');
  $('#sectionToggles').innerHTML = '<div class="sec-row locked"><span class="sec-grip"><i class="fa-solid fa-lock"></i></span><span class="sec-name"><b>Hero (Top Section)</b><small>Always stays at the top</small></span></div>' + rows;
  $('#resetSections').disabled = !sectionsDraft.length && sameJSON(orderDraft, defaultOrder(customSections));
  markDirty();
}
$('#sectionToggles').addEventListener('click', e => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const row = btn.closest('.sec-row'), id = row && row.dataset.sec;
  if (btn.dataset.secMove) {
    const i = orderDraft.indexOf(id), j = i + Number(btn.dataset.secMove);
    [orderDraft[i], orderDraft[j]] = [orderDraft[j], orderDraft[i]];
  } else if (btn.matches('[data-sec-toggle]')) {
    sectionsDraft = sectionsDraft.includes(id) ? sectionsDraft.filter(s => s !== id) : [...sectionsDraft, id];
  } else if (btn.matches('[data-sec-open]')) {
    return openSidebarSection(id);
  } else return;
  buildSectionToggles();
});
// Drag a row to a new place (the arrows do the same on touch screens)
$('#sectionToggles').addEventListener('dragstart', e => {
  const row = e.target.closest && e.target.closest('.sec-row[data-sec]');
  if (!row) return e.preventDefault();
  dragSection = row.dataset.sec;
  row.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', dragSection);
});
$('#sectionToggles').addEventListener('dragover', e => {
  const row = e.target.closest('.sec-row[data-sec]');
  if (!dragSection || !row) return;
  e.preventDefault();
  const after = e.clientY > row.getBoundingClientRect().top + row.offsetHeight / 2;
  $$('.sec-row', $('#sectionToggles')).forEach(r => r.classList.remove('drop-before', 'drop-after'));
  if (row.dataset.sec !== dragSection) row.classList.add(after ? 'drop-after' : 'drop-before');
});
$('#sectionToggles').addEventListener('drop', e => {
  const row = e.target.closest('.sec-row[data-sec]');
  if (!dragSection || !row) return;
  e.preventDefault();
  const target = row.dataset.sec, after = row.classList.contains('drop-after');
  if (target !== dragSection) {
    orderDraft = orderDraft.filter(id => id !== dragSection);
    orderDraft.splice(orderDraft.indexOf(target) + (after ? 1 : 0), 0, dragSection);
  }
  dragSection = null;
  buildSectionToggles();
});
$('#sectionToggles').addEventListener('dragend', () => {
  if (!dragSection) return;
  dragSection = null;
  buildSectionToggles();
});
$('#resetSections').addEventListener('click', () => {
  sectionsDraft = [];
  orderDraft = defaultOrder(customSections);
  buildSectionToggles();
});
const sectionsDirty = () => !sameJSON([...sectionsDraft].sort(), [...hiddenSections].sort()) || !sameJSON(orderDraft, sectionOrder);
// Writes order + visibility (dropping ids of deleted sections, slotting in new ones)
function storeSectionLayout() {
  sectionOrder = normalizeOrder(sectionOrder, customSections);
  hiddenSections = hiddenSections.filter(id => sectionOrder.includes(id));
  sameJSON(sectionOrder, defaultOrder(customSections)) ? localStorage.removeItem('romelSectionOrder') : store.set('romelSectionOrder', sectionOrder);
  hiddenSections.length ? store.set('romelHiddenSections', hiddenSections) : localStorage.removeItem('romelHiddenSections');
}
function commitSections() {
  sectionOrder = [...orderDraft];
  hiddenSections = [...sectionsDraft];
  storeSectionLayout();
  sectionsDraft = [...hiddenSections];
  orderDraft = [...sectionOrder];
  renderSections();
  if (typeof refreshEmptySpaces === 'function') refreshEmptySpaces();
  buildSectionToggles();
  if (typeof refreshMenuEyes === 'function') refreshMenuEyes();
}
function discardSections() {
  sectionsDraft = [...hiddenSections];
  orderDraft = [...sectionOrder];
  buildSectionToggles();
}
// Closing the side panels asks Save / Discard when they have unsaved changes
async function closeSectionsPanel() {
  if (sectionsPanel.hidden) return;
  if (!(await resolveUnsaved(['sections']))) return;
  if (pickerInPanel()) hideIconPicker();
  sectionsPanel.hidden = true;
}
async function closeCmsPanel() {
  if (cmsPanel.hidden) return;
  if (await resolveUnsaved(['content'])) cmsPanel.hidden = true;
}

// Everyone starts as a Client (view only); only Admin (after logging in) can change anything
function setRole(next) {
  role = next;
  if (next === 'admin') sessionStorage.setItem('romelRole', 'admin');
  else sessionStorage.removeItem('romelRole');
  document.body.classList.toggle('role-admin', next === 'admin');
  document.body.classList.toggle('role-client', next === 'client');
  layoutServiceGrid();
  if (next !== 'admin') { setEditing(false); cmsPanel.hidden = true; sectionsPanel.hidden = true; }
  showAdminSidebar(next === 'admin');
  $('#clientBadge').hidden = true; // Client is the normal visitor view, so no "client view" banner
  $('#accountLabel').textContent = next === 'admin' ? 'Admin' : 'Client';
  $('#accountIcon').className = next === 'admin' ? 'fa-solid fa-user-shield' : 'fa-solid fa-user';
  $('#accountButton').classList.toggle('signed-in', next === 'admin');
  $$('[data-role]').forEach(btn => btn.classList.toggle('current', btn.dataset.role === next));
  $$('[data-role="signout"]').forEach(btn => btn.hidden = next !== 'admin');
  applyVisibility();
}

const accountDropdown = $('#accountDropdown');
function toggleAccountMenu(open) {
  accountDropdown.hidden = !open;
  $('#accountButton').setAttribute('aria-expanded', String(open));
}
$('#accountButton').addEventListener('click', e => { e.stopPropagation(); toggleAccountMenu(accountDropdown.hidden); });
document.addEventListener('click', e => { if (!e.target.closest('#accountMenu')) toggleAccountMenu(false); });
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  toggleAccountMenu(false);
  if (!$$('.modal').some(m => !m.hidden)) closeSectionsPanel();
});

$$('[data-role]').forEach(btn => btn.addEventListener('click', () => {
  toggleAccountMenu(false);
  closeMobileMenu();
  const next = btn.dataset.role;
  if (next === 'admin') {
    if (role === 'admin') return toast('You are already in admin mode.');
    $('#loginError').textContent = '';
    openModal('accountModal');
    setTimeout(() => $('#loginForm [name="password"]').focus(), 50);
  } else {
    if (role !== 'admin') return toast('You are viewing the site as a client.');
    // Leaving admin mode (Client or Sign out): settle any unsaved category changes first
    resolveUnsaved().then(ok => {
      if (!ok) return;
      setRole('client');
      toast(next === 'signout' ? 'Signed out — you are now viewing as a client.' : 'Client view — read only.');
    });
  }
}));

$('#loginForm').addEventListener('submit', e => {
  e.preventDefault();
  const data = new FormData(e.currentTarget);
  if (data.get('email') !== ADMIN.email || data.get('password') !== ADMIN.password) { $('#loginError').textContent = 'Email or password is incorrect.'; return; }
  closeModal($('#accountModal'));
  e.currentTarget.reset();
  setRole('admin');
  toast('Admin mode — double-click anything on the page to open its settings.');
});

// Admin sidebar tools
// Done Editing asks Save / Discard if the text changes weren't saved yet
$('#toggleEdit').addEventListener('click', async () => {
  const on = !document.body.classList.contains('editing');
  if (!on && !(await resolveUnsaved(['text']))) return;
  setEditing(on);
});
/* --- Edit Font: suggested font sets (defined in fonts.js). Clicking a set previews it on the page;
       Apply keeps it, Cancel / closing the panel goes back to the saved set. --- */
const FONTS = window.ROMEL_FONTS;
let fontSaved = FONTS.saved, fontPick = fontSaved, fontFilter = 'all';
const FONT_STYLE_LABEL = { original: 'Original', masculine: 'Masculine', feminine: 'Feminine' };
const updateFontLabel = () => { $('#fontCurrentLabel').textContent = '· ' + FONTS.find(fontSaved).name; };
function renderFontGrid() {
  $$('[data-font-filter]').forEach(b => b.classList.toggle('active', b.dataset.fontFilter === fontFilter));
  $('#fontGrid').innerHTML = FONTS.sets.filter(s => fontFilter === 'all' || s.style === fontFilter).map(s =>
    `<button type="button" class="font-card${s.id === fontPick ? ' selected' : ''}" data-font-set="${s.id}">`
    + '<span class="fc-check"><i class="fa-solid fa-check"></i></span>'
    + `<span class="fc-top"><span class="fc-name">${escapeHtml(s.name)}</span><span class="fc-tag ${s.style}">${FONT_STYLE_LABEL[s.style]}</span></span>`
    + `<span class="fc-label" style="font-family:${s.label.stack}">Resume &amp; Bio</span>`
    + `<span class="fc-heading" style="font-family:${s.head.stack}">I build digital experiences</span>`
    + `<span class="fc-body" style="font-family:${s.body.stack}">Creative developer turning ambitious ideas into fast, thoughtful products.</span>`
    + `<span class="fc-note">${escapeHtml(s.note)}</span>`
    + `<span class="fc-fonts"><span><b>Heading:</b> ${s.head.name}</span><span><b>Body:</b> ${s.body.name}</span><span><b>Label:</b> ${s.label.name}</span></span>`
    + '</button>').join('');
}
function revertFontPreview() { fontPick = fontSaved; FONTS.apply(fontSaved); }
$('#openFonts').addEventListener('click', () => {
  FONTS.sets.forEach(FONTS.load); // every set's fonts, so the cards show their real look
  fontPick = fontSaved;
  fontFilter = 'all';
  renderFontGrid();
  openModal('fontModal');
});
$('#fontFilters').addEventListener('click', e => {
  const btn = e.target.closest('[data-font-filter]');
  if (!btn) return;
  fontFilter = btn.dataset.fontFilter;
  renderFontGrid();
});
$('#fontGrid').addEventListener('click', e => {
  const card = e.target.closest('[data-font-set]');
  if (!card) return;
  fontPick = card.dataset.fontSet;
  FONTS.apply(fontPick); // live preview on the page
  renderFontGrid();
});
$('#applyFont').addEventListener('click', () => {
  const set = FONTS.find(fontPick), changed = fontPick !== fontSaved;
  fontSaved = fontPick;
  try { fontSaved === 'original' ? localStorage.removeItem('romelFonts') : localStorage.setItem('romelFonts', fontSaved); } catch (err) {}
  updateFontLabel();
  closeModal($('#fontModal'), true);
  if (changed) toast(`Font set "${set.name}" applied. Click Save Niche to publish it to clients.`);
});
$$('[data-font-cancel]').forEach(btn => btn.addEventListener('click', () => closeModal($('#fontModal'))));
updateFontLabel();

// Both panels resolve false if the admin chose "Keep editing"; an already-open panel keeps its draft
async function openSectionsPanel() {
  if (!sectionsPanel.hidden) return true;
  if (!(await resolveUnsaved(['content']))) return false;
  cmsPanel.hidden = true;
  buildSectionToggles();
  sectionsPanel.hidden = false;
  return true;
}
async function openContentPanel() {
  if (!cmsPanel.hidden) return true;
  if (!(await resolveUnsaved(['sections']))) return false;
  sectionsPanel.hidden = true;
  fillContentInputs();
  cmsPanel.hidden = false;
  return true;
}
$('#openSections').addEventListener('click', openSectionsPanel);
$('[data-close-panel]').addEventListener('click', closeSectionsPanel);
$('#openContent').addEventListener('click', openContentPanel);
$('#closeCms').addEventListener('click', closeCmsPanel);

/* --- Content panel: the fields are the draft; "Save changes" applies them --- */
const CONTENT_FIELDS = { name: '#editName', role: '#editRole', tabs: '#editTabs' }; // headline / description live in the Hero editor
const contentInputValue = key => key === 'tabs' ? $(CONTENT_FIELDS.tabs).value.split('\n').map(v => v.trim()).filter(Boolean) : $(CONTENT_FIELDS[key]).value.trim();
function fillContentInputs() {
  $('#editName').value = content.name;
  $('#editRole').value = content.role;
  $('#editTabs').value = content.tabs.join('\n');
  updateContentResets();
}
const contentDirty = () => Object.keys(CONTENT_FIELDS).some(key => !sameJSON(contentInputValue(key), content[key]));
function updateContentResets() {
  $$('[data-content-reset]').forEach(btn => {
    const key = btn.dataset.contentReset;
    btn.disabled = sameJSON(contentInputValue(key), defaultContent[key]);
  });
  markDirty();
}
$$('[data-content-reset]').forEach(btn => btn.addEventListener('click', e => {
  e.preventDefault(); // keep the surrounding <label> from focusing the field
  const key = btn.dataset.contentReset;
  $(CONTENT_FIELDS[key]).value = key === 'tabs' ? defaultContent.tabs.join('\n') : defaultContent[key];
  updateContentResets();
}));
Object.values(CONTENT_FIELDS).forEach(sel => $(sel).addEventListener('input', updateContentResets));
function commitContent() {
  Object.keys(CONTENT_FIELDS).forEach(key => { content[key] = contentInputValue(key); });
  localStorage.setItem('romelPortfolioContent', JSON.stringify(content));
  applyContent();
  updateContentResets();
}
fillContentInputs();

/* ==========================================================================
   ADMIN SIDEBAR (left) + THEME COLOR EDITOR
   ========================================================================== */
const sidebar = $('#adminSidebar');
let editingTheme = null;

function saveCustomColors() {
  try { localStorage.setItem('romelThemeColors', JSON.stringify(customColors)); return true; } catch (e) { return false; }
}
// The color editor works on draftColors / draftSiteTheme; the page keeps the saved theme until "Save changes"
let draftColors = deepCopy(customColors), draftSiteTheme = 'dark';
const draftThemeColors = key => draftColors[key] || THEMES[key].colors;
// Only the small preview box shows the draft colors
function previewEditing() {
  if (!editingTheme) return;
  const box = $('#editorPreview');
  Object.entries(deriveThemeVars(draftThemeColors(editingTheme)).vars).forEach(([name, value]) => box.style.setProperty(name, value));
}
const colorsDirty = () => !sameJSON(draftColors, customColors) || draftSiteTheme !== siteTheme;
function commitColors() {
  customColors = deepCopy(draftColors);
  if (!saveCustomColors()) { toast('Could not save — browser storage is full.'); return false; }
  setSiteTheme(draftSiteTheme);
  if (editingTheme) { renderEditorThemes(); renderEditorRows(); }
}
function discardColors() {
  draftColors = deepCopy(customColors);
  draftSiteTheme = siteTheme;
  if (editingTheme) { renderEditorThemes(); renderEditorRows(); previewEditing(); }
}

function renderEditorThemes() {
  $('#editorThemes').innerHTML = Object.entries(THEMES).map(([key, t]) =>
    `<button type="button" data-edit-theme="${key}" class="${key === editingTheme ? 'active' : ''}" title="${t.label}">${swatchHtml(draftThemeColors(key))}<span>${t.label}</span>${key === draftSiteTheme ? '<i class="fa-solid fa-circle-check live" title="Site theme"></i>' : ''}</button>`).join('');
}
function renderEditorRows() {
  const colors = draftThemeColors(editingTheme), defaults = THEMES[editingTheme].colors;
  $('#editorRows').innerHTML = COLOR_ROLES.map((label, i) =>
    `<label class="color-row"><span>${label}</span><input type="color" data-color-index="${i}" value="${colors[i]}"><input type="text" class="hex" data-hex-index="${i}" value="${colors[i]}" maxlength="7" spellcheck="false">`
    + `<button type="button" class="row-reset" data-reset-index="${i}" title="Reset ${label.toLowerCase()} to default (${defaults[i]})" aria-label="Reset ${label.toLowerCase()} to default"><i class="fa-solid fa-rotate-left"></i></button></label>`).join('');
  updateRowResets();
  $('#useEditedTheme').disabled = editingTheme === draftSiteTheme;
  $('#useEditedTheme span').textContent = editingTheme === draftSiteTheme ? 'This Is the Site Theme' : `Set ${THEMES[editingTheme].label} as Site Theme`;
  $('#restoreThemeColors').disabled = !draftColors[editingTheme];
  markDirty();
}
// Each row's ↺ is only active when that color differs from the theme's default
function updateRowResets() {
  const colors = draftThemeColors(editingTheme), defaults = THEMES[editingTheme].colors;
  $$('[data-reset-index]').forEach(btn => {
    const i = Number(btn.dataset.resetIndex);
    btn.disabled = colors[i].toUpperCase() === defaults[i].toUpperCase();
  });
}
function syncThemeEditor(key) {
  if (sidebar.hidden || sidebar.classList.contains('collapsed')) return;
  editingTheme = key;
  renderEditorThemes();
  renderEditorRows();
  previewEditing();
}
function setThemeColor(index, value) {
  const colors = [...draftThemeColors(editingTheme)];
  colors[index] = value.toUpperCase();
  if (colors.every((c, i) => c === THEMES[editingTheme].colors[i].toUpperCase())) delete draftColors[editingTheme];
  else draftColors[editingTheme] = colors;
  previewEditing();
  renderEditorThemes();
  $(`[data-color-index="${index}"]`).value = value;
  $(`[data-hex-index="${index}"]`).value = value.toUpperCase();
  $('#restoreThemeColors').disabled = !draftColors[editingTheme];
  updateRowResets();
  markDirty();
}

$('#editorThemes').addEventListener('click', e => {
  const btn = e.target.closest('[data-edit-theme]');
  if (btn) syncThemeEditor(btn.dataset.editTheme);
});
$('#editorRows').addEventListener('click', e => {
  const btn = e.target.closest('[data-reset-index]');
  if (!btn) return;
  e.preventDefault(); // keep the surrounding <label> from opening the color picker
  const i = Number(btn.dataset.resetIndex);
  setThemeColor(i, THEMES[editingTheme].colors[i]);
});
$('#editorRows').addEventListener('input', e => {
  if (e.target.dataset.colorIndex) setThemeColor(Number(e.target.dataset.colorIndex), e.target.value);
});
$('#editorRows').addEventListener('change', e => {
  if (!e.target.dataset.hexIndex) return;
  let value = e.target.value.trim();
  if (!value.startsWith('#')) value = '#' + value;
  if (/^#[0-9a-f]{3}$/i.test(value)) value = '#' + [...value.slice(1)].map(c => c + c).join('');
  if (/^#[0-9a-f]{6}$/i.test(value)) setThemeColor(Number(e.target.dataset.hexIndex), value);
  else { e.target.value = draftThemeColors(editingTheme)[e.target.dataset.hexIndex]; toast('Use a hex color like #F5B400.'); }
});
$('#useEditedTheme').addEventListener('click', () => {
  draftSiteTheme = editingTheme;
  renderEditorThemes();
  renderEditorRows();
  toast(`${THEMES[editingTheme].label} will become the site theme when you click Save changes.`);
});
$('#restoreThemeColors').addEventListener('click', () => {
  delete draftColors[editingTheme];
  renderEditorThemes();
  renderEditorRows();
  previewEditing();
});

// Desktop: always shown for the admin, collapsible to an icon rail. Phones/tablets: slides in from the ⚙ button.
const isNarrow = () => innerWidth < 900;
function dropPreview() {
  editingTheme = null;
  if (currentTheme !== siteTheme) applyTheme(siteTheme); // discard an unsaved theme preview
}
function showAdminSidebar(show) {
  sidebar.hidden = !show;
  $('#adminFab').hidden = !show;
  document.body.classList.toggle('has-sidebar', show);
  if (show) setSidebarCollapsed(localStorage.getItem('romelSidebarCollapsed') === '1');
  else { closeMobileSidebar(); dropPreview(); }
}
function setSidebarCollapsed(collapsed) {
  sidebar.classList.toggle('collapsed', collapsed);
  document.body.classList.toggle('sidebar-collapsed', collapsed);
  try { localStorage.setItem('romelSidebarCollapsed', collapsed ? '1' : '0'); } catch (e) {}
  $('#collapseSidebar').title = collapsed ? 'Expand' : 'Collapse';
  $('#collapseSidebar i').className = `fa-solid fa-angles-${collapsed ? 'right' : 'left'}`;
  if (collapsed) dropPreview();
  else syncThemeEditor(editingTheme || siteTheme);
}
function openMobileSidebar() {
  document.body.classList.add('sidebar-mobile-open');
  sidebar.classList.remove('collapsed');
  syncThemeEditor(siteTheme);
}
function closeMobileSidebar() {
  if (!document.body.classList.contains('sidebar-mobile-open')) return;
  document.body.classList.remove('sidebar-mobile-open');
  sidebar.classList.toggle('collapsed', document.body.classList.contains('sidebar-collapsed'));
  dropPreview();
}
// Collapsing / closing the sidebar first settles unsaved category changes (Save / Discard / Keep editing)
$('#collapseSidebar').addEventListener('click', async () => {
  const collapsing = isNarrow() || !sidebar.classList.contains('collapsed');
  if (collapsing && !(await resolveUnsaved())) return;
  isNarrow() ? closeMobileSidebar() : setSidebarCollapsed(!sidebar.classList.contains('collapsed'));
});
$('#adminFab').addEventListener('click', openMobileSidebar);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMobileSidebar(); });
// On phones, close the sidebar after picking a tool so the page / panel underneath is visible
sidebar.addEventListener('click', e => { if (isNarrow() && e.target.closest('#toggleEdit, #openSections, #openContent')) closeMobileSidebar(); });
// Expandable sidebar sections (clicking one while collapsed expands the sidebar first)
/* --- CONTENT menu: hold the left mouse button on an item and drag it to a new place (Hero stays first).
       Each item moves together with its settings panel; the order is remembered in this browser.
       Sections added with "+ Add Content" join this list (see ADDED CONTENT below). --- */
const BUILTIN_MENU = ['resume', 'tools', 'focus', 'services', 'cards'];
const menuNav = action => { const btn = $(`[data-admin-action="${action}"]`); return btn && btn.closest('.side-nav'); };
const movableMenu = () => [...BUILTIN_MENU, ...$$('[data-custom-nav]').map(n => n.dataset.customNav)];
// Saved order first, then any item it doesn't mention yet (new items go to the end)
const fullMenuOrder = order => {
  const all = movableMenu(), out = order.filter((a, i) => all.includes(a) && order.indexOf(a) === i);
  all.forEach(a => { if (!out.includes(a)) out.push(a); });
  return out;
};
function applyMenuOrder(order) {
  let prev = $('#heroEditor');
  order.forEach(action => {
    const nav = menuNav(action), panel = $(`#${action}Editor`);
    if (!nav || !panel) return;
    prev.after(nav);
    nav.after(panel);
    prev = panel;
  });
  prev.after($('#addContentNav'));
  $('#addContentNav').after($('#addContentBox'));
}
let menuOrder = fullMenuOrder(store.get('romelMenuOrder', []));
applyMenuOrder(menuOrder);
let dragMenu = null;
const menuLabel = action => $(`[data-admin-action="${action}"] > span`).textContent.trim();

/* Shared yes / no dialog; closing it any other way (Esc, clicking outside) counts as "no" */
function confirmDialog({ label, icon = 'fa-circle-question', title, body = '', yes = 'Confirm', no = 'Cancel', danger = false }) {
  return new Promise(resolve => {
    $('#confirmLabel').innerHTML = `<i class="fa-solid ${icon}"></i> ${escapeHtml(label)}`;
    $('#confirmTitle').textContent = title;
    $('#confirmBody').innerHTML = body;
    $('#confirmYes span').textContent = yes;
    $('#confirmYes i').className = `fa-solid ${danger ? 'fa-trash' : 'fa-check'}`;
    $('#confirmNo span').textContent = no;
    window.__confirmResolve = resolve;
    openModal('confirmModal');
  });
}
$$('[data-confirm]').forEach(btn => btn.addEventListener('click', () => {
  const resolve = window.__confirmResolve;
  window.__confirmResolve = null;
  closeModal($('#confirmModal'), true);
  if (resolve) resolve(btn.dataset.confirm === 'yes');
}));
const confirmMenuOrder = (moved, order) => confirmDialog({
  label: 'NEW MENU ORDER', icon: 'fa-arrows-up-down', title: `Move "${menuLabel(moved)}" here?`,
  body: `<ol class="menu-order-list">${['hero', ...order].map(a =>
    `<li class="${a === moved ? 'moved' : ''}">${escapeHtml(menuLabel(a))}${a === 'hero' ? ' <small>(always first)</small>' : ''}</li>`).join('')}</ol>`
});
const clearMenuMarks = () => $$('.side-nav.menu-movable').forEach(n => n.classList.remove('drop-before', 'drop-after', 'dragging'));
function makeMenuMovable(action) {
  const nav = menuNav(action);
  nav.draggable = true;
  nav.classList.add('menu-movable');
  nav.title = 'Drag to change the order';
  nav.addEventListener('dragstart', e => {
    dragMenu = action;
    nav.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', action);
  });
  nav.addEventListener('dragover', e => {
    if (!dragMenu) return;
    e.preventDefault();
    const after = e.clientY > nav.getBoundingClientRect().top + nav.offsetHeight / 2;
    $$('.side-nav.menu-movable').forEach(n => n.classList.remove('drop-before', 'drop-after'));
    if (action !== dragMenu) nav.classList.add(after ? 'drop-after' : 'drop-before');
  });
  nav.addEventListener('drop', e => {
    if (!dragMenu) return;
    e.preventDefault();
    const moved = dragMenu, after = nav.classList.contains('drop-after');
    dragMenu = null;
    clearMenuMarks();
    if (action === moved) return;
    const current = fullMenuOrder(menuOrder);
    const next = current.filter(a => a !== moved);
    next.splice(next.indexOf(action) + (after ? 1 : 0), 0, moved);
    if (sameJSON(next, current)) return;
    // Show the new order right away, then keep it only if the admin confirms
    applyMenuOrder(next);
    confirmMenuOrder(moved, next).then(ok => {
      if (ok) {
        menuOrder = next;
        store.set('romelMenuOrder', menuOrder);
        toast('Menu order saved.');
      } else {
        applyMenuOrder(fullMenuOrder(menuOrder));
        toast('Menu order unchanged.');
      }
    });
  });
  nav.addEventListener('dragend', () => { dragMenu = null; clearMenuMarks(); });
}
BUILTIN_MENU.forEach(makeMenuMovable);

const SIDEBAR_SECTIONS = { niches: '#nicheEditor', hero: '#heroEditor', resume: '#resumeEditor', colors: '#colorEditor', logo: '#logoEditor', tools: '#toolsEditor', focus: '#focusEditor', services: '#servicesEditor', cards: '#cardsEditor', addContent: '#addContentBox' };
function setSectionOpen(action, open) {
  const btn = $(`[data-admin-action="${action}"]`);
  $(SIDEBAR_SECTIONS[action]).hidden = !open;
  btn.classList.toggle('active', open);
  $('.go', btn).className = `fa-solid fa-chevron-${open ? 'down' : 'right'} go`;
}
// One category open at a time; leaving a category with unsaved changes asks Save / Discard / Keep editing
// Opens one category (closing the others); resolves false if the admin chose "Keep editing"
async function openSidebarSection(action) {
  if (isNarrow()) { if (!document.body.classList.contains('sidebar-mobile-open')) openMobileSidebar(); }
  else if (sidebar.classList.contains('collapsed')) setSidebarCollapsed(false);
  if (!$(SIDEBAR_SECTIONS[action]).hidden) return true;
  const others = Object.keys(SIDEBAR_SECTIONS).filter(a => a !== action && !$(SIDEBAR_SECTIONS[a]).hidden);
  if (!(await resolveUnsaved(others))) return false;
  others.forEach(a => setSectionOpen(a, false));
  setSectionOpen(action, true);
  return true;
}
function bindSidebarAction(action) {
  $(`[data-admin-action="${action}"]`).addEventListener('click', async () => {
    const wasCollapsed = sidebar.classList.contains('collapsed');
    if (!wasCollapsed && !$(SIDEBAR_SECTIONS[action]).hidden) {
      if (await resolveUnsaved([action])) setSectionOpen(action, false);
      return;
    }
    openSidebarSection(action);
  });
}
Object.keys(SIDEBAR_SECTIONS).forEach(bindSidebarAction);

/* ==========================================================================
   ADDED CONTENT (sidebar → CONTENT → + Add Content): every added section gets
   its own menu item + editor with its own Save / Discard. A new section exists
   only as a draft until saved; Discard on an unsaved one removes it again.
   ========================================================================== */
const contentDrafts = {};
let contentUploadTarget = null;
const savedContent = id => customSections.find(c => c.id === id) || null;
const contentLabel = c => c.title.trim() || c.tag.trim() || 'Untitled section';
function renderContentForm(id) {
  const c = contentDrafts[id], panel = $(`#${id}Editor`), btn = $(`[data-admin-action="${id}"]`);
  $('.cs-form-mount', panel).innerHTML = customEditorHTML(c);
  $('i', btn).className = c.icon;
  updateContentLabel(id);
}
function updateContentLabel(id) {
  const c = contentDrafts[id], btn = $(`[data-admin-action="${id}"]`);
  $('span', btn).textContent = contentLabel(c);
  btn.title = contentLabel(c);
  if (CATEGORIES[id]) CATEGORIES[id].label = contentLabel(c);
}
function buildContentItem(id) {
  const nav = document.createElement('nav');
  nav.className = 'side-nav';
  nav.dataset.customNav = id;
  nav.innerHTML = `<button type="button" data-admin-action="${id}"><i></i><span></span><i class="fa-solid fa-chevron-right go"></i></button>`;
  const panel = document.createElement('div');
  panel.className = 'color-editor tools-editor cs-editor';
  panel.id = id + 'Editor';
  panel.hidden = true;
  panel.innerHTML = '<div class="cs-form-mount"></div><div class="picker-mount"></div>'
    + '<p class="field-hint">Show / hide this section or change its place on the page in <b>Sections</b> (EDIT menu).</p>'
    + '<button type="button" class="btn btn-outline btn-sm btn-block cs-delete" data-cs-delete><i class="fa-solid fa-trash"></i><span>Delete This Content</span></button>';
  $('#addContentNav').before(nav);
  nav.after(panel);
  SIDEBAR_SECTIONS[id] = `#${id}Editor`;
  bindSidebarAction(id);
  makeMenuMovable(id);
  addMenuEye(id);
  registerCategory(id, { label: 'Content', mount: `#${id}Editor`, nav: `[data-admin-action="${id}"]`,
    isDirty: () => !!contentDrafts[id] && !sameJSON(contentDrafts[id], savedContent(id)),
    save: () => commitContentItem(id), discard: () => discardContentItem(id) });
  renderContentForm(id);

  panel.addEventListener('input', e => {
    const t = e.target, c = contentDrafts[id];
    if (t.dataset.csField) {
      c[t.dataset.csField] = t.value;
      if (t.dataset.csField === 'title' || t.dataset.csField === 'tag') updateContentLabel(id);
    } else if (t.dataset.csCard) c.cards[Number(t.dataset.i)][t.dataset.csCard] = t.value;
    else return;
    markDirty();
  });
  panel.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn || !panel.contains(btn)) return;
    const c = contentDrafts[id], mount = $('.picker-mount', panel);
    if (btn.matches('[data-cs-icon]')) {
      return showIconPicker(mount, `Label icon for "${contentLabel(c)}"`, c.icon, icon => { c.icon = icon; renderContentForm(id); markDirty(); }, null);
    }
    if (btn.dataset.csCardIcon != null) {
      const k = c.cards[Number(btn.dataset.csCardIcon)];
      return showIconPicker(mount, `Icon for "${k.title || 'card'}"`, k.icon, icon => { k.icon = icon; renderContentForm(id); markDirty(); }, null);
    }
    if (btn.matches('[data-cs-upload]')) { contentUploadTarget = id; return $('#secImageFile').click(); }
    if (btn.matches('[data-cs-delete]')) return deleteContentItem(id);
    if (btn.dataset.csCardRemove != null) c.cards.splice(Number(btn.dataset.csCardRemove), 1);
    else if (btn.matches('[data-cs-card-add]')) c.cards.push({ icon: 'fa-solid fa-star', title: 'New card', text: 'Describe this card.' });
    else return;
    renderContentForm(id);
    markDirty();
  });
}
function removeContentItem(id) {
  const panel = $(`#${id}Editor`);
  if (panel.contains($('#iconPicker'))) hideIconPicker();
  menuNav(id).remove();
  panel.remove();
  delete SIDEBAR_SECTIONS[id];
  delete CATEGORIES[id];
  delete contentDrafts[id];
  markDirty();
}
// The Sections panel's draft order picks up added / deleted sections without losing its own unsaved moves
function syncSectionsDraft() {
  orderDraft = normalizeOrder(orderDraft, customSections);
  sectionsDraft = sectionsDraft.filter(id => orderDraft.includes(id));
  if (!sectionsPanel.hidden) buildSectionToggles();
}
function storeCustomSections(list) {
  try { list.length ? store.set('romelCustomSections', list) : localStorage.removeItem('romelCustomSections'); }
  catch (err) { toast('Browser storage is full — try a smaller image, then Save again.'); return false; }
  customSections = list;
  storeSectionLayout();
  syncSectionsDraft();
  renderSections();
  if (typeof refreshEmptySpaces === 'function') refreshEmptySpaces();
  refreshMenuEyes();
  return true;
}
function commitContentItem(id) {
  const draft = deepCopy(contentDrafts[id]);
  const list = savedContent(id) ? customSections.map(c => c.id === id ? draft : c) : [...customSections, draft];
  if (!storeCustomSections(list)) return false;
}
function discardContentItem(id) {
  const saved = savedContent(id);
  if (!saved) return removeContentItem(id); // never saved: discarding removes the new item
  if ($(`#${id}Editor`).contains($('#iconPicker'))) hideIconPicker();
  contentDrafts[id] = deepCopy(saved);
  renderContentForm(id);
}
async function deleteContentItem(id) {
  const name = contentLabel(contentDrafts[id]);
  const ok = await confirmDialog({ label: 'DELETE CONTENT', icon: 'fa-trash', title: `Delete "${name}"?`,
    body: '<p class="muted small">It is removed from the page and from this menu. This cannot be undone.</p>', yes: 'Delete', danger: true });
  if (!ok) return;
  if (savedContent(id) && !storeCustomSections(customSections.filter(c => c.id !== id))) return;
  removeContentItem(id);
  toast(`Deleted "${name}".`);
}
$('#secImageFile').addEventListener('change', e => {
  const file = e.target.files[0], id = contentUploadTarget;
  e.target.value = '';
  const c = contentDrafts[id];
  if (!file || !c) return;
  if (!file.type.startsWith('image/')) return toast('Please choose an image file.');
  compressImage(file, data => { c.image = data; renderContentForm(id); markDirty(); toast('Image ready — click Save changes to put it on the page.'); });
});
$('#addContentBox').addEventListener('click', async e => {
  const btn = e.target.closest('[data-add-content]');
  if (!btn) return;
  const type = btn.dataset.addContent;
  let id;
  do id = 'custom-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); while (document.getElementById(id) || contentDrafts[id]);
  const c = { id, type, icon: 'fa-solid fa-star', tag: `New ${CUSTOM_TYPES[type]} Section`, title: 'Your section title', intro: '', nav: '', text: '', cards: [], image: '', caption: '' };
  if (type === 'text') c.text = 'Write your text here.';
  if (type === 'cards') c.cards = [{ icon: 'fa-solid fa-star', title: 'First card', text: 'Describe this card.' }];
  contentDrafts[id] = c;
  buildContentItem(id);
  refreshMenuEyes();
  applyMenuOrder(fullMenuOrder(menuOrder));
  setSectionOpen('addContent', false);
  if (!(await openSidebarSection(id))) return;
  markDirty();
  const field = $(`#${id}Editor [data-cs-field="title"]`);
  field.scrollIntoView({ block: 'center', behavior: 'smooth' });
  field.focus({ preventScroll: true });
  field.select();
  toast('New content added — edit it, then click Save changes to put it on the page.');
});
customSections.forEach(c => { contentDrafts[c.id] = deepCopy(c); buildContentItem(c.id); });
applyMenuOrder(fullMenuOrder(menuOrder));

/* --- Eye next to each CONTENT menu item: hides that content from visitors right away (admins still see it, dimmed).
       Added sections use the same hidden list as the Sections panel. My Resume has no eye. --- */
const EYE_ITEMS = ['tools', 'focus', 'services', 'cards'];
const isContentHidden = key => EYE_ITEMS.includes(key) ? hiddenContent.includes(key) : hiddenSections.includes(key);
function addMenuEye(key) {
  const nav = menuNav(key);
  if (!nav || $('.menu-eye', nav)) return;
  nav.classList.add('has-eye');
  const eye = document.createElement('button');
  eye.type = 'button';
  eye.className = 'menu-eye';
  eye.dataset.contentEye = key;
  nav.appendChild(eye);
}
function refreshMenuEyes() {
  $$('[data-content-eye]').forEach(eye => {
    const key = eye.dataset.contentEye, hidden = isContentHidden(key);
    eye.innerHTML = eyeIcon(!hidden);
    eye.title = `${hidden ? 'Show' : 'Hide'} "${menuLabel(key)}" on the page`;
    eye.setAttribute('aria-label', eye.title);
    eye.closest('.side-nav').classList.toggle('content-off', hidden);
  });
}
function addAllMenuEyes() {
  [...EYE_ITEMS, ...Object.keys(contentDrafts)].forEach(addMenuEye);
  refreshMenuEyes();
}
const EYE_HIDES = {
  tools: 'The scrolling Tools &amp; Technologies card',
  focus: 'The Current Focus card',
  services: 'The service cards and their "What I can do." heading',
  cards: 'Every section Page Cards manages (all sections except Hero and the ones you added)'
};
$('#adminSidebar').addEventListener('click', async e => {
  const eye = e.target.closest('[data-content-eye]');
  if (!eye) return;
  const key = eye.dataset.contentEye, name = menuLabel(key), hide = !isContentHidden(key);
  if (!EYE_ITEMS.includes(key) && !savedContent(key)) return toast('Save this content first, then you can hide it.');
  // Hiding only takes effect after the admin confirms
  if (hide && !(await confirmDialog({ label: 'HIDE CONTENT', icon: 'fa-eye-slash', title: `Hide "${name}"?`, yes: 'Hide',
    body: `<p class="muted small">${EYE_HIDES[key] || 'This whole section'} will be removed from the page, and the remaining content moves up to fill the space. Click the eye again to bring it back.</p>` }))) return;
  if (EYE_ITEMS.includes(key)) {
    hiddenContent = hide ? [...hiddenContent, key] : hiddenContent.filter(k => k !== key);
    hiddenContent.length ? store.set('romelHiddenContent', hiddenContent) : localStorage.removeItem('romelHiddenContent');
  } else {
    const toggle = list => hide ? [...new Set([...list, key])] : list.filter(id => id !== key);
    hiddenSections = toggle(hiddenSections);
    sectionsDraft = toggle(sectionsDraft);
    storeSectionLayout();
    if (!sectionsPanel.hidden) buildSectionToggles();
  }
  applyVisibility();
  if (typeof refreshEmptySpaces === 'function') refreshEmptySpaces();
  refreshMenuEyes();
  toast(hide ? `"${name}" is hidden from visitors.` : `"${name}" is visible again.`);
});
addAllMenuEyes();

/* --- Logo & Brand: uploaded logo replaces the "R" mark in header, footer and loader --- */
const DEFAULT_LOGO_LETTER = 'R';
// logoData / brand = what the page shows; logoDraft / brandDraft = the Logo & Brand editor (its preview shows the draft)
let logoData = null;
try { logoData = localStorage.getItem('romelLogo'); } catch (e) {}
let logoDraft = logoData;
const inBrandEditor = el => !!el.closest('#logoEditor');
const markHtml = data => data ? `<img src="${data}" alt="Logo" draggable="false">` : DEFAULT_LOGO_LETTER;
function paintMark(el, data) { el.classList.toggle('has-image', !!data); el.innerHTML = markHtml(data); }
// The header logo image (and its preview in the editor) falls back to the default circuit logo
const DEFAULT_LOGO_SRC = 'romel-logo.svg';
const paintLogoImg = (el, data) => { el.src = data || DEFAULT_LOGO_SRC; el.classList.toggle('is-upload', !!data); };
function applyLogo() {
  $$('.brand-mark, .loader-core').filter(el => !inBrandEditor(el)).forEach(el => paintMark(el, logoData));
  $$('.brand-logo').filter(el => !inBrandEditor(el)).forEach(el => paintLogoImg(el, logoData));
  renderBrandPreview();
}
// Erase a plain backdrop: find the dominant colour along the image edges, flood-fill it
// inward from the edges, then soften the cut-out edge. Busy/transparent backdrops are left alone.
function removeBackground(ctx, size) {
  const im = ctx.getImageData(0, 0, size, size), px = im.data, n = size * size;
  const border = [];
  for (let i = 0; i < size; i++) border.push(i, (size - 1) * size + i, i * size, i * size + size - 1);
  if (border.filter(p => px[p * 4 + 3] < 20).length > border.length / 2) return; // already transparent
  const buckets = new Map();
  border.forEach(p => {
    const k = (px[p * 4] >> 4) << 8 | (px[p * 4 + 1] >> 4) << 4 | px[p * 4 + 2] >> 4;
    const b = buckets.get(k) || { count: 0, r: 0, g: 0, b: 0 };
    b.count++; b.r += px[p * 4]; b.g += px[p * 4 + 1]; b.b += px[p * 4 + 2];
    buckets.set(k, b);
  });
  const top = [...buckets.values()].sort((a, b) => b.count - a.count)[0];
  if (top.count < border.length * 0.25) return; // no clear single backdrop colour
  const bg = [top.r / top.count, top.g / top.count, top.b / top.count];
  const dist = p => Math.hypot(px[p * 4] - bg[0], px[p * 4 + 1] - bg[1], px[p * 4 + 2] - bg[2]);
  const TOL = 42;
  const isBg = new Uint8Array(n), queue = [];
  border.forEach(p => { if (!isBg[p] && dist(p) < TOL) { isBg[p] = 1; queue.push(p); } });
  while (queue.length) {
    const p = queue.pop(), x = p % size, y = (p / size) | 0;
    [x > 0 && p - 1, x < size - 1 && p + 1, y > 0 && p - size, y < size - 1 && p + size].forEach(q => {
      if (q !== false && !isBg[q] && dist(q) < TOL * 1.5) { isBg[q] = 1; queue.push(q); }
    });
  }
  // Soft edge: alpha = share of foreground pixels in a 5x5 neighbourhood
  const alpha = new Float32Array(n);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let fg = 0, all = 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const xx = x + dx, yy = y + dy;
      if (xx < 0 || yy < 0 || xx >= size || yy >= size) continue;
      all++; if (!isBg[yy * size + xx]) fg++;
    }
    alpha[y * size + x] = isBg[y * size + x] ? 0 : Math.min(1, fg / all * 1.6);
  }
  for (let p = 0; p < n; p++) px[p * 4 + 3] = Math.round(px[p * 4 + 3] * alpha[p]);
  ctx.putImageData(im, 0, 0);
}
// Turn an upload into a round 256px logo: centre square crop (portraits lean to the top,
// where faces are), backdrop removed, circle mask. Small enough for browser storage.
function makeRoundLogo(img) {
  const SIZE = 256, side = Math.min(img.width, img.height);
  const sx = (img.width - side) / 2, sy = (img.height - side) * 0.2;
  const c = document.createElement('canvas');
  c.width = c.height = SIZE;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, sx, sy, side, side, 0, 0, SIZE, SIZE);
  removeBackground(ctx, SIZE);
  ctx.globalCompositeOperation = 'destination-in';
  ctx.beginPath(); ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2); ctx.fill();
  return c.toDataURL('image/png');
}
function loadLogoFile(file) {
  if (!file || !file.type.startsWith('image/')) return toast('Please choose an image file.');
  if (file.size > 8 * 1024 * 1024) return toast('That image is too large (max 8 MB).');
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      logoDraft = makeRoundLogo(img);
      renderBrandPreview();
      toast('Logo ready — click Save changes to put it on the page.');
    };
    img.onerror = () => toast('That image could not be read.');
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}
$('#uploadLogo').addEventListener('click', () => $('#logoFile').click());
$('#logoFile').addEventListener('change', e => { loadLogoFile(e.target.files[0]); e.target.value = ''; });
const logoDrop = $('#logoDrop');
['dragenter', 'dragover'].forEach(type => logoDrop.addEventListener(type, e => { e.preventDefault(); logoDrop.classList.add('dragging'); }));
['dragleave', 'drop'].forEach(type => logoDrop.addEventListener(type, e => { e.preventDefault(); logoDrop.classList.remove('dragging'); }));
logoDrop.addEventListener('drop', e => loadLogoFile(e.dataTransfer.files[0]));
$('#removeLogo').addEventListener('click', () => { logoDraft = null; renderBrandPreview(); });

/* --- Brand name & tagline (header, footer, loader, browser tab title) --- */
const DEFAULT_BRAND = { name: 'ROMEL BRIONES', tagline: 'CREATIVE DEVELOPER' };
let brand = { ...DEFAULT_BRAND, ...store.get('romelBrand', {}) };
let brandDraft = { ...brand };
const titleCase = s => s.toLowerCase().replace(/(^|[\s&/-])(\p{L})/gu, (m, sep, ch) => sep + ch.toUpperCase());
// The whole name uses one continuous theme gradient, so every word matches whichever theme is active
function paintBrand(state, onlyEditor) {
  const name = state.name.trim() || DEFAULT_BRAND.name, tagline = state.tagline.trim();
  const mine = el => inBrandEditor(el) === onlyEditor;
  $$('[data-brand="name"]').filter(mine).forEach(el => el.innerHTML = `<span class="gradient-text">${escapeHtml(name)}</span>`);
  $$('[data-brand="plain"]').filter(mine).forEach(el => el.textContent = name);
  $$('[data-brand="tagline"]').filter(mine).forEach(el => { el.textContent = tagline; el.hidden = !tagline; });
  if (!onlyEditor) document.title = tagline ? `${titleCase(name)} | ${titleCase(tagline)}` : titleCase(name);
}
function applyBrand() { paintBrand(brand, false); renderBrandPreview(); }
// The little preview inside Logo & Brand shows the draft
function renderBrandPreview() {
  if (typeof brandDraft === 'undefined') return;
  $$('#logoEditor .brand-logo').forEach(el => paintLogoImg(el, logoDraft));
  paintBrand(brandDraft, true);
  $('#removeLogo').disabled = !logoDraft;
  $$('[data-brand-reset]').forEach(btn => btn.disabled = brandDraft[btn.dataset.brandReset] === DEFAULT_BRAND[btn.dataset.brandReset]);
  markDirty();
}
const brandInputs = { name: $('#brandNameInput'), tagline: $('#brandTaglineInput') };
function saveBrand() {
  const changed = Object.fromEntries(Object.entries(brand).filter(([k, v]) => v !== DEFAULT_BRAND[k]));
  if (Object.keys(changed).length) store.set('romelBrand', changed);
  else localStorage.removeItem('romelBrand');
}
const brandDirty = () => !sameJSON(brandDraft, brand) || logoDraft !== logoData;
function commitBrand() {
  if (!brandDraft.name.trim()) brandDraft.name = brandInputs.name.value = DEFAULT_BRAND.name; // never a blank header
  try { logoDraft ? localStorage.setItem('romelLogo', logoDraft) : localStorage.removeItem('romelLogo'); }
  catch (e) { toast('Could not save the logo — try a smaller image.'); return false; }
  logoData = logoDraft;
  brand = { ...brandDraft };
  saveBrand();
  applyLogo();
  applyBrand();
}
function discardBrand() {
  brandDraft = { ...brand };
  logoDraft = logoData;
  Object.entries(brandInputs).forEach(([key, input]) => input.value = brand[key]);
  renderBrandPreview();
}
Object.entries(brandInputs).forEach(([key, input]) => {
  input.value = brand[key];
  input.addEventListener('input', () => { brandDraft[key] = input.value; renderBrandPreview(); });
});
$$('[data-brand-reset]').forEach(btn => btn.addEventListener('click', () => {
  const key = btn.dataset.brandReset;
  brandDraft[key] = brandInputs[key].value = DEFAULT_BRAND[key];
  renderBrandPreview();
}));
applyLogo();
applyBrand();

/* --- My Resume: the file saved into resumes/ by the local server. Only { url, name } is
   stored as a setting, so each niche can point at its own resume. --- */
let resumeSaved = loadJSON('romelResume', null);
let resumeDraft = resumeSaved;
// PDFs open in a new tab; Word files can't display in a browser, so they download without leaving a blank tab
function openResume() {
  const a = document.createElement('a');
  a.href = resumeSaved.url;
  if (/\.pdf$/i.test(resumeSaved.url)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
  else a.download = resumeSaved.name;
  a.click();
}
function renderResumeEditor() {
  $('#resumeFileName').textContent = resumeDraft ? resumeDraft.name : 'No resume uploaded yet';
  $('#uploadResume span').textContent = resumeDraft ? 'Replace Resume' : 'Upload Resume';
  $('#previewResume').hidden = !resumeDraft;
  if (resumeDraft) $('#previewResume').href = resumeDraft.url;
  $('#removeResume').disabled = !resumeDraft;
  markDirty();
}
async function uploadResumeFile(file) {
  if (!file) return;
  if (!/\.(pdf|docx?)$/i.test(file.name)) return toast('Please choose a PDF or Word file.');
  if (file.size > 15 * 1024 * 1024) return toast('That file is too large (max 15 MB).');
  const button = $('#uploadResume');
  button.disabled = true;
  try {
    const r = await fetch(`/__upload-resume?name=${encodeURIComponent(file.name)}`, { method: 'POST', body: file });
    if (!r.ok) throw new Error(String(r.status));
    resumeDraft = { url: (await r.text()).trim(), name: file.name };
    renderResumeEditor();
    toast('Resume uploaded — click Save changes to use it.');
  } catch (e) {
    toast('Upload failed — open the site from http://localhost:8000 and try again.');
  }
  button.disabled = false;
}
const resumeDirty = () => !sameJSON(resumeDraft, resumeSaved);
function commitResume() {
  try { resumeDraft ? store.set('romelResume', resumeDraft) : localStorage.removeItem('romelResume'); }
  catch (e) { toast('Could not save — browser storage is full.'); return false; }
  resumeSaved = resumeDraft;
}
function discardResume() { resumeDraft = resumeSaved; renderResumeEditor(); }
$('#uploadResume').addEventListener('click', () => $('#resumeFile').click());
$('#resumeFile').addEventListener('change', e => { uploadResumeFile(e.target.files[0]); e.target.value = ''; });
const resumeDrop = $('#resumeDrop');
['dragenter', 'dragover'].forEach(type => resumeDrop.addEventListener(type, e => { e.preventDefault(); resumeDrop.classList.add('dragging'); }));
['dragleave', 'drop'].forEach(type => resumeDrop.addEventListener(type, e => { e.preventDefault(); resumeDrop.classList.remove('dragging'); }));
resumeDrop.addEventListener('drop', e => uploadResumeFile(e.dataTransfer.files[0]));
$('#removeResume').addEventListener('click', () => { resumeDraft = null; renderResumeEditor(); });
renderResumeEditor();

/* init theme before the role so the sidebar editor starts on the saved site theme */
let savedTheme = 'dark';
try { savedTheme = localStorage.getItem('romelTheme') || 'dark'; } catch (e) {}
applyTheme(savedTheme);
discardColors(); // color editor draft starts from the saved theme

setRole(role);


/* ==========================================================================
   PAGE CARDS (sidebar → Page Cards): hide / show, reorder, move between
   columns, and add custom Quote / Text / List / Tags cards in any section.
   Runs last so Edit Text has already keyed the original elements.
   ========================================================================== */
const CARD_TYPES = { quote: 'Quote card', text: 'Text card', list: 'List card', tags: 'Tags card' };
const NEW_CARD_DEFAULTS = {
  quote: { icon: 'fa-solid fa-quote-left', title: 'Your bold statement here.', subtitle: '', text: 'A short supporting line.', items: [] },
  text: { icon: 'fa-solid fa-lightbulb', title: 'New Card', subtitle: 'Subtitle', text: 'Write a short paragraph about this topic.', items: [] },
  list: { icon: 'fa-solid fa-list-check', title: 'New List', subtitle: 'Highlights', text: '', items: ['First point', 'Second point', 'Third point'] },
  tags: { icon: 'fa-solid fa-layer-group', title: 'New Tags', subtitle: '', text: '', items: ['Tag one', 'Tag two', 'Tag three'] }
};

// Two-column sections get a wrapper per column so several cards can stack in one column
['#calendars .split-grid', '#contact .contact-grid'].forEach(sel => {
  const grid = $(sel);
  [...grid.children].forEach(child => {
    const col = document.createElement('div');
    col.className = 'stack-col card-col';
    grid.insertBefore(col, child);
    col.appendChild(child);
  });
});
// Where cards can live: [section id, zone key, zone label, container]
const sectionCols = id => $$(`#${id} .about-grid > .stack-col, #${id} .split-grid > .stack-col, #${id} .contact-grid > .stack-col`);
const CARD_ZONES = [
  ['about', 'left', 'Left column', sectionCols('about')[0]], ['about', 'right', 'Right column', sectionCols('about')[1]],
  ['services', 'main', 'Below service cards', $('#services > .container')],
  ['agents', 'main', 'Main area', $('#agents > .container')],
  ['calendars', 'left', 'Left column', sectionCols('calendars')[0]], ['calendars', 'right', 'Right column', sectionCols('calendars')[1]],
  ['workflows', 'main', 'Cards grid', $('#workflows .card-grid')],
  ['integrations', 'main', 'Cards grid', $('#integrations .card-grid')],
  ['funnels', 'main', 'Cards grid', $('#funnels .card-grid')],
  ['approvals', 'main', 'Gallery grid', $('#approvals .card-grid')],
  ['contact', 'left', 'Left column', sectionCols('contact')[0]], ['contact', 'right', 'Right column', sectionCols('contact')[1]]
].map(([section, zone, label, el]) => ({ section, key: `${section}:${zone}`, label, el }));

// Original cards: stable ids from their default position
const originalCards = {}, defaultCardOrder = {};
CARD_ZONES.forEach(z => {
  defaultCardOrder[z.key] = [...z.el.children].filter(c => c.classList.contains('card')).map((card, i) => {
    const id = `${z.key}:${i}`;
    card.dataset.cardId = id;
    originalCards[id] = card;
    return id;
  });
});
const cardName = card => {
  const h = card.querySelector('h3, h2, h4, .mono-label span, .auto-title h3');
  return (h ? h.textContent : 'Card').replace(/\s+/g, ' ').trim().slice(0, 48) || 'Card';
};

// cardState = what the page shows; cardDraft = the Page Cards manager until "Save changes"
let cardState = loadJSON('romelCards', { order: {}, hidden: [], custom: {} });
['order', 'hidden', 'custom'].forEach(k => { if (!cardState[k]) cardState[k] = k === 'hidden' ? [] : {}; });
let cardDraft = deepCopy(cardState);
// Merge a state's saved order with the defaults: drop unknown ids, keep originals that were never placed
function resolvedOrder(state = cardState) {
  const exists = id => !!(originalCards[id] || state.custom[id]);
  const order = {}, placed = new Set();
  CARD_ZONES.forEach(z => {
    order[z.key] = (state.order[z.key] || defaultCardOrder[z.key]).filter(id => exists(id) && !placed.has(id));
    order[z.key].forEach(id => placed.add(id));
  });
  CARD_ZONES.forEach(z => defaultCardOrder[z.key].forEach(id => { if (!placed.has(id)) { order[z.key].push(id); placed.add(id); } }));
  Object.keys(state.custom).forEach(id => { if (!placed.has(id)) delete state.custom[id]; });
  return order;
}

function buildCustomCard(id) {
  const c = cardState.custom[id];
  const el = document.createElement('article');
  el.className = 'card pad-md custom-card reveal visible';
  el.dataset.cardId = id;
  const head = `<div class="card-title-row"><div class="${c.type === 'quote' ? 'mini-icon c-biloba-bg' : 'icon-box'}"><i class="${c.icon}"></i></div>`
    + `<div>${c.type === 'quote' ? `<h4>${escapeHtml(c.title)}</h4>` : `<h3>${escapeHtml(c.title)}</h3>`}`
    + (c.type === 'quote' && c.text ? `<p class="muted small">${escapeHtml(c.text)}</p>` : '')
    + (c.type !== 'quote' && c.subtitle ? `<p class="mono-sub">${escapeHtml(c.subtitle)}</p>` : '') + '</div></div>';
  const items = c.items.filter(s => s.trim());
  const body = c.type === 'text' ? (c.text ? `<p class="custom-text">${escapeHtml(c.text)}</p>` : '')
    : c.type === 'list' ? `<ul class="check-list">${items.map(s => `<li><i class="fa-solid fa-circle-check"></i>${escapeHtml(s)}</li>`).join('')}</ul>`
    : c.type === 'tags' ? `<div class="chips custom-chips" style="--tone:var(--accent)">${items.map(s => `<span>${escapeHtml(s)}</span>`).join('')}</div>` : '';
  el.innerHTML = head + body;
  return el;
}

function applyCardLayout() {
  const order = resolvedOrder();
  $$('.custom-card').forEach(el => el.remove());
  CARD_ZONES.forEach(z => order[z.key].forEach(id => {
    const el = originalCards[id] || buildCustomCard(id);
    el.classList.toggle('card-hidden', cardState.hidden.includes(id));
    z.el.appendChild(el);
  }));
  return order;
}
// Manager change: only the draft changes (the page updates on Save)
function saveCards() {
  renderCardManager();
  markDirty();
}
const cardsDirty = () => !sameJSON({ ...cardDraft, order: resolvedOrder(cardDraft) }, { ...cardState, order: resolvedOrder(cardState) });
function commitCards() {
  try { localStorage.setItem('romelCards', JSON.stringify(cardDraft)); } catch (e) { toast('Could not save — browser storage is full.'); return false; }
  cardState = deepCopy(cardDraft);
  applyCardLayout();
  refreshEmptySpaces();
  renderCardManager();
}
function discardCards() {
  cardDraft = deepCopy(cardState);
  editingCardId = null;
  hideIconPicker();
  renderCardManager();
}

/* Auto-tidy: collapse whatever hidden cards leave empty, so spacing stays uniform for clients */
// Only the admin's hide counts here — workflow cards hidden by the n8n / Zapier filter tabs are still "shown"
const isShown = el => !el.classList.contains('card-hidden') && !el.classList.contains('content-hidden');
function refreshEmptySpaces() {
  // A column with nothing visible is removed and its partner takes the full width
  $$('#about .about-grid, #calendars .split-grid, #contact .contact-grid').forEach(grid => {
    const cols = [...grid.children];
    cols.forEach(col => col.classList.toggle('col-empty', ![...col.children].some(isShown)));
    grid.classList.toggle('single-col', cols.filter(col => !col.classList.contains('col-empty')).length === 1);
    // Content hidden with a sidebar eye is gone for the admin too, so a column left with nothing collapses there as well
    cols.forEach(col => col.classList.toggle('col-void', ![...col.children].some(c => !c.classList.contains('content-hidden'))));
    grid.classList.toggle('single-col-all', cols.filter(col => !col.classList.contains('col-void')).length === 1);
  });
  // Card grids with nothing visible take no space at all
  $$('#servicesGrid, #workflows .card-grid, #integrations .card-grid, #funnels .card-grid, #approvals .card-grid')
    .forEach(grid => grid.classList.toggle('grid-empty', ![...grid.children].some(isShown)));
  layoutServiceGrid();
  // A section with no visible cards and no other content is dropped entirely
  const hasOtherContent = { contact: true, approvals: $$('#approvals .img-preview').length > 0, services: servicesSaved.some(s => !s.hidden) };
  autoEmptySections = new Set(cardSections.filter(section =>
    !hasOtherContent[section] && !CARD_ZONES.filter(z => z.section === section).some(z => [...z.el.children].some(c => c.classList.contains('card') && isShown(c)))));
  applyVisibility();
}

/* --- sidebar manager UI --- */
let editingCardId = null;
const sectionLabel = id => ($(`.desktop-nav a[href="#${id}"]`) || {}).textContent || ($(`#${id} h2`) || {}).textContent || id;
const cardSections = [...new Set(CARD_ZONES.map(z => z.section))];
$('#cardSection').innerHTML = cardSections.map(id => `<option value="${id}">${escapeHtml(sectionLabel(id).trim())}</option>`).join('');

function cardEditorHtml(id) {
  const c = cardDraft.custom[id];
  const field = (label, html) => `<label class="text-row">${label}</label>${html}`;
  return `<div class="card-edit">`
    + `<div class="svc-head"><button type="button" class="tool-icon" data-card-icon="${id}" style="--tone:${iconTone(c.icon)}" title="Change icon"><i class="${c.icon}"></i></button>`
    + `<select class="tool-name" data-card-field="type">${Object.entries(CARD_TYPES).map(([k, v]) => `<option value="${k}"${k === c.type ? ' selected' : ''}>${v}</option>`).join('')}</select></div>`
    + field('Title', `<input type="text" class="tool-name" data-card-field="title" value="${escapeHtml(c.title)}" maxlength="80">`)
    + (c.type === 'text' || c.type === 'list' ? field('Subtitle', `<input type="text" class="tool-name" data-card-field="subtitle" value="${escapeHtml(c.subtitle)}" maxlength="60">`) : '')
    + (c.type === 'quote' || c.type === 'text' ? field(c.type === 'quote' ? 'Small line' : 'Paragraph', `<textarea class="tool-name svc-desc" data-card-field="text" rows="3" maxlength="400">${escapeHtml(c.text)}</textarea>`) : '')
    + (c.type === 'list' || c.type === 'tags' ? field(c.type === 'list' ? 'Bullet points (one per line)' : 'Tags (one per line)', `<textarea class="tool-name svc-desc" data-card-field="items" rows="4" maxlength="800">${escapeHtml(c.items.join('\n'))}</textarea>`) : '')
    + `</div>`;
}
function renderCardManager() {
  const section = $('#cardSection').value, order = resolvedOrder(cardDraft);
  const zones = CARD_ZONES.filter(z => z.section === section);
  $('#cardList').innerHTML = zones.map(z => {
    const ids = order[z.key];
    const rows = ids.map((id, i) => {
      const custom = !!cardDraft.custom[id], hidden = cardDraft.hidden.includes(id);
      const name = custom ? cardDraft.custom[id].title || 'Untitled card' : cardName(originalCards[id]);
      const zoneSelect = zones.length > 1
        ? `<select class="tool-name zone-select" data-card-zone="${id}" title="Column">${zones.map(o => `<option value="${o.key}"${o.key === z.key ? ' selected' : ''}>${o.label.replace(' column', '')}</option>`).join('')}</select>` : '';
      return `<div class="card-row${hidden ? ' is-off' : ''}${id === editingCardId ? ' editing' : ''}">`
        + `<div class="card-row-main">`
        + `<button type="button" class="mini-btn" data-card-toggle="${id}" title="${hidden ? 'Show to clients' : 'Hide from clients'}"><i class="fa-solid ${hidden ? 'fa-eye-slash' : 'fa-eye'}"></i></button>`
        + `<span class="card-row-name" title="${escapeHtml(name)}">${escapeHtml(name)}${custom ? ' <em>custom</em>' : ''}</span>`
        + `<button type="button" class="mini-btn" data-card-move="${id}" data-dir="-1" title="Move up"${i === 0 ? ' disabled' : ''}><i class="fa-solid fa-arrow-up"></i></button>`
        + `<button type="button" class="mini-btn" data-card-move="${id}" data-dir="1" title="Move down"${i === ids.length - 1 ? ' disabled' : ''}><i class="fa-solid fa-arrow-down"></i></button>`
        + (custom ? `<button type="button" class="mini-btn" data-card-edit="${id}" title="Edit card"><i class="fa-solid fa-pen"></i></button>`
                  + `<button type="button" class="mini-btn danger" data-card-delete="${id}" title="Delete card"><i class="fa-solid fa-trash"></i></button>` : '')
        + `</div>${zoneSelect ? `<div class="card-row-sub">${zoneSelect}</div>` : ''}`
        + (custom && id === editingCardId ? cardEditorHtml(id) : '')
        + `</div>`;
    }).join('') || '<p class="field-hint">No cards here yet.</p>';
    return `<div class="zone-group"><span class="side-label">${escapeHtml(z.label.toUpperCase())}</span>${rows}</div>`;
  }).join('');
  $('#newCardZone').innerHTML = zones.map(z => `<option value="${z.key}">${escapeHtml(z.label)}</option>`).join('');
  const isDefault = zones.every(z => JSON.stringify(order[z.key].filter(id => originalCards[id])) === JSON.stringify(defaultCardOrder[z.key]))
    && !cardDraft.hidden.some(id => zones.some(z => id.startsWith(z.key + ':')));
  $('#resetCardLayout').disabled = isDefault;
}
// Persist the full resolved order whenever something moves
function setOrder(order) { cardDraft.order = order; }

$('#cardSection').addEventListener('change', () => { editingCardId = null; hideIconPicker(); renderCardManager(); });
$('#cardList').addEventListener('click', e => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const order = resolvedOrder(cardDraft);
  if (btn.dataset.cardToggle) {
    const id = btn.dataset.cardToggle;
    cardDraft.hidden = cardDraft.hidden.includes(id) ? cardDraft.hidden.filter(h => h !== id) : [...cardDraft.hidden, id];
    saveCards();
  } else if (btn.dataset.cardMove) {
    const id = btn.dataset.cardMove, dir = Number(btn.dataset.dir);
    const zoneKey = Object.keys(order).find(k => order[k].includes(id)), list = order[zoneKey], i = list.indexOf(id);
    if (list[i + dir] == null) return;
    [list[i], list[i + dir]] = [list[i + dir], list[i]];
    setOrder(order);
    saveCards();
  } else if (btn.dataset.cardEdit) {
    hideIconPicker();
    editingCardId = editingCardId === btn.dataset.cardEdit ? null : btn.dataset.cardEdit;
    renderCardManager();
  } else if (btn.dataset.cardDelete) {
    const id = btn.dataset.cardDelete;
    if (editingCardId === id) { editingCardId = null; hideIconPicker(); }
    delete cardDraft.custom[id];
    cardDraft.hidden = cardDraft.hidden.filter(h => h !== id);
    Object.keys(order).forEach(k => order[k] = order[k].filter(x => x !== id));
    setOrder(order);
    saveCards();
    toast('Card removed — click Save changes to apply.');
  } else if (btn.dataset.cardIcon) {
    const id = btn.dataset.cardIcon;
    showIconPicker($('#cardPickerMount'), `Icon for "${cardDraft.custom[id].title || 'card'}"`, cardDraft.custom[id].icon,
      icon => { cardDraft.custom[id].icon = icon; saveCards(); });
  }
});
$('#cardList').addEventListener('change', e => {
  if (e.target.dataset.cardZone) {
    const id = e.target.dataset.cardZone, order = resolvedOrder(cardDraft);
    Object.keys(order).forEach(k => order[k] = order[k].filter(x => x !== id));
    order[e.target.value].push(id);
    setOrder(order);
    saveCards();
  } else if (e.target.dataset.cardField === 'type') {
    cardDraft.custom[editingCardId].type = e.target.value;
    saveCards();
  }
});
// Text fields update the draft as you type without rebuilding the editor (keeps the cursor in place)
$('#cardList').addEventListener('input', e => {
  const field = e.target.dataset.cardField;
  if (!field || field === 'type' || !editingCardId) return;
  const c = cardDraft.custom[editingCardId];
  c[field] = field === 'items' ? e.target.value.split('\n') : e.target.value;
  markDirty();
  if (field === 'title') { const name = $('#cardList .card-row.editing .card-row-name'); if (name) name.innerHTML = `${escapeHtml(c.title || 'Untitled card')} <em>custom</em>`; }
});
$('#addCard').addEventListener('click', () => {
  const type = $('#newCardType').value, zoneKey = $('#newCardZone').value, order = resolvedOrder(cardDraft);
  const id = 'custom-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  cardDraft.custom[id] = { type, ...JSON.parse(JSON.stringify(NEW_CARD_DEFAULTS[type])) };
  order[zoneKey].push(id);
  setOrder(order);
  editingCardId = id;
  saveCards();
  toast(`${CARD_TYPES[type]} added — edit it here, then click Save changes to put it on the page.`);
});
// Restores this section's original cards to their default places and makes them visible; custom cards stay
$('#resetCardLayout').addEventListener('click', () => {
  const section = $('#cardSection').value, order = resolvedOrder(cardDraft);
  CARD_ZONES.filter(z => z.section === section).forEach(z => {
    const customs = order[z.key].filter(id => cardDraft.custom[id]);
    order[z.key] = [...defaultCardOrder[z.key], ...customs];
  });
  cardDraft.hidden = cardDraft.hidden.filter(id => !id.startsWith(section + ':'));
  setOrder(order);
  saveCards();
  toast('Default layout restored in the editor (your custom cards were kept) — click Save changes to apply.');
});

applyCardLayout();
refreshEmptySpaces();
renderCardManager();

/* ==========================================================================
   NICHES (sidebar → Niches): one saved setup per client niche.
   A niche stores every admin setting; "Save Niche" writes them all to niches.js
   (via the local server), which every visitor loads. Links: ?niche=<slug>.
   ========================================================================== */
const NICHE_KEYS = ['romelPageEditsV3', 'romelHiddenSections', 'romelPortfolioContent', 'romelTheme', 'romelThemeColors', 'romelThemeCache', 'romelLogo', 'romelBrand', 'romelTools', 'romelFocus', 'romelServices', 'romelCards', 'romelHero', 'romelImages', 'romelResume', 'romelSectionOrder', 'romelCustomSections', 'romelHiddenContent', 'romelFonts'];
let nicheData = JSON.parse(JSON.stringify(window.ROMEL_NICHES || { default: null, niches: {} }));
if (!nicheData.niches) nicheData.niches = {};
let pendingNiche = loadJSON('romelPendingNiche', null); // created in the panel but not saved yet
const activeNiche = () => localStorage.getItem('romelActiveNiche');

const snapshotSettings = () => {
  const s = {};
  NICHE_KEYS.forEach(k => { const v = localStorage.getItem(k); if (v != null) s[k] = v; });
  return s;
};
const slugify = name => name.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').slice(0, 40) || 'niche';
const nicheLink = slug => `${location.origin}${location.pathname}?niche=${encodeURIComponent(slug)}`;
function currentNicheInfo() {
  const slug = activeNiche();
  if (pendingNiche && pendingNiche.slug === slug) return { ...pendingNiche, unsavedNew: true };
  const n = slug && nicheData.niches[slug];
  return n ? { slug, name: n.name, keywords: n.keywords || '' } : null;
}
function hasUnsavedChanges() {
  const info = currentNicheInfo();
  if (!info) return false;
  return info.unsavedNew || JSON.stringify(snapshotSettings()) !== JSON.stringify(nicheData.niches[info.slug].settings || {});
}

// Writes niches.js into the project through the local server; elsewhere (e.g. GitHub Pages) downloads it instead
async function publishNiches() {
  const body = JSON.stringify(nicheData);
  try {
    const r = await fetch('/__save-niches', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    if (!r.ok) throw new Error(String(r.status));
    return true;
  } catch (e) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([`/* Saved niche presets - written by the admin 'Save niche' button. */\nwindow.ROMEL_NICHES = ${body};\n`], { type: 'text/javascript' }));
    a.download = 'niches.js';
    a.click();
    toast('Could not save into the site folder, so niches.js was downloaded — put it in the site folder.');
    return false;
  }
}
// The page reloads after a save (live reload) or after applying suggestions; these restore the panel + message
function reloadWith(message) {
  sessionStorage.setItem('romelNicheToast', message);
  sessionStorage.setItem('romelOpenNiches', '1');
  location.reload();
}

function updateNicheStatus() {
  const info = currentNicheInfo(), unsaved = hasUnsavedChanges();
  $('#nicheCurrentLabel').textContent = info ? `· ${info.name}` : '';
  $('#nicheStatus').innerHTML = info
    ? `<span class="text-row">Now editing</span><div class="niche-now"><strong>${escapeHtml(info.name)}</strong>${unsaved ? '<em class="unsaved">Unsaved changes</em>' : '<em class="saved">Saved</em>'}</div>`
    : '<p class="field-hint">No niche yet. Create one below — you can start fresh or copy your current setup.</p>';
  $('#saveNiche').disabled = !info || !unsaved;
  $('#suggestAgain').hidden = !info;
}
/* --- Site theme per niche: chosen when creating (with a suggestion) and changeable on each row --- */
const NICHE_THEME_HINTS = [
  [/neon|gaming|gamer|esport|nightlife|club|dj|music|stream|twitch/, 'cyberpunk'],
  [/ghl|highlevel|gohighlevel|a2p|10dlc|sms/, 'sunny'],
  [/ceo|executive|business|finance|financial|law|legal|attorney|accounting|real estate|realty|insurance|invest|wealth|corporate|b2b|consult/, 'executive'],
  [/vibe|claude|cod(e|ing)|developer|programm|cursor|\bai\b|agent|saas|tech/, 'midnight'],
  [/automation|workflow|zapier|n8n|make|crm|integration|api/, 'ocean'],
  [/design|brand|ui|ux|creative|portfolio|consult|corporate|clean/, 'slate'],
  [/web|website|landing|funnel|marketing/, 'dark']
];
const suggestNicheTheme = text => (NICHE_THEME_HINTS.find(([re]) => re.test(text.toLowerCase())) || [])[1] || null;
let newNicheTheme = null, newNicheThemeTouched = false, themeRowOpen = null;

// A saved niche's theme + its own custom colors (so each swatch shows what that niche really looks like)
function nicheThemeOf(slug) {
  if (slug === activeNiche()) return { theme: siteTheme, colors: themeColors(siteTheme) };
  const s = (nicheData.niches[slug] || {}).settings || {};
  const theme = THEMES[s.romelTheme] ? s.romelTheme : 'dark';
  const custom = JSON.parse(s.romelThemeColors || '{}');
  return { theme, colors: custom[theme] || THEMES[theme].colors, custom };
}
function renderNewNicheThemes() {
  const suggested = suggestNicheTheme(`${$('#newNicheName').value} ${$('#newNicheKeywords').value}`);
  if (!newNicheThemeTouched) newNicheTheme = suggested || siteTheme;
  $('#nicheThemeHint').textContent = suggested ? `suggested: ${THEMES[suggested].label}` : '';
  $('#newNicheThemes').innerHTML = Object.entries(THEMES).map(([key, t]) =>
    `<button type="button" data-new-theme="${key}" class="${key === newNicheTheme ? 'active' : ''}" title="${t.label}${key === suggested ? ' (suggested)' : ''}">`
    + `${swatchHtml(themeColors(key))}<span>${t.label}</span>${key === suggested ? '<i class="fa-solid fa-wand-magic-sparkles sug"></i>' : ''}</button>`).join('');
}
['#newNicheName', '#newNicheKeywords'].forEach(sel => $(sel).addEventListener('input', renderNewNicheThemes));
$('#newNicheThemes').addEventListener('click', e => {
  const btn = e.target.closest('[data-new-theme]');
  if (!btn) return;
  newNicheThemeTouched = true;
  newNicheTheme = btn.dataset.newTheme;
  renderNewNicheThemes();
  applyTheme(newNicheTheme, newNicheTheme !== siteTheme); // live preview while choosing
});

async function setNicheTheme(slug, theme) {
  themeRowOpen = null;
  if (slug === activeNiche()) {
    setSiteTheme(theme);
    draftSiteTheme = siteTheme; // keep the color editor in step with the niche's theme
    renderNichePanel();
    return toast(`${THEMES[theme].label} applied — click Save Niche to keep it.`);
  }
  // A niche that is not open: update its saved setup directly (including the pre-paint theme cache)
  const n = nicheData.niches[slug], { custom } = nicheThemeOf(slug);
  let cache = null;
  const colors = custom[theme] || (isDerivedTheme(theme) ? THEMES[theme].colors : null);
  if (colors) {
    const d = deriveThemeVars(colors);
    cache = { theme, light: d.light, neon: !!THEMES[theme].neon, css: Object.entries(d.vars).map(([k, v]) => `${k}:${v}`).join(';') };
  }
  n.settings.romelTheme = theme;
  n.settings.romelThemeCache = JSON.stringify(cache);
  n.updatedAt = Date.now();
  if (await publishNiches()) toast(`"${n.name}" now uses the ${THEMES[theme].label} theme.`);
  renderNichePanel();
}

function renderNichePanel() {
  const active = activeNiche();
  const rows = Object.entries(nicheData.niches).map(([slug, n]) => ({ slug, name: n.name, saved: true }));
  if (pendingNiche) rows.push({ slug: pendingNiche.slug, name: pendingNiche.name, saved: false });
  $('#nicheList').innerHTML = rows.map(r => {
    const isDefault = nicheData.default === r.slug, isActive = r.slug === active;
    const nt = nicheThemeOf(r.slug);
    const themeBtn = `<button type="button" class="mini-btn niche-theme-btn" data-niche-theme="${r.slug}" title="Theme: ${THEMES[nt.theme].label} — click to change">${swatchHtml(nt.colors)}</button>`;
    const themePick = themeRowOpen === r.slug
      ? `<div class="niche-theme-pick">${Object.entries(THEMES).map(([key, t]) => `<button type="button" data-set-niche-theme="${key}" data-slug="${r.slug}" class="${key === nt.theme ? 'active' : ''}">${swatchHtml((nt.custom && nt.custom[key]) || (isActive ? themeColors(key) : t.colors))}<span>${t.label}</span></button>`).join('')}</div>` : '';
    return `<div class="niche-row${isActive ? ' active' : ''}">`
      + `<div class="niche-row-main"><span class="niche-name" title="${escapeHtml(r.name)}">${escapeHtml(r.name)}</span>`
      + (isDefault ? '<em class="tag-default">default</em>' : '') + (!r.saved ? '<em class="unsaved">not saved</em>' : '') + (isActive ? '<em class="tag-active">open</em>' : '') + '</div>'
      + '<div class="niche-actions">' + themeBtn
      + (isActive ? '' : `<button type="button" class="mini-btn" data-niche-open="${r.slug}" title="Open this niche"><i class="fa-solid fa-folder-open"></i></button>`)
      + (r.saved ? `<button type="button" class="mini-btn" data-niche-link="${r.slug}" title="Copy client link"><i class="fa-solid fa-link"></i></button>`
                 + `<button type="button" class="mini-btn${isDefault ? ' on' : ''}" data-niche-default="${r.slug}" title="${isDefault ? 'Default niche (plain link)' : 'Make default for the plain link'}"><i class="fa-${isDefault ? 'solid' : 'regular'} fa-star"></i></button>` : '')
      + `<button type="button" class="mini-btn danger" data-niche-delete="${r.slug}" title="Delete niche"><i class="fa-solid fa-trash"></i></button>`
      + `</div>${themePick}</div>`;
  }).join('') || '<p class="field-hint">No niches yet.</p>';
  updateNicheStatus();
  renderNewNicheThemes();
}

$('#saveNiche').addEventListener('click', async () => {
  // Step 2 of saving: unsaved category edits must be saved (or discarded) before the niche is published
  if (!(await resolveUnsaved())) return;
  const info = currentNicheInfo();
  if (!info) { $('#newNicheName').focus(); return toast('Create a niche first (name it below), then save.'); }
  const updatedAt = Date.now();
  nicheData.niches[info.slug] = { name: info.name, keywords: info.keywords || '', updatedAt, settings: snapshotSettings() };
  if (!nicheData.default || !nicheData.niches[nicheData.default]) nicheData.default = info.slug;
  localStorage.setItem('romelNicheVersion', String(updatedAt));
  localStorage.removeItem('romelPendingNiche');
  pendingNiche = null;
  sessionStorage.setItem('romelOpenNiches', '1');
  const ok = await publishNiches();
  renderNichePanel();
  if (ok) toast(`"${info.name}" saved. Clients with its link now see this version.`);
});

// Every new niche asks for its starting point: a fresh default page or a copy of the current setup
async function askNicheStart() {
  const name = $('#newNicheName').value.trim();
  if (!name) { $('#newNicheName').focus(); return toast('Give the niche a name first.'); }
  if (!(await resolveUnsaved())) return;
  if (hasUnsavedChanges() && !confirm('The niche you have open has unsaved changes. Continue without saving them?')) return;
  $('#nicheStartName').textContent = name;
  openModal('nicheStartModal');
}
// Logo & brand name are the admin's identity, so a fresh niche keeps them
const FRESH_KEEP_KEYS = ['romelLogo', 'romelBrand'];
function createNiche(start) {
  const name = $('#newNicheName').value.trim();
  let slug = slugify(name), n = 2;
  while (nicheData.niches[slug]) slug = `${slugify(name)}-${n++}`;
  pendingNiche = { slug, name, keywords: $('#newNicheKeywords').value.trim() };
  localStorage.setItem('romelPendingNiche', JSON.stringify(pendingNiche));
  localStorage.setItem('romelActiveNiche', slug);
  localStorage.removeItem('romelNicheVersion');
  const theme = newNicheTheme || siteTheme; // the theme picked in the form becomes this niche's theme
  newNicheThemeTouched = false;
  $('#newNicheName').value = $('#newNicheKeywords').value = '';
  if (start === 'fresh') {
    // Back to the original page (default colors too), then reload so every section is drawn from the defaults
    NICHE_KEYS.filter(k => !FRESH_KEEP_KEYS.includes(k)).forEach(k => localStorage.removeItem(k));
    customColors = {};
    setSiteTheme(theme);
    sessionStorage.setItem('romelOpenSuggest', '1');
    return reloadWith(`"${name}" created from a fresh default page — review the suggestions, then click Save Niche.`);
  }
  setSiteTheme(theme);
  draftSiteTheme = siteTheme;
  renderNichePanel();
  toast(`"${name}" created as a copy of your current setup — adjust anything, then click Save Niche.`);
}
$('#createNiche').addEventListener('click', askNicheStart);
$('#newNicheName').addEventListener('keydown', e => { if (e.key === 'Enter') askNicheStart(); });
$$('[data-niche-start]').forEach(btn => btn.addEventListener('click', () => {
  closeModal($('#nicheStartModal'));
  createNiche(btn.dataset.nicheStart);
}));

$('#nicheList').addEventListener('click', async e => {
  const btn = e.target.closest('button');
  if (!btn) return;
  if (btn.dataset.nicheTheme) {
    themeRowOpen = themeRowOpen === btn.dataset.nicheTheme ? null : btn.dataset.nicheTheme;
    return renderNichePanel();
  }
  if (btn.dataset.setNicheTheme) return setNicheTheme(btn.dataset.slug, btn.dataset.setNicheTheme);
  if (btn.dataset.nicheOpen) {
    const slug = btn.dataset.nicheOpen;
    if (!(await resolveUnsaved())) return;
    if (hasUnsavedChanges() && !confirm('The niche you have open has unsaved changes. Open another niche without saving them?')) return;
    if (pendingNiche && pendingNiche.slug === slug) return;
    localStorage.removeItem('romelPendingNiche');
    localStorage.removeItem('romelActiveNiche');
    sessionStorage.setItem('romelOpenNiches', '1');
    sessionStorage.setItem('romelNicheToast', `Opened "${nicheData.niches[slug].name}".`);
    location.href = `${location.pathname}?niche=${encodeURIComponent(slug)}`;
  } else if (btn.dataset.nicheLink) {
    const link = nicheLink(btn.dataset.nicheLink);
    try { await navigator.clipboard.writeText(link); toast('Client link copied: ' + link); }
    catch (err) { prompt('Copy this client link:', link); }
  } else if (btn.dataset.nicheDefault) {
    nicheData.default = btn.dataset.nicheDefault;
    if (await publishNiches()) toast(`"${nicheData.niches[nicheData.default].name}" is now the default for the plain link.`);
    renderNichePanel();
  } else if (btn.dataset.nicheDelete) {
    const slug = btn.dataset.nicheDelete;
    if (pendingNiche && pendingNiche.slug === slug) {
      if (!confirm(`Discard the unsaved niche "${pendingNiche.name}"? The page keeps its current look.`)) return;
      localStorage.removeItem('romelPendingNiche');
      localStorage.removeItem('romelActiveNiche');
      pendingNiche = null;
      renderNichePanel();
      return toast('Unsaved niche discarded.');
    }
    const name = nicheData.niches[slug].name;
    if (!confirm(`Delete the niche "${name}"? Its saved setup and client link will stop working.`)) return;
    delete nicheData.niches[slug];
    if (nicheData.default === slug) nicheData.default = Object.keys(nicheData.niches)[0] || null;
    if (activeNiche() === slug) { localStorage.removeItem('romelActiveNiche'); localStorage.removeItem('romelNicheVersion'); }
    if (await publishNiches()) toast(`Niche "${name}" deleted.`);
    renderNichePanel();
  }
});

/* --- Suggestions: match the niche name + keywords against every section, card, tool and service --- */
const NICHE_VOCAB = {
  ghl: 'ghl gohighlevel highlevel crm pipeline pipelines workflow workflows automation automations a2p 10dlc sms calendar calendars booking funnel funnels webhook webhooks zapier n8n make lead leads agency snapshot whitelabel receptionist voice integration integrations api',
  automation: 'automation automations automate workflow workflows zapier n8n make.com integration integrations api webhook webhooks crm sync pipeline ai agent agents',
  vibe: 'ai claude code coding developer development javascript react node github api agent agents prompt app apps build web codex vscode html5 css3 tailwind vercel',
  claude: 'ai claude code coding developer javascript react node github api agent agents prompt app apps codex html5 css3 vscode',
  coding: 'code coding developer development javascript react node github api app apps web html css html5 css3 tailwind vercel vscode',
  developer: 'code coding developer development javascript react node github api app apps web html css html5 css3 tailwind vercel vscode',
  ai: 'ai agent agents claude gemini openai chatbot assistant automation receptionist voice prompt',
  web: 'web website websites design ui ux figma landing funnel funnels wordpress webflow css html responsive brand react',
  design: 'design ui ux figma brand identity visual illustrator photoshop canva logo',
  marketing: 'marketing funnel funnels landing ads campaign email sms crm lead leads social',
  crm: 'crm pipeline pipelines lead leads contact contacts gohighlevel ghl hubspot salesforce automation',
  funnel: 'funnel funnels landing website websites page pages conversion ghl'
};
const STOP_WORDS = new Set(['and', 'the', 'for', 'with', 'of', 'to', 'a', 'an', 'in', 'on', 'my', 'niche']);
function nicheTerms(name, keywords) {
  const words = `${name} ${keywords}`.toLowerCase().split(/[^a-z0-9.+#-]+/).filter(w => w.length > 1 && !STOP_WORDS.has(w));
  const terms = new Set(words);
  words.forEach(w => Object.entries(NICHE_VOCAB).forEach(([key, list]) => {
    if (w === key || (w.length >= 3 && (w.startsWith(key) || key.startsWith(w)))) list.split(' ').forEach(t => terms.add(t));
  }));
  return [...terms];
}
const isRelevant = (text, terms) => {
  const t = ` ${text.toLowerCase().replace(/[^a-z0-9.+#-]+/g, ' ')} `;
  return terms.some(term => t.includes(` ${term} `) || (term.length > 3 && t.includes(term)));
};
const SUGGEST_SECTIONS = ['services', 'agents', 'calendars', 'workflows', 'integrations', 'funnels', 'approvals'];
// Suggestions always start from everything available (defaults + anything added), so items another
// niche removed can come back when they fit this one
const uniqueBy = (list, key) => list.filter((item, i) => list.findIndex(o => key(o) === key(item)) === i);
const allTools = () => uniqueBy([...tools, ...DEFAULT_TOOLS], t => t.name.trim().toLowerCase());
const allServices = () => uniqueBy([...services, ...DEFAULT_SERVICES], s => s.title.trim().toLowerCase());

function openSuggestions() {
  const info = currentNicheInfo();
  if (!info) return;
  const terms = nicheTerms(info.name, info.keywords);
  const groups = [];
  const sections = SUGGEST_SECTIONS.map(id => ({ id, label: sectionLabel(id).trim(), hide: !isRelevant($(`#${id}`).textContent, terms) }));
  groups.push(['Sections', 'section', sections]);
  // Cards only for sections that stay; Resume & Bio and Contact cards are always kept
  const keptSections = new Set(sections.filter(s => !s.hide).map(s => s.id));
  const cards = CARD_ZONES.filter(z => keptSections.has(z.section)).flatMap(z => resolvedOrder()[z.key].map(id => {
    const el = $(`[data-card-id="${id}"]`);
    return el ? { id, label: `${sectionLabel(z.section).trim()} › ${cardState.custom[id] ? cardState.custom[id].title : cardName(el)}`, hide: !isRelevant(el.textContent, terms) } : null;
  })).filter(Boolean);
  groups.push(['Cards', 'card', cards]);
  groups.push(['Tools & Technologies', 'tool', allTools().map((t, i) => ({ id: String(i), label: t.name, hide: !isRelevant(`${t.name} ${(ICON_LIBRARY.find(([c]) => c === t.icon) || [])[1] || ''}`, terms) }))]);
  if (keptSections.has('services')) groups.push(['Service cards', 'service', allServices().map((s, i) => ({ id: String(i), label: s.title, hide: !isRelevant(`${s.title} ${s.desc}`, terms) }))]);

  const all = groups.flatMap(g => g[2]);
  $('#suggestTitle').textContent = `Suggestions for "${info.name}"`;
  $('#suggestList').innerHTML = (all.every(i => i.hide) ? '<p class="field-hint warn">No matches found for this niche — everything is suggested to hide. Add keywords that appear on your page (e.g. "crm, workflows") and try again.</p>' : '')
    + groups.map(([title, kind, items]) => items.length ? `<span class="side-label">${title.toUpperCase()} · ${items.filter(i => i.hide).length} to hide</span>`
      + items.map(i => `<label class="suggest-row"><input type="checkbox" data-kind="${kind}" data-id="${escapeHtml(i.id)}"${i.hide ? ' checked' : ''}><span>${escapeHtml(i.label)}</span></label>`).join('') : '').join('');
  $('#suggestBox').hidden = false;
  $('#suggestBox').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}
$('#suggestAgain').addEventListener('click', openSuggestions);
$('#closeSuggest').addEventListener('click', () => $('#suggestBox').hidden = true);
$('#applySuggest').addEventListener('click', async () => {
  if (!(await resolveUnsaved())) return; // applying reloads the page, so settle category drafts first
  const pick = kind => $$(`#suggestList input[data-kind="${kind}"]`);
  const checked = kind => pick(kind).filter(i => i.checked).map(i => i.dataset.id);
  // Listed items follow the checkboxes (checked = hidden, unchecked = shown); anything else stays as it was
  const listedSections = pick('section').map(i => i.dataset.id);
  const newHiddenSections = [...hiddenSections.filter(id => !listedSections.includes(id)), ...checked('section')];
  const listedCards = pick('card').map(i => i.dataset.id);
  cardState.hidden = [...cardState.hidden.filter(id => !listedCards.includes(id)), ...checked('card')];
  const dropTools = new Set(checked('tool').map(Number)), dropServices = new Set(checked('service').map(Number));
  localStorage.setItem('romelHiddenSections', JSON.stringify(newHiddenSections));
  localStorage.setItem('romelCards', JSON.stringify(cardState));
  localStorage.setItem('romelTools', JSON.stringify(allTools().filter((_, i) => !dropTools.has(i))));
  if (pick('service').length) localStorage.setItem('romelServices', JSON.stringify(allServices().filter((_, i) => !dropServices.has(i))));
  reloadWith('Suggestions applied. Review the page, fine-tune anything, then click Save Niche to finalize.');
});

renderNichePanel();
setInterval(() => { if (role === 'admin' && !sidebar.hidden) updateNicheStatus(); }, 1500);
// Messages / open panel carried across a reload
if (sessionStorage.getItem('romelOpenNiches') && role === 'admin') {
  sessionStorage.removeItem('romelOpenNiches');
  if ($('#nicheEditor').hidden) $('[data-admin-action="niches"]').click();
}
if (sessionStorage.getItem('romelOpenSuggest') && role === 'admin') {
  sessionStorage.removeItem('romelOpenSuggest');
  openSuggestions();
}
const carriedToast = sessionStorage.getItem('romelNicheToast');
if (carriedToast) { sessionStorage.removeItem('romelNicheToast'); setTimeout(() => toast(carriedToast), 900); }

/* ==========================================================================
   REGISTER SAVE CATEGORIES — each gets a "Save changes / Discard" bar that
   appears only while it has unsaved changes, plus an orange dot in the sidebar.
   ========================================================================== */
function registerCategory(key, { label, mount, after, nav, isDirty, save, discard }) {
  let bar = null;
  if (mount || after) {
    bar = document.createElement('div');
    bar.className = 'save-bar';
    bar.hidden = true;
    bar.innerHTML = '<span class="save-note"><i class="dot"></i>Unsaved changes</span><div class="save-actions">'
      + '<button type="button" class="btn btn-outline btn-sm" data-discard><span>Discard</span></button>'
      + '<button type="button" class="btn btn-primary btn-sm" data-save><i class="fa-solid fa-floppy-disk"></i><span>Save changes</span></button></div>';
    if (after) $(after).after(bar); else $(mount).appendChild(bar);
    $('[data-save]', bar).addEventListener('click', () => {
      if (save() === false) return;
      markDirty();
      toast(`${label} saved. Click Save Niche to publish it to clients.`);
    });
    $('[data-discard]', bar).addEventListener('click', () => {
      discard();
      markDirty();
      toast(`${label}: changes discarded.`);
    });
  }
  CATEGORIES[key] = { label, isDirty, save, discard, bar, nav: nav ? $(nav) : null };
}
registerCategory('text', { label: 'Edit Text', after: '#toggleEdit', nav: '#toggleEdit', isDirty: textDirty, save: commitText, discard: discardText });
registerCategory('sections', { label: 'Sections', mount: '#sectionsPanel', nav: '#openSections', isDirty: sectionsDirty, save: commitSections, discard: discardSections });
registerCategory('content', { label: 'Content', mount: '#cmsPanel', nav: '#openContent', isDirty: contentDirty, save: commitContent, discard: fillContentInputs });
registerCategory('niches', { label: 'Niches', isDirty: () => false, save() {}, discard() {} }); // has its own Save Niche
registerCategory('colors', { label: 'Site Theme & Colors', mount: '#colorEditor', nav: '[data-admin-action="colors"]', isDirty: colorsDirty, save: commitColors, discard: discardColors });
registerCategory('logo', { label: 'Logo & Brand', mount: '#logoEditor', nav: '[data-admin-action="logo"]', isDirty: brandDirty, save: commitBrand, discard: discardBrand });
registerCategory('hero', { label: 'Hero', mount: '#heroEditor', nav: '[data-admin-action="hero"]', isDirty: heroDirty, save: commitHero, discard: discardHero });
registerCategory('resume', { label: 'My Resume', mount: '#resumeEditor', nav: '[data-admin-action="resume"]', isDirty: resumeDirty, save: commitResume, discard: discardResume });
registerCategory('tools', { label: 'Tools & Technologies', mount: '#toolsEditor', nav: '[data-admin-action="tools"]', isDirty: () => !sameJSON(tools, toolsSaved), save: commitTools, discard: discardTools });
registerCategory('focus', { label: 'Current Focus', mount: '#focusEditor', nav: '[data-admin-action="focus"]', isDirty: () => !sameJSON(focusCard, focusSaved), save: commitFocus, discard: discardFocus });
registerCategory('services', { label: 'Services', mount: '#servicesEditor', nav: '[data-admin-action="services"]', isDirty: () => !sameJSON(services, servicesSaved), save: commitServices, discard: discardServices });
registerCategory('cards', { label: 'Page Cards', mount: '#cardsEditor', nav: '[data-admin-action="cards"]', isDirty: cardsDirty, save: commitCards, discard: discardCards });
registerCategory('image', { label: 'this image', isDirty: imageDirty, save: commitImage, discard: discardImage }); // its pop-up has its own Save
markDirty();

/* --- Admin double-click: jump straight to the settings for whatever was double-clicked --- */
// Scrolls a settings field into view, flashes it, and puts the cursor in it when it's a text box
function spotlight(el, focusEl = el) {
  if (!el) return;
  el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  el.classList.remove('dbl-target');
  void el.offsetWidth; // restart the flash when the same field is picked twice
  el.classList.add('dbl-target');
  setTimeout(() => el.classList.remove('dbl-target'), 1800);
  if (focusEl && focusEl.matches('input, textarea, select')) focusEl.focus({ preventScroll: true });
}
const rowOf = field => field && (field.closest('.tool-row, .svc-item, .card-row') || field);
// Position among the visible items -> index in the saved list (hidden / blank items are skipped on the page)
const savedIndex = (list, keep, visibleIndex) => list.map((x, i) => keep(x) ? i : -1).filter(i => i > -1)[visibleIndex];
async function openSettingsFor(t) {
  const within = sel => t.closest(sel);
  const open = action => openSidebarSection(action);
  const indexIn = (el, parent) => [...parent.children].indexOf(el);

  const image = MANAGED_IMAGES.find(m => m.el.contains(t));
  if (image) return $(`[data-img-edit="${image.id}"]`).click();

  // An added section (or its menu tab) opens its editor in the Sections panel
  const customTab = within('.portfolio-tabs a[data-custom]');
  const customSec = customTab ? document.getElementById(customTab.getAttribute('href').slice(1)) : within('.custom-section');
  if (customSec && SIDEBAR_SECTIONS[customSec.id]) {
    if (!(await open(customSec.id))) return;
    const field = $(`#${customSec.id}Editor [data-cs-field="title"]`);
    return spotlight(field.closest('.sec-field'), field);
  }

  if (within('.brand, .site-footer .brand-mark, [data-brand], .loader-core')) {
    if (!(await open('logo'))) return;
    const field = within('[data-brand="tagline"]') ? $('#brandTaglineInput') : $('#brandNameInput');
    return spotlight(field.closest('.text-field'), field);
  }
  if (within('[data-content="name"], [data-content="role"], .portfolio-tabs')) {
    if (!(await openContentPanel())) return;
    const field = within('.portfolio-tabs') ? $('#editTabs') : $(CONTENT_FIELDS[within('[data-content]').dataset.content]);
    return spotlight(field, field);
  }
  if (within('#hero')) {
    const stat = within('#hero .stat'), btn = within('#hero .hero-actions .btn');
    if (!(await open('hero'))) return;
    if (within('#heroVideoBtn')) return spotlight($('#heroVideoText').closest('.hero-group'), $('#heroVideoLink'));
    if (within('#hero .pill-badge')) return spotlight(rowOf($('#heroBadgeInput')), $('#heroBadgeInput'));
    if (within('#heroHeadline')) return spotlight($('#heroHeadlineInput'));
    if (within('#heroDescription')) return spotlight($('#heroDescInput'));
    if (stat) {
      const i = savedIndex(heroSaved.stats, s => s.show && (s.value.trim() || s.label.trim()), indexIn(stat, stat.parentElement));
      const field = $(`[data-stat-field="value"][data-i="${i}"]`);
      return field ? spotlight(rowOf(field), field) : spotlight($('#heroStats'));
    }
    if (btn) {
      const i = savedIndex(heroSaved.buttons, b => b.show && b.text.trim(), indexIn(btn, btn.parentElement));
      const field = $(`[data-btn-field="text"][data-i="${i}"]`);
      return field ? spotlight(rowOf(field), field) : spotlight($('#heroButtons'));
    }
    if (within('#hero .hero-visual')) return spotlight($('#heroPhotoThumb').closest('.hero-group'));
    return spotlight($('#heroHeadlineInput'));
  }
  // Inside the Tools / Current Focus cards, anything but their editable titles opens their own editor
  const outsideText = sel => $(sel).closest('.card').contains(t) && !within('[data-edit-key]');
  if (within('.tech-chip') || outsideText('#marqueeTrack')) {
    if (!(await open('tools'))) return;
    const chip = within('.tech-chip');
    const i = chip ? tools.findIndex(x => x.name.trim() === $('span', chip).textContent.trim()) : -1;
    const field = $(`[data-tool-name="${i}"]`);
    return field ? spotlight(rowOf(field), field) : spotlight($('#toolList'));
  }
  if (within('#focusList, #focusIcon') || outsideText('#focusList')) {
    const li = within('#focusList li');
    if (!(await open('focus'))) return;
    if (!li) return spotlight(within('#focusIcon') ? $('#focusIconBtn').closest('.focus-icon-row') : $('#focusBullets'));
    const i = savedIndex(focusSaved.bullets, b => b.trim(), indexIn(li, li.parentElement));
    const field = $(`[data-bullet="${i}"]`);
    return field ? spotlight(rowOf(field), field) : spotlight($('#focusBullets'));
  }
  const service = within('#servicesGrid .service');
  if (service) {
    if (!(await open('services'))) return;
    const field = $(`[data-svc-field="title"][data-i="${service.dataset.svcI}"]`);
    return field ? spotlight(rowOf(field), field) : spotlight($('#svcList'));
  }
  // Ordinary text: switch on Edit Text and put the cursor in it
  const text = within('[data-edit-key]');
  if (text) {
    if (!document.body.classList.contains('editing')) setEditing(true);
    text.focus();
    const range = document.createRange();
    range.selectNodeContents(text);
    range.collapse(false);
    getSelection().removeAllRanges();
    getSelection().addRange(range);
    return;
  }
  // A card (custom cards open their own editor too)
  const card = within('[data-card-id]');
  if (card && CARD_ZONES.some(z => z.el.contains(card))) {
    const id = card.dataset.cardId, zone = CARD_ZONES.find(z => z.el === card.parentElement) || CARD_ZONES.find(z => z.el.contains(card));
    if (!(await open('cards'))) return;
    hideIconPicker();
    $('#cardSection').value = zone.section;
    editingCardId = cardDraft.custom[id] ? id : null;
    renderCardManager();
    return spotlight(rowOf($(`[data-card-toggle="${id}"]`)));
  }
  // Anywhere else in a section: its show / hide switch
  const section = within('main section[id]');
  if (section && section.id !== 'hero') {
    if (!(await openSectionsPanel())) return;
    const toggle = $(`[data-section="${section.id}"]`);
    return toggle && spotlight(toggle.closest('.toggle-row'));
  }
}
document.addEventListener('dblclick', e => {
  if (role !== 'admin' || e.target.isContentEditable) return; // while editing, double-click still selects words
  if (e.target.closest('#adminSidebar, .modal, #cmsPanel, #sectionsPanel, #accountMenu, input, textarea, select')) return;
  e.preventDefault();
  getSelection().removeAllRanges();
  openSettingsFor(e.target);
});

// Leaving / reloading the page with unsaved category changes asks the browser's "Leave site?" question
window.addEventListener('beforeunload', e => {
  if (role === 'admin' && anyDirty()) { e.preventDefault(); e.returnValue = ''; }
});
