/* ============================================================
   A3M-PRINT - AUTH.JS (Authentication System)
   المسؤول عن: تسجيل الدخول، التسجيل، وحالة المستخدم
   ============================================================ */

import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signInWithPopup, 
    GoogleAuthProvider, 
    signOut, 
    onAuthStateChanged,
    updateProfile 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth();
const db = getFirestore();
const googleProvider = new GoogleAuthProvider();

// متغير حالة المستخدم الحالي
window.currentUser = null;

// --- 1. مراقب حالة تسجيل الدخول (Auth State Observer) ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        window.currentUser = user;
        console.log("User is logged in:", user.displayName);
        if (typeof window._onFbLogin === "function") window._onFbLogin(user);
    } else {
        window.currentUser = null;
        console.log("User is logged out");
        if (typeof window._onFbLogout === "function") window._onFbLogout();
    }
});

// --- 2. دالة تسجيل حساب جديد ---
async function register(email, password, displayName, phone = "") {
    try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName });

        // تخزين بيانات إضافية في Firestore
        await setDoc(doc(db, "users", cred.user.uid), {
            uid: cred.user.uid,
            name: displayName,
            email: email,
            phone: phone,
            joined: serverTimestamp(),
            orders: 0,
            createdAt: new Date().toISOString()
        });

        return cred.user;
    } catch (error) {
        console.error("Registration Error:", error.message);
        throw error;
    }
}
window.register = register; // تصدير الدالة تحتها مباشرة

// --- 3. دالة تسجيل الدخول بالإيميل ---
async function login(email, password) {
    try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        return cred.user;
    } catch (error) {
        console.error("Login Error:", error.message);
        throw error;
    }
}
window.login = login; // تصدير الدالة تحتها مباشرة

// --- 4. دالة الدخول عبر جوجل ---
async function loginGoogle() {
    try {
        const cred = await signInWithPopup(auth, googleProvider);
        const userRef = doc(db, "users", cred.user.uid);
        const snap = await getDoc(userRef);

        // إذا كان مستخدم جديد، أنشئ له سجلاً في Firestore
        if (!snap.exists()) {
            await setDoc(userRef, {
                uid: cred.user.uid,
                name: cred.user.displayName || "User",
                email: cred.user.email,
                joined: serverTimestamp()
            });
        }
        return cred.user;
    } catch (error) {
        console.error("Google Login Error:", error.message);
        throw error;
    }
}
window.loginGoogle = loginGoogle; // تصدير الدالة تحتها مباشرة

// --- 5. تسجيل الخروج ---
async function logout() {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout Error:", error.message);
    }
}
window.logout = logout; // تصدير الدالة تحتها مباشرة

// --- 6. وظائف الواجهة المتعلقة بـ Auth ---
function openAuth() {
    if (window.currentUser) {
        if (typeof openMyAccount === "function") openMyAccount();
    } else {
        if (typeof showAuthModal === "function") showAuthModal();
    }
}
window.openAuth = openAuth; // تصدير الدالة تحتها مباشرة

// تصدير الدوال ككائن موحد أيضاً للاحتياط
window.authSystem = {
    register,
    login,
    loginGoogle,
    logout,
    openAuth
};
