// ============================================================
// auth/auth.js  –  A3M Print  –  Firebase Authentication
// ============================================================

import { auth, db } from "../services/firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  doc, setDoc, getDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ════════════════════════════════════════════════════════════
// STATE
// ════════════════════════════════════════════════════════════

let currentUser = JSON.parse(localStorage.getItem("a3m_user") || "null");
window.currentUser = currentUser;

// ════════════════════════════════════════════════════════════
// FIREBASE AUTH STATE SYNC
// ════════════════════════════════════════════════════════════

onAuthStateChanged(auth, async (fbUser) => {
  if (fbUser) {
    try {
      const snap = await getDoc(doc(db, "users", fbUser.uid));
      if (snap.exists()) {
        currentUser = { ...snap.data(), uid: fbUser.uid, email: fbUser.email };
        localStorage.setItem("a3m_user", JSON.stringify(currentUser));
        window.currentUser = currentUser;
      }
    } catch (e) { /* offline — نتجاهل */ }
  }
  if (typeof updateNavAccount === 'function') updateNavAccount();
});

// ════════════════════════════════════════════════════════════
// LOGIN
// ════════════════════════════════════════════════════════════

async function doLogin() {
  const email = document.getElementById('loginEmail')?.value?.trim() || '';
  const pass  = document.getElementById('loginPass')?.value          || '';
  if (!email || !pass) { showToast('⚠️ Fill all fields'); return; }

  try {
    await signInWithEmailAndPassword(auth, email, pass);
    showToast('Welcome back ✦');
    closeAccount();
    if (typeof updateNavAccount === 'function') updateNavAccount();
  } catch (e) {
    // Fallback: localStorage
    const users = JSON.parse(localStorage.getItem('a3m_users') || '{}');
    if (users[email] && users[email].pass === pass) {
      currentUser = users[email];
      localStorage.setItem('a3m_user', JSON.stringify(currentUser));
      window.currentUser = currentUser;
      if (typeof showProfilePane  === 'function') showProfilePane();
      if (typeof updateNavAccount === 'function') updateNavAccount();
      showToast('Welcome back ' + currentUser.name + ' ✦');
    } else {
      showToast('⚠️ Wrong email or password');
    }
  }
}

// ════════════════════════════════════════════════════════════
// REGISTER
// ════════════════════════════════════════════════════════════

async function doRegister() {
  const name  = document.getElementById('regName')?.value?.trim()  || '';
  const user  = document.getElementById('regUser')?.value?.trim()  || '';
  const email = document.getElementById('regEmail')?.value?.trim() || '';
  const pass  = document.getElementById('regPass')?.value          || '';

  if (!name || !email || !pass)  { showToast('⚠️ Fill required fields'); return; }
  if (pass.length < 6)           { showToast('⚠️ Password min 6 chars'); return; }

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(cred.user, { displayName: name });

    const userData = {
      name, email,
      username:  user || '@' + name.split(' ')[0].toLowerCase(),
      xp: 0, followers: 0, following: 0, designs: 0, sold: 0,
      joinDate: serverTimestamp()
    };
    await setDoc(doc(db, "users", cred.user.uid), userData);

    currentUser = { ...userData, uid: cred.user.uid, joinDate: new Date().toISOString() };
    localStorage.setItem("a3m_user", JSON.stringify(currentUser));
    window.currentUser = currentUser;

    if (typeof showProfilePane  === 'function') showProfilePane();
    if (typeof updateNavAccount === 'function') updateNavAccount();
    showToast('Account created! Welcome ' + name + ' ✦');

  } catch (e) {
    // Fallback: localStorage
    const users = JSON.parse(localStorage.getItem('a3m_users') || '{}');
    if (users[email]) { showToast('⚠️ Email already registered'); return; }

    const uname = user || ('@' + name.split(' ')[0].toLowerCase());
    currentUser = {
      name, username: uname, email, pass,
      xp: 0, followers: 0, following: 0, designs: 0, sold: 0,
      joinDate: new Date().toISOString()
    };
    users[email] = currentUser;
    localStorage.setItem('a3m_users', JSON.stringify(users));
    localStorage.setItem('a3m_user',  JSON.stringify(currentUser));
    window.currentUser = currentUser;

    if (typeof showProfilePane  === 'function') showProfilePane();
    if (typeof updateNavAccount === 'function') updateNavAccount();
    showToast('Account created! Welcome ' + name + ' ✦');
  }
}

// ════════════════════════════════════════════════════════════
// LOGOUT
// ════════════════════════════════════════════════════════════

function doLogout() {
  currentUser = null;
  window.currentUser = null;
  localStorage.removeItem('a3m_user');
  if (typeof showAuthPane     === 'function') showAuthPane();
  if (typeof updateNavAccount === 'function') updateNavAccount();
  showToast('Signed out ✦');
}

// ════════════════════════════════════════════════════════════
// MODAL PANE SWITCHING
// ════════════════════════════════════════════════════════════

function openAccount() {
  document.getElementById('accountModal')?.classList.add('open');
  currentUser ? showProfilePane() : showAuthPane();
}
function closeAccount() {
  document.getElementById('accountModal')?.classList.remove('open');
}
function showAuthPane() {
  document.getElementById('authPane')   && (document.getElementById('authPane').style.display    = 'block');
  document.getElementById('profilePane')&& (document.getElementById('profilePane').style.display = 'none');
}
function showProfilePane() {
  document.getElementById('authPane')   && (document.getElementById('authPane').style.display    = 'none');
  document.getElementById('profilePane')&& (document.getElementById('profilePane').style.display = 'block');
  if (typeof populateProfile === 'function') populateProfile();
}
function showRegister() {
  document.getElementById('loginForm')    && (document.getElementById('loginForm').style.display    = 'none');
  document.getElementById('registerForm') && (document.getElementById('registerForm').style.display = 'block');
}
function showLogin() {
  document.getElementById('registerForm') && (document.getElementById('registerForm').style.display = 'none');
  document.getElementById('loginForm')    && (document.getElementById('loginForm').style.display    = 'block');
}

// ════════════════════════════════════════════════════════════
// EXPOSE TO WINDOW
// ════════════════════════════════════════════════════════════

Object.assign(window, {
  doLogin, doRegister, doLogout,
  openAccount, closeAccount,
  showAuthPane, showProfilePane,
  showRegister, showLogin,
});

export { currentUser, doLogin, doRegister, doLogout, openAccount, closeAccount };
