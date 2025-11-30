let currentCoffeeId = null;

const menuGrid = document.getElementById('menuGrid');
const modalOverlay = document.getElementById('modalOverlay');
const rImage = document.getElementById('rImage');
const userBtn = document.getElementById('userBtn');
const homeTab = document.getElementById('homeTab');
const allTab = document.getElementById('allTab');
const liquorTab = document.getElementById('liquorTab');
const customTab = document.getElementById('customTab');
const favTab = document.getElementById('favTab');
const sidebar = document.getElementById('sidebar');
const FAVORITES_KEY = 'coffeeFavorites';
const CUSTOM_STEPS_KEY = 'coffeeCustomSteps';
const PINNED_KEY = 'coffeePinnedItems';
const CUSTOM_RECIPES_KEY = 'customRecipes';
const CUSTOM_META_KEY = 'coffeeCustomMeta'; // 存储默认饮品的自定义标题/描述（覆盖显示用）
const CUSTOM_IMAGE_KEY = 'coffeeCustomImage'; // 存储默认饮品的自定义图片（覆盖显示用）
const addCustomBtn = document.getElementById('addCustomBtn');
const inputTitle = document.getElementById('inputTitle');
const inputDesc = document.getElementById('inputDesc');
const inputImage = document.getElementById('inputImage');
const inputImageCamera = document.getElementById('inputImageCamera');
const uploadTile = document.getElementById('uploadTile');
const uploadChoices = document.getElementById('uploadChoices');
const chooseGallery = document.getElementById('chooseGallery');
const chooseCamera = document.getElementById('chooseCamera');
const customInputs = document.getElementById('customInputs');
const confirmOverlay = document.getElementById('confirmOverlay');
const overwriteBtn = document.getElementById('overwriteBtn');
const duplicateBtn = document.getElementById('duplicateBtn');
const cancelChangesBtn = document.getElementById('cancelChangesBtn');
const overlayInputImage = document.getElementById('overlayInputImage');
const overlayInputImageCamera = document.getElementById('overlayInputImageCamera');
const overlayUploadTile = document.getElementById('overlayUploadTile');
const overlayUploadChoices = document.getElementById('overlayUploadChoices');
const overlayChooseGallery = document.getElementById('overlayChooseGallery');
const overlayChooseCamera = document.getElementById('overlayChooseCamera');
const imageContainer = document.querySelector('.image-container');

function __setContainerAspect(){
    if (!imageContainer || !rImage) return;
    const nw = rImage.naturalWidth;
    const nh = rImage.naturalHeight;
    if (!nw || !nh) return;
    const ratio = nw / nh;
    const LONG_WIDE = 2.6; // 更宽的极端长图阈值，提高动态贴合比例的覆盖面
    const LONG_TALL = 0.5; // 更高的极端长图阈值，提高动态贴合比例的覆盖面
    if (ratio > LONG_WIDE || ratio < LONG_TALL) {
        imageContainer.style.aspectRatio = '3 / 4';
    } else {
        imageContainer.style.aspectRatio = `${nw} / ${nh}`;
    }
}
function __resetContainerAspect(){ if (imageContainer) imageContainer.style.aspectRatio = '3 / 4'; }
if (rImage) rImage.addEventListener('load', __setContainerAspect);
const imgPreviewOverlay = document.getElementById('imagePreviewOverlay');
const imgPreviewImg = document.getElementById('imagePreviewImg');
const imgPreviewClose = document.getElementById('imagePreviewClose');
let __prevStartX = 0;
let __prevStartY = 0;
let __prevDX = 0;
let __prevDY = 0;
function openImagePreview(){
    if (!imgPreviewOverlay || !imgPreviewImg || !rImage) return;
    imgPreviewImg.src = rImage.src || '';
    imgPreviewOverlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}
function closeImagePreview(){
    if (!imgPreviewOverlay) return;
    imgPreviewOverlay.style.display = 'none';
    document.body.style.overflow = '';
}
if (imgPreviewClose) imgPreviewClose.onclick = ()=>{ closeImagePreview(); };
if (imgPreviewOverlay) imgPreviewOverlay.onclick = (e)=>{ if (e.target === imgPreviewOverlay) closeImagePreview(); };
function __prevReset(){ __prevStartX = 0; __prevStartY = 0; __prevDX = 0; __prevDY = 0; if (imgPreviewImg) { imgPreviewImg.style.transition=''; imgPreviewImg.style.transform=''; } }
function __prevTouchStart(e){ const t = e.touches && e.touches[0]; if (!t) return; __prevStartX = t.clientX; __prevStartY = t.clientY; if (imgPreviewImg) imgPreviewImg.style.transition = 'none'; }
function __prevTouchMove(e){ const t = e.touches && e.touches[0]; if (!t) return; const dx = t.clientX - __prevStartX; const dy = t.clientY - __prevStartY; __prevDX = dx; __prevDY = dy; if (Math.abs(dx) > 12 || Math.abs(dy) > 12) { e.preventDefault(); if (imgPreviewImg) { const y = Math.max(0, dy); const x = Math.max(0, dx); imgPreviewImg.style.transform = `translate(${x}px, ${y}px)`; } } }
function __prevTouchEnd(){ if (__prevDX > 120 || __prevDY > 120) { __prevReset(); closeImagePreview(); } else { __prevReset(); } }
if (imgPreviewOverlay) {
  imgPreviewOverlay.addEventListener('touchstart', __prevTouchStart, {passive:true});
  imgPreviewOverlay.addEventListener('touchmove', __prevTouchMove, {passive:false});
  imgPreviewOverlay.addEventListener('touchend', __prevTouchEnd, {passive:true});
}
// 冻结区尺寸写入 CSS 变量：--header-h、--nav-h、--freeze-h 供布局偏移计算
const headerEl = document.querySelector('header');
const sectionTitleEl = document.querySelector('.section-title');
function updateHeaderHeightVar(){
  const h = headerEl ? headerEl.offsetHeight : 0; // 顶部标题高度
  const n = sectionTitleEl ? sectionTitleEl.offsetHeight : 0; // 导航行高度
  const f = h + n; // 冻结区总高度
  const root = document.documentElement;
  root.style.setProperty('--header-h', h + 'px');
  root.style.setProperty('--nav-h', n + 'px');
  root.style.setProperty('--freeze-h', f + 'px');
}
// 多次刷新高度，避免首帧/字体加载导致测量不准：立即、下一帧、延时 200ms
function scheduleFreezeUpdate(){
  updateHeaderHeightVar();
  requestAnimationFrame(updateHeaderHeightVar);
  setTimeout(updateHeaderHeightVar, 200);
}
scheduleFreezeUpdate();
window.addEventListener('resize', scheduleFreezeUpdate);
window.addEventListener('load', scheduleFreezeUpdate);
// 字体就绪后再刷新一次，确保排版最终高度正确
if (document.fonts && document.fonts.ready) { document.fonts.ready.then(scheduleFreezeUpdate); }

// 临时清理逻辑：清除可能意外存在的默认特调数据
try {
    const raw = localStorage.getItem(CUSTOM_STEPS_KEY);
    if (raw) {
        const map = JSON.parse(raw);
        const toRemove = ['latte', 'espresso', 'americano'];
        let changed = false;
        toRemove.forEach(id => {
            if (map[id]) {
                delete map[id];
                changed = true;
            }
        });
        if (changed) {
            localStorage.setItem(CUSTOM_STEPS_KEY, JSON.stringify(map));
        }
    }
} catch (e) {}

let isEditingSteps = false;
const editBtn = document.getElementById('editStepsBtn');
const editDotsBtn = document.getElementById('editDotsBtn');
const addBtn = document.getElementById('addStepBtn');
const resetBtn = document.getElementById('resetStepsBtn');
let currentView = 'home'; // 'home' or 'user'
let isAddCustomMode = false;
let tempImageData = null;
let currentItemSource = null; // 'home' | 'custom' | 'fav'
let origImageData = '';

function showToast(msg){
    const t = document.getElementById('toast');
    if(!t) return;
    t.innerHTML = `<span class="toast-msg">${msg}</span><button class="toast-close" id="toastClose" aria-label="关闭">×</button>`;
    t.classList.add('show');
    if (window.__toastTimer) { clearTimeout(window.__toastTimer); }
    const closeBtn = document.getElementById('toastClose');
    if (closeBtn) closeBtn.onclick = ()=>{ t.classList.remove('show'); if (window.__toastTimer) { clearTimeout(window.__toastTimer); window.__toastTimer = null; } };
    window.__toastTimer = setTimeout(()=>{ t.classList.remove('show'); window.__toastTimer = null; }, 5000);
}

function getCustomRecipes(){
    try { return JSON.parse(localStorage.getItem(CUSTOM_RECIPES_KEY) || '[]'); } catch(e){ return []; }
}

function getCurrentCoffee(){
    return [...coffeeData, ...(typeof liquorData!=='undefined'?liquorData:[]), ...getCustomRecipes()].find(c=>c.id===currentCoffeeId);
}

function renderStepsList(steps){
    const list = document.getElementById('rSteps');
    list.innerHTML = '';
    steps.forEach(s=>list.innerHTML+=`<li>${s}</li>`);
}

function startEditing(){
    const list = document.getElementById('rSteps');
    const items = Array.from(list.querySelectorAll('li')).map(li=>li.innerText.trim());
    list.innerHTML = '';
    items.forEach(text=>{
        const li = document.createElement('li');
        const input = document.createElement('input');
        input.className = 'step-input';
        input.value = text;
        li.appendChild(input);
        list.appendChild(li);
    });
    isEditingSteps = true;
    if (editBtn) editBtn.textContent = '完成编辑';
    if (addBtn) addBtn.style.display = 'inline-block';
}

function finishEditing(){
    const inputs = Array.from(document.querySelectorAll('#rSteps input.step-input'));
    const next = inputs.map(i=>i.value.trim()).filter(v=>v.length>0);
    renderStepsList(next);
    isEditingSteps = false;
    if (editBtn) editBtn.textContent = '编辑步骤';
    if (addBtn) addBtn.style.display = 'none';
    if (editBtn) editBtn.style.display = 'none'; // 结束编辑后收起“编辑步骤”按钮
    if (resetBtn) resetBtn.style.display = 'none'; // 结束编辑后收起“恢复默认”按钮
    const t = document.getElementById('rTitle');
    const d = document.getElementById('rDesc');
    if (customInputs) customInputs.style.display = 'none';
    if (t) t.style.display = '';
    if (d) d.style.display = '';
    
    // 【修复代码】强制隐藏编辑模式下的返回键，防止出现两个返回键
    const customBack = document.getElementById('customBackBtn');
    if (customBack) customBack.style.display = 'none';

    if (rImage) { rImage.style.cursor = ''; rImage.onclick = null; }
    const dotsBtn = document.getElementById('editDotsBtn');
    if (dotsBtn) dotsBtn.style.display = 'inline-flex'; // 恢复三点按钮显示
}

function addStep(){
    if(!isEditingSteps) return;
    const li = document.createElement('li');
    const input = document.createElement('input');
    input.className = 'step-input';
    input.placeholder = '新步骤';
    li.appendChild(input);
    document.getElementById('rSteps').appendChild(li);
    input.focus();
}

function resetSteps(){
    const id = currentCoffeeId;
    const map = JSON.parse(localStorage.getItem(CUSTOM_STEPS_KEY) || '{}');
    delete map[id];
    localStorage.setItem(CUSTOM_STEPS_KEY, JSON.stringify(map));
    const coffee = getCurrentCoffee();
    renderStepsList(coffee.steps);
    isEditingSteps = false;
    if (editBtn) editBtn.textContent = '编辑步骤';
    if (addBtn) addBtn.style.display = 'none';
}

if (editBtn) editBtn.onclick = ()=>{ if(!isEditingSteps) startEditing(); else finishEditing(); };
if (editDotsBtn) editDotsBtn.onclick = ()=>{ showEditHint(); }; // 三点仅弹出编辑提示，不直接进入编辑
if (addBtn) addBtn.onclick = addStep;
if (resetBtn) resetBtn.onclick = resetSteps;

function updateSidebar(type) {
    if (!sidebar) return;
    sidebar.style.display = 'flex';
    
    if (type === 'home') {
        if (allTab) allTab.style.display = 'block';
        if (liquorTab) liquorTab.style.display = 'block';
        if (customTab) customTab.style.display = 'none';
        if (favTab) favTab.style.display = 'none';
    } else if (type === 'user') {
        if (allTab) allTab.style.display = 'none';
        if (liquorTab) liquorTab.style.display = 'none';
        if (customTab) customTab.style.display = 'block';
        if (favTab) favTab.style.display = 'block';
    }
}

function renderHomeView() {
    currentView = 'home';
    updateSidebar('home');
    menuGrid.innerHTML = '';
    
    // Create Coffee Section
    const coffeeSection = document.createElement('div');
    coffeeSection.id = 'section-coffee';
    coffeeData.forEach(c => {
        const item = document.createElement('div');
        item.className = 'menu-item';
        const iconHtml = c.image ? `<img class=\"menu-thumb\" src=\"${c.image}\" alt=\"\">` : `${c.icon}`;
        item.innerHTML = `<div class=\"menu-icon\">${iconHtml}</div><div class=\"menu-name\">${c.name.replace('\\n','<br>')}</div>`;
        item.onclick = ()=>{ 
            item.classList.remove('highlight-flash');
            void item.offsetWidth;
            item.classList.add('highlight-flash');
            setTimeout(()=>{ item.classList.remove('highlight-flash'); }, 800);
            openModal(c.id, 'home');
        };
        coffeeSection.appendChild(item);
    });
    menuGrid.appendChild(coffeeSection);

    // Create Liquor Section
    const liquorSection = document.createElement('div');
    liquorSection.id = 'section-liquor';
    (typeof liquorData !== 'undefined' ? liquorData : []).forEach(c => {
        const item = document.createElement('div');
        item.className = 'menu-item';
        const iconHtml = c.image ? `<img class=\"menu-thumb\" src=\"${c.image}\" alt=\"\">` : `${c.icon || '🍸'}`;
        item.innerHTML = `<div class=\"menu-icon\">${iconHtml}</div><div class=\"menu-name\">${(c.name || '').replace('\\n','<br>')}</div>`;
        item.onclick = ()=>{ 
            item.classList.remove('highlight-flash');
            void item.offsetWidth;
            item.classList.add('highlight-flash');
            setTimeout(()=>{ item.classList.remove('highlight-flash'); }, 800);
            openModal(c.id, 'home');
        };
        liquorSection.appendChild(item);
    });
    menuGrid.appendChild(liquorSection);

    // Initial Active State
    if (allTab) allTab.classList.add('active');
    if (liquorTab) liquorTab.classList.remove('active');
}

function createSwipeItem(c, isPinned, onPin, onDelete, onClick) {
    const wrapper = document.createElement('div');
    wrapper.className = 'menu-item swipe-item';

    const content = document.createElement('div');
    content.className = 'swipe-content';
    if (isPinned) content.style.backgroundColor = '#fffbf0'; 
    let displayName = c.name; // 默认显示原始标题
    let displayImage = c.image || ''; // 默认显示原始图片
    if (currentView === 'user' && !String(c.id).startsWith('custom-')) {
        try {
            const stepsMap = JSON.parse(localStorage.getItem(CUSTOM_STEPS_KEY) || '{}'); // 仅当存在自定义步骤时才应用标题/图片覆盖
            const hasCustom = Array.isArray(stepsMap[c.id]);
            if (hasCustom) {
                const metaMap = JSON.parse(localStorage.getItem(CUSTOM_META_KEY) || '{}'); // 读取自定义标题/描述
                const imgMap = JSON.parse(localStorage.getItem(CUSTOM_IMAGE_KEY) || '{}'); // 读取自定义图片
                const meta = metaMap[c.id];
                if (meta && meta.name) displayName = meta.name; // 用户视图卡片名称覆盖显示
                if (imgMap[c.id]) displayImage = imgMap[c.id]; // 用户视图卡片图片覆盖显示
            }
        } catch(e) {}
    }
    const iconHtml = displayImage ? `<img class=\"menu-thumb\" src=\"${displayImage}\" alt=\"\">` : `${c.icon}`; // 优先用覆盖图片
    content.innerHTML = `<div class=\"menu-icon\">${iconHtml}</div><div class=\"menu-name\">${displayName.replace('\\n','<br>')}</div>`; // 名称支持换行符

    const actions = document.createElement('div');
    actions.className = 'swipe-actions';

    const pinBtn = document.createElement('button');
    pinBtn.className = 'swipe-btn btn-pin';
    pinBtn.innerHTML = `<span class="pin-wrap"><svg viewBox="0 0 24 24" width="20" height="20"><path d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z" /></svg>${isPinned?'<svg class="pin-slash" viewBox="0 0 24 24" width="20" height="20"><path d="M4 20 L20 4" stroke="#795548" stroke-width="2" stroke-linecap="round"/></svg>':''}</span>`;
    pinBtn.onclick = (e) => { e.stopPropagation(); onPin(); };

    const delBtn = document.createElement('button');
    delBtn.className = 'swipe-btn btn-delete';
    delBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" /></svg>`;
    delBtn.onclick = (e) => { e.stopPropagation(); onDelete(); };

    actions.appendChild(pinBtn);
    actions.appendChild(delBtn);
    wrapper.appendChild(content);
    wrapper.appendChild(actions);

    const hoverPin = document.createElement('div');
    hoverPin.className = 'card-pin';
    hoverPin.title = isPinned ? '取消置顶' : '置顶';
    hoverPin.innerHTML = `<span class="pin-wrap"><svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:${isPinned?'#FFC107':'#9E9E9E'}"><path d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z" /></svg>${isPinned?'<svg class="pin-slash" viewBox="0 0 24 24" style="width:16px;height:16px;"><path d="M4 20 L20 4" stroke="#795548" stroke-width="2" stroke-linecap="round"/></svg>':''}</span>`;
    hoverPin.onclick = (e) => { e.stopPropagation(); onPin(); };

    const hoverDel = document.createElement('div');
    hoverDel.className = 'card-delete';
    hoverDel.title = '删除';
    hoverDel.innerHTML = `<svg viewBox=\"0 0 24 24\" style=\"width:16px;height:16px;fill:#795548\"><path d=\"M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z\" /></svg>`;
    hoverDel.onclick = (e) => { e.stopPropagation(); onDelete(); };

    wrapper.appendChild(hoverPin);
    wrapper.appendChild(hoverDel);

    content._swipeState = 0; 
    let startX = 0; // 触摸起始横坐标（用于横向滑动）
    let startY = 0; // 触摸起始纵坐标（用于判断是否应拦截默认滚动）
    let currentX = 0;
    const maxSwipe = 140; 
    let isDragging = false;

    content.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        content.style.transition = 'none';
        isDragging = false;
    }, {passive: true});

    // 当横向滑动幅度大于纵向时，主动阻止默认滚动，避免整页晃动
    content.addEventListener('touchmove', (e) => {
        const x = e.touches[0].clientX;
        const y = e.touches[0].clientY;
        const delta = x - startX;
        const deltaY = y - startY;
        let targetX = content._swipeState + delta;
        if (targetX > 0) targetX = 0;
        if (targetX < -maxSwipe - 20) targetX = -maxSwipe - 20;
        if (Math.abs(delta) > 5) {
            isDragging = true;
            content.style.transform = `translateX(${targetX}px)`;
            currentX = targetX;
            if (Math.abs(delta) > Math.abs(deltaY)) {
                e.preventDefault();
            }
        }
    }, {passive: false});

    const endSwipe = () => {
        content.style.transition = 'transform 0.2s ease-out';
        let finalState = content._swipeState;
        if (content._swipeState === 0) {
            if (currentX < -maxSwipe / 3) {
                finalState = -maxSwipe;
                document.querySelectorAll('.swipe-content').forEach(el => {
                    if(el !== content && el._swipeState !== 0) {
                        el.style.transform = 'translateX(0)';
                        el._swipeState = 0;
                    }
                });
            } else {
                finalState = 0;
            }
        } else {
            if (currentX > -maxSwipe * 2/3) {
                finalState = 0;
            } else {
                finalState = -maxSwipe;
            }
        }
        content.style.transform = `translateX(${finalState}px)`;
        content._swipeState = finalState;
        setTimeout(() => { isDragging = false; }, 50);
    };

    content.addEventListener('touchend', endSwipe);

    let isMouseDown = false;
    content.addEventListener('mousedown', (e) => {
        isMouseDown = true;
        startX = e.clientX;
        content.style.transition = 'none';
        isDragging = false;
    });

    content.addEventListener('mousemove', (e) => {
        if(!isMouseDown) return;
        e.preventDefault();
        const x = e.clientX;
        const delta = x - startX;
        let targetX = content._swipeState + delta;
        if (targetX > 0) targetX = 0;
        if (targetX < -maxSwipe - 20) targetX = -maxSwipe - 20;
        if (Math.abs(delta) > 5) {
            isDragging = true;
            content.style.transform = `translateX(${targetX}px)`;
            currentX = targetX;
        }
    });

    content.addEventListener('mouseup', (e) => {
        if(!isMouseDown) return;
        isMouseDown = false;
        endSwipe();
    });
    content.addEventListener('mouseleave', (e) => {
        if(isMouseDown) {
            isMouseDown = false;
            endSwipe();
        }
    });

    content.addEventListener('click', (e) => {
        if (isDragging) {
            e.stopPropagation();
            e.preventDefault();
            return;
        }
        if (content._swipeState !== 0) {
            content._swipeState = 0;
            content.style.transform = 'translateX(0)';
        }
        content.classList.remove('highlight-flash');
        void content.offsetWidth;
        content.classList.add('highlight-flash');
        setTimeout(()=>{ content.classList.remove('highlight-flash'); }, 800);
        onClick();
    });

    return wrapper;
}

function renderUserView() {
    currentView = 'user';
    updateSidebar('user');
    menuGrid.innerHTML = '';

    const pinnedIds = JSON.parse(localStorage.getItem(PINNED_KEY) || '[]');
    const allDrinks = [...coffeeData, ...(typeof liquorData!=='undefined'?liquorData:[]), ...getCustomRecipes()];

    const sortIds = (ids) => {
        return ids.sort((a, b) => {
            const isAPinned = pinnedIds.includes(a);
            const isBPinned = pinnedIds.includes(b);
            if (isAPinned && !isBPinned) return -1;
            if (!isAPinned && isBPinned) return 1;
            return 0;
        });
    };

    // Create My Customs Section
    const customSection = document.createElement('div');
    customSection.id = 'section-custom';
    const recipes = getCustomRecipes();
    const customList = (recipes || []).filter(r => !r.scope || r.scope === 'custom');
    const customIds = customList.map(r=>r.id);
    if (customList.length === 0) {
        customSection.innerHTML = '<div style="padding:20px;color:#999;font-size:0.9rem;">暂无特调记录</div>';
    } else {
        customList.forEach(c => {
            const id = c.id;
            const isPinned = pinnedIds.includes(id);
            const item = createSwipeItem(c, isPinned,
                () => {
                    const idx = pinnedIds.indexOf(id);
                    if (idx > -1) {
                        pinnedIds.splice(idx, 1);
                    } else {
                        pinnedIds.unshift(id);
                        const inSection = pinnedIds.filter(x=> customIds.includes(x));
                        const limit = 2;
                        if (inSection.length > limit) {
                            const toRemove = inSection.slice(limit);
                            toRemove.forEach(rm=>{ const j = pinnedIds.indexOf(rm); if (j>-1) pinnedIds.splice(j,1); });
                        }
                    }
                    localStorage.setItem(PINNED_KEY, JSON.stringify(pinnedIds));
                    renderUserView();
                },
                () => {
                    const next = recipes.filter(r => r.id !== id);
                    localStorage.setItem(CUSTOM_RECIPES_KEY, JSON.stringify(next));
                    renderUserView();
                },
                () => openModal(c.id, 'custom')
            );
            customSection.appendChild(item);
        });
    }
    menuGrid.appendChild(customSection);

    // Create Favorites Section
    const favSection = document.createElement('div');
    favSection.id = 'section-fav';
    
    let favIds = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
    
    if (favIds.length === 0) {
        favSection.innerHTML = '<div style="padding:20px;color:#999;font-size:0.9rem;">暂无收藏</div>';
    } else {
        favIds = sortIds(favIds);
        favIds.forEach(id => {
            const c = allDrinks.find(x => x.id === id);
            if (!c) return;
            const isPinned = pinnedIds.includes(id);
            const item = createSwipeItem(c, isPinned,
                // onPin
                () => {
                    const idx = pinnedIds.indexOf(id);
                    if (idx > -1) {
                        pinnedIds.splice(idx, 1);
                    } else {
                        pinnedIds.unshift(id);
                        const inSection = pinnedIds.filter(x=> favIds.includes(x));
                        const limit = 2;
                        if (inSection.length > limit) {
                            const toRemove = inSection.slice(limit);
                            toRemove.forEach(rm=>{ const j = pinnedIds.indexOf(rm); if (j>-1) pinnedIds.splice(j,1); });
                        }
                    }
                    localStorage.setItem(PINNED_KEY, JSON.stringify(pinnedIds));
                    renderUserView();
                },
                // onDelete
                () => {
                    const newFavs = favIds.filter(fid => fid !== id);
                    localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavs));
                    renderUserView();
                },
                // onClick
                () => openModal(c.id, 'fav')
            );
            favSection.appendChild(item);
        });
    }
    menuGrid.appendChild(favSection);

    // Initial Active State
    if (customTab) customTab.classList.add('active');
    if (favTab) favTab.classList.remove('active');
}

renderHomeView();

// Scroll Spy
let isManualScroll = false;
window.addEventListener('scroll', () => {
    if (isManualScroll) return;
    
    if (currentView === 'home') {
        const coffeeSec = document.getElementById('section-coffee');
        const liquorSec = document.getElementById('section-liquor');
        if (!coffeeSec || !liquorSec) return;

        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 20) {
            if (allTab) allTab.classList.remove('active');
            if (liquorTab) liquorTab.classList.add('active');
            return;
        }
        
        const liquorRect = liquorSec.getBoundingClientRect();
        if (liquorRect.top <= 150) {
            if (allTab) allTab.classList.remove('active');
            if (liquorTab) liquorTab.classList.add('active');
        } else {
            if (allTab) allTab.classList.add('active');
            if (liquorTab) liquorTab.classList.remove('active');
        }
    } else if (currentView === 'user') {
        const customSec = document.getElementById('section-custom');
        const favSec = document.getElementById('section-fav');
        if (!customSec || !favSec) return;

        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 20) {
            if (customTab) customTab.classList.remove('active');
            if (favTab) favTab.classList.add('active');
            return;
        }
        
        const favRect = favSec.getBoundingClientRect();
        if (favRect.top <= 150) {
            if (customTab) customTab.classList.remove('active');
            if (favTab) favTab.classList.add('active');
        } else {
            if (customTab) customTab.classList.add('active');
            if (favTab) favTab.classList.remove('active');
        }
    }
});

function scrollToSection(id, tabId){
    const sec = document.getElementById(id);
    if(!sec) return;
    
    // Update active tab immediately
    if (currentView === 'home') {
        if (tabId === 'allTab') {
            if (allTab) allTab.classList.add('active');
            if (liquorTab) liquorTab.classList.remove('active');
        } else if (tabId === 'liquorTab') {
            if (allTab) allTab.classList.remove('active');
            if (liquorTab) liquorTab.classList.add('active');
        }
    } else if (currentView === 'user') {
        if (tabId === 'customTab') {
            if (customTab) customTab.classList.add('active');
            if (favTab) favTab.classList.remove('active');
        } else if (tabId === 'favTab') {
            if (customTab) customTab.classList.remove('active');
            if (favTab) favTab.classList.add('active');
        }
    }

    // Disable scroll spy temporarily
    isManualScroll = true;
    setTimeout(() => { isManualScroll = false; }, 800);

    // Calculate position relative to document, adjusting for sidebar top offset (20px)
    const top = sec.getBoundingClientRect().top + window.scrollY - 20;
    window.scrollTo({ top: top, behavior: 'smooth' });

    // Flash highlight the first item in the section
    const firstItem = sec.querySelector('.menu-item');
    if(firstItem) {
        const target = firstItem.querySelector('.swipe-content') || firstItem;
        if (typeof target._swipeState !== 'undefined' && target._swipeState !== 0) {
            target._swipeState = 0;
            target.style.transform = 'translateX(0)';
        }
        target.classList.remove('highlight-flash');
        void target.offsetWidth;
        target.classList.add('highlight-flash');
        setTimeout(() => {
            target.classList.remove('highlight-flash');
        }, 1000);
    }
}

if(allTab) allTab.onclick = ()=>{ 
    if(currentView !== 'home') renderHomeView();
    scrollToSection('section-coffee', 'allTab');
};

if(liquorTab) liquorTab.onclick = ()=>{ 
    if(currentView !== 'home') renderHomeView();
    scrollToSection('section-liquor', 'liquorTab');
};

if(customTab) customTab.onclick = ()=>{ 
    if(currentView !== 'user') renderUserView();
    scrollToSection('section-custom', 'customTab');
};

if(favTab) favTab.onclick = ()=>{ 
    if(currentView !== 'user') renderUserView();
    scrollToSection('section-fav', 'favTab');
};

if (homeTab) homeTab.onclick = ()=>{ 
    renderHomeView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

if (userBtn) userBtn.onclick = ()=>{
    renderUserView();
    scrollToSection('section-custom', 'customTab');
};

function openAddCustomModal(){
    isAddCustomMode = true;
    currentCoffeeId = null;
    tempImageData = null;
    if (customInputs) customInputs.style.display = 'block';
    const t = document.getElementById('rTitle');
    const d = document.getElementById('rDesc');
    if (t) t.style.display = 'none';
    if (d) d.style.display = 'none';
    if (inputTitle) inputTitle.value = '';
    if (inputDesc) inputDesc.value = '';
    if (inputImage) inputImage.value = '';
    const list = document.getElementById('rSteps');
    list.innerHTML = '';
    const li = document.createElement('li');
    const input = document.createElement('input');
    input.className = 'step-input';
    input.placeholder = '步骤描述';
    li.appendChild(input);
    list.appendChild(li);
    isEditingSteps = true;
    if (editBtn) editBtn.textContent = '完成编辑';
    if (addBtn) addBtn.style.display = 'inline-block';
    const tipsSection = document.getElementById('rTipsSection');
    if (tipsSection) tipsSection.style.display = 'none';
    rImage.src = '';
    rImage.alt = '';
    rImage.style.display = 'none';
    const overlayAdd = document.getElementById('imageAddOverlay');
    if (overlayAdd) overlayAdd.style.display = 'flex';
    const overlayChoices2 = document.getElementById('overlayUploadChoices');
    if (overlayChoices2) overlayChoices2.style.display = 'none';
    if (uploadChoices) uploadChoices.style.display = 'none';
    const dotsBtn1 = document.getElementById('editDotsBtn');
    if (dotsBtn1) dotsBtn1.style.display = 'none';
    modalOverlay.classList.add('active');
    document.body.style.overflow='hidden';

    const customBack = document.getElementById('customBackBtn');
    if (customBack && inputTitle) {
        customBack.style.display = 'inline-flex';
        const header = document.querySelector('.recipe-header');
        const left = inputTitle.offsetLeft - 35;
        const top = inputTitle.offsetTop + Math.max(0, (inputTitle.offsetHeight - 40) / 2);
        customBack.style.left = left + 'px';
        customBack.style.top = top + 'px';
        customBack.onclick = closeModal;
    }
}

if (addCustomBtn) addCustomBtn.onclick = ()=>{ openAddCustomModal(); };

// 选择本地图片（桌面端）
if (inputImage) inputImage.onchange = (e)=>{
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ()=>{ tempImageData = reader.result; rImage.src = tempImageData; rImage.style.display=''; const overlay = document.getElementById('imageAddOverlay'); if (overlay) overlay.style.display='none'; };
    reader.readAsDataURL(file);
};

// 选择相机图片（移动端）
if (inputImageCamera) inputImageCamera.onchange = (e)=>{
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ()=>{ tempImageData = reader.result; rImage.src = tempImageData; rImage.style.display=''; const overlay = document.getElementById('imageAddOverlay'); if (overlay) overlay.style.display='none'; };
    reader.readAsDataURL(file);
};

// 覆盖层选择相册（自定义配方无图时）
if (overlayInputImage) overlayInputImage.onchange = (e)=>{
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ()=>{ tempImageData = reader.result; rImage.src = tempImageData; rImage.style.display=''; const overlay = document.getElementById('imageAddOverlay'); if (overlay) overlay.style.display='none'; };
    reader.readAsDataURL(file);
};

// 覆盖层选择拍照（自定义配方无图时）
if (overlayInputImageCamera) overlayInputImageCamera.onchange = (e)=>{
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ()=>{ tempImageData = reader.result; rImage.src = tempImageData; rImage.style.display=''; const overlay = document.getElementById('imageAddOverlay'); if (overlay) overlay.style.display='none'; };
    reader.readAsDataURL(file);
};

function isMobile(){
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function showImageEditOptions(){
    const existing = document.getElementById('imageEditSheet');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    const overlay = document.createElement('div');
    overlay.id = 'imageEditSheet';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.background = 'rgba(62,39,35,0.4)';
    overlay.style.backdropFilter = 'blur(4px)';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'flex-end';
    overlay.style.zIndex = '9999';
    overlay.style.padding = '0 10px 30px';
    const box = document.createElement('div');
    box.style.background = '#ffffff';
    box.style.color = '#3e2723';
    box.style.width = '100%';
    box.style.maxWidth = '400px';
    box.style.borderRadius = '16px';
    box.style.padding = '16px';
    box.style.boxShadow = '0 10px 30px rgba(62,39,35,0.2)';
    box.style.border = '1px solid rgba(121,85,72,0.1)';
    box.style.display = 'flex';
    box.style.flexDirection = 'column';
    box.style.gap = '12px';
    box.style.transform = 'translateY(100%)';
    box.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    const btnWrap = document.createElement('div');
    btnWrap.style.display = 'flex';
    btnWrap.style.flexDirection = 'column';
    btnWrap.style.gap = '12px';
    const galleryBtn = document.createElement('button');
    galleryBtn.className = 'small-btn';
    galleryBtn.textContent = '从相册';
    galleryBtn.style.width = '100%';
    const cameraBtn = document.createElement('button');
    cameraBtn.className = 'small-btn';
    cameraBtn.textContent = '拍照';
    cameraBtn.style.width = '100%';
    btnWrap.appendChild(galleryBtn);
    btnWrap.appendChild(cameraBtn);
    box.appendChild(btnWrap);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    requestAnimationFrame(()=>{ box.style.transform = 'translateY(0)'; });
    function close(){
        box.style.transform = 'translateY(100%)';
        setTimeout(()=>{ if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 250);
    }
    overlay.onclick = (e)=>{ if (e.target === overlay) close(); };
    galleryBtn.onclick = ()=>{ close(); if (overlayInputImage) overlayInputImage.click(); };
    cameraBtn.onclick = ()=>{ close(); if (overlayInputImageCamera) overlayInputImageCamera.click(); };
}

if (uploadTile) uploadTile.onclick = ()=>{
    if (isMobile()) {
        if (uploadChoices) uploadChoices.style.display = 'flex';
    } else {
        if (inputImage) inputImage.click();
    }
};

if (chooseGallery) chooseGallery.onclick = ()=>{
    if (uploadChoices) uploadChoices.style.display = 'none';
    if (inputImage) inputImage.click();
};

if (chooseCamera) chooseCamera.onclick = ()=>{
    if (uploadChoices) uploadChoices.style.display = 'none';
    if (inputImageCamera) inputImageCamera.click();
};

if (overlayUploadTile) overlayUploadTile.onclick = ()=>{
    if (isMobile()) {
        if (overlayUploadChoices) overlayUploadChoices.style.display = 'flex';
    } else {
        if (overlayInputImage) overlayInputImage.click();
    }
};

if (overlayChooseGallery) overlayChooseGallery.onclick = ()=>{
    if (overlayUploadChoices) overlayUploadChoices.style.display = 'none';
    if (overlayInputImage) overlayInputImage.click();
};

if (overlayChooseCamera) overlayChooseCamera.onclick = ()=>{
    if (overlayUploadChoices) overlayUploadChoices.style.display = 'none';
    if (overlayInputImageCamera) overlayInputImageCamera.click();
};

// 打开弹窗
// 打开配方弹窗：渲染标题、描述、步骤、图片/上传覆盖层
function openModal(id, source){
    currentCoffeeId=id;
    currentItemSource = source || null;
    const coffee=[...coffeeData, ...(typeof liquorData!=='undefined'?liquorData:[]), ...getCustomRecipes()].find(c=>c.id===id);
    // 仅更新标题文本节点，避免覆盖内嵌的返回键结构
    const rTitleTextEl = document.getElementById('rTitleText');
    if (rTitleTextEl) rTitleTextEl.innerText = coffee.name.replace('\n',' ');
    document.getElementById('rDesc').innerText=coffee.desc;
    try { // 用户视图弹窗的覆盖读取保护起点
        if (currentView === 'user' && !String(coffee.id).startsWith('custom-')) { // 仅针对默认饮品
            const stepsMap2 = JSON.parse(localStorage.getItem(CUSTOM_STEPS_KEY) || '{}'); // 读取是否存在自定义步骤
            const hasCustom2 = Array.isArray(stepsMap2[id]); // 有自定义步骤才允许覆盖标题/描述
            if (hasCustom2) { // 满足条件才应用覆盖
                const metaMap = JSON.parse(localStorage.getItem(CUSTOM_META_KEY) || '{}'); // 从本地读取自定义标题/描述
                const m = metaMap[id];
                if (m) {
                    if (rTitleTextEl && m.name) rTitleTextEl.innerText = m.name; // 用户视图优先显示自定义标题（仅当存在自定义步骤）
                    const rDescEl2 = document.getElementById('rDesc');
                    if (rDescEl2 && typeof m.desc === 'string') rDescEl2.innerText = m.desc; // 用户视图优先显示自定义描述（仅当存在自定义步骤）
                }
            }
        }
    } catch(e) {}
    if (customInputs) customInputs.style.display = 'none'; // 打开弹窗默认不处于编辑输入态
    const __t = document.getElementById('rTitle');
    const __d = document.getElementById('rDesc');
    if (__t) __t.style.display = ''; // 恢复标题显示
    if (__d) __d.style.display = ''; // 恢复描述显示
    const __customBack0 = document.getElementById('customBackBtn'); // 打开弹窗初始隐藏编辑态返回键，避免与标题返回键重复
    if (__customBack0) __customBack0.style.display = 'none'; // 仅保留标题中的返回键，未进入编辑态不显示第二个返回键
    const dotsBtn2 = document.getElementById('editDotsBtn');
    if (dotsBtn2) dotsBtn2.style.display = 'inline-flex'; // 默认显示三点按钮
    if (rImage) { rImage.style.cursor = ''; rImage.onclick = null; } // 退出图片编辑态
    tempImageData = null; // 清空临时图片，避免未编辑时误判为图片已更改
    positionEditDots();
    __resetSwipe();

    const stepsContainer=document.getElementById('rSteps');
    stepsContainer.innerHTML='';
    const customMap = JSON.parse(localStorage.getItem(CUSTOM_STEPS_KEY) || '{}');
    const custom = Array.isArray(customMap[id]) ? customMap[id] : null;
    // Only show custom steps if in User view (Favorites/Customs)
    const steps = (currentView === 'user' && custom && custom.length > 0) ? custom : coffee.steps;
    steps.forEach(s=>stepsContainer.innerHTML+=`<li>${s}</li>`);
    isEditingSteps = false;
    if (editBtn) editBtn.textContent = '编辑步骤';
    if (addBtn) addBtn.style.display = 'none';
    if (editBtn) editBtn.style.display = 'none'; // 打开配方弹窗时默认隐藏“编辑步骤”按钮
    if (resetBtn) resetBtn.style.display = 'none'; // 打开配方弹窗时默认隐藏“恢复默认”按钮
    resetBtn.onclick = ()=>{
        const map = JSON.parse(localStorage.getItem(CUSTOM_STEPS_KEY) || '{}');
        delete map[id];
        localStorage.setItem(CUSTOM_STEPS_KEY, JSON.stringify(map));
        const list = document.getElementById('rSteps');
        list.innerHTML = '';
        coffee.steps.forEach(s=>list.innerHTML+=`<li>${s}</li>`);
        isEditingSteps = false;
        editBtn.innerText = '编辑步骤';
        addBtn.style.display = 'none';
    };

    const tipsSection = document.getElementById('rTipsSection');
    const tipsList = document.getElementById('rTipsList');
    tipsList.innerHTML='';
    const tips = coffee.tips;
    if(Array.isArray(tips) && tips.length>0){
        tipsSection.style.display='block';
        tips.forEach(t=>tipsList.innerHTML+=`<li>${t}</li>`);
    } else if(typeof tips === 'string' && tips.trim().length>0){
        tipsSection.style.display='block';
        tipsList.innerHTML=`<li>${tips}</li>`;
    } else {
        tipsSection.style.display='none';
    }

    origImageData = coffee.image || '';
    const imageOverlay = document.getElementById('imageAddOverlay');
    if (String(coffee.id).startsWith('custom-')) {
        if (origImageData) {
            rImage.src = origImageData;
            rImage.style.display = '';
            if (imageOverlay) imageOverlay.style.display = 'none';
            __setContainerAspect();
        } else {
            rImage.src = '';
            rImage.style.display = 'none';
            if (imageOverlay) imageOverlay.style.display = 'flex';
            __resetContainerAspect();
        }
    } else {
        let imgSrc = coffee.image || (`images/${coffee.id}.jpg`);
        try {
            if (currentView === 'user' && !String(coffee.id).startsWith('custom-')) { // 仅默认饮品可被覆盖
                const stepsMap3 = JSON.parse(localStorage.getItem(CUSTOM_STEPS_KEY) || '{}'); // 检查是否存在自定义步骤
                const hasCustom3 = Array.isArray(stepsMap3[id]); // 有自定义步骤才允许覆盖图片
                if (hasCustom3) { // 满足条件才应用覆盖图片
                    const imgMap = JSON.parse(localStorage.getItem(CUSTOM_IMAGE_KEY) || '{}'); // 用户视图读取自定义图片
                    if (imgMap[id]) imgSrc = imgMap[id]; // 若存在自定义图片则覆盖显示（仅当存在自定义步骤）
                }
            }
        } catch(e) {}
        rImage.src = imgSrc; // 设置实际显示图片
        rImage.style.display = ''; // 确保图片元素显示（清空为默认显示），用于覆盖层隐藏后正常可见
        if (imageOverlay) imageOverlay.style.display = 'none'; // 若存在“添加图片”覆盖层，则在已有图片时隐藏它
        __setContainerAspect();
    } // 结束默认图片渲染分支（非自定义或已存在图片）
    rImage.alt = coffee.name.replace('\n',' '); // 设置无障碍文本与占位标题，去除换行保证一致的替代文本
    
    // 显示弹窗并锁定页面滚动
    modalOverlay.classList.add('active'); // 打开配方弹窗遮罩，展示卡片
    document.body.style.overflow='hidden'; // 锁定页面滚动，避免弹窗打开时背景滚动
    if (rImage) { rImage.style.cursor = 'pointer'; rImage.onclick = ()=>{ openImagePreview(); }; }
} // 结束 openModal

function showEditHint(){ // 三点按钮点击后弹出紧凑的“编辑”下拉卡片
    const prev = document.getElementById('editDropdown'); // 查找并移除已有的下拉卡片，防止重复
    if (prev && prev.parentNode) prev.parentNode.removeChild(prev); // 若已存在下拉卡片则移除
    const header = document.querySelector('.recipe-header'); // 标题区域容器（作为绝对定位参照）
    const btn = document.getElementById('editDotsBtn'); // 三点按钮元素
    if (!header || !btn) return; // 容错：缺少关键元素时不进行展示
    const menu = document.createElement('div'); // 创建下拉菜单容器
    menu.className = 'dropdown open'; // 复用现有 dropdown 样式并显示
    menu.id = 'editDropdown'; // 设置唯一 ID，便于后续关闭与移除
    const headerRect = header.getBoundingClientRect(); // 读取标题区域在视口中的位置，用于计算相对坐标
    const btnRect = btn.getBoundingClientRect(); // 读取三点按钮位置，确定弹出卡片的垂直位置
    const top = (btnRect.bottom - headerRect.top) + 0; // 计算菜单顶部相对标题区域的像素值（+0 便于微调）
    menu.style.position = 'absolute'; // 绝对定位到标题区域内部
    menu.style.left = 'auto'; // 左侧位置由右侧对齐控制
    menu.style.right = '12px'; // 与标题右边缘保持一致的内边距
    menu.style.top = top + 'px'; // 设置垂直位置，贴近三点按钮底部
    menu.style.minWidth = '60px'; // 紧凑的最小宽度，让视觉更小巧
    menu.style.padding = '5px'; // 缩小整体内边距以更紧凑
    menu.style.borderRadius = '10px'; // 圆角与主题一致
    menu.style.boxShadow = '0 6px 16px rgba(62,39,35,0.15)'; // 使用主题色系的阴影深度
    menu.style.border = '1px solid rgba(121,85,72,0.15)'; // 主题色系的细边框，增强层次
    menu.style.opacity = '0'; // 初始透明，用于入场动画
    menu.style.transform = 'scale(0.98) translateY(-6px)'; // 初始轻微缩放并向上偏移，提升弹出质感
    menu.style.transition = 'transform 0.16s ease, opacity 0.16s ease'; // 入场/退场的过渡动画
    const item = document.createElement('div'); // 创建单个菜单项
    item.className = 'dropdown-item'; // 使用现有菜单项样式
    item.textContent = '编辑'; // 菜单项文案
    item.style.padding = '2px 10px'; // 缩小行内间距以达成更小的视觉
    item.style.fontSize = '0.82rem'; // 调整字号为更小的比例，保持信息清晰
    item.onclick = ()=>{
        close();
        if (editBtn) editBtn.style.display = 'inline-block';
        if (resetBtn) resetBtn.style.display = 'inline-block';
        if (!isEditingSteps) startEditing();
        const rTitleEl = document.getElementById('rTitle');
        const rDescEl = document.getElementById('rDesc');
        const rTitleTextEl = document.getElementById('rTitleText');
        if (customInputs) customInputs.style.display = 'block';
        if (rTitleEl) rTitleEl.style.display = 'none';
        if (rDescEl) rDescEl.style.display = 'none';
        const dots = document.getElementById('editDotsBtn');
        if (dots) dots.style.display = 'none';
        if (inputTitle && rTitleTextEl) inputTitle.value = rTitleTextEl.innerText.trim();
        if (inputDesc && rDescEl) inputDesc.value = rDescEl.innerText.trim();
        if (rImage) { rImage.style.cursor = 'pointer'; rImage.onclick = ()=>{ showImageEditOptions(); }; }
        const customBack = document.getElementById('customBackBtn'); // 获取编辑态返回键元素
        if (customBack && inputTitle) { // 在编辑态显示返回键，并以输入框为参照定位
            customBack.style.display = 'inline-flex'; // 显示返回键并使用与现有样式一致的显示模式
            const left = inputTitle.offsetLeft - 35; // 计算水平位置，使返回键探出标题左缘但不影响对齐
            const top = inputTitle.offsetTop + Math.max(0, (inputTitle.offsetHeight - 40) / 2); // 计算垂直居中位置，贴合输入框高度
           customBack.style.left = left + 'px'; // 应用水平位置
            customBack.style.top = top + 'px'; // 应用垂直位置
            customBack.onclick = finishEditing; // 【修改】点击返回键仅退出编辑模式，不关闭弹窗
        }
    };
    menu.appendChild(item);
    header.appendChild(menu);
    requestAnimationFrame(()=>{ menu.style.opacity = '1'; menu.style.transform = 'scale(1) translateY(0)'; });
    function close(){
        const m = document.getElementById('editDropdown');
        if (m) { m.style.opacity = '0'; m.style.transform = 'scale(0.98) translateY(-6px)'; }
        setTimeout(()=>{ if (m && m.parentNode) m.parentNode.removeChild(m); }, 160);
        document.removeEventListener('click', onDoc, true);
    }
    function onDoc(e){
        if (!menu.contains(e.target) && e.target !== btn) close();
    }
    setTimeout(()=>{ document.addEventListener('click', onDoc, true); }, 0);
}

function positionEditDots(){
    const btn = document.getElementById('editDotsBtn');
    const desc = document.getElementById('rDesc');
    if (!btn || !desc) return;
    const VISUAL_DOTS_OFFSET = -8;
    const h = btn.offsetHeight || 36;
    const header = document.querySelector('.recipe-header');
    const descRect = desc.getBoundingClientRect();
    const headerRect = header ? header.getBoundingClientRect() : { top: 0 };
    const style = getComputedStyle(desc);
    let lh = parseFloat(style.lineHeight);
    if (Number.isNaN(lh) || !lh) {
        const fs = parseFloat(style.fontSize) || 16;
        lh = fs * 1.2;
    }
    const align = Math.max(0, (lh - h) / 2);
    const top = (descRect.top - headerRect.top) + align + VISUAL_DOTS_OFFSET;
    btn.style.top = top + 'px';
}

/*
三点按钮对齐说明：
- 目标：与饮品描述首行垂直居中对齐，风格参考返回键的首行对齐。
- 水平位置：由 CSS 中 `.ellipsis-btn` 的 `right` 控制（`style.css:267`）。
- 垂直位置：本函数计算并设置 `top`，步骤如下：
  1) 通过 `getBoundingClientRect()` 取得描述与标题区在视口中的像素位置，
     使用两者的差值消除粘性头部与滚动的影响。
  2) 读取 `line-height` 作为首行高度；当为 `normal` 时回退为 `font-size * 1.2`。
  3) 按钮高度在该行中居中：`(lineHeight - buttonHeight)/2`。
  4) 施加视觉微调 `VISUAL_DOTS_OFFSET`（`main.js:834`），正值下移，负值上移。
- 重新计算时机：弹窗打开（`openModal` 调用）与窗口尺寸变化（`resize` 监听）。
- 仅影响 `#editDotsBtn`，不改变标题、描述及其他功能与视觉。
*/

window.addEventListener('resize', positionEditDots);

// 关闭弹窗：清理状态与覆盖层
const __closeBtn = document.getElementById('closeBtn');
if (__closeBtn) __closeBtn.onclick = closeModal;
const __backBtn = document.getElementById('backBtn');
if (__backBtn) __backBtn.onclick = closeModal;
modalOverlay.onclick = e => { if(e.target===modalOverlay) closeModal(); };
const __recipeCard = document.querySelector('.recipe-card');
const __recipeScroll = document.querySelector('.recipe-content-scroll');
let __swipeStartX = 0;
let __swipeStartY = 0;
let __swipeDX = 0;
function __resetSwipe(){ __swipeStartX = 0; __swipeStartY = 0; __swipeDX = 0; if (__recipeCard) { __recipeCard.style.transition=''; __recipeCard.style.transform=''; } }
function __onTouchStart(e){ if (!__recipeCard) return; const t = e.touches && e.touches[0]; if (!t) return; __swipeStartX = t.clientX; __swipeStartY = t.clientY; __recipeCard.style.transition = 'none'; }
function __onTouchMove(e){ if (!__recipeCard) return; const t = e.touches && e.touches[0]; if (!t) return; const dx = t.clientX - __swipeStartX; const dy = t.clientY - __swipeStartY; __swipeDX = dx; if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) { e.preventDefault(); const x = Math.max(0, dx); __recipeCard.style.transform = `translateX(${x}px)`; } }
function __onTouchEnd(){ if (!__recipeCard) return; __recipeCard.style.transition = 'transform 0.2s ease'; if (__swipeDX > 120) { __resetSwipe(); closeModal(); } else { __resetSwipe(); } }
if (__recipeScroll) {
  __recipeScroll.addEventListener('touchstart', __onTouchStart, {passive:true});
  __recipeScroll.addEventListener('touchmove', __onTouchMove, {passive:false});
  __recipeScroll.addEventListener('touchend', __onTouchEnd, {passive:true});
}
function closeModal(){
    modalOverlay.classList.remove('active');
    document.body.style.overflow='';
    __resetSwipe();
    if (isAddCustomMode) {
        isAddCustomMode = false;
        tempImageData = null;
        if (customInputs) customInputs.style.display = 'none';
        const t = document.getElementById('rTitle');
        const d = document.getElementById('rDesc');
        if (t) t.style.display = '';
        if (d) d.style.display = '';
        const list = document.getElementById('rSteps');
        list.innerHTML = '';
        if (uploadChoices) uploadChoices.style.display = 'none';
    }
    const __customBack1 = document.getElementById('customBackBtn'); // 统一找到编辑态返回键
    if (__customBack1) __customBack1.style.display = 'none'; // 关闭弹窗后始终隐藏，防止下次打开出现两个返回键
    if (confirmOverlay) confirmOverlay.classList.remove('active');
    const imageOverlay2 = document.getElementById('imageAddOverlay');
    if (imageOverlay2) imageOverlay2.style.display = 'none';
    currentItemSource = null;
}

// 无调节模块

// 保存到收藏或自定义：根据当前视图与是否变更决定覆盖或新建
document.getElementById('saveBtn').onclick = ()=>{
    const currentList = document.getElementById('rSteps');
    const inputs = Array.from(currentList.querySelectorAll('input.step-input'));
    const listItems = Array.from(currentList.querySelectorAll('li'));
    const steps = inputs.length>0 
        ? inputs.map(i=>i.value.trim()).filter(v=>v.length>0)
        : listItems.map(li=>li.innerText.trim()).filter(v=>v.length>0);
    const titleEdited = (customInputs && customInputs.style.display !== 'none' && inputTitle) ? inputTitle.value.trim() : ''; // 编辑态下读取自定义标题
    const descEdited = (customInputs && customInputs.style.display !== 'none' && inputDesc) ? inputDesc.value.trim() : ''; // 编辑态下读取自定义描述

    if (isAddCustomMode) {
        const name = (inputTitle && inputTitle.value ? inputTitle.value.trim() : '');
        const desc = (inputDesc && inputDesc.value ? inputDesc.value.trim() : '');
        if (!name) { showToast('请输入饮品名称'); return; }
        const id = 'custom-' + Date.now();
        const icon = '🧪';
        const image = tempImageData || '';
        const recipes = getCustomRecipes();
        recipes.unshift({ id, name, desc, image, steps, icon, scope: 'custom' });
        localStorage.setItem(CUSTOM_RECIPES_KEY, JSON.stringify(recipes));
        showToast('已保存到我的特调');
        closeModal();
        renderUserView();
        scrollToSection('section-custom', 'customTab');
        return;
    }

    const item = [...coffeeData, ...(typeof liquorData!=='undefined'?liquorData:[]), ...getCustomRecipes()].find(c=>c.id===currentCoffeeId);
    if(!item){ closeModal(); return; }
    const isDifferent = JSON.stringify(steps) !== JSON.stringify(item.steps);
    const imageChanged = !!tempImageData; // 若有上传/拍摄的数据视为图片已变更
    const titleChanged = !!titleEdited && (titleEdited !== (item.name || '')); // 标题变更检测
    const descChanged = !!descEdited && (descEdited !== (item.desc || '')); // 描述变更检测
    
    // 首页视图：若用户通过“编辑”改动了标题/描述/图片或步骤，保存为自定义配方并加入收藏
    const didEditText = (customInputs && customInputs.style.display !== 'none'); // 仅在文本编辑框可见时，才认为标题/描述可能被修改
    if (currentView === 'home' && (isEditingSteps || isDifferent || imageChanged || (didEditText && (titleChanged || descChanged)))) { // 首页编辑后保存为自定义并加入收藏
        const newId = 'custom-' + Date.now();
        const newItem = {
            id: newId,
            name: titleChanged ? titleEdited : item.name,
            desc: descChanged ? descEdited : item.desc,
            image: imageChanged ? tempImageData : (item.image || ''),
            steps: steps,
            icon: item.icon || '🧪',
            scope: 'favorite'
        };
        const recipes = getCustomRecipes();
        recipes.unshift(newItem); // 将新自定义配方置顶
        localStorage.setItem(CUSTOM_RECIPES_KEY, JSON.stringify(recipes));
        const favs = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
        if (!favs.includes(newId)) { favs.unshift(newId); localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs)); } // 加入收藏列表
        showToast('已加入收藏并生成自定义配方');
        closeModal();
        renderUserView();
        scrollToSection('section-fav', 'favTab');
        return;
    }
    if (currentView === 'user' && (isDifferent || isEditingSteps || imageChanged || titleChanged || descChanged)) { // 用户视图走覆盖/新建确认
        if (confirmOverlay) confirmOverlay.classList.add('active');
        const cleanup = ()=>{
            if (confirmOverlay) confirmOverlay.classList.remove('active');
            overwriteBtn.onclick = null;
            duplicateBtn.onclick = null;
            if (cancelChangesBtn) cancelChangesBtn.onclick = null;
        };
        overwriteBtn.onclick = ()=>{
            if (String(item.id).startsWith('custom-')) {
                const recipes = getCustomRecipes();
                const idx = recipes.findIndex(r=>r.id===item.id);
                if (idx>-1) {
                    recipes[idx].steps = steps;
                    if (imageChanged) { recipes[idx].image = tempImageData; }
                    if (titleChanged) { recipes[idx].name = titleEdited; }
                    if (descChanged) { recipes[idx].desc = descEdited; }
                    localStorage.setItem(CUSTOM_RECIPES_KEY, JSON.stringify(recipes));
                }
            } else {
                const map = JSON.parse(localStorage.getItem(CUSTOM_STEPS_KEY) || '{}');
                map[item.id] = steps;
                localStorage.setItem(CUSTOM_STEPS_KEY, JSON.stringify(map));
                const metaMap = JSON.parse(localStorage.getItem(CUSTOM_META_KEY) || '{}'); // 保存默认饮品的自定义标题/描述
                const imgMap = JSON.parse(localStorage.getItem(CUSTOM_IMAGE_KEY) || '{}'); // 保存默认饮品的自定义图片
                if (titleChanged || descChanged) { metaMap[item.id] = { name: titleChanged ? titleEdited : (metaMap[item.id]?.name || item.name), desc: descChanged ? descEdited : (metaMap[item.id]?.desc || item.desc) }; } // 写入或保留自定义标题/描述
                if (imageChanged) { imgMap[item.id] = tempImageData; } // 写入自定义图片
                localStorage.setItem(CUSTOM_META_KEY, JSON.stringify(metaMap)); // 持久化自定义标题/描述
                localStorage.setItem(CUSTOM_IMAGE_KEY, JSON.stringify(imgMap)); // 持久化自定义图片
            }
            cleanup();
            showToast('已覆盖当前配方');
            closeModal();
            renderUserView();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };
        duplicateBtn.onclick = ()=>{
            const newId = 'custom-' + Date.now();
            const scope = (currentItemSource === 'fav') ? 'favorite' : 'custom';
            const newItem = {
                id: newId,
                name: titleChanged ? titleEdited : item.name,
                desc: descChanged ? descEdited : item.desc,
                image: imageChanged ? tempImageData : (item.image || ''),
                steps: steps,
                icon: item.icon || '🧪',
                scope
            };
            const recipes = getCustomRecipes();
            recipes.unshift(newItem);
            localStorage.setItem(CUSTOM_RECIPES_KEY, JSON.stringify(recipes));
            if (scope === 'favorite') {
                const favs = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
                if (!favs.includes(newId)) { favs.unshift(newId); localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs)); }
            }
            cleanup();
            showToast('已新建配方');
            closeModal();
            renderUserView();
            if (scope === 'favorite') { scrollToSection('section-fav', 'favTab'); } else { scrollToSection('section-custom', 'customTab'); }
        };
        if (cancelChangesBtn) {
            cancelChangesBtn.onclick = ()=>{
                cleanup();
                closeModal();
            };
        }
        return;
    }

    const favs = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
    if(!favs.includes(item.id)) favs.unshift(item.id);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));

    if (isDifferent || isEditingSteps) {
        const map = JSON.parse(localStorage.getItem(CUSTOM_STEPS_KEY) || '{}');
        map[item.id] = steps;
        localStorage.setItem(CUSTOM_STEPS_KEY, JSON.stringify(map));
        showToast('已加入收藏并保存自定义步骤');
    } else {
        showToast('已加入收藏');
    }
    closeModal();
};

// 渲染日志
function renderFavorites(){
    currentView = 'favorites';
    updateSidebar('favorites');
    const ids = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
    menuGrid.innerHTML = '';
    ids.forEach(id=>{
        const c = [...coffeeData, ...(typeof liquorData!=='undefined'?liquorData:[])].find(x=>x.id===id);
        if(!c) return;
        const item = document.createElement('div');
        item.className = 'menu-item';
        item.innerHTML = `<div class=\"menu-icon\">${c.icon}</div><div class=\"menu-name\">${c.name.replace('\\n','<br>')}</div>`;
        const del = document.createElement('button');
        del.className = 'card-fav';
        del.innerText = '★';
        del.title = '取消收藏';
        del.onclick = (e)=>{
            e.stopPropagation();
            const favs = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
            const next = favs.filter(fid => fid !== id);
            localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
            const map = JSON.parse(localStorage.getItem(CUSTOM_STEPS_KEY) || '{}');
            if (map[id]) { delete map[id]; localStorage.setItem(CUSTOM_STEPS_KEY, JSON.stringify(map)); }
            renderFavorites();
        };
        item.appendChild(del);
        item.onclick = ()=>{ openModal(c.id); };
        menuGrid.appendChild(item);
    });
}
    
