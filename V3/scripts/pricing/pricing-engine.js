// ============================================================
// pricing/pricing-engine.js  –  A3M Print  –  حساب المجموع النهائي
// ============================================================

import { calcBulkDiscount, validateDiscountCode } from "./rules.js";
import { fmtPrice } from "./calculator.js";
import { CART_KEY } from "../utils/constants.js";

/**
 * احسب كل مراحل السعر من السلة
 * @param {Array}  cart
 * @param {string} discountCode
 * @returns {{
 *   subtotal: number,
 *   bulkDiscount: number,
 *   afterBulk: number,
 *   codeDiscount: number,
 *   finalTotal: number,
 *   discountRule: object|null
 * }}
 */
export function calcOrderTotal(cart, discountCode = '') {
  const subtotal     = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const bulkDiscount = calcBulkDiscount(subtotal);
  const afterBulk    = subtotal - bulkDiscount;

  const discountRule  = validateDiscountCode(discountCode);
  const codeDiscount  = discountRule
    ? Math.round(afterBulk * discountRule.pct / 100)
    : 0;
  const finalTotal    = afterBulk - codeDiscount;

  return { subtotal, bulkDiscount, afterBulk, codeDiscount, finalTotal, discountRule };
}

/**
 * رسم ملخص الطلب في صفحة checkout
 */
export function renderCheckoutSummary() {
  const cart      = JSON.parse(localStorage.getItem(CART_KEY)) || [];
  const container = document.getElementById('checkoutItems');
  if (!container) return;

  if (!cart.length) {
    container.innerHTML = "<p style='color:var(--txt3)'>السلة فارغة</p>";
    return;
  }

  const { subtotal, bulkDiscount, finalTotal } = calcOrderTotal(cart);

  container.innerHTML = cart.map(i => `
    <div class="checkout-item">
      <span>${i.emoji || ''} ${i.name} × ${i.qty}</span>
      <span>${(i.price * i.qty).toLocaleString()} دج</span>
    </div>`).join('') + `
    <div class="checkout-totals">
      ${bulkDiscount > 0 ? `
        <div>
          <span>خصم الجملة (20%)</span>
          <span style="color:#16a34a">- ${bulkDiscount.toLocaleString()} دج</span>
        </div>` : ''}
      <div class="checkout-final">
        <span><strong>المجموع</strong></span>
        <span><strong>${finalTotal.toLocaleString()} دج</strong></span>
      </div>
    </div>`;
}

// ── Expose to window ──
window.calcOrderTotal        = calcOrderTotal;
window.renderCheckoutSummary = renderCheckoutSummary;

export { fmtPrice };
