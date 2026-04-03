/* ============ SIDEBAR ============ */
function openSidebar(){document.getElementById('sidebar').classList.add('open');document.getElementById('sidebarOverlay').classList.add('open')}
function closeSidebar(){document.getElementById('sidebar').classList.remove('open');document.getElementById('sidebarOverlay').classList.remove('open')}
function toggleSB(el,subId){
  el.classList.toggle('open');
  const sub=document.getElementById('sub-'+subId);
  sub.style.display=el.classList.contains('open')?'block':'none';
}

/* ============ LANG / THEME / CURRENCY ============ */
function setCurrency(c){
  currency=c;
  document.getElementById('btnDZD').classList.toggle('active',c==='DZD');
  document.getElementById('btnUSD').classList.toggle('active',c==='USD');
  renderProducts(currentCat);updateCart();if(currentModalProduct)updateModalTotal();
}

function applyLang(lang){
  const t=T[lang];
  document.body.setAttribute('dir',t.dir);
  document.body.style.fontFamily=lang==='ar'?"'Cairo',sans-serif":"'Inter',sans-serif";
  document.getElementById('langBtn').textContent=`${t.flag} ${t.code} ▾`;
  document.querySelectorAll('.lang-option').forEach((el,i)=>el.classList.toggle('active',['en','fr','ar'][i]===lang));
  ['n-home','n-products','n-design','n-contact'].forEach((id,i)=>document.getElementById(id).textContent=[t.home,t.products,t.design,t.contact][i]);
  document.getElementById('heroEyebrow').textContent=t.eyebrow;
  document.getElementById('heroSub').textContent=t.sub;
  document.getElementById('shopNowBtn').textContent=t.shopNow;
  document.getElementById('startDesignBtn').textContent=t.startDesign;
  document.getElementById('bannerMain').innerHTML=t.bannerMain+'<span id="bannerSub"> '+t.bannerSub+'</span>';
  document.getElementById('startDesignBtn2').textContent=t.startDesign2;
  document.getElementById('sectionTitle').innerHTML=t.secTitle;
  document.getElementById('sectionSub').textContent=t.secSub;
  ['c-all','c-tshirt','c-mug','c-hat','c-bag','c-laser','c-paper'].forEach((id,i)=>
    document.getElementById(id).textContent=[t.cAll,t.cTshirt,t.cMug,t.cHat,t.cBag,t.cLaser,t.cPaper][i]);
  document.getElementById('designNowBtn').textContent=t.designNow;
  document.getElementById('themeLabel').textContent=isDark?t.thDark:t.thLight;
  document.getElementById('footerTagline').textContent=t.footer;
  document.getElementById('modePickerSub').textContent=t.modePickerSub;
  document.getElementById('modeTemplate').textContent=t.modeTemplate;
  document.getElementById('modeTemplateDesc').textContent=t.modeTemplateDesc;
  document.getElementById('modeScratch').textContent=t.modeScratch;
  document.getElementById('modeScratchDesc').textContent=t.modeScratchDesc;
  // order form
  document.getElementById('orderTitle').textContent=t.orderTitle;
  ['fName','fPhone','fEmail','fProduct','fQty','fBudget','fPrintType','fCity','fNotes','submitBtn'].forEach(id=>{
    const el=document.getElementById(id);if(el)el.textContent=t[id]||el.textContent;
  });
  document.getElementById('sb-order').textContent=t.sbOrder;
  // sidebar labels
  [['sb-disc',t.sbDisc||'Discounts']].forEach(([id,v])=>{const e=document.getElementById(id);if(e)e.textContent=v});
  updateCart();renderProducts(currentCat);
}
function setLang(lang){currentLang=lang;document.getElementById('langDropdown').classList.remove('open');applyLang(lang)}
function toggleLangMenu(){document.getElementById('langDropdown').classList.toggle('open')}

/* ============ THEME SYSTEM ============ */
let themeColor='blue', themeMode='dark';
const THEME_NAMES={blue:'Blue',beige:'Beige',purple:'Purple',white:'White'};
const MODE_NAMES={dark:'Dark',light:'Light'};

function toggleThemePicker(){document.getElementById('themeDropdown').classList.toggle('open')}
function closeThemePicker(){document.getElementById('themeDropdown').classList.remove('open')}

function setThemeColor(color){
  themeColor=color;
  applyTheme();
  document.querySelectorAll('.theme-color-btn').forEach(b=>b.classList.toggle('active',b.dataset.color===color));
}
function setThemeMode(mode){
  themeMode=mode;
  applyTheme();
  document.getElementById('modeBtnDark').classList.toggle('active',mode==='dark');
  document.getElementById('modeBtnLight').classList.toggle('active',mode==='light');
}
function applyTheme(){
  const cls=themeColor+'-'+themeMode;
  document.body.className=cls;
  const preview=document.getElementById('themePreview');
  if(preview)preview.textContent=THEME_NAMES[themeColor]+' · '+MODE_NAMES[themeMode];
  const lbl=document.getElementById('themeLabel');
  if(lbl)lbl.textContent=THEME_NAMES[themeColor];
  localStorage.setItem('a3m_theme',JSON.stringify({themeColor,themeMode}));
}
function loadSavedTheme(){
  try{
    const s=JSON.parse(localStorage.getItem('a3m_theme'));
    if(s){themeColor=s.themeColor||'blue';themeMode=s.themeMode||'dark';}
  }catch{}
  applyTheme();
  document.querySelectorAll('.theme-color-btn').forEach(b=>b.classList.toggle('active',b.dataset.color===themeColor));
  document.getElementById('modeBtnDark').classList.toggle('active',themeMode==='dark');
  document.getElementById('modeBtnLight').classList.toggle('active',themeMode==='light');
}

// Keep old toggleTheme for any remaining references
function toggleTheme(){themeMode=themeMode==='dark'?'light':'dark';setThemeMode(themeMode)}
function filterCat(cat,el){
  currentCat=cat;document.querySelectorAll('.cat-btn').forEach(b=>b.classList.remove('active'));
  el.classList.add('active');renderProducts(cat);
}
function scrollToTop(){window.scrollTo({top:0,behavior:'smooth'})}

/* ============ GLOBAL EVENTS ============ */
document.addEventListener('click',e=>{
  if(!e.target.closest('.lang-wrapper'))document.getElementById('langDropdown').classList.remove('open');
  if(!e.target.closest('.theme-wrapper'))closeThemePicker();
});
document.getElementById('prodModal').addEventListener('click',function(e){if(e.target===this)closeProdModal()});
document.getElementById('orderModal').addEventListener('click',function(e){if(e.target===this)closeOrderForm()});
document.getElementById('modePicker').addEventListener('click',function(e){if(e.target===this)closeModePicker()});

/* ============ INIT ============ */
loadSavedTheme();
applyLang('en');
drawAll();