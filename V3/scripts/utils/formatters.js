// ============================================================
// utils/formatters.js  –  A3M Print  –  دوال التنسيق
// Price, discount, date helpers — no DOM, no side effects
// ============================================================

import { DZD_PER_USD, CURRENCY_SYMBOLS, CURRENCY_RATES } from "./constants.js";

// ── Price formatting ──

/**
 * Format a DZD amount into the current display currency.
 * Falls back to window.currency if not passed.
 * @param {number} dzd
 * @param {string} [currency]
 * @returns {string}
 */
export function fmtPrice(dzd, currency) {
  const cur = currency || window.currency || "DZD";
  if (cur === "USD") {
    return "$" + (dzd / DZD_PER_USD).toFixed(2);
  }
  if (cur === "DZD") {
    return dzd.toLocaleString() + " دج";
  }
  // Generic conversion for EUR / GBP
  const rate   = CURRENCY_RATES[cur] || 1;
  const symbol = CURRENCY_SYMBOLS[cur] || cur;
  return symbol + (dzd * rate).toFixed(2);
}

/**
 * Calculate discount percentage between sale price and original.
 * Returns empty string if no original price.
 * @param {number} price  – current price
 * @param {number} old    – original price
 * @returns {string}  e.g. "29%"
 */
export function discPct(price, old) {
  if (!old || old <= price) return "";
  return Math.round((1 - price / old) * 100) + "%";
}

// ── Date formatting ──

/**
 * Format a date for the current language.
 * @param {Date|string|number} date
 * @param {string} [lang]
 * @returns {string}
 */
export function fmtDate(date, lang) {
  const d   = date instanceof Date ? date : new Date(date);
  const loc = lang === "ar" ? "ar-DZ" : lang === "fr" ? "fr-FR" : "en-US";
  return d.toLocaleDateString(loc);
}

// ── Number helpers ──

/**
 * Safe toLocaleString — returns "0" on null/undefined.
 * @param {number} n
 * @returns {string}
 */
export function fmt(n) {
  return (n ?? 0).toLocaleString();
}

// ── Re-export to window for non-module scripts ──
Object.assign(window, { fmtPrice, discPct, fmtDate, fmt });
