// ============================================================
// store/cart.js  –  A3M Print  –  السلة + المودال
// ✅ FIX: disc → discPct (اسم الدالة الصحيح في formatters.js)
// ============================================================

import { fmtPrice, discPct } from "../utils/formatters.js";
import { showToast }          from "../utils/helpers.js";
import { DISCOUNT_CODES }     from "../utils/constants.js";

// ── State ─────────────────────────────────────────────────────
const CART_KEY       = "a3m_cart";
const BULK_THRESHOLD = 5000;
const BULK_RATE      = 0.20;

let cart                = JSON.parse(localStorage.getItem(CART_KEY)) || [];
let currentModalProduct = null;
let modalQty            = 1;
let selectedSize        = "";
let activeDiscount      = null;

Object.defineProperty(window, "cart", {
  get() { return cart; },
  set(v) { cart = v; },
  configurable: true,
});

// ── Persist ───────────────────────────────────────────────────

function saveCart() {
  const toSave = cart.map(({ img, ...rest }) => rest);
  localStorage.setItem(CART_KEY, JSON.stringify(toSave));
}

// ── Paper add ─────────────────────────────────────────────────

function addPaperToCart(size, price) {
  const key = "paper-" + size;
  const ex  = cart.find(i => i.id === key);
  if (ex) ex.qty++;
  else cart.push({ id: key, name: `Print ${size}`, emoji: "📄", price, qty: 1 });
  saveCart(); updateCart();
  showToast(window.T?.[window.currentLang]?.toastAdded || "Added ✦");
}

// ── Quick add / add to cart ───────────────────────────────────

function quickAdd(id) {
  const PD = window.PD;
  const t  = window.T?.[window.currentLang || "en"];
  if (!PD) return;
  const p    = PD[id];
  const info = t?.prods?.[id] || { n: p.emoji };
  const ex   = cart.find(i => i.id === id);
  if (ex) ex.qty++;
  else cart.push({ id, name: info.n, emoji: p.emoji, price: p.price, qty: 1 });
  saveCart(); updateCart();
  showToast(t?.toastAdded || "Added ✦");
}

function addToCart(id) { quickAdd(id); }

// ── Product modal ─────────────────────────────────────────────

function openProdModal(id) {
  const PD = window.PD;
  const t  = window.T?.[window.currentLang || "en"];
  if (!PD || !t) return;
  const p = PD[id];
  if (!p) return;
  const info = t.prods?.[id] || { n: p.emoji, s: "", desc: "" };
  currentModalProduct = p;
  modalQty    = 1;
  selectedSize = "";

  const s = (elId, val) => { const el = document.getElementById(elId); if (el) el.textContent = val; };
  s("modalHeadTitle", t.modalHead  || "Product Details");
  s("modalTitle",     info.n);
  s("modalSub",       info.s);
  s("modalPrice",     fmtPrice(p.price));
  s("modalOld",       p.old ? fmtPrice(p.old) : "");
  s("modalDisc",      p.old ? "-" + discPct(p.price, p.old) : ""); // ✅ FIX: كان disc()
  s("modalDesc",      info.desc || "");
  s("modalQty",       "1");
  s("modalAddBtn",    t.addToCart  || "Add to Cart");
  s("qtyLabelM",      t.qtyLabelM  || "QTY");
  s("sizeLabel",      t.sizeLabel  || "SIZE");
  s("totalLabel",     t.totalLabel || "Total");

  // ── Images ──
  const imgEl = document.getElementById("modalImg");
  if (imgEl) {
    // ✅ اقرأ من p.imgs أولاً (JSON الجديد)، وكـ fallback من PROD_IMGS القديم
    const imgs = p.imgs?.length ? p.imgs : (window.PROD_IMGS?.[id] || null);
    if (imgs?.length) {
      imgEl.innerHTML = `<img src="${imgs[0]}" style="width:100%;height:100%;object-fit:contain;border-radius:8px"/>`;
      if (imgs.length > 1) {
        const row = document.createElement("div");
        row.style.cssText = "display:flex;gap:.4rem;margin-top:.5rem;flex-wrap:wrap";
        imgs.forEach((src, i) => {
          const thumb = document.createElement("img");
          thumb.src = src;
          thumb.style.cssText = `width:44px;height:44px;border-radius:6px;cursor:pointer;object-fit:cover;border:2px solid ${i === 0 ? "var(--accent)" : "transparent"}`;
          thumb.onclick = () => {
            imgEl.querySelector("img").src = src;
            row.querySelectorAll("img").forEach(x => x.style.borderColor = "transparent");
            thumb.style.borderColor = "var(--accent)";
          };
          row.appendChild(thumb);
        });
        imgEl.appendChild(row);
      }
    } else {
      imgEl.textContent = p.emoji;
    }
  }

  // ── Sizes ──
  const sw = document.getElementById("sizesWrap");
  if (sw) {
    if (p.sizes?.length) {
      sw.style.display = "block";
      const sr = document.getElementById("sizesRow");
      if (sr) sr.innerHTML = p.sizes.map(s =>
        `<span class="size-chip" onclick="selectSize('${s}',this)">${s}</span>`
      ).join("");
    } else {
      sw.style.display = "none";
    }
  }

  updateModalTotal();
  document.getElementById("prodModal")?.classList.add("open");
}

function updateModalTotal() {
  if (!currentModalProduct) return;
  const el = document.getElementById("modalTotalVal");
  if (el) el.textContent = fmtPrice(currentModalProduct.price * modalQty);
}

function selectSize(s, el) {
  selectedSize = s;
  document.querySelectorAll(".size-chip").forEach(c => c.classList.remove("active"));
  el.classList.add("active");
}

function closeProdModal() {
  document.getElementById("prodModal")?.classList.remove("open");
}

function changeModalQty(d) {
  modalQty = Math.max(1, modalQty + d);
  const el = document.getElementById("modalQty");
  if (el) el.textContent = modalQty;
  updateModalTotal();
}

function addToCartFromModal() {
  if (!currentModalProduct) return;
  const p    = currentModalProduct;
  const t    = window.T?.[window.currentLang || "en"];
  const info = t?.prods?.[p.id] || { n: p.emoji };
  const key   = p.id + (selectedSize ? "-" + selectedSize : "");
  const label = info.n + (selectedSize ? ` (${selectedSize})` : "");
  const ex = cart.find(i => i.id === key);
  if (ex) ex.qty += modalQty;
  else cart.push({ id: key, name: label, emoji: p.emoji, price: p.price, qty: modalQty });
  saveCart(); updateCart(); closeProdModal();
  showToast(t?.toastAdded || "Added ✦");
}

// ── Cart panel render ─────────────────────────────────────────

function updateCart() {
  const t     = window.T?.[window.currentLang || "en"];
  const count = cart.reduce((s, i) => s + i.qty, 0);

  const ce = document.getElementById("cartCount");
  if (ce) { ce.textContent = count; ce.style.display = count > 0 ? "flex" : "none"; }

  const cartTitle = document.getElementById("cartTitle");
  if (cartTitle) cartTitle.textContent = t?.cartTitle || "🛒 Cart";

  const ie = document.getElementById("cartItems");
  const fe = document.getElementById("cartFooter");
  if (!ie) return;

  const ds = document.getElementById("discountSection");
  if (ds) ds.style.display = cart.length > 0 ? "block" : "none";

  if (!cart.length) {
    ie.innerHTML = `<div class="cart-empty">${t?.cartEmpty || "Your cart is empty"}</div>`;
    if (fe) fe.style.display = "none";
    return;
  }

  ie.innerHTML = cart.map((item, i) => `
    <div class="cart-item">
      <div class="cart-item-emoji">${item.emoji}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${fmtPrice(item.price * item.qty)}</div>
        <div class="cart-item-qty">
          <button onclick="cartQty(${i},-1)">−</button>
          <span class="cart-qty-val">${item.qty}</span>
          <button onclick="cartQty(${i},1)">+</button>
        </div>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart(${i})">✕</button>
    </div>`).join("");

  if (fe) fe.style.display = "block";
  const ctl = document.getElementById("cartTotalLabel");
  if (ctl && t) ctl.textContent = t.cartTotal || "Total";
  refreshCartTotal();
  const cBtn = document.getElementById("checkoutBtn");
  if (cBtn && t) cBtn.textContent = t.checkout || "Checkout →";
}

function cartQty(i, d) {
  cart[i].qty = Math.max(1, cart[i].qty + d);
  saveCart(); updateCart();
}

function removeFromCart(i) {
  cart.splice(i, 1);
  saveCart(); updateCart();
}

// ── Cart panel open/close ─────────────────────────────────────

function openCart() {
  document.getElementById("cartPanel")?.classList.add("open");
  document.getElementById("cartOverlay")?.classList.add("open");
}

function closeCart() {
  document.getElementById("cartPanel")?.classList.remove("open");
  document.getElementById("cartOverlay")?.classList.remove("open");
}

function checkout() {
  const t = window.T?.[window.currentLang || "en"];
  showToast(t?.toastCheckout || "Redirecting...");
  setTimeout(() => {
    window.ROUTES?.checkout?.() || (window.location.href = "pages/checkout.html");
  }, 600);
}

// ── Discount ──────────────────────────────────────────────────

function applyDiscount() {
  const inp = document.getElementById("discountInput");
  const msg = document.getElementById("discountMsg");
  if (!inp || !msg) return;
  const code = inp.value.trim().toUpperCase();
  const dc   = window.DISCOUNT_CODES?.[code] || DISCOUNT_CODES?.[code];
  if (dc) {
    activeDiscount = dc;
    msg.innerHTML  = `<span class="discount-badge">✦ ${dc.pct}% off applied!</span>`;
    refreshCartTotal();
    showToast(`Discount ${code}: -${dc.pct}% ✦`);
  } else {
    activeDiscount = null;
    msg.innerHTML  = `<span class="discount-badge error">✕ Invalid code</span>`;
    refreshCartTotal();
  }
}

function refreshCartTotal() {
  if (!cart.length) return;
  const raw   = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const bulk  = raw >= BULK_THRESHOLD ? Math.round(raw * BULK_RATE) : 0;
  const after = raw - bulk;
  const final = activeDiscount ? Math.round(after * (1 - activeDiscount.pct / 100)) : after;
  const el    = document.getElementById("cartTotalVal");
  if (!el) return;
  if (activeDiscount || bulk > 0) {
    el.innerHTML = `<span style="text-decoration:line-through;font-size:.85rem;opacity:.55;margin-right:.3rem">${fmtPrice(raw)}</span><span style="color:var(--gold)">${fmtPrice(final)}</span>`;
  } else {
    el.textContent = fmtPrice(raw);
  }
}

// ── Window exports ────────────────────────────────────────────
Object.assign(window, {
  addPaperToCart, addToCart, quickAdd,
  openProdModal, closeProdModal, changeModalQty,
  addToCartFromModal, selectSize,
  updateCart, cartQty, removeFromCart,
  openCart, closeCart, checkout,
  applyDiscount, refreshCartTotal, saveCart,
});

export { cart, saveCart, updateCart, addToCart, quickAdd, openCart, closeCart, applyDiscount, refreshCartTotal };

// ── Init ──────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  updateCart();
});
