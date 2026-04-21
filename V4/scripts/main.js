/**
 * A3M Print - main.js
 * Entry point: الصفحة الرئيسية (index.html)
 * موجود في: scripts/main.js
 *
 * ✅ FIX: ترتيب التحميل مهم — constants/helpers قبل config/app
 * ✅ FIX: data.js يُحمَّل آخراً لأنه يملأ window.T و window.PD
 * ⚠️  a3m-settings.js يتحمل من index.html كـ <script src> — لا تستورده هنا
 */

// ── 1. Services (Firebase أولاً) ─────────────────────────────
import "./services/firebase.js";
import "./services/storage.js";

// ── 2. Utils (ثوابت + مساعدات) ───────────────────────────────
import "./utils/constants.js";
import "./utils/helpers.js";
import "./utils/formatters.js";

// ── 3. Core (config قبل app لأن app يستورد منه) ──────────────
import "./core/config.js";
import "./core/app.js";

// ── 4. Auth ───────────────────────────────────────────────────
import "./auth/auth.js";
import "./auth/user.js";

// ── 5. Pricing ────────────────────────────────────────────────
import "./pricing/rules.js";
import "./pricing/calculator.js";
import "./pricing/pricing-engine.js";

// ── 6. Store ──────────────────────────────────────────────────
import "./store/router.js";
import "./store/cart.js";
import "./store/products.js";

// ── 7. Data loader — يفتح JSON ويعبي window.T و window.PD ───
import "./data/data-loader.js";

// ── Ready ─────────────────────────────────────────────────────
window._a3mModulesReady = true;
window.dispatchEvent(new Event("a3m-ready"));
console.log("✦ A3M modules loaded");
