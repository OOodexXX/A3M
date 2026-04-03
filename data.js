/* ============================================================
   A3M-PRINT - DATA.JS (النسخة المحدثة بناءً على ملفاتك)
   ============================================================ */

const PRODUCTS = [
    // قسم الحقائب (Back Pack)
    { 
        id: 1, 
        name: "حقيبة ظهر سوداء - موديل 1", 
        price: 5500, 
        category: "back pack", 
        image: "shop images/back pack/black back pack model1.png", 
        qualityAlert: false 
    },
    { 
        id: 2, 
        name: "حقيبة ظهر سوداء - موديل 2", 
        price: 5500, 
        category: "back pack", 
        image: "shop images/back pack/black back pack model2.png", 
        qualityAlert: false 
    },

    // قسم القبعات (Cap)
    { 
        id: 3, 
        name: "قبعة سوداء كلاسيك", 
        price: 1800, 
        category: "cap", 
        image: "shop images/cap/black cap.png",
        qualityAlert: false 
    },
    { 
        id: 4, 
        name: "قبعة بيضاء", 
        price: 1800, 
        category: "cap", 
        image: "shop images/cap/white cap.png",
        qualityAlert: false 
    },

    // قسم الهودي (Hoodie)
    { 
        id: 5, 
        name: "هودي شتوي بيج", 
        price: 4500, 
        category: "hoodie", 
        image: "shop images/hoodie/beige hoodie.png",
        qualityAlert: true // ميزة تنبيه الجودة مفعلة هنا
    },
    { 
        id: 6, 
        name: "هودي شتوي أسود", 
        price: 4500, 
        category: "hoodie", 
        image: "shop images/hoodie/black hoodie.png",
        qualityAlert: false 
    },

    // قسم الميداليات (Keychain)
    { 
        id: 7, 
        name: "ميدالية مفاتيح مخصصة", 
        price: 800, 
        category: "keychain", 
        image: "shop images/keychain/custom key.png",
        qualityAlert: false 
    },

    // قسم الأكواب (Mug)
    { 
        id: 8, 
        name: "كوب سيراميك أبيض", 
        price: 1200, 
        category: "mug", 
        image: "shop images/mug/white mug.png",
        qualityAlert: false 
    },

    // قسم الدفاتر (Note Boock)
    { 
        id: 9, 
        name: "دفتر ملاحظات A3M", 
        price: 1500, 
        category: "note boock", 
        image: "shop images/note boock/note book.png",
        qualityAlert: false 
    },

    // قسم التغليف (Packaging Bag)
    { 
        id: 10, 
        name: "حقيبة تغليف هدايا", 
        price: 500, 
        category: "Packaging bag", 
        image: "shop images/Packaging bag/packaging bag.png",
        qualityAlert: false 
    },

    // قسم التيشرتات (T Shirt)
    { 
        id: 11, 
        name: "تيشرت قطني أسود", 
        price: 2500, 
        category: "t shirt", 
        image: "shop images/t shirt/black tshirt.png",
        qualityAlert: true
    },
    { 
        id: 12, 
        name: "تيشرت قطني أبيض", 
        price: 2500, 
        category: "t shirt", 
        image: "shop images/t shirt/white tshirt.png",
        qualityAlert: false
    }
];

// مصفوفة القوالب (توضع كما هي)
const TEMPLATES = [
    {
        id: "tpl_1",
        preview: "shop images/social media/tpl_preview.png",
        fn: function() { 
            console.log("تطبيق قالب التصميم الأول..."); 
        }
    }
];

// نصوص الترجمة
const T = {
    ar: {
        dir: 'rtl',
        home: 'الرئيسية',
        account: 'حسابي',
        cart: 'السلة',
        checkout: 'إتمام الطلب',
        emptyCart: 'السلة فارغة حالياً'
    },
    en: {
        dir: 'ltr',
        home: 'Home',
        account: 'Account',
        cart: 'Cart',
        checkout: 'Checkout',
        emptyCart: 'Your cart is empty'
    }
};

// التصدير للنافذة العالمية لضمان عمل ملف app.js و cart.js
window.PRODUCTS = PRODUCTS;
window.TEMPLATES = TEMPLATES;
window.T = T;