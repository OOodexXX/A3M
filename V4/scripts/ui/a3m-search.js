// ============================================================
// scripts/ui/a3m-search.js  —  A3M Print
// A3M Header Search Bar — live product/action search with keyboard nav
// ============================================================

/* ══════════════════════════════════════════
   A3M HEADER SEARCH
══════════════════════════════════════════ */
(function(){
  'use strict';

  var _input   = null, _dd = null, _clear = null, _icon = null;

  // ── Static data ──
  var CATS = [
    {type:'cat',id:'tshirt', emoji:'👕', ar:'تيشرتات',    en:'T-Shirts'},
    {type:'cat',id:'hoodie', emoji:'🧥', ar:'هوديات',     en:'Hoodies'},
    {type:'cat',id:'hat',    emoji:'🧢', ar:'كابات',      en:'Caps'},
    {type:'cat',id:'mug',    emoji:'☕', ar:'أكواب',      en:'Mugs'},
    {type:'cat',id:'bag',    emoji:'👜', ar:'حقائب',      en:'Bags'},
    {type:'cat',id:'paper',  emoji:'📄', ar:'أوراق',      en:'Paper'},
    {type:'cat',id:'laser',  emoji:'🔑', ar:'إكسسوارات',  en:'Accessories'},
  ];

  var ACTIONS = [
    {type:'action', emoji:'🎨', ar:'تصميم جديد',   en:'New Design',  fn:function(){ if(typeof openProductSelector==='function') openProductSelector(); }},
    {type:'action', emoji:'📋', ar:'نموذج الطلب',  en:'Order Form',  fn:function(){ if(typeof openOrderForm==='function') openOrderForm(); }},
    {type:'action', emoji:'🛒', ar:'السلة',         en:'Cart',        fn:function(){ if(typeof openCart==='function') openCart(); }},
    {type:'action', emoji:'👤', ar:'حسابي',         en:'My Account',  fn:function(){ if(typeof openAccount==='function') openAccount(); }},
  ];

  function getLang(){ return window.currentLang || localStorage.getItem('a3m_lang') || 'ar'; }

  function getProducts(){
    var PD = window.PD || [];
    var lang = getLang();
    var T = window.T && window.T[lang];
    return PD.map(function(p){
      var info = T && T.prods && T.prods[p.id];
      return {
        type:'product', id:String(p.id),
        name: info ? info.n : (p.name||p.emoji||''),
        sub:  info ? (info.s||'') : (p.sub||''),
        emoji: p.emoji||'📦', cat: p.cat||'',
        price: p.price||null,
      };
    });
  }

  // ── Highlight match ──
  function hl(text, q){
    if(!q||!text) return text||'';
    return String(text).replace(new RegExp('('+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','gi'),'<span class="srch-hl">$1</span>');
  }

  // ── Render ──
  function rowHTML(item, q){
    var lang = getLang();
    var name = hl(item.ar||item.name||'', q);
    var sub  = item.sub ? '<div class="srch-row-sub">'+hl(item.sub,q)+'</div>' : '';
    var badge = item.type==='action' ? '<span class="srch-row-badge action">إجراء</span>'
              : item.type==='cat'    ? '<span class="srch-row-badge">تصنيف</span>'
              : (item.price          ? '<span class="srch-row-badge">'+item.price+' دج</span>' : '');
    return '<div class="srch-row" tabindex="0" data-srch-type="'+item.type+'" data-srch-id="'+(item.id||'')+'" data-srch-idx="'+(item._idx||'')+'">'
      +'<span class="srch-row-emoji">'+item.emoji+'</span>'
      +'<div class="srch-row-info"><div class="srch-row-name">'+name+'</div>'+sub+'</div>'
      +badge+'</div>';
  }

  function section(title, rows, q){
    if(!rows.length) return '';
    return '<div class="srch-section-hd">'+title+'</div>'+rows.map(function(r){ return rowHTML(r,q); }).join('');
  }

  // ── Render dropdown ──
  function render(q){
    if(!_dd) return;
    q = (q||'').trim();
    var lang = getLang();

    if(!q){
      // Default: actions + categories
      _dd.innerHTML =
        section('إجراءات سريعة', ACTIONS, '') +
        section('التصنيفات', CATS, '');
      openDd(); bindClicks(); return;
    }

    var ql = q.toLowerCase();

    var acts = ACTIONS.filter(function(a){ return a.ar.includes(q)||a.en.toLowerCase().includes(ql); });
    var cats = CATS.filter(function(c){ return c.ar.includes(q)||c.en.toLowerCase().includes(ql)||c.id.includes(ql); });
    var prods = getProducts().filter(function(p){
      return (p.name&&p.name.toLowerCase().includes(ql))||(p.sub&&p.sub.toLowerCase().includes(ql));
    }).slice(0,7);

    if(!acts.length&&!cats.length&&!prods.length){
      _dd.innerHTML='<div class="srch-empty">لا نتائج لـ "<b>'+q+'</b>"<br><small style="color:#4b5563">جرّب كلمة أخرى</small></div>';
      openDd(); return;
    }

    _dd.innerHTML = section('إجراءات', acts, q) + section('تصنيفات', cats, q) + section('منتجات', prods, q);
    openDd(); bindClicks();
  }

  function openDd(){ if(_dd) _dd.classList.add('open'); }
  function closeDd(){ if(_dd) _dd.classList.remove('open'); }

  function clearSearch(){
    if(_input)  _input.value = '';
    if(_clear)  _clear.style.display = 'none';
    if(_icon)   _icon.style.display  = 'flex';
    closeDd();
  }

  // ── Click handlers ──
  function bindClicks(){
    if(!_dd) return;
    _dd.querySelectorAll('.srch-row').forEach(function(el, i){
      el.onclick = function(){
        var type = el.dataset.srchType;
        var id   = el.dataset.srchId;
        if(type==='action'){
          var idx = parseInt(el.dataset.srchIdx);
          var act = isNaN(idx) ? null : ACTIONS[idx];
          if(!act){
            // match by text
            var nameT = (el.querySelector('.srch-row-name')||{}).textContent||'';
            act = ACTIONS.find(function(a){ return a.ar===nameT||a.en===nameT; });
          }
          if(act) act.fn();
        } else if(type==='cat'){
          var btn = document.getElementById('c-'+id);
          if(typeof filterCat==='function') filterCat(id, btn);
          var sec = document.getElementById('products');
          if(sec) sec.scrollIntoView({behavior:'smooth'});
        } else if(type==='product'){
          if(typeof openProdModal==='function') openProdModal(parseInt(id));
        }
        clearSearch();
      };
    });
    // Tag action indices for reliable lookup
    _dd.querySelectorAll('.srch-row[data-srch-type="action"]').forEach(function(el,i){
      var nameT = (el.querySelector('.srch-row-name')||{}).textContent||'';
      var idx = ACTIONS.findIndex(function(a){ return a.ar===nameT||a.en===nameT; });
      if(idx>=0) el.dataset.srchIdx = idx;
    });
  }

  // ── Public API ──
  window.a3mSearch = function(val){
    if(_clear) _clear.style.display = val ? 'flex' : 'none';
    if(_icon)  _icon.style.display  = val ? 'none' : 'flex';
    render(val);
  };
  window.a3mSearchOpen = function(){
    render(_input ? _input.value : '');
  };
  window.a3mSearchClear = function(){
    clearSearch();
    if(_input) _input.focus();
  };

  // ── Init on DOM ready ──
  document.addEventListener('DOMContentLoaded', function(){
    _input = document.getElementById('a3mSearchInput');
    _dd    = document.getElementById('a3mSrchDd');
    _clear = document.getElementById('a3mSearchClear');
    _icon  = document.getElementById('a3mSearchIcon');

    if(_input){
      // Keyboard nav
      _input.addEventListener('keydown', function(e){
        if(e.key==='Escape'){ clearSearch(); _input.blur(); return; }
        if(e.key==='Enter'){
          var first = _dd && _dd.querySelector('.srch-row');
          if(first) first.click(); return;
        }
        if(e.key==='ArrowDown'||e.key==='ArrowUp'){
          e.preventDefault();
          var items = _dd ? Array.from(_dd.querySelectorAll('.srch-row')) : [];
          if(!items.length) return;
          var fi = document.activeElement;
          var ci = items.indexOf(fi);
          var ni = e.key==='ArrowDown' ? Math.min(ci+1, items.length-1) : Math.max(ci-1, 0);
          if(ci<0) ni=0;
          items[ni].focus();
        }
      });
    }

    // Close on outside click
    document.addEventListener('click', function(e){
      var wrap = document.getElementById('a3mSearchWrap');
      if(wrap && !wrap.contains(e.target)) closeDd();
    });

    // Update placeholder on lang change
    var _sl = window.setLang;
    window.setLang = function(lang){
      if(_sl) _sl(lang);
      if(_input) _input.placeholder = lang==='en'?'Search products...':lang==='fr'?'Rechercher...':'ابحث عن منتج...';
    };
  });
})();
