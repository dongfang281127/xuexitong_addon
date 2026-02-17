// ui.js - 界面管理 (模块化重构版 v4.8)
// 特性：可拖拽、可折叠、样式分离、逻辑解耦

const UI = {
    // --- 1. 配置与样式 (Styles) ---
    config: {
        id: "cx-dashboard",
        width: "230px",
        headerColor: "#3f51b5",
        zIndex: "99999999"
    },

    styles: {
        container: `position: fixed; top: 10px; right: 20px; width: 230px; background: #fff; box-shadow: 0 4px 15px rgba(0,0,0,0.2); border-radius: 8px; z-index: 99999999; font-family: sans-serif; font-size: 13px; border: 1px solid #ddd; overflow: hidden;`,
        header: `background: #3f51b5; color: white; padding: 10px; text-align: center; font-weight: bold; cursor: move; user-select: none; display: flex; justify-content: space-between; align-items: center;`,
        body: `padding: 15px; transition: all 0.3s ease;`,
        btnBase: `width: 100%; margin-bottom: 8px; border: none; padding: 8px; cursor: pointer; border-radius: 4px; font-weight: bold;`,
        btnCollapse: `cursor: pointer; padding: 0 8px; font-size: 16px; line-height: 1; opacity: 0.8; transition: opacity 0.2s;`
    },

    // --- 2. 核心入口 (Init) ---
    inject: function() {
        if (window.self !== window.top || document.getElementById(this.config.id)) return;

        // 创建容器
        const div = document.createElement("div");
        div.id = this.config.id;
        div.style.cssText = this.styles.container;
        
        // 渲染 HTML
        div.innerHTML = this.renderTemplate();
        document.body.appendChild(div);

        // 绑定外部接口
        window.top.updateScrapeCount = (count) => {
            const el = document.querySelector("#scrape-info");
            if(el) el.innerText = `本次已抓取: ${count} 题`;
        };

        // 初始化各模块
        this.bindEvents(div);
        this.makeDraggable(div);
        this.restoreState();
    },

    // --- 3. 视图模板 (Templates) ---
    renderTemplate: function() {
        return `
            <div id="cx-header" style="${this.styles.header}">
                <span style="flex:1; padding-left:14px;">🤖 学习通助手 v4.8</span>
                <span id="btn-collapse" style="${this.styles.btnCollapse}" title="折叠/展开">➖</span>
            </div>
            
            <div id="cx-body" style="${this.styles.body}">
                <div id="cx-status" style="margin-bottom:10px; text-align:center; color:#666; font-weight:bold;">就绪</div>
                
                <div id="panel-answer">
                    <div style="font-size:12px; color:#999; margin-bottom:5px;">模式：自动答题</div>
                    <select id="col-select" style="width:100%; padding:5px; margin-bottom:8px; border:1px solid #eee;">
                        <option value="2">答案在 B 列</option>
                        <option value="6">答案在 F 列</option>
                        <option value="7" selected>答案在 G 列 (默认)</option>
                    </select>
                    <input type="file" id="file-upload" accept=".xlsx" style="display:none;" />
                    <button id="btn-load" style="${this.styles.btnBase} background:#2196F3; color:white;">📂 上传题库</button>
                    <button id="btn-run" style="${this.styles.btnBase} background:#E91E63; color:white; margin-bottom:10px;">⚡ 开启自动答题</button>
                    <div id="bank-info" style="font-size:11px; color:#666; text-align:center; margin-bottom:10px;">题库未加载</div>
                </div>

                <div id="panel-scrape" style="display:none;">
                    <div style="font-size:12px; color:#FF9800; margin-bottom:5px;">模式：题目采集</div>
                    <button id="btn-scrape-toggle" style="${this.styles.btnBase} background:#4CAF50; color:white;">▶ 开始自动抓取</button>
                    <button id="btn-export-modal" style="${this.styles.btnBase} background:#FF9800; color:white; margin-bottom:10px;">💾 导出题库...</button>
                    <div id="scrape-info" style="font-size:11px; color:#666; text-align:center; margin-bottom:10px;">本次已抓取: 0 题</div>
                </div>

                <div style="border-top:1px solid #eee; padding-top:10px; display:flex; gap:5px;">
                    <button id="btn-switch" style="flex:1; background:#607d8b; color:white; border:none; padding:6px; cursor:pointer; border-radius:4px; font-size:12px;">⛏️ 切换模式</button>
                    <button id="btn-clear" style="width:70px; background:#f44336; color:white; border:none; padding:6px; cursor:pointer; border-radius:4px; font-size:12px;">🗑️ 清空</button>
                </div>
            </div>
        `;
    },

    // --- 4. 事件逻辑 (Logic) ---
    bindEvents: function(div) {
        const get = (id) => div.querySelector(`#${id}`);

        // 4.1 折叠逻辑
        get('btn-collapse').onclick = (e) => {
            e.stopPropagation(); // 防止触发拖拽
            this.toggleCollapse(div);
        };

        // 4.2 基础功能
        get('col-select').onchange = (e) => State.set({ [KEYS.ANS_COL_INDEX]: parseInt(e.target.value) });
        get('btn-load').onclick = () => get('file-upload').click();
        get('file-upload').onchange = (e) => this.handleUpload(e);
        
        // 4.3 答题开关
        get('btn-run').onclick = () => {
            State.get(m => {
                const isRun = !m[KEYS.IS_ANSWERING];
                State.set({ [KEYS.IS_ANSWERING]: isRun, [KEYS.IS_SCRAPING]: false }, () => this.updateState());
            });
        };

        // 4.4 模式切换
        get('btn-switch').onclick = () => {
            State.get(m => {
                const toScrape = !m[KEYS.IS_SCRAPING];
                State.set({ 
                    [KEYS.IS_SCRAPING]: toScrape, 
                    [KEYS.IS_ANSWERING]: false, 
                    [KEYS.IS_SCRAPING_RUNNING]: false
                }, () => this.updateState());
            });
        };

        // 4.5 抓取控制
        get('btn-scrape-toggle').onclick = () => {
            State.get(m => {
                const isRunning = !m[KEYS.IS_SCRAPING_RUNNING];
                State.set({ [KEYS.IS_SCRAPING_RUNNING]: isRunning }, () => this.updateState());
            });
        };

        // 4.6 导出与清空
        get('btn-export-modal').onclick = () => {
            State.set({ [KEYS.IS_SCRAPING_RUNNING]: false }, () => {
                this.updateState();
                this.showExportModal();
            });
        };
        get('btn-clear').onclick = () => {
            if(confirm("确定要清空所有数据吗？")) {
                State.set({ 
                    [KEYS.SCRAPE_DATA]: [], 
                    [KEYS.QUESTION_BANK]: [],
                    [KEYS.IS_SCRAPING_RUNNING]: false,
                    [KEYS.IS_ANSWERING]: false
                }, () => {
                    get("bank-info").innerText = "题库未加载";
                    get("scrape-info").innerText = "本次已抓取: 0 题";
                    this.updateState();
                    alert("缓存已清空");
                });
            }
        };
    },

    // --- 5. 拖拽与折叠 (Features) ---
    toggleCollapse: function(div) {
        const body = div.querySelector("#cx-body");
        const btn = div.querySelector("#btn-collapse");
        
        if (body.style.display === "none") {
            // 展开
            body.style.display = "block";
            btn.innerText = "➖";
        } else {
            // 折叠
            body.style.display = "none";
            btn.innerText = "➕";
        }
    },

    makeDraggable: function(element) {
        const header = element.querySelector("#cx-header");
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        header.addEventListener("mousedown", (e) => {
            // 如果点的是折叠按钮，不触发拖拽
            if (e.target.id === "btn-collapse") return;

            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = element.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;
            
            element.style.right = "auto";
            element.style.bottom = "auto";
            element.style.left = initialLeft + "px";
            element.style.top = initialTop + "px";
            e.preventDefault();
        });

        document.addEventListener("mousemove", (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            element.style.left = (initialLeft + dx) + "px";
            element.style.top = (initialTop + dy) + "px";
        });

        document.addEventListener("mouseup", () => isDragging = false);
    },

    // --- 6. 弹窗与状态更新 (Utilities) ---
    showExportModal: function() {
        if(document.getElementById("cx-modal")) return;
        const div = document.createElement("div");
        div.id = "cx-modal";
        div.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:999999999;display:flex;justify-content:center;align-items:center;`;
        div.innerHTML = `
            <div style="background:#fff;padding:25px;border-radius:10px;width:320px;text-align:center;">
                <h3 style="margin-top:0;color:#333;">💾 导出题库</h3>
                <input type="text" id="export-name" value="学习通题库" style="width:100%;padding:10px;margin:5px 0 15px;border:1px solid #ddd;border-radius:4px;">
                <div style="display:flex;gap:10px;">
                    <button id="exp-xls" style="flex:1;padding:12px;background:#217346;color:white;border:none;border-radius:4px;cursor:pointer;">Excel</button>
                    <button id="exp-doc" style="flex:1;padding:12px;background:#2b579a;color:white;border:none;border-radius:4px;cursor:pointer;">Word</button>
                </div>
                <button id="exp-close" style="margin-top:20px;background:none;border:1px solid #ddd;padding:8px 20px;color:#666;cursor:pointer;border-radius:20px;">关闭窗口</button>
            </div>
        `;
        document.body.appendChild(div);

        const handleExport = (type, btnId) => {
            const name = div.querySelector("#export-name").value || "题库";
            if(typeof Scraper !== 'undefined') {
                Scraper.saveFile(type, name);
                const btn = div.querySelector(btnId);
                const oldText = btn.innerText;
                btn.innerText = "✅ 已导出";
                setTimeout(() => btn.innerText = oldText, 2000);
            }
        };

        div.querySelector("#exp-xls").onclick = () => handleExport('excel', '#exp-xls');
        div.querySelector("#exp-doc").onclick = () => handleExport('word', '#exp-doc');
        div.querySelector("#exp-close").onclick = () => div.remove();
    },

    handleUpload: function(e) {
        const file = e.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = new Uint8Array(evt.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
                if(json.length > 0 && String(json[0][0]).includes("题目")) json.shift();
                State.set({ [KEYS.QUESTION_BANK]: json }, () => {
                    this.updateState();
                    alert(`加载成功: ${json.length} 题`);
                });
            } catch(err) { alert("Excel 解析失败"); }
        };
        reader.readAsArrayBuffer(file);
    },

    updateState: function() {
        State.get(m => {
            const pAnswer = document.querySelector("#panel-answer");
            const pScrape = document.querySelector("#panel-scrape");
            const btnRun = document.querySelector("#btn-run");
            const btnScrape = document.querySelector("#btn-scrape-toggle");
            const status = document.querySelector("#cx-status");

            if (m[KEYS.IS_SCRAPING]) {
                pAnswer.style.display = "none";
                pScrape.style.display = "block";
                
                if (m[KEYS.IS_SCRAPING_RUNNING]) {
                    status.innerText = "🚀 自动抓取中...";
                    status.style.color = "#4CAF50";
                    btnScrape.innerText = "⏸ 暂停抓取";
                    btnScrape.style.background = "#FF9800";
                } else {
                    status.innerText = "准备就绪";
                    status.style.color = "#666";
                    btnScrape.innerText = "▶ 开始自动抓取";
                    btnScrape.style.background = "#4CAF50";
                }
            } else {
                pAnswer.style.display = "block";
                pScrape.style.display = "none";
                
                if (m[KEYS.IS_ANSWERING]) {
                    status.innerText = "⚡ 答题中...";
                    status.style.color = "#E91E63";
                    btnRun.innerText = "🛑 停止答题";
                    btnRun.style.background = "#999";
                } else {
                    status.innerText = "就绪";
                    status.style.color = "#666";
                    btnRun.innerText = "⚡ 开启自动答题";
                    btnRun.style.background = "#E91E63";
                }
            }

            if (m[KEYS.QUESTION_BANK] && m[KEYS.QUESTION_BANK].length > 0) {
                document.querySelector("#bank-info").innerText = `📚 题库: ${m[KEYS.QUESTION_BANK].length} 题`;
            }
            if (m[KEYS.SCRAPE_DATA]) {
                document.querySelector("#scrape-info").innerText = `本次已抓取: ${m[KEYS.SCRAPE_DATA].length} 题`;
            }
            if (m[KEYS.ANS_COL_INDEX]) {
                document.querySelector("#col-select").value = m[KEYS.ANS_COL_INDEX];
            }
        });
    },

    restoreState: function() {
        this.updateState();
    }
};