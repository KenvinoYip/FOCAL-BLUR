let currentCoffeeId = null;
let brewLogs = JSON.parse(localStorage.getItem('coffeeBrewLogs_v3')) || [];

const menuGrid = document.getElementById('menuGrid');
const modalOverlay = document.getElementById('modalOverlay');
const rImage = document.getElementById('rImage');

// 渲染菜单
coffeeData.forEach(c => {
    const item = document.createElement('div');
    item.className = 'menu-item';
    item.innerHTML = `<div class="menu-icon">${c.icon}</div><div class="menu-name">${c.name.replace('\n','<br>')}</div>`;
    item.onclick = ()=>openModal(c.id);
    menuGrid.appendChild(item);
});

renderLogs();

// 打开弹窗
function openModal(id){
    currentCoffeeId=id;
    const coffee=coffeeData.find(c=>c.id===id);
    document.getElementById('rTitle').innerText=coffee.name.replace('\n',' ');
    document.getElementById('rDesc').innerText=coffee.desc;

    const stepsContainer=document.getElementById('rSteps');
    stepsContainer.innerHTML='';
    coffee.steps.forEach(s=>stepsContainer.innerHTML+=`<li>${s}</li>`);

    

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
    const entry = {
        id:Date.now(),
        name:coffee.name.replace('\n',' '),
        details: '已保存'
    };
    brewLogs.unshift(entry);
    localStorage.setItem('coffeeBrewLogs_v3', JSON.stringify(brewLogs));
    renderLogs();
    closeModal();
}

// 渲染日志
function renderLogs(){
    const logBook=document.getElementById('logBook');
    if(brewLogs.length===0){ logBook.innerHTML='<p class="no-log">暂无记录</p>'; return;}
    logBook.innerHTML='';
    brewLogs.forEach(l=>{
        const div = document.createElement('div');
        div.className='log-entry';
        div.innerHTML=`
            <div class="log-info">
                <h4>${l.name}</h4>
                <div class="log-details">${l.details || ''}</div>
            </div>
            <div class="delete-log" onclick="deleteLog(${l.id})">&times;</div>
        `;
        logBook.appendChild(div);
    });
}

// 删除单条日志
function deleteLog(id){
    brewLogs=brewLogs.filter(l=>l.id!==id);
    localStorage.setItem('coffeeBrewLogs_v3', JSON.stringify(brewLogs));
    renderLogs();
}

// 清空日志
function clearLogs(){
    if(confirm('确定清空所有记录吗？')){
        brewLogs=[];
        localStorage.setItem('coffeeBrewLogs_v3','[]');
        renderLogs();
    }
}
