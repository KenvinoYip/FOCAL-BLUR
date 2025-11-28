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
            console.log('Cleaned up default custom steps:', toRemove);
        }
    }
} catch (e) {
    console.error('Error cleaning up custom steps:', e);
}

let isEditingSteps = false;
const editBtn = document.getElementById('editStepsBtn');
const addBtn = document.getElementById('addStepBtn');
const resetBtn = document.getElementById('resetStepsBtn');
let currentView = 'home'; // 'home' or 'user'
let isAddCustomMode = false;
let tempImageData = null;

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
        item.innerHTML = `<div class=\"menu-icon\">${c.icon}</div><div class=\"menu-name\">${c.name.replace('\\n','<br>')}</div>`;
        item.onclick = ()=>openModal(c.id);
        coffeeSection.appendChild(item);
    });
    menuGrid.appendChild(coffeeSection);

    // Create Liquor Section
    const liquorSection = document.createElement('div');
    liquorSection.id = 'section-liquor';
    (typeof liquorData !== 'undefined' ? liquorData : []).forEach(c => {
        const item = document.createElement('div');
        item.className = 'menu-item';
        item.innerHTML = `<div class=\"menu-icon\">${c.icon || '🍸'}</div><div class=\"menu-name\">${(c.name || '').replace('\\n','<br>')}</div>`;
        item.onclick = ()=>openModal(c.id);
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
    content.innerHTML = `<div class=\"menu-icon\">${c.icon}</div><div class=\"menu-name\">${c.name.replace('\\n','<br>')}</div>`;
    
    const actions = document.createElement('div');
    actions.className = 'swipe-actions';
    
    // Pin
    const pinBtn = document.createElement('button');
    pinBtn.className = 'swipe-btn btn-pin';
    pinBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z" /></svg>`;
    pinBtn.onclick = (e) => { e.stopPropagation(); onPin(); };
    
    // Delete
    const delBtn = document.createElement('button');
    delBtn.className = 'swipe-btn btn-delete';
    delBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" /></svg>`;
    delBtn.onclick = (e) => { e.stopPropagation(); onDelete(); };
    
    actions.appendChild(pinBtn);
    actions.appendChild(delBtn);
    wrapper.appendChild(actions);
    wrapper.appendChild(content);

    // Desktop Hover Actions (Visible on PC hover)
    const hoverPin = document.createElement('div');
    hoverPin.className = 'card-pin';
    hoverPin.title = isPinned ? '取消置顶' : '置顶';
    hoverPin.innerHTML = `<svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:${isPinned?'#FFC107':'#9E9E9E'}"><path d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z" /></svg>`;
    hoverPin.onclick = (e) => { e.stopPropagation(); onPin(); };

    const hoverDel = document.createElement('div');
    hoverDel.className = 'card-delete';
    hoverDel.title = '删除';
    hoverDel.innerHTML = `<svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:#795548"><path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" /></svg>`;
    hoverDel.onclick = (e) => { e.stopPropagation(); onDelete(); };

    wrapper.appendChild(hoverPin);
    wrapper.appendChild(hoverDel);

    // State on element
    content._swipeState = 0; // 0 or -140
    let startX = 0;
    let currentX = 0;
    const maxSwipe = 140; 
    let isDragging = false;
    
    // Touch Events
    content.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        content.style.transition = 'none';
        isDragging = false;
    }, {passive: true});
    
    content.addEventListener('touchmove', (e) => {
        const x = e.touches[0].clientX;
        const delta = x - startX;
        let targetX = content._swipeState + delta;
        
        if (targetX > 0) targetX = 0;
        if (targetX < -maxSwipe - 20) targetX = -maxSwipe - 20; 
        
        if (Math.abs(delta) > 5) {
             isDragging = true;
             content.style.transform = `translateX(${targetX}px)`;
             currentX = targetX;
        }
    }, {passive: true});
    
    const endSwipe = () => {
        content.style.transition = 'transform 0.2s ease-out';
        let finalState = content._swipeState;
        
        if (content._swipeState === 0) {
            if (currentX < -maxSwipe / 3) {
                finalState = -maxSwipe;
                // Close others
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

    // Mouse Events for PC Dragging
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
            content.style.transform = `translateX(0)`;
            e.stopPropagation();
            return;
        }
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
    if (!recipes || recipes.length === 0) {
        customSection.innerHTML = '<div style="padding:20px;color:#999;font-size:0.9rem;">暂无特调记录</div>';
    } else {
        recipes.forEach(c => {
            const id = c.id;
            const isPinned = pinnedIds.includes(id);
            const item = createSwipeItem(c, isPinned,
                () => {
                    const idx = pinnedIds.indexOf(id);
                    if (idx > -1) pinnedIds.splice(idx, 1);
                    else pinnedIds.unshift(id);
                    localStorage.setItem(PINNED_KEY, JSON.stringify(pinnedIds));
                    renderUserView();
                },
                () => {
                    const next = recipes.filter(r => r.id !== id);
                    localStorage.setItem(CUSTOM_RECIPES_KEY, JSON.stringify(next));
                    renderUserView();
                },
                () => openModal(c.id)
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
                    if (idx > -1) pinnedIds.splice(idx, 1);
                    else pinnedIds.unshift(id);
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
                () => openModal(c.id)
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
        firstItem.classList.remove('highlight-flash');
        void firstItem.offsetWidth;
        firstItem.classList.add('highlight-flash');
        setTimeout(() => {
            firstItem.classList.remove('highlight-flash');
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
    scrollToSection('section-custom', 'customTab');
};

if(favTab) favTab.onclick = ()=>{ 
    scrollToSection('section-fav', 'favTab');
};

if (homeTab) homeTab.onclick = ()=>{ 
    renderHomeView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

if (userBtn) userBtn.onclick = ()=>{
    renderUserView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    if (uploadChoices) uploadChoices.style.display = 'none';
    modalOverlay.classList.add('active');
    document.body.style.overflow='hidden';
}

if (addCustomBtn) addCustomBtn.onclick = ()=>{ openAddCustomModal(); };

if (inputImage) inputImage.onchange = (e)=>{
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ()=>{ tempImageData = reader.result; rImage.src = tempImageData; };
    reader.readAsDataURL(file);
};

if (inputImageCamera) inputImageCamera.onchange = (e)=>{
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ()=>{ tempImageData = reader.result; rImage.src = tempImageData; };
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

// 打开弹窗
function openModal(id){
    currentCoffeeId=id;
    const coffee=[...coffeeData, ...(typeof liquorData!=='undefined'?liquorData:[]), ...getCustomRecipes()].find(c=>c.id===id);
    document.getElementById('rTitle').innerText=coffee.name.replace('\n',' ');
    document.getElementById('rDesc').innerText=coffee.desc;

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

    

    rImage.src = coffee.image || (`images/${coffee.id}.jpg`);
    rImage.alt = coffee.name.replace('\n',' ');

    modalOverlay.classList.add('active');
    document.body.style.overflow='hidden';
}

// 关闭弹窗
document.getElementById('closeBtn').onclick = closeModal;
modalOverlay.onclick = e => { if(e.target===modalOverlay) closeModal(); };
function closeModal(){
    modalOverlay.classList.remove('active');
    document.body.style.overflow='';
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
}

// 无调节模块

// 保存日志
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
        recipes.unshift({ id, name, desc, image, steps, icon });
        localStorage.setItem(CUSTOM_RECIPES_KEY, JSON.stringify(recipes));
        showToast('已保存到我的特调');
        closeModal();
        renderUserView();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    const item = [...coffeeData, ...(typeof liquorData!=='undefined'?liquorData:[])].find(c=>c.id===currentCoffeeId);
    if(!item){ closeModal(); return; }
    
    const favs = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
    if(!favs.includes(item.id)) favs.unshift(item.id);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));

    const isDifferent = JSON.stringify(steps) !== JSON.stringify(item.steps);
    
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
