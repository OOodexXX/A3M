// designer-extras-inline.js — A3M Print — Designer UI helpers
(function(){
  // Zoom
  let _zoom = 1;
  window.dsZoom = function(delta) {
    _zoom = Math.max(0.25, Math.min(4, _zoom + delta));
    const w = document.getElementById('dsCanvasWrap');
    if (w) w.style.transform = `scale(${_zoom})`;
    const v = document.getElementById('dsZoomVal');
    if (v) v.textContent = Math.round(_zoom * 100) + '%';
  };
  window.dsFitCanvas = function() {
    const wrap = document.getElementById('dsCanvasWrap');
    if (!wrap) return;
    const canvas = document.getElementById('designCanvas');
    if (!canvas) return;
    const pw = wrap.clientWidth, ph = wrap.clientHeight;
    const cw = canvas.width, ch = canvas.height;
    const ratio = Math.min((pw - 80) / cw, (ph - 80) / ch, 1);
    _zoom = ratio;
    wrap.style.transform = `scale(${ratio})`;
    const v = document.getElementById('dsZoomVal');
    if (v) v.textContent = Math.round(ratio * 100) + '%';
  };

  // Letter spacing
  window.dsSetLetterSpacing = function(val) {
    if (typeof layers === 'undefined' || !selectedId) return;
    const l = layers.find(x => x.id === selectedId);
    if (!l || l.type !== 'text') return;
    l.letterSpacing = parseFloat(val) || 0;
    if (typeof drawAll === 'function') drawAll();
  };

  // Text style toggles
  window.dsToggleTxtStyle = function(style) {
    if (typeof layers === 'undefined' || !selectedId) return;
    const l = layers.find(x => x.id === selectedId);
    if (!l || l.type !== 'text') return;
    if (typeof saveHist === 'function') saveHist();
    l[style] = !l[style];
    if (typeof drawAll === 'function') drawAll();
    const ids = { bold: 'tbBold', italic: 'tbItalic', underline: 'tbUnderline' };
    const btn = document.getElementById(ids[style]);
    if (btn) btn.classList.toggle('active-btn', l[style]);
  };

  // setBg bridge
  window.dsSetBg = function(c) {
    if (typeof setBg === 'function') setBg(c);
    else { if (typeof bgColorVal !== 'undefined') window.bgColorVal = c; if (typeof drawAll === 'function') drawAll(); }
  };

  // Download / save bridges
  window.dsDownload  = function() { if (typeof downloadDesign === 'function') downloadDesign(); };
  window.dsSaveCart  = function() { if (typeof saveToCart === 'function') saveToCart(); };
  window.dsUndo      = function() { if (typeof undoAction === 'function') undoAction(); };
  window.dsRedo      = function() { if (typeof redoAction === 'function') redoAction(); };
  window.dsClearCanvas = function() { if (typeof clearCanvas === 'function') { if (typeof saveHist === 'function') saveHist(); clearCanvas(); } };
  window.dsBringForward  = function() { if (typeof bringForward === 'function') bringForward(); };
  window.dsSendBackward  = function() { if (typeof sendBackward === 'function') sendBackward(); };
  window.dsFlipH = function() { if (typeof flipH === 'function') flipH(); };
  window.dsFlipV = function() { if (typeof flipV === 'function') flipV(); };
  window.dsUploadImage = function(e) { if (typeof uploadImage === 'function') uploadImage(e); };

  // Sync layer count to secondary badge
  function syncLayerBadge() {
    try {
      const cnt = (typeof layers !== 'undefined') ? layers.length : 0;
      ['dsLayerCount', 'dsLayerCount2', 'dsLayerCountStatus'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = cnt;
      });
    } catch(e) {}
  }
  // Patch notifyChange
  const _origNC = window.notifyChange;
  window.notifyChange = function() {
    if (_origNC) _origNC.apply(this, arguments);
    syncLayerBadge();
  };

  // ── Keyboard shortcuts ──
  document.addEventListener('keydown', e => {
    const dm = document.getElementById('designerModal');
    if (!dm || !dm.classList.contains('open')) return;
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    if (e.key === 'v' || e.key === 'V') setTool('select');
    if (e.key === 't' || e.key === 'T') setTool('text');
    if (e.key === 'r' || e.key === 'R') setTool('rect');
    if (e.key === 'c' || e.key === 'C') setTool('circle');
    if (e.key === 's' || e.key === 'S') setTool('star');
    if (e.key === 'l' || e.key === 'L') setTool('line');
    if (e.key === 'Delete' || e.key === 'Backspace') { if (typeof deleteSelected === 'function') deleteSelected(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); if (typeof undoAction === 'function') undoAction(); }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); if (typeof redoAction === 'function') redoAction(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') { e.preventDefault(); if (typeof duplicateSelected === 'function') duplicateSelected(); }
    if (e.key === '+' || e.key === '=') dsZoom(0.15);
    if (e.key === '-') dsZoom(-0.15);
    if (e.key === '0') { _zoom = 1; const w = document.getElementById('dsCanvasWrap'); if (w) w.style.transform = 'scale(1)'; document.getElementById('dsZoomVal').textContent = '100%'; }
    if (e.key === 'g' || e.key === 'G') { if (typeof toggleGrid === 'function') toggleGrid(); }
    if (e.key === 'Escape') { if (typeof closeDesigner === 'function') closeDesigner(); }

    // Arrow keys to nudge selected layer
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
      if (typeof layers !== 'undefined' && typeof selectedId !== 'undefined' && selectedId) {
        const l = layers.find(x => x.id === selectedId);
        if (l) {
          const d = e.shiftKey ? 10 : 1;
          if (e.key === 'ArrowLeft')  l.x -= d;
          if (e.key === 'ArrowRight') l.x += d;
          if (e.key === 'ArrowUp')    l.y -= d;
          if (e.key === 'ArrowDown')  l.y += d;
          if (typeof drawAll === 'function') drawAll();
          e.preventDefault();
        }
      }
    }
  });

  // ── DESIGNER i18n ──
  const DS_I18N = {
    ar: {
      settings: "إعدادات", back: "رجوع", cart: "سلة", order: "اطلب",
      export: "تصدير", preview3d: "معاينة 3D", clear: "مسح الكل",
      undo: "تراجع", redo: "إعادة",
      panelText: "نص", panelShapes: "أشكال", panelImage: "صورة",
      panelTemplates: "القوالب", panelLayers: "الطبقات", panelBg: "الخلفية",
      addText: "＋ إضافة نص", uploadImg: "اضغط لرفع صورة",
      priceLbl: "السعر", priceNote: "تقديري",
      oobWarning: "⚠️ عناصر خارج منطقة الطباعة",
      layers: "طبقات", tool: "أداة", shortcuts: "⌨ اختصارات",
      settingsTitle: "إعدادات الديزاينر",
      langLabel: "اللغة", themeLabel: "المظهر", currLabel: "العملة",
      close: "إغلاق",
      langAr: "العربية", langEn: "English", langFr: "Français",
      themeBlue: "أزرق داكن", themeLight: "فاتح", themePurple: "بنفسجي",
    },
    en: {
      settings: "Settings", back: "Back", cart: "Cart", order: "Order",
      export: "Export", preview3d: "3D Preview", clear: "Clear All",
      undo: "Undo", redo: "Redo",
      panelText: "Text", panelShapes: "Shapes", panelImage: "Image",
      panelTemplates: "Templates", panelLayers: "Layers", panelBg: "Background",
      addText: "+ Add Text", uploadImg: "Click to upload image",
      priceLbl: "Price", priceNote: "estimated",
      oobWarning: "⚠️ Elements outside print area",
      layers: "Layers", tool: "Tool", shortcuts: "⌨ Shortcuts",
      settingsTitle: "Designer Settings",
      langLabel: "Language", themeLabel: "Theme", currLabel: "Currency",
      close: "Close",
      langAr: "العربية", langEn: "English", langFr: "Français",
      themeBlue: "Blue Dark", themeLight: "Light", themePurple: "Purple",
    },
    fr: {
      settings: "Paramètres", back: "Retour", cart: "Panier", order: "Commander",
      export: "Exporter", preview3d: "Aperçu 3D", clear: "Tout effacer",
      undo: "Annuler", redo: "Rétablir",
      panelText: "Texte", panelShapes: "Formes", panelImage: "Image",
      panelTemplates: "Modèles", panelLayers: "Calques", panelBg: "Arrière-plan",
      addText: "+ Ajouter texte", uploadImg: "Cliquer pour uploader",
      priceLbl: "Prix", priceNote: "estimé",
      oobWarning: "⚠️ Éléments hors zone d'impression",
      layers: "Calques", tool: "Outil", shortcuts: "⌨ Raccourcis",
      settingsTitle: "Paramètres du designer",
      langLabel: "Langue", themeLabel: "Thème", currLabel: "Devise",
      close: "Fermer",
      langAr: "العربية", langEn: "English", langFr: "Français",
      themeBlue: "Bleu foncé", themeLight: "Clair", themePurple: "Violet",
    },
  };

  function _dsT(key) {
    const lang = window.currentLang || localStorage.getItem("a3m_lang") || "ar";
    return (DS_I18N[lang] || DS_I18N.ar)[key] || key;
  }

  window.applyDesignerI18n = function() {
    // update all [data-i18n-ds] elements inside the designer modal
    document.querySelectorAll("[data-i18n-ds]").forEach(el => {
      const key = el.getAttribute("data-i18n-ds");
      el.textContent = _dsT(key);
    });
    // price box
    const priceLbl = document.querySelector("#ds-price-box span:first-child");
    const priceNote = document.querySelector("#ds-price-box span:last-child");
    if (priceLbl) priceLbl.textContent = _dsT("priceLbl");
    if (priceNote) priceNote.textContent = _dsT("priceNote");
    // OOB warning
    const oob = document.getElementById("dsOobWarning");
    if (oob) oob.innerHTML = "⚠️ " + _dsT("oobWarning").replace("⚠️ ","");
    // status bar items
    const lc = document.getElementById("dsLayerCount");
    if (lc) { const si = lc.closest(".ds-status-item"); if (si && si.childNodes[0]) si.childNodes[0].textContent = _dsT("layers") + ": "; }
    // panel titles
    const panelTitles = document.querySelectorAll(".d-panel-title");
    panelTitles.forEach(pt => {
      const txt = pt.textContent.trim();
      if (/نص|Text|Texte/.test(txt) && !pt.textContent.includes("✅") && !pt.textContent.includes("حدود") && !pt.textContent.includes("ظل")) pt.textContent = _dsT("panelText");
      if (/أشكال|Shapes|Formes/.test(txt)) pt.textContent = _dsT("panelShapes");
      if (/صورة|Image/.test(txt)) pt.textContent = _dsT("panelImage");
      if (/القوالب|Templates|Modèles/.test(txt)) pt.textContent = _dsT("panelTemplates");
      if (/الخلفية|Background|Arrière/.test(txt)) pt.textContent = _dsT("panelBg");
    });
    // add text button
    const addTextBtn = document.querySelector("[onclick='addText()']");
    if (addTextBtn) addTextBtn.textContent = _dsT("addText");
    // upload zone
    const uploadP = document.querySelector(".upload-zone p:first-of-type");
    if (uploadP) uploadP.textContent = _dsT("uploadImg");
    // topbar buttons via title
    const backBtns = document.querySelectorAll("[onclick='closeDesigner()']");
    backBtns.forEach(b => {
      const sp = b.querySelector("span[data-i18n-ds]");
      if (!sp) { /* find text node */ b.childNodes.forEach(n => { if(n.nodeType===3&&n.textContent.trim()) n.textContent=" "+_dsT("back"); }); }
    });
    // Export button
    document.querySelectorAll(".d-btn-gold").forEach(b => {
      if (b.textContent.includes("تصدير")||b.textContent.includes("Export")||b.textContent.includes("Exporter"))
        b.textContent = "⬇ " + _dsT("export") + " ▾";
    });
    // Cart button
    document.querySelectorAll("[onclick='saveToCart()']").forEach(b => b.textContent = "🛒 " + _dsT("cart"));
    // Order button
    document.querySelectorAll("[onclick='openOrderFromDesign()']").forEach(b => b.textContent = "📋 " + _dsT("order"));
    // 3D button
    document.querySelectorAll("[onclick='open3DViewer()']").forEach(b => {
      b.innerHTML = b.innerHTML.replace(/3D.*/, "") + "3D";
    });
    // Settings btn text
    const ssBtn = document.getElementById("dsSettingsBtn");
    if (ssBtn) { const sp = ssBtn.querySelector("[data-i18n-ds='settings']"); if(sp) sp.textContent = _dsT("settings"); }
    // Layers section title
    const layersTitleSpan = document.querySelector("#dsLayerCount2")?.parentElement;
    if (layersTitleSpan) {
      const parent = layersTitleSpan.closest(".d-panel-title");
      if (parent) {
        const cnt = document.getElementById("dsLayerCount2")?.textContent || "0";
        parent.querySelector("span:first-child").textContent = _dsT("panelLayers") + " (" + cnt + ")";
      }
    }
  };

  // ── SETTINGS MODAL ──
  window.openDesignerSettings = function() {
    let modal = document.getElementById("dsSettingsModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "dsSettingsModal";
      modal.style.cssText = `position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.7);backdrop-filter:blur(6px)`;
      modal.innerHTML = `
        <div style="background:#111827;border:1px solid #252540;border-radius:16px;padding:28px 32px;min-width:320px;max-width:420px;width:90%;font-family:'Cairo',sans-serif;box-shadow:0 24px 60px rgba(0,0,0,.7)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:22px">
            <h2 id="dsSettingsTitle" style="font-size:18px;color:#e5e7eb;margin:0">إعدادات الديزاينر</h2>
            <button onclick="document.getElementById('dsSettingsModal').remove()" style="background:none;border:none;color:#6b7280;font-size:20px;cursor:pointer;line-height:1">✕</button>
          </div>

          <!-- Language -->
          <div style="margin-bottom:18px">
            <label id="dsLangLbl" style="display:block;font-size:12px;color:#9ca3af;margin-bottom:8px;letter-spacing:.5px">اللغة</label>
            <div style="display:flex;gap:8px">
              <button class="ds-setting-pill" onclick="window.A3MSettings?.setLang('ar');applyDesignerI18n();_updateSettingsPills()" data-lang="ar">العربية</button>
              <button class="ds-setting-pill" onclick="window.A3MSettings?.setLang('en');applyDesignerI18n();_updateSettingsPills()" data-lang="en">English</button>
              <button class="ds-setting-pill" onclick="window.A3MSettings?.setLang('fr');applyDesignerI18n();_updateSettingsPills()" data-lang="fr">Français</button>
            </div>
          </div>

          <!-- Theme -->
          <div style="margin-bottom:18px">
            <label id="dsThemeLbl" style="display:block;font-size:12px;color:#9ca3af;margin-bottom:8px;letter-spacing:.5px">المظهر</label>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button class="ds-setting-pill" onclick="window.A3MSettings?.setTheme('blue-dark');_updateSettingsPills()" data-theme="blue-dark" style="border-color:#2563eb">🌙 أزرق داكن</button>
              <button class="ds-setting-pill" onclick="window.A3MSettings?.setTheme('light');_updateSettingsPills()" data-theme="light" style="border-color:#d1d5db;color:#374151;background:#f9fafb">☀️ فاتح</button>
              <button class="ds-setting-pill" onclick="window.A3MSettings?.setTheme('purple-dark');_updateSettingsPills()" data-theme="purple-dark" style="border-color:#7c3aed">💜 بنفسجي</button>
            </div>
          </div>

          <!-- Currency -->
          <div style="margin-bottom:24px">
            <label id="dsCurrLbl" style="display:block;font-size:12px;color:#9ca3af;margin-bottom:8px;letter-spacing:.5px">العملة</label>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button class="ds-setting-pill" onclick="window.A3MSettings?.setCurrency('DZD');_updateSettingsPills()" data-curr="DZD">🇩🇿 دج</button>
              <button class="ds-setting-pill" onclick="window.A3MSettings?.setCurrency('USD');_updateSettingsPills()" data-curr="USD">🇺🇸 USD</button>
              <button class="ds-setting-pill" onclick="window.A3MSettings?.setCurrency('EUR');_updateSettingsPills()" data-curr="EUR">🇪🇺 EUR</button>
            </div>
          </div>

          <button onclick="document.getElementById('dsSettingsModal').remove()" style="width:100%;padding:11px;background:linear-gradient(135deg,#7c3aed,#2563eb);color:#fff;border:none;border-radius:8px;font-size:14px;font-family:'Cairo',sans-serif;cursor:pointer;font-weight:600" id="dsCloseSettingsBtn">إغلاق</button>
        </div>`;
      document.body.appendChild(modal);
      modal.addEventListener("click", e => { if(e.target===modal) modal.remove(); });
    }
    _updateSettingsPills();
    modal.style.display = "flex";
  };

  window._updateSettingsPills = function() {
    const s = window.A3MSettings?.get() || {};
    const lang = s.lang || localStorage.getItem("a3m_lang") || "ar";
    const theme = s.theme || localStorage.getItem("a3m_theme") || "blue-dark";
    const curr = s.currency || "DZD";
    document.querySelectorAll(".ds-setting-pill[data-lang]").forEach(b => b.classList.toggle("active", b.dataset.lang === lang));
    document.querySelectorAll(".ds-setting-pill[data-theme]").forEach(b => b.classList.toggle("active", b.dataset.theme === theme));
    document.querySelectorAll(".ds-setting-pill[data-curr]").forEach(b => b.classList.toggle("active", b.dataset.curr === curr));
    // update labels via i18n
    const t = key => ((DS_I18N[lang]||DS_I18N.ar)[key]||key);
    const lt = document.getElementById("dsLangLbl");   if(lt) lt.textContent = t("langLabel");
    const tt = document.getElementById("dsThemeLbl");  if(tt) tt.textContent = t("themeLabel");
    const ct = document.getElementById("dsCurrLbl");   if(ct) ct.textContent = t("currLabel");
    const st = document.getElementById("dsSettingsTitle"); if(st) st.textContent = t("settingsTitle");
    const cb = document.getElementById("dsCloseSettingsBtn"); if(cb) cb.textContent = t("close");
  };

  // Auto-apply i18n when designer opens
  document.addEventListener("DOMContentLoaded", function() {
    const dm = document.getElementById("designerModal");
    if (!dm) return;
    const obs = new MutationObserver(muts => {
      muts.forEach(m => {
        if (m.target.id === "designerModal" && m.target.classList.contains("open")) {
          setTimeout(applyDesignerI18n, 200);
        }
      });
    });
    obs.observe(dm, { attributes: true, attributeFilter: ["class"] });
  });

  // Also apply on a3m:lang event
  document.addEventListener("a3m:lang", () => {
    const dm = document.getElementById("designerModal");
    if (dm && dm.classList.contains("open")) applyDesignerI18n();
  });

  // ── ACCORDION (right panel sections) ──
  window.toggleAcc = function(header) {
    const body = header.nextElementSibling;
    const arrow = header.querySelector('.ds-acc-arrow');
    const isOpen = body.style.display !== 'none';
    body.style.display = isOpen ? 'none' : 'block';
    if (arrow) arrow.style.transform = isOpen ? 'rotate(-90deg)' : 'rotate(0deg)';
    header.style.marginBottom = isOpen ? '0' : '';
  };

  // ── LEFT PANEL toggle ──
  window.toggleLeftPanel = function() {
    const panel = document.getElementById('dsLeftPanel');
    const btn   = document.getElementById('dsLeftToggleBtn');
    if (!panel) return;
    const hidden = panel.style.display === 'none';
    panel.style.display = hidden ? 'flex' : 'none';
    if (btn) btn.textContent = hidden ? '‹' : '›';
    if (btn) btn.style.left  = hidden ? '0' : '0';
  };

  // ── RIGHT PANEL toggle ──
  window.toggleRightPanel = function() {
    const panel = document.getElementById('dsRightPanel');
    const btn   = document.getElementById('dsRightToggleBtn');
    if (!panel) return;
    const hidden = panel.style.display === 'none';
    panel.style.display = hidden ? 'flex' : 'none';
    if (btn) btn.textContent = hidden ? '›' : '‹';
  };

  // ── SHAPES GROUP toggle (left sidebar) ──
  window.toggleShapesGroup = function() {
    const list  = document.getElementById('dsShapesList');
    const arrow = document.getElementById('dsShapesArrow');
    if (!list) return;
    const open = list.style.display === 'none';
    list.style.display = open ? 'flex' : 'none';
    if (arrow) arrow.style.transform = open ? 'rotate(180deg)' : 'rotate(0deg)';
  };

  // ── RIGHT PANEL RESIZE (drag left edge) ──
  (function() {
    const handle = document.getElementById('dsResizeHandle');
    const panel  = document.getElementById('dsRightPanel');
    if (!handle || !panel) return;
    let startX, startW;
    handle.addEventListener('mousedown', function(e) {
      startX = e.clientX;
      startW = panel.offsetWidth;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      function onMove(e) {
        const dx = startX - e.clientX; // dragging left = wider
        const newW = Math.min(420, Math.max(160, startW + dx));
        panel.style.width = newW + 'px';
      }
      function onUp() {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      e.preventDefault();
    });
  })();

})();