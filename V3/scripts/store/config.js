// ============================================================
// core/config.js  –  A3M Print  –  إعدادات التطبيق العامة
// Settings manager: lang, theme, currency — persisted + cross-page
// يُحمَّل في كل الصفحات (بدل a3m-settings.js)
// ============================================================

import { LS, THEMES, DEFAULT_THEME, DEFAULT_LANG, SUPPORTED_LANGS, CURRENCY_RATES, CURRENCY_SYMBOLS } from "../utils/constants.js";
import { SettingsStore } from "../services/storage.js";

// ── Apply Theme ──────────────────────────────────────────────

export function applyTheme(theme) {
  // Remove all known theme classes, then add the new one
  THEMES.forEach(t => document.body.classList.remove(t));
  document.body.classList.add(theme);
  localStorage.setItem(LS.THEME, theme);

  // Sync nav icons / mode buttons if present
  const icon  = document.getElementById("themeIcon");
  const dark  = document.getElementById("modeDarkBtn");
  const light = document.getElementById("modeLightBtn");
  if (icon)  icon.textContent = theme.includes("dark") ? "🌙" : "☀️";
  if (dark)  dark.classList.toggle("active",  theme.includes("dark"));
  if (light) light.classList.toggle("active", theme.includes("light"));
}

export function loadTheme() {
  applyTheme(SettingsStore.load().theme);
}

export function setTheme(theme) {
  if (!THEMES.includes(theme)) return;
  const s = SettingsStore.load();
  s.theme = theme;
  SettingsStore.save(s);
  applyTheme(theme);
}

// ── Apply Language ───────────────────────────────────────────

export function applyLang(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) lang = DEFAULT_LANG;

  window.currentLang = lang;

  // dir + font
  document.documentElement.lang = lang;
  document.documentElement.dir  = lang === "ar" ? "rtl" : "ltr";
  document.body.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
  document.body.style.fontFamily = lang === "ar" ? "'Cairo',sans-serif" : "'Inter',sans-serif";

  // data-i18n attribute auto-translate (for pages that use it)
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    const t   = window.A3M_I18N?.[lang];
    if (t?.[key]) el.textContent = t[key];
  });

  // Fire global event — all modules listen to this
  document.dispatchEvent(new CustomEvent("a3m:lang", {
    detail: { lang, t: window.A3M_I18N?.[lang] || {} }
  }));

  // Call page-specific hooks if they exist
  if (typeof window.applyI18n           === "function") window.applyI18n(lang);
  if (typeof window.applyNavExtras      === "function") window.applyNavExtras(lang);
  if (typeof window.translateDesignerUI === "function") window.translateDesignerUI();
  if (typeof window.updateHeroTagline   === "function") window.updateHeroTagline(lang);
  if (typeof window.translateSidebar    === "function") window.translateSidebar(lang);

  // app.js full translation (nav, footer, products, cart...)
  if (typeof window._applyFullLang === "function") window._applyFullLang(lang);
}

export function setLang(lang) {
  const s = SettingsStore.load();
  s.lang = lang;
  SettingsStore.save(s);

  // Close any open language dropdowns
  ["langDropdown", "globeDd", "langDrop"].forEach(id => {
    document.getElementById(id)?.classList.remove("open");
  });

  applyLang(lang);
}

// ── Apply Currency ───────────────────────────────────────────

export function applyCurrency(currency) {
  window.currency = currency;

  const symbol = CURRENCY_SYMBOLS[currency] || currency;

  // Update [data-price-dzd] elements
  document.querySelectorAll("[data-price-dzd]").forEach(el => {
    const dzd       = parseFloat(el.getAttribute("data-price-dzd")) || 0;
    const rate      = CURRENCY_RATES[currency] || 1;
    const converted = (dzd * rate).toFixed(currency === "DZD" ? 0 : 2);
    el.textContent  = converted + " " + symbol;
  });

  // Sync currency toggle buttons
  document.getElementById("btnDZD")?.classList.toggle("active", currency === "DZD");
  document.getElementById("btnUSD")?.classList.toggle("active", currency === "USD");

  // Fire event
  document.dispatchEvent(new CustomEvent("a3m:currency", {
    detail: { currency, symbol, rate: CURRENCY_RATES[currency] || 1 }
  }));

  // Re-render anything that shows prices
  window.renderProducts?.(window.currentCat || "all");
  window.updateCart?.();
  if (window.currentModalProduct) window.updateModalTotal?.();
}

export function setCurrency(currency) {
  const s = SettingsStore.load();
  s.currency = currency;
  SettingsStore.save(s);
  applyCurrency(currency);
}

// ── Apply All ────────────────────────────────────────────────

export function applyAll() {
  const s = SettingsStore.load();
  applyTheme(s.theme);
  applyCurrency(s.currency);
  applyLang(s.lang);   // lang last — needs T[] to be populated
}

// ── Public API object (backward-compat with a3m-settings.js) ─

export const A3MSettings = {
  get:         SettingsStore.load,
  setLang,
  setTheme,
  setCurrency,
  applyAll,
  CURRENCY_RATES,
  CURRENCY_SYMBOLS,
};

// ── Auto-init ────────────────────────────────────────────────
// Apply theme immediately (before paint) to avoid flash
applyTheme(SettingsStore.load().theme);

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => setTimeout(applyAll, 100));
} else {
  setTimeout(applyAll, 100);
}

// ── Window exports ───────────────────────────────────────────
Object.assign(window, {
  A3MSettings,
  applyTheme,
  loadTheme,
  setTheme,
  applyLang,
  setLang,
  applyCurrency,
  setCurrency,
  applyAll,
});
