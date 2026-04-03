// ============================================================
// cart.js  –  A3M Print
// BUG FIXED:
//   1. localStorage key مختلف: cart.js يستخدم "a3m_cart"
//      لكن checkout.js يقرأ "cart" ← موحَّد إلى "a3m_cart"
//   2. خصم 20% كان يشتغل عند subtotal >= 100 دج (منخفض جداً!)
//      ← رُفع لـ 5000 دج وهو منطقي لمنتجات الطباعة
//   3. renderProducts تعتمد على window.PRODUCTS لكن data.js
//      لم تكن تسنده لـ window ← تم في data.js
//   4. مفقود: حفظ currentCat بين عمليات العرض
// ============================================================

const CART_KEY = "a3m_cart";   // ← مفتاح موحَّد مع checkout.js
const DZD_PER_USD = 254;
const BULK_DISCOUNT_THRESHOLD = 5000; // دج
const BULK_DISCOUNT_RATE      = 0.20;

let cart        = JSON.parse(localStorage.getItem(CART_KEY)) || [];
let currency    = "DZD";
let currentCat  = "all";

// ── 1. عرض المنتجات ──
function renderProducts(cat = "all") {
  currentCat = cat;
  const container = document.getElementById("productsContainer");
  if (!container) return;

  // BUG FIX: تحقق من وجود window.PRODUCTS قبل الاستخدام
  if (!window.PRODUCTS || !Array.isArray(window.PRODUCTS)) {
    container.innerHTML = "<p style='color:var(--txt3);text-align:center;padding:2rem'>جاري تحميل المنتجات...</p>";
    return;
  }

  container.innerHTML = "";
  const filtered = cat === "all"
    ? window.PRODUCTS
    : window.PRODUCTS.filter(p => p.category === cat);

  filtered.forEach(p => {
    const priceDisp = currency === "USD"
      ? "$" + (p.price / DZD_PER_USD).toFixed(2)
      : p.price.toLocaleString() + " دج";

    const inCart = cart.find(x => x.id === p.id);
    const div = document.createElement("div");
    div.className = "product-card";
    div.innerHTML = `
      <img src="${p.image || ''}" alt="${p.name}"
           onerror="this.style.display='none'"
           onclick="openProductModal && openProductModal(${p.id})"
           style="cursor:pointer">
      <div class="p-info">
        <h4>${p.name}</h4>
        <p class="price">${priceDisp}</p>
        <button onclick="addToCart(${p.id})" ${inCart ? 'class="in-cart"' : ''}>
          ${inCart ? `✦ في السلة (${inCart.qty})` : "إضافة للسلة"}
        </button>
      </div>`;
    container.appendChild(div);
  });
}
window.renderProducts = renderProducts;

// ── 2. إضافة للسلة ──
function addToCart(id) {
  if (!window.PRODUCTS) return;
  const p = window.PRODUCTS.find(x => x.id === id);
  if (!p) return;

  if (p.qualityAlert && !confirm("⚠️ تنبيه الجودة: الصورة قد لا تكون دقيقة عند الطباعة. استمرار؟")) return;

  const existing = cart.find(x => x.id === id);
  if (existing) existing.qty++;
  else cart.push({ ...p, qty: 1 });

  if (typeof showToast === "function") showToast(`تم إضافة ${p.name} ✦`);
  saveAndUpdate();
}
window.addToCart = addToCart;

// ── 3. تحديث عرض السلة ──
function updateCart() {
  let subtotal = 0;
  const list = document.getElementById("cartItems");
  if (list) list.innerHTML = "";

  cart.forEach((item, index) => {
    subtotal += item.price * item.qty;
    if (list) {
      const priceDisp = currency === "USD"
        ? "$" + (item.price * item.qty / DZD_PER_USD).toFixed(2)
        : (item.price * item.qty).toLocaleString() + " دج";

      const row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML = `
        <div class="cart-item-info">
          <span class="cart-item-name">${item.name}</span>
          <div class="cart-item-qty-row">
            <button onclick="changeQty(${index}, -1)">−</button>
            <span>${item.qty}</span>
            <button onclick="changeQty(${index}, 1)">+</button>
          </div>
        </div>
        <div class="cart-item-right">
          <span class="cart-item-price">${priceDisp}</span>
          <button class="remove-btn" onclick="removeFromCart(${index})">✕</button>
        </div>`;
      list.appendChild(row);
    }
  });

  // BUG FIX: عتبة الخصم 5000 دج بدلاً من 100
  const discount = subtotal >= BULK_DISCOUNT_THRESHOLD
    ? subtotal * BULK_DISCOUNT_RATE
    : 0;
  const total = subtotal - discount;

  // تحديث الأرقام في الصفحة
  _setText("cart-subtotal", fmtPrice(subtotal));
  _setText("cart-discount",  discount > 0 ? "-" + fmtPrice(discount) : "0 دج");
  _setText("cart-total",     fmtPrice(total));

  // عداد الأيقونة
  const count = cart.reduce((a, b) => a + b.qty, 0);
  document.querySelectorAll(".cart-count").forEach(el => el.textContent = count > 0 ? count : "");

  // حفظ
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}
window.updateCart = updateCart;

// ── 4. تغيير الكمية ──
function changeQty(index, delta) {
  cart[index].qty += delta;
  if (cart[index].qty <= 0) cart.splice(index, 1);
  saveAndUpdate();
}
window.changeQty = changeQty;

// ── 5. حذف من السلة ──
function removeFromCart(index) {
  const name = cart[index]?.name || "";
  cart.splice(index, 1);
  if (typeof showToast === "function") showToast(`حُذف ${name} من السلة`);
  saveAndUpdate();
}
window.removeFromCart = removeFromCart;

// ── 6. إفراغ السلة ──
function clearCart() {
  cart = [];
  saveAndUpdate();
}
window.clearCart = clearCart;

// ── 7. التوجيه للدفع ──
function checkout() {
  if (cart.length === 0) {
    if (typeof showToast === "function") showToast("⚠️ السلة فارغة!");
    else alert("السلة فارغة!");
    return;
  }
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  const isInPages = window.location.pathname.includes("/pages/");
  window.location.href = isInPages ? "checkout.html" : "pages/checkout.html";
}
window.checkout = checkout;

// ── مساعد داخلي ──
function saveAndUpdate() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCart();
  if (typeof renderProducts === "function") renderProducts(currentCat);
}

function fmtPrice(dzd) {
  if (currency === "USD") return "$" + (dzd / DZD_PER_USD).toFixed(2);
  return dzd.toLocaleString() + " دج";
}

function _setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ── تشغيل عند تحميل الصفحة ──
document.addEventListener("DOMContentLoaded", () => {
  updateCart();
  // انتظر data.js تُسند window.PRODUCTS
  if (window.PRODUCTS) renderProducts(currentCat);
  else {
    // إذا لم تُسند بعد، استخدم MutationObserver بديلاً بسيطاً
    let tries = 0;
    const interval = setInterval(() => {
      if (window.PRODUCTS || ++tries > 20) {
        clearInterval(interval);
        renderProducts(currentCat);
      }
    }, 100);
  }
});
