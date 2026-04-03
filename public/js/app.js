// ============================================================
// app.js  –  A3M Print  –  وظائف عامة
// BUG FIXED:
//   1. toggleTheme كانت تضيف class="dark" لكن style.css تستخدم
//      "blue-dark","blue-light","beige-dark","purple-dark"... إلخ
//      → أُعيدت كتابتها لتدعم كل الثيمات
//   2. goToCheckout: المسار صح فقط من index.html,
//      من داخل /pages/ يكون "../pages/checkout.html" ← تحقق تلقائي
// ============================================================

// ── الثيم الافتراضي ──
const DEFAULT_THEME = "blue-dark";
const THEMES = [
  "blue-dark","blue-light",
  "beige-dark","beige-light",
  "purple-dark","purple-light",
  "white-light","white-dark"
];

function applyTheme(theme) {
  // أزل كل ثيمات body ثم أضف الجديد
  THEMES.forEach(t => document.body.classList.remove(t));
  document.body.classList.add(theme);
  localStorage.setItem("a3m_theme", theme);
}

function loadTheme() {
  const saved = localStorage.getItem("a3m_theme") || DEFAULT_THEME;
  applyTheme(saved);
}

// BUG FIX: كانت تضيف/تزيل "dark" فقط
function toggleTheme() {
  const current = localStorage.getItem("a3m_theme") || DEFAULT_THEME;
  // toggle بين dark و light للثيم الحالي
  let next;
  if (current.endsWith("-dark")) {
    next = current.replace("-dark", "-light");
  } else {
    next = current.replace("-light", "-dark");
  }
  if (!THEMES.includes(next)) next = DEFAULT_THEME;
  applyTheme(next);
}

function setTheme(theme) {
  if (THEMES.includes(theme)) applyTheme(theme);
}

// BUG FIX: مسار الـ checkout يعتمد على موقع الصفحة
function goToCheckout() {
  const isInPages = window.location.pathname.includes("/pages/");
  window.location.href = isInPages ? "checkout.html" : "pages/checkout.html";
}

function showToast(msg, duration = 2500) {
  let t = document.getElementById("toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    t.style.cssText = "position:fixed;bottom:2rem;left:50%;transform:translateX(-50%) translateY(80px);background:var(--gold);color:#111;padding:10px 22px;border-radius:30px;font-weight:700;font-size:13px;z-index:9999;opacity:0;transition:.4s;pointer-events:none;white-space:nowrap";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = "1";
  t.style.transform = "translateX(-50%) translateY(0)";
  clearTimeout(t._timer);
  t._timer = setTimeout(() => {
    t.style.opacity = "0";
    t.style.transform = "translateX(-50%) translateY(80px)";
  }, duration);
}

// تصدير للاستخدام الخارجي (inline onclick)
window.toggleTheme  = toggleTheme;
window.setTheme     = setTheme;
window.goToCheckout = goToCheckout;
window.showToast    = showToast;

// تشغيل عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", loadTheme);
