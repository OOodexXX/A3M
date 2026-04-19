// ============================================================
// data.js  –  A3M Print  –  يقرأ البيانات من ملفات JSON
// ============================================================

async function loadData() {
  const [PD, PAPERS, BL, T, PRINTS] = await Promise.all([
    fetch('./data/products.json').then(r => r.json()),
    fetch('./data/papers.json').then(r => r.json()),
    fetch('./data/badges.json').then(r => r.json()),
    fetch('./data/translations.json').then(r => r.json()),
    fetch('./data/prints.json').then(r => r.json()),
  ]);

  // PROD_IMGS و SOCIAL_ICONS لا تزال في ملف منفصل أو inline
  // (الصور base64 ثقيلة — يُفضَّل تركها في ملف images.js مستقل)
  const PROD_IMGS   = window.PROD_IMGS   || {};
  const SOCIAL_ICONS = window.SOCIAL_ICONS || {};

  // ── Expose globals (متوافق مع cart.js) ──────────────────
  window.PD          = PD;
  window.PAPERS      = PAPERS;
  window.BL          = BL;
  window.T           = T;
  window.PRINTS      = PRINTS;
  window.PROD_IMGS   = PROD_IMGS;
  window.SOCIAL_ICONS = SOCIAL_ICONS;

  window.PRODUCTS = PD.map(p => ({
    id:           p.id,
    name:         p.emoji + ' ' + p.id,
    price:        p.price,
    category:     p.cat,
    image:        (PROD_IMGS[p.id] ? PROD_IMGS[p.id][0] : ''),
    qualityAlert: false,
    sizes:        p.sizes || [],
    emoji:        p.emoji,
    old:          p.old,
    badge:        p.badge,
    bt:           p.bt
  }));

  // أطلق حدث يعلم بقية السكريبتات أن البيانات جاهزة
  document.dispatchEvent(new Event('dataReady'));
}

loadData();
