// ============================================================
// services/storage.js  –  A3M Print  –  طبقة التخزين المحلي
// Single abstraction over localStorage — typed getters/setters
// ============================================================

import { LS, DEFAULT_LANG, DEFAULT_THEME } from "../utils/constants.js";

// ── Generic helpers ──

function _get(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function _set(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function _remove(key) {
  try { localStorage.removeItem(key); } catch {}
}

// ── Cart ──
export const CartStore = {
  load: ()        => _get(LS.CART, []),
  save: (cart)    => {
    // Strip non-serialisable properties (e.g. img objects) before saving
    const clean = cart.map(({ img, ...rest }) => rest);
    _set(LS.CART, clean);
  },
  clear: ()       => _remove(LS.CART),
};

// ── User / Auth ──
export const UserStore = {
  load:   ()     => _get(LS.USER, null),
  save:   (user) => _set(LS.USER, user),
  clear:  ()     => _remove(LS.USER),

  // Multi-user registry (localStorage fallback when Firebase is offline)
  loadAll:  ()           => _get(LS.USERS, {}),
  saveAll:  (users)      => _set(LS.USERS, users),
  saveOne:  (email, user) => {
    const all = _get(LS.USERS, {});
    all[email] = user;
    _set(LS.USERS, all);
  },
};

// ── Settings (lang + theme + currency) ──
export const SettingsStore = {
  load: () => {
    const saved = _get(LS.SETTINGS, null);
    return {
      lang:     saved?.lang     || localStorage.getItem(LS.LANG)  || DEFAULT_LANG,
      theme:    saved?.theme    || localStorage.getItem(LS.THEME) || DEFAULT_THEME,
      currency: saved?.currency || "DZD",
    };
  },
  save: (settings) => {
    _set(LS.SETTINGS, settings);
    // Keep back-compat single keys for older scripts
    localStorage.setItem(LS.LANG,  settings.lang);
    localStorage.setItem(LS.THEME, settings.theme);
  },
};

// ── Designs ──
export const DesignStore = {
  load:  ()         => _get(LS.DESIGNS, []),
  save:  (designs)  => _set(LS.DESIGNS, designs),
  push:  (design)   => {
    const all = _get(LS.DESIGNS, []);
    all.push(design);
    _set(LS.DESIGNS, all);
  },
};

// ── Orders ──
export const OrderStore = {
  load: ()      => _get(LS.ORDERS, []),
  push: (order) => {
    const all = _get(LS.ORDERS, []);
    all.push(order);
    _set(LS.ORDERS, all);
  },
};

// ── Community designs ──
export const CommunityStore = {
  load:    ()        => _get(LS.COMMUNITY, []),
  prepend: (design)  => {
    const all = _get(LS.COMMUNITY, []);
    all.unshift(design);
    _set(LS.COMMUNITY, all);
  },
};

// ── XP (standalone key used by ai.js patch) ──
export const XpStore = {
  load: ()    => parseInt(localStorage.getItem(LS.XP) || "0"),
  save: (xp)  => localStorage.setItem(LS.XP, String(xp)),
  add:  (n)   => {
    const current = XpStore.load();
    XpStore.save(current + n);
    return current + n;
  },
};

// ── Re-export to window ──
Object.assign(window, { CartStore, UserStore, SettingsStore, DesignStore, OrderStore, CommunityStore, XpStore });
