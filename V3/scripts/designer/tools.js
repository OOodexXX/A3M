// ============================================================
// designer/tools.js  –  A3M Print  –  Layer Tools
// إنشاء طبقات، عمليات، لوحة التحويل، رفع صور، تصدير
// يجب تحميله بعد canvas.js
// ============================================================

(function () {
  "use strict";

  // Shortcut to shared canvas state
  const C = () => window._A3MCanvas;

  // ════════════════════════════════════════════════════════════
  // LAYER FACTORIES
  // ════════════════════════════════════════════════════════════

  function addTextLayer(text, fs, font, fill, align, x, y, opts = {}) {
    const { ctx, snap, nid, saveHist, drawAll } = C();
    if (!ctx) return null;
    ctx.save();
    const weight = opts.bold ? "bold " : opts.italic ? "italic " : "";
    ctx.font = `${weight}${fs}px '${font}'`;
    const w = Math.max((ctx.measureText(text).width || fs * String(text).length * 0.6) + 24, 60);
    ctx.restore();
    const layer = {
      id: nid(), type: "text",
      x: snap(x), y: snap(y), w, h: fs * 1.5,
      text: String(text || "Text"), font, fontSize: fs,
      fillColor: fill || "#ffffff", shadowColor: opts.shadowColor || "", shadowBlur: opts.shadowBlur || 0,
      textAlign: align || "center", opacity: 100, rotation: 0, visible: true, locked: false,
      flippedH: false, flippedV: false, bold: opts.bold || false, italic: opts.italic || false,
      underline: opts.underline || false, letterSpacing: opts.letterSpacing || 0,
    };
    C().layers.push(layer);
    C().selectedId = layer.id;
    drawAll();
    return layer;
  }

  function addRect(x, y, w, h, fill, stroke, strokeW, opacity, opts = {}) {
    const { snap, nid, drawAll } = C();
    const layer = { id: nid(), type: "rect", x: snap(x), y: snap(y), w: w||150, h: h||80, fillColor: fill||"#7c3aed", strokeColor: stroke||"#c9a84c", strokeWidth: strokeW||2, cornerRadius: opts.cornerRadius||0, gradient: opts.gradient||null, opacity: opacity||100, rotation: 0, visible: true, locked: false, flippedH: false, flippedV: false };
    C().layers.push(layer); C().selectedId = layer.id; drawAll(); return layer;
  }

  function addCircle(x, y, r, fill, stroke, opacity) {
    const { snap, nid, drawAll } = C();
    const layer = { id: nid(), type: "circle", x: snap(x), y: snap(y), w: (r||60)*2, h: (r||60)*2, fillColor: fill||"#7c3aed", strokeColor: stroke||"", strokeWidth: 2, opacity: opacity||100, rotation: 0, visible: true, locked: false, flippedH: false, flippedV: false };
    C().layers.push(layer); C().selectedId = layer.id; drawAll(); return layer;
  }

  function addTriangle(x, y, w, h, fill, stroke, opacity) {
    const { snap, nid, drawAll } = C();
    const layer = { id: nid(), type: "triangle", x: snap(x), y: snap(y), w: w||120, h: h||100, fillColor: fill||"#7c3aed", strokeColor: stroke||"", strokeWidth: 2, opacity: opacity||100, rotation: 0, visible: true, locked: false, flippedH: false, flippedV: false };
    C().layers.push(layer); C().selectedId = layer.id; drawAll(); return layer;
  }

  function addStar(x, y, r, fill, stroke, opacity) {
    const { snap, nid, drawAll } = C();
    const layer = { id: nid(), type: "star", x: snap(x), y: snap(y), w: (r||60)*2, h: (r||60)*2, fillColor: fill||"#c9a84c", strokeColor: stroke||"", strokeWidth: 2, opacity: opacity||100, rotation: 0, visible: true, locked: false, flippedH: false, flippedV: false };
    C().layers.push(layer); C().selectedId = layer.id; drawAll(); return layer;
  }

  function addLine(x1, y1, x2, y2, color, width, opacity) {
    const { snap, nid, drawAll } = C();
    const cx = (x1+x2)/2, cy = (y1+y2)/2, w = Math.max(Math.abs(x2-x1),10), h = Math.max(Math.abs(y2-y1),10);
    const layer = { id: nid(), type: "line", x: snap(cx), y: snap(cy), w, h, fillColor: color||"#ffffff", strokeColor: color||"#ffffff", strokeWidth: width||3, opacity: opacity||100, rotation: 0, visible: true, locked: false, flippedH: false, flippedV: false };
    C().layers.push(layer); C().selectedId = layer.id; drawAll(); return layer;
  }

  // ════════════════════════════════════════════════════════════
  // ADD FROM UI CONTROLS
  // ════════════════════════════════════════════════════════════

  function addText() {
    if (!C().canvas) return;
    C().saveHist();
    const text  = document.getElementById("txtContent")?.value || "Text";
    const fs    = parseInt(document.getElementById("txtSize")?.value) || 40;
    const font  = document.getElementById("txtFont")?.value    || "Cairo";
    const fill  = document.getElementById("txtColor")?.value   || "#000000";
    const bold  = document.getElementById("tbBold")?.classList?.contains("active-btn");
    const italic = document.getElementById("tbItalic")?.classList?.contains("active-btn");
    addTextLayer(text, fs, font, fill, "center", 250, 250, { bold, italic });
  }

  function addShape(type) {
    if (!C().canvas) return;
    C().saveHist();
    const fill   = document.getElementById("shapeFill")?.value    || "#7c3aed";
    const stroke = document.getElementById("shapeStroke")?.value  || "#c9a84c";
    const op     = parseInt(document.getElementById("shapeOpacity")?.value) || 100;
    const sw     = parseInt(document.getElementById("strokeW")?.value) || 2;
    const cr     = parseInt(document.getElementById("cornerRadius")?.value) || 0;
    if      (type === "rect")     addRect(250,250,150,80,fill,stroke,sw,op,{cornerRadius:cr});
    else if (type === "circle")   addCircle(250,250,60,fill,stroke,op);
    else if (type === "triangle") addTriangle(250,250,120,100,fill,stroke,op);
    else if (type === "star")     addStar(250,250,65,fill,stroke,op);
    else if (type === "line")     addLine(150,250,350,250,fill,sw,op);
  }

  // ════════════════════════════════════════════════════════════
  // SYNC SELECTED
  // ════════════════════════════════════════════════════════════

  function syncSelected() {
    const { layers, selectedId, ctx, drawAll } = C();
    const l = layers.find(x => x.id === selectedId);
    if (!l) return;
    if (l.type === "text") {
      l.text     = document.getElementById("txtContent")?.value || l.text;
      l.fontSize = parseInt(document.getElementById("txtSize")?.value) || l.fontSize;
      l.font     = document.getElementById("txtFont")?.value    || l.font;
      l.fillColor = document.getElementById("txtColor")?.value  || l.fillColor;
      if (ctx) { ctx.save(); ctx.font = `${l.bold?"bold ":l.italic?"italic ":""}${l.fontSize}px '${l.font}'`; l.w = Math.max(ctx.measureText(l.text).width + 24, 60); ctx.restore(); }
      l.h = l.fontSize * 1.5;
    } else {
      l.fillColor   = document.getElementById("shapeFill")?.value   || l.fillColor;
      l.strokeColor = document.getElementById("shapeStroke")?.value || l.strokeColor;
      l.strokeWidth = parseInt(document.getElementById("strokeW")?.value) || l.strokeWidth;
      l.opacity     = parseInt(document.getElementById("shapeOpacity")?.value) || l.opacity;
      if (l.type === "rect") l.cornerRadius = parseInt(document.getElementById("cornerRadius")?.value) || 0;
      const opVal = document.getElementById("opVal");
      if (opVal) opVal.textContent = l.opacity;
    }
    drawAll();
  }

  function setTxtAlign(a) {
    const { layers, selectedId, drawAll } = C();
    const l = layers.find(x => x.id === selectedId);
    if (l && l.type === "text") { l.textAlign = a; drawAll(); }
  }

  // ════════════════════════════════════════════════════════════
  // LAYER OPERATIONS
  // ════════════════════════════════════════════════════════════

  function setTool(t) {
    C().activeTool = t;
    document.querySelectorAll('.d-tool-btn[id^="tool-"]').forEach(b => b.classList.remove("active"));
    document.getElementById("tool-" + t)?.classList.add("active");
    if (C().canvas) C().canvas.style.cursor = t === "select" ? "default" : "crosshair";
    const ti = document.getElementById("dsActiveTool");
    if (ti) ti.textContent = t;
  }

  function deleteSelected() {
    const { layers, selectedId, saveHist, drawAll } = C();
    if (!selectedId) return;
    const l = layers.find(x => x.id === selectedId);
    if (l?.locked) { showToast("🔒 لا يمكن حذف طبقة مقفولة", "error"); return; }
    saveHist();
    C().layers = layers.filter(l => l.id !== selectedId);
    C().selectedId = null;
    drawAll();
    showToast("🗑 تم الحذف");
  }

  function duplicateSelected() {
    const { layers, selectedId, saveHist, nid, drawAll } = C();
    const l = layers.find(x => x.id === selectedId);
    if (!l) return;
    saveHist();
    const copy = JSON.parse(JSON.stringify(l));
    copy.id = nid(); copy.x += 20; copy.y += 20;
    if (l.img) copy.img = l.img;
    C().layers.push(copy); C().selectedId = copy.id;
    drawAll(); showToast("⊕ تم النسخ");
  }

  function bringForward() {
    const { layers, selectedId, saveHist, drawAll } = C();
    const i = layers.findIndex(x => x.id === selectedId);
    if (i >= 0 && i < layers.length - 1) { saveHist(); [layers[i], layers[i+1]] = [layers[i+1], layers[i]]; drawAll(); }
  }

  function sendBackward() {
    const { layers, selectedId, saveHist, drawAll } = C();
    const i = layers.findIndex(x => x.id === selectedId);
    if (i > 0) { saveHist(); [layers[i], layers[i-1]] = [layers[i-1], layers[i]]; drawAll(); }
  }

  function bringToFront() {
    const { layers, selectedId, saveHist, drawAll } = C();
    const i = layers.findIndex(x => x.id === selectedId);
    if (i >= 0 && i < layers.length - 1) { saveHist(); const [el] = layers.splice(i, 1); layers.push(el); drawAll(); }
  }

  function sendToBack() {
    const { layers, selectedId, saveHist, drawAll } = C();
    const i = layers.findIndex(x => x.id === selectedId);
    if (i > 0) { saveHist(); const [el] = layers.splice(i, 1); layers.unshift(el); drawAll(); }
  }

  function flipH() { const { layers, selectedId, saveHist, drawAll } = C(); const l = layers.find(x => x.id === selectedId); if (l) { saveHist(); l.flippedH = !l.flippedH; drawAll(); } }
  function flipV() { const { layers, selectedId, saveHist, drawAll } = C(); const l = layers.find(x => x.id === selectedId); if (l) { saveHist(); l.flippedV = !l.flippedV; drawAll(); } }

  function lockSelected() {
    const { layers, selectedId, drawAll } = C();
    const l = layers.find(x => x.id === selectedId);
    if (l) { l.locked = !l.locked; drawAll(); showToast(l.locked ? "🔒 مقفولة" : "🔓 مفتوحة"); }
  }

  function clearCanvas() {
    C().saveHist();
    C().layers = []; C().selectedId = null; C().bgColorVal = "#ffffff";
    const bgEl = document.getElementById("bgColor");
    if (bgEl) bgEl.value = "#ffffff";
    C().drawAll();
  }

  function alignLayers(dir) {
    const { layers, selectedId, canvas, saveHist, drawAll } = C();
    if (!selectedId) return;
    const l = layers.find(x => x.id === selectedId);
    if (!l) return;
    saveHist();
    const W = canvas ? canvas.width : 500, H = canvas ? canvas.height : 500;
    if (dir === "left")    l.x = l.w / 2;
    if (dir === "right")   l.x = W - l.w / 2;
    if (dir === "top")     l.y = l.h / 2;
    if (dir === "bottom")  l.y = H - l.h / 2;
    if (dir === "hcenter") l.x = W / 2;
    if (dir === "vcenter") l.y = H / 2;
    drawAll();
  }

  // ════════════════════════════════════════════════════════════
  // TRANSFORM PANEL
  // ════════════════════════════════════════════════════════════

  function applyTransform() {
    const { layers, selectedId, saveHist, drawAll, CANVAS_PX_TO_CM } = C();
    const l = layers.find(x => x.id === selectedId);
    if (!l) return;
    saveHist();
    l.w = Math.max(10, parseFloat(document.getElementById("objW")?.value) || l.w);
    l.h = Math.max(5,  parseFloat(document.getElementById("objH")?.value) || l.h);
    l.x = parseFloat(document.getElementById("objX")?.value) || l.x;
    l.y = parseFloat(document.getElementById("objY")?.value) || l.y;
    l.rotation = parseFloat(document.getElementById("objRot")?.value) || 0;
    if (l.type === "circle") l.h = l.w;
    drawAll();
  }

  function updateTransformPanel() {
    const { layers, selectedId, CANVAS_PX_TO_CM } = C();
    const l = layers.find(x => x.id === selectedId);
    const set  = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
    const setT = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    if (!l) { ["ds-size-cm","ds-size-mm","ds-size-px"].forEach(id => setT(id, "—")); return; }
    set("objW", Math.round(l.w)); set("objH", Math.round(l.h));
    set("objX", Math.round(l.x)); set("objY", Math.round(l.y));
    set("objRot", Math.round(l.rotation || 0)); setT("rotVal", (l.rotation||0) + "°");
    const PX_CM = C().CANVAS_PX_TO_CM;
    setT("ds-size-cm", `${(l.w*PX_CM).toFixed(2)} × ${(l.h*PX_CM).toFixed(2)} سم`);
    setT("ds-size-mm", `${Math.round(l.w*PX_CM*10)} × ${Math.round(l.h*PX_CM*10)} مم`);
    setT("ds-size-px", `${Math.round(l.w)} × ${Math.round(l.h)} px`);
    if (l.type === "text") {
      set("txtContent", l.text); set("txtSize", l.fontSize); setT("txtSzVal", l.fontSize);
      set("txtColor", l.fillColor); if (l.font) set("txtFont", l.font);
      ["Bold","Italic","Underline"].forEach(s => document.getElementById("tb"+s)?.classList.toggle("active-btn", !!l[s.toLowerCase()]));
    } else {
      set("shapeFill", l.fillColor || "#7c3aed"); set("shapeStroke", l.strokeColor || "#c9a84c");
      set("shapeOpacity", l.opacity || 100); setT("opVal", l.opacity || 100);
      if (l.type === "rect") set("cornerRadius", l.cornerRadius || 0);
    }
    const lockBtn = document.getElementById("dsLockBtn");
    if (lockBtn) lockBtn.textContent = l.locked ? "🔓 فتح" : "🔒 قفل";
  }

  // ════════════════════════════════════════════════════════════
  // LAYERS PANEL
  // ════════════════════════════════════════════════════════════

  function renderLayers() {
    const { layers, selectedId } = C();
    const ll = document.getElementById("layersList");
    if (!ll) return;
    const icons = { text: "T", image: "🖼", circle: "●", triangle: "▲", star: "★", line: "—", rect: "■" };
    ll.innerHTML = [...layers].reverse().map(l => `
      <div class="layer-item${l.id===selectedId?" selected":""}${l.locked?" layer-locked":""}"
           onclick="selectLayer('${l.id}')" draggable="true" data-lid="${l.id}">
        <span class="layer-icon" style="color:${l.id===selectedId?"#7c3aed":"#6b7280"}">${icons[l.type]||"▭"}</span>
        <span class="layer-name">${l.type==="text"?l.text.slice(0,14):l.type}</span>
        <div class="layer-actions">
          <button class="layer-act-btn" onclick="event.stopPropagation();toggleVis('${l.id}')">${l.visible?"👁":"○"}</button>
          <button class="layer-act-btn${l.locked?" layer-lock-active":""}" onclick="event.stopPropagation();_A3MCanvas.selectedId='${l.id}';lockSelected()">${l.locked?"🔒":"🔓"}</button>
          <button class="layer-act-btn layer-del" onclick="event.stopPropagation();_A3MCanvas.selectedId='${l.id}';deleteSelected()">✕</button>
        </div>
      </div>`).join("");
  }

  function selectLayer(id) { C().selectedId = id; C().drawAll(); }
  function toggleVis(id) { const l = C().layers.find(x => x.id === id); if (l) { C().saveHist(); l.visible = !l.visible; C().drawAll(); } }

  // ════════════════════════════════════════════════════════════
  // IMAGE UPLOAD
  // ════════════════════════════════════════════════════════════

  function uploadImage(ev) {
    const file = ev.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        C().saveHist();
        const sc = Math.min(280/img.width, 280/img.height, 1);
        const w = img.width*sc, h = img.height*sc;
        const l = { id: C().nid(), type: "image", x:250, y:250, w, h, img, fillColor:"", strokeColor:"", strokeWidth:0, opacity:100, rotation:0, visible:true, locked:false, flippedH:false, flippedV:false };
        C().layers.push(l); C().selectedId = l.id; C().drawAll();
        showToast("🖼 تمت إضافة الصورة", "success");
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    ev.target.value = "";
  }

  // ════════════════════════════════════════════════════════════
  // EXPORT / CART / ORDER
  // ════════════════════════════════════════════════════════════

  function downloadDesign() {
    const { canvas, drawAll } = C();
    if (!canvas) return;
    const prevSel = C().selectedId;
    C().selectedId = null; drawAll();
    const link = document.createElement("a");
    link.download = "A3M_Design_" + Date.now() + ".png";
    link.href = canvas.toDataURL("image/png");
    link.click();
    C().selectedId = prevSel; drawAll();
    showToast("✅ تم تصدير التصميم", "success");
  }

  function saveToCart() {
    const name = "Custom Design (" + C().canvasProdType + ")";
    const item = { id: "custom-design-" + Date.now(), name, emoji: "🎨", price: 1500, qty: 1 };
    if (typeof window.cart !== "undefined") window.cart.push(item);
    if (typeof updateCart === "function") updateCart();
    showToast("🛒 تمت الإضافة للسلة", "success");
  }

  function summarizeDesign() {
    const { layers, canvasProdType, bgColorVal } = C();
    const parts = [`منتج: ${canvasProdType}`, `الطبقات: ${layers.length}`];
    const texts = layers.filter(l => l.type === "text").map(l => l.text).slice(0, 4);
    if (texts.length) parts.push(`نصوص: ${texts.join(" / ")}`);
    parts.push(`خلفية: ${bgColorVal}`);
    return parts.join("\n");
  }

  function openOrderFromDesign() {
    const modal = document.getElementById("orderModal");
    if (!modal) { if (typeof window.openOrderForm === "function") window.openOrderForm(); return; }
    modal.style.display = "flex";
    const notes = document.getElementById("inp-notes");
    if (notes) notes.value = summarizeDesign();
  }

  // ════════════════════════════════════════════════════════════
  // EXPOSE TO WINDOW
  // ════════════════════════════════════════════════════════════

  Object.assign(window, {
    addTextLayer, addRect, addCircle, addTriangle, addStar, addLine,
    addText, addShape,
    syncSelected, setTxtAlign, setTool,
    deleteSelected, duplicateSelected,
    bringForward, sendBackward, bringToFront, sendToBack,
    flipH, flipV, lockSelected, clearCanvas, alignLayers,
    applyTransform, updateTransformPanel,
    renderLayers, selectLayer, toggleVis,
    uploadImage, downloadDesign, saveToCart, summarizeDesign, openOrderFromDesign,
  });

})();
