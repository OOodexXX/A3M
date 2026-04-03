// ============================================================
// checkout.js  –  A3M Print
// BUG FIXED:
//   1. كان يقرأ localStorage.getItem("cart")
//      لكن cart.js تحفظ بمفتاح "a3m_cart" ← موحَّد
//   2. addDoc بدون await → قد تُحوَّل الصفحة قبل الحفظ ← أُضيف await
//   3. لم يكن هناك أي تغذية راجعة للمستخدم عند الخطأ
//   4. مسار success.html كان خاطئاً من /pages/ ← صُحح
//   5. لم يكن يمسح a3m_cart بعد الطلب
// ============================================================

import { db } from "./firebase.js";
import {
  collection, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const CART_KEY = "a3m_cart";   // BUG FIX: كان "cart" ← موحَّد

async function placeOrder() {
  const name    = document.getElementById("c_name")?.value.trim()    || "";
  const phone   = document.getElementById("c_phone")?.value.trim()   || "";
  const address = document.getElementById("c_address")?.value.trim() || "";
  const wilaya  = document.getElementById("c_wilaya")?.value.trim()  || "";
  const notes   = document.getElementById("c_notes")?.value.trim()   || "";

  // BUG FIX: validation مع تغذية راجعة
  if (!name || !phone || !address) {
    showFeedback("⚠️ يرجى تعبئة الاسم والهاتف والعنوان", "error");
    return;
  }
  if (!/^(0|\+213)[5-7]\d{8}$/.test(phone.replace(/\s/g, ""))) {
    showFeedback("⚠️ رقم الهاتف غير صحيح", "error");
    return;
  }

  // BUG FIX: مفتاح موحَّد
  const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
  if (cart.length === 0) {
    showFeedback("⚠️ السلة فارغة", "error");
    return;
  }

  const total     = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const discount  = total >= 5000 ? total * 0.20 : 0;
  const finalTotal = total - discount;

  // تعطيل الزر أثناء الإرسال
  const btn = document.getElementById("placeOrderBtn");
  if (btn) { btn.disabled = true; btn.textContent = "جاري الإرسال..."; }

  try {
    const order = {
      customer: { name, phone, address, wilaya, notes },
      items: cart.map(i => ({
        id:    i.id,
        name:  i.name,
        price: i.price,
        qty:   i.qty,
        total: i.price * i.qty
      })),
      subtotal:   total,
      discount:   discount,
      total:      finalTotal,
      currency:   "DZD",
      status:     "pending",
      createdAt:  serverTimestamp(),
      // ربط بالمستخدم إذا كان مسجلاً
      userId:     window.currentUser?.uid || null,
      userEmail:  window.currentUser?.email || null
    };

    // BUG FIX: await حتى يُحفظ قبل التحويل
    const docRef = await addDoc(collection(db, "orders"), order);
    console.log("Order saved:", docRef.id);

    // BUG FIX: مسح المفتاح الصحيح
    localStorage.removeItem(CART_KEY);

    // BUG FIX: المسار الصحيح من /pages/
    window.location.href = "success.html";

  } catch (err) {
    console.error("Order error:", err);
    showFeedback("⚠️ فشل الإرسال، حاول مجدداً", "error");
    if (btn) { btn.disabled = false; btn.textContent = "تأكيد الطلب"; }
  }
}

function showFeedback(msg, type = "info") {
  const el = document.getElementById("checkout-feedback");
  if (el) {
    el.textContent = msg;
    el.style.color = type === "error" ? "#e01010" : "#16a34a";
    el.style.display = "block";
    setTimeout(() => { el.style.display = "none"; }, 4000);
  } else {
    alert(msg);
  }
}

// عرض ملخص السلة في صفحة الدفع
function renderCheckoutSummary() {
  const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
  const container = document.getElementById("checkoutItems");
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = "<p>السلة فارغة</p>";
    return;
  }

  const total    = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const discount = total >= 5000 ? total * 0.20 : 0;
  const final    = total - discount;

  container.innerHTML = cart.map(i => `
    <div class="checkout-item">
      <span>${i.name} × ${i.qty}</span>
      <span>${(i.price * i.qty).toLocaleString()} دج</span>
    </div>`).join("") + `
    <div class="checkout-totals">
      ${discount > 0 ? `<div><span>خصم الجملة (20%)</span><span style="color:#16a34a">- ${discount.toLocaleString()} دج</span></div>` : ""}
      <div class="checkout-final"><span>المجموع</span><span>${final.toLocaleString()} دج</span></div>
    </div>`;
}

window.placeOrder = placeOrder;

document.addEventListener("DOMContentLoaded", renderCheckoutSummary);
