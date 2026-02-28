// main.js - 核心大脑与调度中心 (v5.0 全功能完美合体版)

// ==========================================
// 1. 顶层全局监听器与提示 UI
// ==========================================
if (window.self === window.top) {
    window.addEventListener('message', (e) => {
        if (e.data && e.data.action === 'SHOW_TOAST') {
            let toast = document.getElementById('cx-toast');
            if (!toast) {
                toast = document.createElement('div');
                toast.id = 'cx-toast';
                toast.style.cssText = 'position:fixed;top:15%;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.85);color:#fff;padding:12px 24px;border-radius:8px;z-index:999999999;font-size:14px;pointer-events:none;font-weight:bold;transition:opacity 0.3s;box-shadow:0 4px 10px rgba(0,0,0,0.3);';
                document.body.appendChild(toast);
            }
            toast.innerText = e.data.msg;
            toast.style.display = 'block';
            toast.style.opacity = '1';
            setTimeout(() => { if(toast.innerText === e.data.msg) toast.style.opacity = '0'; }, 3000);
        }

        if (e.data && e.data.action === 'NEXT_CHAPTER') {
            try {
                let script = document.createElement('script');
                script.textContent = "window.confirm = function(){return true;}; window.alert = function(){};";
                document.head.appendChild(script);
            } catch(err) {}

            let nextBtn = document.querySelector('.prev_next.next, .nextChapter, #prevNextFocusNext');
            if (!nextBtn) {
                const elements = document.querySelectorAll('span, a, div');
                for (let el of elements) {
                    if (el.innerText && el.innerText.trim() === '下一节' && el.offsetParent !== null) {
                        nextBtn = el; break;
                    }
                }
            }

            if (nextBtn) {
                nextBtn.click();
                let checkCount = 0;
                let checkModal = setInterval(() => {
                    checkCount++;
                    const confirmBtn = document.querySelector('.layui-layer-btn0, .bluebtn, .sure');
                    if (confirmBtn && confirmBtn.offsetParent !== null) {
                        console.log("💥 检测到拦截弹窗，已强行点击通过！");
                        confirmBtn.click();
                        clearInterval(checkModal);
                    }
                    if(checkCount > 20) clearInterval(checkModal);
                }, 500);
            } else {
                let toastEl = document.getElementById('cx-toast');
                if (toastEl) {
                    toastEl.innerText = "🛑 未找到下一节按钮，这可能是最后一章了！";
                    toastEl.style.opacity = '1';
                }
                if(typeof State !== 'undefined') State.set({ [KEYS.IS_LEARN_RUNNING]: false });
            }
        }
    });
}

function toast(msg) {
    window.top.postMessage({ action: "SHOW_TOAST", msg: msg }, '*');
}

// ==========================================
// 2. 刷课任务调度器 (TaskManager)
// ==========================================
const TaskManager = {
    isRunning: false,
    tasks: [],
    currentIndex: 0,
    globalSpeed: 2.0,

    start: function(speed) {
        this.isRunning = true;
        this.globalSpeed = speed || 2.0;
        toast("🧠 启动刷课，正在解析源码锁定任务...");
        setTimeout(() => this.scanTasks(), 2500);
    },

    stop: function() {
        this.isRunning = false;
        toast("🛑 已停止自动刷课");
    },

    scanTasks: function() {
        if (!this.isRunning) return;
        this.tasks = [];

        let unfinishedJobIds = [];
        let mArgObj = null;

        const scripts = document.querySelectorAll('script');
        for (let s of scripts) {
            let text = s.textContent;
            if (!text || !text.includes('mArg')) continue;
            
            let match = text.match(/try\s*\{\s*mArg\s*=\s*(\{[\s\S]+?\});\s*\}\s*catch/);
            if (!match) match = text.match(/mArg\s*=\s*(\{[\s\S]+?\});/);
            
            if (match) {
                try {
                    mArgObj = JSON.parse(match[1]);
                    break;
                } catch(e) {}
            }
        }

        if (mArgObj && mArgObj.attachments) {
            mArgObj.attachments.forEach(att => {
                if (att.job === true && !att.isPassed) {
                    let jid = (att.property && att.property.jobid) ? att.property.jobid : att.jobid;
                    if (jid) unfinishedJobIds.push(String(jid));
                }
            });
        }

        const iframes = document.querySelectorAll('.ans-cc iframe, iframe[module]');
        
        iframes.forEach((iframe) => {
            const dataStr = iframe.getAttribute('data') || "";
            const cleanDataStr = dataStr.replace(/&quot;/g, '"');
            const moduleName = iframe.getAttribute('module') || "";
            const src = iframe.src || "";

            let taskType = 'other';
            if (moduleName.includes('video') || cleanDataStr.includes('video') || src.includes('video')) {
                taskType = 'video';
            } else if (moduleName.includes('doc') || moduleName.includes('pdf') || moduleName.includes('ppt') || cleanDataStr.includes('doc') || cleanDataStr.includes('pdf') || cleanDataStr.includes('.ppt') || cleanDataStr.includes('.pptx')) {
                taskType = 'doc';
            }

            let currentJobId = null;
            try {
                let dataObj = JSON.parse(cleanDataStr);
                let j = dataObj.jobid || dataObj.jobId || dataObj._jobid;
                if (j) currentJobId = String(j);
            } catch(e) {
                let match = cleanDataStr.match(/"_?job[iI]d"\s*:\s*"([^"]+)"/);
                if (match && match[1]) currentJobId = String(match[1]);
            }

            let isUnfinished = false;
            if (mArgObj) {
                isUnfinished = currentJobId && unfinishedJobIds.includes(currentJobId);
            } else {
                isUnfinished = !!currentJobId;
            }

            if (taskType !== 'other' && isUnfinished) {
                if (!this.tasks.find(t => t.iframe === iframe)) {
                    this.tasks.push({ type: taskType, iframe: iframe, isJob: true });
                }
            }
        });

        if (this.tasks.length > 0) {
            toast(`📋 破壳成功！抓出 ${this.tasks.length} 个未完成任务！准备执行...`);
            this.currentIndex = 0;
            this.runNext();
        } else {
            toast("🈳 本页全绿或全是测验，3秒后强行跳下一节...");
            setTimeout(() => {
                window.top.postMessage({ action: "NEXT_CHAPTER" }, '*');
            }, 3000);
        }
    },

    runNext: function() {
        if (!this.isRunning) return;

        if (this.currentIndex >= this.tasks.length) {
            toast("🎉 本页视频和PPT已全部搞定！准备跳下一节...");
            setTimeout(() => {
                window.top.postMessage({ action: "NEXT_CHAPTER" }, '*');
            }, 2000);
            return;
        }

        const currentTask = this.tasks[this.currentIndex];
        const typeName = currentTask.type === 'video' ? '视频' : '文档/PPT';
        toast(`🚀 正在冲锋：第 ${this.currentIndex + 1} 个任务 (${typeName})...`);

        const actionCommand = currentTask.type === 'video' ? 'START_VIDEO' : 'START_DOC';

        setTimeout(() => {
            if (this.isRunning) {
                currentTask.iframe.contentWindow.postMessage({
                    action: actionCommand,
                    speed: this.globalSpeed
                }, '*');
            }
        }, 1000);
    }
};

window.addEventListener('message', (event) => {
    if (event.data && event.data.action === 'TASK_FINISHED') {
        const typeName = event.data.type === 'video' ? '视频' : '文档/PPT';
        toast(`✅ ${typeName} 任务完毕！2秒后开启下一个...`);
        TaskManager.currentIndex++;

        if (TaskManager.isRunning) {
            setTimeout(() => TaskManager.runNext(), 2000);
        }
    }
});

// ==========================================
// 3. 全局核心大循环 (刷课/抓取/答题 三足鼎立)
// ==========================================
(function() {
    try {
        if (window.self === window.top) {
            if(typeof UI !== 'undefined' && UI.inject) UI.inject();
        }
    } catch (e) {}

    let isProcessingScrape = false;

    setInterval(() => {
        if (typeof State === 'undefined') return;

        State.get((memory) => {
            
            // --- 板块 1: 智能刷课 ---
            if (memory[KEYS.IS_LEARN_MODE]) {
                if (memory[KEYS.IS_LEARN_RUNNING]) {
                    const isCourseFrame = document.querySelector('.ans-cc') !== null;
                    if (isCourseFrame && !TaskManager.isRunning) {
                        TaskManager.start(memory[KEYS.VIDEO_SPEED]);
                    }
                } else {
                    if (TaskManager.isRunning) TaskManager.stop();
                }
            }

            // --- 板块 2: 题目抓取 ---
            if (memory[KEYS.IS_SCRAPING] && memory[KEYS.IS_SCRAPING_RUNNING]) {
                if (isProcessingScrape) return;
                // 恢复呼叫 Scraper 的逻辑
                if (typeof Scraper !== 'undefined') {
                    isProcessingScrape = true;
                    Scraper.run(memory);
                    setTimeout(() => {
                        State.get(curr => {
                            if (curr[KEYS.IS_SCRAPING_RUNNING] && typeof Pagination !== 'undefined') {
                                Pagination.next();
                            }
                            isProcessingScrape = false;
                        });
                    }, 3000);
                }
            }

            // --- 板块 3: 自动答题 ---
            if (!memory[KEYS.IS_SCRAPING] && !memory[KEYS.IS_LEARN_MODE] && memory[KEYS.IS_ANSWERING]) {
                // 恢复呼叫 Solver 的逻辑
                if (typeof Solver !== 'undefined') {
                    Solver.run(memory);
                }
            }

        });
    }, 2000);
})();