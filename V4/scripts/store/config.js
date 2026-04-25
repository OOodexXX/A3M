// ============================================================
// core/config.js  –  A3M Print  –  إعدادات التشغيل
// ============================================================
// هذا الملف يُهيّئ الـ globals الأساسية قبل أي ملف آخر
// ============================================================

import {
  CART_KEY, LS, DZD_PER_USD, BULK_THRESHOLD, BULK_RATE,
  DISCOUNT_CODES, XP_RANKS, XP_REWARDS, THEMES, DEFAULT_THEME,
  DEFAULT_LANG, SUPPORTED_LANGS, CURRENCY_RATES, CURRENCY_SYMBOLS,
} from "../utils/constants.js";

// ── Currency (default DZD) ──
window.currency    = window.currency    || "DZD";
window.currentCat  = window.currentCat  || "all";
window.currentLang = window.currentLang || localStorage.getItem("a3m_lang") || "ar";

// ── Re-export constants على window (للملفات غير الـ module) ──
window.CART_KEY        = CART_KEY;
window.LS              = LS;
window.DZD_PER_USD     = DZD_PER_USD;
window.BULK_THRESHOLD  = BULK_THRESHOLD;
window.BULK_RATE       = BULK_RATE;
window.DISCOUNT_CODES  = DISCOUNT_CODES;
window.XP_RANKS        = XP_RANKS;
window.XP_REWARDS      = XP_REWARDS;
window.THEMES          = THEMES;
window.DEFAULT_THEME   = DEFAULT_THEME;
window.DEFAULT_LANG    = DEFAULT_LANG;
window.SUPPORTED_LANGS = SUPPORTED_LANGS;
window.CURRENCY_RATES  = CURRENCY_RATES;
window.CURRENCY_SYMBOLS= CURRENCY_SYMBOLS;

export {};
