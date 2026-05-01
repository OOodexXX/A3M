// ============================================================
// designer/designer.js  –  A3M Print  –  Designer Core
// openDesigner، closeDesigner، templates، AI panel، ترجمة
// يجب تحميله بعد canvas.js و tools.js
// ============================================================

(function () {
  "use strict";

  const PROD_EMOJI = { tshirt: "👕", mug: "☕", hat: "🧢", bag: "🎒", paper: "📄" };
  let aiPanelInjected = false;

  // ════════════════════════════════════════════════════════════
  // TEMPLATES
  // ════════════════════════════════════════════════════════════

  const TEMPLATES = [
    { name: "Bold Logo",    icon: "🅰", fn: () => { clearCanvas(); setBg("#111111"); addTextLayer("YOUR BRAND", 52,"Permanent Marker","#ffffff","center",250,210); addTextLayer("EST. 2024",20,"Bebas Neue","#c9a84c","center",250,275); addRect(250,310,280,2,"#c9a84c","",0,80); } },
    { name: "Graffiti",     icon: "✏", fn: () => { clearCanvas(); setBg("#0a0a0a"); addTextLayer("STREET",78,"Permanent Marker","#7c3aed","center",250,200); addTextLayer("STYLE",52,"Pacifico","#c9a84c","center",250,290); } },
    { name: "Minimal",      icon: "◻", fn: () => { clearCanvas(); setBg("#ffffff"); addRect(250,250,320,320,"#f5f5f5","#111111",1,100); addTextLayer("MINIMAL",58,"Bebas Neue","#111111","center",250,245); } },
    { name: "Script",       icon: "𝒮", fn: () => { clearCanvas(); setBg("#fafaf5"); addTextLayer("Hello",70,"Dancing Script","#111111","center",250,210); addTextLayer("World",40,"Dancing Script","#c9a84c","center",250,285); } },
    { name: "Orbitron",     icon: "🛸", fn: () => { clearCanvas(); setBg("#050511"); addCircle(250,190,70,"#7c3aed","#c9a84c",85); addTextLayer("FUTURE",55,"Orbitron","#7c3aed","center",250,310); addTextLayer("DESIGN",26,"Orbitron","#c9a84c","center",250,370); } },
    { name: "Classic",      icon: "🏅", fn: () => { clearCanvas(); setBg("#ffffff"); addRect(250,250,400,400,"#111111","",0,100); addTextLayer("A3M",70,"Permanent Marker","#ffffff","center",250,210); addTextLayer("PRINT STUDIO",22,"Bebas Neue","#c9a84c","center",250,295); addRect(250,340,200,2,"#c9a84c","",0,100); } },
    { name: "Neon Glow",    icon: "💡", fn: () => { clearCanvas(); setBg("#050505"); addTextLayer("NEON",88,"Bebas Neue","#00ffcc","center",250,220); addTextLayer("VIBES",55,"Bebas Neue","#ff00ff","center",250,310); } },
    { name: "Vintage",      icon: "🎖", fn: () => { clearCanvas(); setBg("#f5e6c8"); addCircle(250,200,80,"#8B4513","",90); addTextLayer("SINCE",22,"Bebas Neue","#f5e6c8","center",250,180); addTextLayer("2024",36,"Bebas Neue","#f5e6c8","center",250,218); addTextLayer("AUTHENTIC GOODS",20,"Bebas Neue","#8B4513","center",250,330); } },
    { name: "Dark Luxury",  icon: "💎", fn: () => { clearCanvas(); setBg("#0a0a0a"); addRect(250,250,360,360,"#0f0f0f","#c9a84c",1,100); addTextLayer("LUXE",66,"Dancing Script","#c9a84c","center",250,230); addTextLayer("COLLECTION",20,"Bebas Neue","#888","center",250,295); addRect(250,330,150,1,"#c9a84c","",0,60); } },
    { name: "Cyber Punk",   icon: "⚡", fn: () => { clearCanvas(); setBg("#0d001a"); addRect(250,130,400,55,"#ff003c","",0,90); addTextLayer("CYBER",66,"Orbitron","#00ffff","center",250,220); addTextLayer("PUNK 2077",30,"Orbitron","#ff003c","center",250,295); addRect(250,330,400,2,"#00ffff","",0,70); } },
    { name: "Badge",        icon: "🔰", fn: () => { clearCanvas(); setBg("#ffffff"); addCircle(250,230,120,"#1a237e","#c9a84c",100); addCircle(250,230,90,"#283593","",100); addTextLayer("BRAND",34,"Bebas Neue","#ffffff","center",250,218); addTextLayer("★ OFFICIAL ★",16,"Bebas Neue","#c9a84c","center",250,255); } },
    { name: "Pastel Dream", icon: "🌸", fn: () => { clearCanvas(); setBg("#fff0f5"); addCircle(150,150,60,"#ffb3c6","",60); addCircle(360,350,80,"#c1b3ff","",50); addTextLayer("dream",68,"Dancing Script","#d63384","center",250,240); addTextLayer("& create",36,"Dancing Script","#6f42c1","center",250,310); } },
  ];

  window.TEMPLATES = TEMPLATES;

  // ════════════════════════════════════════════════════════════
  // PRODUCT UI
  // ════════════════════════════════════════════════════════════

  function changeProduct() {
    const cp = document.getElementById("canvasProduct");
    if (cp) window._A3MCanvas.canvasProdType = cp.value;
    drawAll();
  }

  function syncCanvasProductSelect() {
    const cp = document.getElementById("canvasProduct");
    if (cp) cp.value = window._A3MCanvas.canvasProdType;
  }

  function updateCanvasModeBadge() {
    const badge = document.getElementById("topbarTitle");
    if (badge && !badge.dataset.manual) {
      const map = { tshirt:"تيشرت", mug:"كوب", hat:"قبعة", bag:"حقيبة", paper:"ورقة" };
      badge.textContent = `Design Studio • ${map[window._A3MCanvas.canvasProdType] || "منتج"}`;
    }
  }

  // Expose for drawAll callback in canvas.js
  window.syncCanvasProductSelect = syncCanvasProductSelect;
  window.updateCanvasModeBadge   = updateCanvasModeBadge;

  // ════════════════════════════════════════════════════════════
  // TEMPLATE BUILDERS
  // ════════════════════════════════════════════════════════════

  function buildTemplates() {
    const tg = document.getElementById("templatesGrid");
    if (!tg) return;
    tg.innerHTML = TEMPLATES.map((t, i) => `
      <div class="template-thumb" onclick="TEMPLATES[${i}].fn();showToast('✦ ${t.name}')" title="${t.name}">
        <span class="t-icon">${t.icon}</span><span class="t-name">${t.name}</span>
      </div>`).join("");
  }

  function buildTmplMini() {
    const grid = document.getElementById("dsTmplMini");
    if (!grid) return;
    grid.innerHTML = TEMPLATES.map((t, i) => `
      <div class="ds-tmpl-mini-item" onclick="TEMPLATES[${i}].fn();showToast('✦ ${t.name}')" title="${t.name}">
        <span style="font-size:1.3rem">${t.icon}</span>
        <span class="ds-tmpl-mini-name">${t.name}</span>
      </div>`).join("");
  }

  // ════════════════════════════════════════════════════════════
  // TRANSLATION
  // ════════════════════════════════════════════════════════════

  function translateDesignerUI() {
    const lang = window.currentLang || localStorage.getItem("a3m_lang") || "ar";
    const prodNames = {
      ar: ["👕 تيشرت","☕ كوب","🧢 قبعة","🎒 حقيبة","📄 ورقة","🧥 هودي","📱 جراب","📓 دفتر"],
      en: ["👕 T-Shirt","☕ Mug","🧢 Hat","🎒 Bag","📄 Paper","🧥 Hoodie","📱 Phone Case","📓 Notebook"],
      fr: ["👕 T-Shirt","☕ Tasse","🧢 Casquette","🎒 Sac","📄 Papier","🧥 Sweat","📱 Coque","📓 Carnet"],
    };
    const prodSel = document.getElementById("canvasProduct");
    if (prodSel) {
      const opts = prodSel.querySelectorAll("option");
      const names = prodNames[lang] || prodNames.ar;
      opts.forEach((opt, i) => { if (names[i]) opt.textContent = names[i]; });
    }
    // ✅ delegate full i18n to the modal's system
    if (typeof window.applyDesignerI18n === "function") window.applyDesignerI18n();
  }

  // ════════════════════════════════════════════════════════════
  // AI PANEL
  // ════════════════════════════════════════════════════════════

  function addSmartPalette() {
    if (document.getElementById("a3m-ai-panel")) return;
    const panel = document.querySelector(".d-panel");
    if (!panel) return;
    const lang = window.currentLang || localStorage.getItem("a3m_lang") || "ar";
    const dt = {
      ar: { aiTitle:"ذكاء التصميم", aiPlaceholder:"مثال: شعار أسود وذهبي لبراند ملابس", apply:"✨ طبق", suggest:"🧠 اقتراح", clear:"🧹 مسح", aiHint:"صِف تصميمك ثم اضغط <b>طبق</b>." },
      en: { aiTitle:"AI Design",    aiPlaceholder:"e.g. Black & gold logo for clothing brand",     apply:"✨ Apply",   suggest:"🧠 Suggest", clear:"🧹 Clear", aiHint:"Describe your design and press <b>Apply</b>." },
      fr: { aiTitle:"IA Design",    aiPlaceholder:"ex: Logo noir et or pour une marque",           apply:"✨ Appliquer",suggest:"🧠 Suggérer",clear:"🧹 Effacer",aiHint:"Décrivez votre design et appuyez <b>Appliquer</b>." },
    };
    const d = dt[lang] || dt.ar;
    const section = document.createElement("div");
    section.className = "d-panel-section"; section.id = "a3m-ai-panel";
    section.innerHTML = `
      <div class="d-panel-title">🤖 ${d.aiTitle}</div>
      <div style="display:flex;flex-direction:column;gap:.5rem">
        <textarea class="d-input" id="a3mAiPrompt" placeholder="${d.aiPlaceholder}" rows="2" style="resize:vertical;min-height:52px;font-size:12px"></textarea>
        <div style="display:flex;gap:.35rem;flex-wrap:wrap">
          <button class="d-small-btn" id="a3mAiApplyBtn"   style="flex:1;justify-content:center">${d.apply}</button>
          <button class="d-small-btn" id="a3mAiSuggestBtn" style="flex:1;justify-content:center">${d.suggest}</button>
          <button class="d-small-btn" id="a3mAiClearBtn">${d.clear}</button>
        </div>
        <div style="font-size:11px;color:#4b5563;line-height:1.6">${d.aiHint}</div>
      </div>`;
    panel.insertBefore(section, panel.firstChild);
    document.getElementById("a3mAiApplyBtn").onclick   = () => { const p = document.getElementById("a3mAiPrompt")?.value || ""; if (window.A3MDesignerAI) window.A3MDesignerAI.applyPrompt(p); };
    document.getElementById("a3mAiSuggestBtn").onclick = () => { const p = document.getElementById("a3mAiPrompt")?.value || ""; if (window.A3MDesignerAI) { const spec = window.A3MDesignerAI.suggestSpecFromPrompt(p); window.A3MDesignerAI.applyDesignSpec(spec, { source:"suggest" }); } };
    document.getElementById("a3mAiClearBtn").onclick   = () => { if (confirm("مسح اللوحة؟")) clearCanvas(); };
  }

  // ════════════════════════════════════════════════════════════
  // CANVAS EVENTS BINDING
  // ════════════════════════════════════════════════════════════

  function bindCanvasEvents() {
    const { canvas, _onPointerDown, _onPointerMove, _onPointerUp } = window._A3MCanvas;
    if (!canvas) return;
    const bgEl = document.getElementById("bgColor");
    if (bgEl && !bgEl._a3mBound) {
      bgEl._a3mBound = true;
      bgEl.addEventListener("input", () => { window._A3MCanvas.bgColorVal = bgEl.value; drawAll(); });
    }
    if (canvas._a3mEvBound) return;
    canvas._a3mEvBound = true;
    canvas.addEventListener("mousedown",  _onPointerDown);
    canvas.addEventListener("mousemove",  _onPointerMove);
    canvas.addEventListener("mouseup",    _onPointerUp);
    canvas.addEventListener("mouseleave", _onPointerUp);
    canvas.addEventListener("touchstart", e => { e.preventDefault(); _onPointerDown(e); }, { passive: false });
    canvas.addEventListener("touchmove",  e => { e.preventDefault(); _onPointerMove(e); }, { passive: false });
    canvas.addEventListener("touchend",   e => { e.preventDefault(); _onPointerUp(); },   { passive: false });
    canvas.addEventListener("dblclick", e => {
      const { x, y } = window._A3MCanvas.getCanvasXY(e);
      const layers = window._A3MCanvas.layers;
      for (let i = layers.length - 1; i >= 0; i--) {
        if (layers[i].type === "text" && layers[i].visible && window._A3MCanvas.hitTestLayer(layers[i], x, y)) {
          window._A3MCanvas.selectedId = layers[i].id;
          const inp = document.getElementById("txtContent");
          if (inp) { inp.value = layers[i].text; inp.focus(); inp.select(); }
          drawAll(); break;
        }
      }
    });
  }

  // ════════════════════════════════════════════════════════════
  // AI DESIGN ENGINE
  // ════════════════════════════════════════════════════════════

  function parseDesignDirective(text) {
    const match = String(text || "").match(/\[GENERATE_DESIGN:({[\s\S]*?})\]/);
    if (!match) return null;
    try { return JSON.parse(match[1]); } catch { return null; }
  }

  function suggestionSpec(prompt) {
    const p = String(prompt || "").toLowerCase();
    const color = p.includes("ذهبي")||p.includes("gold") ? "#c9a84c" : p.includes("purple")||p.includes("بنفسجي") ? "#7c3aed" : p.includes("أحمر")||p.includes("red") ? "#ef4444" : p.includes("أخضر")||p.includes("green") ? "#22c55e" : "#2563eb";
    const isLogo   = /(logo|شعار|براند|brand)/i.test(p);
    const isCard   = /(card|كرت|business)/i.test(p);
    const isPoster = /(poster|بوستر|ملصق|banner)/i.test(p);
    const isQuote  = /(quote|اقتباس|عبارة)/i.test(p);
    if (isLogo)   return { type:"logo",   title:extractTitle(prompt,"YOUR BRAND"),    subtitle:extractSubtitle(prompt,"Premium Print Studio"), color, bg:"#0b0f19", font:"Bebas Neue",     clear:true };
    if (isCard)   return { type:"card",   title:extractTitle(prompt,"BUSINESS CARD"), subtitle:extractSubtitle(prompt,"Clean & modern"),        color, bg:"#111827", font:"Cairo",          clear:true };
    if (isPoster) return { type:"poster", title:extractTitle(prompt,"SPECIAL DROP"),  subtitle:extractSubtitle(prompt,"Eye-catching layout"),   color, bg:"#0f172a", font:"Bebas Neue",     clear:true };
    if (isQuote)  return { type:"text",   title:extractTitle(prompt,"QUOTE"),         subtitle:extractSubtitle(prompt,"Elegant typography"),    color, bg:"#ffffff", font:"Dancing Script", clear:true };
    return { type:"text", title:extractTitle(prompt,"A3M DESIGN"), subtitle:extractSubtitle(prompt,"Ready for print"), color, bg:"#0b0f19", font:"Bebas Neue", clear:true };
  }

  function extractTitle(prompt, fallback) {
    const raw = String(prompt||"").trim();
    if (!raw) return fallback;
    const m = raw.match(/(?:logo|شعار|كرت|card|poster|بوستر|تيشرت|shirt|mug|quote)\s*(?:لـ|for|of)?\s*([^،,.;\n]+)/i);
    if (m?.[1]) return m[1].trim().toUpperCase().slice(0, 20);
    return fallback;
  }

  function extractSubtitle(prompt, fallback) {
    const raw = String(prompt||"").trim();
    if (!raw) return fallback;
    if (/عصري|modern/i.test(raw))    return "Modern / clean";
    if (/فخم|premium|luxury/i.test(raw)) return "Premium look";
    if (/minimal/i.test(raw))        return "Minimal style";
    if (/street|ستريت|graffiti/i.test(raw)) return "Street style";
    return fallback;
  }

  function layoutFromSpec(spec) {
    const layout = [];
    const bg = spec.bg || "#0b0f19", main = spec.color || "#2563eb";
    if (spec.type === "logo") {
      layout.push({ type:"shape", shape:"circle", x:250, y:175, w:160, h:160, fillColor:main, strokeColor:"#ffffff", strokeWidth:2, opacity:100 });
      layout.push({ type:"text", text:spec.title||"YOUR BRAND", x:250, y:330, fontSize:50, font:spec.font||"Bebas Neue", fillColor:"#ffffff" });
      layout.push({ type:"text", text:spec.subtitle||"Premium Print Studio", x:250, y:385, fontSize:17, font:"Cairo", fillColor:"#d1d5db" });
    } else if (spec.type === "card") {
      layout.push({ type:"shape", shape:"rect", x:250, y:250, w:430, h:260, fillColor:bg, strokeColor:main, strokeWidth:3, opacity:100 });
      layout.push({ type:"text", text:spec.title||"BUSINESS CARD", x:250, y:205, fontSize:46, font:"Bebas Neue", fillColor:main });
      layout.push({ type:"text", text:spec.subtitle||"Clean & modern", x:250, y:255, fontSize:18, font:"Cairo", fillColor:"#ffffff" });
    } else if (spec.type === "poster") {
      layout.push({ type:"shape", shape:"circle", x:390, y:120, w:170, h:170, fillColor:main, strokeColor:"", strokeWidth:0, opacity:90 });
      layout.push({ type:"text", text:spec.title||"SPECIAL DROP", x:250, y:225, fontSize:58, font:"Bebas Neue", fillColor:"#ffffff" });
      layout.push({ type:"text", text:spec.subtitle||"Eye-catching layout", x:250, y:290, fontSize:22, font:"Cairo", fillColor:"#e5e7eb" });
    } else {
      layout.push({ type:"text",  text:spec.title||"A3M DESIGN", x:250, y:210, fontSize:56, font:spec.font||"Bebas Neue", fillColor:main });
      layout.push({ type:"text",  text:spec.subtitle||"Ready for print", x:250, y:290, fontSize:20, font:"Cairo", fillColor:"#d1d5db" });
      layout.push({ type:"shape", shape:"circle", x:390, y:120, w:120, h:120, fillColor:main, strokeColor:"", strokeWidth:0, opacity:85 });
    }
    return { bg, layout };
  }

  function applyDesignSpec(spec, options = {}) {
    if (!spec) return null;
    window._A3MCanvas.saveHist();
    if (spec.clear !== false) { window._A3MCanvas.layers = []; window._A3MCanvas.selectedId = null; }
    if (spec.bg) window._A3MCanvas.bgColorVal = spec.bg;
    const normalized = layoutFromSpec(spec);
    window._A3MCanvas.bgColorVal = normalized.bg || window._A3MCanvas.bgColorVal;
    const bgEl = document.getElementById("bgColor");
    if (bgEl) bgEl.value = window._A3MCanvas.bgColorVal;
    normalized.layout.forEach(el => {
      if (el.type === "text") addTextLayer(el.text, el.fontSize||40, el.font||"Cairo", el.fillColor||"#fff", "center", el.x||250, el.y||250);
      else {
        const shape = el.shape || "rect";
        if      (shape === "rect")   addRect(el.x||250,el.y||250,el.w||150,el.h||80,el.fillColor,el.strokeColor,el.strokeWidth,el.opacity);
        else if (shape === "circle") addCircle(el.x||250,el.y||250,Math.round((el.w||120)/2),el.fillColor,el.strokeColor,el.opacity);
        else                         addTriangle(el.x||250,el.y||250,el.w||120,el.h||100,el.fillColor,el.strokeColor,el.opacity);
      }
    });
    drawAll();
    showToast(options.source === "chat" ? "✨ تم تطبيق التصميم" : "✨ جاهز");
    return spec;
  }

  function applyPrompt(prompt) { return applyDesignSpec(suggestionSpec(prompt), { source:"prompt" }); }

  window.A3MDesignerAI = {
    parseDesignDirective, suggestSpecFromPrompt: suggestionSpec,
    applyDesignSpec, applyPrompt, maybeApplyFromText: (text) => { const spec = parseDesignDirective(text); return spec ? applyDesignSpec(spec, { source:"chat" }) : null; },
    summarizeCurrentDesign: () => summarizeDesign(),
    onChange: (cb) => { if (typeof cb === "function") window.A3MDesignerAI._callbacks.push(cb); },
    _callbacks: [],
  };

  // ════════════════════════════════════════════════════════════
  // OPEN / CLOSE DESIGNER
  // ════════════════════════════════════════════════════════════

  function openDesigner(mode) {
    if (typeof closeModePicker === "function") closeModePicker();
    const dm = document.getElementById("designerModal");
    if (!dm) { console.error("A3M: designerModal element not found"); return; }
    dm.classList.add("open");

    // ✅ FIX: إذا _A3MCanvas مش موجود بعد، انتظر قليلاً ثم حاول مجدداً
    if (!window._A3MCanvas) {
      console.warn("A3M: _A3MCanvas not ready yet, retrying in 300ms...");
      setTimeout(() => openDesigner(mode), 300);
      return;
    }
    window._A3MCanvas.resetDesignerState?.();

    if (typeof mode === "string") {
      const lang = window.currentLang || localStorage.getItem("a3m_lang") || "ar";
      const labels = { template:{ar:"القوالب الجاهزة",en:"Template Mode",fr:"Mode Modèles"}, scratch:{ar:"من الصفر",en:"Scratch Mode",fr:"Mode Libre"} };
      const titleEl = document.getElementById("topbarTitle");
      if (titleEl) { titleEl.dataset.manual = "1"; titleEl.textContent = labels[mode]?.[lang] || mode; }
    }

    requestAnimationFrame(() => {
      setTimeout(() => {
        if (!initCanvasRefs()) {
          console.error("A3M: canvas not found in DOM");
          if (typeof showToast === "function") showToast("⚠️ خطأ في تحميل الدزاينر، حاول مجدداً", "error");
          dm.classList.remove("open");
          return;
        }
        clearCanvas(); drawAll(); buildTemplates(); buildTmplMini(); addSmartPalette();
        translateDesignerUI(); bindCanvasEvents(); updateUndoRedoUI();
        window._A3MCanvas.injectRulerCanvas(); setTimeout(() => window._A3MCanvas.drawRulers(), 60);
        if (typeof window.dsFitCanvas === "function") setTimeout(window.dsFitCanvas, 80);
      }, 30);
    });
  }

  function closeDesigner() {
    document.getElementById("designerModal")?.classList.remove("open");
  }

  function initDesigner(mode) { openDesigner(mode); }

  // ════════════════════════════════════════════════════════════
  // EXPOSE TO WINDOW
  // ════════════════════════════════════════════════════════════

  Object.assign(window, {
    openDesigner, closeDesigner, initDesigner,
    buildTemplates, buildTmplMini,
    translateDesignerUI, addSmartPalette,
    changeProduct, syncCanvasProductSelect, updateCanvasModeBadge,
    applyDesignSpec, applyPrompt,
    _A3MDesignerInternals: { summarizeDesign, changeProduct },
  });

  // ── Init ──
  document.addEventListener("DOMContentLoaded", () => {
    const cp = document.getElementById("canvasProduct");
    // Guard: canvas.js must have run and set _A3MCanvas before we access it
    if (cp && window._A3MCanvas) window._A3MCanvas.canvasProdType = cp.value;
    window._a3mModulesReady = true;
    window.dispatchEvent(new Event("a3m-ready"));
  });

})();
