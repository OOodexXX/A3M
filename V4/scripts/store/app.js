// ============================================================
// core/app.js  –  A3M Print  –  UI Orchestration
// Nav translations, sidebar, modals, order form, category filter
// Depends on: config.js, utils/helpers.js, utils/constants.js
// ============================================================

import { setLang, applyLang } from "./config.js";
import { safe, safeHTML, val, showToast, goToCheckout, bindBackdropClose } from "../utils/helpers.js";
import { LS } from "../utils/constants.js";

// ── State ─────────────────────────────────────────────────────
let isDark = true;

// ── Full language translation ─────────────────────────────────
// Called by config.js via window._applyFullLang hook

function _applyFullLang(lang) {
  const t = window.T?.[lang];
  if (!t) return;

  // ── Nav ──
  const langBtn = document.getElementById("langBtn");
  if (langBtn) langBtn.textContent = `${t.flag} ${t.code} ▾`;
  document.querySelectorAll(".lang-option").forEach((el, i) =>
    el.classList.toggle("active", ["en", "fr", "ar"][i] === lang)
  );

  safe("n-home",    t.home);
  safe("n-products",t.products);
  safe("n-design",  t.design);
  safe("n-contact", t.contact);

  // ── Hero ──
  safe("heroEyebrow",   t.eyebrow);
  safe("heroSub",       t.sub);
  safe("shopNowBtn",    t.shopNow);
  safe("startDesignBtn",  t.startDesign);
  safe("startDesignBtn2", t.startDesign2);

  // ── Banner ──
  const bannerMain = document.getElementById("bannerMain");
  if (bannerMain) bannerMain.innerHTML = t.bannerMain + '<span id="bannerSub"> ' + t.bannerSub + "</span>";

  // ── Section title ──
  const secTitle = document.getElementById("sectionTitle");
  if (secTitle) secTitle.innerHTML = t.secTitle;
  safe("sectionSub", t.secSub);

  // ── CTA buttons ──
  safe("designNowBtn", t.designNow);

  // ── Theme label ──
  const themeLabel = document.getElementById("themeLabel");
  if (themeLabel) themeLabel.textContent = isDark ? t.thDark : t.thLight;

  // ── Category filter buttons ──
  const catBtnMap = {
    "c-all":    t.cAll,
    "c-tshirt": t.cTshirt,
    "c-hoodie": t.cHoodie || "🧥 Hoodies",
    "c-hat":    t.cHat    || "🧢 Caps",
    "c-mug":    t.cMug    || "☕ Mugs",
    "c-bag":    t.cBag,
    "c-laser":  t.cLaser,
    "c-paper":  t.cPaper,
  };
  Object.entries(catBtnMap).forEach(([id, txt]) => { if (txt) safe(id, txt); });

  // ── Mode picker ──
  safe("modePickerSub",   t.modePickerSub);
  safe("modeTemplate",    t.modeTemplate);
  safe("modeTemplateDesc",t.modeTemplateDesc);
  safe("modeScratch",     t.modeScratch);
  safe("modeScratchDesc", t.modeScratchDesc);

  // ── Sidebar ──
  safe("sb-order", t.sbOrder);
  safe("sb-disc",  t.sbDisc || "Discounts");
  safe("orderTitle", t.orderTitle);

  // ── Order form labels ──
  ["fName","fPhone","fEmail","fProduct","fQty","fBudget","fPrintType","fCity","fNotes","submitBtn"]
    .forEach(id => { if (t[id]) safe(id, t[id]); });

  // ── Footer ──
  safe("footerTagline", t.footer);
  safe("footerLinksTitle", t.footerLinksTitle ||
    (lang === "ar" ? "روابط سريعة" : lang === "fr" ? "Liens rapides" : "Quick Links"));
  safe("footerContactTitle", t.footerContactTitle ||
    (lang === "ar" ? "تواصل معنا" : lang === "fr" ? "Nous contacter" : "Contact Us"));
  safe("footerCopy", t.footerCopy ||
    (lang === "ar" ? "© 2024 A3M Print. جميع الحقوق محفوظة." : "© 2024 A3M Print. All rights reserved."));

  const footerLinks     = document.querySelectorAll(".footer-links a");
  const footerLinkTexts = {
    ar: ["🛍️ المنتجات","🎨 تصميم","📋 طلب مخصص","👤 حسابي"],
    en: ["🛍️ Products","🎨 Design","📋 Custom Order","👤 My Account"],
    fr: ["🛍️ Produits","🎨 Créer","📋 Commande","👤 Mon Compte"],
  };
  footerLinks.forEach((a, i) => {
    if (footerLinkTexts[lang]?.[i]) a.textContent = footerLinkTexts[lang][i];
  });

  // ── Trust badges (checkout page) ──
  const trustTexts = {
    ar: ["🔒 دفع آمن","✅ جودة مضمونة","🔄 استرداد سهل","📞 دعم 24/7"],
    en: ["🔒 Secure Payment","✅ Quality Guaranteed","🔄 Easy Returns","📞 24/7 Support"],
    fr: ["🔒 Paiement sécurisé","✅ Qualité garantie","🔄 Retours faciles","📞 Support 24/7"],
  };
  document.querySelectorAll(".trust-badge").forEach((b, i) => {
    if (trustTexts[lang]?.[i]) b.textContent = trustTexts[lang][i];
  });

  // ── Account nav button ──
  const accBtn = document.getElementById("accountNavBtn");
  if (accBtn && !window.currentUser) {
    accBtn.innerHTML = lang === "ar" ? "👤 حساب" : lang === "fr" ? "👤 Compte" : "👤 Account";
  }

  // ── Cart ──
  const cartTitle = document.getElementById("cartTitle");
  if (cartTitle && t.cartTitle) cartTitle.textContent = t.cartTitle;

  // Re-render dynamic content with new language
  window.updateCart?.();
  window.renderProducts?.(window.currentCat || "all");
}

// Register hook for config.js
window._applyFullLang = _applyFullLang;

// ── Theme toggle ──────────────────────────────────────────────

function toggleTheme() {
  isDark = !isDark;
  document.body.classList.toggle("dark",  isDark);
  document.body.classList.toggle("light", !isDark);
  const icon  = document.getElementById("themeIcon");
  const label = document.getElementById("themeLabel");
  if (icon)  icon.textContent = isDark ? "🌙" : "☀️";
  if (label && window.T?.[window.currentLang]) {
    const t = window.T[window.currentLang];
    label.textContent = isDark ? t.thDark : t.thLight;
  }
}

function toggleLangMenu() {
  document.getElementById("langDropdown")?.classList.toggle("open");
}

// ── Sidebar ───────────────────────────────────────────────────

function openSidebar() {
  document.getElementById("sidebar")?.classList.add("open");
  document.getElementById("sidebarOverlay")?.classList.add("open");
}

function closeSidebar() {
  document.getElementById("sidebar")?.classList.remove("open");
  document.getElementById("sidebarOverlay")?.classList.remove("open");
}

function toggleSB(el, subId) {
  el.classList.toggle("open");
  const sub = document.getElementById("sub-" + subId);
  if (sub) sub.style.display = el.classList.contains("open") ? "block" : "none";
}

function filterAndClose(cat) {
  closeSidebar();
  document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
  const btn = document.getElementById("c-" + cat) || document.getElementById("c-all");
  if (btn) btn.classList.add("active");
  window.currentCat = cat;
  window.renderProducts?.(cat);
  document.querySelector(".section")?.scrollIntoView({ behavior: "smooth" });
}

// ── Category filter ───────────────────────────────────────────

function filterCat(cat, el) {
  window.currentCat = cat;
  document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
  if (el) el.classList.add("active");
  const paperSection = document.getElementById("paperSection");
  if (paperSection) paperSection.style.display = cat === "paper" ? "block" : "none";
  window.renderProducts?.(cat);
}

// ── Mode picker ───────────────────────────────────────────────

function openModePicker() {
  document.getElementById("modePicker")?.classList.add("open");
}

function closeModePicker() {
  document.getElementById("modePicker")?.classList.remove("open");
}

// ── Order form ────────────────────────────────────────────────

function openOrderForm() {
  const fc = document.getElementById("formContent");
  const fs = document.getElementById("formSuccess");
  const om = document.getElementById("orderModal");
  if (fc) fc.style.display = "block";
  if (fs) fs.style.display = "none";
  om?.classList.add("open");
  closeSidebar();
}

function closeOrderForm() {
  document.getElementById("orderModal")?.classList.remove("open");
}

function openOrderFromDesign() {
  window.closeDesigner?.();
  openOrderForm();
}

function submitOrder() {
  const name    = val("inp-name");
  const phone   = val("inp-phone");
  const product = val("inp-product");
  const qty     = val("inp-qty");
  if (!name || !phone || !product || !qty) {
    showToast("⚠️ Please fill required fields");
    return;
  }
  const fc = document.getElementById("formContent");
  const fs = document.getElementById("formSuccess");
  if (fc) fc.style.display = "none";
  if (fs) fs.style.display = "block";
  const t = window.T?.[window.currentLang];
  if (t) {
    safe("successTitle", t.successTitle);
    safe("successMsg",   t.successMsg);
  }
}

// ── Print info ────────────────────────────────────────────────

function showPrint(type) {
  if (!window.PRINTS?.[type]) return;
  const lang = window.currentLang in window.PRINTS[type] ? window.currentLang : "en";
  showToast(window.PRINTS[type][lang].substring(0, 60) + "...");
  setTimeout(() => alert(window.PRINTS[type][lang]), 100);
}

// ── Init ──────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  // Load saved lang — delay 50ms so data.js can populate window.T first
  const savedLang = localStorage.getItem(LS.LANG) || "ar";
  setTimeout(() => applyLang(savedLang), 50);

  // Close lang dropdown on outside click
  document.addEventListener("click", e => {
    if (!e.target.closest(".lang-wrapper")) {
      document.getElementById("langDropdown")?.classList.remove("open");
    }
  });

  // Backdrop close bindings
  bindBackdropClose("prodModal",    () => window.closeProdModal?.());
  bindBackdropClose("accountModal", () => window.closeAccount?.());
  bindBackdropClose("orderModal",   closeOrderForm);
  bindBackdropClose("modePicker",   closeModePicker);
});

// ── Window exports ────────────────────────────────────────────
Object.assign(window, {
  toggleTheme,
  toggleLangMenu,
  openSidebar,
  closeSidebar,
  toggleSB,
  filterAndClose,
  filterCat,
  openModePicker,
  closeModePicker,
  openOrderForm,
  closeOrderForm,
  openOrderFromDesign,
  submitOrder,
  showPrint,
  goToCheckout,
  showToast,
});

export {};
