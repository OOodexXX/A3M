// ============================================================
// pricing/pricing-engine.js  –  A3M Print
// حساب المجموع النهائي + ربط السعر بالتصميم
// ============================================================

import { calcBulkDiscount, validateDiscountCode, calcDesignPrice, extractDesignOpts } from './rules.js';
import { fmtPrice } from './calculator.js';
import { CART_KEY, DZD_PER_USD } from '../utils/constants.js';

// ─────────────────────────────────────────────
//  calcOrderTotal — كل مراحل السعر
// ─────────────────────────────────────────────
export function calcOrderTotal(cart, discountCode = '') {
  const subtotal     = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const bulkDiscount = calcBulkDiscount(subtotal);
  const afterBulk    = subtotal - bulkDiscount;
  const discountRule = validateDiscountCode(discountCode);
  const codeDiscount = discountRule ? Math.round(afterBulk * discountRule.pct / 100) : 0;
  const finalTotal   = afterBulk - codeDiscount;
  return { subtotal, bulkDiscount, afterBulk, codeDiscount, finalTotal, discountRule };
}

// ─────────────────────────────────────────────
//  ★ calcLiveDesignPrice — ربط السعر بالتصميم
// ─────────────────────────────────────────────
/**
 * احسب السعر الحي من التصميم المفتوح الآن في الديزاينر
 * @param {string} productType
 * @returns {{ base, complexity, total, breakdown, formatted }}
 */
export function calcLiveDesignPrice(productType = 'default') {
  const opts   = extractDesignOpts(productType);
  const result = calcDesignPrice(opts);
  result.formatted = fmtPrice(result.total);
  return result;
}

/**
 * حدّث عرض السعر في الديزاينر (يُستدعى كل ما يتغير التصميم)
 */
export function updateDesignerPriceDisplay(productType = 'default') {
  const r     = calcLiveDesignPrice(productType);
  const el    = document.getElementById('modalPrice') || document.getElementById('designerLivePrice');
  const brk   = document.getElementById('designerPriceBreakdown');

  if (el) {
    el.textContent = fmtPrice(r.total);
    el.title = `أساسي: ${r.base} دج + تعقيد: ${r.complexity} دج`;
  }

  if (brk) {
    const b = r.breakdown;
    const rows = [
      { label: '🏷️ السعر الأساسي',     val: r.base },
      b.colorAdd  ? { label: '🎨 الألوان',        val: b.colorAdd  } : null,
      b.areaAdd   ? { label: '📐 مساحة الطباعة', val: b.areaAdd   } : null,
      b.imageAdd  ? { label: '🖼️ صور/فوتو',      val: b.imageAdd  } : null,
      b.textAdd   ? { label: '🔤 نصوص',           val: b.textAdd   } : null,
      b.layerAdd  ? { label: '📚 طبقات إضافية',  val: b.layerAdd  } : null,
    ].filter(Boolean);

    brk.innerHTML = rows.map(row => `
      <div style="display:flex;justify-content:space-between;font-size:11.5px;padding:.2rem 0;color:var(--txt3);">
        <span>${row.label}</span>
        <span style="color:var(--gold);font-weight:700">+${row.val.toLocaleString()} دج</span>
      </div>`).join('') + `
      <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:800;padding:.5rem 0 0;border-top:1px solid var(--border);margin-top:.3rem;color:var(--txt);">
        <span>المجموع</span>
        <span style="color:var(--accent)">${fmtPrice(r.total)}</span>
      </div>`;
  }
  return r;
}

// ─────────────────────────────────────────────
//  renderCheckoutSummary — ملخص الطلب في checkout
// ─────────────────────────────────────────────
export function renderCheckoutSummary(discountCode = '') {
  const cart      = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  const container = document.getElementById('checkoutItems');
  if (!container) return;

  if (!cart.length) {
    container.innerHTML = `
      <div style="text-align:center;padding:2rem;color:var(--txt3);">
        <div style="font-size:2.5rem;margin-bottom:.5rem">🛒</div>
        <div style="font-weight:700">السلة فارغة</div>
        <a href="../index.html" style="color:var(--accent);font-size:13px;display:block;margin-top:.5rem">العودة للتسوق →</a>
      </div>`;
    return;
  }

  const cd = typeof window._checkoutDiscountLocal === 'function'
    ? window._checkoutDiscountLocal()
    : 0;
  const codeStr = cd > 0 ? ('PCT' + cd) : discountCode;

  const { subtotal, bulkDiscount, codeDiscount, finalTotal, discountRule } = calcOrderTotal(cart, codeStr);

  container.innerHTML = cart.map(i => `
    <div class="checkout-item">
      <span class="checkout-item-emoji">${i.emoji || '🛍️'}</span>
      <div style="flex:1;min-width:0">
        <div class="checkout-item-name">${i.name}</div>
        ${i.designComplexity ? `<div style="font-size:10px;color:var(--txt4)">تعقيد التصميم: ${i.designComplexity}</div>` : ''}
        <div class="checkout-item-qty">× ${i.qty}</div>
      </div>
      <span class="checkout-item-price">${(i.price * i.qty).toLocaleString()} دج</span>
    </div>`).join('') + `
    <div class="checkout-totals">
      <div style="display:flex;justify-content:space-between;font-size:13px;padding:.3rem 0;color:var(--txt2)">
        <span>المجموع الجزئي</span><span>${subtotal.toLocaleString()} دج</span>
      </div>
      ${bulkDiscount > 0 ? `
      <div style="display:flex;justify-content:space-between;font-size:13px;padding:.3rem 0;">
        <span style="color:#16a34a">🎉 خصم الجملة (20%)</span>
        <span style="color:#16a34a;font-weight:700">− ${bulkDiscount.toLocaleString()} دج</span>
      </div>` : ''}
      ${codeDiscount > 0 ? `
      <div style="display:flex;justify-content:space-between;font-size:13px;padding:.3rem 0;">
        <span style="color:#16a34a">🏷️ خصم الكود ${discountRule ? '(' + discountRule.pct + '%)' : ''}</span>
        <span style="color:#16a34a;font-weight:700">− ${codeDiscount.toLocaleString()} دج</span>
      </div>` : ''}
      <div class="checkout-final">
        <span>المجموع الكلي</span>
        <span>${finalTotal.toLocaleString()} دج</span>
      </div>
    </div>`;
}

// ─────────────────────────────────────────────
//  Auto-hook: تحديث السعر كل ما يتغير التصميم
// ─────────────────────────────────────────────
if (typeof window !== 'undefined') {
  window.calcOrderTotal          = calcOrderTotal;
  window.calcLiveDesignPrice     = calcLiveDesignPrice;
  window.updateDesignerPriceDisplay = updateDesignerPriceDisplay;
  window.renderCheckoutSummary   = renderCheckoutSummary;

  // Hook into designer canvas events
  document.addEventListener('a3m:canvas-change', () => {
    const pt = window._currentProductType || 'default';
    updateDesignerPriceDisplay(pt);
  });

  document.addEventListener('a3m:designer-open', (e) => {
    const pt = e?.detail?.productType || 'default';
    window._currentProductType = pt;
    setTimeout(() => updateDesignerPriceDisplay(pt), 300);
  });
}

export { fmtPrice };
