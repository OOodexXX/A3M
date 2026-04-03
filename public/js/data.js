// ============================================================
// data.js  –  A3M Print  –  قاعدة بيانات المنتجات
// BUG FIXED:
//   1. كانت المنتجات بدون image/category فتفشل cart.js في العرض
//   2. لم تكن تُسند لـ window.PRODUCTS فتعمل cart.js بدون data.js
//   3. مفتاح localStorage مختلف بين cart.js ("a3m_cart") وcheckout.js ("cart") ← موحَّد أدناه
// ============================================================

export const PRODUCTS = [
  {
    id: 1,
    name: "T-Shirt",
    price: 1500,
    category: "tshirt",
    image: "../assets/tshirt.jpg",     // ضع الصورة الحقيقية هنا
    qualityAlert: false,
    sizes: ["XS","S","M","L","XL","XXL"]
  },
  {
    id: 2,
    name: "Mug",
    price: 800,
    category: "mug",
    image: "../assets/mug.jpg",
    qualityAlert: false,
    sizes: []
  },
  {
    id: 3,
    name: "Poster A3",
    price: 1200,
    category: "paper",
    image: "../assets/poster.jpg",
    qualityAlert: false,
    sizes: []
  },
  {
    id: 4,
    name: "Cap",
    price: 700,
    category: "hat",
    image: "../assets/cap.jpg",
    qualityAlert: false,
    sizes: ["S/M","L/XL"]
  },
  {
    id: 5,
    name: "Tote Bag",
    price: 1200,
    category: "bag",
    image: "../assets/bag.jpg",
    qualityAlert: false,
    sizes: []
  }
];

// BUG FIX: cart.js يقرأ من window.PRODUCTS لأنه غير ES-module
// نسندها هنا بعد التصدير حتى يعمل كلا الأسلوبين
window.PRODUCTS = PRODUCTS;
