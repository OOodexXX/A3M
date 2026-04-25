// ============================================================
// scripts/designer/canvas.js  —  A3M Print  —  Canvas Core
// يعرّف window._A3MCanvas الذي تعتمد عليه tools.js و designer.js
// ============================================================

(function () {
  "use strict";

  // ════════════════════════════════════════════════════════════
  // CONSTANTS
  // ════════════════════════════════════════════════════════════

  var CANVAS_SIZE     = 1200;
  var CANVAS_PX_TO_CM = 0.026458;
  var HANDLE_SIZE     = 8;

  var PRINT_ZONES = {
    tshirt : { x:312, y:216, w:576, h:624 },
    hoodie : { x:360, y:240, w:480, h:528 },
    mug    : { x:120, y:288, w:960, h:624 },
    hat    : { x:240, y:336, w:720, h:384 },
    bag    : { x:192, y:192, w:816, h:816 },
    paper  : { x:48,  y:48,  w:1104,h:1104},
    phone  : { x:216, y:144, w:768, h:912 },
    note   : { x:144, y:144, w:912, h:912 },
  };

  // ════════════════════════════════════════════════════════════
  // STATE
  // ════════════════════════════════════════════════════════════

  var canvas         = null;
  var ctx            = null;
  var layers         = [];
  var selectedId     = null;
  var activeTool     = "select";
  var bgColorVal     = "#ffffff";
  var canvasProdType = "tshirt";
  var snapEnabled    = true;
  var gridEnabled    = false;
  var showPrintArea  = true;
  var aspectLocked   = false;

  var _undoStack = [];
  var _redoStack = [];
  var _idCounter = 1;
  var _rulerCanvas = null;
  var _evsBound    = false;

  // Interaction state
  var _isDragging   = false;
  var _isResizing   = false;
  var _isDrawing    = false;
  var _dragStart    = null;
  var _drawStart    = null;
  var _resizeHandle = null;
  var _origLayer    = null;

  // ════════════════════════════════════════════════════════════
  // HELPERS
  // ════════════════════════════════════════════════════════════

  function nid() {
    return "l" + (_idCounter++) + "_" + Math.random().toString(36).slice(2, 6);
  }

  function snap(v) {
    return snapEnabled ? Math.round(v / 5) * 5 : v;
  }

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function getCanvasPoint(e) {
    if (!canvas) return { x: 0, y: 0 };
    var rect   = canvas.getBoundingClientRect();
    var scaleX = canvas.width  / rect.width;
    var scaleY = canvas.height / rect.height;
    var src    = e.touches ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top)  * scaleY
    };
  }

  // ════════════════════════════════════════════════════════════
  // TOAST
  // ════════════════════════════════════════════════════════════

  function showToast(msg) {
    var t = document.getElementById("dsToast");
    if (!t) {
      t = document.createElement("div");
      t.id = "dsToast";
      t.style.cssText = "position:fixed;bottom:32px;left:50%;transform:translateX(-50%);" +
        "background:rgba(17,24,39,.96);color:#f9fafb;padding:.55rem 1.2rem;" +
        "border-radius:10px;font-size:13px;font-family:'Cairo',sans-serif;" +
        "z-index:99999;box-shadow:0 8px 30px rgba(0,0,0,.5);transition:opacity .25s;" +
        "pointer-events:none;border:1px solid rgba(124,58,237,.3)";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = "1";
    clearTimeout(t._tid);
    t._tid = setTimeout(function () { t.style.opacity = "0"; }, 2200);
  }

  // ════════════════════════════════════════════════════════════
  // UNDO / REDO
  // ════════════════════════════════════════════════════════════

  function _cloneLayers() {
    return layers.map(function (l) {
      var c = Object.assign({}, l);
      delete c.img;
      return JSON.parse(JSON.stringify(c));
    });
  }

  function saveHist() {
    _undoStack.push({ layers: _cloneLayers(), bg: bgColorVal, selId: selectedId });
    if (_undoStack.length > 60) _undoStack.shift();
    _redoStack = [];
    updateUndoRedoUI();
  }

  function undoAction() {
    if (!_undoStack.length) return;
    _redoStack.push({ layers: _cloneLayers(), bg: bgColorVal, selId: selectedId });
    var prev   = _undoStack.pop();
    layers     = prev.layers;
    bgColorVal = prev.bg;
    selectedId = prev.selId;
    drawAll();
    updateUndoRedoUI();
    showToast("↩ تراجع");
  }

  function redoAction() {
    if (!_redoStack.length) return;
    _undoStack.push({ layers: _cloneLayers(), bg: bgColorVal, selId: selectedId });
    var next   = _redoStack.pop();
    layers     = next.layers;
    bgColorVal = next.bg;
    selectedId = next.selId;
    drawAll();
    updateUndoRedoUI();
    showToast("↪ إعادة");
  }

  function updateUndoRedoUI() {
    var u = document.getElementById("dsUndoBtn");
    var r = document.getElementById("dsRedoBtn");
    if (u) u.disabled = _undoStack.length === 0;
    if (r) r.disabled = _redoStack.length === 0;
  }

  // ════════════════════════════════════════════════════════════
  // TEXT BOUNDS
  // ════════════════════════════════════════════════════════════

  function calcTextBounds(layer) {
    if (!ctx) return { w: (layer.fontSize || 40) * 6, h: (layer.fontSize || 40) * 1.5 };
    ctx.save();
    var style = (layer.bold && layer.italic) ? "bold italic " :
                 layer.bold   ? "bold " :
                 layer.italic ? "italic " : "";
    ctx.font = style + (layer.fontSize || 40) + "px '" + (layer.font || "Cairo") + "'";
    var ls   = layer.letterSpacing || 0;
    var tw   = 0;
    var text = String(layer.text || "");
    if (ls !== 0) {
      for (var i = 0; i < text.length; i++) tw += ctx.measureText(text[i]).width + ls;
    } else {
      tw = ctx.measureText(text).width;
    }
    ctx.restore();
    return { w: Math.max(tw + 24, 40), h: (layer.fontSize || 40) * 1.5 };
  }

  // ════════════════════════════════════════════════════════════
  // DRAW HELPERS
  // ════════════════════════════════════════════════════════════

  function buildFill(layer) {
    if (layer.gradient && layer.gradient.stops && layer.gradient.stops.length >= 2) {
      try {
        var hw = layer.w / 2, hh = layer.h / 2;
        var grd;
        if (layer.gradient.type === "radial") {
          grd = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(hw, hh));
        } else {
          grd = ctx.createLinearGradient(-hw, -hh, hw, hh);
        }
        layer.gradient.stops.forEach(function (s) { grd.addColorStop(s.pos, s.color); });
        return grd;
      } catch (e) {}
    }
    return layer.fillColor || "#7c3aed";
  }

  function drawLayer(layer) {
    if (!layer.visible) return;
    ctx.save();
    ctx.globalAlpha = clamp((layer.opacity != null ? layer.opacity : 100) / 100, 0, 1);
    ctx.translate(layer.x, layer.y);
    if (layer.rotation) ctx.rotate(layer.rotation * Math.PI / 180);
    if (layer.flippedH) ctx.scale(-1, 1);
    if (layer.flippedV) ctx.scale(1, -1);

    var hw = layer.w / 2, hh = layer.h / 2;

    if (layer.type === "image" && layer.img) {
      ctx.drawImage(layer.img, -hw, -hh, layer.w, layer.h);

    } else if (layer.type === "rect") {
      var r = layer.cornerRadius || 0;
      ctx.beginPath();
      if (r > 0) {
        ctx.moveTo(-hw + r, -hh);
        ctx.lineTo( hw - r, -hh); ctx.arcTo( hw, -hh,  hw, -hh + r, r);
        ctx.lineTo( hw,  hh - r); ctx.arcTo( hw,  hh,  hw - r,  hh, r);
        ctx.lineTo(-hw + r,  hh); ctx.arcTo(-hw,  hh, -hw,  hh - r, r);
        ctx.lineTo(-hw, -hh + r); ctx.arcTo(-hw, -hh, -hw + r, -hh, r);
        ctx.closePath();
      } else {
        ctx.rect(-hw, -hh, layer.w, layer.h);
      }
      ctx.fillStyle = buildFill(layer);
      ctx.fill();
      if (layer.strokeColor && layer.strokeWidth) {
        ctx.strokeStyle = layer.strokeColor;
        ctx.lineWidth   = layer.strokeWidth;
        ctx.stroke();
      }

    } else if (layer.type === "circle") {
      ctx.beginPath();
      ctx.ellipse(0, 0, Math.max(hw, 1), Math.max(hh, 1), 0, 0, Math.PI * 2);
      ctx.fillStyle = buildFill(layer);
      ctx.fill();
      if (layer.strokeColor && layer.strokeWidth) {
        ctx.strokeStyle = layer.strokeColor;
        ctx.lineWidth   = layer.strokeWidth;
        ctx.stroke();
      }

    } else if (layer.type === "triangle") {
      ctx.beginPath();
      ctx.moveTo(0, -hh);
      ctx.lineTo(hw, hh);
      ctx.lineTo(-hw, hh);
      ctx.closePath();
      ctx.fillStyle = buildFill(layer);
      ctx.fill();
      if (layer.strokeColor && layer.strokeWidth) {
        ctx.strokeStyle = layer.strokeColor;
        ctx.lineWidth   = layer.strokeWidth;
        ctx.stroke();
      }

    } else if (layer.type === "star") {
      var spikes = 5, outerR = hw, innerR = hw * 0.45;
      ctx.beginPath();
      for (var si = 0; si < spikes * 2; si++) {
        var ang = (si * Math.PI) / spikes - Math.PI / 2;
        var ri  = si % 2 === 0 ? outerR : innerR;
        if (si === 0) ctx.moveTo(Math.cos(ang) * ri, Math.sin(ang) * ri);
        else          ctx.lineTo(Math.cos(ang) * ri, Math.sin(ang) * ri);
      }
      ctx.closePath();
      ctx.fillStyle = buildFill(layer);
      ctx.fill();
      if (layer.strokeColor && layer.strokeWidth) {
        ctx.strokeStyle = layer.strokeColor;
        ctx.lineWidth   = layer.strokeWidth;
        ctx.stroke();
      }

    } else if (layer.type === "line") {
      ctx.beginPath();
      ctx.moveTo(-hw, 0);
      ctx.lineTo( hw, 0);
      ctx.strokeStyle = layer.strokeColor || layer.fillColor || "#ffffff";
      ctx.lineWidth   = layer.strokeWidth || 3;
      ctx.stroke();

    } else if (layer.type === "text") {
      var bold = (layer.bold && layer.italic) ? "bold italic " :
                  layer.bold   ? "bold " :
                  layer.italic ? "italic " : "";
      ctx.font         = bold + (layer.fontSize || 40) + "px '" + (layer.font || "Cairo") + "'";
      ctx.textAlign    = layer.textAlign   || "center";
      ctx.textBaseline = "middle";

      if (layer.shadowColor && (layer.shadowBlur || layer.shadowOffsetX || layer.shadowOffsetY)) {
        ctx.shadowColor   = layer.shadowColor;
        ctx.shadowBlur    = layer.shadowBlur    || 0;
        ctx.shadowOffsetX = layer.shadowOffsetX || 0;
        ctx.shadowOffsetY = layer.shadowOffsetY || 0;
      }

      var txt = String(layer.text || "");
      var ls2 = layer.letterSpacing || 0;

      if (layer.textStroke && layer.textStrokeWidth > 0) {
        ctx.strokeStyle = layer.textStroke;
        ctx.lineWidth   = layer.textStrokeWidth * 2;
        ctx.lineJoin    = "round";
        if (ls2) {
          var tw2 = 0, sx2 = 0;
          for (var ci = 0; ci < txt.length; ci++) tw2 += ctx.measureText(txt[ci]).width + ls2;
          sx2 = layer.textAlign === "center" ? -tw2/2 : layer.textAlign === "right" ? -tw2 : 0;
          var cx2 = 0;
          for (var ci2 = 0; ci2 < txt.length; ci2++) {
            ctx.strokeText(txt[ci2], sx2 + cx2, 0);
            cx2 += ctx.measureText(txt[ci2]).width + ls2;
          }
        } else {
          ctx.strokeText(txt, 0, 0);
        }
      }

      ctx.shadowColor = ctx.shadowBlur = ctx.shadowOffsetX = ctx.shadowOffsetY = 0;
      ctx.fillStyle = layer.fillColor || "#ffffff";

      if (ls2) {
        var tw3 = 0, sx3 = 0;
        for (var ci3 = 0; ci3 < txt.length; ci3++) tw3 += ctx.measureText(txt[ci3]).width + ls2;
        sx3 = layer.textAlign === "center" ? -tw3/2 : layer.textAlign === "right" ? -tw3 : 0;
        var cx3 = 0;
        for (var ci4 = 0; ci4 < txt.length; ci4++) {
          ctx.fillText(txt[ci4], sx3 + cx3, 0);
          cx3 += ctx.measureText(txt[ci4]).width + ls2;
        }
      } else {
        ctx.fillText(txt, 0, 0);
      }

      if (layer.underline) {
        var ub = calcTextBounds(layer);
        var ux = layer.textAlign === "center" ? -ub.w/2 : layer.textAlign === "right" ? -ub.w : 0;
        ctx.beginPath();
        ctx.moveTo(ux, (layer.fontSize || 40) * 0.6);
        ctx.lineTo(ux + ub.w, (layer.fontSize || 40) * 0.6);
        ctx.strokeStyle = layer.fillColor || "#ffffff";
        ctx.lineWidth   = Math.max(1, (layer.fontSize || 40) * 0.06);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // ════════════════════════════════════════════════════════════
  // SELECTION HANDLES
  // ════════════════════════════════════════════════════════════

  function drawHandles(layer) {
    if (!layer) return;
    var hw = layer.w / 2, hh = layer.h / 2;
    ctx.save();
    ctx.translate(layer.x, layer.y);
    if (layer.rotation) ctx.rotate(layer.rotation * Math.PI / 180);

    ctx.strokeStyle = layer.locked ? "#f59e0b" : "#7c3aed";
    ctx.lineWidth   = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(-hw - 4, -hh - 4, layer.w + 8, layer.h + 8);
    ctx.setLineDash([]);

    if (!layer.locked) {
      var pts = [
        [-hw-4,-hh-4],[0,-hh-4],[hw+4,-hh-4],
        [ hw+4, 0],
        [ hw+4, hh+4],[0, hh+4],[-hw-4, hh+4],
        [-hw-4, 0]
      ];
      pts.forEach(function (p) {
        ctx.fillStyle   = "#ffffff";
        ctx.strokeStyle = "#7c3aed";
        ctx.lineWidth   = 1.5;
        ctx.beginPath();
        ctx.rect(p[0] - HANDLE_SIZE/2, p[1] - HANDLE_SIZE/2, HANDLE_SIZE, HANDLE_SIZE);
        ctx.fill();
        ctx.stroke();
      });
      ctx.strokeStyle = "#7c3aed";
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -hh - 4);
      ctx.lineTo(0, -hh - 18);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, -hh - 22, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#7c3aed";
      ctx.fill();
    }
    ctx.restore();
  }

  // ════════════════════════════════════════════════════════════
  // HIT TEST
  // ════════════════════════════════════════════════════════════

  function getHandleAt(layer, px, py) {
    if (!layer || layer.locked) return null;
    var hw  = layer.w / 2, hh = layer.h / 2;
    var ang = (layer.rotation || 0) * Math.PI / 180;
    var cos = Math.cos(-ang), sin = Math.sin(-ang);
    var dx  = px - layer.x, dy = py - layer.y;
    var lx  = cos*dx - sin*dy, ly = sin*dx + cos*dy;
    var hs  = HANDLE_SIZE / 2 + 4;

    var pts = [
      {lx:-hw-4,ly:-hh-4,h:"tl"},{lx:0,   ly:-hh-4,h:"tm"},{lx:hw+4,ly:-hh-4,h:"tr"},
      {lx: hw+4,ly:0,    h:"mr"},
      {lx: hw+4,ly: hh+4,h:"br"},{lx:0,   ly: hh+4,h:"bm"},{lx:-hw-4,ly:hh+4, h:"bl"},
      {lx:-hw-4,ly:0,    h:"ml"}
    ];
    for (var i = 0; i < pts.length; i++) {
      if (Math.abs(lx - pts[i].lx) < hs && Math.abs(ly - pts[i].ly) < hs) return pts[i].h;
    }
    if (Math.abs(lx) < 8 && Math.abs(ly - (-hh - 22)) < 9) return "rot";
    return null;
  }

  function layerAt(px, py) {
    for (var i = layers.length - 1; i >= 0; i--) {
      var l = layers[i];
      if (!l.visible || l.hidden) continue;
      var ang = (l.rotation || 0) * Math.PI / 180;
      var cos = Math.cos(-ang), sin = Math.sin(-ang);
      var dx  = px - l.x, dy = py - l.y;
      var lx  = cos*dx - sin*dy, ly = sin*dx + cos*dy;
      if (lx >= -l.w/2-6 && lx <= l.w/2+6 && ly >= -l.h/2-6 && ly <= l.h/2+6) return l;
    }
    return null;
  }

  // ════════════════════════════════════════════════════════════
  // GRID + PRINT AREA + BACKGROUND
  // ════════════════════════════════════════════════════════════

  function drawGrid() {
    if (!gridEnabled) return;
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    ctx.lineWidth   = 1;
    for (var x = 20; x < canvas.width;  x += 20) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); ctx.stroke(); }
    for (var y = 20; y < canvas.height; y += 20) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y);  ctx.stroke(); }
    ctx.restore();
  }

  function drawPrintArea() {
    if (!showPrintArea) return;
    var z = PRINT_ZONES[canvasProdType] || PRINT_ZONES.tshirt;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(0, 0, canvas.width, z.y);
    ctx.fillRect(0, z.y + z.h, canvas.width, canvas.height - z.y - z.h);
    ctx.fillRect(0, z.y, z.x, z.h);
    ctx.fillRect(z.x + z.w, z.y, canvas.width - z.x - z.w, z.h);
    ctx.strokeStyle = "rgba(124,58,237,0.5)";
    ctx.lineWidth   = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(z.x, z.y, z.w, z.h);
    ctx.setLineDash([]);
    ctx.restore();
    var oobEl = document.getElementById("dsOobWarning");
    if (oobEl) {
      var hasOob = layers.some(function (l) {
        if (!l.visible) return false;
        return l.x-l.w/2 < z.x || l.y-l.h/2 < z.y || l.x+l.w/2 > z.x+z.w || l.y+l.h/2 > z.y+z.h;
      });
      oobEl.style.display = hasOob ? "" : "none";
    }
  }

  function drawProductBg() {
    ctx.save();
    if (bgColorVal === "transparent") {
      var sz = 16;
      for (var x = 0; x < canvas.width; x += sz) {
        for (var y = 0; y < canvas.height; y += sz) {
          ctx.fillStyle = ((x/sz + y/sz) % 2 === 0) ? "#cccccc" : "#ffffff";
          ctx.fillRect(x, y, sz, sz);
        }
      }
    } else {
      ctx.fillStyle = bgColorVal || "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.restore();
  }

  // ════════════════════════════════════════════════════════════
  // MAIN DRAW
  // ════════════════════════════════════════════════════════════

  function drawAll() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    drawProductBg();
    drawGrid();
    drawPrintArea();
    layers.forEach(function (l) { drawLayer(l); });
    var sel = null;
    for (var i = 0; i < layers.length; i++) { if (layers[i].id === selectedId) { sel = layers[i]; break; } }
    if (sel) drawHandles(sel);

    ["dsLayerCount","dsLayerCount2","dsLayerCountStatus"].forEach(function (id) {
      var el = document.getElementById(id); if (el) el.textContent = layers.length;
    });

    if (typeof updateLayersList      === "function") updateLayersList();
    if (typeof updateTransformPanel  === "function") updateTransformPanel();
    if (typeof syncCanvasProductSelect === "function") syncCanvasProductSelect();
    if (typeof updateCanvasModeBadge   === "function") updateCanvasModeBadge();
    if (typeof notifyChange            === "function") notifyChange();
  }

  // ════════════════════════════════════════════════════════════
  // MISC
  // ════════════════════════════════════════════════════════════

  function setBg(color) {
    saveHist();
    bgColorVal = color;
    var bgEl = document.getElementById("bgColor");
    if (bgEl && color !== "transparent") bgEl.value = color;
    drawAll();
  }

  function toggleGrid()      { gridEnabled   = !gridEnabled;   var b=document.getElementById("dsGridBtn"); if(b) b.classList.toggle("active",gridEnabled); drawAll(); }
  function toggleSnap()      { snapEnabled   = !snapEnabled;   var b=document.getElementById("dsSnapBtn"); if(b) b.classList.toggle("active",snapEnabled); showToast(snapEnabled?"⊞ Snap ON":"⊞ Snap OFF"); }
  function togglePrintArea() { showPrintArea = !showPrintArea; drawAll(); }
  function toggleAspectLock(){ aspectLocked  = !aspectLocked;  var b=document.getElementById("dsAspectBtn"); if(b) b.classList.toggle("active",aspectLocked); showToast(aspectLocked?"⇔ نسبة مقفولة":"⇔ نسبة حرة"); }

  function notifyChange() { /* hook for canvas-patches.js */ }

  // ════════════════════════════════════════════════════════════
  // CANVAS EVENTS
  // ════════════════════════════════════════════════════════════

  function bindCanvasEvents() {
    if (!canvas || _evsBound) return;
    _evsBound = true;
    canvas.addEventListener("mousedown",  onMouseDown);
    canvas.addEventListener("mousemove",  onMouseMove);
    document.addEventListener("mouseup",  onMouseUp);
    canvas.addEventListener("touchstart", function (e) { e.preventDefault(); onMouseDown({ button:0, clientX:e.touches[0].clientX, clientY:e.touches[0].clientY }); }, { passive:false });
    canvas.addEventListener("touchmove",  function (e) { e.preventDefault(); onMouseMove({ clientX:e.touches[0].clientX, clientY:e.touches[0].clientY }); }, { passive:false });
    canvas.addEventListener("touchend",   function (e) { onMouseUp({ clientX:(e.changedTouches[0]||{}).clientX||0, clientY:(e.changedTouches[0]||{}).clientY||0 }); });
    canvas.addEventListener("dblclick",   onDblClick);
    canvas.addEventListener("mousemove",  function (e) {
      var p = getCanvasPoint(e);
      var el = document.getElementById("dsCoords");
      if (el) el.textContent = Math.round(p.x) + ", " + Math.round(p.y);
    });
  }

  function onMouseDown(e) {
    if (e.button !== 0) return;
    var pt = getCanvasPoint(e);
    if (activeTool === "select") {
      var sel = null;
      for (var i = 0; i < layers.length; i++) { if (layers[i].id === selectedId) { sel = layers[i]; break; } }
      if (sel) {
        var h = getHandleAt(sel, pt.x, pt.y);
        if (h) { _isResizing=true; _resizeHandle=h; _origLayer=Object.assign({},sel); _dragStart=pt; return; }
      }
      var hit = layerAt(pt.x, pt.y);
      if (hit) {
        if (hit.locked) { showToast("🔒 هذه الطبقة مقفولة"); return; }
        selectedId=hit.id; _isDragging=true; _dragStart={x:pt.x-hit.x,y:pt.y-hit.y};
        drawAll();
        if (typeof updateTransformPanel==="function") updateTransformPanel();
      } else { selectedId=null; drawAll(); }
    } else { saveHist(); _isDrawing=true; _drawStart=pt; }
  }

  function onMouseMove(e) {
    var pt = getCanvasPoint(e);
    if (_isDragging && selectedId) {
      var l = null;
      for (var i=0;i<layers.length;i++){if(layers[i].id===selectedId){l=layers[i];break;}}
      if (l && !l.locked) { l.x=snap(pt.x-_dragStart.x); l.y=snap(pt.y-_dragStart.y); drawAll(); }
    } else if (_isResizing && selectedId && _origLayer) {
      var l2=null;
      for (var j=0;j<layers.length;j++){if(layers[j].id===selectedId){l2=layers[j];break;}}
      if (!l2) return;
      var dx=pt.x-_dragStart.x, dy=pt.y-_dragStart.y, hh=_resizeHandle;
      var nx=_origLayer.x, ny=_origLayer.y, nw=_origLayer.w, nh=_origLayer.h;
      if (hh==="rot"){l2.rotation=Math.round(Math.atan2(pt.x-l2.x,-(pt.y-l2.y))*180/Math.PI);drawAll();return;}
      if (hh.indexOf("r")!==-1) nw=Math.max(10,_origLayer.w+dx);
      if (hh.indexOf("l")!==-1){nw=Math.max(10,_origLayer.w-dx);nx=_origLayer.x+(_origLayer.w-nw)/2;}
      if (hh.indexOf("b")!==-1) nh=Math.max(5,_origLayer.h+dy);
      if (hh.indexOf("t")!==-1){nh=Math.max(5,_origLayer.h-dy);ny=_origLayer.y+(_origLayer.h-nh)/2;}
      if (hh==="tm"||hh==="bm") nw=_origLayer.w;
      if (hh==="ml"||hh==="mr") nh=_origLayer.h;
      if (e.shiftKey||aspectLocked){var ratio=_origLayer.w/_origLayer.h;if(Math.abs(dx)>Math.abs(dy))nh=nw/ratio;else nw=nh*ratio;}
      if (l2.type==="circle") nh=nw;
      l2.x=snap(nx);l2.y=snap(ny);l2.w=snap(nw);l2.h=snap(nh);
      drawAll();
    } else {
      if (!canvas) return;
      var sel2=null;
      for (var k=0;k<layers.length;k++){if(layers[k].id===selectedId){sel2=layers[k];break;}}
      if (sel2){
        var h2=getHandleAt(sel2,pt.x,pt.y);
        var cmap={tl:"nw-resize",tr:"ne-resize",bl:"sw-resize",br:"se-resize",tm:"n-resize",bm:"s-resize",ml:"w-resize",mr:"e-resize",rot:"crosshair"};
        canvas.style.cursor=h2?(cmap[h2]||"crosshair"):(layerAt(pt.x,pt.y)?"move":"default");
      } else { canvas.style.cursor=activeTool==="select"?"default":"crosshair"; }
    }
  }

  function onMouseUp(e) {
    if (_isDragging||_isResizing){if(typeof updateTransformPanel==="function")updateTransformPanel();notifyChange();}
    if (_isDrawing && _drawStart) {
      var pt=getCanvasPoint(e);
      var cx=(_drawStart.x+pt.x)/2, cy=(_drawStart.y+pt.y)/2;
      var w=Math.max(20,Math.abs(pt.x-_drawStart.x)), h=Math.max(20,Math.abs(pt.y-_drawStart.y));
      var fill  =(document.getElementById("shapeFill")  ||{}).value||"#7c3aed";
      var stroke=(document.getElementById("shapeStroke")||{}).value||"#c9a84c";
      var sw2   =parseInt((document.getElementById("strokeW")     ||{}).value)||2;
      var op    =parseInt((document.getElementById("shapeOpacity")||{}).value)||100;
      var cr2   =parseInt((document.getElementById("cornerRadius")||{}).value)||0;
      if      (activeTool==="rect"     && typeof addRect     ==="function") addRect(cx,cy,w,h,fill,stroke,sw2,op,{cornerRadius:cr2});
      else if (activeTool==="circle"   && typeof addCircle   ==="function") addCircle(cx,cy,Math.min(w,h)/2,fill,stroke,op);
      else if (activeTool==="triangle" && typeof addTriangle ==="function") addTriangle(cx,cy,w,h,fill,stroke,op);
      else if (activeTool==="star"     && typeof addStar     ==="function") addStar(cx,cy,Math.min(w,h)/2,fill,stroke,op);
      else if (activeTool==="line"     && typeof addLine     ==="function") addLine(_drawStart.x,_drawStart.y,pt.x,pt.y,fill,sw2,op);
      else if (activeTool==="text"     && typeof addText     ==="function") addText();
    }
    _isDragging=false; _isResizing=false; _isDrawing=false;
    _dragStart=null; _origLayer=null; _resizeHandle=null; _drawStart=null;
  }

  function onDblClick(e) {
    var pt=getCanvasPoint(e), hit=layerAt(pt.x,pt.y);
    if (hit && hit.type==="text") {
      var nt=prompt("تعديل النص:",hit.text);
      if (nt!==null){saveHist();hit.text=nt;drawAll();}
    }
  }

  // ════════════════════════════════════════════════════════════
  // INIT
  // ════════════════════════════════════════════════════════════

  function initCanvasRefs() {
    canvas = document.getElementById("designCanvas");
    if (!canvas) return false;
    // High-DPI / Retina support
    var dpr = window.devicePixelRatio || 1;
    canvas.width  = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    // CSS size: fill container, JS size: high-res
    canvas.style.width  = "100%";
    canvas.style.height = "100%";
    ctx = canvas.getContext("2d");
    // Enable image smoothing for crisp text
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    // Force crisp font rendering
    ctx.textRenderingOptimize = "optimizeLegibility";
    window._A3MCanvas.canvas = canvas;
    window._A3MCanvas.ctx    = ctx;
    return true;
  }

  function injectRulerCanvas() {
    var wrap=document.getElementById("dsCanvasWrap");
    if (!wrap||document.getElementById("dsRulerCanvas")) return;
    var rc=document.createElement("canvas");
    rc.id="dsRulerCanvas";
    rc.style.cssText="position:absolute;top:0;left:0;pointer-events:none;z-index:10;opacity:.35";
    wrap.appendChild(rc);
    _rulerCanvas=rc;
  }

  function drawRulers() {
    if (!_rulerCanvas||!canvas) return;
    _rulerCanvas.width =canvas.offsetWidth||500;
    _rulerCanvas.height=canvas.offsetHeight||500;
    var rc=_rulerCanvas.getContext("2d"); if(!rc) return;
    rc.clearRect(0,0,_rulerCanvas.width,_rulerCanvas.height);
    rc.fillStyle="rgba(30,32,50,0.85)";
    rc.fillRect(0,0,_rulerCanvas.width,18);
    rc.fillRect(0,0,18,_rulerCanvas.height);
    rc.fillStyle="#6b7280"; rc.font="9px monospace"; rc.textBaseline="middle";
    for (var x=18;x<_rulerCanvas.width;x+=50){rc.fillRect(x,14,1,4);rc.fillText(Math.round(x*(canvas.width/_rulerCanvas.width)),x+2,9);}
    for (var y=18;y<_rulerCanvas.height;y+=50){rc.fillRect(14,y,4,1);rc.save();rc.translate(9,y);rc.rotate(-Math.PI/2);rc.fillText(Math.round(y*(canvas.height/_rulerCanvas.height)),0,0);rc.restore();}
  }

  function resetDesignerState() {
    layers=[]; selectedId=null; bgColorVal="#ffffff"; _undoStack=[]; _redoStack=[]; _evsBound=false; activeTool="select";
    var bgEl=document.getElementById("bgColor"); if(bgEl) bgEl.value="#ffffff";
  }

  // ════════════════════════════════════════════════════════════
  // EXPORT window._A3MCanvas
  // ════════════════════════════════════════════════════════════

  var _obj = {
    get canvas()          { return canvas; },         set canvas(v)          { canvas = v; },
    get ctx()             { return ctx; },            set ctx(v)             { ctx = v; },
    get layers()          { return layers; },         set layers(v)          { layers = v; },
    get selectedId()      { return selectedId; },     set selectedId(v)      { selectedId = v; },
    get activeTool()      { return activeTool; },     set activeTool(v)      { activeTool = v; },
    get currentTool()     { return activeTool; },     set currentTool(v)     { activeTool = v; },
    get bgColorVal()      { return bgColorVal; },     set bgColorVal(v)      { bgColorVal = v; },
    get canvasProdType()  { return canvasProdType; }, set canvasProdType(v)  { canvasProdType = v; },
    get snapEnabled()     { return snapEnabled; },    set snapEnabled(v)     { snapEnabled = v; },
    get gridEnabled()     { return gridEnabled; },    set gridEnabled(v)     { gridEnabled = v; },
    get multiSelectedIds(){ return window._a3mMultiSel || []; }, set multiSelectedIds(v){ window._a3mMultiSel=v; },

    CANVAS_SIZE, CANVAS_PX_TO_CM,

    nid, snap, drawAll, saveHist, undoAction, redoAction, updateUndoRedoUI,
    calcTextBounds, initCanvasRefs, bindCanvasEvents, resetDesignerState,
    injectRulerCanvas, drawRulers, setBg,
    toggleGrid, toggleSnap, togglePrintArea, toggleAspectLock,
    notifyChange, showToast, layerAt,
  };

  window._A3MCanvas = _obj;

  // Global shortcuts used by HTML onclick attributes
  window.drawAll          = drawAll;
  window.saveHist         = saveHist;
  window.undoAction       = undoAction;
  window.redoAction       = redoAction;
  window.initCanvasRefs   = initCanvasRefs;
  window.bindCanvasEvents = bindCanvasEvents;
  window.setBg            = setBg;
  window.toggleGrid       = toggleGrid;
  window.toggleSnap       = toggleSnap;
  window.togglePrintArea  = togglePrintArea;
  window.toggleAspectLock = toggleAspectLock;
  window.updateUndoRedoUI = updateUndoRedoUI;
  window.notifyChange     = notifyChange;
  window.showToast        = showToast;
  window.clearCanvas      = function () {
    saveHist(); layers=[]; selectedId=null; bgColorVal="#ffffff";
    var bgEl=document.getElementById("bgColor"); if(bgEl) bgEl.value="#ffffff";
    drawAll();
  };

  console.log("%c✅ A3M canvas.js loaded — _A3MCanvas ready", "color:#c9a84c;font-weight:700;font-size:12px");
})();
