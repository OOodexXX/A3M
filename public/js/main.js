// ============================================================
// main.js  –  A3M Print  –  نقطة الدخول الرئيسية
// BUG FIXED:
//   1. الملف كان اسمه "mains.js" لكن checkout.html يستورد "main.js"
//      → اسم الملف هذا الآن main.js
//   2. ترتيب الاستيرادات مهم: firebase → data → app → auth → cart → checkout → designer
//      (data يجب أن يأتي قبل cart لأن cart تعتمد على window.PRODUCTS)
//   3. checkout.js يُستورد دائماً لكنه آمن (يتحقق من وجود العناصر)
// ============================================================

// 1. Firebase أولاً (يجب أن يُهيأ قبل أي استخدام)
import "./firebase.js";

// 2. البيانات (تُسند window.PRODUCTS)
import "./data.js";

// 3. الوظائف العامة (theme, toast, goToCheckout)
import "./app.js";

// 4. المصادقة (تستخدم firebase)
import "./auth.js";

// 5. السلة (تستخدم window.PRODUCTS من data.js)
import "./cart.js";

// 6. الدفع (تستخدم firebase + localStorage)
import "./checkout.js";

// 7. الديزاينر (مستقل)
import "./designer.js";

console.log("✦ A3M Print - All modules loaded");
