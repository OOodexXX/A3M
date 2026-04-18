// ============================================================
// store/checkout.js  –  A3M Print  –  إتمام الطلب
// ============================================================

import { db } from "../services/firebase.js";
import {
  collection, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { CART_KEY } from "../utils/constants.js";
import { calcOrderTotal, renderCheckoutSummary } from "../pricing/pricing-engine.js";

// ════════════════════════════════════════════════════════════
// PLACE ORDER
// ════════════════════════════════════════════════════════════

async function placeOrder() {
  const v = id => document.getElementById(id)?.value?.trim() || "";
  const name    = v("c_name");
  const phone   = v("c_phone");
  const address = v("c_address");
  const wilaya  = v("c_wilaya");
  const notes   = v("c_notes");

  if (!name || !phone || !address) {
    _feedback("⚠️ يرجى تعبئة الاسم والهاتف والعنوان", "error");
    return;
  }

  const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
  if (!cart.length) { _feedback("⚠️ السلة فارغة", "error"); return; }

  const discountCode = document.getElementById("discountInput")?.value?.trim().toUpperCase() || "";
  const { subtotal, bulkDiscount, codeDiscount, finalTotal } = calcOrderTotal(cart, discountCode);

  const btn = document.getElementById("placeOrderBtn");
  if (btn) { btn.disabled = true; btn.textContent = "جاري الإرسال..."; }

  try {
    const order = {
      customer:     { name, phone, address, wilaya, notes },
      items:        cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
      subtotal, bulkDiscount, codeDiscount, discountCode,
      total:        finalTotal,
      currency:     "DZD",
      status:       "pending",
      userId:       window.currentUser?.uid   || null,
      userEmail:    window.currentUser?.email || null,
      createdAt:    serverTimestamp(),
    };
    await addDoc(collection(db, "orders"), order);

    // XP reward
    if (window.currentUser && window._saveUser) {
      window.currentUser.xp = (window.currentUser.xp || 0) + Math.floor(finalTotal / 100);
      window._saveUser();
    }

    localStorage.removeItem(CART_KEY);
    window.location.href = "success.html";

  } catch (err) {
    console.error("Order error:", err);
    // Fallback: save locally and redirect
    const localOrders = JSON.parse(localStorage.getItem("a3m_orders") || "[]");
    localOrders.push({
      name:  cart[0]?.name || "Order",
      emoji: "📦",
      date:  new Date().toLocaleDateString(),
      price: finalTotal.toLocaleString() + " دج",
    });
    localStorage.setItem("a3m_orders", JSON.stringify(localOrders));
    localStorage.removeItem(CART_KEY);
    window.location.href = "success.html";
  }
}

// ════════════════════════════════════════════════════════════
// FEEDBACK
// ════════════════════════════════════════════════════════════

function _feedback(msg, type = "info") {
  const el = document.getElementById("checkout-feedback");
  if (el) {
    el.textContent    = msg;
    el.style.color    = type === "error" ? "#e01010" : "#16a34a";
    el.style.display  = "block";
    setTimeout(() => { el.style.display = "none"; }, 4000);
  } else {
    alert(msg);
  }
}

// ════════════════════════════════════════════════════════════
// EXPOSE TO WINDOW
// ════════════════════════════════════════════════════════════

window.placeOrder              = placeOrder;
window.renderCheckoutSummary   = renderCheckoutSummary;

document.addEventListener("DOMContentLoaded", renderCheckoutSummary);

export { placeOrder };
