// ============================================================
// core/router.js  –  A3M Print  –  Navigation Helper
// No SPA routing — just smart href helpers for multi-page setup
// ============================================================

// ── Context detection ─────────────────────────────────────────
// Pages live either at root (index.html) or under /pages/

const IN_PAGES = window.location.pathname.includes("/pages/");

/**
 * Resolve a path relative to the root of the project.
 * Works whether the current page is at / or /pages/
 * @param {string} path  e.g. "pages/checkout.html" or "index.html"
 * @returns {string}
 */
export function rootPath(path) {
  return IN_PAGES ? "../" + path : path;
}

/**
 * Navigate to a root-relative path.
 * @param {string} path
 */
export function navigate(path) {
  window.location.href = rootPath(path);
}

// ── Named routes ──────────────────────────────────────────────

export const ROUTES = {
  home:     () => navigate("index.html"),
  checkout: () => navigate("pages/checkout.html"),
  profile:  () => navigate("pages/profile.html"),
  designer: () => navigate("pages/designer.html"),
  success:  () => navigate("pages/success.html"),
  prints:   () => navigate("pages/print-types.html"),
};

// ── Active nav link highlighting ──────────────────────────────

export function highlightActiveNav() {
  const current = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("[data-nav-page]").forEach(el => {
    el.classList.toggle("active", el.getAttribute("data-nav-page") === current);
  });
}

// ── Auto-run on load ──────────────────────────────────────────
document.addEventListener("DOMContentLoaded", highlightActiveNav);

// ── Window exports ────────────────────────────────────────────
Object.assign(window, { navigate, rootPath, ROUTES, highlightActiveNav });
