// ============================================================
// data/data-loader.js  –  A3M Print
// يقرأ ملفات JSON ويعبّي window.PD, window.T, window.BL, ...
// يُحمَّل كـ <script type="module"> في index.html
// ============================================================

// مسار مجلد data — يتكيّف تلقائياً حسب موقع الصفحة
const IN_PAGES = window.location.pathname.includes("/pages/");
const DATA_BASE = IN_PAGES ? "../scripts/data/" : "scripts/data/";

async function fetchJSON(filename) {
  const res = await fetch(DATA_BASE + filename);
  if (!res.ok) throw new Error(`Failed to load ${filename}: ${res.status}`);
  return res.json();
}

async function loadAllData() {
  try {
    const [products, translations, badges, papers, prints] = await Promise.all([
      fetchJSON("products.json"),
      fetchJSON("translations.json"),
      fetchJSON("badges.json"),
      fetchJSON("papers.json"),
      fetchJSON("prints.json"),
    ]);

    // ── PD: مصفوفة المنتجات ──────────────────────────────────
    window.PD = products;

    // ── T: الترجمات (prods تبقى array كما هي) ────────────────
    window.T = translations;

    // ── BL: الـ badges ────────────────────────────────────────
    window.BL = badges;

    // ── PAPERS: أحجام الورق ──────────────────────────────────
    window.PAPERS = papers;

    // ── PRINTS: أنواع الطباعة ────────────────────────────────
    window.PRINTS = prints;

    // ── PROD_IMGS: بناء الصور من products.json ───────────────
    // كل منتج فيه "imgs" مباشرة — نبنيها كـ object مفتاحه الـ id
    window.PROD_IMGS = {};
    products.forEach(p => {
      if (p.imgs && p.imgs.length) {
        window.PROD_IMGS[p.id] = p.imgs;
      }
    });

    // ── window.PRODUCTS (للتوافق مع cart.js القديم) ──────────
    window.PRODUCTS = products.map(p => ({
      id:    p.id,
      name:  p.emoji + " " + p.id,
      price: p.price,
      category: p.cat,
      image: p.imgs?.[0] || "",
      qualityAlert: false,
      sizes:  p.sizes || [],
      emoji:  p.emoji,
      old:    p.old,
      badge:  p.badge,
      bt:     p.bt,
    }));

    // ── أطلق event: البيانات جاهزة ────────────────────────────
    window.dispatchEvent(new Event("a3m-data-ready"));
    console.log("✦ A3M data loaded:", products.length, "products");

    // ── طبّق اللغة المحفوظة بعد تحميل البيانات ───────────────
    const savedLang = localStorage.getItem("a3m_lang") || "ar";
    if (typeof window.applyLang === "function") {
      window.applyLang(savedLang);
    }

    // ── ارسم المنتجات ─────────────────────────────────────────
    if (typeof window.renderProducts === "function") {
      window.renderProducts(window.currentCat || "all");
    }

  } catch (err) {
    console.error("✕ A3M data load error:", err);
  }
}

// تحميل فوري
loadAllData();
