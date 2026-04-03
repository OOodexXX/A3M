/* ============================================================
   A3M-PRINT - DESIGNER.JS (نظام المصمم والرسم)
   ============================================================ */

// 1. إعدادات اللوحة (Canvas Settings)
let canvas, ctx;
let isDrawing = false;
let currentMode = 'template'; // 'template' or 'scratch'

// 2. فتح وإغلاق المصمم
function openDesigner(mode = 'template') {
    currentMode = mode;
    const modal = document.getElementById('designerModal');
    if (!modal) return;

    modal.classList.add('open');
    
    // تغيير العنوان بناءً على النمط
    const title = document.getElementById('topbarTitle');
    if (title) {
        title.textContent = mode === 'template' ? 'Templates Mode' : 'Scratch Mode';
    }

    // تهيئة الكانفاس بعد فتح المودال بفترة بسيطة لضمان تحميل الأبعاد
    setTimeout(() => {
        initCanvas();
        if (mode === 'template') {
            buildTemplates();
        }
        drawAll();
    }, 100);
}

function closeDesigner() {
    const modal = document.getElementById('designerModal');
    if (modal) modal.classList.remove('open');
}

// 3. تهيئة الكانفاس (Canvas Initialization)
function initCanvas() {
    canvas = document.getElementById('mainCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    
    // إعدادات الرسم الافتراضية
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
}

// 4. بناء القوالب الجاهزة (Build Templates)
function buildTemplates() {
    const container = document.getElementById('templatesList');
    if (!container || typeof TEMPLATES === 'undefined') return;

    container.innerHTML = "";
    TEMPLATES.forEach((tpl, index) => {
        const item = document.createElement('div');
        item.className = 'template-item';
        item.innerHTML = `<img src="${tpl.preview}" alt="Template ${index}">`;
        item.onclick = () => applyTemplate(index);
        container.appendChild(item);
    });
}

function applyTemplate(index) {
    if (typeof TEMPLATES !== 'undefined' && TEMPLATES[index]) {
        // تنفيذ دالة القالب المخزنة
        clearCanvas();
        TEMPLATES[index].fn(); 
        drawAll();
        if (typeof showToast === "function") showToast("تم تطبيق القالب ✨");
    }
}

// 5. وظائف الرسم الأساسية
function drawAll() {
    if (!ctx) return;
    // هنا يتم استدعاء كل عناصر الرسم (نصوص، صور، أشكال)
    console.log("Canvas Redraw Triggered");
}

function clearCanvas() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// 6. اختيار الأنماط (Mode Picker)
function openModePicker() {
    const picker = document.getElementById('modePicker');
    if (picker) picker.classList.add('open');
}

function closeModePicker() {
    const picker = document.getElementById('modePicker');
    if (picker) picker.classList.remove('open');
}

// 7. ربط الدوال بالنظام العالمي (Global Access)
window.openDesigner = openDesigner;
window.closeDesigner = closeDesigner;
window.openModePicker = openModePicker;
window.closeModePicker = closeModePicker;
window.drawAll = drawAll;
window.clearCanvas = clearCanvas;

// إغلاق المودال عند الضغط خارجه [من الصور المرفقة]
document.addEventListener('DOMContentLoaded', () => {
    const designerModal = document.getElementById('designerModal');
    if (designerModal) {
        designerModal.addEventListener('click', (e) => {
            if (e.target === designerModal) closeDesigner();
        });
    }
});