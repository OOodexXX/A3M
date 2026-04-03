// ============================================================
// designer.js  –  A3M Print  –  Canvas Design Studio
// BUG FIXED:
//   1. كانت مجرد console.log بدون أي تنفيذ
//   2. الآن: هيكل كامل جاهز للربط مع الـ canvas الحالي
// ============================================================

function initDesigner(canvasId = "designCanvas") {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.warn("initDesigner: لم يُعثر على canvas بالمعرف:", canvasId);
    return;
  }
  const ctx = canvas.getContext("2d");

  // ── حالة الديزاينر ──
  const state = {
    layers:     [],
    selectedId: null,
    tool:       "select",
    bgColor:    "#ffffff",
    history:    [],
    productType:"tshirt"
  };

  // ── رسم ابتدائي ──
  _drawAll(ctx, canvas, state);

  console.log("✦ A3M Designer initialized on:", canvasId);
  return { state, redraw: () => _drawAll(ctx, canvas, state) };
}

// ── رسم الكانفا ──
function _drawAll(ctx, canvas, state) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = state.bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const emoji = { tshirt:"👕", mug:"☕", hat:"🧢", bag:"🎒", paper:"📄" };
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.font = "200px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#888";
  ctx.fillText(emoji[state.productType] || "👕", canvas.width / 2, canvas.height / 2);
  ctx.restore();

  state.layers.filter(l => l.visible !== false).forEach(l => _drawLayer(ctx, l, state));
}

// ── رسم طبقة ──
function _drawLayer(ctx, l, state) {
  ctx.save();
  ctx.globalAlpha = (l.opacity ?? 100) / 100;
  ctx.translate(l.x, l.y);
  if (l.rotation) ctx.rotate(l.rotation * Math.PI / 180);

  const hw = l.w / 2, hh = l.h / 2;

  if (l.type === "text") {
    ctx.font = `${l.fontSize}px '${l.font || "Inter"}'`;
    ctx.fillStyle = l.fillColor || "#000";
    ctx.textAlign = l.textAlign || "center";
    ctx.textBaseline = "middle";
    ctx.fillText(l.text, 0, 0);
  } else if (l.type === "rect") {
    ctx.fillStyle = l.fillColor;
    ctx.fillRect(-hw, -hh, l.w, l.h);
    if (l.strokeColor && l.strokeWidth) {
      ctx.strokeStyle = l.strokeColor;
      ctx.lineWidth = l.strokeWidth;
      ctx.strokeRect(-hw, -hh, l.w, l.h);
    }
  } else if (l.type === "circle") {
    ctx.beginPath();
    ctx.arc(0, 0, hw, 0, Math.PI * 2);
    ctx.fillStyle = l.fillColor;
    ctx.fill();
    if (l.strokeColor && l.strokeWidth) {
      ctx.strokeStyle = l.strokeColor;
      ctx.lineWidth = l.strokeWidth;
      ctx.stroke();
    }
  } else if (l.type === "image" && l.img) {
    ctx.drawImage(l.img, -hw, -hh, l.w, l.h);
  }

  ctx.restore();
}

window.initDesigner = initDesigner;
