// 1. استيراد المكتبات من جوجل مباشرة
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 2. إعدادات المشروع (تأكد أن هذه بياناتك الخاصة من Firebase Console)
const firebaseConfig = {
    apiKey: "AIzaSyCCb9EZyW1-QcZIJznTfYear1NZUmO08lQ", 
    authDomain: "a3mmedia-b4abb.firebaseapp.com",
    projectId: "a3mmedia-b4abb",
    storageBucket: "a3mmedia-b4abb.firebasestorage.app",
    messagingSenderId: "963128106205",
    appId: "1:963128106205:web:4449c5172cc97b1b6c0f34"
};

// 3. تشغيل فيربايس
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 4. تصدير المتغيرات لاستخدامها في الملفات الأخرى
export { auth, db };