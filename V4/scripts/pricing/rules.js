// ============================================================
// pricing/rules.js  –  A3M Print  –  قواعد التسعير والخصومات
// ============================================================

import {
  DISCOUNT_CODES, BULK_THRESHOLD, BULK_RATE,
  BASE_PRICES, DESIGN_PRICING,
} from '../utils/constants.js';

// ─────────────────────────────────────────────
//  1. Discount codes
// ─────────────────────────────────────────────
export function validateDiscountCode(code) {
  if (!code) return null;
  return DISCOUNT_CODES[code.trim().toUpperCase()] || null;
}

// ─────────────────────────────────────────────
//  2. Bulk discount
// ─────────────────────────────────────────────
export function calcBulkDiscount(subtotal) {
  return subtotal >= BULK_THRESHOLD ? Math.round(subtotal * BULK_RATE) : 0;
}

// ─────────────────────────────────────────────
//  3. ★ Design-aware pricing ★
//
//  price = basePrice
//        + (colorComplexity * COLOR_RATE)
//        + (printAreaCm2   * AREA_RATE)
//        + (hasImages ? IMAGE_SURCHARGE : 0)
//        + (hasText   ? TEXT_SURCHARGE  : 0)
//        + (extraLayers * LAYER_RATE)
// ─────────────────────────────────────────────
export function calcDesignPrice(opts = {}) {
  const {
    productType  = 'default',
    colorCount   = 0,
    printAreaCm2 = 0,
    hasImages    = false,
    hasText      = false,
    layerCount   = 1,
  } = opts;

  const D    = DESIGN_PRICING;
  const base = BASE_PRICES[productType] ?? BASE_PRICES.default;

  const colorScore = Math.min(colorCount, 10) / 2;
  const colorAdd   = Math.round(colorScore    * D.COLOR_RATE);
  const areaAdd    = Math.round(printAreaCm2  * D.AREA_RATE);
  const imageAdd   = hasImages ? D.IMAGE_SURCHARGE : 0;
  const textAdd    = hasText   ? D.TEXT_SURCHARGE  : 0;
  const extraLay   = Math.max(0, layerCount - 2);
  const layerAdd   = Math.round(extraLay * D.LAYER_RATE);

  const rawComplexity = colorAdd + areaAdd + imageAdd + textAdd + layerAdd;
  const complexity    = Math.min(rawComplexity, D.MAX_COMPLEXITY);
  const total         = base + complexity;

  return { base, complexity, total, breakdown: { colorAdd, areaAdd, imageAdd, textAdd, layerAdd } };
}

/**
 * اقرأ بيانات window._A3MCanvas وحوّلها لـ opts
 */
export function extractDesignOpts(productType = 'default') {
  const canvas = window._A3MCanvas;
  if (!canvas) return { productType };

  const layers     = canvas.layers || [];
  const layerCount = layers.length;
  const hasImages  = layers.some(l => l.type === 'image' || l.type === 'photo');
  const hasText    = layers.some(l => l.type === 'text');

  const colorSet = new Set();
  layers.forEach(l => {
    if (l.color)       colorSet.add(l.color);
    if (l.fill)        colorSet.add(l.fill);
    if (l.strokeColor) colorSet.add(l.strokeColor);
  });
  const colorCount   = colorSet.size || 1;
  const printW       = canvas.printW || 300;
  const printH       = canvas.printH || 300;
  const printAreaCm2 = (printW / 10) * (printH / 10);

  return { productType, colorCount, printAreaCm2, hasImages, hasText, layerCount };
}

export { DISCOUNT_CODES, BULK_THRESHOLD, BULK_RATE, BASE_PRICES, DESIGN_PRICING };

if (typeof window !== 'undefined') {
  window.validateDiscountCode = validateDiscountCode;
  window.calcBulkDiscount     = calcBulkDiscount;
  window.calcDesignPrice      = calcDesignPrice;
  window.extractDesignOpts    = extractDesignOpts;
}
