// ============================================================
// checkout-main.js  –  A3M Print  –  Entry point for pages/checkout.html
// المسارات نسبية من مجلد pages/ → ../scripts/
// ============================================================

// 1. Firebase
import "./services/firebase.js";

// 2. Utils
import "./utils/constants.js";
import "./utils/helpers.js";
import "./utils/formatters.js";

// 3. Core
import "./core/config.js";
import "./core/app.js";

// 4. Pricing engine (needed before cart for fmtPrice)
import "./pricing/rules.js";
import "./pricing/calculator.js";
import "./pricing/pricing-engine.js";

// 5. Cart (بدون designer)
import "./store/cart.js";

// 6. Checkout
import "./store/checkout.js";

// 7. Auth
import "./auth/auth.js";
import "./auth/user.js";

console.log("✦ A3M Checkout loaded");
