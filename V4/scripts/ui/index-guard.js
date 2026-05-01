// index-guard.js — A3M Print — Visibility guard
/* ══════════════════════════════════════════════════════════
   A3M VISIBILITY GUARD — آخر script يُحمَّل
   يمنع أي script (بما فيه a3m-settings.js) من إخفاء
   الفوتر والـ AI Bot في الصفحة الرئيسية
══════════════════════════════════════════════════════════ */
(function() {
  'use strict';

  /* ── قائمة العناصر اللي تختفي عند الدزاينر ── */
  var PAGE_IDS = [
    'sidebarOverlay','cartOverlay','sidebar','cartPanel',
    'navSettingsOverlay','navSettingsPanel',
    'heroSection','products','stampsShowcase','hoodiesShowcase','bagsShowcase',
    'prodModal','orderModal','accountModal','toast',
  ];
  var PAGE_SELS = ['nav.a3m-nav', '.design-banner'];

  function isDesignerOpen() {
    var dm = document.getElementById('designerModal');
    return dm && dm.classList.contains('open');
  }
  function isPsOpen() {
    var ps = document.getElementById('psOverlay');
    return ps && ps.classList.contains('active');
  }

  function hidePage() {
    PAGE_IDS.forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.style.setProperty('display','none','important');
    });
    PAGE_SELS.forEach(function(sel) {
      document.querySelectorAll(sel).forEach(function(el) {
        el.style.setProperty('display','none','important');
      });
    });
    document.body.classList.add('designer-open');
  }

  function showPage() {
    PAGE_IDS.forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.style.removeProperty('display');
    });
    PAGE_SELS.forEach(function(sel) {
      document.querySelectorAll(sel).forEach(function(el) {
        el.style.removeProperty('display');
      });
    });
    document.body.classList.remove('designer-open');
    document.body.classList.remove('ps-open');
    // ✅ تأكيد ظهور الفوتر والـ bot
    ensureFooterAndBot();
  }

  function ensureFooterAndBot() {
    if (isDesignerOpen() || isPsOpen()) return;
    // الفوتر بالـ ID
    var footer = document.getElementById('siteFooter') || document.querySelector('footer');
    if (footer) {
      footer.style.removeProperty('display');
      footer.style.removeProperty('visibility');
    }
    // AI Bot
    var bot = document.getElementById('a3m-bot-wrap');
    if (bot) {
      bot.style.removeProperty('display');
      bot.style.setProperty('pointer-events', 'auto', 'important');
      var trigger = bot.querySelector('#a3m-bot-trigger');
      if (trigger) trigger.style.setProperty('pointer-events', 'auto', 'important');
    }
  }

  /* ── MutationObserver: يراقب الفوتر ويمنع إخفاءه ── */
  function guardFooter() {
    var footer = document.getElementById('siteFooter') ||
                 document.querySelector('footer.footer') ||
                 document.querySelector('footer');
    if (!footer) { setTimeout(guardFooter, 500); return; }
    var obs = new MutationObserver(function() {
      if (isDesignerOpen() || isPsOpen()) return;
      var s = footer.style.display;
      if (s === 'none' || footer.style.visibility === 'hidden') {
        footer.style.removeProperty('display');
        footer.style.removeProperty('visibility');
      }
    });
    obs.observe(footer, { attributes: true, attributeFilter: ['style'] });
  }

  /* ── MutationObserver: يراقب AI Bot ── */
  function guardBot() {
    var bodyObs = new MutationObserver(function(muts) {
      muts.forEach(function(m) {
        m.addedNodes.forEach(function(n) {
          if (n.id === 'a3m-bot-wrap') {
            n.style.setProperty('display', 'block', 'important');
            n.style.setProperty('z-index', '99999', 'important');
            n.style.setProperty('pointer-events', 'auto', 'important');
            // تأكيد إن الـ trigger قابل للضغط
            var trigger = n.querySelector('#a3m-bot-trigger');
            if (trigger) {
              trigger.style.setProperty('pointer-events', 'auto', 'important');
              trigger.style.setProperty('cursor', 'pointer', 'important');
            }
          }
        });
      });
    });
    bodyObs.observe(document.body, { childList: true });

    // لو موجود بالفعل
    var bot = document.getElementById('a3m-bot-wrap');
    if (bot) {
      bot.style.setProperty('display', 'block', 'important');
      bot.style.setProperty('z-index', '99999', 'important');
      bot.style.setProperty('pointer-events', 'auto', 'important');
      var trigger = bot.querySelector('#a3m-bot-trigger');
      if (trigger) {
        trigger.style.setProperty('pointer-events', 'auto', 'important');
        trigger.style.setProperty('cursor', 'pointer', 'important');
      }
    }
  }

  /* ── patch openDesigner / closeDesigner ── */
  function patchDesigner() {
    var origOpen = window.openDesigner;
    if (origOpen && !origOpen._guard) {
      window.openDesigner = function() {
        hidePage();
        return origOpen.apply(this, arguments);
      };
      window.openDesigner._guard = true;
    }
    ['closeDesigner','closeDesignerModal'].forEach(function(fn) {
      var orig = window[fn];
      if (orig && !orig._guard) {
        window[fn] = function() {
          var r = orig.apply(this, arguments);
          setTimeout(function() {
            if (!isDesignerOpen()) showPage();
          }, 60);
          return r;
        };
        window[fn]._guard = true;
      }
    });
  }

  /* ── watch designerModal class ── */
  function watchDesigner() {
    var dm = document.getElementById('designerModal');
    if (!dm) { setTimeout(watchDesigner, 300); return; }
    new MutationObserver(function() {
      if (dm.classList.contains('open')) hidePage();
      else if (!isPsOpen()) showPage();
    }).observe(dm, { attributes: true, attributeFilter: ['class'] });
  }

  /* ── openProductSelector / closeProductSelector ── */
  window.openProductSelector = function() {
    var ps = document.getElementById('psOverlay');
    if (!ps) return;
    ps.classList.add('active');
    hidePage();
    document.body.classList.remove('designer-open');
    document.body.classList.add('ps-open');
  };

  window.closeProductSelector = function() {
    var ps = document.getElementById('psOverlay');
    if (ps) ps.classList.remove('active');
    if (!isDesignerOpen()) showPage();
  };

  /* ── Init ── */
  function init() {
    guardFooter();
    guardBot();
    watchDesigner();
    patchDesigner();
    ensureFooterAndBot();
  }

  // تشغيل فوري + بعد تحميل كل شيء
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(init, 100);
    });
  } else {
    setTimeout(init, 100);
  }

  window.addEventListener('load', function() {
    patchDesigner(); // تأكيد إن الـ patch تشتغل بعد a3m-settings.js
    ensureFooterAndBot();
  });

  window.addEventListener('a3m-ready', function() {
    setTimeout(patchDesigner, 200);
    setTimeout(ensureFooterAndBot, 300);
  });

  // expose
  window._a3mHidePage  = hidePage;
  window._a3mShowPage  = showPage;
  window._a3mHideForPS = function() {
    hidePage();
    document.body.classList.remove('designer-open');
    document.body.classList.add('ps-open');
  };

}());