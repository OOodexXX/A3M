// ============================================================
// utils/constants.js  –  A3M Print  –  ثوابت التطبيق
// Single source of truth for all magic values
// ============================================================

// ── Storage Keys ──
export const LS = {
  CART:       "a3m_cart",
  USER:       "a3m_user",
  USERS:      "a3m_users",
  LANG:       "a3m_lang",
  THEME:      "a3m_theme",
  SETTINGS:   "a3m_settings",
  DESIGNS:    "a3m_designs",
  ORDERS:     "a3m_orders",
  COMMUNITY:  "a3m_community_designs",
  XP:         "a3m_xp",
  AI_MODE:    "a3m_ai_mode",
  AI_KEY:     "a3m_ai_key",
  AI_PROXY:   "a3m_ai_proxy_url",
  AI_MODEL:   "a3m_ai_model",
};

// ── Currency ──
export const DZD_PER_USD = 254;

export const CURRENCY_RATES = {
  DZD: 1,
  USD: 0.0074,
  EUR: 0.0068,
  GBP: 0.0058,
};

export const CURRENCY_SYMBOLS = {
  DZD: "دج",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

// ── Pricing ──
export const BULK_THRESHOLD = 5000;   // DZD — orders above this get bulk discount
export const BULK_RATE      = 0.20;   // 20% bulk discount

export const DISCOUNT_CODES = {
  A3M10:   { pct: 10 },
  A3M20:   { pct: 20 },
  STUDENT: { pct: 15 },
  WELCOME: { pct: 25 },
  VIP50:   { pct: 50 },
};

// ── XP / Rank system ──
export const XP_RANKS = [
  { name: "🪨 Iron",    cls: "iron",    min: 0,    max: 100   },
  { name: "🥉 Bronze",  cls: "bronze",  min: 100,  max: 500   },
  { name: "🥇 Gold",    cls: "gold",    min: 500,  max: 1500  },
  { name: "💎 Diamond", cls: "diamond", min: 1500, max: 4000  },
  { name: "⭐ Premium", cls: "premium", min: 4000, max: 99999 },
];

export const XP_REWARDS = {
  PUBLISH_DESIGN: 20,
  PER_100_DZD:    1,   // XP earned per 100 DZD spent
};

// ── Themes ──
export const THEMES = [
  "blue-dark", "blue-light",
  "beige-dark", "beige-light",
  "purple-dark", "purple-light",
  "white-light", "white-dark",
];
export const DEFAULT_THEME = "blue-dark";
export const DEFAULT_LANG  = "ar";

// ── App ──
export const SUPPORTED_LANGS  = ["ar", "en", "fr"];
export const FIREBASE_PROJECT  = "a3mmedia-b4abb";

// ── Re-export to window for non-module scripts ──
Object.assign(window, {
  LS,
  DZD_PER_USD,
  CURRENCY_RATES,
  CURRENCY_SYMBOLS,
  BULK_THRESHOLD,
  BULK_RATE,
  DISCOUNT_CODES,
  XP_RANKS,
  XP_REWARDS,
  THEMES,
  DEFAULT_THEME,
  DEFAULT_LANG,
  SUPPORTED_LANGS,
});
