// ============================================================
// scripts/ui/product-selector.js  —  A3M Print
// Product Selector Flow — psPickMode, psPickCat, psPickSubcat, openProductSelector
// ============================================================

(function(){
  'use strict';

  const CATS = [
    { id:'mugs',        icon:'☕', img:'assets/images/mugs/black_mug.jpg',              ar:'أكواب',           en:'Mugs',         hasSub:false, scratchSoon:true  },
    { id:'cap',         icon:'🧢', img:'assets/images/caps/black_cap_model3.jpg',        ar:'كابات',           en:'Cap',          hasSub:false, scratchSoon:true  },
    { id:'tshirt',      icon:'👕', img:'assets/images/tshirts/black_tshirt.jpg',                                         ar:'تيشيرت',          en:'T-Shirt',      hasSub:false, scratchSoon:true  },
    { id:'hoodie',      icon:'🧥', img:'assets/images/hoodies/black_hoodie.jpg',                                         ar:'هودي',            en:'Hoodie',       hasSub:false, scratchSoon:true  },
    { id:'papers',      icon:'📄', img:'assets/images/papers/a4_paper.jpg',                                         ar:'أوراق',           en:'Papers',       hasSub:true,  scratchSoon:true  },
    { id:'packs',       icon:'📦', img:'assets/images/packs/hand_pack.jpg',                                         ar:'حقائب وباكات',   en:'Packs',        hasSub:true,  scratchSoon:true  },
    { id:'accessories', icon:'🔑', img:'assets/images/accessories/keychain.jpg',                                         ar:'إكسسوارات',       en:'Accessories',  hasSub:true,  scratchSoon:true  },
    { id:'stamps',      icon:'🔖', img:'assets/images/stamps/square_stamp.jpg',                                         ar:'أختام',           en:'Stamps',       hasSub:'size',scratchSoon:false },
  ];

  const SUBCATS = {
    papers: [
      { id:'a0', icon:'📋', label:'A0', desc:'84.1 × 118.9 cm' },
      { id:'a1', icon:'📋', label:'A1', desc:'59.4 × 84.1 cm' },
      { id:'a2', icon:'📋', label:'A2', desc:'42.0 × 59.4 cm' },
      { id:'a3', icon:'📋', label:'A3', desc:'29.7 × 42.0 cm' },
      { id:'a4', icon:'📋', label:'A4', desc:'21.0 × 29.7 cm' },
      { id:'a5', icon:'📋', label:'A5', desc:'14.8 × 21.0 cm' },
    ],
    packs: [
      { id:'hand',      icon:'👜', label:'Hand Pack',      desc:'حقيبة يد' },
      { id:'packaging', icon:'📦', label:'Packaging Pack', desc:'تغليف احترافي' },
      { id:'back',      icon:'🎒', label:'Back Pack',      desc:'حقيبة ظهر' },
    ],
    accessories: [
      { id:'keychain', icon:'🔑', label:'Key Chain', desc:'سلسلة مفاتيح' },
      { id:'pin',      icon:'📌', label:'Pin Badge', desc:'بادج دبوس' },
    ],
  };

  const STAMP_SIZES = [
    { id:'sq20', shape:'square', label:'20×20 mm', w:20, h:20 },
    { id:'sq30', shape:'square', label:'30×30 mm', w:30, h:30 },
    { id:'sq40', shape:'square', label:'40×40 mm', w:40, h:40 },
    { id:'rc40', shape:'rect',   label:'40×25 mm', w:40, h:25 },
    { id:'rc50', shape:'rect',   label:'50×30 mm', w:50, h:30 },
    { id:'rc60', shape:'rect',   label:'60×40 mm', w:60, h:40 },
    { id:'ci30', shape:'circle', label:'⌀ 30 mm',  w:30, h:30 },
    { id:'ci40', shape:'circle', label:'⌀ 40 mm',  w:40, h:40 },
    { id:'ci50', shape:'circle', label:'⌀ 50 mm',  w:50, h:50 },
  ];

  const TEMPLATES = {
    mugs:   [{icon:'☕',name:'Classic Mug',bg:'#111'},{icon:'🌊',name:'Wave Pattern',bg:'#0a1628'},{icon:'🔤',name:'Bold Text',bg:'#1a0a2e'},{icon:'🌿',name:'Botanical',bg:'#0a1f0a'}],
    cap:    [{icon:'🧢',name:'Street Style',bg:'#111'},{icon:'🏆',name:'Sports Cap',bg:'#0a1628'},{icon:'✨',name:'Minimal',bg:'#1f1f1f'},{icon:'🔥',name:'Flame',bg:'#1a0800'}],
    tshirt: [{icon:'🅰',name:'Bold Logo',bg:'#111'},{icon:'✏',name:'Graffiti',bg:'#0d0d1a'},{icon:'◻',name:'Minimal',bg:'#fff'},{icon:'𝒮',name:'Script',bg:'#fafaf5'},{icon:'🛸',name:'Orbitron',bg:'#0a0a1a'},{icon:'🏅',name:'Classic',bg:'#111'}],
    hoodie: [{icon:'🧥',name:'Urban',bg:'#111'},{icon:'🌙',name:'Night Vibe',bg:'#0a0a1a'},{icon:'⚡',name:'Electric',bg:'#001a1a'},{icon:'🎭',name:'Art Drop',bg:'#1a001a'}],
    papers: [{icon:'📄',name:'Clean Layout',bg:'#fff'},{icon:'📐',name:'Grid Style',bg:'#f8f8ff'},{icon:'🎨',name:'Colorful',bg:'#fff0f5'},{icon:'🖋',name:'Letterhead',bg:'#fffff0'}],
    packs:  [{icon:'📦',name:'Minimal Box',bg:'#fff'},{icon:'🌈',name:'Vibrant',bg:'#fff'},{icon:'🤍',name:'Clean White',bg:'#f5f5f5'}],
    accessories:[{icon:'🔑',name:'Chain Classic',bg:'#111'},{icon:'🌟',name:'Star Shape',bg:'#0a0a1a'},{icon:'💎',name:'Premium',bg:'#0a1628'}],
    stamps: [{icon:'🔖',name:'Business',bg:'#fff'},{icon:'🎨',name:'Creative',bg:'#fffff0'},{icon:'📮',name:'Postal Style',bg:'#fff5e0'},{icon:'💼',name:'Corporate',bg:'#f0f4ff'}],
  };

  let psMode = null, psCat = null, psSubcat = null, psStampSize = null;
  let psHistory = [];

  function psShowScreen(id) {
    document.querySelectorAll('.ps-screen').forEach(s=>s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    psBuildBreadcrumb();
  }

  function psBuildBreadcrumb() {
    const bc = document.getElementById('psBreadcrumb');
    if(!bc) return;
    const items = [];
    if(psMode) items.push({label: psMode==='scratch'?'من الصفر':'قوالب جاهزة'});
    if(psCat) { const c=CATS.find(x=>x.id===psCat); items.push({label:c?c.ar:psCat}); }
    if(psSubcat) items.push({label:psSubcat.toUpperCase()});
    if(psStampSize) items.push({label:psStampSize});
    bc.innerHTML = items.map((it,i)=>`${i>0?'<span class="ps-bc-sep">›</span>':''}<span class="ps-bc-item active">${it.label}</span>`).join('');
  }

  window.openProductSelector = function() {
    psMode=null; psCat=null; psSubcat=null; psStampSize=null; psHistory=[];
    psShowScreen('ps-s0');
    document.getElementById('psOverlay').classList.add('open');
    // close old modePicker if present
    const mp = document.getElementById('modePicker');
    if(mp) mp.style.display='none';
  };

  window.closeProductSelector = function() {
    document.getElementById('psOverlay').classList.remove('open');
  };

  window.psPickMode = function(mode) {
    psMode = mode;
    psHistory.push('ps-s0');
    // Build category screen
    const s1sub = document.getElementById('ps-s1-sub');
    if(s1sub) s1sub.textContent = mode==='scratch' ? 'اختر نوع المنتج — ستبدأ بلوحة فارغة تتحكم بأبعادها' : 'اختر نوع المنتج الذي تريد تصميمه';

    const grid = document.getElementById('psCatGrid');
    grid.innerHTML = CATS.map(c => {
      const isSoon = mode==='scratch' && c.scratchSoon;
      const iconHtml = c.img
        ? `<div class="ps-cc-img-wrap"><img src="${c.img}" alt="${c.ar}" class="ps-cc-img" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"/><span class="ps-cc-icon" style="display:none">${c.icon}</span></div>`
        : `<span class="ps-cc-icon">${c.icon}</span>`;
      return `<div class="ps-cat-card ${isSoon?'cs':''}" onclick="${isSoon?'':(`psPickCat('${c.id}')`)}">
        ${isSoon?'<span class="ps-cs-badge">قريبًا</span>':''}
        ${iconHtml}
        <div class="ps-cc-title">${c.ar}</div>
        <div class="ps-cc-en">${c.en}</div>
      </div>`;
    }).join('');
    psShowScreen('ps-s1');
  };

  window.psPickCat = function(catId) {
    psCat = catId;
    psHistory.push('ps-s1');
    const cat = CATS.find(c=>c.id===catId);

    if(cat.hasSub === 'size') {
      // Stamps: go to size picker
      psBuildStampSizes();
      psShowScreen('ps-s3');
    } else if(cat.hasSub && SUBCATS[catId]) {
      // Has sub-categories
      const s2title = document.getElementById('ps-s2-title');
      const s2sub   = document.getElementById('ps-s2-sub');
      if(s2title) s2title.innerHTML = `اختر <span>${cat.ar}</span>`;
      if(s2sub)   s2sub.textContent = '';
      const grid = document.getElementById('psSubGrid');
      grid.innerHTML = SUBCATS[catId].map(item=>`
        <div class="ps-sub-card" onclick="psPickSubcat('${item.id}')">
          <span class="ps-sub-icon">${item.icon}</span>
          <div class="ps-sub-label">${item.label}</div>
          <div class="ps-sub-desc">${item.desc}</div>
        </div>
      `).join('');
      psShowScreen('ps-s2');
    } else {
      // Go directly to templates or designer
      if(psMode==='template') { psBuildTemplates(catId); psShowScreen('ps-s4'); }
      else { psLaunchScratch(catId); }
    }
  };

  window.psPickSubcat = function(subId) {
    psSubcat = subId;
    psHistory.push('ps-s2');
    if(psMode==='template') { psBuildTemplates(psCat); psShowScreen('ps-s4'); }
    else { psLaunchScratch(psCat); }
  };

  function psBuildStampSizes() {
    const grid = document.getElementById('psStampGrid');
    grid.innerHTML = STAMP_SIZES.map(sz=>{
      let svg='';
      if(sz.shape==='circle')
        svg=`<svg width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="none" stroke="#c9a84c" stroke-width="2" stroke-dasharray="5,3"/></svg>`;
      else if(sz.shape==='square')
        svg=`<svg width="48" height="48" viewBox="0 0 48 48"><rect x="4" y="4" width="40" height="40" rx="3" fill="none" stroke="#c9a84c" stroke-width="2" stroke-dasharray="5,3"/></svg>`;
      else
        svg=`<svg width="60" height="40" viewBox="0 0 60 40"><rect x="3" y="3" width="54" height="34" rx="3" fill="none" stroke="#c9a84c" stroke-width="2" stroke-dasharray="5,3"/></svg>`;
      return `<div class="ps-sz-card" onclick="psPickStampSize('${sz.id}','${sz.label}')">
        <div class="ps-sz-shape">${svg}</div>
        <div class="ps-sz-label">${sz.label}</div>
        <div class="ps-sz-type">${sz.shape==='circle'?'دائري':sz.w===sz.h?'مربع':'مستطيل'}</div>
      </div>`;
    }).join('');
  }

  window.psPickStampSize = function(sizeId, label) {
    psStampSize = label;
    psHistory.push('ps-s3');
    if(psMode==='template') { psBuildTemplates('stamps'); psShowScreen('ps-s4'); }
    else { psLaunchScratch('stamps'); }
  };

  function psBuildTemplates(catId) {
    const tmpls = TEMPLATES[catId] || TEMPLATES.tshirt;
    const grid = document.getElementById('psTmplGrid');
    grid.innerHTML = tmpls.map((t,i)=>`
      <div class="ps-tmpl-card" onclick="psPickTemplate('${catId}',${i},'${t.name}')">
        <div class="ps-tmpl-thumb" style="background:${t.bg||'#111'}">
          <span style="font-size:2.4rem">${t.icon}</span>
        </div>
        <div class="ps-tmpl-name">${t.name}</div>
      </div>
    `).join('');
  }

  window.psPickTemplate = function(catId, idx, name) {
    closeProductSelector();
    // Launch designer in template mode
    psLaunchDesigner(catId, name, false);
  };

  function psLaunchScratch(catId) {
    closeProductSelector();
    psLaunchDesigner(catId, null, true);
  }

  function psLaunchDesigner(catId, templateName, isScratch) {
    var cat = CATS.find(function(c){ return c.id===catId; });
    var prodMap = {mugs:'mug',cap:'hat',tshirt:'tshirt',hoodie:'tshirt',papers:'paper',packs:'bag',accessories:'bag',stamps:'paper'};
    var prodType = prodMap[catId] || 'tshirt';

    // Set title in modal topbar
    var titleEl = document.getElementById('topbarTitle');
    if (titleEl) titleEl.textContent = 'Design Studio · ' + (cat ? cat.ar : catId);

    // Set canvas product type
    var cpEl = document.getElementById('canvasProduct');
    if (cpEl) { cpEl.value = prodType; }

    // Scratch size picker
    var sizePicker = document.getElementById('dsSizePicker');
    if (sizePicker) sizePicker.classList.toggle('show', !!isScratch);

    function _launch() {
      if (typeof window.openDesigner === 'function') {
        window.openDesigner(isScratch ? 'scratch' : 'template');
      } else {
        var dm = document.getElementById('designerModal');
        if (dm) dm.classList.add('open');
        setTimeout(function() {
          if (typeof initCanvasRefs === 'function') initCanvasRefs();
          if (typeof bindCanvasEvents === 'function') bindCanvasEvents();
          if (typeof clearCanvas === 'function') clearCanvas();
          if (typeof drawAll === 'function') drawAll();
        }, 80);
      }
      setTimeout(function() {
        if (!isScratch && templateName && window.TEMPLATES) {
          var t = window.TEMPLATES.find(function(x) { return x.name === templateName; });
          if (t && typeof t.fn === 'function') { if (typeof saveHist === 'function') saveHist(); t.fn(); }
        }
        dsBuildTmplMini(catId);
        if (typeof changeProduct === 'function') changeProduct();
        if (typeof translateDesignerUI === 'function') translateDesignerUI();
      }, 250);
    }

    if (window._a3mModulesReady) {
      _launch();
    } else {
      window.addEventListener('a3m-ready', _launch, { once: true });
    }
  }

  function dsBuildTmplMini(catId) {
    const grid = document.getElementById('dsTmplMini');
    if(!grid) return;
    const tmpls = TEMPLATES[catId] || TEMPLATES.tshirt;
    grid.innerHTML = tmpls.map((t,i)=>`
      <div class="ds-tmpl-mini-item" onclick="dsApplyTmpl(${i},'${catId}')" title="${t.name}">
        <span style="font-size:1.4rem">${t.icon}</span>
        <span class="ds-tmpl-mini-name">${t.name}</span>
      </div>
    `).join('');
  }

  window.dsApplyTmpl = function(idx, catId) {
    const tmpls = TEMPLATES[catId] || TEMPLATES.tshirt;
    const t = tmpls[idx];
    if(!t) return;
    // Try to match with designer.js TEMPLATES
    if(window.TEMPLATES) {
      const dt = window.TEMPLATES.find(x=>x.name===t.name);
      if(dt && typeof dt.fn==='function') { if(typeof saveHist==='function') saveHist(); dt.fn(); showToast('✦ '+t.name); return; }
    }
    showToast('✦ '+t.name);
  };

  window.psGoBack = function() {
    if(!psHistory.length) return;
    const prev = psHistory.pop();
    if(prev==='ps-s0') { psMode=null; }
    else if(prev==='ps-s1') { psCat=null; }
    else if(prev==='ps-s2') { psSubcat=null; }
    else if(prev==='ps-s3') { psStampSize=null; }
    psShowScreen(prev);
  };

  window.closeDesignerModal = function() {
    const dm = document.getElementById('designerModal');
    if(dm) dm.classList.remove('open');
  };

  // ── Bridge old openDesigner calls ──
  window.openModePicker = window.openProductSelector;
  window.closeModePicker = window.closeProductSelector;
  // window.openDesigner is set by designer.js — do not override here

})();
