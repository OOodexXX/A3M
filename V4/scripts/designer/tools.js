// ============================================================
// designer/tools.js  –  A3M Print  –  Layer Tools v3
// ✅ FIXED TEXT: uses calcTextBounds, accurate with letterSpacing
// ✅ IMAGE: crop/edit opens automatically after upload
// ✅ جديد: Text Stroke, Shadow UI, Gradient UI,
//          Drag-Reorder Layers, SVG Export, Hi-Res Export
// ============================================================

(function () {
  "use strict";

  const C = () => window._A3MCanvas;

  // ════════════════════════════════════════════════════════════
  // LAYER FACTORIES
  // ════════════════════════════════════════════════════════════

  function addTextLayer(text, fs, font, fill, align, x, y, opts = {}) {
    const { ctx, snap, nid, drawAll } = C();
    if (!ctx) return null;
    // ✅ FIXED: use calcTextBounds for accurate dimensions
    const _tmpLayer = { text:String(text||"Text"), font, fontSize:fs, bold:opts.bold||false, italic:opts.italic||false, letterSpacing:opts.letterSpacing||0 };
    const bounds = C().calcTextBounds ? C().calcTextBounds(_tmpLayer) : { w: fs*6, h: fs*1.4 };
    const layer = {
      id: nid(), type: "text",
      x: snap(x), y: snap(y), w: bounds.w, h: bounds.h,
      text: String(text || "Text"), font, fontSize: fs,
      fillColor: fill || "#ffffff",
      textAlign: align || "center", opacity: 100, rotation: 0, visible: true, locked: false,
      flippedH: false, flippedV: false,
      bold: opts.bold || false, italic: opts.italic || false, underline: opts.underline || false,
      letterSpacing: opts.letterSpacing || 0,
      // ✅ NEW text properties
      textStroke: opts.textStroke || "",
      textStrokeWidth: opts.textStrokeWidth || 0,
      shadowColor: opts.shadowColor || "",
      shadowBlur:  opts.shadowBlur  || 0,
      shadowOffsetX: opts.shadowOffsetX || 0,
      shadowOffsetY: opts.shadowOffsetY || 0,
    };
    C().layers.push(layer);
    C().selectedId = layer.id;
    drawAll();
    return layer;
  }

  function addRect(x, y, w, h, fill, stroke, strokeW, opacity, opts = {}) {
    const { snap, nid, drawAll } = C();
    const layer = {
      id:nid(), type:"rect", x:snap(x), y:snap(y), w:w||150, h:h||80,
      fillColor:fill||"#7c3aed", strokeColor:stroke||"#c9a84c", strokeWidth:strokeW||2,
      cornerRadius:opts.cornerRadius||0, gradient:opts.gradient||null,
      opacity:opacity||100, rotation:0, visible:true, locked:false, flippedH:false, flippedV:false,
    };
    C().layers.push(layer); C().selectedId=layer.id; drawAll(); return layer;
  }

  function addCircle(x, y, r, fill, stroke, opacity) {
    const { snap, nid, drawAll } = C();
    const layer = { id:nid(), type:"circle", x:snap(x), y:snap(y), w:(r||60)*2, h:(r||60)*2, fillColor:fill||"#7c3aed", strokeColor:stroke||"", strokeWidth:2, opacity:opacity||100, rotation:0, visible:true, locked:false, flippedH:false, flippedV:false };
    C().layers.push(layer); C().selectedId=layer.id; drawAll(); return layer;
  }

  function addTriangle(x, y, w, h, fill, stroke, opacity) {
    const { snap, nid, drawAll } = C();
    const layer = { id:nid(), type:"triangle", x:snap(x), y:snap(y), w:w||120, h:h||100, fillColor:fill||"#7c3aed", strokeColor:stroke||"", strokeWidth:2, opacity:opacity||100, rotation:0, visible:true, locked:false, flippedH:false, flippedV:false };
    C().layers.push(layer); C().selectedId=layer.id; drawAll(); return layer;
  }

  function addStar(x, y, r, fill, stroke, opacity) {
    const { snap, nid, drawAll } = C();
    const layer = { id:nid(), type:"star", x:snap(x), y:snap(y), w:(r||60)*2, h:(r||60)*2, fillColor:fill||"#c9a84c", strokeColor:stroke||"", strokeWidth:2, opacity:opacity||100, rotation:0, visible:true, locked:false, flippedH:false, flippedV:false };
    C().layers.push(layer); C().selectedId=layer.id; drawAll(); return layer;
  }

  function addLine(x1, y1, x2, y2, color, width, opacity) {
    const { snap, nid, drawAll } = C();
    const cx=(x1+x2)/2, cy=(y1+y2)/2, w=Math.max(Math.abs(x2-x1),10), h=Math.max(Math.abs(y2-y1),10);
    const layer = { id:nid(), type:"line", x:snap(cx), y:snap(cy), w, h, fillColor:color||"#ffffff", strokeColor:color||"#ffffff", strokeWidth:width||3, opacity:opacity||100, rotation:0, visible:true, locked:false, flippedH:false, flippedV:false };
    C().layers.push(layer); C().selectedId=layer.id; drawAll(); return layer;
  }

  // ════════════════════════════════════════════════════════════
  // ADD FROM UI CONTROLS
  // ════════════════════════════════════════════════════════════

  function addText() {
    if (!C().canvas) return;
    C().saveHist();
    const text   = document.getElementById("txtContent")?.value   || "Text";
    const fs     = parseInt(document.getElementById("txtSize")?.value)     || 40;
    const font   = document.getElementById("txtFont")?.value      || "Cairo";
    const fill   = document.getElementById("txtColor")?.value     || "#000000";
    const bold   = document.getElementById("tbBold")?.classList?.contains("active-btn");
    const italic = document.getElementById("tbItalic")?.classList?.contains("active-btn");
    const ls     = parseInt(document.getElementById("txtLetterSpacing")?.value) || 0;
    const tStroke= document.getElementById("txtStrokeColor")?.value || "";
    const tStrokeW=parseInt(document.getElementById("txtStrokeWidth")?.value) || 0;
    const shColor= document.getElementById("txtShadowColor")?.value || "";
    const shBlur = parseInt(document.getElementById("txtShadowBlur")?.value) || 0;
    const shX    = parseInt(document.getElementById("txtShadowX")?.value) || 0;
    const shY    = parseInt(document.getElementById("txtShadowY")?.value) || 0;
    addTextLayer(text, fs, font, fill, "center", 250, 250, {
      bold, italic, letterSpacing:ls,
      textStroke:tStroke, textStrokeWidth:tStrokeW,
      shadowColor:shColor, shadowBlur:shBlur, shadowOffsetX:shX, shadowOffsetY:shY,
    });
  }

  function addShape(type) {
    if (!C().canvas) return;
    C().saveHist();
    const fill   = document.getElementById("shapeFill")?.value   || "#7c3aed";
    const stroke = document.getElementById("shapeStroke")?.value || "#c9a84c";
    const op     = parseInt(document.getElementById("shapeOpacity")?.value) || 100;
    const sw     = parseInt(document.getElementById("strokeW")?.value) || 2;
    const cr     = parseInt(document.getElementById("cornerRadius")?.value) || 0;
    if      (type==="rect")     addRect(250,250,150,80,fill,stroke,sw,op,{cornerRadius:cr});
    else if (type==="circle")   addCircle(250,250,60,fill,stroke,op);
    else if (type==="triangle") addTriangle(250,250,120,100,fill,stroke,op);
    else if (type==="star")     addStar(250,250,65,fill,stroke,op);
    else if (type==="line")     addLine(150,250,350,250,fill,sw,op);
  }

  // ════════════════════════════════════════════════════════════
  // SYNC SELECTED ↔ PANEL
  // ════════════════════════════════════════════════════════════

  function syncSelected() {
    const { layers, selectedId, ctx, drawAll } = C();
    const l = layers.find(x => x.id===selectedId);
    if (!l) return;
    if (l.type==="text") {
      l.text          = document.getElementById("txtContent")?.value || l.text;
      l.fontSize      = parseInt(document.getElementById("txtSize")?.value)    || l.fontSize;
      l.font          = document.getElementById("txtFont")?.value    || l.font;
      l.fillColor     = document.getElementById("txtColor")?.value   || l.fillColor;
      l.letterSpacing = parseInt(document.getElementById("txtLetterSpacing")?.value) || 0;
      l.textStroke    = document.getElementById("txtStrokeColor")?.value || "";
      l.textStrokeWidth=parseInt(document.getElementById("txtStrokeWidth")?.value) || 0;
      l.shadowColor   = document.getElementById("txtShadowColor")?.value || "";
      l.shadowBlur    = parseInt(document.getElementById("txtShadowBlur")?.value)  || 0;
      l.shadowOffsetX = parseInt(document.getElementById("txtShadowX")?.value) || 0;
      l.shadowOffsetY = parseInt(document.getElementById("txtShadowY")?.value) || 0;
      // ✅ FIXED: use calcTextBounds for accurate sizing
      if (C().calcTextBounds) {
        const b = C().calcTextBounds(l);
        l.w = b.w; l.h = b.h;
      } else if (ctx) {
        ctx.save(); ctx.font=`${l.bold?"bold ":l.italic?"italic ":""}${l.fontSize}px '${l.font}'`;
        l.w=Math.max(ctx.measureText(l.text).width+24,60); ctx.restore();
        l.h=l.fontSize*1.5;
      }
    } else {
      l.fillColor   = document.getElementById("shapeFill")?.value   || l.fillColor;
      l.strokeColor = document.getElementById("shapeStroke")?.value || l.strokeColor;
      l.strokeWidth = parseInt(document.getElementById("strokeW")?.value)    || l.strokeWidth;
      l.opacity     = parseInt(document.getElementById("shapeOpacity")?.value) || l.opacity;
      if (l.type==="rect") l.cornerRadius = parseInt(document.getElementById("cornerRadius")?.value)||0;
      const opVal = document.getElementById("opVal"); if (opVal) opVal.textContent = l.opacity;
    }
    drawAll();
  }

  function setTxtAlign(a) {
    const { layers, selectedId, drawAll } = C();
    const l = layers.find(x => x.id===selectedId);
    if (l && l.type==="text") { l.textAlign=a; drawAll(); }
  }

  function toggleTextStyle(prop) {
    const { layers, selectedId, drawAll } = C();
    const l = layers.find(x => x.id===selectedId);
    if (!l || l.type!=="text") return;
    C().saveHist();
    l[prop] = !l[prop];
    const btn = document.getElementById("tb"+prop.charAt(0).toUpperCase()+prop.slice(1));
    if (btn) btn.classList.toggle("active-btn", l[prop]);
    drawAll();
  }

  // ════════════════════════════════════════════════════════════
  // LAYER OPERATIONS
  // ════════════════════════════════════════════════════════════

  function setTool(t) {
    C().activeTool = t;
    document.querySelectorAll('.d-tool-btn[id^="tool-"]').forEach(b => b.classList.remove("active"));
    document.getElementById("tool-"+t)?.classList.add("active");
    if (C().canvas) C().canvas.style.cursor = t==="select"?"default":"crosshair";
    const ti = document.getElementById("dsActiveTool"); if (ti) ti.textContent = t;
  }

  function deleteSelected() {
    const { layers, selectedId, saveHist, drawAll } = C();
    if (!selectedId) return;
    const l = layers.find(x=>x.id===selectedId);
    if (l?.locked) { if(typeof showToast==="function") showToast("🔒 لا يمكن حذف طبقة مقفولة","error"); return; }
    saveHist();
    C().layers = layers.filter(l=>l.id!==selectedId);
    C().selectedId = null;
    drawAll();
    if(typeof showToast==="function") showToast("🗑 تم الحذف");
  }

  function duplicateSelected() {
    const { layers, selectedId, saveHist, nid, drawAll } = C();
    const l = layers.find(x=>x.id===selectedId);
    if (!l) return;
    saveHist();
    const copy = JSON.parse(JSON.stringify(l));
    copy.id=nid(); copy.x+=20; copy.y+=20;
    if (l.img) copy.img=l.img;
    C().layers.push(copy); C().selectedId=copy.id;
    drawAll(); if(typeof showToast==="function") showToast("⊕ تم النسخ");
  }

  function bringForward() {
    const { layers, selectedId, saveHist, drawAll } = C();
    const i = layers.findIndex(x=>x.id===selectedId);
    if (i>=0 && i<layers.length-1) { saveHist(); [layers[i],layers[i+1]]=[layers[i+1],layers[i]]; drawAll(); }
  }

  function sendBackward() {
    const { layers, selectedId, saveHist, drawAll } = C();
    const i = layers.findIndex(x=>x.id===selectedId);
    if (i>0) { saveHist(); [layers[i],layers[i-1]]=[layers[i-1],layers[i]]; drawAll(); }
  }

  function bringToFront() {
    const { layers, selectedId, saveHist, drawAll } = C();
    const i = layers.findIndex(x=>x.id===selectedId);
    if (i>=0 && i<layers.length-1) { saveHist(); const [el]=layers.splice(i,1); layers.push(el); drawAll(); }
  }

  function sendToBack() {
    const { layers, selectedId, saveHist, drawAll } = C();
    const i = layers.findIndex(x=>x.id===selectedId);
    if (i>0) { saveHist(); const [el]=layers.splice(i,1); layers.unshift(el); drawAll(); }
  }

  function flipH() { const {layers,selectedId,saveHist,drawAll}=C(); const l=layers.find(x=>x.id===selectedId); if(l){saveHist();l.flippedH=!l.flippedH;drawAll();} }
  function flipV() { const {layers,selectedId,saveHist,drawAll}=C(); const l=layers.find(x=>x.id===selectedId); if(l){saveHist();l.flippedV=!l.flippedV;drawAll();} }

  function lockSelected() {
    const {layers,selectedId,drawAll}=C();
    const l=layers.find(x=>x.id===selectedId);
    if(l){l.locked=!l.locked;drawAll();if(typeof showToast==="function")showToast(l.locked?"🔒 مقفولة":"🔓 مفتوحة");}
  }

  function clearCanvas() {
    C().saveHist();
    C().layers=[]; C().selectedId=null; C().bgColorVal="#ffffff";
    const bgEl=document.getElementById("bgColor"); if(bgEl) bgEl.value="#ffffff";
    C().drawAll();
  }

  function alignLayers(dir) {
    const {layers,selectedId,canvas,saveHist,drawAll}=C();
    if(!selectedId) return;
    const l=layers.find(x=>x.id===selectedId); if(!l) return;
    saveHist();
    const W=canvas?canvas.width:500, H=canvas?canvas.height:500;
    if(dir==="left")    l.x=l.w/2;
    if(dir==="right")   l.x=W-l.w/2;
    if(dir==="top")     l.y=l.h/2;
    if(dir==="bottom")  l.y=H-l.h/2;
    if(dir==="hcenter") l.x=W/2;
    if(dir==="vcenter") l.y=H/2;
    drawAll();
  }

  // ════════════════════════════════════════════════════════════
  // GRADIENT EDITOR ✅ NEW
  // ════════════════════════════════════════════════════════════

  function applyGradient() {
    const {layers,selectedId,saveHist,drawAll}=C();
    const l=layers.find(x=>x.id===selectedId); if(!l||l.type==="text"||l.type==="line") return;
    const c1=document.getElementById("gradColor1")?.value||"#7c3aed";
    const c2=document.getElementById("gradColor2")?.value||"#c9a84c";
    const type=document.getElementById("gradType")?.value||"linear";
    saveHist();
    l.gradient={type,stops:[{pos:0,color:c1},{pos:1,color:c2}]};
    drawAll();
    if(typeof showToast==="function") showToast("🎨 تدرج مطبّق");
  }

  function removeGradient() {
    const {layers,selectedId,saveHist,drawAll}=C();
    const l=layers.find(x=>x.id===selectedId); if(!l) return;
    saveHist();
    l.gradient=null;
    drawAll();
    if(typeof showToast==="function") showToast("✕ تدرج محذوف");
  }

  // ════════════════════════════════════════════════════════════
  // TRANSFORM PANEL
  // ════════════════════════════════════════════════════════════

  function applyTransform() {
    const {layers,selectedId,saveHist,drawAll,CANVAS_PX_TO_CM}=C();
    const l=layers.find(x=>x.id===selectedId); if(!l) return;
    saveHist();
    l.w=Math.max(10,parseFloat(document.getElementById("objW")?.value)||l.w);
    l.h=Math.max(5, parseFloat(document.getElementById("objH")?.value)||l.h);
    l.x=parseFloat(document.getElementById("objX")?.value)||l.x;
    l.y=parseFloat(document.getElementById("objY")?.value)||l.y;
    l.rotation=parseFloat(document.getElementById("objRot")?.value)||0;
    if(l.type==="circle") l.h=l.w;
    drawAll();
  }

  function updateTransformPanel() {
    const {layers,selectedId,CANVAS_PX_TO_CM}=C();
    const l=layers.find(x=>x.id===selectedId);
    const set  =(id,v)=>{const el=document.getElementById(id);if(el)el.value=v;};
    const setT =(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
    if(!l){["ds-size-cm","ds-size-mm","ds-size-px"].forEach(id=>setT(id,"—"));return;}
    set("objW",Math.round(l.w)); set("objH",Math.round(l.h));
    set("objX",Math.round(l.x)); set("objY",Math.round(l.y));
    set("objRot",Math.round(l.rotation||0)); setT("rotVal",(l.rotation||0)+"°");
    const PX_CM=C().CANVAS_PX_TO_CM||0.026458;
    setT("ds-size-cm",`${(l.w*PX_CM).toFixed(2)} × ${(l.h*PX_CM).toFixed(2)} سم`);
    setT("ds-size-mm",`${Math.round(l.w*PX_CM*10)} × ${Math.round(l.h*PX_CM*10)} مم`);
    setT("ds-size-px",`${Math.round(l.w)} × ${Math.round(l.h)} px`);

    if(l.type==="text"){
      set("txtContent",l.text); set("txtSize",l.fontSize); setT("txtSzVal",l.fontSize);
      set("txtColor",l.fillColor); if(l.font)set("txtFont",l.font);
      // Auto-update bounds when panel shows (in case font changed)
      if(C().calcTextBounds){const b=C().calcTextBounds(l);if(Math.abs(l.w-b.w)>20||Math.abs(l.h-b.h)>10){l.w=b.w;l.h=b.h;}}
      set("txtLetterSpacing",l.letterSpacing||0); setT("lsVal",l.letterSpacing||0);
      set("txtStrokeColor",l.textStroke||"");
      set("txtStrokeWidth",l.textStrokeWidth||0);
      set("txtShadowColor",l.shadowColor||"");
      set("txtShadowBlur",l.shadowBlur||0);
      set("txtShadowX",l.shadowOffsetX||0);
      set("txtShadowY",l.shadowOffsetY||0);
      ["Bold","Italic","Underline"].forEach(s=>document.getElementById("tb"+s)?.classList.toggle("active-btn",!!l[s.toLowerCase()]));
      // Show/hide text vs shape panels
      document.getElementById("textPropsPanel")  && (document.getElementById("textPropsPanel").style.display="block");
      document.getElementById("shapePropsPanel") && (document.getElementById("shapePropsPanel").style.display="none");
    }else{
      set("shapeFill",l.fillColor||"#7c3aed");
      set("shapeStroke",l.strokeColor||"#c9a84c");
      set("shapeOpacity",l.opacity||100); setT("opVal",l.opacity||100);
      if(l.type==="rect") set("cornerRadius",l.cornerRadius||0);
      // Gradient UI
      if(l.gradient){
        set("gradColor1",l.gradient.stops?.[0]?.color||"#7c3aed");
        set("gradColor2",l.gradient.stops?.[1]?.color||"#c9a84c");
        set("gradType",l.gradient.type||"linear");
      }
      document.getElementById("textPropsPanel")  && (document.getElementById("textPropsPanel").style.display="none");
      document.getElementById("shapePropsPanel") && (document.getElementById("shapePropsPanel").style.display="block");
    }
    const lockBtn=document.getElementById("dsLockBtn");
    if(lockBtn) lockBtn.textContent=l.locked?"🔓 فتح":"🔒 قفل";
  }

  // ════════════════════════════════════════════════════════════
  // LAYERS PANEL — with drag-to-reorder ✅ NEW
  // ════════════════════════════════════════════════════════════

  let _dragLayerId = null;

  function renderLayers() {
    const {layers,selectedId}=C();
    const ll=document.getElementById("layersList"); if(!ll) return;
    const icons={text:"T",image:"🖼",circle:"●",triangle:"▲",star:"★",line:"—",rect:"■"};
    ll.innerHTML = [...layers].reverse().map(l=>`
      <div class="layer-item${l.id===selectedId?" selected":""}${l.locked?" layer-locked":""}"
           onclick="selectLayer('${l.id}')"
           draggable="true"
           data-lid="${l.id}"
           ondragstart="_onLayerDragStart(event,'${l.id}')"
           ondragover="_onLayerDragOver(event)"
           ondrop="_onLayerDrop(event,'${l.id}')"
           ondragend="_onLayerDragEnd()">
        <span class="layer-drag-handle" title="سحب لإعادة الترتيب">⠿</span>
        <span class="layer-icon" style="color:${l.id===selectedId?"#7c3aed":"#6b7280"}">${icons[l.type]||"▭"}</span>
        <span class="layer-name">${l.type==="text"?l.text.slice(0,14):l.type}</span>
        <div class="layer-actions">
          <button class="layer-act-btn" onclick="event.stopPropagation();toggleVis('${l.id}')" title="إظهار/إخفاء">${l.visible?"👁":"○"}</button>
          <button class="layer-act-btn${l.locked?" layer-lock-active":""}" onclick="event.stopPropagation();_A3MCanvas.selectedId='${l.id}';lockSelected()" title="قفل">${l.locked?"🔒":"🔓"}</button>
          <button class="layer-act-btn layer-del" onclick="event.stopPropagation();_A3MCanvas.selectedId='${l.id}';deleteSelected()" title="حذف">✕</button>
        </div>
      </div>`).join("");

    // Bind drag events on elements
    _rebindLayerDrag();
  }

  function _rebindLayerDrag() {
    const items=document.querySelectorAll(".layer-item[draggable]");
    items.forEach(el=>{
      el.ondragstart=e=>_onLayerDragStart(e,el.dataset.lid);
      el.ondragover=_onLayerDragOver;
      el.ondrop=e=>_onLayerDrop(e,el.dataset.lid);
      el.ondragend=_onLayerDragEnd;
    });
  }

  function _onLayerDragStart(e,id){
    _dragLayerId=id;
    e.dataTransfer.effectAllowed="move";
    e.currentTarget?.classList.add("layer-dragging");
  }
  function _onLayerDragOver(e){
    e.preventDefault(); e.dataTransfer.dropEffect="move";
    document.querySelectorAll(".layer-item").forEach(el=>el.classList.remove("layer-drag-over"));
    e.currentTarget?.classList.add("layer-drag-over");
  }
  function _onLayerDrop(e,targetId){
    e.preventDefault();
    if(!_dragLayerId||_dragLayerId===targetId) return;
    const {layers,drawAll,saveHist}=C();
    const fromIdx=layers.findIndex(l=>l.id===_dragLayerId);
    const toIdx  =layers.findIndex(l=>l.id===targetId);
    if(fromIdx<0||toIdx<0) return;
    // layers array is bottom-to-top; panel shows reversed
    // so dragging "up" in panel = moving to higher index
    saveHist();
    const [el]=layers.splice(fromIdx,1);
    layers.splice(toIdx,0,el);
    drawAll();
    document.querySelectorAll(".layer-item").forEach(el=>el.classList.remove("layer-drag-over","layer-dragging"));
  }
  function _onLayerDragEnd(){
    _dragLayerId=null;
    document.querySelectorAll(".layer-item").forEach(el=>el.classList.remove("layer-drag-over","layer-dragging"));
  }

  function selectLayer(id) { C().selectedId=id; C().drawAll(); }
  function toggleVis(id)   { const l=C().layers.find(x=>x.id===id); if(l){C().saveHist();l.visible=!l.visible;C().drawAll();} }

  // ════════════════════════════════════════════════════════════
  // IMAGE UPLOAD
  // ════════════════════════════════════════════════════════════

  function uploadImage(ev) {
    const file=ev.target.files?.[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=e=>{
      const img=new Image();
      img.onload=()=>{
        C().saveHist();
        const sc=Math.min(280/img.width,280/img.height,1);
        const w=img.width*sc, h=img.height*sc;
        const l={id:C().nid(),type:"image",x:250,y:250,w,h,img,fillColor:"",strokeColor:"",strokeWidth:0,opacity:100,rotation:0,visible:true,locked:false,flippedH:false,flippedV:false};
        C().layers.push(l); C().selectedId=l.id; C().drawAll();
        if(typeof showToast==="function") showToast("🖼 تمت إضافة الصورة","success");
      };
      img.src=e.target.result;
    };
    reader.readAsDataURL(file);
    ev.target.value="";
  }

  // ════════════════════════════════════════════════════════════
  // EXPORT ✅ NEW: hi-res, SVG
  // ════════════════════════════════════════════════════════════

  function downloadDesign(scale = 1) {
    const {canvas,drawAll}=C(); if(!canvas) return;
    if (scale <= 1) {
      // Standard export
      const prevSel=C().selectedId; C().selectedId=null; drawAll();
      const link=document.createElement("a");
      link.download="A3M_Design_"+Date.now()+".png";
      link.href=canvas.toDataURL("image/png");
      link.click();
      C().selectedId=prevSel; drawAll();
      if(typeof showToast==="function") showToast("✅ تم التصدير","success");
    } else {
      // ✅ Hi-res export (2x, 3x)
      const offscreen=document.createElement("canvas");
      offscreen.width  = canvas.width  * scale;
      offscreen.height = canvas.height * scale;
      const offCtx=offscreen.getContext("2d");
      offCtx.scale(scale,scale);
      // Re-draw everything on offscreen
      const {bgColorVal,layers:lrs}=C();
      if(bgColorVal&&bgColorVal!=="transparent"){offCtx.fillStyle=bgColorVal;offCtx.fillRect(0,0,canvas.width,canvas.height);}
      lrs.filter(l=>l.visible).forEach(l=>{
        // Simple re-draw using the main drawLayer logic but on offCtx
        offCtx.save();
        offCtx.globalAlpha=(l.opacity||100)/100;
        offCtx.translate(l.x,l.y);
        if(l.rotation) offCtx.rotate(l.rotation*Math.PI/180);
        if(l.flippedH) offCtx.scale(-1,1);
        if(l.flippedV) offCtx.scale(1,-1);
        const hw=l.w/2,hh=l.h/2;
        if(l.type==="image"&&l.img){offCtx.drawImage(l.img,-hw,-hh,l.w,l.h);}
        else if(l.type==="rect"){offCtx.beginPath();offCtx.rect(-hw,-hh,l.w,l.h);offCtx.fillStyle=l.fillColor;offCtx.fill();if(l.strokeColor&&l.strokeWidth){offCtx.strokeStyle=l.strokeColor;offCtx.lineWidth=l.strokeWidth;offCtx.stroke();}}
        else if(l.type==="circle"){offCtx.beginPath();offCtx.arc(0,0,Math.max(hw,1),0,Math.PI*2);offCtx.fillStyle=l.fillColor;offCtx.fill();}
        else if(l.type==="text"){
          const w=l.bold&&l.italic?"bold italic ":l.bold?"bold ":l.italic?"italic ":"";
          offCtx.font=`${w}${l.fontSize}px '${l.font}'`;
          offCtx.textAlign=l.textAlign||"center";offCtx.textBaseline="middle";
          offCtx.fillStyle=l.fillColor;offCtx.fillText(l.text,0,0);
        }
        offCtx.restore();
      });
      const link=document.createElement("a");
      link.download=`A3M_Design_${scale}x_${Date.now()}.png`;
      link.href=offscreen.toDataURL("image/png");
      link.click();
      if(typeof showToast==="function") showToast(`✅ تصدير ${scale}x (${offscreen.width}×${offscreen.height}px)`,"success");
    }
  }

  // ✅ NEW: SVG Export (vector — text + shapes only, no raster images)
  function downloadSVG() {
    const {canvas,layers:lrs,bgColorVal}=C(); if(!canvas) return;
    const W=canvas.width, H=canvas.height;
    let svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
    // Background
    if(bgColorVal&&bgColorVal!=="transparent") svg+=`<rect width="${W}" height="${H}" fill="${bgColorVal}"/>`;
    lrs.filter(l=>l.visible).forEach(l=>{
      const t=`transform="translate(${l.x},${l.y}) rotate(${l.rotation||0})${l.flippedH?" scale(-1,1)":""}${l.flippedV?" scale(1,-1)":""}"`; 
      const op=`opacity="${(l.opacity||100)/100}"`;
      const hw=l.w/2,hh=l.h/2;
      if(l.type==="rect"){
        const r=l.cornerRadius||0;
        svg+=`<rect x="${-hw}" y="${-hh}" width="${l.w}" height="${l.h}" rx="${r}" fill="${l.fillColor}" stroke="${l.strokeColor||"none"}" stroke-width="${l.strokeWidth||0}" ${t} ${op}/>`;
      }else if(l.type==="circle"){
        svg+=`<ellipse cx="0" cy="0" rx="${hw}" ry="${hh}" fill="${l.fillColor}" stroke="${l.strokeColor||"none"}" stroke-width="${l.strokeWidth||0}" ${t} ${op}/>`;
      }else if(l.type==="triangle"){
        svg+=`<polygon points="0,${-hh} ${hw},${hh} ${-hw},${hh}" fill="${l.fillColor}" ${t} ${op}/>`;
      }else if(l.type==="line"){
        svg+=`<line x1="${-hw}" y1="0" x2="${hw}" y2="0" stroke="${l.strokeColor||l.fillColor}" stroke-width="${l.strokeWidth||3}" ${t} ${op}/>`;
      }else if(l.type==="text"){
        const w=l.bold&&l.italic?"bold italic":l.bold?"bold":l.italic?"italic":"normal";
        const anchor=l.textAlign==="center"?"middle":l.textAlign==="right"?"end":"start";
        let attrs=`font-family="${l.font}" font-size="${l.fontSize}" font-weight="${l.bold?"bold":"normal"}" font-style="${l.italic?"italic":"normal"}" text-anchor="${anchor}" dominant-baseline="middle" fill="${l.fillColor}" ${t} ${op}`;
        if(l.textStroke&&l.textStrokeWidth>0) attrs+=` stroke="${l.textStroke}" stroke-width="${l.textStrokeWidth}" paint-order="stroke"`;
        svg+=`<text x="0" y="0" ${attrs}>${l.text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</text>`;
      }
    });
    svg+="</svg>";
    const blob=new Blob([svg],{type:"image/svg+xml"});
    const link=document.createElement("a");
    link.download="A3M_Design_"+Date.now()+".svg";
    link.href=URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
    if(typeof showToast==="function") showToast("✅ تصدير SVG","success");
  }

  function saveToCart() {
    const name="Custom Design ("+C().canvasProdType+")";
    const item={id:"custom-design-"+Date.now(),name,emoji:"🎨",price:1500,qty:1};
    if(typeof window.cart!=="undefined") window.cart.push(item);
    if(typeof updateCart==="function") updateCart();
    if(typeof showToast==="function") showToast("🛒 تمت الإضافة للسلة","success");
  }

  function summarizeDesign() {
    const {layers,canvasProdType,bgColorVal}=C();
    const parts=[`منتج: ${canvasProdType}`,`الطبقات: ${layers.length}`];
    const texts=layers.filter(l=>l.type==="text").map(l=>l.text).slice(0,4);
    if(texts.length) parts.push("نصوص: "+texts.join(" / "));
    parts.push("خلفية: "+bgColorVal);
    return parts.join("\n");
  }

  function openOrderFromDesign() {
    const modal=document.getElementById("orderModal");
    if(!modal){if(typeof window.openOrderForm==="function")window.openOrderForm();return;}
    modal.style.display="flex";
    const notes=document.getElementById("inp-notes"); if(notes) notes.value=summarizeDesign();
  }

  // ════════════════════════════════════════════════════════════
  // EXPOSE
  // ════════════════════════════════════════════════════════════

  Object.assign(window, {
    addTextLayer, addRect, addCircle, addTriangle, addStar, addLine,
    addText, addShape,
    syncSelected, setTxtAlign, setTool, toggleTextStyle,
    deleteSelected, duplicateSelected,
    bringForward, sendBackward, bringToFront, sendToBack,
    flipH, flipV, lockSelected, clearCanvas, alignLayers,
    applyTransform, updateTransformPanel,
    applyGradient, removeGradient,
    renderLayers, selectLayer, toggleVis,
    _onLayerDragStart, _onLayerDragOver, _onLayerDrop, _onLayerDragEnd,
    uploadImage, downloadDesign, downloadSVG, saveToCart, summarizeDesign, openOrderFromDesign,
  });

})();
