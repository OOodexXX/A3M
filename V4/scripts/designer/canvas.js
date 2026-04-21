// ============================================================
// designer/canvas.js  –  A3M Print  –  Canvas Engine v3
// ✅ HIGH-RES: 1200px internal canvas (was 500 → pixelated fixed)
// ✅ PRINT AREAS: printable zone per product + OOB detection
// ✅ FIXED TEXT: accurate measureText + calcTextBounds()
// ✅ v2 features: smart guides, multi-select, aspect-lock,
//    context menu, keyboard shortcuts, rulers
// ============================================================

(function () {
  "use strict";

  // ════════════════════════════════════════════════════════════
  // CONSTANTS
  // ════════════════════════════════════════════════════════════

  const CANVAS_SIZE     = 1200;         // ✅ High-res (was 500)
  const HANDLE_SIZE     = 18;
  const GRID_SIZE       = 60;
  const RULER_SIZE      = 22;
  const CANVAS_PX_TO_CM = 0.011024;     // recalculated for 1200px
  const BASE_PRICE      = 500;
  const PER_ELEMENT     = 200;
  const SNAP_THRESHOLD  = 20;
  const PROD_EMOJI      = { tshirt:"👕", mug:"☕", hat:"🧢", bag:"🎒", paper:"📄", hoodie:"🧥" };

  // ✅ Print areas per product (1200px canvas coordinates)
  const PRINT_AREAS = {
    tshirt: { x:260, y:160, w:680,  h:840,  label:"منطقة طباعة — تيشرت" },
    hoodie: { x:240, y:180, w:720,  h:880,  label:"منطقة طباعة — هودي" },
    mug:    { x:100, y:240, w:1000, h:560,  label:"منطقة طباعة — كوب" },
    hat:    { x:280, y:380, w:640,  h:360,  label:"منطقة طباعة — قبعة" },
    bag:    { x:200, y:160, w:800,  h:880,  label:"منطقة طباعة — حقيبة" },
    paper:  { x:40,  y:40,  w:1120, h:1120, label:"منطقة طباعة — ورقة" },
  };

  // ════════════════════════════════════════════════════════════
  // STATE
  // ════════════════════════════════════════════════════════════

  let layers         = [];
  let selectedId     = null;
  let multiSelected  = [];          // ✅ NEW: multi-select IDs
  let activeTool     = "select";
  let isDragging     = false;
  let isResizing     = false;
  let resizeHandle   = "";
  let dragOffX = 0, dragOffY = 0;
  let resizeStartX = 0, resizeStartY = 0;
  let resizeStartW = 0, resizeStartH = 0;
  let resizeStartObjX = 0, resizeStartObjY = 0;
  let aspectLocked   = false;       // ✅ NEW: aspect ratio lock state
  let history = [], redoStack = [];
  let bgColorVal     = "#ffffff";
  let canvasProdType = "tshirt";
  let canvas = null, ctx = null;
  let listenersBound = false;

  // Grid & Snap
  let showGrid   = false;
  let snapToGrid = false;

  // Smart Guides ✅ NEW
  let activeGuides = [];            // lines to draw this frame

  // Rulers
  let showRulers  = true;
  let guides      = [];
  let rulerUnit   = "px";
  let mouseRulerX = -1, mouseRulerY = -1;

  // ════════════════════════════════════════════════════════════
  // CANVAS SETUP
  // ════════════════════════════════════════════════════════════

  function initCanvasRefs() {
    const el = document.getElementById("designCanvas");
    if (!el) { console.warn("A3M: designCanvas not found"); return false; }
    // ✅ Set high-res size every time (overrides HTML attribute)
    el.width  = CANVAS_SIZE;
    el.height = CANVAS_SIZE;
    canvas = el;
    ctx    = el.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    canvas._a3mEvBound = false;
    _bindKeyboard();
    return true;
  }

  function resetDesignerState() {
    listenersBound = false;
    if (canvas) canvas._a3mEvBound = false;
  }

  function nid() {
    return "L" + ((Date.now() + Math.random() * 1000) | 0).toString(36);
  }

  function setBg(color) {
    bgColorVal = color;
    const bgEl = document.getElementById("bgColor");
    if (bgEl) bgEl.value = color;
  }

  function snap(v) {
    return snapToGrid ? Math.round(v / GRID_SIZE) * GRID_SIZE : v;
  }

  // ════════════════════════════════════════════════════════════
  // HISTORY
  // ════════════════════════════════════════════════════════════

  function cloneState() {
    const safe = layers.map(l => {
      const { img, ...rest } = l;
      return { ...rest, _hasImg: !!img, _imgSrc: img?.src || null };
    });
    return JSON.parse(JSON.stringify({ layers: safe, bgColorVal, selectedId, canvasProdType, activeTool }));
  }

  function saveHist() {
    history.push(cloneState());
    if (history.length > 60) history.shift();
    redoStack = [];
    updateUndoRedoUI();
  }

  function updateUndoRedoUI() {
    const u = document.getElementById("dsUndoBtn");
    const r = document.getElementById("dsRedoBtn");
    if (u) u.disabled = history.length === 0;
    if (r) r.disabled = redoStack.length === 0;
  }

  function restoreState(s) {
    const restored = (s.layers || []).map(l => {
      if (l._hasImg && l._imgSrc) {
        const img = new Image(); img.src = l._imgSrc;
        return { ...l, img };
      }
      return l;
    });
    layers         = restored;
    bgColorVal     = s.bgColorVal     || "#ffffff";
    selectedId     = s.selectedId     || null;
    canvasProdType = s.canvasProdType || "tshirt";
    activeTool     = s.activeTool     || "select";
    multiSelected  = [];
    if (typeof syncCanvasProductSelect === "function") syncCanvasProductSelect();
    drawAll();
  }

  function undoAction() {
    if (!history.length) return;
    redoStack.push(cloneState());
    restoreState(history.pop());
    if (typeof showToast === "function") showToast("↩ تراجع", "info");
    updateUndoRedoUI();
  }

  function redoAction() {
    if (!redoStack.length) return;
    history.push(cloneState());
    restoreState(redoStack.pop());
    if (typeof showToast === "function") showToast("↪ إعادة", "info");
    updateUndoRedoUI();
  }

  // ════════════════════════════════════════════════════════════
  // HIT TESTING
  // ════════════════════════════════════════════════════════════

  function getHandlePositions(l) {
    const hw = l.w / 2, hh = l.h / 2;
    return [
      { name:"nw", lx:-hw, ly:-hh }, { name:"n",  lx:0,   ly:-hh },
      { name:"ne", lx: hw, ly:-hh }, { name:"e",  lx: hw, ly:  0 },
      { name:"se", lx: hw, ly: hh }, { name:"s",  lx:  0, ly: hh },
      { name:"sw", lx:-hw, ly: hh }, { name:"w",  lx:-hw, ly:  0 },
    ];
  }

  function worldToLocal(l, wx, wy) {
    const dx = wx - l.x, dy = wy - l.y;
    const rad = -(l.rotation || 0) * Math.PI / 180;
    return { lx: dx*Math.cos(rad) - dy*Math.sin(rad), ly: dx*Math.sin(rad) + dy*Math.cos(rad) };
  }

  function hitTestLayer(l, wx, wy) {
    const loc = worldToLocal(l, wx, wy);
    return Math.abs(loc.lx) <= l.w/2 + 6 && Math.abs(loc.ly) <= l.h/2 + 6;
  }

  function hitTestHandle(l, wx, wy) {
    const loc = worldToLocal(l, wx, wy);
    for (const h of getHandlePositions(l)) {
      if (Math.abs(loc.lx - h.lx) <= HANDLE_SIZE+2 && Math.abs(loc.ly - h.ly) <= HANDLE_SIZE+2) return h.name;
    }
    if (Math.abs(loc.lx) <= 10 && Math.abs(loc.ly + l.h/2 + 24) <= 10) return "rotate";
    return null;
  }

  function getCanvasXY(e) {
    if (!canvas) return { x:0, y:0 };
    const t = e.touches ? e.touches[0] : e;
    const r = canvas.getBoundingClientRect();
    return {
      x: (t.clientX - r.left) * (canvas.width  / r.width),
      y: (t.clientY - r.top)  * (canvas.height / r.height),
    };
  }

  // ════════════════════════════════════════════════════════════
  // SMART ALIGNMENT GUIDES ✅ NEW
  // ════════════════════════════════════════════════════════════

  function calcSmartGuides(movingLayer) {
    if (!canvas) return [];
    const guides_ = [];
    const W = CANVAS_SIZE, H = CANVAS_SIZE;
    const ml = movingLayer;
    const mlL = ml.x - ml.w/2, mlR = ml.x + ml.w/2, mlT = ml.y - ml.h/2, mlB = ml.y + ml.h/2;
    const mlCX = ml.x, mlCY = ml.y;

    // Canvas center + edges
    const canvasRefs = [
      { type:"x", v:W/2,  label:"↔" }, { type:"x", v:0,    label:"" }, { type:"x", v:W,    label:"" },
      { type:"y", v:H/2,  label:"↕" }, { type:"y", v:0,    label:"" }, { type:"y", v:H,    label:"" },
    ];

    // Other layers
    layers.filter(l => l.visible && l.id !== ml.id).forEach(l => {
      canvasRefs.push(
        { type:"x", v:l.x,       label:"" }, { type:"x", v:l.x-l.w/2, label:"" }, { type:"x", v:l.x+l.w/2, label:"" },
        { type:"y", v:l.y,       label:"" }, { type:"y", v:l.y-l.h/2, label:"" }, { type:"y", v:l.y+l.h/2, label:"" },
      );
    });

    const snap_ = (val, ref) => Math.abs(val - ref) < SNAP_THRESHOLD;

    canvasRefs.forEach(ref => {
      if (ref.type === "x") {
        if (snap_(mlCX, ref.v)) { guides_.push({ axis:"x", v:ref.v }); if (snapToGrid || true) ml.x = ref.v; }
        else if (snap_(mlL, ref.v)) { guides_.push({ axis:"x", v:ref.v }); if (snapToGrid || true) ml.x = ref.v + ml.w/2; }
        else if (snap_(mlR, ref.v)) { guides_.push({ axis:"x", v:ref.v }); if (snapToGrid || true) ml.x = ref.v - ml.w/2; }
      } else {
        if (snap_(mlCY, ref.v)) { guides_.push({ axis:"y", v:ref.v }); if (snapToGrid || true) ml.y = ref.v; }
        else if (snap_(mlT, ref.v)) { guides_.push({ axis:"y", v:ref.v }); if (snapToGrid || true) ml.y = ref.v + ml.h/2; }
        else if (snap_(mlB, ref.v)) { guides_.push({ axis:"y", v:ref.v }); if (snapToGrid || true) ml.y = ref.v - ml.h/2; }
      }
    });

    return guides_;
  }

  function drawSmartGuides() {
    if (!ctx || !activeGuides.length) return;
    ctx.save();
    ctx.strokeStyle = "#ff4d6d";
    ctx.lineWidth   = 1;
    ctx.setLineDash([4, 3]);
    ctx.globalAlpha = 0.85;
    activeGuides.forEach(g => {
      ctx.beginPath();
      if (g.axis === "x") { ctx.moveTo(g.v, 0); ctx.lineTo(g.v, CANVAS_SIZE); }
      else                { ctx.moveTo(0, g.v); ctx.lineTo(CANVAS_SIZE, g.v); }
      ctx.stroke();
    });
    ctx.setLineDash([]);
    ctx.restore();
  }

  // ════════════════════════════════════════════════════════════
  // DRAW
  // ════════════════════════════════════════════════════════════

  function drawStarPath(c, cx, cy, r, points = 5) {
    const inner = r * 0.4;
    c.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI / points) - Math.PI / 2;
      const rad   = i % 2 === 0 ? r : inner;
      c.lineTo ? null : null;
      const x = cx + Math.cos(angle) * rad;
      const y = cy + Math.sin(angle) * rad;
      i === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
    }
    c.closePath();
  }

  // ✅ Accurate char-by-char text rendering with letterSpacing
  function _renderChars(c, text, ls, align, mode) {
    if (!ls) { if(mode==="fill")c.fillText(text,0,0); else c.strokeText(text,0,0); return; }
    const totalW = (() => {let t=0;for(const ch of text)t+=c.measureText(ch).width+ls;return Math.max(0,t-ls)})();
    let sx = align==="center"?-totalW/2:align==="right"?-totalW:0;
    for(const ch of text){
      if(mode==="fill")c.fillText(ch,sx,0); else c.strokeText(ch,sx,0);
      sx+=c.measureText(ch).width+ls;
    }
  }

  // Proxy for measureTextWidth (may not be defined yet at parse time)
  function measureTextWidth(c, text, ls) {
    if(!ls)return c.measureText(text).width;
    let t=0; for(const ch of text)t+=c.measureText(ch).width+ls; return Math.max(0,t-ls);
  }

  function drawLayer(l) {
    if (!ctx) return;
    ctx.save();
    ctx.globalAlpha = (l.opacity || 100) / 100;
    ctx.translate(l.x, l.y);
    if (l.rotation)  ctx.rotate(l.rotation * Math.PI / 180);
    if (l.flippedH)  ctx.scale(-1,  1);
    if (l.flippedV)  ctx.scale( 1, -1);
    const hw = l.w / 2, hh = l.h / 2;

    if (l.type === "text") {
      const oob = isOutsidePrintArea(l);
      const ls  = l.letterSpacing || 0;
      const weight = l.bold&&l.italic?"bold italic ":l.bold?"bold ":l.italic?"italic ":"";
      ctx.font = weight+l.fontSize+"px '"+l.font+"'";
      ctx.textBaseline = "middle"; ctx.textAlign = l.textAlign || "center";

      // Shadow
      if (l.shadowBlur>0||l.shadowOffsetX||l.shadowOffsetY) {
        ctx.shadowColor=l.shadowColor||"rgba(0,0,0,0.5)";
        ctx.shadowBlur=l.shadowBlur||0; ctx.shadowOffsetX=l.shadowOffsetX||0; ctx.shadowOffsetY=l.shadowOffsetY||0;
      }

      // Stroke (outline)
      if (l.textStroke&&l.textStrokeWidth>0) {
        ctx.strokeStyle=oob?"#ef4444":l.textStroke; ctx.lineWidth=l.textStrokeWidth*2;
        ctx.lineJoin="round"; ctx.miterLimit=2;
        _renderChars(ctx,l.text,ls,l.textAlign,"stroke");
      }
      ctx.shadowBlur=0; ctx.shadowColor="transparent";
      if(l.shadowBlur>0||l.shadowOffsetX||l.shadowOffsetY){ctx.shadowColor=l.shadowColor||"rgba(0,0,0,0.5)";ctx.shadowBlur=l.shadowBlur||0;ctx.shadowOffsetX=l.shadowOffsetX||0;ctx.shadowOffsetY=l.shadowOffsetY||0;}

      ctx.fillStyle = oob?"rgba(239,68,68,0.6)":l.fillColor;
      _renderChars(ctx,l.text,ls,l.textAlign,"fill");

      // Underline
      if (l.underline) {
        ctx.shadowBlur=0;
        const textW = measureTextWidth ? measureTextWidth(ctx,l.text,ls) : ctx.measureText(l.text).width;
        const ulX = l.textAlign==="center"?-textW/2:l.textAlign==="right"?-textW:0;
        ctx.fillStyle=oob?"#ef4444":l.fillColor;
        ctx.fillRect(ulX,l.fontSize*0.6,textW,Math.max(2,l.fontSize*0.05));
      }
      ctx.shadowBlur=0; ctx.shadowColor="transparent"; ctx.shadowOffsetX=0; ctx.shadowOffsetY=0;

    } else if (l.type === "rect") {
      const r2 = l.cornerRadius || 0;
      ctx.beginPath();
      r2 > 0 ? ctx.roundRect(-hw, -hh, l.w, l.h, r2) : ctx.rect(-hw, -hh, l.w, l.h);
      if (l.gradient?.type) {
        let grd = l.gradient.type === "linear"
          ? ctx.createLinearGradient(-hw, 0, hw, 0)
          : ctx.createRadialGradient(0, 0, 0, 0, 0, hw);
        (l.gradient.stops || []).forEach(s => grd.addColorStop(s.pos, s.color));
        ctx.fillStyle = grd;
      } else { ctx.fillStyle = l.fillColor; }
      ctx.fill();
      if (l.strokeColor && l.strokeWidth) { ctx.strokeStyle = l.strokeColor; ctx.lineWidth = l.strokeWidth; ctx.stroke(); }

    } else if (l.type === "circle") {
      ctx.beginPath(); ctx.arc(0, 0, Math.max(hw, 1), 0, Math.PI * 2);
      ctx.fillStyle = l.fillColor; ctx.fill();
      if (l.strokeColor && l.strokeWidth) { ctx.strokeStyle = l.strokeColor; ctx.lineWidth = l.strokeWidth; ctx.stroke(); }

    } else if (l.type === "triangle") {
      ctx.beginPath(); ctx.moveTo(0, -hh); ctx.lineTo(hw, hh); ctx.lineTo(-hw, hh); ctx.closePath();
      ctx.fillStyle = l.fillColor; ctx.fill();
      if (l.strokeColor && l.strokeWidth) { ctx.strokeStyle = l.strokeColor; ctx.lineWidth = l.strokeWidth; ctx.stroke(); }

    } else if (l.type === "star") {
      drawStarPath(ctx, 0, 0, hw);
      ctx.fillStyle = l.fillColor; ctx.fill();
      if (l.strokeColor && l.strokeWidth) { ctx.strokeStyle = l.strokeColor; ctx.lineWidth = l.strokeWidth; ctx.stroke(); }

    } else if (l.type === "line") {
      ctx.beginPath(); ctx.moveTo(-hw, 0); ctx.lineTo(hw, 0);
      ctx.strokeStyle = l.strokeColor || l.fillColor; ctx.lineWidth = l.strokeWidth || 3; ctx.stroke();

    } else if (l.type === "image" && l.img) {
      if (l.img.complete && l.img.naturalWidth > 0) {
        const oob = isOutsidePrintArea(l);
        ctx.save();
        // Apply brightness/contrast filter
        const filters=[];
        if(l.brightness&&l.brightness!==0) filters.push("brightness("+(100+l.brightness)+"%)");
        if(l.contrast&&l.contrast!==0)     filters.push("contrast("+(100+l.contrast)+"%)");
        if(filters.length) ctx.filter=filters.join(" ");
        if(oob) ctx.globalAlpha=(l.opacity||100)/100*0.5;
        ctx.drawImage(l.img,-hw,-hh,l.w,l.h);
        ctx.filter="none"; ctx.restore();
      }
    }
    ctx.restore();

    // ── Selection overlay ──
    const isSelected  = l.id === selectedId;
    const isMultiSel  = multiSelected.includes(l.id);

    if (isSelected || isMultiSel) {
      ctx.save();
      ctx.translate(l.x, l.y);
      if (l.rotation) ctx.rotate(l.rotation * Math.PI / 180);
      const hw2 = l.w/2, hh2 = l.h/2;

      // Bounding box
      const boxColor = isSelected ? "#7c3aed" : "#2563eb";
      ctx.shadowColor = boxColor; ctx.shadowBlur = isSelected ? 8 : 4;
      ctx.strokeStyle = boxColor; ctx.lineWidth = isSelected ? 1.8 : 1.2;
      ctx.setLineDash([5, 3]); ctx.strokeRect(-hw2-1, -hh2-1, l.w+2, l.h+2);
      ctx.setLineDash([]); ctx.shadowBlur = 0;

      if (isSelected) {
        // Resize handles
        getHandlePositions(l).forEach(h => {
          ctx.fillStyle   = "#ffffff"; ctx.strokeStyle = "#7c3aed"; ctx.lineWidth = 1.5;
          const hs = HANDLE_SIZE;
          ctx.beginPath(); ctx.roundRect(h.lx-hs/2, h.ly-hs/2, hs, hs, 2); ctx.fill(); ctx.stroke();
        });
        // Rotate handle
        ctx.strokeStyle = "#c9a84c"; ctx.lineWidth = 1.2; ctx.setLineDash([3, 2]);
        ctx.beginPath(); ctx.moveTo(0, -hh2-1); ctx.lineTo(0, -hh2-22); ctx.stroke();
        ctx.setLineDash([]); ctx.shadowColor = "#c9a84c"; ctx.shadowBlur = 6;
        ctx.fillStyle = "#c9a84c"; ctx.beginPath(); ctx.arc(0, -hh2-24, 6, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
        // Lock icon
        if (l.locked) { ctx.fillStyle = "#ff6b6b"; ctx.font = "12px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("🔒", hw2+12, -hh2-12); }
        // Aspect lock indicator ✅ NEW
        if (aspectLocked) { ctx.fillStyle = "#c9a84c99"; ctx.font = "9px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("⇔", 0, hh2+14); }
      }
      ctx.restore();
    }
  }

  function drawGrid() {
    if (!ctx || !showGrid) return;
    ctx.save();
    ctx.globalAlpha = 0.12; ctx.strokeStyle = "#7c3aed"; ctx.lineWidth = 0.5;
    for (let x = 0; x <= CANVAS_SIZE;  x += GRID_SIZE) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,CANVAS_SIZE); ctx.stroke(); }
    for (let y = 0; y <= CANVAS_SIZE; y += GRID_SIZE) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(CANVAS_SIZE,y); ctx.stroke(); }
    ctx.globalAlpha = 0.25; ctx.strokeStyle = "#c9a84c";
    ctx.beginPath(); ctx.moveTo(CANVAS_SIZE/2,0); ctx.lineTo(CANVAS_SIZE/2,CANVAS_SIZE); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0,CANVAS_SIZE/2); ctx.lineTo(CANVAS_SIZE,CANVAS_SIZE/2); ctx.stroke();
    ctx.restore();
  }

  function drawAll() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (bgColorVal && bgColorVal !== "transparent") { ctx.fillStyle = bgColorVal; ctx.fillRect(0,0,canvas.width,canvas.height); }
    drawGrid();
    // Product ghost
    ctx.save(); ctx.globalAlpha = 0.04; ctx.font = "220px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#888";
    ctx.fillText(PROD_EMOJI[canvasProdType] || "👕", 250, 250); ctx.restore();
    // Print area guide
    ctx.save(); ctx.globalAlpha = 0.08; ctx.strokeStyle = "#7c3aed"; ctx.lineWidth = 1; ctx.setLineDash([6,4]);
    ctx.strokeRect(80, 80, 340, 340); ctx.setLineDash([]); ctx.restore();
    // Layers
    layers.filter(l => l.visible).forEach(drawLayer);
    // Smart guides ✅
    drawSmartGuides();
    // UI updates
    if (typeof renderLayers       === "function") renderLayers();
    if (typeof updateTransformPanel === "function") updateTransformPanel();
    if (typeof updateCanvasModeBadge === "function") updateCanvasModeBadge();
    if (typeof updateDesignPrice   === "function") updateDesignPrice();
    if (typeof updateLayerCountBadge === "function") updateLayerCountBadge();
    if (showRulers) drawRulers();
  }

  // ════════════════════════════════════════════════════════════
  // GRID & SNAP
  // ════════════════════════════════════════════════════════════

  function toggleGrid() {
    showGrid = !showGrid;
    document.getElementById("dsGridBtn")?.classList.toggle("active-tool-btn", showGrid);
    drawAll();
  }

  function toggleSnap() {
    snapToGrid = !snapToGrid;
    document.getElementById("dsSnapBtn")?.classList.toggle("active-tool-btn", snapToGrid);
    if (typeof showToast === "function") showToast(snapToGrid ? "📐 الالتصاق مفعّل" : "📐 الالتصاق معطّل");
  }

  // ✅ NEW: Aspect ratio lock toggle
  function toggleAspectLock() {
    aspectLocked = !aspectLocked;
    document.getElementById("dsAspectBtn")?.classList.toggle("active-tool-btn", aspectLocked);
    if (typeof showToast === "function") showToast(aspectLocked ? "⇔ تأمين النسبة" : "⇔ النسبة حرة");
  }

  // ════════════════════════════════════════════════════════════
  // RULERS
  // ════════════════════════════════════════════════════════════

  function convertUnit(px) {
    if (rulerUnit === "cm") return (px * CANVAS_PX_TO_CM).toFixed(1);
    if (rulerUnit === "mm") return Math.round(px * CANVAS_PX_TO_CM * 10);
    return Math.round(px);
  }
  function getTickStep()  { return rulerUnit==="cm" ? Math.round(1/CANVAS_PX_TO_CM) : rulerUnit==="mm" ? Math.round(0.1/CANVAS_PX_TO_CM) : 25; }
  function getLabelStep() { return rulerUnit==="cm" ? Math.round(1/CANVAS_PX_TO_CM) : rulerUnit==="mm" ? Math.round(1/CANVAS_PX_TO_CM) : 50; }

  function injectRulerCanvas() {
    if (document.getElementById("a3mRulerH")) return;
    const mainCanvas = document.getElementById("designCanvas");
    if (!mainCanvas) return;
    const parent = mainCanvas.parentElement;
    if (!parent) return;
    parent.style.position = "relative";
    const rH = document.createElement("canvas");
    rH.id = "a3mRulerH";
    rH.style.cssText = `position:absolute;top:0;left:${RULER_SIZE}px;width:calc(100% - ${RULER_SIZE}px);height:${RULER_SIZE}px;pointer-events:none;z-index:10;`;
    parent.insertBefore(rH, mainCanvas);
    const rV = document.createElement("canvas");
    rV.id = "a3mRulerV";
    rV.style.cssText = `position:absolute;top:0;left:0;width:${RULER_SIZE}px;height:calc(100%);pointer-events:none;z-index:10;`;
    parent.insertBefore(rV, mainCanvas);
    const corner = document.createElement("div");
    corner.id = "a3mRulerCorner";
    corner.style.cssText = `position:absolute;top:0;left:0;width:${RULER_SIZE}px;height:${RULER_SIZE}px;background:#1a1a2e;border-right:1px solid #252540;border-bottom:1px solid #252540;z-index:11;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:8px;color:#6b7280;`;
    corner.title = "تغيير الوحدة (px / cm / mm)"; corner.textContent = rulerUnit;
    corner.onclick = () => { rulerUnit = rulerUnit==="px"?"cm":rulerUnit==="cm"?"mm":"px"; corner.textContent = rulerUnit; drawRulers(); };
    parent.insertBefore(corner, mainCanvas);
    mainCanvas.style.cssText = `position:absolute;top:${RULER_SIZE}px;left:${RULER_SIZE}px;width:calc(100% - ${RULER_SIZE}px);height:calc(100% - ${RULER_SIZE}px);`;
    mainCanvas.addEventListener("mousemove", e => {
      const r = mainCanvas.getBoundingClientRect();
      mouseRulerX = (e.clientX - r.left) * (canvas ? canvas.width/r.width : 1);
      mouseRulerY = (e.clientY - r.top)  * (canvas ? canvas.height/r.height : 1);
      if (showRulers) drawRulers();
    });
    mainCanvas.addEventListener("mouseleave", () => { mouseRulerX=-1; mouseRulerY=-1; if (showRulers) drawRulers(); });
  }

  function drawRulers() {
    if (!showRulers || !canvas) return;
    const rH = document.getElementById("a3mRulerH");
    const rV = document.getElementById("a3mRulerV");
    if (!rH || !rV) { injectRulerCanvas(); return; }
    const cw = CANVAS_SIZE, ch = CANVAS_SIZE;
    const rHRect = rH.getBoundingClientRect(), rVRect = rV.getBoundingClientRect();
    rH.width = rHRect.width||cw; rH.height = RULER_SIZE;
    rV.width = RULER_SIZE;       rV.height = rVRect.height||ch;
    const scaleX = rH.width/cw, scaleY = rV.height/ch;
    const ctxH = rH.getContext("2d"), ctxV = rV.getContext("2d");
    const drawRuler = (c, length, scale, isHoriz) => {
      const rLen = isHoriz ? rH.width : rV.height;
      c.clearRect(0,0,isHoriz?rLen:RULER_SIZE,isHoriz?RULER_SIZE:rLen);
      c.fillStyle = "#12121f"; c.fillRect(0,0,isHoriz?rLen:RULER_SIZE,isHoriz?RULER_SIZE:rLen);
      c.strokeStyle = "#252540"; c.lineWidth = 1;
      if (isHoriz) { c.beginPath(); c.moveTo(0,RULER_SIZE-.5); c.lineTo(rLen,RULER_SIZE-.5); c.stroke(); }
      else         { c.beginPath(); c.moveTo(RULER_SIZE-.5,0); c.lineTo(RULER_SIZE-.5,rLen); c.stroke(); }
      const tickStep = getTickStep(), labelStep = getLabelStep();
      for (let px=0; px<=length; px+=tickStep) {
        const pos=px*scale, isLabel=px%labelStep===0, isMid=px%(tickStep*2)===0;
        const tickH = isLabel?RULER_SIZE*.75:isMid?RULER_SIZE*.5:RULER_SIZE*.3;
        c.lineWidth = isLabel?1.2:.7; c.strokeStyle = isLabel?"#4a4a7a":"#2a2a45";
        if (isHoriz) {
          c.beginPath(); c.moveTo(pos,RULER_SIZE); c.lineTo(pos,RULER_SIZE-tickH); c.stroke();
          if (isLabel && px>0) { c.save(); c.fillStyle="#888aaa"; c.font="8px sans-serif"; c.textAlign="center"; c.fillText(convertUnit(px),pos,RULER_SIZE*.38); c.restore(); }
        } else {
          c.beginPath(); c.moveTo(RULER_SIZE,pos); c.lineTo(RULER_SIZE-tickH,pos); c.stroke();
          if (isLabel && px>0) { c.save(); c.translate(RULER_SIZE*.5,pos); c.rotate(-Math.PI/2); c.fillStyle="#888aaa"; c.font="8px sans-serif"; c.textAlign="center"; c.fillText(convertUnit(px),0,0); c.restore(); }
        }
      }
      const curPos = isHoriz ? mouseRulerX*scaleX : mouseRulerY*scaleY;
      if (curPos>0) {
        c.strokeStyle="#c9a84c"; c.lineWidth=1; c.beginPath();
        if (isHoriz) { c.moveTo(curPos,0); c.lineTo(curPos,RULER_SIZE); } else { c.moveTo(0,curPos); c.lineTo(RULER_SIZE,curPos); }
        c.stroke();
      }
      const sel = layers.find(l => l.id===selectedId);
      if (sel) {
        const startPx = isHoriz ? sel.x-sel.w/2 : sel.y-sel.h/2;
        const endPx   = isHoriz ? sel.x+sel.w/2 : sel.y+sel.h/2;
        c.fillStyle = "rgba(124,58,237,0.25)";
        if (isHoriz) c.fillRect(startPx*scale,0,(endPx-startPx)*scale,RULER_SIZE);
        else         c.fillRect(0,startPx*scale,RULER_SIZE,(endPx-startPx)*scale);
      }
    };
    drawRuler(ctxH,cw,scaleX,true);
    drawRuler(ctxV,ch,scaleY,false);
  }

  function toggleRulers() {
    showRulers = !showRulers;
    ["a3mRulerH","a3mRulerV","a3mRulerCorner"].forEach(id => {
      const el = document.getElementById(id); if (el) el.style.display = showRulers?"":"none";
    });
    const mc  = document.getElementById("designCanvas");
    const btn = document.getElementById("dsRulerBtn");
    if (mc) { mc.style.top=showRulers?RULER_SIZE+"px":"0"; mc.style.left=showRulers?RULER_SIZE+"px":"0"; mc.style.width=showRulers?`calc(100% - ${RULER_SIZE}px)`:"100%"; mc.style.height=showRulers?`calc(100% - ${RULER_SIZE}px)`:"100%"; }
    if (btn) btn.classList.toggle("active-tool-btn", showRulers);
    if (showRulers) drawRulers();
    if (typeof showToast === "function") showToast(showRulers ? "📏 المسطرة مفعّلة" : "📏 المسطرة مخفية");
  }

  // ════════════════════════════════════════════════════════════
  // PRICE CALCULATOR
  // ════════════════════════════════════════════════════════════

  function updateDesignPrice() {
    const el = document.getElementById("ds-price-val");
    if (!el) return;
    let total = BASE_PRICE;
    layers.forEach(l => { total += PER_ELEMENT + Math.min(Math.max(0,((l.w||100)*(l.h||50)-12000)/12000)*100,500); });
    const val = Math.round(total) + " دج";
    if (el.textContent !== val) { el.textContent=val; el.style.transform="scale(1.22)"; setTimeout(()=>{el.style.transform="scale(1)"},200); }
    el.style.color = total>BASE_PRICE+1000?"#7c3aed":total>BASE_PRICE?"#f59e0b":"#c9a84c";
  }

  function updateLayerCountBadge() {
    ["dsLayerCount","dsLayerCountStatus"].forEach(id => { const el=document.getElementById(id); if(el) el.textContent=layers.length; });
  }

  // ════════════════════════════════════════════════════════════
  // CONTEXT MENU ✅ NEW
  // ════════════════════════════════════════════════════════════

  function showContextMenu(x, y, layer) {
    removeContextMenu();
    const menu = document.createElement("div");
    menu.id = "a3m-ctx-menu";
    menu.style.cssText = `position:fixed;left:${x}px;top:${y}px;background:#111827;border:1px solid #252540;border-radius:10px;padding:.3rem 0;z-index:99999;min-width:160px;box-shadow:0 12px 40px rgba(0,0,0,.6);font-family:'Cairo',sans-serif;font-size:13px;`;
    const item = (icon, label, fn, color="") => `<div class="a3m-ctx-item" onclick="(${fn.toString()})();document.getElementById('a3m-ctx-menu')?.remove()" style="display:flex;align-items:center;gap:.6rem;padding:.5rem 1rem;cursor:pointer;transition:.12s;color:${color||"#d1d5db"};" onmouseover="this.style.background='rgba(255,255,255,.06)'" onmouseout="this.style.background=''">${icon} ${label}</div>`;
    const sep = `<div style="height:1px;background:#1f2937;margin:.2rem 0"></div>`;
    menu.innerHTML = [
      item("⊕", "تكرار", () => { if(typeof duplicateSelected==="function") duplicateSelected(); }),
      item("⇅", "للأمام", () => { if(typeof bringForward==="function") bringForward(); }),
      item("⇅", "للخلف",  () => { if(typeof sendBackward==="function") sendBackward(); }),
      sep,
      item("↔", "توسيط أفقي",  () => { if(typeof alignLayers==="function") alignLayers("hcenter"); }),
      item("↕", "توسيط عمودي", () => { if(typeof alignLayers==="function") alignLayers("vcenter"); }),
      sep,
      item("🔒", layer?.locked?"🔓 فتح القفل":"🔒 قفل", () => { if(typeof lockSelected==="function") lockSelected(); }),
      sep,
      item("🗑", "حذف", () => { if(typeof deleteSelected==="function") deleteSelected(); }, "#ef4444"),
    ].join("");
    document.body.appendChild(menu);
    // Close on outside click
    setTimeout(() => document.addEventListener("click", removeContextMenu, { once:true }), 50);
  }

  function removeContextMenu() {
    document.getElementById("a3m-ctx-menu")?.remove();
  }

  // ════════════════════════════════════════════════════════════
  // KEYBOARD SHORTCUTS ✅ NEW
  // ════════════════════════════════════════════════════════════

  function _bindKeyboard() {
    if (window._a3mKbBound) return;
    window._a3mKbBound = true;
    document.addEventListener("keydown", e => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      const ctrl = e.ctrlKey || e.metaKey;

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        if (typeof deleteSelected === "function") deleteSelected();
      }
      else if (ctrl && e.key === "z") { e.preventDefault(); undoAction(); }
      else if (ctrl && (e.key === "y" || (e.shiftKey && e.key === "z"))) { e.preventDefault(); redoAction(); }
      else if (ctrl && e.key === "d") { e.preventDefault(); if (typeof duplicateSelected==="function") duplicateSelected(); }
      else if (ctrl && e.key === "a") { e.preventDefault(); _selectAll(); }
      else if (ctrl && e.key === "g") { e.preventDefault(); toggleGrid(); }
      else if (e.key === "Escape") { selectedId=null; multiSelected=[]; removeContextMenu(); drawAll(); }
      // Arrow keys — nudge selected layer
      else if (["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key)) {
        const sel = layers.find(l => l.id===selectedId);
        if (!sel || sel.locked) return;
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        if (e.key==="ArrowLeft")  sel.x -= step;
        if (e.key==="ArrowRight") sel.x += step;
        if (e.key==="ArrowUp")    sel.y -= step;
        if (e.key==="ArrowDown")  sel.y += step;
        drawAll();
      }
    });
  }

  function _selectAll() {
    multiSelected = layers.filter(l => l.visible).map(l => l.id);
    if (multiSelected.length) selectedId = multiSelected[multiSelected.length-1];
    drawAll();
  }

  // ════════════════════════════════════════════════════════════
  // POINTER HANDLERS
  // ════════════════════════════════════════════════════════════

  function _onPointerDown(e) {
    if (!canvas) return;

    // Context menu ✅
    if (e.button === 2 || e.type === "contextmenu") {
      e.preventDefault();
      const { x, y } = getCanvasXY(e);
      let hit = null;
      for (let i=layers.length-1; i>=0; i--) { if (layers[i].visible && hitTestLayer(layers[i],x,y)) { hit=layers[i]; break; } }
      if (hit) { selectedId=hit.id; drawAll(); }
      showContextMenu(e.clientX, e.clientY, hit);
      return;
    }

    const { x, y } = getCanvasXY(e);

    if (activeTool === "select") {
      const sel = layers.find(l => l.id===selectedId);
      if (sel && !sel.locked) {
        const h = hitTestHandle(sel, x, y);
        if (h) {
          isResizing=true; resizeHandle=h;
          resizeStartX=x; resizeStartY=y;
          resizeStartW=sel.w; resizeStartH=sel.h;
          resizeStartObjX=sel.x; resizeStartObjY=sel.y;
          return;
        }
      }
      let hit = null;
      for (let i=layers.length-1; i>=0; i--) { if (layers[i].visible && hitTestLayer(layers[i],x,y)) { hit=layers[i]; break; } }
      if (hit) {
        if (hit.locked) { if (typeof showToast==="function") showToast("🔒 الطبقة مقفولة","error"); selectedId=hit.id; drawAll(); return; }
        // Shift: add to multi-select ✅
        if (e.shiftKey) {
          if (multiSelected.includes(hit.id)) multiSelected=multiSelected.filter(id=>id!==hit.id);
          else multiSelected.push(hit.id);
        } else {
          multiSelected = [];
          selectedId=hit.id;
        }
        isDragging=true; dragOffX=x-hit.x; dragOffY=y-hit.y;
      } else {
        if (!e.shiftKey) { selectedId=null; multiSelected=[]; }
      }
      drawAll(); return;
    }

    // Tool placement
    saveHist();
    const fill   = document.getElementById("shapeFill")?.value   || "#7c3aed";
    const stroke = document.getElementById("shapeStroke")?.value || "#c9a84c";
    const op     = parseInt(document.getElementById("shapeOpacity")?.value) || 100;
    const sw     = parseInt(document.getElementById("strokeW")?.value) || 2;
    const cr     = parseInt(document.getElementById("cornerRadius")?.value) || 0;
    const text   = document.getElementById("txtContent")?.value  || "Text";
    const fs     = parseInt(document.getElementById("txtSize")?.value) || 40;
    const font   = document.getElementById("txtFont")?.value     || "Cairo";
    const txtFill= document.getElementById("txtColor")?.value    || "#000000";
    if      (activeTool==="text")     { if(typeof addTextLayer==="function")addTextLayer(text,fs,font,txtFill,"center",x,y); if(typeof setTool==="function")setTool("select"); }
    else if (activeTool==="rect")     { if(typeof addRect==="function")addRect(x,y,150,80,fill,stroke,sw,op,{cornerRadius:cr}); if(typeof setTool==="function")setTool("select"); }
    else if (activeTool==="circle")   { if(typeof addCircle==="function")addCircle(x,y,60,fill,stroke,op); if(typeof setTool==="function")setTool("select"); }
    else if (activeTool==="triangle") { if(typeof addTriangle==="function")addTriangle(x,y,120,100,fill,stroke,op); if(typeof setTool==="function")setTool("select"); }
    else if (activeTool==="star")     { if(typeof addStar==="function")addStar(x,y,65,fill,stroke,op); if(typeof setTool==="function")setTool("select"); }
    else if (activeTool==="line")     { if(typeof addLine==="function")addLine(x-80,y,x+80,y,fill,sw,op); if(typeof setTool==="function")setTool("select"); }
  }

  function _onPointerMove(e) {
    if (!canvas) return;
    const { x, y } = getCanvasXY(e);
    const sel = layers.find(l => l.id===selectedId);
    const coordEl = document.getElementById("dsCoords");
    if (coordEl) coordEl.textContent = `${Math.round(x)}, ${Math.round(y)}`;
    const tip = document.getElementById("ds-canvas-tip");

    if (isDragging && sel) {
      const newX = snap(x - dragOffX);
      const newY = snap(y - dragOffY);
      sel.x = newX; sel.y = newY;
      // Smart guides ✅
      activeGuides = isDragging ? calcSmartGuides(sel) : [];
      drawAll();
      if (tip) { tip.textContent=`X:${Math.round(sel.x)} Y:${Math.round(sel.y)}`; tip.style.display="block"; tip.style.left=(x+14)+"px"; tip.style.top=(y-22)+"px"; }
    } else if (isResizing && sel) {
      activeGuides = [];
      const dx = x - resizeStartX, dy = y - resizeStartY;
      if (resizeHandle === "rotate") {
        sel.rotation = Math.round(Math.atan2(x-sel.x, -(y-sel.y)) * 180/Math.PI);
        // ✅ Snap rotation to 15° increments when shift held
        if (e.shiftKey) sel.rotation = Math.round(sel.rotation/15)*15;
      } else {
        let newW = resizeStartW, newH = resizeStartH;
        if (resizeHandle.includes("e")) newW = Math.max(20, resizeStartW + dx);
        if (resizeHandle.includes("s")) newH = Math.max(10, resizeStartH + dy);
        if (resizeHandle.includes("w")) { newW = Math.max(20, resizeStartW - dx); sel.x = resizeStartObjX + dx/2; }
        if (resizeHandle.includes("n")) { newH = Math.max(10, resizeStartH - dy); sel.y = resizeStartObjY + dy/2; }
        // ✅ Aspect-ratio lock (shift OR aspectLocked toggle)
        if (e.shiftKey || aspectLocked) {
          const ratio = resizeStartW / resizeStartH;
          if (resizeHandle.includes("e")||resizeHandle.includes("w")) newH = newW / ratio;
          else newW = newH * ratio;
        }
        sel.w = newW; sel.h = newH;
        if (sel.type==="circle") sel.h=sel.w;
      }
      drawAll();
      if (tip) { const wCm=(sel.w*CANVAS_PX_TO_CM).toFixed(1),hCm=(sel.h*CANVAS_PX_TO_CM).toFixed(1); tip.textContent=`${Math.round(sel.w)}×${Math.round(sel.h)}px (${wCm}×${hCm}cm)`; tip.style.display="block"; tip.style.left=(x+14)+"px"; tip.style.top=(y-22)+"px"; }
    }

    if (activeTool==="select") {
      const h = sel ? hitTestHandle(sel,x,y) : null;
      canvas.style.cursor = h==="rotate"?"crosshair":h?"nwse-resize":(sel&&hitTestLayer(sel,x,y))?"move":"default";
    }
  }

  function _onPointerUp() {
    if (isDragging || isResizing) saveHist();
    isDragging=false; isResizing=false; resizeHandle="";
    activeGuides = [];
    const tip = document.getElementById("ds-canvas-tip");
    if (tip) tip.style.display="none";
    drawAll();
  }

  // ════════════════════════════════════════════════════════════
  // EXPOSE
  // ════════════════════════════════════════════════════════════

  // ════════════════════════════════════════════════════════════
  // PRINT AREAS  (were missing → caused "getPrintArea is not defined")
  // ════════════════════════════════════════════════════════════

  let showPrintArea = true;

  function getPrintArea() {
    return PRINT_AREAS[canvasProdType] || PRINT_AREAS.tshirt;
  }

  function isOutsidePrintArea(layer) {
    if (!showPrintArea) return false;
    const pa = getPrintArea();
    const lL = layer.x - layer.w / 2;
    const lR = layer.x + layer.w / 2;
    const lT = layer.y - layer.h / 2;
    const lB = layer.y + layer.h / 2;
    return lL < pa.x || lR > (pa.x + pa.w) || lT < pa.y || lB > (pa.y + pa.h);
  }

  function togglePrintArea() {
    showPrintArea = !showPrintArea;
    const btn = document.getElementById("dsPrintAreaBtn");
    if (btn) btn.classList.toggle("active-btn", showPrintArea);
    drawAll();
  }

  // ════════════════════════════════════════════════════════════
  // CALC TEXT BOUNDS  (accurate sizing for text layers)
  // ════════════════════════════════════════════════════════════

  function calcTextBounds(layer) {
    if (!ctx) return { w: (layer.fontSize || 40) * 6, h: (layer.fontSize || 40) * 1.4 };
    const weight = layer.bold && layer.italic ? "bold italic "
                 : layer.bold   ? "bold "
                 : layer.italic ? "italic " : "";
    ctx.save();
    ctx.font = weight + (layer.fontSize || 40) + "px '" + (layer.font || "Cairo") + "'";
    const ls = layer.letterSpacing || 0;
    const w  = ls > 0 ? measureTextWidth(ctx, layer.text || "", ls)
                      : ctx.measureText(layer.text || "").width;
    ctx.restore();
    const h = (layer.fontSize || 40) * 1.35;
    return { w: Math.max(w + 20, 40), h: Math.max(h, 20) };
  }

  // ════════════════════════════════════════════════════════════
  // FIT CANVAS (scale canvas to container width)
  // ════════════════════════════════════════════════════════════

  function dsFitCanvas() {
    const cv  = document.getElementById("designCanvas");
    const wrap = cv && cv.parentElement;
    if (!cv || !wrap) return;
    const maxW = wrap.clientWidth  || 500;
    const maxH = (window.innerHeight * 0.72) || 500;
    const scale = Math.min(maxW / CANVAS_SIZE, maxH / CANVAS_SIZE, 1);
    cv.style.width  = Math.round(CANVAS_SIZE * scale) + "px";
    cv.style.height = Math.round(CANVAS_SIZE * scale) + "px";
  }


  window._A3MCanvas = {
    get layers()          { return layers; },
    set layers(v)         { layers = v; },
    get selectedId()      { return selectedId; },
    set selectedId(v)     { selectedId = v; },
    get multiSelected()   { return multiSelected; },
    set multiSelected(v)  { multiSelected = v; },
    get activeTool()      { return activeTool; },
    set activeTool(v)     { activeTool = v; },
    get ctx()             { return ctx; },
    get canvas()          { return canvas; },
    get bgColorVal()      { return bgColorVal; },
    set bgColorVal(v)     { bgColorVal = v; },
    get canvasProdType()  { return canvasProdType; },
    set canvasProdType(v) { canvasProdType = v; },
    get history()         { return history; },
    get redoStack()       { return redoStack; },
    get aspectLocked()    { return aspectLocked; },
    snap, nid, saveHist, cloneState, restoreState,
    hitTestLayer, hitTestHandle, getCanvasXY,
    drawAll, drawLayer, drawGrid,
    _onPointerDown, _onPointerMove, _onPointerUp,
    injectRulerCanvas, drawRulers,
    CANVAS_PX_TO_CM, HANDLE_SIZE, GRID_SIZE, RULER_SIZE, CANVAS_SIZE,
    getPrintArea, isOutsidePrintArea, measureTextWidth, calcTextBounds,
    bindCanvasEvents,
  };

  // ✅ bindCanvasEvents — called by designer.js after openDesigner()
  function bindCanvasEvents() {
    const { canvas: cv, _onPointerDown, _onPointerMove, _onPointerUp } = window._A3MCanvas;
    if (!cv) return;
    if (cv._a3mEvBound) return;
    cv._a3mEvBound = true;
    cv.addEventListener("mousedown",  _onPointerDown);
    cv.addEventListener("mousemove",  _onPointerMove);
    cv.addEventListener("mouseup",    _onPointerUp);
    cv.addEventListener("mouseleave", _onPointerUp);
    cv.addEventListener("touchstart", e => { e.preventDefault(); _onPointerDown(e); }, { passive: false });
    cv.addEventListener("touchmove",  e => { e.preventDefault(); _onPointerMove(e); }, { passive: false });
    cv.addEventListener("touchend",   e => { e.preventDefault(); _onPointerUp(); },   { passive: false });
    // Double-click to edit text
    cv.addEventListener("dblclick", e => {
      const { x, y } = window._A3MCanvas.getCanvasXY(e);
      const layers_ = window._A3MCanvas.layers;
      for (let i = layers_.length - 1; i >= 0; i--) {
        if (layers_[i].type === "text" && layers_[i].visible && window._A3MCanvas.hitTestLayer(layers_[i], x, y)) {
          window._A3MCanvas.selectedId = layers_[i].id;
          const inp = document.getElementById("txtContent");
          if (inp) { inp.value = layers_[i].text; inp.focus(); inp.select(); }
          drawAll(); break;
        }
      }
    });
    // Right click context menu
    cv.addEventListener("contextmenu", _onPointerDown);
  }
  window.bindCanvasEvents = bindCanvasEvents;

  window.drawAll           = drawAll;
  window.undoAction        = undoAction;
  window.redoAction        = redoAction;
  window.saveHist          = saveHist;
  window.toggleGrid        = toggleGrid;
  window.toggleSnap        = toggleSnap;
  window.toggleRulers      = toggleRulers;
  window.toggleAspectLock  = toggleAspectLock;
  window.drawRulers        = drawRulers;
  window.initCanvasRefs    = initCanvasRefs;
  window.resetDesignerState= resetDesignerState;
  window.updateDesignPrice = updateDesignPrice;
  window.setBg             = setBg;
  window.showContextMenu   = showContextMenu;
  window.removeContextMenu = removeContextMenu;
  window.togglePrintArea   = togglePrintArea;
  window.getPrintArea        = getPrintArea;
  window.dsFitCanvas         = dsFitCanvas;
  window.calcTextBounds      = calcTextBounds;
  window.isOutsidePrintArea  = isOutsidePrintArea;

  // Add context menu on right-click
  document.addEventListener("DOMContentLoaded", () => {
    const cv = document.getElementById("designCanvas");
    if (cv) cv.addEventListener("contextmenu", _onPointerDown);
  });

})();
