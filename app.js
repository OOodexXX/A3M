/* ============================================================
   A3M-PRINT - APP.JS (المشغل الرئيسي والواجهة)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    // 1. تهيئة اللغة (تعتمد على T الموجود في data.js)
    initLanguage();

    // 2. تفعيل القائمة الجانبية (Mobile Menu)
    const menuBtn = document.getElementById('menuBtn');
    const navLinks = document.querySelector('.nav-links');
    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // 3. تفعيل التبويب (Tabs) للأقسام
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const cat = btn.getAttribute('data-category');
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // استدعاء دالة العرض من ملف cart.js
            if (typeof renderProducts === 'function') {
                renderProducts(cat);
            }
        });
    });

    // 4. تشغيل الموقع لأول مرة
    console.log("A3M App Initialized");
});

// دالة الترجمة المبسطة
function initLanguage() {
    const lang = localStorage.getItem('a3m_lang') || 'ar';
    // التأكد من وجود كائن T من ملف data.js
    const translation = window.T ? window.T[lang] : { dir: 'rtl' };
    
    document.documentElement.lang = lang;
    document.documentElement.dir = translation.dir;
    
    // تحديث النصوص التي تحمل class "t-key"
    document.querySelectorAll('.t-key').forEach(el => {
        const key = el.getAttribute('data-key');
        if (translation[key]) el.innerText = translation[key];
    });
}

// دالة الـ Toast (التنبيهات)
function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

window.showToast = showToast;