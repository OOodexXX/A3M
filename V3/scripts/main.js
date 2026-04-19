/**
 * A3M Print - main.js
 * Entry point: يحمل كل الـ modules حسب الصفحة
 * موجود في: scripts/main.js
 */

// ============================================
// 1. CORE
// ============================================
import './core/config.js';
import './core/app.js';

// ============================================
// 2. SERVICES
// ============================================
import './services/firebase.js';
import './services/storage.js';

// ============================================
// 3. UTILS (تُستورد من الملفات الأخرى مباشرة)
// ============================================
import './utils/constants.js';
import './utils/helpers.js';
import './utils/formatters.js';

// ============================================
// 4. AUTH
// ============================================
import './auth/auth.js';
import './auth/user.js';

// ============================================
// 5. STORE
// ============================================
import './store/router.js';
import './store/products.js';
import './store/checkout.js';

// ============================================
// 6. PRICING
// ============================================
import './pricing/rules.js';
import './pricing/pricing-engine.js';
import './pricing/calculator.js';

// ⚠️ a3m-settings.js و ai.js يتحملان من index.html كـ <script src>
// لا تستوردهم هنا — يتسببوا في تشغيل مزدوج
