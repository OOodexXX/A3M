// ============================================================
// canvas-patches.js  —  A3M Print
// يحل المشاكل التالية:
// 1. Right-click context menu
// 2. State persistence (حفظ الحالة عند إعادة الفتح)
// 3. Multi-select: Ctrl+Click + drag-to-select (marquee)
// 4. Text resize fix (تكبير النص)
// يُحمَّل بعد canvas.js و tools.js
// ============================================================

(function () {
  'use strict';

  // ── انتظر حتى يكون canvas.js جاهزاً ──
  function waitForCanvas(cb, tries) {
    tries = tries || 0;
    if (window._A3MCanvas) { cb(); return; }
    if (tries > 80) { console.warn('A3M patches: _A3MCanvas not found'); return; }
    setTimeout(function () { waitForCanvas(cb, tries + 1); }, 50);
  }

  waitForCanvas(function () {
    var C = window._A3MCanvas;

    // ════════════════════════════════════════════════════════════
    // 1. STATE PERSISTENCE — حفظ واستعادة حالة الكانفاس
    // ════════════════════════════════════════════════════════════

    var STORAGE_KEY = 'a3m_canvas_state_v1';

    // حفظ الحالة بعد كل تغيير
    function saveState() {
      try {
        var state = {
          layers: JSON.parse(JSON.stringify(C.layers || [])),
          bgColorVal: C.bgColorVal,
          canvasProdType: C.canvasProdType,
          ts: Date.now()
        };
        // حذف بيانات الصور الكبيرة جداً (اختياري للأداء)
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) { /* ignore quota errors */ }
    }

    // استعادة الحالة
    function restoreState() {
      try {
        var raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return false;
        var state = JSON.parse(raw);
        if (!state || !state.layers) return false;
        // استعد فقط إذا الكانفاس فارغ
        if (C.layers && C.layers.length > 0) return false;
        C.layers = state.layers;
        if (state.bgColorVal) C.bgColorVal = state.bgColorVal;
        if (state.canvasProdType) {
          C.canvasProdType = state.canvasProdType;
          var sel = document.getElementById('canvasProduct');
          if (sel) sel.value = state.canvasProdType;
        }
        if (typeof drawAll === 'function') drawAll();
        if (typeof updateLayersList === 'function') updateLayersList();
        return true;
      } catch (e) { return false; }
    }

    // Patch notifyChange لحفظ بعد كل تغيير
    var _origNC = window.notifyChange;
    window.notifyChange = function () {
      if (_origNC) _origNC.apply(this, arguments);
      saveState();
    };

    // استعادة عند فتح الديزاينر
    var _origOpen = window.openDesigner;
    window.openDesigner = function (mode) {
      if (_origOpen) _origOpen.apply(this, arguments);
      // انتظر قليلاً حتى يُهيأ الكانفاس ثم استعد الحالة
      setTimeout(function () {
        if (mode !== 'fresh') restoreState();
      }, 150);
    };

    // امسح الحالة عند مسح الكانفاس
    var _origClear = window.clearCanvas;
    window.clearCanvas = function () {
      sessionStorage.removeItem(STORAGE_KEY);
      if (_origClear) _origClear.apply(this, arguments);
    };

    // ════════════════════════════════════════════════════════════
    // 2. RIGHT-CLICK CONTEXT MENU — إصلاح
    // ════════════════════════════════════════════════════════════

    var canvas = document.getElementById('designCanvas');
    if (!canvas) {
      // انتظر حتى يُنشأ الكانفاس
      var observer = new MutationObserver(function () {
        canvas = document.getElementById('designCanvas');
        if (canvas) { observer.disconnect(); attachRightClick(); attachMarquee(); }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    } else {
      attachRightClick();
      attachMarquee();
    }

    function getCanvasPoint(e) {
      var rect = canvas.getBoundingClientRect();
      var scaleX = canvas.width  / rect.width;
      var scaleY = canvas.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top)  * scaleY
      };
    }

    function hitTest(layer, px, py) {
      var x = layer.x || 0, y = layer.y || 0;
      var w = layer.w || layer.width  || 100;
      var h = layer.h || layer.height || 40;
      if (layer.type === 'text') {
        // للنص: استخدم boundingBox إذا كان موجوداً
        if (layer.boundingBox) {
          var bb = layer.boundingBox;
          return px >= bb.x && px <= bb.x + bb.w && py >= bb.y && py <= bb.y + bb.h;
        }
        var fs = layer.fontSize || 40;
        var est = (layer.text || '').length * fs * 0.55;
        return px >= x - est/2 && px <= x + est/2 && py >= y - fs && py <= y + fs * 0.3;
      }
      if (layer.type === 'circle') {
        var r = layer.radius || w/2;
        var dx = px - x, dy = py - y;
        return dx*dx + dy*dy <= r*r;
      }
      return px >= x - w/2 && px <= x + w/2 && py >= y - h/2 && py <= y + h/2;
    }

    function findLayerAt(px, py) {
      var layers = C.layers || [];
      for (var i = layers.length - 1; i >= 0; i--) {
        if (layers[i].hidden) continue;
        if (hitTest(layers[i], px, py)) return layers[i];
      }
      return null;
    }

    // ── Context Menu DOM ──
    var ctxMenu = document.getElementById('a3m-ctx-menu');
    if (!ctxMenu) {
      ctxMenu = document.createElement('div');
      ctxMenu.id = 'a3m-ctx-menu';
      ctxMenu.style.cssText = [
        'position:fixed;z-index:99999;min-width:160px',
        'background:#111827;border:1px solid rgba(124,58,237,.3)',
        'border-radius:10px;padding:.3rem 0;box-shadow:0 12px 40px rgba(0,0,0,.7)',
        'font-family:Cairo,sans-serif;display:none;user-select:none'
      ].join(';');
      document.body.appendChild(ctxMenu);
    }

    function ctxItem(icon, label, fn, danger) {
      var div = document.createElement('div');
      div.className = 'a3m-ctx-item';
      div.style.cssText = [
        'display:flex;align-items:center;gap:.55rem',
        'padding:.48rem 1rem;font-size:13px;cursor:pointer',
        'color:' + (danger ? '#f87171' : '#d1d5db'),
        'transition:background .1s'
      ].join(';');
      div.innerHTML = '<span style="font-size:14px;width:18px;text-align:center">' + icon + '</span>' + label;
      div.onmouseenter = function () { div.style.background = danger ? 'rgba(239,68,68,.12)' : 'rgba(255,255,255,.06)'; };
      div.onmouseleave = function () { div.style.background = ''; };
      div.onclick = function (e) { e.stopPropagation(); closeCtx(); fn(); };
      return div;
    }

    function ctxSep() {
      var hr = document.createElement('div');
      hr.style.cssText = 'height:1px;background:rgba(255,255,255,.06);margin:.25rem 0';
      return hr;
    }

    function closeCtx() { ctxMenu.style.display = 'none'; }

    document.addEventListener('click',  closeCtx);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeCtx(); });

    function showCtxMenu(e, layer) {
      e.preventDefault();
      e.stopPropagation();
      ctxMenu.innerHTML = '';

      var items = [];

      if (layer) {
        // ── عنصر محدد ──
        items.push(ctxItem('⊕', 'نسخ', function () { if (typeof duplicateSelected === 'function') duplicateSelected(); }));
        items.push(ctxItem('🔒', layer.locked ? 'فك القفل' : 'قفل', function () { if (typeof lockSelected === 'function') lockSelected(); }));
        items.push(ctxItem('👁', layer.hidden ? 'إظهار' : 'إخفاء', function () {
          layer.hidden = !layer.hidden;
          if (typeof drawAll === 'function') drawAll();
          if (typeof updateLayersList === 'function') updateLayersList();
          if (typeof notifyChange === 'function') notifyChange();
        }));
        items.push(ctxSep());
        items.push(ctxItem('⬆', 'للأمام', function () { if (typeof bringForward === 'function') bringForward(); }));
        items.push(ctxItem('⬇', 'للخلف',  function () { if (typeof sendBackward === 'function') sendBackward(); }));
        items.push(ctxItem('⏫', 'للأمام الكامل', function () { if (typeof bringToFront === 'function') bringToFront(); }));
        items.push(ctxItem('⏬', 'للخلف الكامل', function () { if (typeof sendToBack === 'function') sendToBack(); }));
        items.push(ctxSep());
        items.push(ctxItem('↔', 'قلب أفقي', function () { if (typeof flipH === 'function') flipH(); }));
        items.push(ctxItem('↕', 'قلب رأسي', function () { if (typeof flipV === 'function') flipV(); }));
        if (layer.type === 'image') {
          items.push(ctxSep());
          items.push(ctxItem('✂️', 'تحرير الصورة', function () { if (typeof openImageEditor === 'function') openImageEditor(); }));
        }
        items.push(ctxSep());
        items.push(ctxItem('✕', 'حذف', function () { if (typeof deleteSelected === 'function') deleteSelected(); }, true));
      } else {
        // ── كانفاس فارغ ──
        items.push(ctxItem('↩', 'تراجع', function () { if (typeof undoAction === 'function') undoAction(); }));
        items.push(ctxItem('↪', 'إعادة',  function () { if (typeof redoAction === 'function') redoAction(); }));
        items.push(ctxSep());
        items.push(ctxItem('T', 'إضافة نص',      function () { if (typeof addText === 'function') addText(); }));
        items.push(ctxItem('▭', 'إضافة مستطيل', function () { if (typeof addShape === 'function') addShape('rect'); }));
        items.push(ctxItem('○', 'إضافة دائرة',  function () { if (typeof addShape === 'function') addShape('circle'); }));
        items.push(ctxSep());
        items.push(ctxItem('🗑', 'مسح الكل',     function () { if (typeof clearCanvas === 'function') clearCanvas(); }, true));
      }

      items.forEach(function (el) { ctxMenu.appendChild(el); });

      // Position
      var vw = window.innerWidth, vh = window.innerHeight;
      var mw = 180, mh = items.length * 34;
      var left = Math.min(e.clientX, vw - mw - 8);
      var top  = Math.min(e.clientY, vh - mh - 8);
      ctxMenu.style.left    = left + 'px';
      ctxMenu.style.top     = top  + 'px';
      ctxMenu.style.display = 'block';
    }

    function attachRightClick() {
      canvas = document.getElementById('designCanvas');
      if (!canvas) return;
      canvas.addEventListener('contextmenu', function (e) {
        var dm = document.getElementById('designerModal');
        if (!dm || !dm.classList.contains('open')) return;
        var pt = getCanvasPoint(e);
        var layer = findLayerAt(pt.x, pt.y);
        if (layer) {
          // حدد العنصر أولاً
          C.selectedId = layer.id;
          if (typeof drawAll === 'function') drawAll();
          if (typeof updateLayersList === 'function') updateLayersList();
          if (typeof updatePanelFromSelected === 'function') updatePanelFromSelected();
        }
        showCtxMenu(e, layer);
      });
    }

    // ════════════════════════════════════════════════════════════
    // 3. MULTI-SELECT: Ctrl+Click + Marquee (drag selection)
    // ════════════════════════════════════════════════════════════

    // multiSelectedIds: مصفوفة IDs العناصر المحددة
    if (!C.multiSelectedIds) C.multiSelectedIds = [];

    // Marquee overlay
    var marqueeEl = document.getElementById('a3m-marquee');
    if (!marqueeEl) {
      marqueeEl = document.createElement('div');
      marqueeEl.id = 'a3m-marquee';
      marqueeEl.style.cssText = [
        'position:absolute;border:1.5px dashed rgba(124,58,237,.8)',
        'background:rgba(124,58,237,.08);pointer-events:none',
        'display:none;z-index:50;border-radius:2px'
      ].join(';');
      var wrap = document.getElementById('dsCanvasWrap') || document.querySelector('.d-canvas-wrap');
      if (wrap) wrap.appendChild(marqueeEl);
    }

    function attachMarquee() {
      canvas = document.getElementById('designCanvas');
      if (!canvas) return;

      var isMarquee = false;
      var marqueeStart = null;

      canvas.addEventListener('mousedown', function (e) {
        var dm = document.getElementById('designerModal');
        if (!dm || !dm.classList.contains('open')) return;
        if (e.button !== 0) return;

        var pt = getCanvasPoint(e);
        var layer = findLayerAt(pt.x, pt.y);

        // Ctrl+Click: toggle selection
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          if (layer) {
            var idx = C.multiSelectedIds.indexOf(layer.id);
            if (idx === -1) {
              C.multiSelectedIds.push(layer.id);
              C.selectedId = layer.id;
            } else {
              C.multiSelectedIds.splice(idx, 1);
              C.selectedId = C.multiSelectedIds.length ? C.multiSelectedIds[C.multiSelectedIds.length - 1] : null;
            }
            if (typeof drawAll === 'function') drawAll();
            if (typeof updateLayersList === 'function') updateLayersList();
            highlightMultiLayers();
          }
          return;
        }

        // إذا ضغط على فراغ: ابدأ Marquee selection
        if (!layer && window._A3MCanvas && (C.currentTool === 'select' || !C.currentTool)) {
          isMarquee = true;
          marqueeStart = { x: e.clientX, y: e.clientY, cx: pt.x, cy: pt.y };
          marqueeEl.style.display = 'block';
          marqueeEl.style.left   = e.clientX - canvas.getBoundingClientRect().left + 'px';
          marqueeEl.style.top    = e.clientY - canvas.getBoundingClientRect().top  + 'px';
          marqueeEl.style.width  = '0px';
          marqueeEl.style.height = '0px';
          // امسح التحديد الحالي
          C.multiSelectedIds = [];
          C.selectedId = null;
          if (typeof drawAll === 'function') drawAll();
        }
      }, true);

      document.addEventListener('mousemove', function (e) {
        if (!isMarquee || !marqueeStart) return;
        var rect = canvas.getBoundingClientRect();
        var x1 = Math.min(e.clientX, marqueeStart.x) - rect.left;
        var y1 = Math.min(e.clientY, marqueeStart.y) - rect.top;
        var w  = Math.abs(e.clientX - marqueeStart.x);
        var h  = Math.abs(e.clientY - marqueeStart.y);
        marqueeEl.style.left   = x1 + 'px';
        marqueeEl.style.top    = y1 + 'px';
        marqueeEl.style.width  = w  + 'px';
        marqueeEl.style.height = h  + 'px';
      });

      document.addEventListener('mouseup', function (e) {
        if (!isMarquee || !marqueeStart) return;
        isMarquee = false;
        marqueeEl.style.display = 'none';

        // حوّل إحداثيات الشاشة لإحداثيات الكانفاس
        var pt2 = getCanvasPoint(e);
        var x1 = Math.min(marqueeStart.cx, pt2.x);
        var y1 = Math.min(marqueeStart.cy, pt2.y);
        var x2 = Math.max(marqueeStart.cx, pt2.x);
        var y2 = Math.max(marqueeStart.cy, pt2.y);

        // تجاهل إذا المستطيل صغير جداً
        if (x2 - x1 < 5 && y2 - y1 < 5) { marqueeStart = null; return; }

        // اختر كل العناصر التي تقع داخل المستطيل
        var layers = C.layers || [];
        C.multiSelectedIds = [];
        layers.forEach(function (layer) {
          if (layer.hidden) return;
          var lx = layer.x || 0, ly = layer.y || 0;
          // نقطة مركز العنصر أو حدوده
          var lx1, ly1, lx2, ly2;
          if (layer.type === 'text') {
            var fs = layer.fontSize || 40;
            var est = (layer.text || '').length * fs * 0.55;
            lx1 = lx - est/2; lx2 = lx + est/2;
            ly1 = ly - fs;    ly2 = ly + fs * 0.3;
          } else {
            var w = layer.w || layer.width  || layer.radius * 2 || 100;
            var h = layer.h || layer.height || layer.radius * 2 || 40;
            lx1 = lx - w/2; lx2 = lx + w/2;
            ly1 = ly - h/2; ly2 = ly + h/2;
          }
          // تحقق من التقاطع
          if (lx2 >= x1 && lx1 <= x2 && ly2 >= y1 && ly1 <= y2) {
            C.multiSelectedIds.push(layer.id);
          }
        });

        if (C.multiSelectedIds.length > 0) {
          C.selectedId = C.multiSelectedIds[C.multiSelectedIds.length - 1];
          if (typeof drawAll === 'function') drawAll();
          if (typeof updateLayersList === 'function') updateLayersList();
          if (typeof updatePanelFromSelected === 'function') updatePanelFromSelected();
          highlightMultiLayers();
          if (typeof showToast === 'function') showToast('✦ تم تحديد ' + C.multiSelectedIds.length + ' عنصر');
        }
        marqueeStart = null;
      });
    }

    // تظليل العناصر المحددة متعددة في قائمة الطبقات
    function highlightMultiLayers() {
      document.querySelectorAll('.layer-item').forEach(function (el) {
        var id = el.dataset.id || el.getAttribute('data-id');
        if (id && C.multiSelectedIds.indexOf(id) !== -1) {
          el.classList.add('multi-selected');
        } else {
          el.classList.remove('multi-selected');
        }
      });
    }

    // Patch drawAll لرسم highlight للعناصر المحددة متعدداً
    var _origDrawAll = window.drawAll;
    window.drawAll = function () {
      if (_origDrawAll) _origDrawAll.apply(this, arguments);
      // ارسم highlight لكل عناصر multi-select بعد drawAll
      if (C.multiSelectedIds && C.multiSelectedIds.length > 1) {
        var cv = document.getElementById('designCanvas');
        if (!cv) return;
        var ctx = cv.getContext('2d');
        var layers = C.layers || [];
        C.multiSelectedIds.forEach(function (id) {
          if (id === C.selectedId) return; // المحدد الرئيسي يُرسم من canvas.js
          var layer = layers.find(function (l) { return l.id === id; });
          if (!layer) return;
          ctx.save();
          ctx.strokeStyle = 'rgba(37,99,235,0.7)';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 4]);
          var x = layer.x || 0, y = layer.y || 0;
          if (layer.type === 'text') {
            var fs = layer.fontSize || 40;
            var est = (layer.text || '').length * fs * 0.55;
            ctx.strokeRect(x - est/2 - 6, y - fs - 4, est + 12, fs * 1.4 + 8);
          } else {
            var w = layer.w || layer.width  || layer.radius * 2 || 100;
            var h = layer.h || layer.height || layer.radius * 2 || 40;
            ctx.strokeRect(x - w/2 - 6, y - h/2 - 6, w + 12, h + 12);
          }
          ctx.restore();
        });
      }
    };

    // امسح multi-select عند الضغط خارج الكانفاس
    document.addEventListener('mousedown', function (e) {
      if (!canvas) return;
      if (!canvas.contains(e.target) && !e.ctrlKey && !e.metaKey) {
        C.multiSelectedIds = [];
        highlightMultiLayers();
      }
    });

    // Delete/Backspace يحذف كل المحددات
    document.addEventListener('keydown', function (e) {
      var dm = document.getElementById('designerModal');
      if (!dm || !dm.classList.contains('open')) return;
      var tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if ((e.key === 'Delete' || e.key === 'Backspace') && C.multiSelectedIds && C.multiSelectedIds.length > 1) {
        e.preventDefault();
        if (typeof saveHist === 'function') saveHist();
        C.multiSelectedIds.forEach(function (id) {
          C.layers = (C.layers || []).filter(function (l) { return l.id !== id; });
        });
        C.selectedId = null;
        C.multiSelectedIds = [];
        if (typeof drawAll === 'function') drawAll();
        if (typeof updateLayersList === 'function') updateLayersList();
        if (typeof notifyChange === 'function') notifyChange();
      }

      // Ctrl+A = تحديد الكل
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        var dm2 = document.getElementById('designerModal');
        if (!dm2 || !dm2.classList.contains('open')) return;
        C.multiSelectedIds = (C.layers || []).filter(function (l) { return !l.hidden; }).map(function (l) { return l.id; });
        if (C.multiSelectedIds.length) C.selectedId = C.multiSelectedIds[C.multiSelectedIds.length - 1];
        if (typeof drawAll === 'function') drawAll();
        if (typeof updateLayersList === 'function') updateLayersList();
        highlightMultiLayers();
        if (typeof showToast === 'function') showToast('✦ تم تحديد الكل (' + C.multiSelectedIds.length + ')');
      }
    });

    // ════════════════════════════════════════════════════════════
    // 4. TEXT RESIZE FIX — إصلاح تكبير النص
    // ════════════════════════════════════════════════════════════

    // المشكلة: txtSize input لا يُحدث حجم النص بشكل صحيح
    // السبب الغالب: syncSelected لا تقرأ txtSize بشكل صحيح أو وحدة القياس خاطئة

    // Patch syncSelected لضمان تحديث fontSize
    var _origSync = window.syncSelected;
    window.syncSelected = function () {
      // أولاً نفذ الأصلية
      if (_origSync) _origSync.apply(this, arguments);

      // تحقق من txtSize يدوياً وطبّقه
      var sizeEl = document.getElementById('txtSize');
      if (!sizeEl) return;
      var fs = parseInt(sizeEl.value, 10);
      if (!fs || fs < 1 || fs > 2000) return;

      var layers = C.layers || [];
      var selId  = C.selectedId;
      if (!selId) return;
      var layer = layers.find(function (l) { return l.id === selId; });
      if (!layer || layer.type !== 'text') return;

      if (layer.fontSize !== fs) {
        layer.fontSize = fs;
        if (typeof drawAll === 'function') drawAll();
        if (typeof notifyChange === 'function') notifyChange();
      }
    };

    // إصلاح مباشر: عند تغيير txtSize
    function patchTxtSizeInput() {
      var input = document.getElementById('txtSize');
      if (!input || input._a3mPatched) return;
      input._a3mPatched = true;
      input.addEventListener('input', function () {
        var fs = parseInt(this.value, 10);
        if (!fs || fs < 1) return;
        var layers = C.layers || [];
        var selId  = C.selectedId;
        if (!selId) return;
        var layer = layers.find(function (l) { return l.id === selId; });
        if (!layer || layer.type !== 'text') return;
        layer.fontSize = fs;
        if (typeof drawAll === 'function') drawAll();
        if (typeof notifyChange === 'function') notifyChange();
        // أيضاً حدّث الـ display value
        var valEl = document.getElementById('txtSzVal');
        if (valEl) valEl.textContent = fs;
      });
      input.addEventListener('change', function () {
        var fs = parseInt(this.value, 10);
        if (!fs || fs < 1) return;
        var layers = C.layers || [];
        var selId  = C.selectedId;
        if (!selId) return;
        var layer = layers.find(function (l) { return l.id === selId; });
        if (!layer || layer.type !== 'text') return;
        layer.fontSize = fs;
        if (typeof drawAll === 'function') drawAll();
        if (typeof notifyChange === 'function') notifyChange();
      });
    }

    // حاول patch فوراً وأيضاً عند فتح الديزاينر
    patchTxtSizeInput();
    document.addEventListener('DOMContentLoaded', patchTxtSizeInput);
    var _origOpenDs = window.openDesigner;
    if (!window._patchedOpenForTxtSize) {
      window._patchedOpenForTxtSize = true;
      var prevOpen = window.openDesigner;
      window.openDesigner = function () {
        var result = prevOpen ? prevOpen.apply(this, arguments) : undefined;
        setTimeout(patchTxtSizeInput, 200);
        return result;
      };
    }

    // Patch updatePanelFromSelected لضمان صحة قراءة fontSize
    var _origUpdate = window.updatePanelFromSelected;
    window.updatePanelFromSelected = function () {
      if (_origUpdate) _origUpdate.apply(this, arguments);
      var layer = (C.layers || []).find(function (l) { return l.id === C.selectedId; });
      if (!layer || layer.type !== 'text') return;
      var sizeEl = document.getElementById('txtSize');
      var valEl  = document.getElementById('txtSzVal');
      if (sizeEl && layer.fontSize) {
        sizeEl.value = layer.fontSize;
        if (valEl) valEl.textContent = layer.fontSize;
      }
    };

    // ════════════════════════════════════════════════════════════
    // 5. FIXES للأخطاء في الكونسل
    // ════════════════════════════════════════════════════════════

    // إصلاح querySelector invalid selector
    var _origQS = document.querySelector.bind(document);
    document.querySelector = function (sel) {
      try { return _origQS(sel); }
      catch (e) { console.warn('A3M: invalid selector ignored:', sel); return null; }
    };

    // إصلاح querySelectorAll
    var _origQSA = document.querySelectorAll.bind(document);
    document.querySelectorAll = function (sel) {
      try { return _origQSA(sel); }
      catch (e) { console.warn('A3M: invalid selectorAll ignored:', sel); return []; }
    };

    console.log('%c✅ A3M Canvas Patches loaded', 'color:#c9a84c;font-weight:700;font-size:12px');
  });

})();
