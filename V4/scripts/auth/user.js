// ============================================================
// auth/user.js  –  A3M Print  –  Profile، XP، Nav Account
// ============================================================

import { XP_RANKS } from "../utils/constants.js";
import { safe } from "../utils/helpers.js";

// ════════════════════════════════════════════════════════════
// XP RANK
// ════════════════════════════════════════════════════════════

function getXpRank(xp) {
  for (let i = XP_RANKS.length - 1; i >= 0; i--) {
    if (xp >= XP_RANKS[i].min) return { ...XP_RANKS[i], idx: i };
  }
  return { ...XP_RANKS[0], idx: 0 };
}

// ════════════════════════════════════════════════════════════
// NAV ACCOUNT BUTTON
// ════════════════════════════════════════════════════════════

function updateNavAccount() {
  const btn = document.getElementById('accountNavBtn');
  if (!btn) return;
  const u = window.currentUser;
  if (u) {
    btn.innerHTML      = `<div class="acc-btn-avatar">${u.name[0].toUpperCase()}</div> ${u.name.split(' ')[0]}`;
    btn.style.color       = 'var(--gold)';
    btn.style.borderColor = 'var(--gold)';
  } else {
    const lang = window.currentLang || 'en';
    btn.innerHTML      = lang === 'ar' ? '👤 حساب' : lang === 'fr' ? '👤 Compte' : '👤 Account';
    btn.style.color       = '';
    btn.style.borderColor = '';
  }
}

// ════════════════════════════════════════════════════════════
// PROFILE POPULATE
// ════════════════════════════════════════════════════════════

function populateProfile() {
  const u = window.currentUser;
  if (!u) return;

  safe('accName',     u.name);
  safe('accUsername', u.username || '@user');

  const letter = document.getElementById('accAvatarLetter');
  if (letter) letter.textContent = u.name[0].toUpperCase();

  // ── XP Bar ──
  const xp   = u.xp || 0;
  const rank = getXpRank(xp);
  const rankEl = document.getElementById('xpRankLabel');
  if (rankEl) { rankEl.textContent = rank.name; rankEl.className = 'xp-rank ' + rank.cls; }

  const isMax = rank.idx === XP_RANKS.length - 1;
  const pct   = isMax ? 100 : Math.min(100, ((xp - rank.min) / (rank.max - rank.min)) * 100);
  const fill  = document.getElementById('xpBarFill');
  if (fill) fill.style.width = pct + '%';
  safe('xpPtsLabel', xp + ' / ' + (isMax ? 'MAX' : rank.max) + ' XP');

  // ── Stats ──
  safe('statFollowers',  u.followers || 0);
  safe('statFollowing',  u.following || 0);
  safe('statDesigns',    u.designs   || 0);
  safe('statSold',       u.sold      || 0);
  safe('statFollowers2', u.followers || 0);
  safe('statFollowing2', u.following || 0);

  renderUserDesigns();
  renderUserOrders();
}

// ════════════════════════════════════════════════════════════
// DESIGNS GRID
// ════════════════════════════════════════════════════════════

function renderUserDesigns() {
  const grid = document.getElementById('designsGrid');
  if (!grid) return;

  const saved = JSON.parse(localStorage.getItem('a3m_designs') || '[]');
  // زر "New Design" دائماً أول شيء
  grid.innerHTML = '<div class="design-thumb" onclick="closeAccount();openModePicker()" title="New">+</div>';

  saved.slice(-8).reverse().forEach(d => {
    const div = document.createElement('div');
    div.className = 'design-thumb';
    div.innerHTML = `<img src="${d.preview}" style="width:100%;height:100%;object-fit:cover;border-radius:7px"/>`;
    if (d.sold) div.innerHTML += `<span class="design-thumb-sold">${d.sold} sold</span>`;
    grid.appendChild(div);
  });
}

// ════════════════════════════════════════════════════════════
// ORDERS LIST
// ════════════════════════════════════════════════════════════

function renderUserOrders() {
  const el     = document.getElementById('ordersList');
  if (!el) return;
  const orders = JSON.parse(localStorage.getItem('a3m_orders') || '[]');

  if (!orders.length) {
    el.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--txt3)">No orders yet</div>';
    return;
  }

  el.innerHTML = orders.slice(-10).reverse().map(o => `
    <div style="display:flex;align-items:center;gap:.8rem;padding:.7rem 0;border-bottom:1px solid var(--border)">
      <span style="font-size:1.5rem">${o.emoji || '📦'}</span>
      <div style="flex:1">
        <div style="font-weight:700;font-size:13px;color:var(--txt)">${o.name}</div>
        <div style="font-size:11px;color:var(--txt3)">${o.date}</div>
      </div>
      <div style="color:var(--accent);font-weight:700;font-size:13px">${o.price}</div>
    </div>`).join('');
}

// ════════════════════════════════════════════════════════════
// ACCOUNT TABS
// ════════════════════════════════════════════════════════════

function switchAccTab(tab) {
  const tabs  = ['profile','designs','orders','follow'];
  document.querySelectorAll('.acc-tab').forEach((t, i) =>
    t.classList.toggle('active', tabs[i] === tab));
  document.querySelectorAll('.acc-pane').forEach(p => p.classList.remove('active'));
  document.getElementById('tab-' + tab)?.classList.add('active');
}

// ════════════════════════════════════════════════════════════
// AVATAR
// ════════════════════════════════════════════════════════════

function changeAvatar() {
  if (!window.currentUser) return;
  const colors = ['#2563eb','#c9a84c','#7c3aed','#ef4444','#22c55e'];
  const idx    = Math.floor(Math.random() * colors.length);
  const letter = document.getElementById('accAvatarLetter');
  const avatar = letter?.parentElement;
  if (avatar) {
    avatar.style.background = `linear-gradient(135deg, ${colors[idx]}, ${colors[(idx+1)%colors.length]})`;
  }
}

// ════════════════════════════════════════════════════════════
// SAVE USER (localStorage sync)
// ════════════════════════════════════════════════════════════

function _saveUser() {
  const u = window.currentUser;
  if (!u) return;
  localStorage.setItem('a3m_user', JSON.stringify(u));
  const users = JSON.parse(localStorage.getItem('a3m_users') || '{}');
  users[u.email] = u;
  localStorage.setItem('a3m_users', JSON.stringify(users));
}

// ════════════════════════════════════════════════════════════
// EXPOSE TO WINDOW
// ════════════════════════════════════════════════════════════

Object.assign(window, {
  getXpRank,
  updateNavAccount,
  populateProfile,
  renderUserDesigns,
  renderUserOrders,
  switchAccTab,
  changeAvatar,
  _saveUser,
});

// ── Init: update nav if already logged in ──
if (window.currentUser) setTimeout(() => updateNavAccount(), 300);

export { getXpRank, updateNavAccount, populateProfile, _saveUser };
