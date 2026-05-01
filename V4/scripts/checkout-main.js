// ============================================================
// checkout-main.js  –  A3M Print  –  Entry point: صفحة الـ Checkout
// موجود في: scripts/checkout-main.js
// ✅ FIX: كل الـ import paths كانت غلط (flat paths بدل relative paths)
// ============================================================

// 1. Services
import "./services/firebase.js";
import "./services/storage.js";

// 2. Utils
import "./utils/constants.js";
import "./utils/helpers.js";
import "./utils/formatters.js";

// 3. Core
import "./core/config.js";
import "./core/app.js";

// 4. Auth
import "./auth/auth.js";
import "./auth/user.js";

// 5. Pricing
import "./pricing/rules.js";
import "./pricing/calculator.js";
import "./pricing/pricing-engine.js";

// 6. Store — cart + checkout
import "./store/cart.js";
import "./store/checkout.js";

// 7. Data loader — آخر شيء
import "./data/data-loader.js";

console.log("✦ A3M Checkout loaded");
