let currentCoffeeId = null;

const menuGrid = document.getElementById('menuGrid');
const modalOverlay = document.getElementById('modalOverlay');
const rImage = document.getElementById('rImage');
const userBtn = document.getElementById('userBtn');
const userDropdown = document.getElementById('userDropdown');
const favAction = document.getElementById('favAction');
const allTab = document.getElementById('allTab');
const liquorTab = document.getElementById('liquorTab');
const FAVORITES_KEY = 'coffeeFavorites';

function renderAll(){
    menuGrid.innerHTML = '';
    coffeeData.forEach(c => {
        const item = document.createElement('div');
        item.className = 'menu-item';
        item.innerHTML = `<div class=\"menu-icon\">${c.icon}</div><div class=\"menu-name\">${c.name.replace('\\n','<br>')}</div>`;
        item.onclick = ()=>openModal(c.id);
        menuGrid.appendChild(item);
    });
}
renderAll();

function renderLiquor(){
    menuGrid.innerHTML = '';
    (typeof liquorData !== 'undefined' ? liquorData : []).forEach(c => {
        const item = document.createElement('div');
        item.className = 'menu-item';
        item.innerHTML = `<div class=\"menu-icon\">${c.icon || '🍸'}</div><div class=\"menu-name\">${(c.name || '').replace('\\n','<br>')}</div>`;
        item.onclick = ()=>openModal(c.id);
        menuGrid.appendChild(item);
    });
}

allTab.onclick = ()=>{ renderAll(); };
liquorTab.onclick = ()=>{ renderLiquor(); };
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
    coffee.steps.forEach(s=>stepsContainer.innerHTML+=`<li>${s}</li>`);

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
    const coffee = coffeeData.find(c=>c.id===currentCoffeeId);
    if(!coffee){ closeModal(); return; }
    const favs = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
    if(!favs.includes(coffee.id)) favs.unshift(coffee.id);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
    closeModal();
};

// 渲染日志
function renderFavorites(){
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
            renderFavorites();
        };
        item.appendChild(del);
        item.onclick = ()=>{ openModal(c.id); };
        menuGrid.appendChild(item);
    });
}
