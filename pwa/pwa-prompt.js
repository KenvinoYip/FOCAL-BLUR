// PWA 安装提示：在支持的环境下展示引导
document.addEventListener("DOMContentLoaded", function () {
  const APP_NAME = "FOCAL BLUR";
  const PROMPT_TEXT = "将FOCAL BLUR添加到桌面";
  const ICON_URL = "images/icon-192.png"; 
  const DISMISS_HOURS = 12; 
  const DELAY_MS = 5000;
  const DEBUG_INSTALL = new URLSearchParams(location.search).get('debug') === 'install';

  const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
  const isAndroid = /android/i.test(window.navigator.userAgent);
  const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js');
  }

  if (!DEBUG_INSTALL && (isInStandaloneMode || (!isIOS && !isAndroid))) return;

  const lastDismiss = localStorage.getItem("pwa_prompt_dismiss");
  const now = Date.now();
  if (!DEBUG_INSTALL && lastDismiss && now - lastDismiss < DISMISS_HOURS * 60 * 60 * 1000) {
    return;
  }

  let deferredPrompt;

  // Web App 安装事件：延迟展示提示，用户同意后触发安装流程
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

  // 展示提示弹层：Android 触发安装 / iOS 跳转到引导页
  function showPrompt(onConfirm, isIOSGuide = false) {
    const overlay = document.createElement("div");
    overlay.id = "pwa-overlay";

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

    document.getElementById("pwa-later").onclick = function () {
      localStorage.setItem("pwa_prompt_dismiss", Date.now());
      hidePrompt();
    };
    
    document.getElementById("pwa-add").onclick = function () {
      if (!isIOSGuide) {
        onConfirm();
      } else {
        localStorage.setItem("pwa_prompt_dismiss", Date.now());
        window.location.href = "pwa/pwa-guide.html";
      }
    };

    const style = document.createElement("style");
    style.innerHTML = `
      #pwa-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(62, 39, 35, 0.4); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: flex-end; z-index: 9999; padding: 0 10px 30px; box-sizing: border-box; animation: fadeIn 0.3s ease; }
      #pwa-box { background: #ffffff; color: #3e2723; width: 100%; max-width: 400px; border-radius: 16px; padding: 24px; text-align: center; box-shadow: 0 10px 30px rgba(62, 39, 35, 0.2); border: 1px solid rgba(121,85,72,0.1); animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); display: flex; flex-direction: column; align-items: center; }
      #pwa-icon { width: 64px; height: 64px; border-radius: 14px; margin-bottom: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
      #pwa-box h2 { margin: 0 0 5px; font-size: 1.2rem; color: #3e2723; }
      #pwa-box p { margin: 0 0 20px; font-size: 0.95rem; color: #795548; opacity: 0.8; }
      .ios-guide { background: #f8f5e6; padding: 10px; border-radius: 8px; font-size: 0.85rem !important; line-height: 1.5; border: 1px dashed #d7ccc8; }
      #pwa-btns { display: flex; gap: 15px; width: 100%; }
      #pwa-btns button { flex: 1; padding: 12px; border: none; border-radius: 10px; font-size: 1rem; cursor: pointer; font-weight: bold; transition: transform 0.1s; }
      #pwa-btns button:active { transform: scale(0.96); }
      #pwa-later { background: #f5f5f5; color: #999; }
      #pwa-add { background: #795548; color: white; box-shadow: 0 4px 12px rgba(121, 85, 72, 0.3); }
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
