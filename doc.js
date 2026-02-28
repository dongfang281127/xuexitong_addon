// doc.js - v6.6 光速秒过版
console.log("📄 文档模块已挂载 - " + window.location.href);

const DocWorker = {
    isFinished: false,
    
    read: function() {
        if (this.isFinished) return;
        console.log("📖 开始光速翻阅文档...");

        let sameScrollCount = 0;
        let lastScrollTop = -1;

        // 【提速1】扫描间隔从 1.5 秒直接缩短到 0.5 秒 (500毫秒)
        const scrollInterval = setInterval(() => {
            if (this.isFinished) {
                clearInterval(scrollInterval);
                return;
            }

            // 1. 尝试找下一页按钮 (疯狂点击)
            const nextBtn = document.querySelector('.nextBtn, #nextBtn, .mke-next-btn, .next, .turnpage_Btn');
            if (nextBtn && window.getComputedStyle(nextBtn).display !== 'none' && !nextBtn.className.includes('disabled')) {
                nextBtn.click();
                sameScrollCount = 0;
                return;
            }

            // 2. 【提速2】暴力向下滚动：不加 400 像素了，直接跳到最大高度！
            let scrolled = false;
            
            if (document.documentElement.scrollHeight > document.documentElement.clientHeight) {
                window.scrollTo(0, 999999); // 直接滑到十万像素（网页最底部）
                scrolled = true;
            }
            
            document.querySelectorAll('div').forEach(el => {
                if (el.scrollHeight > el.clientHeight + 10) {
                    el.scrollTop = el.scrollHeight; // 直接把滚动条拉到这个元素的最大高度
                    scrolled = true;
                }
            });

            // 3. 检查进度
            const scrollElement = document.scrollingElement || document.documentElement || document.body;
            const currentScrollTop = scrollElement.scrollTop;
            const maxScrollTop = scrollElement.scrollHeight - scrollElement.clientHeight;

            if (scrolled || maxScrollTop > 10) {
                if (currentScrollTop >= maxScrollTop - 20) {
                    sameScrollCount += 3; // 到底了直接算3次，快速确认
                } else if (currentScrollTop === lastScrollTop) {
                    sameScrollCount += 2; // 卡住也快速确认
                } else {
                    sameScrollCount = 0; 
                }
                lastScrollTop = currentScrollTop;
            } else {
                sameScrollCount = 0; 
            }

            // 【提速3】只要连续卡住/到底达到 4 次（仅需 2 秒），直接完工汇报！
            if (sameScrollCount >= 4) {
                clearInterval(scrollInterval);
                this.isFinished = true;
                console.log("🏁 文档已光速滑动到底部！准备穿透汇报...");
                
                let p = window;
                while (p !== window.top) {
                    p = p.parent;
                    p.postMessage({ action: "TASK_FINISHED", type: "doc" }, '*');
                }
                window.top.postMessage({ action: "TASK_FINISHED", type: "doc" }, '*');
            }
        }, 500); 
    }
};

window.addEventListener('message', (event) => {
    if (event.data && event.data.action === 'START_DOC') {
        document.querySelectorAll('iframe').forEach(iframe => {
            iframe.contentWindow.postMessage(event.data, '*');
        });
        DocWorker.read();
    }
});