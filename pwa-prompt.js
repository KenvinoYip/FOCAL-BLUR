document.addEventListener("DOMContentLoaded", function () {
  // === 配置部分 ===
  const APP_NAME = "FOCAL BLUR";
  const PROMPT_TEXT = "将FOCAL BLUR添加到桌面";
  // 这里暂时用一个占位符，请替换为你上传到 images 文件夹的图标路径
  const ICON_URL = "images/icon-192.png"; 
  const DISMISS_HOURS = 12; 
  const DELAY_MS = 5000; // 5秒后弹出，不要太打扰用户
  const DEBUG_INSTALL = new URLSearchParams(location.search).get('debug') === 'install';

  // === 工具函数 ===
  const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
  const isAndroid = /android/i.test(window.navigator.userAgent);
  const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

  // 注册 Service Worker (PWA 必须)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(() => console.log('Service Worker Registered'));
  }

  // 已经安装或是电脑端，则不提示
  if (!DEBUG_INSTALL && (isInStandaloneMode || (!isIOS && !isAndroid))) return;

  // 检查是否在冷却期
  const lastDismiss = localStorage.getItem("pwa_prompt_dismiss");
  const now = Date.now();
  if (!DEBUG_INSTALL && lastDismiss && now - lastDismiss < DISMISS_HOURS * 60 * 60 * 1000) {
    return;
  }

  let deferredPrompt;

  // Android 捕获安装事件
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    setTimeout(() => {
      showPrompt(() => {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(() => { hidePrompt(); });
      });
    }, DELAY_MS);
  });

  // iOS 直接延时显示
  if (isIOS) {
    setTimeout(() => {
      showPrompt(() => { hidePrompt(); }, true);
    }, DELAY_MS);
  }

  if (DEBUG_INSTALL && !isIOS) {
    setTimeout(() => {
      showPrompt(() => { hidePrompt(); }, false);
    }, DELAY_MS);
  }

  window.addEventListener('appinstalled', () => {
    localStorage.setItem("pwa_prompt_dismiss", Date.now());
  });

  // === 显示提示框 ===
  function showPrompt(onConfirm, isIOSGuide = false) {
    const overlay = document.createElement("div");
    overlay.id = "pwa-overlay";
    
    // iOS 指引文案
    const iosText = `点击 Safari 底部 <span style="font-size:18px">share</span> 分享按钮<br>选择 “添加到主屏幕” ➕`;

    overlay.innerHTML = `
      <div id="pwa-box">
        <img src="${ICON_URL}" alt="App Icon" id="pwa-icon">
        <div class="pwa-content">
            <h2>${APP_NAME}</h2>
            <p>${PROMPT_TEXT}</p>
            ${isIOSGuide ? `<p class="ios-guide">${iosText}</p>` : ""}
        </div>
        <div id="pwa-btns">
          <button id="pwa-later">稍后</button>
          <button id="pwa-add">${isIOSGuide ? '知道了' : '立即安装'}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // 绑定事件
    document.getElementById("pwa-later").onclick = function () {
      localStorage.setItem("pwa_prompt_dismiss", Date.now());
      hidePrompt();
    };
    
    document.getElementById("pwa-add").onclick = function () {
      if (!isIOSGuide) {
        onConfirm();
      } else {
        localStorage.setItem("pwa_prompt_dismiss", Date.now());
        window.location.href = "pwa-guide.html";
      }
    };

    // 注入 CSS (配合你的 style.css 风格)
    const style = document.createElement("style");
    style.innerHTML = `
      #pwa-overlay {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(62, 39, 35, 0.4); /* 你的主题深棕色半透明 */
        backdrop-filter: blur(4px);
        display: flex; justify-content: center; align-items: flex-end;
        z-index: 9999;
        padding: 0 10px 30px;
        box-sizing: border-box;
        animation: fadeIn 0.3s ease;
      }
      #pwa-box {
        background: #ffffff; /* 卡片背景 */
        color: #3e2723;      /* 你的主题文字色 */
        width: 100%; max-width: 400px;
        border-radius: 16px;
        padding: 24px;
        text-align: center;
        box-shadow: 0 10px 30px rgba(62, 39, 35, 0.2);
        border: 1px solid rgba(121,85,72,0.1);
        animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        display: flex; flex-direction: column; align-items: center;
      }
      #pwa-icon {
        width: 64px; height: 64px; border-radius: 14px;
        margin-bottom: 15px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.1);
      }
      #pwa-box h2 { margin: 0 0 5px; font-size: 1.2rem; color: #3e2723; }
      #pwa-box p { margin: 0 0 20px; font-size: 0.95rem; color: #795548; opacity: 0.8; }
      
      .ios-guide { 
        background: #f8f5e6; padding: 10px; border-radius: 8px; 
        font-size: 0.85rem !important; line-height: 1.5;
        border: 1px dashed #d7ccc8;
      }

      #pwa-btns { display: flex; gap: 15px; width: 100%; }
      #pwa-btns button {
        flex: 1; padding: 12px; border: none; border-radius: 10px;
        font-size: 1rem; cursor: pointer; font-weight: bold;
        transition: transform 0.1s;
      }
      #pwa-btns button:active { transform: scale(0.96); }
      
      #pwa-later {
        background: #f5f5f5; color: #999;
      }
      #pwa-add {
        background: #795548; /* 你的强调色 */
        color: white;
        box-shadow: 0 4px 12px rgba(121, 85, 72, 0.3);
      }

      @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    `;
    document.head.appendChild(style);
  }

  function hidePrompt() {
    const el = document.getElementById("pwa-overlay");
    if (el) {
      el.style.opacity = '0';
      setTimeout(()=> el.remove(), 300);
    }
  }
});
