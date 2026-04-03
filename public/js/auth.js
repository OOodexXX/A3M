// ============================================================
// auth.js  –  A3M Print  –  نظام المصادقة
// BUG FIXED:
//   1. كانت دوال login/signup مجرد console.log بدون أي تنفيذ
//   2. لم تكن تستورد Firebase Auth
//   3. لم يكن هناك logout أو onAuthStateChanged
// ============================================================

import { auth, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  doc, setDoc, getDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── الحالة الحالية ──
let currentUser = null;

// ── مراقبة حالة تسجيل الدخول ──
onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  window.currentUser = user;

  if (user) {
    // جلب بيانات المستخدم من Firestore
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) {
      window.userProfile = snap.data();
    }
    updateNavUI(user);
  } else {
    updateNavUI(null);
  }
});

// ── تحديث واجهة Nav حسب حالة الدخول ──
function updateNavUI(user) {
  const btn = document.getElementById("accountNavBtn");
  if (!btn) return;
  if (user) {
    const name = user.displayName || user.email.split("@")[0];
    btn.innerHTML = `<span style="width:22px;height:22px;border-radius:50%;background:var(--accent);display:inline-flex;align-items:center;justify-content:center;font-size:11px;color:#fff;font-weight:700">${name[0].toUpperCase()}</span> ${name.split(" ")[0]}`;
    btn.style.borderColor = "var(--gold)";
    btn.style.color = "var(--gold)";
  } else {
    btn.innerHTML = "👤 Account";
    btn.style.borderColor = "";
    btn.style.color = "";
  }
}

// ── تسجيل الدخول ──
async function login(email, pass) {
  if (!email || !pass) { showToast("⚠️ أدخل البريد وكلمة المرور"); return; }
  try {
    await signInWithEmailAndPassword(auth, email, pass);
    showToast("✦ مرحباً بك مجدداً!");
    if (typeof closeAccount === "function") closeAccount();
  } catch (e) {
    showToast("⚠️ " + friendlyError(e.code));
  }
}

// ── إنشاء حساب ──
async function signup(name, email, pass) {
  if (!name || !email || !pass) { showToast("⚠️ أكمل جميع الحقول"); return; }
  if (pass.length < 6) { showToast("⚠️ كلمة المرور 6 أحرف على الأقل"); return; }
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(cred.user, { displayName: name });
    // حفظ بيانات إضافية في Firestore
    await setDoc(doc(db, "users", cred.user.uid), {
      name,
      email,
      username: "@" + name.split(" ")[0].toLowerCase(),
      xp: 0,
      followers: 0,
      following: 0,
      designs: 0,
      sold: 0,
      joinDate: serverTimestamp()
    });
    showToast("✦ تم إنشاء الحساب بنجاح!");
    if (typeof closeAccount === "function") closeAccount();
  } catch (e) {
    showToast("⚠️ " + friendlyError(e.code));
  }
}

// ── تسجيل الخروج ──
async function logout() {
  await signOut(auth);
  showToast("تم تسجيل الخروج ✦");
}

// ── رسائل خطأ صديقة ──
function friendlyError(code) {
  const map = {
    "auth/invalid-email":        "البريد الإلكتروني غير صحيح",
    "auth/user-not-found":       "لا يوجد حساب بهذا البريد",
    "auth/wrong-password":       "كلمة المرور خاطئة",
    "auth/email-already-in-use": "البريد مسجّل مسبقاً",
    "auth/too-many-requests":    "محاولات كثيرة، حاول لاحقاً",
    "auth/weak-password":        "كلمة المرور ضعيفة جداً"
  };
  return map[code] || "خطأ: " + code;
}

// ── تصدير للاستخدام الخارجي ──
window.login   = login;
window.signup  = signup;
window.logout  = logout;
window.currentUser = currentUser;
