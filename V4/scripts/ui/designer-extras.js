// ============================================================
// scripts/ui/designer-extras.js  —  A3M Print
// Designer UX Extras — zoom, canvas resize, keyboard shortcuts
// ============================================================

(function(){

  // Zoom
  let _zoom = 1;
  window.dsZoom = function(delta) {
    _zoom = Math.min(3, Math.max(0.2, _zoom + delta));
    const wrap = document.getElementById('dsCanvasWrap');
    if(wrap) wrap.style.transform = `scale(${_zoom})`;
    document.getElementById('dsZoomVal').textContent = Math.round(_zoom*100)+'%';
  };
  window.dsFitCanvas = function() {
    const area = document.getElementById('dsCanvasArea');
    const canvas = document.getElementById('designCanvas');
    if(!area||!canvas) return;
    const scaleW = (area.clientWidth - 80) / canvas.width;
    const scaleH = (area.clientHeight - 80) / canvas.height;
    _zoom = Math.min(scaleW, scaleH, 1);
    const wrap = document.getElementById('dsCanvasWrap');
    if(wrap) wrap.style.transform = `scale(${_zoom})`;
    document.getElementById('dsZoomVal').textContent = Math.round(_zoom*100)+'%';
  };

  // Canvas size (scratch)
  window.dsApplyPreset = function(w,h) {
    document.getElementById('dsCanvasW').value = w;
    document.getElementById('dsCanvasH').value = h;
    dsApplyCanvasSize();
  };
  window.dsApplyCanvasSize = function() {
    const w = parseInt(document.getElementById('dsCanvasW').value)||500;
    const h = parseInt(document.getElementById('dsCanvasH').value)||500;
    const canvas = document.getElementById('designCanvas');
    if(!canvas) return;
    canvas.width  = Math.min(w,4000);
    canvas.height = Math.min(h,4000);
    document.getElementById('dsSizeInfo').textContent = canvas.width+' × '+canvas.height+' px';
    if(typeof drawAll==='function') drawAll();
    dsFitCanvas();
    showToast('📐 '+canvas.width+' × '+canvas.height);
  };

  // Cursor position tracking
  document.addEventListener('DOMContentLoaded',()=>{
    const canvas = document.getElementById('designCanvas');
    if(canvas){
      canvas.addEventListener('mousemove', e=>{
        const r=canvas.getBoundingClientRect(), scale=canvas.width/r.width;
        const x=Math.round((e.clientX-r.left)*scale);
        const y=Math.round((e.clientY-r.top)*scale);
        const el=document.getElementById('dsCursorPos');
        if(el) el.textContent=x+', '+y;
      });
    }
  });

  // Tool setter bridging
  window.dsTool = function(t) {
    if(typeof setTool==='function') setTool(t);
    // Update toolbar UI
    document.querySelectorAll('.ds-tool').forEach(b=>b.classList.remove('active'));
    const btn = document.getElementById('dt-'+t);
    if(btn) btn.classList.add('active');
    // Status bar
    const tools={select:'تحديد',text:'نص',rect:'مستطيل',circle:'دائرة',triangle:'مثلث',pen:'قلم'};
    const el=document.getElementById('dsStatusTool');
    if(el) el.textContent='أداة: '+(tools[t]||t);
  };

  // Align helpers
  window.dsAlignLayer = function(dir) {
    const canvas = document.getElementById('designCanvas');
    if(!canvas||typeof layers==='undefined'||!selectedId) return;
    const l = layers.find(x=>x.id===selectedId);
    if(!l) return;
    if(typeof saveHist==='function') saveHist();
    if(dir==='hcenter') l.x = canvas.width/2 - l.w/2;
    if(dir==='vcenter') l.y = canvas.height/2 - l.h/2;
    if(typeof drawAll==='function') drawAll();
  };

  // Lock ratio
  let _locked = false;
  window.dsToggleLock = function() {
    _locked = !_locked;
    const btn = document.getElementById('lockBtn');
    if(btn) btn.textContent = _locked ? '🔒' : '🔓';
  };

  // Text style toggles
  window.dsToggleTxtStyle = function(style) {
    if(typeof layers==='undefined'||!selectedId) return;
    const l = layers.find(x=>x.id===selectedId);
    if(!l||l.type!=='text') return;
    if(typeof saveHist==='function') saveHist();
    if(style==='bold')      l.bold      = !l.bold;
    if(style==='italic')    l.italic    = !l.italic;
    if(style==='underline') l.underline = !l.underline;
    if(typeof drawAll==='function') drawAll();
    ['bold','italic','underline'].forEach(s=>{
      const btn=document.getElementById('tb'+s.charAt(0).toUpperCase()+s.slice(1));
      if(btn) btn.classList.toggle('active-btn', l[s]);
    });
  };

  // Bg color direct setter
  window.dsSetBg = function(c) {
    if(typeof bgColorVal!=='undefined') window.bgColorVal=c;
    if(typeof drawAll==='function') drawAll();
  };

  // Download
  window.dsDownload = function() { if(typeof downloadDesign==='function') downloadDesign(); };
  window.dsSaveCart = function() { if(typeof saveToCart==='function') saveToCart(); };
  window.dsUndo = function()     { if(typeof undoAction==='function') undoAction(); };
  window.dsRedo = function()     { if(typeof redoAction==='function') redoAction(); };
  window.dsClearCanvas = function() {
    if(typeof clearCanvas==='function'){ if(typeof saveHist==='function') saveHist(); clearCanvas(); }
  };

  // Update undo/redo buttons state
  window.updateUndoRedoUI = function() {
    const u = document.getElementById("dsUndoBtn");
    const r = document.getElementById("dsRedoBtn");
    if (u) u.disabled = (typeof history!=='undefined') ? history.length === 0 : true;
    if (r) r.disabled = (typeof redoStack!=='undefined') ? redoStack.length === 0 : true;
  };
  window.dsBringForward = function()  { if(typeof bringForward==='function') bringForward(); };
  window.dsSendBackward = function()  { if(typeof sendBackward==='function') sendBackward(); };
  window.dsFlipH = function()         { if(typeof flipH==='function') flipH(); };
  window.dsFlipV = function()         { if(typeof flipV==='function') flipV(); };
  window.dsUploadImage = function(e)  { if(typeof uploadImage==='function') uploadImage(e); };

  // Opacity slider sync (shapeOpacity is now a range, but designer.js reads the hidden number input)
  document.addEventListener('input', e=>{
    if(e.target.id==='shapeOpacity'){
      const h = document.getElementById('shapeOpacityHidden');
      if(h) h.value = e.target.value;
    }
  });

  // Layer count updater — patch drawAll
  const _orig_notifyChange = window.notifyChange;
  window.notifyChange = function(){
    if(_orig_notifyChange) _orig_notifyChange.apply(this,arguments);
    try {
      const cnt = (typeof layers!=='undefined') ? layers.length : 0;
      ['dsLayerCount','dsLayerCountStatus'].forEach(id=>{
        const el=document.getElementById(id); if(el) el.textContent=cnt;
      });
    } catch(e){}
  };

  // Keyboard shortcuts
  document.addEventListener('keydown', e=>{
    const dm=document.getElementById('designerModal');
    if(!dm||!dm.classList.contains('open')) return;
    if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.tagName==='SELECT') return;
    if(e.key==='v'||e.key==='V') dsTool('select');
    if(e.key==='t'||e.key==='T') dsTool('text');
    if(e.key==='r'||e.key==='R') dsTool('rect');
    if(e.key==='c'||e.key==='C') dsTool('circle');
    if(e.key==='Delete'||e.key==='Backspace') { if(typeof deleteSelected==='function') deleteSelected(); }
    if((e.ctrlKey||e.metaKey)&&e.key==='z') { e.preventDefault(); if(typeof undoAction==='function') undoAction(); }
    if((e.ctrlKey||e.metaKey)&&e.key==='d') { e.preventDefault(); if(typeof duplicateSelected==='function') duplicateSelected(); }
    if(e.key==='+'||e.key==='=') dsZoom(0.1);
    if(e.key==='-') dsZoom(-0.1);
    if(e.key==='0') { _zoom=1; const w=document.getElementById('dsCanvasWrap'); if(w) w.style.transform='scale(1)'; document.getElementById('dsZoomVal').textContent='100%'; }
    if(e.key==='Escape') closeDesignerModal();
  });

})();
