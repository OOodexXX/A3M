// ============================================================
// pricing/rules.js  –  A3M Print  –  قواعد الخصم والجملة
// ============================================================

import { DISCOUNT_CODES, BULK_THRESHOLD, BULK_RATE } from "../utils/constants.js";

/**
 * تحقق من كود الخصم وارجع النسبة
 * @param {string} code
 * @returns {{ pct: number }|null}
 */
export function validateDiscountCode(code) {
  if (!code) return null;
  return DISCOUNT_CODES[code.trim().toUpperCase()] || null;
}

/**
 * احسب خصم الجملة
 * @param {number} subtotal
 * @returns {number} مبلغ الخصم (0 إذا ما وصلش للحد)
 */
export function calcBulkDiscount(subtotal) {
  return subtotal >= BULK_THRESHOLD ? subtotal * BULK_RATE : 0;
}

export { DISCOUNT_CODES, BULK_THRESHOLD, BULK_RATE };
