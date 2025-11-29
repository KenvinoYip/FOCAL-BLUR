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
    const iconHtml = c.image ? `<img class=\"menu-thumb\" src=\"${c.image}\" alt=\"\">` : `${c.icon}`;
    content.innerHTML = `<div class=\"menu-icon\">${iconHtml}</div><div class=\"menu-name\">${c.name.replace('\\n','<br>')}</div>`;

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
    const dotsBtn2 = document.getElementById('editDotsBtn');
    if (dotsBtn2) dotsBtn2.style.display = 'inline-flex';
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
        } else {
            rImage.src = '';
            rImage.style.display = 'none';
            if (imageOverlay) imageOverlay.style.display = 'flex';
        }
    } else {
        rImage.src = coffee.image || (`images/${coffee.id}.jpg`);
        rImage.style.display = '';
        if (imageOverlay) imageOverlay.style.display = 'none';
    }
    rImage.alt = coffee.name.replace('\n',' ');

    // 显示弹窗并锁定页面滚动
    modalOverlay.classList.add('active');
    document.body.style.overflow='hidden';
}

function showEditHint(){ // 创建居中编辑提示与透明遮罩
    // cleanup existing
    const prevHint = document.querySelector('.edit-hint');
    const prevMask = document.querySelector('.edit-hint-mask');
    if (prevHint && prevHint.parentNode) prevHint.parentNode.removeChild(prevHint); // 清理已有提示避免重复
    if (prevMask && prevMask.parentNode) prevMask.parentNode.removeChild(prevMask); // 清理已有遮罩避免重复

    const mask = document.createElement('div'); // 透明遮罩，拦截其它点击
    mask.className = 'edit-hint-mask';
    document.body.appendChild(mask);

    const hint = document.createElement('div'); // 中心提示容器
    hint.className = 'edit-hint';
    hint.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
        </svg>
        <span>编辑</span>
    `;
    document.body.appendChild(hint); // 将提示插入页面

    const removeAll = ()=>{ // 移除提示与遮罩的工具函数
        if (hint && hint.parentNode) hint.parentNode.removeChild(hint);
        if (mask && mask.parentNode) mask.parentNode.removeChild(mask);
    };
    hint.onclick = ()=>{ removeAll(); if (!isEditingSteps) startEditing(); }; // 点击编辑进入步骤编辑
    mask.onclick = ()=>{ removeAll(); }; // 点击其他区域关闭提示
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
        const customBack = document.getElementById('customBackBtn');
        if (customBack) customBack.style.display = 'none';
    }
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
    const imageChanged = String(item.id).startsWith('custom-') && !!tempImageData && (tempImageData !== (item.image || ''));
    
    if (currentView === 'user' && (isDifferent || isEditingSteps || imageChanged)) {
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
                    localStorage.setItem(CUSTOM_RECIPES_KEY, JSON.stringify(recipes));
                }
            } else {
                const map = JSON.parse(localStorage.getItem(CUSTOM_STEPS_KEY) || '{}');
                map[item.id] = steps;
                localStorage.setItem(CUSTOM_STEPS_KEY, JSON.stringify(map));
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
                name: item.name,
                desc: item.desc,
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
