// ============================================================
// utils/helpers.js  –  A3M Print  –  مساعدات DOM
// Pure DOM utilities — no business logic
// ============================================================

// ── Safe DOM setters ──

/**
 * Set textContent safely — skips if element not found.
 * @param {string} id
 * @param {string} val
 */
export function safe(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

/**
 * Set innerHTML safely — skips if element not found.
 * @param {string} id
 * @param {string} val
 */
export function safeHTML(id, val) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = val;
}

/**
 * Get .value from an input safely — returns "" if not found.
 * @param {string} id
 * @returns {string}
 */
export function val(id) {
  return (document.getElementById(id) || {}).value?.trim() || "";
}

// ── Toast notification ──

/**
 * Show a brief toast message.
 * Supports optional type: "success" | "error" | "info"
 * @param {string} msg
 * @param {string} [type]
 */
export function showToast(msg, type = "info") {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.className = "toast-msg show" + (type !== "info" ? " toast-" + type : "");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), 2800);
}

// ── Scroll ──

/** Smooth scroll to top of page. */
export function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/**
 * Smooth scroll to a section element.
 * @param {string} selector  – CSS selector
 */
export function scrollTo(selector) {
  const el = document.querySelector(selector);
  if (el) el.scrollIntoView({ behavior: "smooth" });
}

// ── Routing helper ──

/**
 * Navigate to checkout — works from both root and /pages/ context.
 */
export function goToCheckout() {
  const inPages = window.location.pathname.includes("/pages/");
  window.location.href = inPages ? "checkout.html" : "pages/checkout.html";
}

// ── Modal backdrop close helper ──

/**
 * Close a modal when its backdrop is clicked.
 * @param {string} modalId
 * @param {Function} closeFn
 */
export function bindBackdropClose(modalId, closeFn) {
  const el = document.getElementById(modalId);
  if (el) el.addEventListener("click", e => { if (e.target === el) closeFn(); });
}

// ── Re-export to window for non-module + inline HTML handlers ──
Object.assign(window, {
  safe,
  safeHTML,
  val,
  showToast,
  scrollToTop,
  scrollTo,
  goToCheckout,
  bindBackdropClose,
});
