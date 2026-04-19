// ============================================================
// designer/canvas.js  –  A3M Print  –  Canvas Engine
// الرسم، الطبقات، المؤشرات، الشبكة، المسطرة
// ============================================================

(function () {
  "use strict";

  // ════════════════════════════════════════════════════════════
  // CONSTANTS
  // ════════════════════════════════════════════════════════════

  const HANDLE_SIZE      = 9;
  const GRID_SIZE        = 25;
  const RULER_SIZE       = 22;
  const CANVAS_PX_TO_CM  = 0.026458;
  const BASE_PRICE       = 500;
  const PER_ELEMENT      = 200;
  const PROD_EMOJI       = { tshirt: "👕", mug: "☕", hat: "🧢", bag: "🎒", paper: "📄" };

  // ════════════════════════════════════════════════════════════
  // STATE
  // ════════════════════════════════════════════════════════════

  let layers         = [];
  let selectedId     = null;
  let activeTool     = "select";
  let isDragging     = false;
  let isResizing     = false;
  let resizeHandle   = "";
  let dragOffX = 0, dragOffY = 0;
  let resizeStartX = 0, resizeStartY = 0;
  let resizeStartW = 0, resizeStartH = 0;
  let resizeStartObjX = 0, resizeStartObjY = 0;
  let history = [], redoStack = [];
  let bgColorVal     = "#ffffff";
  let canvasProdType = "tshirt";
  let canvas = null, ctx = null;
  let listenersBound = false;

  // Grid & Snap
  let showGrid    = false;
  let snapToGrid  = false;

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
    canvas = el;
    ctx    = canvas.getContext("2d");
    listenersBound = false;
    canvas._a3mEvBound = false;
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
  // HISTORY (Undo/Redo)
  // ════════════════════════════════════════════════════════════

  function cloneState() {
    return JSON.parse(JSON.stringify({ layers, bgColorVal, selectedId, canvasProdType, activeTool }));
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
    layers         = s.layers         || [];
    bgColorVal     = s.bgColorVal     || "#ffffff";
    selectedId     = s.selectedId     || null;
    canvasProdType = s.canvasProdType || "tshirt";
    activeTool     = s.activeTool     || "select";
    syncCanvasProductSelect();
    drawAll();
  }

  function undoAction() {
    if (!history.length) return;
    redoStack.push(cloneState());
    restoreState(history.pop());
    showToast("↩ تراجع", "info");
    updateUndoRedoUI();
  }

  function redoAction() {
    if (!redoStack.length) return;
    history.push(cloneState());
    restoreState(redoStack.pop());
    showToast("↪ إعادة", "info");
    updateUndoRedoUI();
  }

  // ════════════════════════════════════════════════════════════
  // HIT TESTING
  // ════════════════════════════════════════════════════════════

  function getHandlePositions(l) {
    const hw = l.w / 2, hh = l.h / 2;
    return [
      { name: "nw", lx: -hw, ly: -hh }, { name: "n",  lx: 0,   ly: -hh },
      { name: "ne", lx:  hw, ly: -hh }, { name: "e",  lx:  hw, ly:  0  },
      { name: "se", lx:  hw, ly:  hh }, { name: "s",  lx:  0,  ly:  hh },
      { name: "sw", lx: -hw, ly:  hh }, { name: "w",  lx: -hw, ly:  0  },
    ];
  }

  function worldToLocal(l, wx, wy) {
    const dx = wx - l.x, dy = wy - l.y;
    const rad = -(l.rotation || 0) * Math.PI / 180;
    return {
      lx: dx * Math.cos(rad) - dy * Math.sin(rad),
      ly: dx * Math.sin(rad) + dy * Math.cos(rad),
    };
  }

  function hitTestLayer(l, wx, wy) {
    const loc = worldToLocal(l, wx, wy);
    return Math.abs(loc.lx) <= l.w / 2 + 6 && Math.abs(loc.ly) <= l.h / 2 + 6;
  }

  function hitTestHandle(l, wx, wy) {
    const loc = worldToLocal(l, wx, wy);
    for (const h of getHandlePositions(l)) {
      if (Math.abs(loc.lx - h.lx) <= HANDLE_SIZE + 2 && Math.abs(loc.ly - h.ly) <= HANDLE_SIZE + 2) return h.name;
    }
    if (Math.abs(loc.lx) <= 10 && Math.abs(loc.ly + l.h / 2 + 24) <= 10) return "rotate";
    return null;
  }

  function getCanvasXY(e) {
    if (!canvas) return { x: 0, y: 0 };
    const t = e.touches ? e.touches[0] : e;
    const r = canvas.getBoundingClientRect();
    return {
      x: (t.clientX - r.left) * (canvas.width / r.width),
      y: (t.clientY - r.top)  * (canvas.height / r.height),
    };
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
      const x = cx + Math.cos(angle) * rad;
      const y = cy + Math.sin(angle) * rad;
      i === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
    }
    c.closePath();
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
      if (l.shadowColor && l.shadowBlur) { ctx.shadowColor = l.shadowColor; ctx.shadowBlur = l.shadowBlur; }
      let weight = l.bold && l.italic ? "bold italic " : l.bold ? "bold " : l.italic ? "italic " : "";
      ctx.font = `${weight}${l.fontSize}px '${l.font}'`;
      ctx.fillStyle   = l.fillColor;
      ctx.textAlign   = l.textAlign || "center";
      ctx.textBaseline = "middle";
      if (l.letterSpacing && l.letterSpacing !== 0) {
        const chars  = l.text.split("");
        const totalW = chars.reduce((acc, c) => acc + ctx.measureText(c).width + l.letterSpacing, 0) - l.letterSpacing;
        let startX   = l.textAlign === "center" ? -totalW / 2 : l.textAlign === "right" ? -totalW : 0;
        for (const c of chars) { ctx.fillText(c, startX, 0); startX += ctx.measureText(c).width + l.letterSpacing; }
      } else {
        ctx.fillText(l.text, 0, 0);
      }
      if (l.underline) {
        ctx.shadowColor = "transparent"; ctx.shadowBlur = 0;
        const textW = ctx.measureText(l.text).width;
        const ulX = l.textAlign === "center" ? -textW / 2 : l.textAlign === "right" ? -textW : 0;
        ctx.fillStyle = l.fillColor;
        ctx.fillRect(ulX, l.fontSize * 0.6, textW, 1.5);
      }
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
      ctx.drawImage(l.img, -hw, -hh, l.w, l.h);
    }
    ctx.restore();

    // Selection overlay
    if (l.id === selectedId) {
      ctx.save();
      ctx.translate(l.x, l.y);
      if (l.rotation) ctx.rotate(l.rotation * Math.PI / 180);
      const hw2 = l.w / 2, hh2 = l.h / 2;
      ctx.shadowColor = "#7c3aed"; ctx.shadowBlur = 8;
      ctx.strokeStyle = "#7c3aed"; ctx.lineWidth = 1.8;
      ctx.setLineDash([5, 3]); ctx.strokeRect(-hw2 - 1, -hh2 - 1, l.w + 2, l.h + 2);
      ctx.setLineDash([]); ctx.shadowBlur = 0;
      getHandlePositions(l).forEach(h => {
        ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#7c3aed"; ctx.lineWidth = 1.5;
        const hs = HANDLE_SIZE;
        ctx.beginPath(); ctx.roundRect(h.lx - hs / 2, h.ly - hs / 2, hs, hs, 2); ctx.fill(); ctx.stroke();
      });
      ctx.strokeStyle = "#c9a84c"; ctx.lineWidth = 1.2; ctx.setLineDash([3, 2]);
      ctx.beginPath(); ctx.moveTo(0, -hh2 - 1); ctx.lineTo(0, -hh2 - 22); ctx.stroke();
      ctx.setLineDash([]); ctx.shadowColor = "#c9a84c"; ctx.shadowBlur = 6;
      ctx.fillStyle = "#c9a84c"; ctx.beginPath(); ctx.arc(0, -hh2 - 24, 6, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      if (l.locked) { ctx.fillStyle = "#ff6b6b"; ctx.font = "12px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("🔒", hw2 + 12, -hh2 - 12); }
      ctx.restore();
    }
  }

  function drawGrid() {
    if (!ctx || !showGrid) return;
    ctx.save();
    ctx.globalAlpha = 0.12; ctx.strokeStyle = "#7c3aed"; ctx.lineWidth = 0.5;
    for (let x = 0; x <= canvas.width; x += GRID_SIZE) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
    for (let y = 0; y <= canvas.height; y += GRID_SIZE) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
    ctx.globalAlpha = 0.25; ctx.strokeStyle = "#c9a84c";
    ctx.beginPath(); ctx.moveTo(canvas.width/2, 0); ctx.lineTo(canvas.width/2, canvas.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, canvas.height/2); ctx.lineTo(canvas.width, canvas.height/2); ctx.stroke();
    ctx.restore();
  }

  function drawAll() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (bgColorVal && bgColorVal !== "transparent") { ctx.fillStyle = bgColorVal; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    drawGrid();
    ctx.save(); ctx.globalAlpha = 0.04; ctx.font = "220px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#888";
    ctx.fillText(PROD_EMOJI[canvasProdType] || "👕", 250, 250); ctx.restore();
    ctx.save(); ctx.globalAlpha = 0.08; ctx.strokeStyle = "#7c3aed"; ctx.lineWidth = 1; ctx.setLineDash([6, 4]);
    ctx.strokeRect(80, 80, 340, 340); ctx.setLineDash([]); ctx.restore();
    layers.filter(l => l.visible).forEach(drawLayer);
    renderLayers(); updateTransformPanel(); updateCanvasModeBadge(); updateDesignPrice(); updateLayerCountBadge();
    if (showRulers) drawRulers();
  }

  // ════════════════════════════════════════════════════════════
  // GRID & SNAP TOGGLES
  // ════════════════════════════════════════════════════════════

  function toggleGrid() {
    showGrid = !showGrid;
    document.getElementById("dsGridBtn")?.classList.toggle("active-tool-btn", showGrid);
    drawAll();
  }

  function toggleSnap() {
    snapToGrid = !snapToGrid;
    document.getElementById("dsSnapBtn")?.classList.toggle("active-tool-btn", snapToGrid);
    showToast(snapToGrid ? "📐 الالتصاق تفعّل" : "📐 الالتصاق مُعطّل");
  }

  // ════════════════════════════════════════════════════════════
  // RULERS
  // ════════════════════════════════════════════════════════════

  function convertUnit(px) {
    if (rulerUnit === "cm") return (px * CANVAS_PX_TO_CM).toFixed(1);
    if (rulerUnit === "mm") return Math.round(px * CANVAS_PX_TO_CM * 10);
    return Math.round(px);
  }
  function getTickStep()  { return rulerUnit === "cm" ? Math.round(1 / CANVAS_PX_TO_CM) : rulerUnit === "mm" ? Math.round(0.1 / CANVAS_PX_TO_CM) : 25; }
  function getLabelStep() { return rulerUnit === "cm" ? Math.round(1 / CANVAS_PX_TO_CM) : rulerUnit === "mm" ? Math.round(1 / CANVAS_PX_TO_CM) : 50; }

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
    corner.onclick = () => { rulerUnit = rulerUnit === "px" ? "cm" : rulerUnit === "cm" ? "mm" : "px"; corner.textContent = rulerUnit; drawRulers(); };
    parent.insertBefore(corner, mainCanvas);
    mainCanvas.style.cssText = `position:absolute;top:${RULER_SIZE}px;left:${RULER_SIZE}px;width:calc(100% - ${RULER_SIZE}px);height:calc(100% - ${RULER_SIZE}px);`;
    mainCanvas.addEventListener("mousemove", (e) => {
      const r = mainCanvas.getBoundingClientRect();
      const sx = canvas ? (canvas.width / r.width) : 1;
      const sy = canvas ? (canvas.height / r.height) : 1;
      mouseRulerX = (e.clientX - r.left) * sx;
      mouseRulerY = (e.clientY - r.top)  * sy;
      if (showRulers) drawRulers();
    });
    mainCanvas.addEventListener("mouseleave", () => { mouseRulerX = -1; mouseRulerY = -1; if (showRulers) drawRulers(); });
  }

  function drawRulers() {
    if (!showRulers || !canvas) return;
    const rH = document.getElementById("a3mRulerH");
    const rV = document.getElementById("a3mRulerV");
    if (!rH || !rV) { injectRulerCanvas(); return; }
    const cw = canvas.width, ch = canvas.height;
    const rHRect = rH.getBoundingClientRect(), rVRect = rV.getBoundingClientRect();
    rH.width = rHRect.width || cw; rH.height = RULER_SIZE;
    rV.width = RULER_SIZE;         rV.height = rVRect.height || ch;
    const scaleX = rH.width / cw, scaleY = rV.height / ch;
    const ctxH = rH.getContext("2d"), ctxV = rV.getContext("2d");
    const drawRuler = (c, length, scale, isHoriz) => {
      const rLen = isHoriz ? rH.width : rV.height;
      c.clearRect(0, 0, isHoriz ? rLen : RULER_SIZE, isHoriz ? RULER_SIZE : rLen);
      c.fillStyle = "#12121f"; c.fillRect(0, 0, isHoriz ? rLen : RULER_SIZE, isHoriz ? RULER_SIZE : rLen);
      c.strokeStyle = "#252540"; c.lineWidth = 1;
      if (isHoriz) { c.beginPath(); c.moveTo(0, RULER_SIZE - 0.5); c.lineTo(rLen, RULER_SIZE - 0.5); c.stroke(); }
      else         { c.beginPath(); c.moveTo(RULER_SIZE - 0.5, 0); c.lineTo(RULER_SIZE - 0.5, rLen); c.stroke(); }
      const tickStep = getTickStep(), labelStep = getLabelStep();
      for (let px = 0; px <= length; px += tickStep) {
        const pos = px * scale, isLabel = px % labelStep === 0, isMid = px % (tickStep * 2) === 0;
        const tickH = isLabel ? RULER_SIZE * 0.75 : isMid ? RULER_SIZE * 0.5 : RULER_SIZE * 0.3;
        c.lineWidth = isLabel ? 1.2 : 0.7; c.strokeStyle = isLabel ? "#4a4a7a" : "#2a2a45";
        if (isHoriz) {
          c.beginPath(); c.moveTo(pos, RULER_SIZE); c.lineTo(pos, RULER_SIZE - tickH); c.stroke();
          if (isLabel && px > 0) { c.save(); c.fillStyle = "#888aaa"; c.font = "8px sans-serif"; c.textAlign = "center"; c.fillText(convertUnit(px), pos, RULER_SIZE * 0.38); c.restore(); }
        } else {
          c.beginPath(); c.moveTo(RULER_SIZE, pos); c.lineTo(RULER_SIZE - tickH, pos); c.stroke();
          if (isLabel && px > 0) { c.save(); c.translate(RULER_SIZE * 0.5, pos); c.rotate(-Math.PI / 2); c.fillStyle = "#888aaa"; c.font = "8px sans-serif"; c.textAlign = "center"; c.fillText(convertUnit(px), 0, 0); c.restore(); }
        }
      }
      const curPos = isHoriz ? mouseRulerX * scaleX : mouseRulerY * scaleY;
      if (curPos > 0) {
        c.strokeStyle = "#c9a84c"; c.lineWidth = 1; c.beginPath();
        if (isHoriz) { c.moveTo(curPos, 0); c.lineTo(curPos, RULER_SIZE); } else { c.moveTo(0, curPos); c.lineTo(RULER_SIZE, curPos); }
        c.stroke();
      }
      const sel = layers.find(l => l.id === selectedId);
      if (sel) {
        const startPx = isHoriz ? sel.x - sel.w / 2 : sel.y - sel.h / 2;
        const endPx   = isHoriz ? sel.x + sel.w / 2 : sel.y + sel.h / 2;
        c.fillStyle = "rgba(124,58,237,0.25)";
        if (isHoriz) c.fillRect(startPx * scale, 0, (endPx - startPx) * scale, RULER_SIZE);
        else         c.fillRect(0, startPx * scale, RULER_SIZE, (endPx - startPx) * scale);
      }
    };
    drawRuler(ctxH, cw, scaleX, true);
    drawRuler(ctxV, ch, scaleY, false);
  }

  function toggleRulers() {
    showRulers = !showRulers;
    const els = ["a3mRulerH","a3mRulerV","a3mRulerCorner"].map(id => document.getElementById(id));
    const mc  = document.getElementById("designCanvas");
    const btn = document.getElementById("dsRulerBtn");
    els.forEach(el => { if (el) el.style.display = showRulers ? "" : "none"; });
    if (mc) { mc.style.top = showRulers ? RULER_SIZE + "px" : "0"; mc.style.left = showRulers ? RULER_SIZE + "px" : "0"; mc.style.width = showRulers ? `calc(100% - ${RULER_SIZE}px)` : "100%"; mc.style.height = showRulers ? `calc(100% - ${RULER_SIZE}px)` : "100%"; }
    if (btn) btn.classList.toggle("active-tool-btn", showRulers);
    if (showRulers) drawRulers();
    showToast(showRulers ? "📏 المسطرة مفعّلة" : "📏 المسطرة مخفية");
  }

  // ════════════════════════════════════════════════════════════
  // PRICE CALCULATOR
  // ════════════════════════════════════════════════════════════

  function updateDesignPrice() {
    const el = document.getElementById("ds-price-val");
    if (!el) return;
    let total = BASE_PRICE;
    layers.forEach(l => { total += PER_ELEMENT + Math.min(Math.max(0, ((l.w||100)*(l.h||50) - 12000) / 12000) * 100, 500); });
    const val = Math.round(total) + " دج";
    if (el.textContent !== val) { el.textContent = val; el.style.transform = "scale(1.22)"; setTimeout(() => { el.style.transform = "scale(1)"; }, 200); }
    el.style.color = total > BASE_PRICE + 1000 ? "#7c3aed" : total > BASE_PRICE ? "#f59e0b" : "#c9a84c";
  }

  function updateLayerCountBadge() {
    ["dsLayerCount","dsLayerCountStatus"].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = layers.length; });
  }

  // ════════════════════════════════════════════════════════════
  // POINTER HANDLERS
  // ════════════════════════════════════════════════════════════

  function _onPointerDown(e) {
    if (!canvas) return;
    const { x, y } = getCanvasXY(e);
    if (activeTool === "select") {
      const sel = layers.find(l => l.id === selectedId);
      if (sel && !sel.locked) { const h = hitTestHandle(sel, x, y); if (h) { isResizing = true; resizeHandle = h; resizeStartX = x; resizeStartY = y; resizeStartW = sel.w; resizeStartH = sel.h; resizeStartObjX = sel.x; resizeStartObjY = sel.y; return; } }
      let hit = null;
      for (let i = layers.length - 1; i >= 0; i--) { if (layers[i].visible && hitTestLayer(layers[i], x, y)) { hit = layers[i]; break; } }
      if (hit) { if (hit.locked) { showToast("🔒 الطبقة مقفولة", "error"); selectedId = hit.id; drawAll(); return; } selectedId = hit.id; isDragging = true; dragOffX = x - hit.x; dragOffY = y - hit.y; }
      else { selectedId = null; }
      drawAll(); return;
    }
    saveHist();
    const fill    = document.getElementById("shapeFill")?.value    || "#7c3aed";
    const stroke  = document.getElementById("shapeStroke")?.value  || "#c9a84c";
    const op      = parseInt(document.getElementById("shapeOpacity")?.value) || 100;
    const sw      = parseInt(document.getElementById("strokeW")?.value) || 2;
    const cr      = parseInt(document.getElementById("cornerRadius")?.value) || 0;
    const text    = document.getElementById("txtContent")?.value    || "Text";
    const fs      = parseInt(document.getElementById("txtSize")?.value) || 40;
    const font    = document.getElementById("txtFont")?.value       || "Cairo";
    const txtFill = document.getElementById("txtColor")?.value      || "#000000";
    if      (activeTool === "text")     { addTextLayer(text, fs, font, txtFill, "center", x, y); setTool("select"); }
    else if (activeTool === "rect")     { addRect(x, y, 150, 80, fill, stroke, sw, op, { cornerRadius: cr }); setTool("select"); }
    else if (activeTool === "circle")   { addCircle(x, y, 60, fill, stroke, op); setTool("select"); }
    else if (activeTool === "triangle") { addTriangle(x, y, 120, 100, fill, stroke, op); setTool("select"); }
    else if (activeTool === "star")     { addStar(x, y, 65, fill, stroke, op); setTool("select"); }
    else if (activeTool === "line")     { addLine(x - 80, y, x + 80, y, fill, sw, op); setTool("select"); }
  }

  function _onPointerMove(e) {
    if (!canvas) return;
    const { x, y } = getCanvasXY(e);
    const sel = layers.find(l => l.id === selectedId);
    const coordEl = document.getElementById("dsCoords");
    if (coordEl) coordEl.textContent = `${Math.round(x)}, ${Math.round(y)}`;
    const tip = document.getElementById("ds-canvas-tip");
    if (isDragging && sel) {
      sel.x = snap(x - dragOffX); sel.y = snap(y - dragOffY); drawAll();
      if (tip) { tip.textContent = `X:${Math.round(sel.x)} Y:${Math.round(sel.y)}`; tip.style.display = "block"; tip.style.left = (x+14)+"px"; tip.style.top = (y-22)+"px"; }
    } else if (isResizing && sel) {
      const dx = x - resizeStartX, dy = y - resizeStartY;
      if (resizeHandle === "rotate") { sel.rotation = Math.round(Math.atan2(x - sel.x, -(y - sel.y)) * 180 / Math.PI); }
      else {
        if (resizeHandle.includes("e")) sel.w = Math.max(20, resizeStartW + dx);
        if (resizeHandle.includes("s")) sel.h = Math.max(10, resizeStartH + dy);
        if (resizeHandle.includes("w")) { sel.w = Math.max(20, resizeStartW - dx); sel.x = resizeStartObjX + dx / 2; }
        if (resizeHandle.includes("n")) { sel.h = Math.max(10, resizeStartH - dy); sel.y = resizeStartObjY + dy / 2; }
        if (sel.type === "circle") sel.h = sel.w;
      }
      drawAll();
      if (tip) { const wCm = (sel.w * CANVAS_PX_TO_CM).toFixed(1), hCm = (sel.h * CANVAS_PX_TO_CM).toFixed(1); tip.textContent = `${Math.round(sel.w)}×${Math.round(sel.h)}px  (${wCm}×${hCm}cm)`; tip.style.display = "block"; tip.style.left = (x+14)+"px"; tip.style.top = (y-22)+"px"; }
    }
    if (activeTool === "select") {
      const h = sel ? hitTestHandle(sel, x, y) : null;
      canvas.style.cursor = h === "rotate" ? "crosshair" : h ? "nwse-resize" : (sel && hitTestLayer(sel, x, y)) ? "move" : "default";
    }
  }

  function _onPointerUp() {
    if (isDragging || isResizing) saveHist();
    isDragging = false; isResizing = false; resizeHandle = "";
    const tip = document.getElementById("ds-canvas-tip");
    if (tip) tip.style.display = "none";
  }

  // ════════════════════════════════════════════════════════════
  // EXPOSE INTERNALS (used by tools.js and designer.js)
  // ════════════════════════════════════════════════════════════

  window._A3MCanvas = {
    get layers()         { return layers; },
    set layers(v)        { layers = v; },
    get selectedId()     { return selectedId; },
    set selectedId(v)    { selectedId = v; },
    get activeTool()     { return activeTool; },
    set activeTool(v)    { activeTool = v; },
    get ctx()            { return ctx; },
    get canvas()         { return canvas; },
    get bgColorVal()     { return bgColorVal; },
    set bgColorVal(v)    { bgColorVal = v; },
    get canvasProdType() { return canvasProdType; },
    set canvasProdType(v){ canvasProdType = v; },
    get history()        { return history; },
    get redoStack()      { return redoStack; },
    snap, nid, saveHist, cloneState, restoreState,
    hitTestLayer, hitTestHandle, getCanvasXY,
    drawAll, drawLayer, drawGrid,
    _onPointerDown, _onPointerMove, _onPointerUp,
    injectRulerCanvas, drawRulers,
    CANVAS_PX_TO_CM, HANDLE_SIZE, GRID_SIZE, RULER_SIZE,
  };

  // Also expose direct window APIs expected by HTML
  window.drawAll          = drawAll;
  window.undoAction       = undoAction;
  window.redoAction       = redoAction;
  window.saveHist         = saveHist;
  window.toggleGrid       = toggleGrid;
  window.toggleSnap       = toggleSnap;
  window.toggleRulers     = toggleRulers;
  window.drawRulers       = drawRulers;
  window.initCanvasRefs   = initCanvasRefs;
  window.resetDesignerState = resetDesignerState;
  window.updateDesignPrice  = updateDesignPrice;
  window.setBg              = setBg;

})();
