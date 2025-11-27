let currentCoffeeId = null;

const menuGrid = document.getElementById('menuGrid');
const modalOverlay = document.getElementById('modalOverlay');
const rImage = document.getElementById('rImage');
const userBtn = document.getElementById('userBtn');
const userDropdown = document.getElementById('userDropdown');
const favAction = document.getElementById('favAction');
const homeTab = document.getElementById('homeTab');
const allTab = document.getElementById('allTab');
const liquorTab = document.getElementById('liquorTab');
const sidebar = document.getElementById('sidebar');
const FAVORITES_KEY = 'coffeeFavorites';
const CUSTOM_STEPS_KEY = 'coffeeCustomSteps';
let isEditingSteps = false;
const editBtn = document.getElementById('editStepsBtn');
const addBtn = document.getElementById('addStepBtn');
const resetBtn = document.getElementById('resetStepsBtn');
let currentView = 'all';

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

function getCurrentCoffee(){
    return [...coffeeData, ...(typeof liquorData!=='undefined'?liquorData:[])].find(c=>c.id===currentCoffeeId);
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
    // Show sidebar if in home mode (all or liquor) - now merged as 'home'
    if (type === 'home' || type === 'all' || type === 'liquor') {
        sidebar.style.display = 'flex';
        // Active state is now handled by scroll spy, but we can set initial
        if (type === 'all') {
            if (allTab) allTab.classList.add('active');
            if (liquorTab) liquorTab.classList.remove('active');
        } else if (type === 'liquor') {
            if (allTab) allTab.classList.remove('active');
            if (liquorTab) liquorTab.classList.add('active');
        }
    } else {
        sidebar.style.display = 'none';
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

    // Spacer or just append
    
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

renderHomeView();

// Scroll Spy
window.addEventListener('scroll', () => {
    if (currentView !== 'home') return;
    
    const coffeeSec = document.getElementById('section-coffee');
    const liquorSec = document.getElementById('section-liquor');
    
    if (!coffeeSec || !liquorSec) return;

    // Check if at bottom of page
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 20) {
        if (allTab) allTab.classList.remove('active');
        if (liquorTab) liquorTab.classList.add('active');
        return;
    }
    
    // Simple logic: if liquor section top is near the top of viewport, activate liquor
    const liquorRect = liquorSec.getBoundingClientRect();
    // Use a threshold, e.g., 150px from top
    if (liquorRect.top <= 150) {
        if (allTab) allTab.classList.remove('active');
        if (liquorTab) liquorTab.classList.add('active');
    } else {
        if (allTab) allTab.classList.add('active');
        if (liquorTab) liquorTab.classList.remove('active');
    }
});

function scrollToSection(id){
    const sec = document.getElementById(id);
    if(!sec) return;
    // Calculate position relative to document, adjusting for sidebar top offset (20px)
    const top = sec.getBoundingClientRect().top + window.scrollY - 20;
    window.scrollTo({ top: top, behavior: 'smooth' });
}

if(allTab) allTab.onclick = ()=>{ 
    if(currentView !== 'home') renderHomeView();
    scrollToSection('section-coffee');
};

if(liquorTab) liquorTab.onclick = ()=>{ 
    if(currentView !== 'home') renderHomeView();
    scrollToSection('section-liquor');
};

if (homeTab) homeTab.onclick = ()=>{ 
    renderHomeView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};
document.addEventListener('click', (e)=>{
    if(!userDropdown.contains(e.target) && !userBtn.contains(e.target)){
        userDropdown.classList.remove('open');
    }
});
userBtn.onclick = ()=>{ 
    userDropdown.style.left = userBtn.offsetLeft + 'px';
    userDropdown.classList.toggle('open'); 
};
favAction.onclick = ()=>{ renderFavorites(); userDropdown.classList.remove('open'); };

// 打开弹窗
function openModal(id){
    currentCoffeeId=id;
    const coffee=[...coffeeData, ...(typeof liquorData!=='undefined'?liquorData:[])].find(c=>c.id===id);
    document.getElementById('rTitle').innerText=coffee.name.replace('\n',' ');
    document.getElementById('rDesc').innerText=coffee.desc;

    const stepsContainer=document.getElementById('rSteps');
    stepsContainer.innerHTML='';
    const customMap = JSON.parse(localStorage.getItem(CUSTOM_STEPS_KEY) || '{}');
    const custom = Array.isArray(customMap[id]) ? customMap[id] : null;
    const steps = (currentView === 'favorites' && custom && custom.length>0) ? custom : coffee.steps;
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
}

// 无调节模块

// 保存日志
document.getElementById('saveBtn').onclick = ()=>{
    const item = [...coffeeData, ...(typeof liquorData!=='undefined'?liquorData:[])].find(c=>c.id===currentCoffeeId);
    if(!item){ closeModal(); return; }
    const currentList = document.getElementById('rSteps');
    const inputs = Array.from(currentList.querySelectorAll('input.step-input'));
    const listItems = Array.from(currentList.querySelectorAll('li'));
    const steps = inputs.length>0 
        ? inputs.map(i=>i.value.trim()).filter(v=>v.length>0)
        : listItems.map(li=>li.innerText.trim()).filter(v=>v.length>0);
    const favs = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
    if(!favs.includes(item.id)) favs.unshift(item.id);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
    const map = JSON.parse(localStorage.getItem(CUSTOM_STEPS_KEY) || '{}');
    map[item.id] = steps;
    localStorage.setItem(CUSTOM_STEPS_KEY, JSON.stringify(map));
    showToast(currentView==='favorites' ? '已保存自定义步骤' : '已加入收藏并保存自定义');
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
