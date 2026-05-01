// ============================================================
// scripts/ui/theme-picker.js  —  A3M Print
// Theme Color/Mode Picker — nspPickColor, nspPickMode, nspPickLang, nspPickCur
// ============================================================

// Theme color/mode picker
  let _themeColor = (localStorage.getItem("a3m_theme") || "blue-dark").replace(/-dark$|-light$/,"");
  let _themeMode  = (localStorage.getItem("a3m_theme") || "blue-dark").includes("light") ? "light" : "dark";

  // ── Hero rotating taglines ──
  const ROTATING_LINES_DATA = {
    en: [
      { main: "Ink your vision", gold: "wear your story" },
      { main: "Print your ideas", gold: "make them real" },
      { main: "Print ur brand", gold: "own your style" },
      { main: "Wear your story", gold: "bold & unstoppable" }
    ],
    ar: [
      { main: "اطبع أفكارك", gold: "اصنع واقعك" },
      { main: "صمّم بحرية", gold: "اطبع بجودة" },
      { main: "علامتك التجارية", gold: "تستحق الأفضل" },
      { main: "ابدأ تصميمك", gold: "نطبع لك الآن" }
    ],
    fr: [
      { main: "Imprime tes idées", gold: "vis ton histoire" },
      { main: "Crée ta marque", gold: "porte ton style" },
      { main: "Exprime-toi", gold: "imprime ta vision" },
      { main: "Personnalise tout", gold: "sois unique" }
    ]
  };

  let _currentRotIdx = 0;
  let _rotInterval = null;

  function buildRotLineHTML(lang, lineIdx) {
    const lines = ROTATING_LINES_DATA[lang] || ROTATING_LINES_DATA["en"];
    const line = lines[lineIdx % lines.length];
    const mainChars = line.main.split("").map(c =>
      c === " " ? `<span class="tagline-char"> </span>` : `<span class="tagline-char accent-char">${c}</span>`
    ).join("");
    const goldChars = line.gold.split("").map(c =>
      c === " " ? `<span class="tagline-char"> </span>` : `<span class="tagline-char gold-char">${c}</span>`
    ).join("");
    return mainChars + `<span class="tagline-sep"> — </span>` + goldChars;
  }

  function animateTagChars(container) {
    container.querySelectorAll(".tagline-char").forEach((el, i) => {
      el.style.animation = "none";
      void el.offsetWidth;
      el.style.animationDelay = (0.03 + i * 0.032) + "s";
      el.style.animation = "";
    });
  }

  function startRotatingTaglines(lang) {
    clearInterval(_rotInterval);
    const enEl = document.getElementById("heroTaglineEn");
    const arEl = document.getElementById("heroTaglineAnimated");
    if (!enEl || !arEl) return;
    arEl.style.display = "none";
    enEl.style.display = "flex";
    const lines = ROTATING_LINES_DATA[lang] || ROTATING_LINES_DATA["en"];
    _currentRotIdx = 0;
    enEl.innerHTML = `<span class="rotating-line active">${buildRotLineHTML(lang, 0)}</span>`;
    animateTagChars(enEl);
    _rotInterval = setInterval(() => {
      _currentRotIdx = (_currentRotIdx + 1) % lines.length;
      const cur = enEl.querySelector(".rotating-line");
      if (cur) cur.classList.add("rt-fade-out");
      setTimeout(() => {
        enEl.innerHTML = `<span class="rotating-line active">${buildRotLineHTML(lang, _currentRotIdx)}</span>`;
        animateTagChars(enEl);
      }, 500);
    }, 4000);
  }

  function updateHeroTagline(lang) { startRotatingTaglines(lang); }

  // ── Sidebar translation ──
  function translateSidebar(lang) {
    document.querySelectorAll(".sb-t").forEach(el => {
      const val = el.getAttribute("data-" + lang) || el.getAttribute("data-en");
      if (val) el.textContent = val;
    });
    const disc = document.getElementById("sb-disc");
    if (disc) disc.textContent = lang==="ar"?"الخصومات":lang==="fr"?"Réductions":"Discounts";
    const order = document.getElementById("sb-order");
    if (order) order.textContent = lang==="ar"?"نموذج الطلب":lang==="fr"?"Formulaire":"Order Form";
  }

  // ── Complete i18n translation table ──
  const NAV_EXTRAS = {
    ar: {
      account:"👤 حساب", design:"🎨 صمّم", cart:"🛒 السلة", empty:"السلة فارغة",
      checkout:"إتمام الطلب →", total:"المجموع",
      home:"الرئيسية", products:"المنتجات", contact:"تواصل",
      shopNow:"تسوّق الآن", startDesign:"🎨 ابدأ التصميم",
      sectionSub:"المجموعة البريميوم",
      bannerTitle:"صمّم قطعتك الخاصة", bannerSub:"ارفع تصميمك — نطبع ونوصّل", bannerBtn:"ابدأ التصميم →",
      heroSub:"طباعة احترافية على التيشرتات والأكواب والقبعات والحقائب وأكثر.",
      footerTagline:"Premium Print Studio — نطبع أحلامك على الواقع",
      ftLinks:"روابط سريعة", ftContact:"تواصل معنا", ftRights:"جميع الحقوق محفوظة", ftLoc:"الجزائر",
      // Showcase sections
      capsLabel:"🧢 تشكيلة الكابات", capsSTitle:`كابات <span class="r">مخصصة</span> <span class="g">& قبعات</span>`,
      capsSSub:"كابات بيسبول، باكيت هات وأكثر — كلها قابلة للتخصيص بعلامتك أو تصميمك",
      capsViewAll:"عرض كل الكابات →",
      mugsLabel:"☕ تشكيلة الأكواب", mugsSTitle:`أكواب <span class="r">مخصصة</span> <span class="g">& كوبايات</span>`,
      mugsLabel:"☕ تشكيلة الأكواب", mugsSSub:"أكواب سيراميك، ترمو، ستاربكس — اطبع شعارك أو صورتك أو تصميمك على أي سطح",
      mugsViewAll:"عرض كل الأكواب →",
      stampsLabel:"🔏 الأختام & الأكتاب", stampsSTitle:`أختام <span class="r">مخصصة</span> <span class="g">& أكتاب</span>`,
      stampsLabel:"🔏 الأختام & الأكتاب", stampsSSub:"أختام ذاتية الحبر، أختام شمع، أختام مطاطية — مخصصة بشعارك أو توقيعك",
      stampsViewAll:"اطلب ختمًا مخصصًا →", stampsOrderNow:"اطلب الآن",
      hoodiesLabel:"🧥 تشكيلة الهوديات", hoodiesSTitle:`هوديات <span class="r">مخصصة</span> <span class="g">& سويتشيرت</span>`,
      hoodiesSSub:"هوديات بريميوم بطباعة أمامية أو خلفية — مثالية للفرق والمناسبات",
      hoodiesViewAll:"عرض كل الهوديات →",
      bagsLabel:"👜 تشكيلة الحقائب", bagsSTitle:`حقائب <span class="r">مخصصة</span> <span class="g">& باكات</span>`,
      bagsSSub:"توت باغ، باك باك، حقائب هدايا — اطبع علامتك على كل سطح",
      bagsViewAll:"عرض كل الحقائب →",
      // Bag items
      b1n:"توت باغ", b1t:"قماش قطني · طبيعي", b1d:"مثالية للاستخدام اليومي — اطبع أي تصميم أو شعار",
      b2n:"باك باك", b2t:"طباعة سابليميشن", b2d:"طباعة شاملة — مثالية للمدارس والمناسبات",
      b3n:"صندوق هدايا", b3t:"تغليف مخصص", b3d:"تغليف احترافي للمنتجات والهدايا الشركاتية",
      b4n:"كيس تسوق", b4t:"بولي · صديق للبيئة", b4d:"أكياس صديقة للبيئة للمحلات والمقاهي",
      // Hoodie items
      h1n:"أسود أوربان", h1t:"هودي يونيسكس", h2n:"نايت فايب", h2t:"هودي أوفرسايز",
      h3n:"تيل إلكتريك", h3t:"هودي زيبر", h4n:"آرت دروب", h4t:"إصدار محدود",
      // PS overlay
      psMode1Title:"قوالب جاهزة", psMode1Desc:"ابدأ من تصميم احترافي جاهز وخصّصه كيف تريد بسهولة",
      psMode2Title:"من الصفر", psMode2Desc:"تحكم كامل بأبعاد اللوحة وكل تفاصيلها",
    },
    en: {
      account:"👤 Account", design:"🎨 Design", cart:"🛒 Cart", empty:"Cart is empty",
      checkout:"Checkout →", total:"Total",
      home:"Home", products:"Products", contact:"Contact",
      shopNow:"Shop Now", startDesign:"🎨 Start Designing",
      sectionSub:"The Premium Collection",
      bannerTitle:"Design your own piece — completely custom", bannerSub:"Upload your design or type your text — we print & deliver professionally", bannerBtn:"Start Designing →",
      heroSub:"Professional printing on T-Shirts, Mugs, Caps, Bags and more.",
      footerTagline:"Premium Print Studio — We ink your vision into reality",
      ftLinks:"Quick Links", ftContact:"Contact Us", ftRights:"All rights reserved", ftLoc:"Algeria, DZ",
      capsLabel:"🧢 CAPS COLLECTION", capsSTitle:`Custom <span class="r">Caps</span> <span class="g">& Hats</span>`,
      capsSSub:"Baseball caps, bucket hats, and more — all fully customizable with your brand or design",
      capsViewAll:"View All Caps →",
      mugsLabel:"☕ MUGS COLLECTION", mugsSTitle:`Custom <span class="r">Mugs</span> <span class="g">& Cups</span>`,
      mugsLabel:"☕ MUGS COLLECTION", mugsSSub:"Ceramic mugs, travel cups, and Starbucks-style — print your logo, photo or design on any surface",
      mugsViewAll:"View All Mugs →",
      stampsLabel:"🔏 STAMPS & SEALS", stampsSTitle:`Custom <span class="r">Stamps</span> <span class="g">& Seals</span>`,
      stampsLabel:"🔏 STAMPS & SEALS", stampsSSub:"Self-inking stamps, wax seals, rubber stamps — personalized with your logo or signature",
      stampsViewAll:"Request a Custom Stamp →", stampsOrderNow:"Order Now",
      hoodiesLabel:"🧥 HOODIES COLLECTION", hoodiesSTitle:`Custom <span class="r">Hoodies</span> <span class="g">& Sweats</span>`,
      hoodiesSSub:"Premium hoodies with full-front, back or sleeve print — perfect for teams and street fashion",
      hoodiesViewAll:"View All Hoodies →",
      bagsLabel:"👜 BAGS COLLECTION", bagsSTitle:`Custom <span class="r">Bags</span> <span class="g">& Packs</span>`,
      bagsSSub:"Tote bags, backpacks, and packaging — print your brand, logo or artwork on every surface",
      bagsViewAll:"View All Bags →",
      b1n:"Tote Bag", b1t:"Cotton Canvas · Natural", b1d:"Perfect for everyday use — print any design or logo",
      b2n:"Backpack", b2t:"Sublimation Print", b2d:"Full-coverage print — ideal for schools and events",
      b3n:"Gift Box", b3t:"Custom Packaging", b3d:"Branded packaging for products and corporate gifts",
      b4n:"Shopping Bag", b4t:"Non-Woven · Eco", b4d:"Eco-friendly bags for retail, cafés and events",
      h1n:"Urban Black", h1t:"Unisex Hoodie", h2n:"Night Vibe", h2t:"Oversized Hoodie",
      h3n:"Electric Teal", h3t:"Zip-Up Hoodie", h4n:"Art Drop", h4t:"Limited Edition",
      psMode1Title:"Ready Templates", psMode1Desc:"Start from a professional design and customize it easily",
      psMode2Title:"From Scratch", psMode2Desc:"Full control over canvas dimensions and every detail",
    },
    fr: {
      account:"👤 Compte", design:"🎨 Créer", cart:"🛒 Panier", empty:"Panier vide",
      checkout:"Commander →", total:"Total",
      home:"Accueil", products:"Produits", contact:"Contact",
      shopNow:"Acheter", startDesign:"🎨 Créer",
      sectionSub:"La Collection Premium",
      bannerTitle:"Créez votre pièce personnalisée", bannerSub:"Importez votre design — on imprime et livre", bannerBtn:"Commencer →",
      heroSub:"Impression professionnelle sur T-Shirts, Tasses, Casquettes et plus.",
      footerTagline:"Studio d'impression premium — Vos rêves imprimés",
      ftLinks:"Liens Rapides", ftContact:"Contactez-nous", ftRights:"Tous droits réservés", ftLoc:"Algérie",
      capsLabel:"🧢 COLLECTION CASQUETTES", capsSTitle:`<span class="r">Casquettes</span> <span class="g">Personnalisées</span>`,
      capsSSub:"Casquettes baseball, chapeaux et plus — tous personnalisables avec votre marque",
      capsViewAll:"Voir toutes les casquettes →",
      mugsLabel:"☕ COLLECTION TASSES", mugsSTitle:`<span class="r">Tasses</span> <span class="g">Personnalisées</span>`,
      mugsLabel:"☕ COLLECTION TASSES", mugsSSub:"Tasses céramique, thermos, style Starbucks — imprimez votre logo sur toute surface",
      mugsViewAll:"Voir toutes les tasses →",
      stampsLabel:"🔏 TAMPONS & SCEAUX", stampsSTitle:`<span class="r">Tampons</span> <span class="g">Personnalisés</span>`,
      stampsLabel:"🔏 TAMPONS & SCEAUX", stampsSSub:"Tampons encreurs, sceaux de cire, tampons caoutchouc — personnalisés avec votre logo",
      stampsViewAll:"Demander un tampon →", stampsOrderNow:"Commander",
      hoodiesLabel:"🧥 COLLECTION HOODIES", hoodiesSTitle:`<span class="r">Hoodies</span> <span class="g">Personnalisés</span>`,
      hoodiesSSub:"Hoodies premium avec impression totale — parfaits pour équipes et mode streetwear",
      hoodiesViewAll:"Voir tous les hoodies →",
      bagsLabel:"👜 COLLECTION SACS", bagsSTitle:`<span class="r">Sacs</span> <span class="g">Personnalisés</span>`,
      bagsSSub:"Tote bags, sacs à dos, emballages — imprimez votre marque sur chaque surface",
      bagsViewAll:"Voir tous les sacs →",
      b1n:"Tote Bag", b1t:"Coton Canvas · Naturel", b1d:"Parfait pour le quotidien — imprimez tout design",
      b2n:"Sac à Dos", b2t:"Impression Sublimation", b2d:"Impression totale — idéal pour écoles et événements",
      b3n:"Boîte Cadeau", b3t:"Emballage Personnalisé", b3d:"Emballage de marque pour cadeaux corporate",
      b4n:"Sac Shopping", b4t:"Non-Tissé · Éco", b4d:"Sacs écologiques pour commerces et cafés",
      h1n:"Noir Urbain", h1t:"Hoodie Unisexe", h2n:"Night Vibe", h2t:"Hoodie Oversize",
      h3n:"Teal Électrique", h3t:"Hoodie Zippé", h4n:"Art Drop", h4t:"Édition Limitée",
      psMode1Title:"Modèles Prêts", psMode1Desc:"Commencez avec un design professionnel et personnalisez-le",
      psMode2Title:"De Zéro", psMode2Desc:"Contrôle total sur les dimensions et les détails",
    },
  };

  function applyNavExtras(lang) {
    const t = NAV_EXTRAS[lang] || NAV_EXTRAS["en"];
    const safe    = (id, val) => { if(!val) return; const el = document.getElementById(id); if (el) el.textContent = val; };
    const safeHtml= (id, val) => { if(!val) return; const el = document.getElementById(id); if (el) el.innerHTML = val; };

    // Nav & cart
    safe("accountNavBtn", t.account); safe("designNowBtn", t.design);
    safe("cartTitle", t.cart);
    const emptyEl = document.querySelector(".cart-empty");
    if (emptyEl) emptyEl.textContent = t.empty;
    const checkoutBtn = document.getElementById("checkoutBtn");
    if (checkoutBtn) checkoutBtn.textContent = t.checkout;
    const totalLabel = document.getElementById("cartTotalLabel");
    if (totalLabel) totalLabel.textContent = t.total;

    // Nav links
    safe("n-home", t.home); safe("n-products", t.products); safe("n-contact", t.contact);

    // Hero & banner
    safe("shopNowBtn", t.shopNow); safe("startDesignBtn", t.startDesign); safe("startDesignBtn2", t.bannerBtn);
    safe("heroSub", t.heroSub); safe("bannerTitle", t.bannerTitle); safe("bannerSub", t.bannerSub);

    // Section titles
    safe("sectionSub", t.sectionSub);
    safeHtml("sectionTitle", lang==="ar"
      ? `منتجاتنا <span class="r">المميزة</span> <span class="g">✦</span>`
      : lang==="fr"
      ? `Notre <span class="r">Collection</span> <span class="g">Premium ✦</span>`
      : `Our <span class="r">Premium</span> <span class="g">Collection ✦</span>`);

    // Footer
    safe("footerTagline", t.footerTagline);
    safe("ft-links-title", t.ftLinks); safe("ft-contact-title", t.ftContact);
    safe("ft-rights", t.ftRights); safe("fc-loc", t.ftLoc);
    document.querySelectorAll(".ft-t").forEach(el => {
      const val = el.getAttribute("data-" + lang) || el.getAttribute("data-en");
      if (val) el.textContent = val;
    });

    // Showcase sections
    safe("capsLabel", t.capsLabel); safeHtml("capsSTitle", t.capsSTitle); safe("capsSSub", t.capsSSub);
    const capsViewAll = document.querySelector("#capsShowcase .btn-primary");
    if (capsViewAll) capsViewAll.textContent = t.capsViewAll;
    safe("mugsLabel", t.mugsLabel); safeHtml("mugsSTitle", t.mugsSTitle); safe("mugsSSub", t.mugsSSub);
    const mugsViewAll = document.querySelector("#mugsShowcase .btn-primary");
    if (mugsViewAll) mugsViewAll.textContent = t.mugsViewAll;
    safe("stampsLabel", t.stampsLabel); safeHtml("stampsSTitle", t.stampsSTitle); safe("stampsSSub", t.stampsSSub);
    const stampsViewAll = document.querySelector("#stampsShowcase > div:last-child .btn-primary");
    if (stampsViewAll) stampsViewAll.textContent = t.stampsViewAll;
    document.querySelectorAll(".stamp-btn").forEach(b => b.textContent = t.stampsOrderNow);
    safe("hoodiesLabel", t.hoodiesLabel); safeHtml("hoodiesSTitle", t.hoodiesSTitle); safe("hoodiesSSub", t.hoodiesSSub);
    safe("hoodiesViewAll", t.hoodiesViewAll);
    safe("bagsLabel", t.bagsLabel); safeHtml("bagsSTitle", t.bagsSTitle); safe("bagsSSub", t.bagsSSub);
    safe("bagsViewAll", t.bagsViewAll);
    // Bag & hoodie item names
    ["b1n","b1t","b1d","b2n","b2t","b2d","b3n","b3t","b3d","b4n","b4t","b4d",
     "h1n","h1t","h2n","h2t","h3n","h3t","h4n","h4t"].forEach(id => safe(id, t[id]));
    // Stamp names
    safe("st1n", lang==="ar"?"ختم ذاتي الحبر":lang==="fr"?"Tampon Encreur":"Self-Inking Stamp");
    safe("st2n", lang==="ar"?"ختم دائري":lang==="fr"?"Sceau Rond":"Round Seal Stamp");
    safe("st3n", lang==="ar"?"ختم شمع":lang==="fr"?"Sceau de Cire":"Wax Seal Stamp");
    safe("st4n", lang==="ar"?"ختم مطاطي مخصص":lang==="fr"?"Tampon Caoutchouc":"Custom Rubber Stamp");

    // Category filter buttons
    const catMap = {
      "c-all":    {ar:"✦ الكل",      en:"✦ All",        fr:"✦ Tout"},
      "c-tshirt": {ar:"👕 تيشرتات",  en:"👕 T-Shirts",   fr:"👕 T-Shirts"},
      "c-hoodie": {ar:"🧥 هوديات",   en:"🧥 Hoodies",    fr:"🧥 Hoodies"},
      "c-hat":    {ar:"🧢 كابات",    en:"🧢 Caps",       fr:"🧢 Casquettes"},
      "c-mug":    {ar:"☕ أكواب",    en:"☕ Mugs",       fr:"☕ Tasses"},
      "c-bag":    {ar:"👜 حقائب",   en:"👜 Bags",       fr:"👜 Sacs"},
      "c-laser":  {ar:"🔑 إكسسوارات",en:"🔑 Accessories",fr:"🔑 Accessoires"},
      "c-paper":  {ar:"📄 أوراق",   en:"📄 Paper",      fr:"📄 Papier"},
    };
    Object.entries(catMap).forEach(([id, vals]) => safe(id, vals[lang] || vals.en));

    // html dir
    document.documentElement.lang = lang;
    document.documentElement.dir = lang==="ar" ? "rtl" : "ltr";
    translateSidebar(lang);
  }

  // ── Missing: openOrderFromDesign (called from designer topbar "اطلب" button) ──
  window.openOrderFromDesign = function() {
    if (typeof closeDesignerModal === 'function') closeDesignerModal();
    if (typeof openOrderForm === 'function') openOrderForm();
  };

  // Patch setLang
  document.addEventListener("DOMContentLoaded", function() {
    if (!localStorage.getItem('a3m_lang')) localStorage.setItem('a3m_lang', 'ar');
    const storedLang = localStorage.getItem("a3m_lang") || "ar";
    setTimeout(() => { updateHeroTagline(storedLang); applyNavExtras(storedLang); }, 350);
    const _origSetLang = window.setLang;
    window.setLang = function(lang) {
      localStorage.setItem('a3m_lang', lang);
      if (_origSetLang) _origSetLang(lang);
      updateHeroTagline(lang);
      applyNavExtras(lang);
      if (typeof window.translateDesignerUI === "function") window.translateDesignerUI();
    };
  });

  function setThemeColor(color) {
    _themeColor = color;
    if (typeof setTheme === "function") setTheme(_themeColor + "-" + _themeMode);
    _updateThemeButtons();
    document.getElementById("themeDropdown").classList.remove("open");
  }
  function setThemeMode(mode) {
    _themeMode = mode;
    if (typeof setTheme === "function") setTheme(_themeColor + "-" + _themeMode);
    _updateThemeButtons();
  }
  function toggleThemeMenu() {
    document.getElementById("themeDropdown").classList.toggle("open");
  }
  function _updateThemeButtons() {
    const dark = document.getElementById("modeDarkBtn");
    const light = document.getElementById("modeLightBtn");
    if (dark)  dark.classList.toggle("active",  _themeMode === "dark");
    if (light) light.classList.toggle("active", _themeMode === "light");
    const icon = document.getElementById("themeIcon");
    if (icon) icon.textContent = _themeMode === "dark" ? "🌙" : "☀️";
  }
  // Close theme dropdown on outside click
  document.addEventListener("click", function(e) {
    const wrapper = document.getElementById("themeWrapper");
    if (wrapper && !wrapper.contains(e.target)) {
      const dd = document.getElementById("themeDropdown");
      if (dd) dd.classList.remove("open");
    }
  });
  // Init theme buttons state
  document.addEventListener("DOMContentLoaded", function() {
    _updateThemeButtons();
    // Inject social icons from SOCIAL_ICONS (defined in data.js)
    function injectSocials() {
      if (!window.SOCIAL_ICONS) { setTimeout(injectSocials, 200); return; }
      const socials = [
        {key:"instagram", href:"#", title:"Instagram"},
        {key:"facebook",  href:"#", title:"Facebook"},
        {key:"whatsapp",  href:"#", title:"WhatsApp"},
        {key:"telegram",  href:"#", title:"Telegram"},
        {key:"viber",     href:"#", title:"Viber"},
        {key:"gmail",     href:"#", title:"Gmail"},
      ];
      const makeBtn = (s) => {
        const a = document.createElement("a");
        a.className = "social-btn-img"; a.href = s.href; a.title = s.title;
        a.target = "_blank"; a.rel = "noopener";
        if (window.SOCIAL_ICONS[s.key]) {
          const img = document.createElement("img");
          img.src = window.SOCIAL_ICONS[s.key];
          img.alt = s.title; img.style.cssText = "width:100%;height:100%;object-fit:contain;border-radius:10px";
          a.appendChild(img);
        } else {
          a.textContent = s.title[0];
        }
        return a;
      };
      const containers = ["footerSocialMain"];
      containers.forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.innerHTML = ""; socials.forEach(s => el.appendChild(makeBtn(s))); }
      });
    }
    injectSocials();
  });
