// ============================================================
// scripts/ui/nav-settings.js  —  A3M Print
// Nav Settings Panel — theme color/mode, lang, currency quick-save
// ============================================================

(function(){
  'use strict';

  var _color = 'blue', _mode = 'dark', _lang = 'ar', _cur = 'DZD';

  var NSP_T = {
    ar:{ title:'الإعدادات', color:'لون الثيم', mode:'وضع العرض', dark:'داكن', light:'فاتح', lang:'اللغة', currency:'العملة', save:'حفظ الإعدادات', saved:'✅ تم الحفظ!', savedMsg:'✅ تم حفظ الإعدادات على جميع الصفحات' },
    en:{ title:'Settings',  color:'Theme Color', mode:'Display Mode', dark:'Dark', light:'Light', lang:'Language', currency:'Currency', save:'Save Settings', saved:'✅ Saved!', savedMsg:'✅ Settings saved across all pages' },
    fr:{ title:'Paramètres',color:'Couleur du Thème', mode:"Mode d'Affichage", dark:'Sombre', light:'Clair', lang:'Langue', currency:'Devise', save:'Enregistrer', saved:'✅ Enregistré!', savedMsg:'✅ Paramètres sauvegardés' },
  };

  function getT(){ return NSP_T[_lang] || NSP_T.ar; }

  function loadState(){
    try {
      var s = JSON.parse(localStorage.getItem('a3m_settings') || '{}');
      _color = s.color || s.theme?.split('-')[0] || (localStorage.getItem('a3m_theme')||'blue-dark').split('-')[0] || 'blue';
      _mode  = s.mode  || s.theme?.split('-')[1] || (localStorage.getItem('a3m_theme')||'blue-dark').split('-')[1] || 'dark';
      _lang  = s.lang  || localStorage.getItem('a3m_lang') || 'ar';
      _cur   = s.currency || 'DZD';
    } catch(e) {
      var th = localStorage.getItem('a3m_theme') || 'blue-dark';
      var parts = th.split('-');
      _color = parts[0] || 'blue';
      _mode  = parts[1] || 'dark';
      _lang  = localStorage.getItem('a3m_lang') || 'ar';
      _cur   = 'DZD';
    }
  }

  function saveState(){
    var s = { color:_color, mode:_mode, lang:_lang, currency:_cur, theme:_color+'-'+_mode };
    localStorage.setItem('a3m_settings', JSON.stringify(s));
    localStorage.setItem('a3m_theme', _color+'-'+_mode);
    localStorage.setItem('a3m_lang', _lang);
  }

  function syncUI(){
    document.querySelectorAll('[data-nsp-color]').forEach(function(d){ d.classList.toggle('active', d.dataset.nspColor === _color); });
    var dk = document.getElementById('nspDarkBtn');
    var lt = document.getElementById('nspLightBtn');
    if(dk) dk.classList.toggle('active', _mode==='dark');
    if(lt) lt.classList.toggle('active', _mode==='light');
    document.querySelectorAll('[data-nsp-lang]').forEach(function(o){ o.classList.toggle('active', o.dataset.nspLang === _lang); });
    document.querySelectorAll('[data-nsp-cur]').forEach(function(o){ o.classList.toggle('active', o.dataset.nspCur === _cur); });
    var t = getT();
    var safe = function(id,v){ var el=document.getElementById(id); if(el&&v!=null) el.textContent=v; };
    safe('nspTitle', t.title); safe('nspColorTitle', t.color); safe('nspModeTitle', t.mode);
    safe('nspDarkLbl', t.dark); safe('nspLightLbl', t.light); safe('nspLangTitle', t.lang);
    safe('nspCurrencyTitle', t.currency); safe('nspSaveLbl', t.save);
  }

  window.nspPickColor = function(c){ _color = c; syncUI(); };
  window.nspPickMode  = function(m){ _mode  = m; syncUI(); };
  window.nspPickLang  = function(l){ _lang  = l; syncUI(); };
  window.nspPickCur   = function(c){ _cur   = c; syncUI(); };

  window.nspSaveAll = function(){
    saveState();
    document.body.className = _color + '-' + _mode;
    var dk2 = document.getElementById('modeDarkBtn');
    var lt2 = document.getElementById('modeLightBtn');
    if(dk2) dk2.classList.toggle('active', _mode==='dark');
    if(lt2) lt2.classList.toggle('active', _mode==='light');
    var icon = document.getElementById('themeIcon');
    if(icon) icon.textContent = _mode==='dark' ? '🌙' : '☀️';
    if(typeof window.setLang === 'function') window.setLang(_lang);
    if(typeof window.setCurrency === 'function') window.setCurrency(_cur);
    var btn = document.getElementById('nspSaveBtn');
    if(btn){ btn.classList.add('nsp-saved'); btn.textContent = getT().saved; setTimeout(function(){ btn.classList.remove('nsp-saved'); btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg><span id="nspSaveLbl">' + getT().save + '</span>'; }, 2200); }
    if(typeof showToast === 'function') showToast(getT().savedMsg, 'success');
    closeNavSettings();
  };

  window.openNavSettings = function(){ loadState(); syncUI(); document.getElementById('navSettingsOverlay').style.display = 'block'; document.getElementById('navSettingsPanel').classList.add('nsp-open'); };
  window.closeNavSettings = function(){ document.getElementById('navSettingsOverlay').style.display = 'none'; document.getElementById('navSettingsPanel').classList.remove('nsp-open'); };

  window.goToAccount = function(){
    try {
      var user = JSON.parse(localStorage.getItem('a3m_user') || '{}');
      if(user && user.name) {
        window.location.href = './pages/profile.html';
      } else {
        if(typeof openAccount === 'function') openAccount();
      }
    } catch(e) {
      if(typeof openAccount === 'function') openAccount();
    }
  };

  function updateAccountBtn(){
    try {
      var user = JSON.parse(localStorage.getItem('a3m_user') || '{}');
      var icon = document.getElementById('accountNavIcon');
      var btn  = document.getElementById('accountNavBtn');
      if(user && user.name){
        if(icon) icon.textContent = user.name[0].toUpperCase();
        if(btn) btn.style.cssText = 'background:linear-gradient(135deg,var(--accent,#2563eb),#7c3aed);color:#fff;border-color:transparent;font-weight:900;font-size:.85rem;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;padding:0;cursor:pointer;border:none;transition:.18s;';
      } else {
        if(icon) icon.textContent = '👤';
        if(btn) btn.removeAttribute('style');
      }
    } catch(e) {}
  }

  document.addEventListener('DOMContentLoaded', function(){ updateAccountBtn(); });
  document.addEventListener('a3m:lang', function(e){ updateAccountBtn(); });
})();
