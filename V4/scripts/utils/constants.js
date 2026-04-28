// ============================================================
// utils/constants.js  –  A3M Print  –  ثوابت المشروع
// ============================================================

// ── LocalStorage keys ──
export const LS = {
  CART:      'a3m_cart',
  USER:      'a3m_user',
  USERS:     'a3m_users',
  SETTINGS:  'a3m_settings',
  DESIGNS:   'a3m_designs',
  ORDERS:    'a3m_orders',
  COMMUNITY: 'a3m_community',
  XP:        'a3m_xp',
  LANG:      'a3m_lang',
  THEME:     'a3m_theme',
};

// ── Defaults ──
export const DEFAULT_LANG = 'ar';
export const DEFAULT_THEME = 'light';

export const DZD_PER_USD     = 135;
export const CART_KEY        = 'a3m_cart';
export const BULK_THRESHOLD  = 5000;   // دج — حد خصم الجملة
export const BULK_RATE       = 0.20;   // 20%

export const DISCOUNT_CODES = {
  A3M10:   { pct: 10, label: 'خصم 10%'  },
  A3M20:   { pct: 20, label: 'خصم 20%'  },
  STUDENT: { pct: 15, label: 'خصم طلابي 15%' },
  WELCOME: { pct: 25, label: 'خصم ترحيبي 25%' },
  VIP50:   { pct: 50, label: 'VIP 50%'  },
  PROMO30: { pct: 30, label: 'عرض خاص 30%' },
};

// ── Base prices (DZD) per product type ──
export const BASE_PRICES = {
  tshirt:  1200,
  hoodie:  1800,
  hat:     900,
  mug:     700,
  bag:     1100,
  paper:   200,
  stamps:  1500,
  default: 800,
};

// ── Design complexity pricing constants ──
export const DESIGN_PRICING = {
  COLOR_RATE:       50,   // دج per color channel used (0–5 scale)
  AREA_RATE:        0.08, // دج per cm² of print area
  IMAGE_SURCHARGE:  150,  // دج flat fee if design contains images/photos
  TEXT_SURCHARGE:   50,   // دج flat fee if design contains styled text
  LAYER_RATE:       30,   // دج per layer above 2
  MAX_COMPLEXITY:   800,  // دج cap on complexity surcharge
};


// ── Currency rates and symbols ──
export const CURRENCY_RATES = {
  DZD: 1,
  USD: 1 / DZD_PER_USD,
  EUR: 1 / 145, // مثال: 1 EUR = 145 DZD
  GBP: 1 / 170, // مثال: 1 GBP = 170 DZD
};

export const CURRENCY_SYMBOLS = {
  DZD: 'دج',
  USD: '$',
  EUR: '€',
  GBP: '£',
};


// ── Themes, Languages, XP Ranks/Rewards ──
export const THEMES = ["light", "dark"];
export const SUPPORTED_LANGS = ["ar", "en", "fr"];
export const XP_RANKS = [
  { name: "مبتدئ", min: 0 },
  { name: "متوسط", min: 100 },
  { name: "خبير", min: 500 },
  { name: "أسطورة", min: 1000 }
];
export const XP_REWARDS = {
  order: 10,
  design: 5,
  share: 2
};

// Expose to window for non-module scripts
if (typeof window !== 'undefined') {
  window.A3M_CONSTANTS = {
    DZD_PER_USD, CART_KEY, BULK_THRESHOLD, BULK_RATE,
    DISCOUNT_CODES, BASE_PRICES, DESIGN_PRICING,
  };
}
