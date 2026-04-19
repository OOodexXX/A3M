# 📁 A3M Print — JS Architecture Map
> تقسيم كامل للملفات حسب البنية الجديدة

---

## `/scripts/core/`
| الملف الجديد | المصدر الحالي | المحتوى |
|---|---|---|
| `app.js` | `app.js` (كله) | Theme، Lang، Sidebar، Modal helpers، showToast، goToCheckout |
| `router.js` | ❌ جديد | Client-side routing بين الصفحات |
| `config.js` | `data.js` → constants فقط | `DZD_PER_USD`, `BULK_THRESHOLD`, `DISCOUNT_CODES`, `XP_RANKS` |

---

## `/scripts/services/`
| الملف الجديد | المصدر الحالي | المحتوى |
|---|---|---|
| `firebase.js` | `firebase.js` (كله) | initializeApp، getAuth، getFirestore، exports |
| `api.js` | ❌ جديد | fetch wrappers للـ Anthropic API (مستخرج من `ai.js`) |
| `storage.js` | `app.js` + `auth.js` | localStorage helpers: loadSettings، saveSettings، a3m_user، a3m_cart |

---

## `/scripts/store/`
| الملف الجديد | المصدر الحالي | المحتوى |
|---|---|---|
| `products.js` | `data.js` → PD, PAPERS, BL, T, PROD_IMGS | بيانات المنتجات، الترجمات، renderProducts، renderPaper |
| `cart.js` | `cart.js` (كله) | cart array، fmtPrice، openProdModal، quickAdd، updateCart، applyDiscount |
| `checkout.js` | `checkout.js` + `checkout-main.js` | placeOrder، renderCheckoutSummary، _feedback |

---

## `/scripts/designer/`
| الملف الجديد | المصدر الحالي | المحتوى |
|---|---|---|
| `designer.js` | `designer.js` → core IIFE | initDesigner، openDesigner، closeDesigner، canvas setup |
| `canvas.js` | `designer.js` → canvas functions | draw()، renderLayer()، hitTest()، exportCanvas() |
| `tools/text.js` | `designer.js` → text functions | addTextLayer()، editTextLayer()، font handling |
| `tools/images.js` | `designer.js` → image functions | addImageLayer()، upload handling، PROD_IMGS |
| `tools/layers.js` | `designer.js` → layer management | layers[]، selectLayer()، deleteLayer()، reorder |
| `3d/viewer.js` | `preview3d.js` → renderer setup | Three.js renderer، scene، camera، animation loop |
| `3d/loader.js` | `preview3d.js` → model loading | loadProduct()، applyDesignTexture()، model geometry |
| `3d/controls.js` | `preview3d.js` → controls | OrbitControls، zoom inertia، screenshot HD |

---

## `/scripts/pricing/`
| الملف الجديد | المصدر الحالي | المحتوى |
|---|---|---|
| `pricing-engine.js` | `checkout.js` + `cart.js` → حسابات | subtotal، bulkDiscount، codeDiscount، finalTotal |
| `rules.js` | `data.js` + `config.js` → DISCOUNT_CODES | قواعد الخصم، BULK_THRESHOLD، BULK_RATE |
| `calculator.js` | `cart.js` → fmtPrice + refreshCartTotal | fmtPrice()، refreshCartTotal()، currency conversion |

---

## `/scripts/auth/`
| الملف الجديد | المصدر الحالي | المحتوى |
|---|---|---|
| `auth.js` | `auth.js` → Firebase auth functions | doLogin، doRegister، onAuthStateChanged، doLogout |
| `user.js` | `auth.js` → profile + XP functions | populateProfile، getXpRank، updateNavAccount، _saveUser، switchAccTab |

---

## `/scripts/utils/`
| الملف الجديد | المصدر الحالي | المحتوى |
|---|---|---|
| `helpers.js` | `app.js` → utility functions | showToast()، scrollToTop()، safe()، safeHTML() |
| `constants.js` | `config.js` + `data.js` | XP_RANKS، CART_KEY، DZD_PER_USD، THEMES، DISCOUNT_CODES |
| `formatters.js` | `cart.js` → fmtPrice، disc | fmtPrice()، disc()، formatDate()، toLocaleString wrappers |

---

## `/data/` (JSON files — مستخرجة من data.js)
| الملف | المصدر | المحتوى |
|---|---|---|
| `products.json` | `data.js` → `PD[]` | مصفوفة المنتجات: id، cat، emoji، price، old، badge، sizes |
| `pricing.json` | `data.js` + `checkout.js` | DISCOUNT_CODES، BULK_THRESHOLD، BULK_RATE، DZD_PER_USD |
| `templates.json` | `designer.js` → `TEMPLATES[]` | قوالب الكانفاس: name، icon (fn تبقى في designer.js) |

---

## ملفات تبقى كما هي (Standalone)
| الملف | السبب |
|---|---|
| `ai.js` | IIFE كاملة ومعزولة، A3M Bot مستقل |
| `designer-publish-patch.js` | Patch بعد designer.js، يُحمَّل آخر شيء |
| `a3m-settings.js` | Settings manager مستقل، يُحمَّل في كل الصفحات |

---

## Entry Points (main files)
```
/scripts/main.js           ← index.html
/scripts/checkout-main.js  ← pages/checkout.html
/scripts/designer-main.js  ← pages/designer.html (جديد)
```

---

## ترتيب التحميل المقترح (main.js)
```js
import "./services/firebase.js";   // 1. Firebase أولاً
import "./utils/constants.js";     // 2. Constants
import "./utils/formatters.js";    // 3. Formatters
import "./core/config.js";         // 4. Config
import "./core/app.js";            // 5. Theme/Lang/UI
import "./store/products.js";      // 6. Product data
import "./store/cart.js";          // 7. Cart
import "./auth/auth.js";           // 8. Auth
import "./auth/user.js";           // 9. User/XP
import "./designer/designer.js";   // 10. Designer
```
