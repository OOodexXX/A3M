// ============================================================
// core/app.js  –  A3M Print  –  ثيم، لغة، سايدبار، مودالات
// ============================================================

import { THEMES, DEFAULT_THEME } from "../utils/constants.js";
import { showToast, safe, safeHTML } from "../utils/helpers.js";

let isDark      = true;
let currentLang = "en";

// ════════════════════════════════════════════════════════════
// THEME
// ════════════════════════════════════════════════════════════

function applyTheme(theme) {
  THEMES.forEach(t => document.body.classList.remove(t));
  document.body.classList.add(theme);
  localStorage.setItem("a3m_theme", theme);
}

function loadTheme() {
  applyTheme(localStorage.getItem("a3m_theme") || DEFAULT_THEME);
}

function setTheme(theme) {
  if (THEMES.includes(theme)) applyTheme(theme);
}

function toggleTheme() {
  isDark = !isDark;
  document.body.classList.toggle('dark',  isDark);
  document.body.classList.toggle('light', !isDark);
  const themeIcon  = document.getElementById('themeIcon');
  const themeLabel = document.getElementById('themeLabel');
  if (themeIcon)  themeIcon.textContent = isDark ? '🌙' : '☀️';
  if (themeLabel && window.T?.[currentLang]) {
    themeLabel.textContent = isDark
      ? window.T[currentLang].thDark
      : window.T[currentLang].thLight;
  }
}

// ════════════════════════════════════════════════════════════
// CURRENCY
// ════════════════════════════════════════════════════════════

function setCurrency(c) {
  window.currency = c;
  document.getElementById('btnDZD')?.classList.toggle('active', c === 'DZD');
  document.getElementById('btnUSD')?.classList.toggle('active', c === 'USD');
  if (typeof renderProducts  === 'function') renderProducts(window.currentCat || 'all');
  if (typeof updateCart      === 'function') updateCart();
  if (window.currentModalProduct && typeof updateModalTotal === 'function') updateModalTotal();
}

// ════════════════════════════════════════════════════════════
// LANGUAGE
// ════════════════════════════════════════════════════════════

function applyLang(lang) {
  currentLang = lang;
  window.currentLang = lang;
  localStorage.setItem("a3m_lang", lang);
  const t = window.T?.[lang];
  if (!t) return;

  document.body.setAttribute('dir', t.dir);
  document.body.style.fontFamily = lang === 'ar' ? "'Cairo',sans-serif" : "'Inter',sans-serif";

  // ── Nav ──
  const langBtn = document.getElementById('langBtn');
  if (langBtn) langBtn.textContent = `${t.flag} ${t.code} ▾`;
  document.querySelectorAll('.lang-option').forEach((el, i) =>
    el.classList.toggle('active', ['en','fr','ar'][i] === lang));

  safe('n-home', t.home);       safe('n-products', t.products);
  safe('n-design', t.design);   safe('n-contact', t.contact);

  // ── Hero ──
  safe('heroEyebrow', t.eyebrow);   safe('heroSub', t.sub);
  safe('shopNowBtn', t.shopNow);    safe('startDesignBtn', t.startDesign);
  safe('startDesignBtn2', t.startDesign2);

  // ── Section ──
  safe('sectionSub', t.secSub);
  safeHTML('sectionTitle', t.secTitle);
  safe('designNowBtn', t.designNow);

  // ── Footer ──
  safe('footerTagline', t.footer);
  safe('footerLinksTitle',   t.footerLinksTitle   || (lang==='ar' ? 'روابط سريعة'  : lang==='fr' ? 'Liens rapides'    : 'Quick Links'));
  safe('footerContactTitle', t.footerContactTitle || (lang==='ar' ? 'تواصل معنا'  : lang==='fr' ? 'Nous contacter'   : 'Contact Us'));
  safe('footerCopy',         t.footerCopy         || (lang==='ar' ? '© 2024 A3M Print. جميع الحقوق محفوظة.' : '© 2024 A3M Print. All rights reserved.'));

  const footerLinkTexts = {
    ar: ['🛍️ المنتجات', '🎨 تصميم', '📋 طلب مخصص', '👤 حسابي'],
    en: ['🛍️ Products',  '🎨 Design', '📋 Custom Order', '👤 My Account'],
    fr: ['🛍️ Produits',  '🎨 Créer',  '📋 Commande',     '👤 Mon Compte'],
  };
  document.querySelectorAll('.footer-links a').forEach((a, i) => {
    if (footerLinkTexts[lang]?.[i]) a.textContent = footerLinkTexts[lang][i];
  });

  // ── Theme label ──
  const themeLabel = document.getElementById('themeLabel');
  if (themeLabel) themeLabel.textContent = isDark ? t.thDark : t.thLight;

  // ── Banner ──
  const bannerMain = document.getElementById('bannerMain');
  if (bannerMain) bannerMain.innerHTML = t.bannerMain + '<span id="bannerSub"> ' + t.bannerSub + '</span>';

  // ── Category buttons ──
  const catBtnMap = {
    'c-all':    t.cAll,
    'c-tshirt': t.cTshirt,
    'c-hoodie': t.cHoodie || '🧥 Hoodies',
    'c-hat':    t.cHat    || '🧢 Caps',
    'c-mug':    t.cMug    || '☕ Mugs',
    'c-bag':    t.cBag,
    'c-laser':  t.cLaser,
    'c-paper':  t.cPaper,
  };
  Object.entries(catBtnMap).forEach(([id, val]) => { if (val) safe(id, val); });

  // ── Order form labels ──
  ['fName','fPhone','fEmail','fProduct','fQty','fBudget','fPrintType','fCity','fNotes','submitBtn']
    .forEach(id => { const el = document.getElementById(id); if (el && t[id]) el.textContent = t[id]; });

  // ── Mode picker ──
  safe('modePickerSub',    t.modePickerSub);
  safe('modeTemplate',     t.modeTemplate);     safe('modeTemplateDesc', t.modeTemplateDesc);
  safe('modeScratch',      t.modeScratch);       safe('modeScratchDesc',  t.modeScratchDesc);

  // ── Sidebar ──
  safe('orderTitle', t.orderTitle);
  safe('sb-order',   t.sbOrder);
  safe('sb-disc',    t.sbDisc || 'Discounts');

  // ── Trust badges (checkout) ──
  const trustTexts = {
    ar: ['🔒 دفع آمن', '✅ جودة مضمونة', '🔄 استرداد سهل', '📞 دعم 24/7'],
    en: ['🔒 Secure Payment', '✅ Quality Guaranteed', '🔄 Easy Returns', '📞 24/7 Support'],
    fr: ['🔒 Paiement sécurisé', '✅ Qualité garantie', '🔄 Retours faciles', '📞 Support 24/7'],
  };
  document.querySelectorAll('.trust-badge').forEach((b, i) => {
    if (trustTexts[lang]?.[i]) b.textContent = trustTexts[lang][i];
  });

  // ── Account button ──
  const accBtn = document.getElementById('accountNavBtn');
  if (accBtn && !window.currentUser) {
    accBtn.innerHTML = lang==='ar' ? '👤 حساب' : lang==='fr' ? '👤 Compte' : '👤 Account';
  }

  // ── Cart title ──
  const cartTitle = document.getElementById('cartTitle');
  if (cartTitle && t.cartTitle) cartTitle.textContent = t.cartTitle;

  // ── Re-render dynamic content ──
  if (typeof updateCart      === 'function') updateCart();
  if (typeof renderProducts  === 'function') renderProducts(window.currentCat || 'all');
}

function setLang(lang) {
  currentLang = lang;
  window.currentLang = lang;
  localStorage.setItem("a3m_lang", lang);
  ['langDropdown','globeDd','langDrop'].forEach(id =>
    document.getElementById(id)?.classList.remove('open'));
  applyLang(lang);
}

function toggleLangMenu() {
  document.getElementById('langDropdown')?.classList.toggle('open');
}

// ════════════════════════════════════════════════════════════
// SIDEBAR
// ════════════════════════════════════════════════════════════

function openSidebar() {
  document.getElementById('sidebar')?.classList.add('open');
  document.getElementById('sidebarOverlay')?.classList.add('open');
}
function closeSidebar() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebarOverlay')?.classList.remove('open');
}
function toggleSB(el, subId) {
  el.classList.toggle('open');
  const sub = document.getElementById('sub-' + subId);
  if (sub) sub.style.display = el.classList.contains('open') ? 'block' : 'none';
}

// ════════════════════════════════════════════════════════════
// CATEGORY FILTER
// ════════════════════════════════════════════════════════════

function filterCat(cat, el) {
  window.currentCat = cat;
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  const paperSection = document.getElementById('paperSection');
  if (paperSection) paperSection.style.display = (cat === 'paper') ? 'block' : 'none';
  if (typeof renderProducts === 'function') renderProducts(cat);
}

function filterAndClose(cat) {
  closeSidebar();
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('c-' + cat) || document.getElementById('c-all');
  if (btn) btn.classList.add('active');
  window.currentCat = cat;
  if (typeof renderProducts === 'function') renderProducts(cat);
  document.querySelector('.section')?.scrollIntoView({ behavior: 'smooth' });
}

// ════════════════════════════════════════════════════════════
// MODE PICKER
// ════════════════════════════════════════════════════════════

function openModePicker()  { document.getElementById('modePicker')?.classList.add('open'); }
function closeModePicker() { document.getElementById('modePicker')?.classList.remove('open'); }

// ════════════════════════════════════════════════════════════
// ORDER FORM MODAL
// ════════════════════════════════════════════════════════════

function openOrderForm() {
  document.getElementById('formContent')?.style && (document.getElementById('formContent').style.display = 'block');
  document.getElementById('formSuccess')?.style  && (document.getElementById('formSuccess').style.display = 'none');
  document.getElementById('orderModal')?.classList.add('open');
  closeSidebar();
}
function closeOrderForm() {
  document.getElementById('orderModal')?.classList.remove('open');
}
function openOrderFromDesign() {
  if (typeof closeDesigner === 'function') closeDesigner();
  openOrderForm();
}

function submitOrder() {
  const v  = id => document.getElementById(id)?.value?.trim() || '';
  const name = v('inp-name'), phone = v('inp-phone'),
        product = v('inp-product'), qty = v('inp-qty');
  if (!name || !phone || !product || !qty) {
    showToast('⚠️ Please fill required fields'); return;
  }
  const fc = document.getElementById('formContent');
  const fs = document.getElementById('formSuccess');
  if (fc) fc.style.display = 'none';
  if (fs) fs.style.display = 'block';
  const t = window.T?.[currentLang];
  if (t) {
    safe('successTitle', t.successTitle);
    safe('successMsg',   t.successMsg);
  }
}

// ════════════════════════════════════════════════════════════
// PRINT INFO
// ════════════════════════════════════════════════════════════

function showPrint(type) {
  if (!window.PRINTS?.[type]) return;
  const lang = window.currentLang in window.PRINTS[type] ? window.currentLang : 'en';
  showToast(window.PRINTS[type][lang].substring(0, 60) + '...');
  setTimeout(() => alert(window.PRINTS[type][lang]), 100);
}

// ════════════════════════════════════════════════════════════
// NAVIGATION
// ════════════════════════════════════════════════════════════

function goToCheckout() {
  const inPages = window.location.pathname.includes('/pages/');
  window.location.href = inPages ? 'checkout.html' : 'pages/checkout.html';
}

// ════════════════════════════════════════════════════════════
// EXPOSE TO WINDOW
// ════════════════════════════════════════════════════════════

Object.assign(window, {
  applyTheme, loadTheme, setTheme, toggleTheme,
  setCurrency,
  applyLang, setLang, toggleLangMenu,
  filterCat, filterAndClose,
  openSidebar, closeSidebar, toggleSB,
  openModePicker, closeModePicker,
  openOrderForm, closeOrderForm, openOrderFromDesign, submitOrder,
  showPrint,
  goToCheckout,
  currentLang,
});

// ════════════════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════════════════

document.addEventListener("DOMContentLoaded", () => {
  loadTheme();
  const savedLang = localStorage.getItem("a3m_lang") || "ar";
  setTimeout(() => applyLang(savedLang), 50); // انتظر data.js يحمل window.T

  // Close lang dropdown on outside click
  document.addEventListener("click", e => {
    if (!e.target.closest(".lang-wrapper")) {
      document.getElementById("langDropdown")?.classList.remove("open");
    }
  });

  // Modal backdrop clicks
  document.getElementById("prodModal")    ?.addEventListener("click", e => { if (e.target === e.currentTarget && typeof closeProdModal  === 'function') closeProdModal(); });
  document.getElementById("accountModal") ?.addEventListener("click", e => { if (e.target === e.currentTarget && typeof closeAccount    === 'function') closeAccount(); });
  document.getElementById("orderModal")   ?.addEventListener("click", e => { if (e.target === e.currentTarget) closeOrderForm(); });
  document.getElementById("modePicker")   ?.addEventListener("click", e => { if (e.target === e.currentTarget) closeModePicker(); });
});

export { applyLang, setLang, applyTheme, loadTheme, showPrint, goToCheckout };
