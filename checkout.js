/* ============================================================
   A3M-PRINT - CHECKOUT.JS (نظام الدفع وإتمام الطلب)
   ============================================================ */

import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const db = getFirestore();

// 1. جلب بيانات السلة عند تحميل الصفحة
let checkoutCart = JSON.parse(localStorage.getItem('a3m_cart')) || [];

document.addEventListener('DOMContentLoaded', () => {
    renderCheckoutSummary();
    setupFormListener();
});

// 2. عرض ملخص الطلب في صفحة الدفع
function renderCheckoutSummary() {
    const container = document.getElementById('checkoutItems');
    if (!container) return;

    let subtotal = 0;
    container.innerHTML = checkoutCart.map(item => {
        subtotal += item.price * item.qty;
        return `
            <div class="checkout-item">
                <span>${item.name} (x${item.qty})</span>
                <span>${(item.price * item.qty).toFixed(2)} DZD</span>
            </div>
        `;
    }).join('');

    // حساب الخصم (20% إذا كان فوق 100)
    let discount = subtotal >= 100 ? subtotal * 0.20 : 0;
    let total = subtotal - discount;

    // تحديث الأرقام في صفحة الدفع
    document.getElementById('check-subtotal').innerText = subtotal.toFixed(2);
    document.getElementById('check-discount').innerText = discount.toFixed(2);
    document.getElementById('check-total').innerText = total.toFixed(2);
}

// 3. إعداد مراقب إرسال النموذج
function setupFormListener() {
    const form = document.getElementById('checkoutForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await placeOrder();
        });
    }
}

// 4. دالة إرسال الطلب النهائي
async function placeOrder() {
    if (checkoutCart.length === 0) {
        alert("سلتك فارغة!");
        return;
    }

    const btn = document.getElementById('submitOrderBtn');
    if (btn) btn.disabled = true;

    try {
        const orderData = {
            userId: window.currentUser ? window.currentUser.uid : "guest",
            customerName: document.getElementById('custName').value,
            phone: document.getElementById('custPhone').value,
            address: document.getElementById('custAddress').value,
            items: checkoutCart,
            subtotal: parseFloat(document.getElementById('check-subtotal').innerText),
            discount: parseFloat(document.getElementById('check-discount').innerText),
            total: parseFloat(document.getElementById('check-total').innerText),
            status: 'pending',
            createdAt: serverTimestamp()
        };

        // حفظ الطلب في Firestore
        const docRef = await addDoc(collection(db, "orders"), orderData);
        
        console.log("Order placed with ID: ", docRef.id);
        
        // مسح السلة بعد النجاح
        localStorage.removeItem('a3m_cart');
        
        // التوجه لصفحة النجاح
        window.location.href = 'success.html';

    } catch (error) {
        console.error("Error placing order: ", error);
        alert("حدث خطأ أثناء إرسال الطلب، حاول مرة أخرى.");
        if (btn) btn.disabled = false;
    }
}

window.placeOrder = placeOrder;