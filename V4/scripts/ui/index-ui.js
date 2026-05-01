// index-ui.js — A3M Print — UI helpers extracted from index.html
// ── Protect enhanced elements from being overwritten by app.js ──
(function() {
  var ACC_BTN_HTML = null;

  function _saveAccBtn() {
    var btn = document.getElementById('accountNavBtn');
    if (btn && btn.classList.contains('acc-btn')) {
      ACC_BTN_HTML = btn.outerHTML;
    }
  }

  function _restoreAccBtn() {
    var btn = document.getElementById('accountNavBtn');
    if (!btn) return;
    if (!btn.classList.contains('acc-btn') && ACC_BTN_HTML) {
      // app.js overwrote it — restore
      var tmp = document.createElement('div');
      tmp.innerHTML = ACC_BTN_HTML;
      var newBtn = tmp.firstChild;
      btn.parentNode.replaceChild(newBtn, btn);
    }
  }

  document.addEventListener('DOMContentLoaded', function() {
    // Save after a short delay (after initial render)
    setTimeout(_saveAccBtn, 200);

    // Watch for changes to the button
    var container = document.getElementById('accountNavBtn');
    if (!container) return;
    var parent = container.parentNode;
    if (!parent) return;

    new MutationObserver(function() {
      var btn = document.getElementById('accountNavBtn');
      if (btn && !btn.classList.contains('acc-btn') && ACC_BTN_HTML) {
        setTimeout(_restoreAccBtn, 10);
      }
    }).observe(parent, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'innerHTML'] });
  });

  // Also restore after a3m-ready
  window.addEventListener('a3m-ready', function() {
    setTimeout(_saveAccBtn, 100);
    setTimeout(_restoreAccBtn, 600);
    setTimeout(_restoreAccBtn, 1200);
  });
})();

// ── Stamp upload handler ──
window._stampFiles = {};
window.handleStampUpload = function(input, slotId) {
  const file = input.files[0];
  if (!file) return;
  window._stampFiles[slotId] = file;
  const status = document.getElementById('stampUpload' + slotId + 'Status');
  if (status) {
    status.style.display = 'block';
    status.textContent = '✓ تم رفع الملف: ' + file.name;
  }
};

// ── Open order form with stamp type pre-filled ──
window.openOrderFormWithStamp = function(stampType) {
  const officialTypes = ['self-inking','round-seal','general'];
  if (officialTypes.includes(stampType)) {
    const hasFile = Object.keys(window._stampFiles).length > 0;
    if (!hasFile) {
      const proceed = confirm('⚠️ تذكير: يُنصح برفع صورة السجل التجاري قبل إتمام الطلب.\n\nهل تريد المتابعة بدون رفع ملف؟');
      if (!proceed) return;
    }
  }
  const noteEl = document.getElementById('orderNote') || document.getElementById('customNote') || document.querySelector('textarea[name="note"]');
  if (noteEl) noteEl.value = 'نوع الختم: ' + stampType + (window._stampFiles[1] ? ' | ملف مرفق: ' + window._stampFiles[1].name : '');
  if (typeof openOrderForm === 'function') openOrderForm();
};

// ════════════════════════════════════════════════════════════
// ✅ PRODUCT SELECTOR — psPickMode + psPickCat + psGoBack
// مضافة هنا مباشرة لأن product-selector.js ضروري لفتح الدزاينر
// ════════════════════════════════════════════════════════════
(function() {
  'use strict';

  var _mode = null; // 'template' أو 'scratch'
  var _catHistory = [];

  // فئات المنتجات
  var PS_CATS = [
    { id:'mug',       ar:'أكواب',          en:'Mugs',         fr:'Tasses',      icon:'☕', sub:['standard','magic','glass','travel'] },
    { id:'hat',       ar:'كابيات',         en:'Caps',         fr:'Casquettes',  icon:'🧢', sub:['baseball','snapback','dad','beanie'] },
    { id:'tshirt',    ar:'تيشيرت',         en:'T-Shirt',      fr:'T-Shirt',     icon:'👕', sub:['classic','polo','vneck','kids'] },
    { id:'hoodie',    ar:'هودي',           en:'Hoodie',       fr:'Sweat',       icon:'🧥', sub:['pullover','zip','oversized'] },
    { id:'paper',     ar:'أوراق',          en:'Papers',       fr:'Papiers',     icon:'📄', sub:['a4','a3','business-card','poster'] },
    { id:'bag',       ar:'حقائب وباكات',   en:'Packs',        fr:'Sacs',        icon:'👜', sub:['tote','backpack','gift-box','shopping'] },
    { id:'laser',     ar:'إكسسوارات',      en:'Accessories',  fr:'Accessoires', icon:'🔑', sub:['keychain','badge','phone-case','sticker'] },
    { id:'stamp',     ar:'أختام',          en:'Stamps',       fr:'Tampons',     icon:'🔏', sub:['self-inking','round-seal','wax','rubber'] },
  ];

  function getLang() { return window.currentLang || localStorage.getItem('a3m_lang') || 'ar'; }

  function getScreen(n) { return document.getElementById('ps-s' + n); }

  function showScreen(n) {
    [0,1,2,3].forEach(function(i) {
      var s = getScreen(i);
      if (s) s.classList.toggle('active', i === n);
    });
  }

  function buildCatGrid() {
    var grid = document.getElementById('psCatGrid');
    if (!grid) return;
    var lang = getLang();
    grid.innerHTML = PS_CATS.map(function(c) {
      var name = c[lang] || c.ar;
      return '<div class="ps-cat-card" onclick="psPickCat(\'' + c.id + '\')" data-cat="' + c.id + '">' +
        '<div class="ps-cc-img-wrap"><span style="font-size:2.5rem;display:flex;align-items:center;justify-content:center;height:100%">' + c.icon + '</span></div>' +
        '<div class="ps-cc-name">' + name + '</div>' +
        '</div>';
    }).join('');
  }

  function buildSubGrid(catId) {
    var grid = document.getElementById('psSubGrid');
    if (!grid) return;
    var lang = getLang();
    var cat = PS_CATS.find(function(c) { return c.id === catId; });
    if (!cat) return;

    var subLabels = {
      // mugs
      standard: { ar:'كوب عادي', en:'Standard Mug', fr:'Tasse Standard' },
      magic:    { ar:'كوب سحري', en:'Magic Mug',    fr:'Tasse Magique'  },
      glass:    { ar:'كوب زجاجي',en:'Glass Mug',    fr:'Verre'          },
      travel:   { ar:'كوب سفر',  en:'Travel Mug',   fr:'Thermos'        },
      // hats
      baseball: { ar:'كاب بيسبول',   en:'Baseball Cap', fr:'Casquette Baseball' },
      snapback: { ar:'سناببك',        en:'Snapback',     fr:'Snapback'           },
      dad:      { ar:'داد كاب',       en:'Dad Cap',      fr:'Dad Cap'            },
      beanie:   { ar:'قبعة صوف',      en:'Beanie',       fr:'Bonnet'             },
      // tshirt
      classic:  { ar:'كلاسيك',   en:'Classic',     fr:'Classique'  },
      polo:     { ar:'بولو',     en:'Polo',        fr:'Polo'       },
      vneck:    { ar:'رقبة V',   en:'V-Neck',      fr:'Col V'      },
      kids:     { ar:'أطفال',    en:'Kids',        fr:'Enfants'    },
      // hoodie
      pullover: { ar:'بولوفر', en:'Pullover', fr:'Pullover' },
      zip:      { ar:'سحّاب',  en:'Zip-Up',   fr:'Zippé'    },
      oversized:{ ar:'أوفرسايز',en:'Oversized',fr:'Oversize' },
      // paper
      a4:           { ar:'A4',           en:'A4',          fr:'A4'          },
      a3:           { ar:'A3',           en:'A3',          fr:'A3'          },
      'business-card':{ ar:'كارت أعمال', en:'Business Card',fr:'Carte de Visite' },
      poster:       { ar:'بوستر',        en:'Poster',      fr:'Affiche'     },
      // bag
      tote:         { ar:'توت باغ',     en:'Tote Bag',    fr:'Tote Bag'    },
      backpack:     { ar:'حقيبة ظهر',   en:'Backpack',    fr:'Sac à Dos'   },
      'gift-box':   { ar:'صندوق هدية',  en:'Gift Box',    fr:'Boîte Cadeau'},
      shopping:     { ar:'كيس تسوق',    en:'Shopping Bag',fr:'Sac Shopping'},
      // laser/accessories
      keychain:     { ar:'مفتاح',        en:'Keychain',    fr:'Porte-clé'   },
      badge:        { ar:'شارة',          en:'Badge',       fr:'Badge'       },
      'phone-case': { ar:'جراب هاتف',    en:'Phone Case',  fr:'Coque'       },
      sticker:      { ar:'ملصق',          en:'Sticker',     fr:'Autocollant' },
      // stamp
      'self-inking':{ ar:'ختم أوتوماتيك',en:'Self-Inking', fr:'Encreur Auto'},
      'round-seal': { ar:'ختم دائري',    en:'Round Seal',  fr:'Sceau Rond'  },
      wax:          { ar:'ختم شمع',      en:'Wax Seal',    fr:'Sceau Cire'  },
      rubber:       { ar:'ختم مطاط',     en:'Rubber Stamp',fr:'Tampon Caoutchouc' },
    };

    var icons = { standard:'☕',magic:'✨',glass:'🥃',travel:'🫖',baseball:'🧢',snapback:'🧢',dad:'🧢',beanie:'🎩',classic:'👕',polo:'👔',vneck:'👕',kids:'🧒','pullover':'🧥',zip:'🤐',oversized:'👘',a4:'📄',a3:'📃','business-card':'💳',poster:'🖼',tote:'👜',backpack:'🎒','gift-box':'📦',shopping:'🛍',keychain:'🔑',badge:'🪪','phone-case':'📱',sticker:'🏷','self-inking':'🖊','round-seal':'🔵',wax:'🕯',rubber:'🗂' };

    grid.innerHTML = cat.sub.map(function(s) {
      var lbl = (subLabels[s] || {})[lang] || (subLabels[s] || {}).ar || s;
      return '<div class="ps-sub-card" onclick="psLaunchDesigner(\'' + catId + '\',\'' + s + '\')">' +
        '<div class="ps-sub-icon">' + (icons[s] || '✦') + '</div>' +
        '<div class="ps-sub-name">' + lbl + '</div>' +
        '</div>';
    }).join('');
  }

  // ── Public API ──

  window.openProductSelector = function() {
    var ps = document.getElementById('psOverlay');
    if (!ps) return;
    _mode = null; _catHistory = [];
    showScreen(0);
    ps.classList.add('active');
    if (typeof window._a3mHideForPS === 'function') window._a3mHideForPS();
    else document.body.classList.add('ps-open');
  };

  window.closeProductSelector = function() {
    var ps = document.getElementById('psOverlay');
    if (ps) ps.classList.remove('active');
    var dm = document.getElementById('designerModal');
    if (!dm || !dm.classList.contains('open')) {
      if (typeof window._a3mShowPage === 'function') window._a3mShowPage();
    }
  };

  window.psPickMode = function(mode) {
    _mode = mode;
    buildCatGrid();
    showScreen(1);
    var brd = document.getElementById('psBreadcrumb');
    var lang = getLang();
    var labels = { template:{ar:'قوالب',en:'Templates',fr:'Modèles'}, scratch:{ar:'من الصفر',en:'Scratch',fr:'Libre'} };
    if (brd) brd.textContent = (labels[mode] || {})[lang] || mode;
  };

  window.psPickCat = function(catId) {
    _catHistory.push(catId);
    buildSubGrid(catId);
    var lang = getLang();
    var cat = PS_CATS.find(function(c) { return c.id === catId; });
    var s2title = document.getElementById('ps-s2-title');
    if (s2title && cat) s2title.innerHTML = 'اختر <span>' + (cat[lang] || cat.ar) + '</span>';
    showScreen(2);
  };

  window.psGoBack = function() {
    var cur = document.querySelector('.ps-screen.active');
    if (!cur) return;
    var id = cur.id;
    if (id === 'ps-s2') { _catHistory.pop(); showScreen(1); }
    else if (id === 'ps-s1') { _mode = null; showScreen(0); }
    else { closeProductSelector(); }
  };

  window.psLaunchDesigner = function(catId, subId) {
    // ✅ أغلق psOverlay كاملاً أولاً
    var ps = document.getElementById('psOverlay');
    if (ps) {
      ps.classList.remove('active');
      ps.style.setProperty('display', 'none', 'important');
    }
    document.body.classList.remove('ps-open');
    document.body.classList.remove('designer-open');

    // عيّن نوع المنتج
    var cp = document.getElementById('canvasProduct');
    if (cp) cp.value = catId;
    if (window._A3MCanvas) window._A3MCanvas.canvasProdType = catId;

    // افتح الدزاينر بعد frame واحد لضمان إن psOverlay اختفى
    requestAnimationFrame(function() {
      if (typeof window.openDesigner === 'function') {
        window.openDesigner(_mode || 'scratch');
      } else {
        var dm = document.getElementById('designerModal');
        if (dm) dm.classList.add('open');
        if (typeof window._a3mHidePage === 'function') window._a3mHidePage();
      }
      // بعد فتح الدزاينر، تأكد إن psOverlay مخفي
      setTimeout(function() {
        var ps2 = document.getElementById('psOverlay');
        if (ps2) ps2.style.setProperty('display', 'none', 'important');
      }, 50);
    });
  };

  // CSS للـ product selector
  if (!document.getElementById('ps-inline-style')) {
    var style = document.createElement('style');
    style.id = 'ps-inline-style';
    style.textContent = [
      // psOverlay — تحكّم كامل عبر body.ps-open (لا display هنا)
      '#psOverlay{position:fixed;inset:0;z-index:5000;background:rgba(0,0,0,.95);flex-direction:column;overflow:hidden;align-items:center;justify-content:flex-start}',
      '.ps-screen{display:none;width:100%;flex:1;overflow-y:auto;padding:2rem 1rem;text-align:center}',
      '.ps-screen.active{display:block}',
      '.ps-cat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:1rem;max-width:780px;margin:1.5rem auto}',
      '.ps-cat-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:1.2rem .8rem;cursor:pointer;transition:.2s;color:#f1f5f9}',
      '.ps-cat-card:hover{border-color:#c9a84c;background:rgba(201,168,76,.08);transform:translateY(-3px)}',
      '.ps-cc-name{font-size:13px;font-weight:700;margin-top:.5rem}',
      '.ps-sub-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:.8rem;max-width:680px;margin:1.5rem auto}',
      '.ps-sub-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:1rem .6rem;cursor:pointer;transition:.2s;color:#f1f5f9}',
      '.ps-sub-card:hover{border-color:#7c3aed;background:rgba(124,58,237,.1);transform:translateY(-2px)}',
      '.ps-sub-icon{font-size:2rem;margin-bottom:.4rem}',
      '.ps-sub-name{font-size:12px;font-weight:700}',
    ].join('');
    document.head.appendChild(style);
  }

})();