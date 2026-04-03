/* ============================================================
   A3M-PRINT - CART.JS (نظام المتجر المعتمد على DATA.JS)
   ============================================================ */

let cart = JSON.parse(localStorage.getItem('a3m_cart')) || [];
let currency = 'DZD'; 
let currentCat = 'all';

// 1. عرض المنتجات
function renderProducts(cat = 'all') {
    currentCat = cat;
    const container = document.getElementById('productsContainer');
    if (!container) return;

    container.innerHTML = "";
    // الفلترة من المصفوفة العالمية في data.js
    const filtered = (cat === 'all') ? window.PRODUCTS : window.PRODUCTS.filter(p => p.category === cat);

    filtered.forEach(p => {
        const priceDisp = currency === 'USD' ? (p.price / 200).toFixed(2) + ' $' : p.price + ' DZD';
        const div = document.createElement('div');
        div.className = 'product-card';
        div.innerHTML = `
            <img src="${p.image}" alt="${p.name}" onclick="openProductModal(${p.id})">
            <div class="p-info">
                <h4>${p.name}</h4>
                <p class="price">${priceDisp}</p>
                <button onclick="addToCart(${p.id})"><i class="fas fa-shopping-basket"></i> إضافة</button>
            </div>`;
        container.appendChild(div);
    });

    if (typeof currentModalProduct !== 'undefined' && currentModalProduct) {
        if (typeof updateModalTotal === "function") updateModalTotal();
    }
}
window.renderProducts = renderProducts; // تصدير الدالة تحتها مباشرة

// 2. إضافة للسلة مع تنبيه الجودة
function addToCart(id) {
    const p = window.PRODUCTS.find(x => x.id === id);
    if (!p) return;

    if (p.qualityAlert && !confirm("⚠️ تنبيه الجودة: الصورة قد لا تكون دقيقة. استمرار؟")) return;

    const existing = cart.find(x => x.id === id);
    if (existing) existing.qty++;
    else cart.push({ ...p, qty: 1 });

    if (typeof showToast === "function") showToast(`تم إضافة ${p.name}`);
    updateCart();
    renderProducts(currentCat); 
}
window.addToCart = addToCart; // تصدير الدالة تحتها مباشرة

// 3. تحديث السلة + خصم الجملة 20%
function updateCart() {
    let subtotal = 0;
    const list = document.getElementById('cartItems');
    if (list) list.innerHTML = "";

    cart.forEach((item, index) => {
        subtotal += item.price * item.qty;
        if (list) {
            const row = document.createElement('div');
            row.className = 'cart-item';
            row.innerHTML = `<span>${item.name} (x${item.qty})</span>
                             <span>${(item.price * item.qty)} DZD</span>
                             <button onclick="removeFromCart(${index})"><i class="fas fa-trash"></i></button>`;
            list.appendChild(row);
        }
    });

    // خصم 20% إذا وصل المجموع لـ 100 (أو حسب القيمة التي تريدها)
    let discount = subtotal >= 100 ? subtotal * 0.20 : 0;
    let total = subtotal - discount;

    if (document.getElementById('cart-subtotal')) document.getElementById('cart-subtotal').innerText = subtotal.toFixed(2);
    if (document.getElementById('cart-discount')) {
        const d = document.getElementById('cart-discount');
        d.innerText = discount.toFixed(2);
        d.style.color = discount > 0 ? "#27ae60" : "inherit";
    }
    if (document.getElementById('cart-total')) document.getElementById('cart-total').innerText = total.toFixed(2);

    localStorage.setItem('a3m_cart', JSON.stringify(cart));
    document.querySelectorAll('.cart-count').forEach(el => el.innerText = cart.reduce((a, b) => a + b.qty, 0));

    if (typeof currentModalProduct !== 'undefined' && currentModalProduct) {
        if (typeof updateModalTotal === "function") updateModalTotal();
    }
}
window.updateCart = updateCart; // تصدير الدالة تحتها مباشرة

// 4. حذف وتوجيه
function removeFromCart(index) {
    cart.splice(index, 1);
    updateCart();
    renderProducts(currentCat);
}
window.removeFromCart = removeFromCart; // تصدير الدالة تحتها مباشرة

function checkout() {
    if (cart.length === 0) return alert("السلة فارغة!");
    localStorage.setItem('a3m_cart', JSON.stringify(cart));
    window.location.href = 'pages/checkout.html';
}
window.checkout = checkout; // تصدير الدالة تحتها مباشرة

// التشغيل عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    updateCart();
    renderProducts(currentCat);
});
