// ============================================================
// designer/image-editor.js  –  A3M Print
// ✅ Image editing: Crop, Brightness, Contrast, Remove BG
// Include AFTER canvas.js and tools.js
// ============================================================

(function () {
  "use strict";

  const C = () => window._A3MCanvas;

  // ════════════════════════════════════════════════════════════
  // STATE
  // ════════════════════════════════════════════════════════════

  let _editLayer   = null;  // layer being edited
  let _cropActive  = false;
  let _cropStart   = null;
  let _cropRect    = null;  // { x, y, w, h } in canvas coords
  let _cropCanvas  = null;
  let _cropCtx     = null;
  let _origImgData = null;  // backup of original image

  // ════════════════════════════════════════════════════════════
  // OPEN IMAGE EDITOR MODAL
  // ════════════════════════════════════════════════════════════

  function openImageEditor() {
    const { layers, selectedId } = C();
    const l = layers.find(x => x.id === selectedId);
    if (!l || l.type !== "image") {
      showToast?.("⚠️ اختر صورة أولاً", "error");
      return;
    }
    _editLayer = l;
    _ensureModal();
    _renderEditorPreview();
    document.getElementById("imgEditorModal").style.display = "flex";
  }

  function closeImageEditor() {
    document.getElementById("imgEditorModal").style.display = "none";
    _cropActive = false;
    _editLayer  = null;
  }

  // ════════════════════════════════════════════════════════════
  // MODAL HTML
  // ════════════════════════════════════════════════════════════

  function _ensureModal() {
    if (document.getElementById("imgEditorModal")) return;

    const modal = document.createElement("div");
    modal.id = "imgEditorModal";
    modal.style.cssText = `
      display:none; position:fixed; inset:0; z-index:10000;
      background:rgba(0,0,0,.88); backdrop-filter:blur(10px);
      align-items:center; justify-content:center; padding:1rem;
      font-family:'Cairo',sans-serif;
    `;
    modal.innerHTML = `
      <div style="
        width:min(96vw,900px); background:#0d1225;
        border:1px solid rgba(124,58,237,.3); border-radius:18px;
        overflow:hidden; box-shadow:0 32px 80px rgba(0,0,0,.8);
        display:flex; flex-direction:column; max-height:92vh;
      ">
        <!-- Header -->
        <div style="
          display:flex; align-items:center; justify-content:space-between;
          padding:.8rem 1.2rem; border-bottom:1px solid rgba(255,255,255,.08);
          background:linear-gradient(90deg,#080d1a,#0d1325);
        ">
          <div style="font-weight:800;font-size:15px;color:#f1f5f9">✂️ تعديل الصورة</div>
          <button onclick="closeImageEditor()" style="
            background:none;border:none;color:#4b5563;font-size:20px;
            cursor:pointer;transition:.15s;padding:2px 6px;border-radius:6px;
          " onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#4b5563'">✕</button>
        </div>

        <!-- Body -->
        <div style="display:flex;flex:1;overflow:hidden;min-height:0">

          <!-- Canvas area -->
          <div style="flex:1;position:relative;overflow:hidden;background:#070b17;display:flex;align-items:center;justify-content:center;min-width:0">
            <canvas id="imgEditCanvas" style="
              max-width:100%;max-height:100%;
              border-radius:6px;cursor:crosshair;
              image-rendering:high-quality;
            "></canvas>
            <div id="imgEditorCropOverlay" style="
              display:none;position:absolute;inset:0;pointer-events:none;
            "></div>
          </div>

          <!-- Controls -->
          <div style="
            width:220px;background:#090e1d;border-left:1px solid rgba(255,255,255,.06);
            overflow-y:auto;flex-shrink:0;padding:.8rem;display:flex;flex-direction:column;gap:.6rem;
          ">

            <!-- Crop section -->
            <div class="ie-section">
              <div class="ie-title">✂️ اقتصاص</div>
              <button id="ieCropBtn" class="ie-btn ie-btn-primary" onclick="startCrop()">
                بدء الاقتصاص
              </button>
              <button id="ieCropApply" class="ie-btn" onclick="applyCrop()" style="display:none">
                ✅ تطبيق الاقتصاص
              </button>
              <button id="ieCropCancel" class="ie-btn" onclick="cancelCrop()" style="display:none">
                ✕ إلغاء
              </button>
              <div style="display:flex;flex-direction:column;gap:.3rem;margin-top:.3rem">
                <button class="ie-btn-sm" onclick="cropToRatio(1,1)">1:1 مربع</button>
                <button class="ie-btn-sm" onclick="cropToRatio(4,3)">4:3</button>
                <button class="ie-btn-sm" onclick="cropToRatio(16,9)">16:9</button>
                <button class="ie-btn-sm" onclick="cropToRatio(3,4)">3:4 بورتريه</button>
              </div>
            </div>

            <!-- Adjustments -->
            <div class="ie-section">
              <div class="ie-title">🎨 تعديلات</div>

              <div class="ie-row">
                <span class="ie-label">سطوع</span>
                <input type="range" id="ieBrightness" min="-100" max="100" value="0"
                  oninput="document.getElementById('ieBrightVal').textContent=this.value;previewAdjustments()"
                  class="ie-range"/>
                <span class="ie-val" id="ieBrightVal">0</span>
              </div>

              <div class="ie-row">
                <span class="ie-label">تباين</span>
                <input type="range" id="ieContrast" min="-100" max="100" value="0"
                  oninput="document.getElementById('ieContrastVal').textContent=this.value;previewAdjustments()"
                  class="ie-range"/>
                <span class="ie-val" id="ieContrastVal">0</span>
              </div>

              <div class="ie-row">
                <span class="ie-label">تشبع</span>
                <input type="range" id="ieSaturation" min="-100" max="100" value="0"
                  oninput="document.getElementById('ieSatVal').textContent=this.value;previewAdjustments()"
                  class="ie-range"/>
                <span class="ie-val" id="ieSatVal">0</span>
              </div>

              <div class="ie-row">
                <span class="ie-label">حدة</span>
                <input type="range" id="ieSharpness" min="0" max="100" value="0"
                  oninput="document.getElementById('ieSharpVal').textContent=this.value;previewAdjustments()"
                  class="ie-range"/>
                <span class="ie-val" id="ieSharpVal">0</span>
              </div>

              <div class="ie-row">
                <span class="ie-label">شفافية</span>
                <input type="range" id="ieOpacity" min="0" max="100" value="100"
                  oninput="document.getElementById('ieOpVal').textContent=this.value;previewAdjustments()"
                  class="ie-range"/>
                <span class="ie-val" id="ieOpVal">100</span>
              </div>

              <button class="ie-btn" onclick="resetAdjustments()">↺ إعادة تعيين</button>
            </div>

            <!-- Flip -->
            <div class="ie-section">
              <div class="ie-title">↔ قلب</div>
              <div style="display:flex;gap:.3rem">
                <button class="ie-btn-sm" style="flex:1" onclick="applyFlip('h')">↔ أفقي</button>
                <button class="ie-btn-sm" style="flex:1" onclick="applyFlip('v')">↕ رأسي</button>
              </div>
            </div>

            <!-- Remove BG -->
            <div class="ie-section">
              <div class="ie-title">🪄 إزالة الخلفية</div>
              <div style="font-size:10px;color:#4b5563;margin-bottom:.4rem;line-height:1.5">
                يُحاول إزالة الخلفية البيضاء أو الموحّدة من الصورة
              </div>
              <button class="ie-btn ie-btn-purple" onclick="removeBackground('white')">
                🪄 إزالة الأبيض
              </button>
              <button class="ie-btn" style="margin-top:.3rem" onclick="removeBackground('auto')">
                🤖 تلقائي (حساسية عالية)
              </button>
              <div id="removeBgStatus" style="font-size:10px;color:#6b7280;margin-top:.3rem;text-align:center"></div>
            </div>

          </div>
        </div>

        <!-- Footer -->
        <div style="
          display:flex;gap:.6rem;padding:.8rem 1.2rem;
          border-top:1px solid rgba(255,255,255,.07);
          background:#080d1a;
        ">
          <button onclick="closeImageEditor()" style="
            background:#141d2e;border:1px solid rgba(255,255,255,.1);color:#94a3b8;
            border-radius:10px;padding:.6rem 1.2rem;font-size:13px;font-weight:700;
            cursor:pointer;font-family:inherit;transition:.15s;
          " onmouseover="this.style.borderColor='#94a3b8'" onmouseout="this.style.borderColor='rgba(255,255,255,.1)'">
            إلغاء
          </button>
          <button onclick="applyImageEdits()" style="
            flex:1;background:linear-gradient(135deg,#2563eb,#7c3aed);
            color:#fff;border:none;border-radius:10px;padding:.65rem;
            font-size:14px;font-weight:800;cursor:pointer;font-family:inherit;transition:.18s;
          " onmouseover="this.style.filter='brightness(1.1)'" onmouseout="this.style.filter=''">
            ✅ تطبيق التعديلات
          </button>
        </div>

        <!-- Inline styles for editor components -->
        <style>
          .ie-section { background:rgba(255,255,255,.03); border-radius:8px; padding:.6rem; border:1px solid rgba(255,255,255,.05); }
          .ie-title   { font-size:9px; font-weight:900; letter-spacing:1.5px; text-transform:uppercase; color:#374151; margin-bottom:.45rem; }
          .ie-btn     { width:100%; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius:7px; color:#e5e7eb; font-family:'Cairo',sans-serif; font-size:12px; font-weight:700; padding:.45rem; cursor:pointer; transition:.15s; margin-bottom:.25rem; }
          .ie-btn:hover { background:rgba(255,255,255,.08); border-color:rgba(255,255,255,.15); }
          .ie-btn-primary { background:linear-gradient(135deg,rgba(37,99,235,.3),rgba(37,99,235,.1)); border-color:rgba(37,99,235,.4); color:#93c5fd; }
          .ie-btn-purple  { background:rgba(124,58,237,.15); border-color:rgba(124,58,237,.35); color:#a78bfa; }
          .ie-btn-sm  { background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius:6px; color:#9ca3af; font-family:'Cairo',sans-serif; font-size:11px; font-weight:700; padding:.3rem .5rem; cursor:pointer; transition:.15s; }
          .ie-btn-sm:hover { background:rgba(124,58,237,.15); color:#a78bfa; border-color:rgba(124,58,237,.3); }
          .ie-row   { display:flex; align-items:center; gap:.3rem; margin-bottom:.3rem; }
          .ie-label { font-size:10px; color:#6b7280; min-width:38px; font-weight:700; }
          .ie-val   { font-size:10px; color:#c9a84c; font-family:'JetBrains Mono',monospace; min-width:28px; text-align:right; }
          .ie-range { flex:1; -webkit-appearance:none; height:3px; border-radius:2px; background:rgba(255,255,255,.1); cursor:pointer; outline:none; }
          .ie-range::-webkit-slider-thumb { -webkit-appearance:none; width:12px; height:12px; border-radius:50%; background:#7c3aed; cursor:pointer; }
        </style>
      </div>
    `;

    document.body.appendChild(modal);

    // Bind canvas events for crop
    const ec = document.getElementById("imgEditCanvas");
    if (ec) {
      ec.addEventListener("mousedown", _cropMouseDown);
      ec.addEventListener("mousemove", _cropMouseMove);
      ec.addEventListener("mouseup",   _cropMouseUp);
    }
  }

  // ════════════════════════════════════════════════════════════
  // EDITOR PREVIEW
  // ════════════════════════════════════════════════════════════

  function _renderEditorPreview() {
    if (!_editLayer?.img) return;
    const ec = document.getElementById("imgEditCanvas"); if (!ec) return;
    const img = _editLayer.img;
    const maxW = 620, maxH = 480;
    const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
    ec.width  = Math.round(img.naturalWidth  * scale);
    ec.height = Math.round(img.naturalHeight * scale);
    const ec2d = ec.getContext("2d");
    ec2d.clearRect(0, 0, ec.width, ec.height);
    _drawCheckerboard(ec2d, ec.width, ec.height);
    ec2d.drawImage(img, 0, 0, ec.width, ec.height);
    _cropCanvas = ec;
    _cropCtx    = ec2d;
    // Store original pixel data
    _origImgData = new ImageData(
      new Uint8ClampedArray(ec2d.getImageData(0, 0, ec.width, ec.height).data),
      ec.width, ec.height
    );
    // Reset sliders
    ["ieBrightness","ieContrast","ieSaturation","ieSharpness","ieOpacity"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = id === "ieOpacity" ? "100" : "0";
    });
    ["ieBrightVal","ieContrastVal","ieSatVal","ieSharpVal","ieOpVal"].forEach((id, i) => {
      const el = document.getElementById(id);
      if (el) el.textContent = i === 4 ? "100" : "0";
    });
  }

  function _drawCheckerboard(c, w, h) {
    const cs = 12;
    for (let y = 0; y < h; y += cs) {
      for (let x = 0; x < w; x += cs) {
        c.fillStyle = (Math.floor(x/cs) + Math.floor(y/cs)) % 2 === 0 ? "#2a2a3a" : "#1e1e2e";
        c.fillRect(x, y, cs, cs);
      }
    }
  }

  // ════════════════════════════════════════════════════════════
  // ADJUSTMENTS (brightness / contrast / saturation)
  // ════════════════════════════════════════════════════════════

  function previewAdjustments() {
    if (!_cropCtx || !_origImgData) return;
    const b  = parseInt(document.getElementById("ieBrightness")?.value || "0");
    const c_ = parseInt(document.getElementById("ieContrast")?.value   || "0");
    const s  = parseInt(document.getElementById("ieSaturation")?.value || "0");
    const sharp = parseInt(document.getElementById("ieSharpness")?.value || "0");

    const src  = _origImgData.data;
    const out  = _cropCtx.createImageData(_origImgData.width, _origImgData.height);
    const dst  = out.data;
    const cFactor = (259 * (c_ + 255)) / (255 * (259 - c_));

    for (let i = 0; i < src.length; i += 4) {
      let r = src[i], g = src[i+1], bl = src[i+2];
      // Brightness
      r += b * 2.55; g += b * 2.55; bl += b * 2.55;
      // Contrast
      r  = cFactor * (r  - 128) + 128;
      g  = cFactor * (g  - 128) + 128;
      bl = cFactor * (bl - 128) + 128;
      // Saturation
      if (s !== 0) {
        const gray = 0.299*r + 0.587*g + 0.114*bl;
        const sf   = 1 + s / 100;
        r  = gray + sf * (r  - gray);
        g  = gray + sf * (g  - gray);
        bl = gray + sf * (bl - gray);
      }
      dst[i]   = Math.max(0, Math.min(255, r));
      dst[i+1] = Math.max(0, Math.min(255, g));
      dst[i+2] = Math.max(0, Math.min(255, bl));
      dst[i+3] = src[i+3];
    }

    _drawCheckerboard(_cropCtx, _origImgData.width, _origImgData.height);
    _cropCtx.putImageData(out, 0, 0);

    // Draw crop rect on top
    if (_cropActive && _cropRect) _drawCropOverlay();
  }

  function resetAdjustments() {
    ["ieBrightness","ieContrast","ieSaturation","ieSharpness"].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = "0";
    });
    const op = document.getElementById("ieOpacity"); if (op) op.value = "100";
    ["ieBrightVal","ieContrastVal","ieSatVal","ieSharpVal"].forEach(id => {
      const el = document.getElementById(id); if (el) el.textContent = "0";
    });
    const ov = document.getElementById("ieOpVal"); if (ov) ov.textContent = "100";
    _drawCheckerboard(_cropCtx, _origImgData.width, _origImgData.height);
    _cropCtx.putImageData(_origImgData, 0, 0);
  }

  // ════════════════════════════════════════════════════════════
  // CROP
  // ════════════════════════════════════════════════════════════

  function startCrop() {
    _cropActive = true;
    _cropRect   = null;
    const btn = document.getElementById("ieCropBtn");
    const applyBtn  = document.getElementById("ieCropApply");
    const cancelBtn = document.getElementById("ieCropCancel");
    if (btn)       btn.style.display       = "none";
    if (applyBtn)  applyBtn.style.display  = "block";
    if (cancelBtn) cancelBtn.style.display = "block";
    if (_cropCanvas) _cropCanvas.style.cursor = "crosshair";
    showToast?.("✂️ ارسم مستطيل الاقتصاص", "info");
  }

  function cancelCrop() {
    _cropActive = false; _cropRect = null;
    document.getElementById("ieCropBtn").style.display    = "block";
    document.getElementById("ieCropApply").style.display  = "none";
    document.getElementById("ieCropCancel").style.display = "none";
    if (_cropCanvas) _cropCanvas.style.cursor = "default";
    previewAdjustments(); // redraw without crop overlay
  }

  function cropToRatio(rw, rh) {
    if (!_cropCanvas) return;
    const cw = _cropCanvas.width, ch = _cropCanvas.height;
    const targetRatio = rw / rh;
    const canvasRatio = cw / ch;
    let w, h;
    if (targetRatio > canvasRatio) { w = cw * 0.9; h = w / targetRatio; }
    else { h = ch * 0.9; w = h * targetRatio; }
    const x = (cw - w) / 2, y = (ch - h) / 2;
    _cropRect = { x, y, w, h };
    _cropActive = true;
    document.getElementById("ieCropBtn").style.display    = "none";
    document.getElementById("ieCropApply").style.display  = "block";
    document.getElementById("ieCropCancel").style.display = "block";
    previewAdjustments();
    _drawCropOverlay();
  }

  function _drawCropOverlay() {
    if (!_cropRect || !_cropCtx) return;
    const { x, y, w, h } = _cropRect;
    const cw = _cropCanvas.width, ch = _cropCanvas.height;
    _cropCtx.save();
    // Dark mask
    _cropCtx.fillStyle = "rgba(0,0,0,0.55)";
    _cropCtx.fillRect(0,0,cw,y);
    _cropCtx.fillRect(0,y+h,cw,ch-y-h);
    _cropCtx.fillRect(0,y,x,h);
    _cropCtx.fillRect(x+w,y,cw-x-w,h);
    // Border
    _cropCtx.strokeStyle = "#ffffff";
    _cropCtx.lineWidth   = 2;
    _cropCtx.setLineDash([]);
    _cropCtx.strokeRect(x, y, w, h);
    // Rule of thirds grid
    _cropCtx.strokeStyle = "rgba(255,255,255,0.3)";
    _cropCtx.lineWidth   = 1;
    [1/3, 2/3].forEach(t => {
      _cropCtx.beginPath(); _cropCtx.moveTo(x+w*t,y); _cropCtx.lineTo(x+w*t,y+h); _cropCtx.stroke();
      _cropCtx.beginPath(); _cropCtx.moveTo(x,y+h*t); _cropCtx.lineTo(x+w,y+h*t); _cropCtx.stroke();
    });
    // Corner handles
    const hSize = 10;
    _cropCtx.fillStyle = "#fff";
    [[x,y],[x+w,y],[x,y+h],[x+w,y+h]].forEach(([cx,cy]) => {
      _cropCtx.fillRect(cx-hSize/2, cy-hSize/2, hSize, hSize);
    });
    // Size label
    _cropCtx.fillStyle = "rgba(0,0,0,0.7)";
    _cropCtx.fillRect(x+4, y+4, 90, 18);
    _cropCtx.fillStyle = "#fff";
    _cropCtx.font = "11px 'JetBrains Mono', monospace";
    _cropCtx.textAlign = "left"; _cropCtx.textBaseline = "top";
    _cropCtx.fillText(`${Math.round(w)}×${Math.round(h)}`, x+7, y+5);
    _cropCtx.restore();
  }

  let _cropDragging = false;
  function _cropMouseDown(e) {
    if (!_cropActive) return;
    const r = _cropCanvas.getBoundingClientRect();
    _cropStart = {
      x: (e.clientX - r.left) * (_cropCanvas.width  / r.width),
      y: (e.clientY - r.top)  * (_cropCanvas.height / r.height),
    };
    _cropDragging = true;
    _cropRect = null;
  }
  function _cropMouseMove(e) {
    if (!_cropDragging || !_cropStart) return;
    const r  = _cropCanvas.getBoundingClientRect();
    const ex = (e.clientX - r.left) * (_cropCanvas.width  / r.width);
    const ey = (e.clientY - r.top)  * (_cropCanvas.height / r.height);
    _cropRect = {
      x: Math.min(_cropStart.x, ex),
      y: Math.min(_cropStart.y, ey),
      w: Math.abs(ex - _cropStart.x),
      h: Math.abs(ey - _cropStart.y),
    };
    previewAdjustments();
    _drawCropOverlay();
  }
  function _cropMouseUp() { _cropDragging = false; }

  function applyCrop() {
    if (!_cropRect || !_editLayer?.img) return;
    const { x, y, w, h } = _cropRect;
    if (w < 10 || h < 10) { showToast?.("⚠️ منطقة اقتصاص صغيرة جداً", "error"); return; }

    // Scale from preview canvas to actual image
    const img   = _editLayer.img;
    const scale = img.naturalWidth / _cropCanvas.width;
    const sx = x * scale, sy = y * scale, sw = w * scale, sh = h * scale;

    const off = document.createElement("canvas");
    off.width  = Math.round(sw);
    off.height = Math.round(sh);
    const offCtx = off.getContext("2d");
    offCtx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

    const newImg = new Image();
    newImg.onload = () => {
      C().saveHist();
      // Maintain aspect ratio in layer
      const aspect = sw / sh;
      const newH   = _editLayer.w / aspect;
      _editLayer.img = newImg;
      _editLayer.h   = newH;
      C().drawAll();
      // Update preview
      _editLayer = C().layers.find(l => l.id === _editLayer.id) || _editLayer;
      _renderEditorPreview();
      cancelCrop();
      showToast?.("✅ تم الاقتصاص", "success");
    };
    newImg.src = off.toDataURL("image/png");
  }

  // ════════════════════════════════════════════════════════════
  // FLIP
  // ════════════════════════════════════════════════════════════

  function applyFlip(dir) {
    if (!_editLayer?.img) return;
    const img = _editLayer.img;
    const off = document.createElement("canvas");
    off.width = img.naturalWidth; off.height = img.naturalHeight;
    const offCtx = off.getContext("2d");
    offCtx.save();
    if (dir === "h") { offCtx.translate(img.naturalWidth, 0); offCtx.scale(-1, 1); }
    else             { offCtx.translate(0, img.naturalHeight); offCtx.scale(1, -1); }
    offCtx.drawImage(img, 0, 0);
    offCtx.restore();
    const newImg = new Image();
    newImg.onload = () => {
      C().saveHist();
      _editLayer.img = newImg;
      C().drawAll();
      _renderEditorPreview();
      showToast?.("↔ تم القلب", "success");
    };
    newImg.src = off.toDataURL("image/png");
  }

  // ════════════════════════════════════════════════════════════
  // REMOVE BACKGROUND ✅
  // ════════════════════════════════════════════════════════════

  function removeBackground(mode) {
    if (!_editLayer?.img) return;
    const statusEl = document.getElementById("removeBgStatus");
    if (statusEl) statusEl.textContent = "⏳ جاري الإزالة...";

    const img = _editLayer.img;
    const off = document.createElement("canvas");
    off.width = img.naturalWidth; off.height = img.naturalHeight;
    const offCtx = off.getContext("2d");
    offCtx.drawImage(img, 0, 0);

    const imgData = offCtx.getImageData(0, 0, off.width, off.height);
    const data    = imgData.data;

    if (mode === "white") {
      // Remove near-white pixels
      const threshold = 240;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i+1], b = data[i+2];
        if (r > threshold && g > threshold && b > threshold) {
          const closeness = (r + g + b) / 3;
          const alpha     = Math.max(0, ((closeness - threshold) / (255 - threshold)) * 255);
          data[i+3] = 255 - alpha;
        }
      }
    } else {
      // Auto: flood fill from corners to detect background color
      const corners = [
        [0, 0], [off.width-1, 0],
        [0, off.height-1], [off.width-1, off.height-1],
      ];
      const tolerance = 30;

      // Sample bg color from corners
      let sumR = 0, sumG = 0, sumB = 0;
      corners.forEach(([cx, cy]) => {
        const idx = (cy * off.width + cx) * 4;
        sumR += data[idx]; sumG += data[idx+1]; sumB += data[idx+2];
      });
      const bgR = sumR/4, bgG = sumG/4, bgB = sumB/4;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i+1], b = data[i+2];
        const dist = Math.sqrt((r-bgR)**2 + (g-bgG)**2 + (b-bgB)**2);
        if (dist < tolerance) {
          const alpha = Math.max(0, (1 - (tolerance - dist) / tolerance) * 255);
          data[i+3] = alpha;
        }
      }
    }

    offCtx.putImageData(imgData, 0, 0);
    const newImg = new Image();
    newImg.onload = () => {
      C().saveHist();
      _editLayer.img = newImg;
      C().drawAll();
      _renderEditorPreview();
      if (statusEl) statusEl.textContent = "✅ تمت الإزالة";
      setTimeout(() => { if (statusEl) statusEl.textContent = ""; }, 3000);
      showToast?.("🪄 تمت إزالة الخلفية", "success");
    };
    newImg.src = off.toDataURL("image/png");
  }

  // ════════════════════════════════════════════════════════════
  // APPLY ALL EDITS TO LAYER
  // ════════════════════════════════════════════════════════════

  function applyImageEdits() {
    if (!_editLayer || !_cropCtx) return;

    const b  = parseInt(document.getElementById("ieBrightness")?.value || "0");
    const c_ = parseInt(document.getElementById("ieContrast")?.value   || "0");
    const s  = parseInt(document.getElementById("ieSaturation")?.value || "0");
    const op = parseInt(document.getElementById("ieOpacity")?.value    || "100");

    C().saveHist();

    // Store adjustments on layer for live re-rendering
    _editLayer.brightness = b;
    _editLayer.contrast   = c_;
    _editLayer.saturation = s;
    _editLayer.opacity    = op;

    // If non-zero adjustments, bake them into a new image
    if (b !== 0 || c_ !== 0 || s !== 0) {
      // Get the current canvas state (with adjustments applied)
      const off = document.createElement("canvas");
      off.width  = _cropCanvas.width;
      off.height = _cropCanvas.height;
      const offCtx = off.getContext("2d");
      offCtx.drawImage(_cropCanvas, 0, 0);
      const newImg = new Image();
      newImg.onload = () => {
        _editLayer.img = newImg;
        _editLayer.brightness = 0;
        _editLayer.contrast   = 0;
        C().drawAll();
      };
      newImg.src = off.toDataURL("image/png");
    }

    C().drawAll();
    closeImageEditor();
    showToast?.("✅ تم تطبيق التعديلات", "success");
  }

  // ════════════════════════════════════════════════════════════
  // EXPOSE
  // ════════════════════════════════════════════════════════════

  Object.assign(window, {
    openImageEditor, closeImageEditor,
    startCrop, cancelCrop, applyCrop, cropToRatio,
    previewAdjustments, resetAdjustments,
    applyFlip, removeBackground, applyImageEdits,
  });

})();
