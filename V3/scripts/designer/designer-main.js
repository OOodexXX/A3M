// ============================================================
// designer-main.js  –  A3M Print  –  Entry point for designer page
// ترتيب التحميل مهم: canvas → tools → designer → preview3d
// ============================================================

import "../services/firebase.js";
import "../utils/constants.js";
import "../utils/helpers.js";
import "../utils/formatters.js";
import "../core/config.js";
import "../core/app.js";
import "../store/cart.js";
import "../auth/auth.js";
import "../auth/user.js";

// Designer modules (non-ES modules — loaded as scripts in HTML)
// ترتيب التحميل في HTML:
//   1. designer/canvas.js
//   2. designer/tools.js
//   3. designer/designer.js
//   4. designer/preview3d.js
//   5. designer-publish-patch.js   ← آخر شيء دائماً

console.log("✦ A3M Designer entry loaded");
window._a3mModulesReady = true;
window.dispatchEvent(new Event("a3m-ready"));
