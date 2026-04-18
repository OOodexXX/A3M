// ============================================================
// core/config.js  –  A3M Print  –  إعدادات التشغيل
// ============================================================
// هذا الملف يُهيّئ الـ globals الأساسية قبل أي ملف آخر
// ============================================================

import {
  CART_KEY, DZD_PER_USD, BULK_THRESHOLD, BULK_RATE,
  DISCOUNT_CODES, XP_RANKS, THEMES, DEFAULT_THEME
} from "../utils/constants.js";

// ── Currency (default DZD) ──
window.currency    = window.currency    || "DZD";
window.currentCat  = window.currentCat  || "all";
window.currentLang = window.currentLang || localStorage.getItem("a3m_lang") || "ar";

// ── Re-export constants على window (للملفات غير الـ module) ──
window.CART_KEY       = CART_KEY;
window.DZD_PER_USD    = DZD_PER_USD;
window.BULK_THRESHOLD = BULK_THRESHOLD;
window.BULK_RATE      = BULK_RATE;
window.DISCOUNT_CODES = DISCOUNT_CODES;
window.XP_RANKS       = XP_RANKS;
window.THEMES         = THEMES;
window.DEFAULT_THEME  = DEFAULT_THEME;

export {};
