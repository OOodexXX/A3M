// ================================================================
//  ai.js — A3M Print — A3M Bot v4.0
//  ✅ v4 FEATURES:
//  1. 📌 Draggable — ضغط مطوّل يفعّل السحب
//  2. 🧠 Personalization Engine — يتعلم اهتمامات المستخدم
//  3. 🎯 Smart Recommendations — اقتراحات مخصصة لكل شخص
//  4. 💡 Proactive nudges — يبادر بعروض حسب السلوك
//  5. 🔥 Enhanced local AI — ردود أذكى وأشمل
//  6. ⭐ Sentiment & intent detection
//  7. 📊 Behavioral tracking (clicks, views, time)
// ================================================================
(function () {
  "use strict";

  const DEFAULT_MODEL   = "claude-sonnet-4-20250514";
  const BOT_NAME        = "A3M Bot";
  const FALLBACK_EMOJI  = "🤖";
  const MAX_SAVED_CHATS = 8;
  const VERSION         = "4.0";
  let _robotSrc = null;

  // ════════════════════════════════════════════════════════════
  // 🧠 PERSONALIZATION ENGINE
  // ════════════════════════════════════════════════════════════

  const Profile = {
    _data: null,

    load() {
      if (this._data) return this._data;
      try {
        this._data = JSON.parse(localStorage.getItem("a3m_user_profile") || "{}");
      } catch { this._data = {}; }
      // Defaults
      this._data.interests   = this._data.interests   || {};   // { "tshirt": 5, "mug": 2 }
      this._data.categories  = this._data.categories  || {};   // clicked categories
      this._data.designCount = this._data.designCount || 0;    // how many designs made
      this._data.cartCount   = this._data.cartCount   || 0;    // times added to cart
      this._data.sessions    = this._data.sessions    || 0;    // visit count
      this._data.lastVisit   = this._data.lastVisit   || null;
      this._data.preferredLang = this._data.preferredLang || (localStorage.getItem("a3m_lang") || "ar");
      this._data.timeOnPage  = this._data.timeOnPage  || 0;    // seconds
      this._data.nudgeSent   = this._data.nudgeSent   || {};   // avoid duplicate nudges
      this._data.xp          = this._data.xp          || 0;
      this._data.orderHistory= this._data.orderHistory|| [];
      return this._data;
    },

    save() {
      try { localStorage.setItem("a3m_user_profile", JSON.stringify(this._data)); } catch {}
    },

    // Record interest in a product/topic
    addInterest(key, weight = 1) {
      const p = this.load();
      p.interests[key] = (p.interests[key] || 0) + weight;
      this.save();
    },

    // Get top interests sorted by score
    topInterests(n = 3) {
      const p = this.load();
      return Object.entries(p.interests)
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
        .map(e => e[0]);
    },

    // Detect if user is a designer (has made designs)
    isDesigner()   { return this.load().designCount > 2; },
    isBuyer()      { return this.load().cartCount   > 0; },
    isNewVisitor() { return this.load().sessions    < 2; },
    isReturning()  { return this.load().sessions    > 4; },

    // Increment session
    newSession() {
      const p = this.load();
      p.sessions++;
      p.lastVisit = Date.now();
      this.save();
    },

    markNudge(key) {
      const p = this.load();
      p.nudgeSent[key] = Date.now();
      this.save();
    },

    wasNudged(key, cooldownMs = 24 * 60 * 60 * 1000) {
      const p = this.load();
      const t = p.nudgeSent[key];
      return t && (Date.now() - t) < cooldownMs;
    },
  };

  // ════════════════════════════════════════════════════════════
  // 🎯 BEHAVIORAL TRACKER — tracks what user does on the page
  // ════════════════════════════════════════════════════════════

  const Tracker = {
    _bound: false,

    start() {
      if (this._bound) return;
      this._bound = true;
      Profile.newSession();

      // Track product card clicks
      document.addEventListener("click", e => {
        const card = e.target.closest(".product-card");
        if (card) {
          const onclick = card.getAttribute("onclick") || "";
          const m = onclick.match(/openProdModal\((\d+)\)/);
          if (m) {
            const id = parseInt(m[1]);
            const PD = window.PD || [];
            const product = PD[id];
            if (product?.cat) {
              Profile.addInterest(product.cat, 3);
              Profile.addInterest("viewed_product", 1);
            }
          }
        }

        // Track cart adds
        if (e.target.closest(".add-btn") || e.target.id === "checkoutBtn") {
          Profile.addInterest("buyer", 5);
          const p = Profile.load();
          p.cartCount++;
          Profile.save();
        }

        // Track category filter clicks
        const catBtn = e.target.closest(".cat-btn");
        if (catBtn) {
          const id = catBtn.id?.replace("c-", "");
          if (id && id !== "all") Profile.addInterest(id, 2);
        }

        // Track designer opens
        if (e.target.closest("#tool-text") || e.target.closest(".d-tool-btn")) {
          Profile.addInterest("designer", 2);
          const p = Profile.load();
          p.designCount++;
          Profile.save();
        }
      }, { passive: true });

      // Track time on page
      setInterval(() => {
        const p = Profile.load();
        p.timeOnPage = (p.timeOnPage || 0) + 10;
        Profile.save();
      }, 10000);

      // Schedule proactive nudges
      this._scheduleNudges();
    },

    _scheduleNudges() {
      // After 30s — if new visitor, offer help
      setTimeout(() => {
        if (state.isOpen) return;
        if (Profile.isNewVisitor() && !Profile.wasNudged("welcome_30s")) {
          Profile.markNudge("welcome_30s");
          showNudge("👋 محتاج مساعدة في اختيار المنتج؟ أنا هنا!", "اسألني", () => {
            toggleChat();
            setTimeout(() => sendText("أريد مساعدة في اختيار المنتج المناسب"), 400);
          });
        }
      }, 30000);

      // After 60s — personalized suggestion based on interests
      setTimeout(() => {
        if (state.isOpen) return;
        const top = Profile.topInterests(1)[0];
        if (!top) return;

        const nudgeMap = {
          tshirt: { msg: "👕 رأيت اهتمامك بالتيشرتات — جاهز تصمم واحد؟", action: "صمم الآن" },
          mug:    { msg: "☕ بحثت عن أكواب؟ نقدر نصمملك كوب مميز!", action: "اعرض الأكواب" },
          hoodie: { msg: "🧥 هوديات A3M بجودة عالية — عنا عروض خاصة!", action: "تفضل" },
          hat:    { msg: "🧢 قبعات مخصصة بشعارك؟ سهل وسريع!", action: "ابدأ" },
          bag:    { msg: "🎒 حقيبة بتصميمك الخاص — فكرة هدية رائعة!", action: "استكشف" },
          designer: { msg: "🎨 كمّلت تصميمك؟ جاهزين نطبعه لك!", action: "اطلب الآن" },
        };

        const n = nudgeMap[top];
        if (n && !Profile.wasNudged(`interest_${top}`)) {
          Profile.markNudge(`interest_${top}`);
          showNudge(n.msg, n.action, () => {
            toggleChat();
            setTimeout(() => sendText(`أريد معرفة المزيد عن ${top}`), 400);
          });
        }
      }, 65000);
    },
  };

  // ════════════════════════════════════════════════════════════
  // SYSTEM PROMPT — advanced with personalization context
  // ════════════════════════════════════════════════════════════

  function buildSystemPrompt() {
    const p = Profile.load();
    const top = Profile.topInterests(3);
    const lang = p.preferredLang || "ar";

    return `أنت A3M Bot، المساعد الذكي لـ A3M Print — أفضل مطبعة في الجزائر.
شخصيتك: ذكي، ودود، مختصر، تستخدم إيموجي باعتدال 🤖

🛍️ المنتجات: تيشرتات، هوديات، أكواب سيراميك (أبيض/أسود)، أكواب ستاربكس ورقية، قبعات (كاب/باكيت)، حقائب، بطاقات، ملصقات، ورق A3/A4/A5، نقش ليزر.
🖨️ الطباعة: حرارية، تطريز، DTG، UV، ليزر، فينيل، سيلك سكرين، أوفست.
💰 الأسعار: تيشرت 1200-2500دج، هودي 2800-4500دج، كوب 800-1500دج، قبعة 1000-2000دج. خصم 20% فوق 5000دج.
🎁 كودات: A3M10(10%), STUDENT(15%), WELCOME(25%), VIP50(50%).
🚚 التوصيل: 3-7 أيام لكل الجزائر، دفع عند الاستلام.

📊 معلومات المستخدم الحالي:
- الزيارات: ${p.sessions} مرة
- الاهتمامات الرئيسية: ${top.join(", ") || "عامة"}
- صمّم ${p.designCount} تصاميم
- أضاف للسلة ${p.cartCount} مرة
- وقت في الموقع: ${Math.round((p.timeOnPage || 0) / 60)} دقيقة

قواعد:
1. رد دائماً بلغة المستخدم (${lang === "ar" ? "عربي" : lang === "fr" ? "فرنسي" : "إنجليزي"})
2. خصّص ردودك حسب اهتماماته السابقة
3. اقترح المنتجات المناسبة لشخصيته (${Profile.isDesigner() ? "مصمم" : Profile.isBuyer() ? "مشتري" : "زائر جديد"})
4. عند طلب تصميم، أضف دائماً: [GENERATE_DESIGN:{"type":"نوع","title":"TITLE","subtitle":"sub","color":"#hex","bg":"#hex","textColor":"#fff"}]
5. لا تكرر الترحيب بعد أول مرة
6. كن استباقياً: اقترح منتجات مرتبطة بالمحادثة`;
  }

  // ════════════════════════════════════════════════════════════
  // STATE
  // ════════════════════════════════════════════════════════════

  const state = {
    isOpen: false, isTyping: false, hasGreeted: false,
    history: [], lastSpec: null,
  };

  const settings = {
    mode:     (window.A3M_AI_MODE  || localStorage.getItem("a3m_ai_mode")       || "local").trim(),
    apiKey:   (window.A3M_AI_KEY   || localStorage.getItem("a3m_ai_key")         || "").trim(),
    proxyUrl: (window.A3M_AI_PROXY || localStorage.getItem("a3m_ai_proxy_url")  || "").trim(),
    model:    (window.A3M_AI_MODEL || localStorage.getItem("a3m_ai_model")      || DEFAULT_MODEL).trim(),
    timeoutMs: 30000,
  };

  // ════════════════════════════════════════════════════════════
  // 📌 DRAG SYSTEM — long press to drag
  // ════════════════════════════════════════════════════════════

  const Drag = {
    active:   false,
    enabled:  false,
    startX:   0, startY: 0,
    origRight: 24, origBottom: 24,
    curRight:  null, curBottom: null,
    _longPressTimer: null,
    _LONG_PRESS_MS: 600,

    _loadPos() {
      try {
        const saved = JSON.parse(localStorage.getItem("a3m_bot_pos") || "{}");
        if (saved.right  !== undefined) this.curRight  = saved.right;
        if (saved.bottom !== undefined) this.curBottom = saved.bottom;
      } catch {}
    },

    _savePos() {
      try { localStorage.setItem("a3m_bot_pos", JSON.stringify({ right: this.curRight, bottom: this.curBottom })); } catch {}
    },

    applyPos(wrap) {
      this._loadPos();
      if (this.curRight  !== null) wrap.style.right  = this.curRight  + "px";
      if (this.curBottom !== null) wrap.style.bottom = this.curBottom + "px";
    },

    bind(wrap, trigger) {
      this.applyPos(wrap);

      // Long press start
      const startLong = (e) => {
        const isTouch = e.type === "touchstart";
        const pt = isTouch ? e.touches[0] : e;
        this._longPressTimer = setTimeout(() => {
          this.enabled = true;
          trigger.style.cursor = "grabbing";
          trigger.style.transform = "scale(1.15)";
          wrap.style.transition = "none";
          // Show drag hint
          trigger.style.boxShadow = "0 0 0 4px rgba(201,168,76,0.6), 0 8px 32px rgba(0,0,0,.5)";
          if (typeof showToast === "function") showToast("📌 اسحب البوت لأي مكان", "info");
        }, this._LONG_PRESS_MS);
      };

      const onMove = (e) => {
        if (!this.enabled) return;
        e.preventDefault();
        const isTouch = e.type === "touchmove";
        const pt = isTouch ? e.touches[0] : e;
        const W = window.innerWidth, H = window.innerHeight;
        const wrapW = wrap.offsetWidth || 70, wrapH = wrap.offsetHeight || 70;
        const newRight  = Math.max(8, Math.min(W - wrapW - 8, W - pt.clientX - wrapW / 2));
        const newBottom = Math.max(8, Math.min(H - wrapH - 8, H - pt.clientY - wrapH / 2));
        this.curRight  = newRight;
        this.curBottom = newBottom;
        wrap.style.right  = newRight  + "px";
        wrap.style.bottom = newBottom + "px";
      };

      const endDrag = () => {
        clearTimeout(this._longPressTimer);
        if (this.enabled) {
          this.enabled = false;
          trigger.style.cursor = "pointer";
          trigger.style.transform = "";
          trigger.style.boxShadow = "";
          wrap.style.transition = "";
          this._savePos();
        }
      };

      // Touch events
      trigger.addEventListener("touchstart", startLong, { passive: true });
      trigger.addEventListener("touchmove",  onMove,    { passive: false });
      trigger.addEventListener("touchend",   endDrag,   { passive: true });

      // Mouse events
      trigger.addEventListener("mousedown", (e) => {
        if (e.button !== 0) return;
        startLong(e);
        const mouseMoveHandler = (ev) => onMove(ev);
        const mouseUpHandler   = ()   => { document.removeEventListener("mousemove", mouseMoveHandler); document.removeEventListener("mouseup", mouseUpHandler); endDrag(); };
        document.addEventListener("mousemove", mouseMoveHandler);
        document.addEventListener("mouseup",   mouseUpHandler);
      });

      // Prevent click when drag happened
      trigger.addEventListener("click", (e) => {
        if (this.enabled) { e.stopImmediatePropagation(); e.preventDefault(); }
      }, true);
    },
  };

  // ════════════════════════════════════════════════════════════
  // SMART SUGGESTIONS — personalized per user
  // ════════════════════════════════════════════════════════════

  function buildPersonalizedSugs() {
    const top = Profile.topInterests(3);
    const p   = Profile.load();
    const sugs = [];

    // Always add: most relevant first based on profile
    if (top.includes("tshirt") || top.includes("hoodie")) {
      sugs.push({ label: "👕 صمم ملابسك", text: "أريد تصميم تيشرت مخصص بشعاري" });
    }
    if (top.includes("mug")) {
      sugs.push({ label: "☕ كوب مميز", text: "أريد تصميم كوب هدية" });
    }
    if (top.includes("designer") || p.designCount > 0) {
      sugs.push({ label: "🎨 تصميم جديد", text: "ساعدني في إنشاء تصميم جديد" });
    }
    if (p.cartCount > 0) {
      sugs.push({ label: "🛒 إتمام الطلب", text: "كيف أكمل طلبي؟" });
    }
    if (Profile.isNewVisitor()) {
      sugs.push({ label: "🛍️ المنتجات", text: "ماذا تبيعون؟" });
      sugs.push({ label: "💰 الأسعار", text: "ما هي أسعار المنتجات؟" });
    }
    if (Profile.isReturning()) {
      sugs.push({ label: "🎁 كود خصم", text: "هل عندكم عروض جديدة؟" });
    }

    // Fill remaining from page context
    const page = detectPage();
    const pageSugs = PAGE_SUGS[page] || PAGE_SUGS.home;
    for (const s of pageSugs) {
      if (sugs.length >= 5) break;
      if (!sugs.find(x => x.text === s.text)) sugs.push(s);
    }

    return sugs.slice(0, 5);
  }

  function detectPage() {
    const p = window.location.pathname + window.location.hash;
    if (/design|studio|designer/i.test(p)) return "design";
    if (/product|shop|catalog/i.test(p))   return "products";
    if (/checkout|cart|order/i.test(p))    return "checkout";
    if (/contact/i.test(p))                return "contact";
    return "home";
  }

  const PAGE_SUGS = {
    home:     [{ label:"🛍️ المنتجات", text:"ماذا تبيعون؟" },{ label:"🎨 صمّم", text:"أريد تصميم تيشرت" },{ label:"💰 الأسعار", text:"ما أسعار المنتجات؟" },{ label:"🖨️ الطباعة", text:"أنواع الطباعة؟" }],
    products: [{ label:"👕 التيشرتات", text:"أسعار التيشرتات؟" },{ label:"☕ الأكواب", text:"أنواع الأكواب؟" },{ label:"🎁 هدايا", text:"ما أفضل هدية مخصصة؟" }],
    design:   [{ label:"🎨 شعار", text:"صمم لي شعار احترافي" },{ label:"👕 تيشرت", text:"تصميم تيشرت أزرق" },{ label:"📋 بوستر", text:"بوستر ترويجي جذاب" }],
    checkout: [{ label:"🚚 التوصيل", text:"كم يستغرق التوصيل؟" },{ label:"💳 الدفع", text:"طرق الدفع؟" },{ label:"🎁 كود", text:"هل يوجد كود خصم؟" }],
    contact:  [{ label:"📞 تواصل", text:"كيف أتواصل؟" },{ label:"⏰ مواعيد", text:"أوقات العمل؟" }],
  };

  const CTX_SUGS = {
    products: [{ label:"💰 الأسعار", text:"كم أسعار المنتجات؟" },{ label:"🚚 التوصيل", text:"كيف يتم التوصيل؟" },{ label:"🛒 اطلب", text:"كيف أضيف للسلة؟" }],
    prices:   [{ label:"🛒 اطلب الآن", text:"كيف أكمل الطلب؟" },{ label:"🎁 خصم؟", text:"هل يوجد كود خصم؟" }],
    design:   [{ label:"🎨 الاستوديو", text:"كيف أفتح الاستوديو؟" },{ label:"📥 تحميل", text:"كيف أحمل التصميم؟" }],
    printing: [{ label:"💰 أسعار الطباعة", text:"كم أسعار الطباعة؟" },{ label:"⏱️ الوقت", text:"كم يستغرق الطلب؟" }],
    order:    [{ label:"🚚 التوصيل", text:"كم يستغرق التوصيل؟" },{ label:"🔄 تعديل", text:"أقدر أعدل طلبي؟" }],
    gift:     [{ label:"🎁 هدية مثالية", text:"ما أفضل هدية مخصصة؟" },{ label:"☕ كوب هدية", text:"أريد كوب هدية بتصميم خاص" }],
  };

  // ════════════════════════════════════════════════════════════
  // INTENT & SENTIMENT DETECTION
  // ════════════════════════════════════════════════════════════

  function detectIntent(text) {
    const n = normalizeAr(text);
    if (/(سعر|يكلف|كم|price|combien|tarif|ثمن|بش نعرف الثمن)/.test(n)) return "price";
    if (/(صمم|تصميم|design|logo|شعار|اعمل لي|سويلي)/.test(n))          return "design";
    if (/(اطلب|طلب|شري|buy|commander|order|سلة)/.test(n))              return "order";
    if (/(مرحبا|سلام|اهلا|hello|bonjour|كيفاش)/.test(n))               return "greeting";
    if (/(شكرا|merci|thanks|برشا|بارك الله)/.test(n))                   return "thanks";
    if (/(مشكلة|problem|خطأ|error|ما يخدمش|bug)/.test(n))              return "issue";
    if (/(منتج|تيشرت|هودي|كوب|قبعة|حقيبة|product)/.test(n))           return "product_info";
    if (/(توصيل|تسليم|delivery|livraison|شحن)/.test(n))                 return "delivery";
    if (/(خصم|discount|promo|كود|code|تخفيض)/.test(n))                  return "discount";
    if (/(طباعة|print|dtg|uv|ليزر|حراري|تطريز)/.test(n))               return "printing";
    if (/(هدية|gift|cadeau|عيد|مناسبة)/.test(n))                        return "gift";
    if (/(تواصل|contact|واتساب|هاتف|phone)/.test(n))                    return "contact";
    return "general";
  }

  function detectSentiment(text) {
    const n = normalizeAr(text);
    if (/(ممتاز|رائع|شكرا|بارك|زوين|bravo|excellent|perfect)/.test(n))  return "positive";
    if (/(غالي|مشكلة|ما عجبنيش|سيء|لا|يغلط|bug)/.test(n))              return "negative";
    if (/(urgent|عاجل|ضروري|vite|besoin)/.test(n))                       return "urgent";
    return "neutral";
  }

  // ════════════════════════════════════════════════════════════
  // NUDGE (proactive popup)
  // ════════════════════════════════════════════════════════════

  function showNudge(msg, actionLabel, onAction) {
    const existing = document.getElementById("a3m-nudge");
    if (existing) existing.remove();

    const nudge = document.createElement("div");
    nudge.id = "a3m-nudge";
    nudge.style.cssText = `
      position:fixed;bottom:100px;right:24px;z-index:9998;
      background:var(--bg2,#111827);border:1px solid var(--gold,#c9a84c);
      border-radius:16px;padding:12px 16px;max-width:260px;
      box-shadow:0 8px 32px rgba(0,0,0,.5);
      animation:a3m-nudgeIn .35s cubic-bezier(.34,1.56,.64,1);
      font-family:'Cairo',sans-serif;direction:rtl;
    `;
    nudge.innerHTML = `
      <button style="position:absolute;top:6px;left:8px;background:none;border:none;color:#6b7280;cursor:pointer;font-size:14px;line-height:1;" onclick="this.parentElement.remove()">✕</button>
      <div style="font-size:13px;color:var(--txt,#fff);line-height:1.55;margin-bottom:8px">${msg}</div>
      <button style="background:var(--gold,#c9a84c);color:#111;border:none;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;"
        onclick="this.parentElement.remove();(${onAction.toString()})()">
        ${actionLabel} →
      </button>
    `;
    document.body.appendChild(nudge);
    setTimeout(() => nudge.remove(), 12000);
  }

  // ════════════════════════════════════════════════════════════
  // UTILS
  // ════════════════════════════════════════════════════════════

  function normalizeAr(t) {
    return String(t || "").toLowerCase()
      .replace(/[ًٌٍَُِّْـ]/g, "").replace(/[أإآ]/g, "ا")
      .replace(/ة/g, "ه").replace(/ى/g, "ي")
      .replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
  }

  function escapeHTML(s) {
    return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

  function resolveRobotSrc() {
    if (_robotSrc) return _robotSrc;
    _robotSrc = "assets/images/Ai/robot.webp";
    return _robotSrc;
  }

  function makeAvatar() {
    const src = resolveRobotSrc();
    const av = document.createElement("div"); av.className = "a3m-msg-avatar";
    const img = document.createElement("img"); img.src = src; img.alt = BOT_NAME;
    img.onerror = () => { av.removeChild(img); av.textContent = FALLBACK_EMOJI; };
    av.appendChild(img); return av;
  }

  // ════════════════════════════════════════════════════════════
  // CHAT HISTORY
  // ════════════════════════════════════════════════════════════

  function saveCurrentChat() {
    if (state.history.length < 2) return;
    try {
      const saved = JSON.parse(localStorage.getItem("a3m_chat_history") || "[]");
      const preview = (state.history.find(m => m.role === "user")?.content || "محادثة").slice(0, 60);
      saved.unshift({ id: Date.now(), date: new Date().toLocaleDateString("ar-DZ"), preview, messages: state.history.slice(-20) });
      if (saved.length > MAX_SAVED_CHATS) saved.length = MAX_SAVED_CHATS;
      localStorage.setItem("a3m_chat_history", JSON.stringify(saved));
    } catch {}
  }

  function loadChatHistory() { try { return JSON.parse(localStorage.getItem("a3m_chat_history") || "[]"); } catch { return []; } }
  function deleteSavedChat(id) { try { const s = loadChatHistory().filter(c => c.id !== id); localStorage.setItem("a3m_chat_history", JSON.stringify(s)); renderHistoryPanel(); } catch {} }

  function restoreChat(entry) {
    state.history = entry.messages || []; state.hasGreeted = true;
    const msgs = document.getElementById("a3m-msgs"); if (!msgs) return;
    msgs.innerHTML = "";
    for (const m of state.history) {
      if (m.role === "user" || m.role === "assistant") {
        const c = String(m.content || "").replace(/\n?\[GENERATE_DESIGN:[\s\S]*?\]\s*$/, "").trim();
        if (c) appendMessage(m.role === "assistant" ? "bot" : "user", c);
      }
    }
    closeHistory(); scrollToBottom();
  }

  function renderHistoryPanel() {
    const panel = document.getElementById("a3m-history-panel"); if (!panel) return;
    const chats = loadChatHistory();
    if (!chats.length) { panel.innerHTML = `<div style="padding:24px;text-align:center;color:var(--txt3,#9ca3af);font-size:13px">📭 لا توجد محادثات محفوظة</div>`; return; }
    panel.innerHTML = chats.map(c => `
      <div class="a3m-hist-item">
        <div class="a3m-hist-info">
          <div class="a3m-hist-date">${escapeHTML(c.date)}</div>
          <div class="a3m-hist-preview">${escapeHTML(c.preview)}</div>
        </div>
        <div class="a3m-hist-actions">
          <button class="a3m-hist-restore" data-id="${c.id}">↩ استرجاع</button>
          <button class="a3m-hist-delete"  data-id="${c.id}">🗑</button>
        </div>
      </div>`).join("");
    panel.querySelectorAll(".a3m-hist-restore").forEach(btn => {
      btn.onclick = () => { const e = chats.find(c => c.id === Number(btn.dataset.id)); if (e) restoreChat(e); };
    });
    panel.querySelectorAll(".a3m-hist-delete").forEach(btn => {
      btn.onclick = () => deleteSavedChat(Number(btn.dataset.id));
    });
  }

  function openHistory()  { renderHistoryPanel(); document.getElementById("a3m-history-modal")?.classList.add("open"); }
  function closeHistory() { document.getElementById("a3m-history-modal")?.classList.remove("open"); }

  // ════════════════════════════════════════════════════════════
  // CSS
  // ════════════════════════════════════════════════════════════

  function ensureStyle() {
    if (document.getElementById("a3m-bot-styles")) return;
    const s = document.createElement("style"); s.id = "a3m-bot-styles";
    s.textContent = `
#a3m-bot-wrap{position:fixed;bottom:24px;right:24px;z-index:9999;font-family:'Cairo',sans-serif;direction:rtl;transition:right .2s,bottom .2s;}
#a3m-bot-trigger{width:64px;height:64px;border-radius:50%;background:var(--accent,#2563eb);border:3px solid var(--gold,#c9a84c);cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 24px rgba(0,0,0,.45);animation:a3m-pulse 3s infinite;transition:transform .2s,box-shadow .25s;position:relative;overflow:hidden;user-select:none;-webkit-user-select:none;}
#a3m-bot-trigger:hover{transform:scale(1.1);animation:none}
#a3m-bot-trigger>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;pointer-events:none;}
#a3m-bot-trigger .a3m-fb{font-size:1.8rem;pointer-events:none}
#a3m-bot-badge{position:absolute;top:-4px;left:-4px;z-index:1;width:20px;height:20px;border-radius:50%;background:#ef4444;border:2px solid var(--bg,#0b0f19);font-size:11px;font-weight:700;color:#fff;display:flex;align-items:center;justify-content:center;}
/* Drag hint ring */
#a3m-bot-trigger.dragging{animation:none!important;cursor:grabbing!important;}
#a3m-drag-hint{position:absolute;bottom:70px;right:0;background:rgba(201,168,76,.15);border:1px solid var(--gold,#c9a84c);color:var(--gold,#c9a84c);padding:5px 12px;border-radius:20px;font-size:11px;white-space:nowrap;pointer-events:none;opacity:0;transition:opacity .3s;}
#a3m-bot-trigger:active + #a3m-drag-hint{opacity:1}
#a3m-bot-tooltip{position:absolute;bottom:72px;right:0;background:var(--bg2,#111827);border:1px solid var(--gold,#c9a84c);color:var(--txt,#fff);padding:10px 16px;border-radius:14px 14px 0 14px;font-size:13px;box-shadow:0 4px 18px rgba(0,0,0,.4);cursor:pointer;max-width:240px;text-align:right;line-height:1.5;display:none;animation:a3m-fadeIn .3s ease;}
#a3m-bot-tooltip::after{content:'';position:absolute;bottom:-8px;right:18px;border:4px solid transparent;border-top-color:var(--gold,#c9a84c)}
#a3m-bot-chat{position:absolute;bottom:76px;right:0;width:390px;background:var(--bg2,#111827);border:1px solid var(--border,#2a2f3a);border-radius:20px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,.65);transform:scale(.88) translateY(24px);transform-origin:bottom right;opacity:0;pointer-events:none;max-height:640px;transition:transform .3s cubic-bezier(.34,1.56,.64,1),opacity .25s;}
#a3m-bot-chat.open{transform:scale(1) translateY(0);opacity:1;pointer-events:all}
/* Smart recommendation strip */
#a3m-reco-strip{display:none;padding:8px 12px;background:linear-gradient(135deg,rgba(37,99,235,.08),rgba(201,168,76,.05));border-bottom:1px solid var(--border,#2a2f3a);gap:6px;flex-wrap:wrap;}
#a3m-reco-strip.visible{display:flex;}
.a3m-reco-chip{background:rgba(201,168,76,.12);border:1px solid rgba(201,168,76,.3);color:var(--gold,#c9a84c);padding:4px 10px;border-radius:20px;font-size:10px;font-weight:700;cursor:pointer;white-space:nowrap;transition:.15s;font-family:'Cairo',sans-serif;}
.a3m-reco-chip:hover{background:rgba(201,168,76,.25);}
.a3m-chat-header{display:flex;align-items:center;gap:10px;padding:13px 14px;background:var(--bg3,#1f2937);border-bottom:1px solid var(--border,#2a2f3a);flex-shrink:0;}
.a3m-chat-avatar{width:42px;height:42px;border-radius:50%;overflow:hidden;border:2px solid var(--gold,#c9a84c);flex-shrink:0;background:var(--accent,#2563eb);display:flex;align-items:center;justify-content:center;font-size:1.3rem;}
.a3m-chat-avatar img{width:100%;height:100%;object-fit:cover;display:block}
.a3m-chat-info{flex:1;min-width:0}.a3m-chat-name{font-size:14px;font-weight:700;color:var(--txt,#fff)}.a3m-chat-status{font-size:11px;color:#22c55e;display:flex;align-items:center;gap:4px}.a3m-chat-status::before{content:'';width:7px;height:7px;background:#22c55e;border-radius:50%;animation:a3m-blink 2s infinite}
.a3m-mode-badge{font-size:10px;padding:2px 8px;border-radius:10px;border:1px solid var(--border,#2a2f3a);color:var(--txt3,#9ca3af);background:rgba(255,255,255,.05);white-space:nowrap}.a3m-mode-badge.live{color:#22c55e;border-color:rgba(34,197,94,.4)}
.a3m-header-actions{display:flex;gap:3px;flex-shrink:0}
.a3m-hbtn{background:none;border:none;color:var(--txt3,#9ca3af);font-size:15px;cursor:pointer;padding:5px 7px;border-radius:8px;transition:.2s;line-height:1}.a3m-hbtn:hover{background:rgba(255,255,255,.09);color:var(--txt,#fff)}
.a3m-messages{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;min-height:240px;max-height:360px;scrollbar-width:thin;scrollbar-color:var(--border3,#4b5563) transparent;}
.a3m-messages::-webkit-scrollbar{width:4px}.a3m-messages::-webkit-scrollbar-thumb{background:var(--border3,#4b5563);border-radius:2px}
.a3m-msg{display:flex;gap:8px;align-items:flex-end;animation:a3m-fadeIn .28s ease}.a3m-msg.bot{flex-direction:row}.a3m-msg.user{flex-direction:row-reverse}
.a3m-msg-avatar{width:30px;height:30px;border-radius:50%;overflow:hidden;border:2px solid var(--gold,#c9a84c);flex-shrink:0;background:var(--accent,#2563eb);display:flex;align-items:center;justify-content:center;font-size:1rem;}
.a3m-msg-avatar img{width:100%;height:100%;object-fit:cover;display:block}
.a3m-bubble{max-width:80%;padding:10px 14px;border-radius:18px;font-size:13px;line-height:1.65;color:var(--txt,#fff);white-space:pre-wrap;word-break:break-word}
.a3m-msg.bot .a3m-bubble{background:var(--bg3,#1f2937);border:1px solid var(--border,#2a2f3a);border-bottom-right-radius:5px}.a3m-msg.user .a3m-bubble{background:var(--accent,#2563eb);border-bottom-left-radius:5px;color:#fff}
.a3m-bubble strong{color:var(--gold,#c9a84c);font-weight:700}
.a3m-cursor{display:inline-block;width:2px;height:14px;background:var(--gold,#c9a84c);margin-right:2px;animation:a3m-cur .65s infinite;vertical-align:middle}
@keyframes a3m-cur{0%,100%{opacity:1}50%{opacity:0}}
.a3m-design-card{margin-top:10px;border:2px solid var(--gold,#c9a84c);border-radius:14px;overflow:hidden}
.a3m-design-canvas{padding:18px;min-height:100px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:8px}
.a3m-design-title{font-size:20px;font-weight:800;line-height:1.2}.a3m-design-sub{font-size:11px;opacity:.75}
.a3m-design-actions{display:flex;gap:6px;padding:10px;background:var(--bg3,#1f2937)}
.a3m-design-btn{flex:1;padding:7px;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer;border:none;font-family:'Cairo',sans-serif;transition:.2s}.a3m-design-btn.primary{background:var(--accent,#2563eb);color:#fff}.a3m-design-btn.gold{background:transparent;border:1.5px solid var(--gold,#c9a84c);color:var(--gold,#c9a84c)}
.a3m-suggestions{display:flex;flex-wrap:wrap;gap:6px;padding:8px 12px 4px;border-top:1px solid var(--border,#2a2f3a)}
.a3m-sug-btn{background:var(--bg3,#1f2937);border:1px solid var(--border2,#3a4150);color:var(--txt2,#d1d5db);padding:5px 11px;border-radius:20px;font-size:11px;cursor:pointer;font-family:'Cairo',sans-serif;transition:.2s;white-space:nowrap}
.a3m-sug-btn:hover{background:var(--accent,#2563eb);border-color:var(--accent,#2563eb);color:#fff}
.a3m-input-area{display:flex;gap:8px;padding:10px 12px;background:var(--bg3,#1f2937);border-top:1px solid var(--border,#2a2f3a);flex-shrink:0;align-items:center}
.a3m-input{flex:1;background:var(--bg4,#374151);border:1.5px solid var(--border2,#3a4150);color:var(--txt,#fff);padding:9px 14px;border-radius:22px;font-size:13px;font-family:'Cairo',sans-serif;outline:none;transition:.2s;direction:rtl}.a3m-input:focus{border-color:var(--accent,#2563eb)}.a3m-input:disabled{opacity:.5}
.a3m-send-btn{width:38px;height:38px;background:var(--accent,#2563eb);border:none;border-radius:50%;color:#fff;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:.2s}.a3m-send-btn:hover:not(:disabled){background:var(--gold,#c9a84c);transform:scale(1.08)}.a3m-send-btn:disabled{opacity:.4;cursor:not-allowed}
#a3m-history-modal{position:absolute;inset:0;background:var(--bg2,#111827);border-radius:20px;display:flex;flex-direction:column;opacity:0;pointer-events:none;transform:translateX(-18px);transition:.25s;z-index:10}
#a3m-history-modal.open{opacity:1;pointer-events:all;transform:translateX(0)}
.a3m-hist-header{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid var(--border,#2a2f3a);background:var(--bg3,#1f2937);border-radius:20px 20px 0 0;flex-shrink:0}
.a3m-hist-title{font-size:14px;font-weight:700;color:var(--txt,#fff)}
#a3m-history-panel{flex:1;overflow-y:auto;padding:10px;display:flex;flex-direction:column;gap:8px;scrollbar-width:thin}
.a3m-hist-item{display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--bg3,#1f2937);border:1px solid var(--border,#2a2f3a);border-radius:12px;transition:.2s}.a3m-hist-item:hover{border-color:var(--gold,#c9a84c)}
.a3m-hist-info{flex:1;min-width:0}.a3m-hist-date{font-size:10px;color:var(--txt3,#9ca3af)}.a3m-hist-preview{font-size:12px;color:var(--txt2,#d1d5db);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.a3m-hist-actions{display:flex;gap:5px;flex-shrink:0}
.a3m-hist-restore{background:var(--accent,#2563eb);color:#fff;border:none;padding:4px 10px;border-radius:8px;font-size:11px;cursor:pointer;font-family:'Cairo',sans-serif;white-space:nowrap}
.a3m-hist-delete{background:transparent;color:var(--txt3,#9ca3af);border:1px solid var(--border,#2a2f3a);padding:4px 8px;border-radius:8px;font-size:11px;cursor:pointer;transition:.2s}.a3m-hist-delete:hover{color:#ef4444;border-color:#ef4444}
#a3m-design-context{position:fixed;bottom:100px;right:24px;z-index:9998;background:var(--bg2,#111827);border:1px solid var(--gold,#c9a84c);border-radius:12px;padding:8px 14px;font-size:12px;color:var(--txt2,#d1d5db);cursor:pointer;display:none;box-shadow:0 4px 16px rgba(0,0,0,.4)}
#a3m-design-context span{color:var(--gold,#c9a84c);font-weight:700}
@keyframes a3m-nudgeIn{from{opacity:0;transform:translateY(16px) scale(.9)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes a3m-pulse{0%,100%{box-shadow:0 6px 24px rgba(0,0,0,.4),0 0 0 0 rgba(201,168,76,.5)}50%{box-shadow:0 6px 24px rgba(0,0,0,.4),0 0 0 12px rgba(201,168,76,0)}}
@keyframes a3m-dot{0%,100%{transform:translateY(0);opacity:.5}50%{transform:translateY(-5px);opacity:1}}
@keyframes a3m-fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes a3m-blink{0%,100%{opacity:1}50%{opacity:.3}}
@media(max-width:480px){#a3m-bot-chat{width:calc(100vw - 28px);right:-8px;max-height:540px}#a3m-bot-wrap{right:14px;bottom:14px}.a3m-messages{max-height:280px}}
    `;
    document.head.appendChild(s);
  }

  // ════════════════════════════════════════════════════════════
  // BUILD HTML
  // ════════════════════════════════════════════════════════════

  function buildHTML() {
    if (document.getElementById("a3m-bot-wrap")) return;
    const src       = resolveRobotSrc();
    const modeLabel = settings.mode === "direct" ? "🟢 AI" : settings.mode === "proxy" ? "🟡 Proxy" : "🔵 محلي";
    const isLive    = settings.mode !== "local";
    const top       = Profile.topInterests(2);

    const wrap = document.createElement("div"); wrap.id = "a3m-bot-wrap";
    wrap.innerHTML = `
      <div id="a3m-drag-hint">📌 اسحبني لأي مكان</div>
      <div id="a3m-bot-tooltip">👋 أهلاً! أنا A3M Bot — اضغط لنتحدث 🎨</div>
      <div id="a3m-bot-chat" role="dialog" aria-modal="true">
        <div id="a3m-history-modal">
          <div class="a3m-hist-header">
            <span class="a3m-hist-title">📂 المحادثات المحفوظة</span>
            <button class="a3m-hbtn" id="a3m-hist-close">✕</button>
          </div>
          <div id="a3m-history-panel"></div>
        </div>
        <div class="a3m-chat-header">
          <div class="a3m-chat-avatar">
            <img src="${src}" alt="${BOT_NAME}" onerror="this.remove();this.parentElement.textContent='${FALLBACK_EMOJI}'">
          </div>
          <div class="a3m-chat-info">
            <div class="a3m-chat-name">${BOT_NAME}</div>
            <div class="a3m-chat-status">متصل</div>
          </div>
          <span class="a3m-mode-badge ${isLive ? "live" : ""}">${modeLabel}</span>
          <div class="a3m-header-actions">
            <button class="a3m-hbtn" id="a3m-hist-btn"  title="المحادثات المحفوظة">📂</button>
            <button class="a3m-hbtn" id="a3m-clear-btn" title="محادثة جديدة">🗑</button>
            <button class="a3m-hbtn" id="a3m-close-btn" title="إغلاق">✕</button>
          </div>
        </div>
        <!-- Personalized recommendation strip -->
        <div id="a3m-reco-strip" class="${top.length ? "visible" : ""}"></div>
        <div class="a3m-messages" id="a3m-msgs" role="log" aria-live="polite"></div>
        <div class="a3m-suggestions" id="a3m-sugs"></div>
        <div class="a3m-input-area">
          <input class="a3m-input" id="a3m-input" placeholder="اكتب سؤالك هنا…" autocomplete="off" maxlength="600"/>
          <button class="a3m-send-btn" id="a3m-send" type="button">➤</button>
        </div>
      </div>
      <button id="a3m-bot-trigger" type="button" aria-label="فتح A3M Bot">
        <div id="a3m-bot-badge">1</div>
        <img src="${src}" alt="${BOT_NAME}" onerror="this.remove();document.getElementById('a3m-bot-trigger').insertAdjacentHTML('beforeend','<span class=a3m-fb>${FALLBACK_EMOJI}</span>')">
      </button>`;

    document.body.appendChild(wrap);

    // Build recommendation strip
    _buildRecoStrip();

    // Bind events
    const $ = id => document.getElementById(id);
    $("a3m-close-btn").addEventListener("click", toggleChat);
    $("a3m-clear-btn").addEventListener("click", clearChat);
    $("a3m-hist-btn").addEventListener("click", openHistory);
    $("a3m-hist-close").addEventListener("click", closeHistory);
    $("a3m-send").addEventListener("click", sendMessage);
    $("a3m-bot-tooltip").addEventListener("click", toggleChat);
    $("a3m-input").addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } });

    // ✅ Drag system — trigger click only if not dragging
    const trigger = $("a3m-bot-trigger");
    Drag.bind(wrap, trigger);
    trigger.addEventListener("click", (e) => {
      if (!Drag.enabled) toggleChat();
    });

    buildDesignContextBadge();
    scheduleTooltip();
    detectDesignStudio();
  }

  function _buildRecoStrip() {
    const strip = document.getElementById("a3m-reco-strip"); if (!strip) return;
    const top = Profile.topInterests(3);
    if (!top.length) return;

    const labels = {
      tshirt:  "👕 تيشرتات",   hoodie: "🧥 هوديات",
      mug:     "☕ أكواب",      hat:    "🧢 قبعات",
      bag:     "🎒 حقائب",     laser:  "🔍 نقش ليزر",
      designer:"🎨 تصميم",     buyer:  "🛒 تسوق",
    };

    const questions = {
      tshirt:   "أريد تصميم تيشرت",          hoodie: "أسعار الهوديات؟",
      mug:      "أريد كوب هدية",              hat:    "أنواع القبعات؟",
      bag:      "أريد حقيبة مخصصة",           laser:  "كم سعر النقش بالليزر؟",
      designer: "مساعدة في التصميم",          buyer:  "كيف أكمل طلبي؟",
    };

    strip.innerHTML = `<span style="font-size:10px;color:var(--txt3,#9ca3af);margin-left:4px">🎯 لك:</span>`;
    top.forEach(key => {
      if (!labels[key]) return;
      const chip = document.createElement("button");
      chip.className = "a3m-reco-chip";
      chip.textContent = labels[key];
      chip.onclick = () => { toggleChat(); setTimeout(() => sendText(questions[key] || key), 400); };
      strip.appendChild(chip);
    });

    strip.classList.toggle("visible", strip.children.length > 1);
  }

  function scheduleTooltip() {
    // Personalized tooltip based on profile
    const p = Profile.load();
    let msg = "👋 أهلاً! أنا A3M Bot — اضغط لنتحدث 🎨";
    const top = Profile.topInterests(1)[0];
    if (top === "tshirt")   msg = "👕 جاهز تصمم تيشرتك؟ تعال نساعدك!";
    else if (top === "mug") msg = "☕ كوب هدية مخصص؟ A3M Bot جاهز!";
    else if (Profile.isDesigner()) msg = "🎨 مصمم محترف؟ عندنا أدوات تناسبك!";
    else if (Profile.isBuyer())    msg = "🛒 مرحباً بعودتك! جاهزين نكمل طلبك.";

    const tt = document.getElementById("a3m-bot-tooltip");
    if (tt) tt.textContent = msg;

    setTimeout(() => {
      if (state.isOpen) return;
      if (tt) { tt.style.display = "block"; setTimeout(() => { if (!state.isOpen) tt.style.display = "none"; }, 6000); }
    }, 5000);
  }

  function buildDesignContextBadge() {
    if (document.getElementById("a3m-design-context")) return;
    const b = document.createElement("div"); b.id = "a3m-design-context";
    b.innerHTML = `🧠 وضع التصميم: <span>جاهز</span>`;
    b.addEventListener("click", openStudio);
    document.body.appendChild(b);
    // ✅ Position badge relative to bot icon on every frame
    _tickContextBadge();
  }

  function _tickContextBadge() {
    const badge = document.getElementById("a3m-design-context");
    if (!badge) return;
    const wrap = document.getElementById("a3m-bot-wrap");
    if (wrap) {
      // Read computed position of wrap (supports drag)
      const r = wrap.getBoundingClientRect();
      const W = window.innerWidth, H = window.innerHeight;
      // Place badge just above the bot icon, right-aligned to it
      const badgeW = badge.offsetWidth || 180;
      const right  = W - r.right;
      const bottom = H - r.top + 10;
      badge.style.right  = Math.max(8, right)  + "px";
      badge.style.bottom = Math.min(H - 60, bottom) + "px";
    }
    if (badge.style.display !== "none") requestAnimationFrame(_tickContextBadge);
  }

  function updateDesignContextBadge(t) {
    const sp = document.querySelector("#a3m-design-context span");
    if (sp) sp.textContent = t || (window.A3MDesignerAI ? "جاهز" : "—");
  }

  // ════════════════════════════════════════════════════════════
  // CHAT CONTROLS
  // ════════════════════════════════════════════════════════════

  function toggleChat() {
    state.isOpen = !state.isOpen;
    const chat  = document.getElementById("a3m-bot-chat");
    const tt    = document.getElementById("a3m-bot-tooltip");
    const badge = document.getElementById("a3m-bot-badge");
    if (state.isOpen) {
      chat?.classList.add("open");
      if (tt)    tt.style.display = "none";
      if (badge) badge.style.display = "none";
      if (!state.hasGreeted) greetUser();
      _buildRecoStrip(); // refresh personalized strip
      setTimeout(scrollToBottom, 150);
      setTimeout(() => document.getElementById("a3m-input")?.focus(), 320);
    } else {
      saveCurrentChat();
      chat?.classList.remove("open");
      closeHistory();
    }
  }

  function clearChat() {
    saveCurrentChat();
    state.history = []; state.hasGreeted = false; state.lastSpec = null;
    const m = document.getElementById("a3m-msgs"), s = document.getElementById("a3m-sugs");
    if (m) m.innerHTML = ""; if (s) s.innerHTML = "";
    setTimeout(greetUser, 180);
  }

  function greetUser() {
    state.hasGreeted = true;
    const p = Profile.load();
    const top = Profile.topInterests(1)[0];
    let greeting = "👋 أهلاً! أنا **A3M Bot** 🤖 مساعدك الذكي في A3M Print.\n\nكيف أساعدك اليوم؟";

    if (Profile.isReturning() && top) {
      const productNames = { tshirt:"التيشرتات", mug:"الأكواب", hoodie:"الهوديات", hat:"القبعات", bag:"الحقائب" };
      const prod = productNames[top] || top;
      greeting = `👋 أهلاً مجدداً! 🤖\n\nلاحظت اهتمامك بـ **${prod}** — هل تريد مساعدة فيها؟`;
    } else if (Profile.isNewVisitor()) {
      greeting = "👋 أهلاً ومرحباً بك في A3M Print! 🤖\n\nأنا هنا أساعدك تختار المنتج وتصمم وتطلب.\n\nبم يمكنني مساعدتك؟";
    }

    setTimeout(() => {
      appendMessage("bot", greeting);
      showSuggestions(null);
    }, 320);
  }

  function showSuggestions(ctxKey) {
    const c = document.getElementById("a3m-sugs"); if (!c) return;
    const list = ctxKey && CTX_SUGS[ctxKey]
      ? CTX_SUGS[ctxKey]
      : buildPersonalizedSugs();
    c.innerHTML = "";
    for (const s of list) {
      const btn = document.createElement("button");
      btn.className = "a3m-sug-btn"; btn.textContent = s.label;
      btn.onclick = () => sendText(s.text);
      c.appendChild(btn);
    }
  }

  function scrollToBottom() { const m = document.getElementById("a3m-msgs"); if (m) m.scrollTop = m.scrollHeight; }

  function appendMessage(role, content) {
    const msgs = document.getElementById("a3m-msgs"); if (!msgs) return null;
    const w = document.createElement("div"); w.className = `a3m-msg ${role}`;
    if (role === "bot") w.appendChild(makeAvatar());
    const b = document.createElement("div"); b.className = "a3m-bubble";
    b.innerHTML = parseMarkup(String(content || "")); w.appendChild(b);
    msgs.appendChild(w); scrollToBottom();
    return { wrapper: w, bubble: b };
  }

  function parseMarkup(t) {
    return escapeHTML(t)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br>");
  }

  function showTyping() {
    const msgs = document.getElementById("a3m-msgs");
    if (!msgs || document.getElementById("a3m-typing")) return;
    const w = document.createElement("div"); w.className = "a3m-msg bot"; w.id = "a3m-typing"; w.appendChild(makeAvatar());
    const b = document.createElement("div"); b.className = "a3m-bubble";
    b.innerHTML = `<div style="display:flex;gap:5px;padding:3px 0"><span style="width:8px;height:8px;border-radius:50%;background:var(--txt3,#9ca3af);display:inline-block;animation:a3m-dot 1.2s infinite 0s"></span><span style="width:8px;height:8px;border-radius:50%;background:var(--txt3,#9ca3af);display:inline-block;animation:a3m-dot 1.2s infinite .2s"></span><span style="width:8px;height:8px;border-radius:50%;background:var(--txt3,#9ca3af);display:inline-block;animation:a3m-dot 1.2s infinite .4s"></span></div>`;
    w.appendChild(b); msgs.appendChild(w); scrollToBottom();
  }

  function removeTyping() { document.getElementById("a3m-typing")?.remove(); }

  function streamText(bubble, fullText, onDone) {
    const words = fullText.split(/(\s+)/); let i = 0, displayed = "";
    bubble.innerHTML = '<span class="a3m-cursor"></span>';
    function step() {
      if (i >= words.length) { bubble.innerHTML = parseMarkup(displayed); if (onDone) onDone(); return; }
      displayed += words[i++];
      bubble.innerHTML = parseMarkup(displayed) + '<span class="a3m-cursor"></span>';
      scrollToBottom();
      setTimeout(step, 18 + Math.random() * 18);
    }
    step();
  }

  // ════════════════════════════════════════════════════════════
  // SEND MESSAGE
  // ════════════════════════════════════════════════════════════

  function sendMessage() {
    const input = document.getElementById("a3m-input"); if (!input) return;
    const text = input.value.trim(); if (!text || state.isTyping) return;
    input.value = ""; sendText(text);
  }

  async function sendText(text) {
    if (!text?.trim() || state.isTyping) return;
    const sugs = document.getElementById("a3m-sugs"); if (sugs) sugs.innerHTML = "";
    appendMessage("user", text);
    state.history.push({ role: "user", content: text });
    state.isTyping = true;

    // 🧠 Track intent for personalization
    const intent = detectIntent(text);
    const intentToInterest = { product_info:"viewed_product", gift:"gift", printing:"printing", design:"designer", order:"buyer" };
    if (intentToInterest[intent]) Profile.addInterest(intentToInterest[intent], 2);

    const sendBtn = document.getElementById("a3m-send"), input = document.getElementById("a3m-input");
    if (sendBtn) sendBtn.disabled = true;
    if (input)   input.disabled   = true;
    showTyping();

    let reply = "";
    if      (settings.mode === "direct" && settings.apiKey)  { try { reply = await callDirectAI(text); } catch (e) { console.warn("Direct AI:", e.message); } }
    else if (settings.mode === "proxy"  && settings.proxyUrl){ try { reply = await callProxyAI(text);  } catch (e) { console.warn("Proxy AI:",  e.message); } }
    else if (settings.mode === "auto") {
      if (settings.apiKey)   try { reply = await callDirectAI(text); } catch {}
      if (!reply && settings.proxyUrl) try { reply = await callProxyAI(text); } catch {}
    }

    if (!reply) {
      const l = localSmartReply(text, intent);
      reply = l.text;
      if (l.designSpec) reply += `\n[GENERATE_DESIGN:${JSON.stringify(l.designSpec)}]`;
    }

    const cleanReply = String(reply).replace(/\n?\[GENERATE_DESIGN:[\s\S]*?\]\s*$/, "").trim();
    removeTyping();
    state.history.push({ role: "assistant", content: reply });

    const msgs  = document.getElementById("a3m-msgs");
    const w     = document.createElement("div"); w.className = "a3m-msg bot"; w.appendChild(makeAvatar());
    const bubble = document.createElement("div"); bubble.className = "a3m-bubble";
    w.appendChild(bubble); msgs?.appendChild(w); scrollToBottom();

    const ctxKey = detectCtxKey(cleanReply + " " + text);
    streamText(bubble, cleanReply, () => {
      const spec = parseAndApplyDesign(reply);
      if (spec) bubble.appendChild(buildDesignCard(spec));
      state.isTyping = false;
      if (sendBtn) sendBtn.disabled = false;
      if (input)   { input.disabled = false; setTimeout(() => input.focus(), 80); }
      setTimeout(() => showSuggestions(ctxKey), 400);
    });
  }

  // ════════════════════════════════════════════════════════════
  // AI CALLS
  // ════════════════════════════════════════════════════════════

  async function callDirectAI(userText) {
    const ctrl = new AbortController(), t = setTimeout(() => ctrl.abort(), settings.timeoutMs);
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": settings.apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
      body: JSON.stringify({ model: settings.model, system: buildSystemPrompt(), max_tokens: 1000, messages: [...state.history.slice(-14).filter(m => m.role !== "system"), { role: "user", content: userText }] }),
      signal: ctrl.signal,
    }).finally(() => clearTimeout(t));
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message || `HTTP ${res.status}`); }
    const d = await res.json();
    const txt = d.content?.find(b => b.type === "text")?.text;
    if (!txt) throw new Error("Empty response");
    return txt;
  }

  async function callProxyAI(userText) {
    const ctrl = new AbortController(), t = setTimeout(() => ctrl.abort(), settings.timeoutMs);
    const res = await fetch(settings.proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: settings.model, system: buildSystemPrompt(), max_tokens: 1000, messages: [...state.history.slice(-14).filter(m => m.role !== "system"), { role: "user", content: userText }] }),
      signal: ctrl.signal,
    }).finally(() => clearTimeout(t));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const d = await res.json();
    const txt = extractReply(d); if (!txt) throw new Error("Empty proxy");
    return txt;
  }

  function extractReply(d) {
    if (!d) return "";
    if (typeof d === "string") return d;
    if (d.reply) return String(d.reply);
    if (d.output_text) return String(d.output_text);
    if (Array.isArray(d.content)) { const f = d.content.find(x => typeof x?.text === "string"); if (f) return f.text; }
    if (Array.isArray(d.choices)) { const t = d.choices[0]?.message?.content || d.choices[0]?.text; if (typeof t === "string") return t; }
    return "";
  }

  function detectCtxKey(text) {
    const n = normalizeAr(text);
    if (/(منتج|تيشرت|هودي|كوب|قبعه|mug|starbucks)/.test(n)) return "products";
    if (/(سعر|دج|تكلف)/.test(n))                           return "prices";
    if (/(تصميم|لون|شعار|generate)/.test(n))                return "design";
    if (/(طباعه|dtg|uv|ليزر)/.test(n))                     return "printing";
    if (/(طلب|سله|checkout)/.test(n))                       return "order";
    if (/(هدية|gift|cadeau)/.test(n))                       return "gift";
    return null;
  }

  function parseAndApplyDesign(reply) {
    const m = String(reply || "").match(/\[GENERATE_DESIGN:({[\s\S]*?})\]/);
    if (!m) return null;
    try {
      const spec = JSON.parse(m[1]); state.lastSpec = spec;
      if (window.A3MDesignerAI?.applyDesignSpec) { window.A3MDesignerAI.applyDesignSpec(spec, { source: "chat" }); updateDesignContextBadge("تم إنشاء تصميم ✓"); }
      Profile.addInterest("designer", 3);
      const p = Profile.load(); p.designCount++; Profile.save();
      return spec;
    } catch { return null; }
  }

  function buildDesignCard(spec) {
    const card = document.createElement("div"); card.className = "a3m-design-card";
    const cv = document.createElement("div"); cv.className = "a3m-design-canvas";
    cv.style.cssText = `background:linear-gradient(135deg,${spec.bg || "#0b0f19"},${spec.color || "#2563eb"}33);color:${spec.textColor || "#fff"}`;
    const ti = document.createElement("div"); ti.className = "a3m-design-title"; ti.textContent = spec.title || "A3M Design";
    const su = document.createElement("div"); su.className = "a3m-design-sub";   su.textContent = spec.subtitle || "اقتراح من A3M Bot";
    cv.append(ti, su);
    const ac = document.createElement("div"); ac.className = "a3m-design-actions";
    const b1 = document.createElement("button"); b1.className = "a3m-design-btn primary"; b1.textContent = "🎨 افتح الاستوديو"; b1.onclick = openStudio;
    const b2 = document.createElement("button"); b2.className = "a3m-design-btn gold";    b2.textContent = "✨ طبّق التصميم";
    b2.onclick = () => {
      if (window.A3MDesignerAI?.applyDesignSpec) { window.A3MDesignerAI.applyDesignSpec(spec, { source: "chat" }); state.lastSpec = spec; updateDesignContextBadge("تم التطبيق ✓"); b2.textContent = "✅ تم التطبيق"; b2.disabled = true; }
      else openStudio();
    };
    ac.append(b1, b2); card.append(cv, ac); return card;
  }

  function openStudio() {
    if (state.isOpen) toggleChat();
    if (typeof window.openModePicker === "function") { window.openModePicker(); return; }
    if (typeof window.openDesigner   === "function") { window.openDesigner("scratch"); return; }
    window.location.hash = "#products";
  }

  function detectDesignStudio() {
    const obs = new MutationObserver(() => {
      const vis = document.getElementById("designerModal")?.classList.contains("open");
      const b   = document.getElementById("a3m-design-context");
      if (b) {
        b.style.display = vis ? "block" : "none";
        if (vis) _tickContextBadge(); // restart position tracking
      }
    });
    obs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
  }

  // ════════════════════════════════════════════════════════════
  // 🔥 LOCAL SMART REPLY — enhanced with intent + sentiment
  // ════════════════════════════════════════════════════════════

  function localSmartReply(text, intent) {
    const n   = normalizeAr(text);
    const sen = detectSentiment(text);
    const p   = Profile.load();
    const top = Profile.topInterests(1)[0];

    // Greetings — personalized
    if (intent === "greeting" || /(السلام|مرحبا|اهلا|سلام|bonjour|hello|hi\b|hey\b)/i.test(n)) {
      if (Profile.isReturning()) {
        const prod = { tshirt:"التيشرتات", mug:"الأكواب", hoodie:"الهوديات", hat:"القبعات" }[top];
        return { text: `أهلاً بعودتك! 👋 رأيت اهتمامك بـ **${prod || "منتجاتنا"}** — هل تريد مواصلة من حيث توقفنا؟` };
      }
      return { text: "أهلاً وسهلاً! 👋 كيف أساعدك اليوم؟\n\n• 🛍️ المنتجات\n• 🎨 التصميم\n• 💰 الأسعار\n• 🖨️ الطباعة" };
    }

    // Thanks
    if (intent === "thanks") return { text: "العفو! 😊 أنا دائماً هنا إذا احتجت أي شيء." };

    // Gift recommendations — personalized
    if (intent === "gift" || /(هدية|gift|cadeau|عيد|مناسبة)/.test(n)) {
      return { text: "🎁 أفضل هدايا مخصصة:\n\n• **كوب سيراميك** بصورة أو اسم — 800دج\n• **تيشرت مخصص** بتصميمك — 1200دج\n• **قبعة بتطريز شعارك** — 1000دج\n• **مجموعة** (كوب + تيشرت) — 2500دج\n\nكل هدية تأتي مغلفة باحترافية 🎀\n\n💡 أي مناسبة تفكر فيها؟" };
    }

    // Products
    if (intent === "product_info" || /(ماذا تبيع|المنتجات|products|catalog)/i.test(n)) {
      return { text: "🛍️ منتجاتنا:\n\n• **تيشرتات** — قطن عالي الجودة\n• **هوديات** — مريحة وأنيقة\n• **أكواب سيراميك** — أبيض وأسود 330ml\n• **أكواب ستاربكس** — ورقية فاخرة\n• **قبعات** — Cap وBucket\n• **حقائب Tote**\n• **بطاقات أعمال** — ورق فاخر\n• **ملصقات** — مقاومة للماء\n• **طباعة A3/A4/A5**\n• **نقش ليزر** — معادن وخشب وأكريليك" };
    }

    // Mugs specific
    if (/(كوب|mug|starbucks|سيراميك)/i.test(n) && intent !== "design") {
      return { text: "☕ أكوابنا:\n\n• **كوب سيراميك أبيض** — 330ml، طباعة حرارية\n• **كوب سيراميك أسود** — 330ml، أنيق\n• **كوب ستاربكس ورقي أبيض** — حجم وسط\n• **كوب ستاربكس ورقي أسود** — حجم وسط\n\n💰 السعر: **800–1500 دج** حسب الكمية\n✦ أفضل هدية مخصصة لأي مناسبة 🎁\n\nتريد كوب بتصميم خاص؟" };
    }

    // Prices
    if (intent === "price" || /(الاسعار|السعر|price|كم يكلف|combien|tarif)/i.test(n)) {
      return { text: "💰 الأسعار التقريبية:\n\n| المنتج | السعر |\n• **تيشرت** — 1200–2500 دج\n• **هودي** — 2800–4500 دج\n• **كوب سيراميك** — 800–1500 دج\n• **كوب ستاربكس** — 600–1200 دج\n• **قبعة** — 1000–2000 دج\n• **حقيبة Tote** — 1500–3000 دج\n• **بطاقات (100ق)** — 2000–4000 دج\n• **طباعة A4** — 100–300 دج\n\n✦ خصم **20%** للطلبات فوق 5000 دج\n✦ خصم الكميات: فوق 50 قطعة 15% إضافي" };
    }

    // Printing types
    if (intent === "printing" || /(طباعة|dtg|uv|حراري|تطريز|ليزر|فينيل|offset|silk)/i.test(n)) {
      return { text: "🖨️ أنواع الطباعة:\n\n• **حرارية** — للأقمشة، ألوان زاهية\n• **تطريز** — قبعات وبولو، متين\n• **DTG** — رقمية مباشرة، تفاصيل عالية\n• **UV** — أسطح صلبة (أكواب، أكريليك)\n• **ليزر** — معادن وخشب وزجاج\n• **فينيل** — حروف وأرقام دقيقة\n• **سيلك سكرين** — للكميات الكبيرة\n• **أوفست** — ورق وكروت احترافية" };
    }

    // Delivery
    if (intent === "delivery" || /(توصيل|delivery|livraison|شحن)/i.test(n)) {
      return { text: "🚚 التوصيل:\n\n• جميع ولايات الجزائر الـ 58\n• **3–7 أيام** عمل\n• دفع عند الاستلام ✅\n• تأكيد الطلب خلال 24 ساعة\n• تتبع الشحنة عبر WhatsApp" };
    }

    // Discounts
    if (intent === "discount" || /(خصم|discount|promo|كود|code)/i.test(n)) {
      return { text: "🎁 كودات الخصم الحالية:\n\n• **A3M10** — خصم 10% على أي طلب\n• **STUDENT** — خصم 15% للطلاب\n• **WELCOME** — خصم 25% للمشتركين الجدد\n• **A3M20** — خصم 20%\n• **VIP50** — خصم 50% (VIP فقط)\n\nأدخل الكود في صفحة الدفع 🛒" };
    }

    // Contact
    if (intent === "contact" || /(تواصل|contact|whatsapp|واتساب|هاتف)/i.test(n)) {
      return { text: "📞 تواصل معنا:\n\n• **WhatsApp**: wa.me/213555000000\n• **البريد**: contact@a3mprint.dz\n• **Instagram**: @a3mprint\n• **أوقات العمل**: الأحد–الجمعة، 8ص–6م\n\nنرد خلال ساعة 🕐" };
    }

    // Design request
    if (intent === "design" || /صمم|تصميم|design|logo|شعار|اعمل|سويلي/i.test(n)) {
      const spec = buildDesignSpec(text);
      // Update profile
      Profile.addInterest("designer", 4);
      return { text: spec._reply || "أكيد! جهزت لك تصميماً أولياً 🎨\nاضغط **طبّق التصميم** أو **افتح الاستوديو** لتخصيصه.", designSpec: spec };
    }

    // Order process
    if (intent === "order" || /(طلب|اطلب|اشتري|buy|commander)/i.test(n)) {
      return { text: "✅ لإتمام طلبك:\n\n1. أضف المنتجات للسلة 🛒\n2. اضغط **إتمام الطلب**\n3. أدخل اسمك، هاتفك، عنوانك\n4. اختر الدفع عند الاستلام أو إلكتروني\n5. سنتواصل معك خلال **24 ساعة** ✓\n\nهل تحتاج مساعدة في خطوة معينة؟" };
    }

    // Studio
    if (/(استوديو|studio|designer|canvas)/i.test(n)) {
      return { text: "🎨 استوديو A3M:\n\n• نصوص بـ 10+ خطوط احترافية\n• رفع صورك الخاصة\n• أشكال جاهزة وألوان\n• معاينة 3D على المنتج\n• تحميل PNG/SVG\n• ذكاء اصطناعي يساعدك في التصميم\n\nاضغط **ابدأ التصميم** في الشريط العلوي!" };
    }

    // Urgent sentiment
    if (sen === "urgent") return { text: "🚨 فهمت أن الأمر عاجل!\n\nتواصل مباشرة عبر **WhatsApp**: wa.me/213555000000\nسنرد في أقل من 30 دقيقة ⚡" };

    // Negative — handle complaint
    if (sen === "negative") return { text: "آسف على الإزعاج 😔\n\nيرجى تواصل مع فريقنا مباشرة لحل المشكلة:\n• **WhatsApp**: wa.me/213555000000\n• نضمن حل مشكلتك خلال 24 ساعة ✓" };

    // Default — personalized based on top interest
    const topRecs = {
      tshirt:   "👕 اقترح عليك تيشرت مخصص!\nسعره يبدأ من **1200 دج** — ما رأيك نصمم واحد معاً؟",
      mug:      "☕ لديك ذوق رائع في الأكواب!\nكوب سيراميك بتصميمك من **800 دج** فقط.",
      hoodie:   "🧥 الهوديات المخصصة شائعة جداً!\nسعر يبدأ من **2800 دج** مع طباعة احترافية.",
      designer: "🎨 أنت مصمم محترف!\nجرب الاستوديو الجديد — فيه أدوات متقدمة.",
    };

    if (top && topRecs[top]) return { text: topRecs[top] };

    return { text: "أقدر أساعدك في:\n• 🛍️ **المنتجات والأسعار**\n• 🎨 **التصميم**\n• 🖨️ **الطباعة**\n• 🚚 **التوصيل**\n• 🎁 **الهدايا المخصصة**\n\nما الذي يهمك؟ ✨" };
  }

  function pickColors(t) {
    const n = normalizeAr(t);
    if (/(احمر|red|rouge)/.test(n))       return { fg:"#fff", accent:"#ef4444", bg:"#2a0f12" };
    if (/(اخضر|green|vert)/.test(n))      return { fg:"#fff", accent:"#22c55e", bg:"#0f2416" };
    if (/(بنفسجي|purple|violet)/.test(n)) return { fg:"#fff", accent:"#7c3aed", bg:"#140f24" };
    if (/(ذهبي|gold|or)/.test(n))         return { fg:"#111", accent:"#c9a84c", bg:"#f5efe0" };
    if (/(اسود|black|noir|dark)/.test(n)) return { fg:"#fff", accent:"#374151", bg:"#0b0f19" };
    if (/(وردي|pink|rose)/.test(n))       return { fg:"#fff", accent:"#ec4899", bg:"#26101f" };
    if (/(ازرق|blue|bleu)/.test(n))       return { fg:"#fff", accent:"#2563eb", bg:"#0b0f19" };
    if (/(برتقالي|orange)/.test(n))       return { fg:"#fff", accent:"#f97316", bg:"#1f0f00" };
    return { fg:"#fff", accent:"#2563eb", bg:"#0b0f19" };
  }

  function buildDesignSpec(prompt) {
    const n = normalizeAr(prompt), c = pickColors(prompt);
    const isLogo    = /(logo|شعار|براند|brand)/.test(n);
    const isCard    = /(كرت|business.?card|card)/.test(n);
    const isPoster  = /(poster|ملصق|banner|بوستر)/.test(n);
    const isTshirt  = /(تيشرت|tshirt|shirt|هودي|hoodie)/.test(n);
    const isMug     = /(كوب|mug)/.test(n);
    const type = isLogo?"logo":isCard?"card":isPoster?"poster":isTshirt?"tshirt":isMug?"mug":"text";
    const titles  = { logo:"YOUR BRAND", card:"BUSINESS CARD", poster:"SPECIAL DROP", tshirt:"A3M STYLE", mug:"COFFEE TIME", text:"A3M DESIGN" };
    const subs    = { logo:"Premium Print Studio", card:"Clean & Modern", poster:"Eye-catching", tshirt:"Custom Apparel", mug:"For coffee lovers", text:"Ready for print" };
    const replies = { logo:"تصميم شعار أولي جاهز! 🎨\n\n", card:"تصور كرت أعمال أنيق 💼\n\n", poster:"بوستر جذاب جاهز! 🌟\n\n" };
    return { type, color:c.accent, bg:c.bg, textColor:c.fg, title:titles[type]||"A3M DESIGN", subtitle:subs[type]||"Ready for print", _reply:replies[type]||"أكيد! جهزت لك تصميماً 🎨\n\n" };
  }

  // ════════════════════════════════════════════════════════════
  // INIT
  // ════════════════════════════════════════════════════════════

  function init() {
    ensureStyle();
    buildHTML();
    Tracker.start();

    window.A3MBot = {
      toggleChat, clearChat, sendMessage, sendText, openStudio, openHistory, closeHistory,
      getProfile:    () => Profile.load(),
      getTopInterests: () => Profile.topInterests(5),
      setMode(m)    { settings.mode = m; localStorage.setItem("a3m_ai_mode", m); },
      setApiKey(k)  { settings.apiKey = k; localStorage.setItem("a3m_ai_key", k); },
      setProxyUrl(u){ settings.proxyUrl = u; localStorage.setItem("a3m_ai_proxy_url", u); },
      setModel(m)   { settings.model = m; localStorage.setItem("a3m_ai_model", m); },
      getLastDesign: () => state.lastSpec,
      showNudge,
      version: VERSION,
    };

    console.log(`✅ A3M Bot v${VERSION} — Mode: ${settings.mode} | Profile: ${Profile.topInterests(2).join(", ") || "new visitor"}`);
  }

  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", init); }
  else { init(); }

})();
