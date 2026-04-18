// ============================================================
// main.js  –  A3M Print  –  Entry point for index.html
// ترتيب التحميل مهم — لا تبدل الترتيب
// ============================================================

// 1. Firebase أولاً — باقي الملفات تعتمد عليه
import "./services/firebase.js";

// 2. Utils — ثوابت، helpers، formatters (لا dependencies)
import "./utils/constants.js";
import "./utils/helpers.js";
import "./utils/formatters.js";

// 3. Core config — يهيّئ window globals
import "./core/config.js";

// 4. App core — theme، lang، sidebar، modals
import "./core/app.js";

// 5. Store — products + cart
// ملاحظة: data.js يُحمَّل كـ <script> في HTML قبل هذا الملف
//          ويضع PD, T, PAPERS, BL, PROD_IMGS على window
import "./store/products.js";
import "./store/cart.js";

// 6. Auth — login، register، XP
import "./auth/auth.js";
import "./auth/user.js";

// 7. Designer — canvas studio (IIFE — يُحمَّل كـ script في HTML)
// ترتيب scripts في index.html:
//   <script src="scripts/designer/canvas.js"></script>
//   <script src="scripts/designer/tools.js"></script>
//   <script src="scripts/designer/designer.js"></script>
//   <script src="scripts/designer/preview3d.js"></script>
//   <script src="scripts/designer-publish-patch.js"></script>

// ── Ready ──
window._a3mModulesReady = true;
window.dispatchEvent(new Event("a3m-ready"));
console.log("✦ A3M modules loaded");
