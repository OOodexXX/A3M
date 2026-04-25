// ============================================================
// scripts/ui/product-selector.js  —  A3M Print
// Product Selector Flow — psPickMode, psPickCat, psPickSubcat, openProductSelector
// ============================================================

(function(){
  'use strict';

  const CATS = [
    { id:'mugs',        icon:'☕', img:'assets/images/mugs/white_mug.jpg',              ar:'أكواب',           en:'Mugs',         hasSub:false, scratchSoon:true  },
    { id:'cap',         icon:'🧢', img:'assets/images/caps/bage_cap_model4.jpg',        ar:'كابات',           en:'Cap',          hasSub:false, scratchSoon:true  },
    { id:'tshirt',      icon:'👕', img:'assets/images/tshirts/white_t_model2.jpg',                                         ar:'تيشيرت',          en:'T-Shirt',      hasSub:false, scratchSoon:true  },
    { id:'hoodie',      icon:'🧥', img:'assets/images/hoodies/black_hoodie_model4.jpg',                                         ar:'هودي',            en:'Hoodie',       hasSub:false, scratchSoon:true  },
    { id:'papers',      icon:'📄', img:'null',                                         ar:'أوراق',           en:'Papers',       hasSub:true,  scratchSoon:true  },
    { id:'packs',       icon:'📦', img:'assets/images/Packaging_bags/white_Packaging_bag_model1.jpg',                                         ar:'حقائب وباكات',   en:'Packs',        hasSub:true,  scratchSoon:true  },
    { id:'accessories', icon:'🔑', img:'assets/images/keychains/white_keychain_model1.jpg',                                         ar:'إكسسوارات',       en:'Accessories',  hasSub:true,  scratchSoon:true  },
    { id:'stamps',      icon:'🔖', img:'null',                                         ar:'أختام',           en:'Stamps',       hasSub:'size',scratchSoon:false },
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
    // ── مستطيلة ──
    { id:'rc13x6',  shape:'rect',   label:'13 × 6 mm',  w:13,  h:6  },
    { id:'rc15x7',  shape:'rect',   label:'15 × 7 mm',  w:15,  h:7  },
    { id:'rc25x8',  shape:'rect',   label:'25 × 8 mm',  w:25,  h:8  },
    { id:'rc37x13', shape:'rect',   label:'37 × 13 mm', w:37,  h:13 },
    { id:'rc46x17', shape:'rect',   label:'46 × 17 mm', w:46,  h:17 },
    { id:'rc57x21', shape:'rect',   label:'57 × 21 mm', w:57,  h:21 },
    { id:'rc62x25', shape:'rect',   label:'62 × 25 mm', w:62,  h:25 },
    { id:'rc70x10', shape:'rect',   label:'70 × 10 mm', w:70,  h:10 },
    { id:'rc70x25', shape:'rect',   label:'70 × 25 mm', w:70,  h:25 },
    { id:'rc74x37', shape:'rect',   label:'74 × 37 mm', w:74,  h:37 },
    { id:'rc60x40', shape:'rect',   label:'60 × 40 mm', w:60,  h:40 },
    { id:'rc60x33', shape:'rect',   label:'60 × 33 mm', w:60,  h:33 },
    { id:'rc82x25', shape:'rect',   label:'82 × 25 mm', w:82,  h:25 },
    // ── مربعة ──
    { id:'sq12',    shape:'square', label:'12 × 12 mm', w:12,  h:12 },
    { id:'sq20',    shape:'square', label:'20 × 20 mm', w:20,  h:20 },
    { id:'sq25',    shape:'square', label:'25 × 25 mm', w:25,  h:25 },
    { id:'sq30',    shape:'square', label:'30 × 30 mm', w:30,  h:30 },
    { id:'sq40',    shape:'square', label:'40 × 40 mm', w:40,  h:40 },
    // ── دائرية ──
    { id:'ci12',    shape:'circle', label:'⌀ 12 mm',    w:12,  h:12 },
    { id:'ci19',    shape:'circle', label:'⌀ 19 mm',    w:19,  h:19 },
    { id:'ci25',    shape:'circle', label:'⌀ 25 mm',    w:25,  h:25 },
    { id:'ci30',    shape:'circle', label:'⌀ 30 mm',    w:30,  h:30 },
    { id:'ci38',    shape:'circle', label:'⌀ 38 mm',    w:38,  h:38 },
    { id:'ci41',    shape:'circle', label:'⌀ 41 mm',    w:41,  h:41 },
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
      // Go directly to designer (templates step removed)
      psLaunchScratch(catId);
    }
  };

  window.psPickSubcat = function(subId) {
    psSubcat = subId;
    psHistory.push('ps-s2');
    psLaunchScratch(psCat);
  };

  function psBuildStampSizes() {
    const grid = document.getElementById('psStampGrid');
    const groups = [
      { shape:'rect',   labelAr:'مستطيلة',  icon:'▬' },
      { shape:'square', labelAr:'مربعة',    icon:'■' },
      { shape:'circle', labelAr:'دائرية',   icon:'●' },
    ];
    let html = '';
    groups.forEach(g => {
      const sizes = STAMP_SIZES.filter(s => s.shape === g.shape);
      html += `<div class="ps-sz-group-header"><span class="ps-sz-group-icon">${g.icon}</span> ${g.labelAr}</div>`;
      html += '<div class="ps-sz-row">';
      sizes.forEach(sz => {
        let svg = '';
        const ratio = Math.min(sz.w, 70) / Math.max(sz.w, 1);
        const ratio2 = Math.min(sz.h, 40) / Math.max(sz.h, 1);
        const vw = Math.round(Math.max(30, Math.min(70, sz.w * 0.9)));
        const vh = Math.round(Math.max(14, Math.min(44, sz.h * 1.4)));
        if (sz.shape === 'circle') {
          const r = Math.round(Math.min(vw, vh) / 2 - 3);
          svg = `<svg width="${vw}" height="${vw}" viewBox="0 0 ${vw} ${vw}"><circle cx="${vw/2}" cy="${vw/2}" r="${r}" fill="none" stroke="#c9a84c" stroke-width="1.8" stroke-dasharray="4,2.5"/></svg>`;
        } else if (sz.shape === 'square') {
          svg = `<svg width="${vw}" height="${vw}" viewBox="0 0 ${vw} ${vw}"><rect x="3" y="3" width="${vw-6}" height="${vw-6}" rx="2" fill="none" stroke="#c9a84c" stroke-width="1.8" stroke-dasharray="4,2.5"/></svg>`;
        } else {
          svg = `<svg width="${vw}" height="${vh}" viewBox="0 0 ${vw} ${vh}"><rect x="2" y="2" width="${vw-4}" height="${vh-4}" rx="2" fill="none" stroke="#c9a84c" stroke-width="1.8" stroke-dasharray="4,2.5"/></svg>`;
        }
        html += `<div class="ps-sz-card" onclick="psPickStampSize('${sz.id}','${sz.label}')">
          <div class="ps-sz-shape">${svg}</div>
          <div class="ps-sz-label">${sz.label}</div>
        </div>`;
      });
      html += '</div>';
    });
    grid.innerHTML = html;
  }

  window.psPickStampSize = function(sizeId, label) {
    psStampSize = label;
    psHistory.push('ps-s3');
    psLaunchScratch('stamps');
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

  // ── Inject stamp size grid group styles ──
  (function injectStampCSS(){
    if(document.getElementById('_stampSzCSS')) return;
    const s = document.createElement('style');
    s.id = '_stampSzCSS';
    s.textContent = `
      #psStampGrid { padding: .5rem 0; }
      .ps-sz-group-header { font-size:11px; font-weight:800; letter-spacing:1.5px; text-transform:uppercase;
        color:var(--gold,#c9a84c); padding:.7rem .2rem .4rem; border-bottom:1px solid rgba(201,168,76,.2); margin-bottom:.6rem; display:flex; align-items:center; gap:.5rem; }
      .ps-sz-group-icon { font-size:1rem; }
      .ps-sz-row { display:flex; flex-wrap:wrap; gap:.6rem; margin-bottom:1.2rem; }
      .ps-sz-card { background:var(--bg3,#1f2937); border:1px solid var(--border2,#3a4150); border-radius:10px;
        padding:.7rem .8rem; cursor:pointer; transition:.2s; display:flex; flex-direction:column; align-items:center; gap:.35rem; min-width:80px; }
      .ps-sz-card:hover { border-color:var(--gold,#c9a84c); background:rgba(201,168,76,.08); transform:translateY(-2px); }
      .ps-sz-shape { display:flex; align-items:center; justify-content:center; min-height:30px; }
      .ps-sz-label { font-size:11px; font-weight:700; color:var(--txt2,#d1d5db); white-space:nowrap; }
    `;
    document.head.appendChild(s);
  })();

  // ── Inject account btn styles ──
  (function injectAccCSS(){
    if(document.getElementById('_accBtnCSS')) return;
    const s = document.createElement('style');
    s.id = '_accBtnCSS';
    s.textContent = `
      .acc-btn {
        display:flex; align-items:center; gap:.4rem;
        background:linear-gradient(135deg,rgba(37,99,235,.15),rgba(201,168,76,.1));
        border:1px solid rgba(201,168,76,.3); border-radius:20px;
        color:var(--txt2,#d1d5db); padding:.38rem .85rem .38rem .55rem;
        font-size:12.5px; font-weight:700; cursor:pointer; transition:.2s;
        font-family:'Cairo',sans-serif; white-space:nowrap;
      }
      .acc-btn:hover { border-color:var(--gold,#c9a84c); color:#fff; background:linear-gradient(135deg,rgba(37,99,235,.25),rgba(201,168,76,.18)); transform:translateY(-1px); box-shadow:0 4px 14px rgba(201,168,76,.15); }
      .acc-btn .acc-avatar { width:24px; height:24px; border-radius:50%; background:linear-gradient(135deg,var(--accent,#2563eb),var(--gold,#c9a84c)); display:flex; align-items:center; justify-content:center; font-size:11px; flex-shrink:0; }
      .acc-btn .acc-label { font-size:12px; }
      .acc-btn .acc-xp-dot { width:6px; height:6px; border-radius:50%; background:var(--gold,#c9a84c); flex-shrink:0; box-shadow:0 0 6px rgba(201,168,76,.6); }
    `;
    document.head.appendChild(s);
  })();

  // ── Update account button appearance ──
  function refreshAccBtn() {
    const btn = document.getElementById('accountNavBtn');
    if (!btn) return;
    const isLoggedIn = window._a3mUser || (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser);
    const user = window._a3mUser || (isLoggedIn && firebase.auth().currentUser) || null;
    const name = user ? (user.displayName || user.email || '').split(' ')[0].substring(0,8) : '';
    const icon = document.getElementById('accountNavIcon');
    if (isLoggedIn && name) {
      btn.innerHTML = `<span class="acc-avatar">${name[0].toUpperCase()}</span><span class="acc-label">${name}</span><span class="acc-xp-dot"></span>`;
    } else {
      btn.innerHTML = `<span class="acc-avatar">👤</span><span class="acc-label" id="accountNavIcon">حسابي</span>`;
    }
  }
  document.addEventListener('DOMContentLoaded', refreshAccBtn);
  document.addEventListener('a3m:auth-change', refreshAccBtn);

  // ── Bridge old openDesigner calls ──
  window.openModePicker = window.openProductSelector;
  window.closeModePicker = window.closeProductSelector;
  // window.openDesigner is set by designer.js — do not override here

})();
