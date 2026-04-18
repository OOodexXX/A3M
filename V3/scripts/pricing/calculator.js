// ============================================================
// pricing/calculator.js  –  A3M Print  –  حسابات السلة والعملة
// ============================================================

import { DZD_PER_USD } from "../utils/constants.js";
import { calcBulkDiscount } from "./rules.js";

/**
 * تنسيق سعر حسب العملة المختارة
 * @param {number} dzd
 * @returns {string}
 */
export function fmtPrice(dzd) {
  return window.currency === 'USD'
    ? '$' + (dzd / DZD_PER_USD).toFixed(2)
    : dzd.toLocaleString() + ' دج';
}

/**
 * نسبة الخصم كـ string
 * @param {number} price
 * @param {number} oldPrice
 * @returns {string}
 */
export function disc(price, oldPrice) {
  return oldPrice ? Math.round((1 - price / oldPrice) * 100) + '%' : '';
}

/**
 * تحديث عرض المجموع في السلة مع الخصومات
 * @param {Array}  cart
 * @param {{ pct: number }|null} activeDiscount
 */
export function refreshCartTotal(cart, activeDiscount) {
  const el = document.getElementById('cartTotalVal');
  if (!el || !cart?.length) return;

  const raw   = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const final = activeDiscount
    ? Math.round(raw * (1 - activeDiscount.pct / 100))
    : raw;

  if (activeDiscount) {
    el.innerHTML = `
      <span style="text-decoration:line-through;font-size:.85rem;opacity:.55;margin-right:.3rem">
        ${fmtPrice(raw)}
      </span>
      <span style="color:var(--gold)">${fmtPrice(final)}</span>`;
  } else {
    el.textContent = fmtPrice(raw);
  }
}

// ── Expose to window ──
window.fmtPrice        = fmtPrice;
window.disc            = disc;
window.refreshCartTotal = (activeDiscount) => {
  // wrapper يقرأ window.cart تلقائياً
  refreshCartTotal(window.cart || [], activeDiscount);
};
