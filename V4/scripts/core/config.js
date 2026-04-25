// ============================================================
// core/config.js  –  A3M Print  –  إعدادات التشغيل + Lang API
// ============================================================
// ✅ FIX: أضفنا setLang و applyLang هنا لأن app.js يستوردهم منه
// ============================================================

import {
  CART_KEY, LS, DZD_PER_USD, BULK_THRESHOLD, BULK_RATE,
  DISCOUNT_CODES, XP_RANKS, XP_REWARDS, THEMES, DEFAULT_THEME,
  DEFAULT_LANG, SUPPORTED_LANGS, CURRENCY_RATES, CURRENCY_SYMBOLS,
} from "../utils/constants.js";

// ── Globals ──────────────────────────────────────────────────
window.currency    = window.currency    || "DZD";
window.currentCat  = window.currentCat  || "all";
window.currentLang = window.currentLang || localStorage.getItem(LS.LANG) || DEFAULT_LANG;

// ── Re-export constants على window ───────────────────────────
Object.assign(window, {
  CART_KEY, LS, DZD_PER_USD, BULK_THRESHOLD, BULK_RATE,
  DISCOUNT_CODES, XP_RANKS, XP_REWARDS, THEMES, DEFAULT_THEME,
  DEFAULT_LANG, SUPPORTED_LANGS, CURRENCY_RATES, CURRENCY_SYMBOLS,
});

// ── applyLang ─────────────────────────────────────────────────
// يطبّق اللغة على الـ DOM ويستدعي _applyFullLang من app.js

export function applyLang(lang) {
  const validLangs = SUPPORTED_LANGS || ["ar", "en", "fr"];
  if (!validLangs.includes(lang)) lang = DEFAULT_LANG || "ar";

  window.currentLang = lang;
  localStorage.setItem(LS.LANG, lang);

  // اتجاه الصفحة
  document.documentElement.lang = lang;
  document.documentElement.dir  = lang === "ar" ? "rtl" : "ltr";
  document.body.style.fontFamily = lang === "ar"
    ? "'Cairo', sans-serif"
    : "'Inter', sans-serif";

  // data-i18n attributes (A3M_I18N system)
  if (window.A3M_I18N?.[lang]) {
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (window.A3M_I18N[lang][key]) el.textContent = window.A3M_I18N[lang][key];
    });
  }

  // استدعاء الترجمة الكاملة من app.js
  if (typeof window._applyFullLang === "function") {
    window._applyFullLang(lang);
  }

  // استدعاء دوال الترجمة الأخرى لو موجودة
  if (typeof window.translateDesignerUI === "function") window.translateDesignerUI();
  if (typeof window.updateHeroTagline   === "function") window.updateHeroTagline(lang);
  if (typeof window.translateSidebar    === "function") window.translateSidebar(lang);

  // fire event للـ patches (مثل designer-publish-patch.js)
  document.dispatchEvent(new CustomEvent("a3m:lang", {
    detail: { lang, t: window.T?.[lang] || {} }
  }));
}

// ── setLang ───────────────────────────────────────────────────
// الدالة العامة المستخدمة من الـ HTML و app.js

export function setLang(lang) {
  // أغلق أي dropdown مفتوح
  ["langDropdown", "globeDd", "langDrop"].forEach(id => {
    document.getElementById(id)?.classList.remove("open");
  });
  applyLang(lang);
}

// ── setCurrency ───────────────────────────────────────────────
export function setCurrency(currency) {
  window.currency = currency;
  const btnDZD = document.getElementById("btnDZD");
  const btnUSD = document.getElementById("btnUSD");
  if (btnDZD) btnDZD.classList.toggle("active", currency === "DZD");
  if (btnUSD) btnUSD.classList.toggle("active", currency === "USD");
  window.renderProducts?.(window.currentCat || "all");
  window.updateCart?.();
}

// ── Window exports ────────────────────────────────────────────
Object.assign(window, { setLang, applyLang, setCurrency });

export {};
