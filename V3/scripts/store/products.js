// ============================================================
// store/products.js  –  A3M Print  –  Product rendering
// البيانات (PD، PAPERS، T، BL، PROD_IMGS) تيجي من data.js عبر window
// هذا الملف يحمّل بعد data.js في ترتيب التحميل
// ============================================================

import { fmtPrice, disc } from "./utils/formatters.js";

// ════════════════════════════════════════════════════════════
// RENDER PRODUCTS GRID
// ════════════════════════════════════════════════════════════

function renderProducts(cat) {
  if (cat !== undefined) window.currentCat = cat;
  const useCat = window.currentCat || "all";
  const PD = window.PD;
  const t  = window.T?.[window.currentLang || "en"];
  const bl = window.BL?.[window.currentLang || "en"];
  if (!PD || !t) { setTimeout(() => renderProducts(useCat), 100); return; }

  const paperSection = document.getElementById("paperSection");
  const grid = document.getElementById("grid");
  if (!grid) return;

  if (useCat === "paper") {
    if (paperSection) paperSection.style.display = "block";
    grid.innerHTML = "";
    renderPaper();
    return;
  }
  if (paperSection) paperSection.style.display = "none";

  const CAT_ALIASES = { hat: ["hat","cap"], mug: ["mug","mugs"] };
  const matchCat = (p) => {
    if (useCat === "all") return true;
    const aliases = CAT_ALIASES[useCat] || [useCat];
    return aliases.includes(p.cat);
  };

  const list = PD.filter(matchCat);
  grid.innerHTML = list.map(p => {
    const info   = t.prods?.[p.id] || { n: p.emoji, s: "", desc: "" };
    const onSale = p.old > 0;
    const d      = disc(p.price, p.old);
    const bTxt   = p.badge && bl ? (bl[p.badge] || "") : "";
    return `<div class="product-card${onSale ? " on-sale" : ""}" onclick="openProdModal(${p.id})">
      <div class="product-img">
        <span style="font-size:4rem">${p.emoji}</span>
        ${bTxt ? `<div class="badge ${p.bt}">${bTxt}</div>` : ""}
      </div>
      <div class="product-info">
        <div class="product-name">${info.n}</div>
        <div class="product-sub">${info.s}</div>
        <div class="stars">★★★★★</div>
        <div class="product-footer">
          <div>
            ${onSale ? `<span class="discount-tag">-${d}</span><span class="product-old-price"> ${fmtPrice(p.old)}</span>` : ""}
            <span class="product-price"> ${fmtPrice(p.price)}</span>
          </div>
          <button class="add-btn" onclick="event.stopPropagation();quickAdd(${p.id})">
            🛒 ${t.addToCartShort || "ADD"}
          </button>
        </div>
      </div>
    </div>`;
  }).join("");

  setTimeout(applyRealImages, 30);
}

// ════════════════════════════════════════════════════════════
// RENDER PAPER SECTION
// ════════════════════════════════════════════════════════════

function renderPaper() {
  const t  = window.T?.[window.currentLang || "en"];
  const PA = window.PAPERS;
  if (!t || !PA) return;
  const paperSub = document.getElementById("paperSub");
  if (paperSub) paperSub.textContent = t.paperSub || "";
  const paperGrid = document.getElementById("paperGrid");
  if (!paperGrid) return;
  paperGrid.innerHTML = PA.map(p => `
    <div class="paper-card">
      <div style="position:absolute;top:.7rem;right:.7rem;opacity:.1;font-size:1.8rem">${p.icon}</div>
      <div class="paper-size">${p.size}</div>
      <div class="paper-dims">${p.dims}</div>
      <div class="paper-use">${p.use}</div>
      <div class="paper-price">${fmtPrice(p.price)}</div>
      <button class="paper-order-btn" onclick="addPaperToCart('${p.size}',${p.price})">
        ${t.orderPaper || "Order"}
      </button>
    </div>`).join("");
}

// ════════════════════════════════════════════════════════════
// SWAP REAL IMAGES INTO GRID
// ════════════════════════════════════════════════════════════

function applyRealImages() {
  document.querySelectorAll(".product-card").forEach(card => {
    const m = (card.getAttribute("onclick") || "").match(/openProdModal\((\d+)\)/);
    if (!m) return;
    const id   = parseInt(m[1]);
    const imgs = window.PROD_IMGS?.[id];
    if (imgs) {
      const sp = card.querySelector(".product-img span");
      if (sp) {
        const img = document.createElement("img");
        img.src = imgs[0]; img.className = "prod-img-thumb"; img.alt = "";
        sp.replaceWith(img);
      }
    }
  });
}

// ════════════════════════════════════════════════════════════
// EXPOSE TO WINDOW
// ════════════════════════════════════════════════════════════

window.renderProducts  = renderProducts;
window.renderPaper     = renderPaper;
window.applyRealImages = applyRealImages;

export { renderProducts, renderPaper };
