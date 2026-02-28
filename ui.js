// ui.js - 界面管理 (v5.0 智能排队版)

const UI = {
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
        btnCollapse: `cursor: pointer; padding: 0 8px; font-size: 16px; line-height: 1; opacity: 0.8; transition: opacity 0.2s;`,
        tabContainer: `display: flex; background: #f0f0f0; border-bottom: 1px solid #ddd;`,
        tabBtn: `flex: 1; text-align: center; padding: 8px 0; cursor: pointer; font-size: 12px; font-weight: bold; color: #666; transition: background 0.2s;`,
        tabActive: `background: #fff; color: #3f51b5; border-bottom: 2px solid #3f51b5;`
    },

    inject: function() {
        if (window.self !== window.top || document.getElementById(this.config.id)) return;
        const div = document.createElement("div");
        div.id = this.config.id;
        div.style.cssText = this.styles.container;
        div.innerHTML = this.renderTemplate();
        document.body.appendChild(div);

        window.top.updateScrapeCount = (count) => {
            const el = document.querySelector("#scrape-info");
            if(el) el.innerText = `本次已抓取: ${count} 题`;
        };

        this.bindEvents(div);
        this.makeDraggable(div);
        this.restoreState();
    },

    renderTemplate: function() {
        return `
            <div id="cx-header" style="${this.styles.header}">
                <span style="flex:1; padding-left:14px;">🤖 学习通助手 v5.0</span>
                <span id="btn-collapse" style="${this.styles.btnCollapse}" title="折叠/展开">➖</span>
            </div>
            
            <div id="cx-tabs" style="${this.styles.tabContainer}">
                <div id="tab-learn" class="cx-tab" style="${this.styles.tabBtn}">📺 刷课</div>
                <div id="tab-scrape" class="cx-tab" style="${this.styles.tabBtn}">⛏️ 抓取</div>
                <div id="tab-answer" class="cx-tab" style="${this.styles.tabBtn}">⚡ 答题</div>
            </div>

            <div id="cx-body" style="${this.styles.body}">
                <div id="cx-status" style="margin-bottom:10px; text-align:center; color:#666; font-weight:bold;">就绪</div>
                
                <div id="panel-learn" style="display:none;">
                    <div style="font-size:12px; color:#9C27B0; margin-bottom:5px; font-weight:bold;">▶ 智能排队刷课配置</div>
                    <select id="speed-select" style="width:100%; padding:5px; margin-bottom:8px; border:1px solid #eee;">
                        <option value="1">1.0x 正常速度</option>
                        <option value="1.25">1.25x 加速</option>
                        <option value="1.5">1.5x 加速</option>
                        <option value="2" selected>2.0x 极速 (默认)</option>
                    </select>
                    <button id="btn-learn-toggle" style="${this.styles.btnBase} background:#9C27B0; color:white; margin-bottom:5px;">▶ 一键完成页面任务</button>
                    <div style="font-size:11px; color:#666; text-align:center; margin-bottom:10px;">提示：开启后将自动按顺序识别并完成视频与PPT</div>
                </div>

                <div id="panel-scrape" style="display:none;">
                    <button id="btn-scrape-toggle" style="${this.styles.btnBase} background:#4CAF50; color:white;">▶ 开始自动抓取</button>
                    <button id="btn-export-modal" style="${this.styles.btnBase} background:#FF9800; color:white; margin-bottom:10px;">💾 导出题库...</button>
                    <div id="scrape-info" style="font-size:11px; color:#666; text-align:center; margin-bottom:10px;">本次已抓取: 0 题</div>
                </div>

                <div id="panel-answer" style="display:none;">
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

                <div style="border-top:1px solid #eee; padding-top:10px; display:flex; gap:5px;">
                    <button id="btn-clear" style="width:100%; background:#f44336; color:white; border:none; padding:6px; cursor:pointer; border-radius:4px; font-size:12px;">🗑️ 清空所有缓存数据</button>
                </div>
            </div>
        `;
    },

    bindEvents: function(div) {
        const get = (id) => div.querySelector(`#${id}`);

        get('btn-collapse').onclick = (e) => { e.stopPropagation(); this.toggleCollapse(div); };
        get('col-select').onchange = (e) => State.set({ [KEYS.ANS_COL_INDEX]: parseInt(e.target.value) });
        get('btn-load').onclick = () => get('file-upload').click();
        get('file-upload').onchange = (e) => this.handleUpload(e);
        get('speed-select').onchange = (e) => State.set({ [KEYS.VIDEO_SPEED]: parseFloat(e.target.value) });

        // 导航栏点击事件
        get('tab-learn').onclick = () => State.set({ [KEYS.IS_LEARN_MODE]: true, [KEYS.IS_SCRAPING]: false }, () => this.updateState());
        get('tab-scrape').onclick = () => State.set({ [KEYS.IS_LEARN_MODE]: false, [KEYS.IS_SCRAPING]: true }, () => this.updateState());
        get('tab-answer').onclick = () => State.set({ [KEYS.IS_LEARN_MODE]: false, [KEYS.IS_SCRAPING]: false }, () => this.updateState());

        // 功能开关事件
        get('btn-run').onclick = () => {
            State.get(m => { State.set({ [KEYS.IS_ANSWERING]: !m[KEYS.IS_ANSWERING], [KEYS.IS_SCRAPING_RUNNING]: false, [KEYS.IS_LEARN_RUNNING]: false }, () => this.updateState()); });
        };
        get('btn-scrape-toggle').onclick = () => {
            State.get(m => { State.set({ [KEYS.IS_SCRAPING_RUNNING]: !m[KEYS.IS_SCRAPING_RUNNING] }, () => this.updateState()); });
        };
        // 新增的智能排队开关
        get('btn-learn-toggle').onclick = () => {
            State.get(m => { State.set({ [KEYS.IS_LEARN_RUNNING]: !m[KEYS.IS_LEARN_RUNNING] }, () => this.updateState()); });
        };

        get('btn-export-modal').onclick = () => { State.set({ [KEYS.IS_SCRAPING_RUNNING]: false }, () => { this.updateState(); this.showExportModal(); }); };
        get('btn-clear').onclick = () => {
            if(confirm("确定要清空所有数据吗？")) {
                State.set({ [KEYS.SCRAPE_DATA]: [], [KEYS.QUESTION_BANK]: [], [KEYS.IS_SCRAPING_RUNNING]: false, [KEYS.IS_ANSWERING]: false, [KEYS.IS_LEARN_RUNNING]: false }, () => {
                    get("bank-info").innerText = "题库未加载"; get("scrape-info").innerText = "本次已抓取: 0 题";
                    this.updateState(); alert("缓存已清空");
                });
            }
        };
    },

    toggleCollapse: function(div) {
        const body = div.querySelector("#cx-body");
        const tabs = div.querySelector("#cx-tabs");
        const btn = div.querySelector("#btn-collapse");
        if (body.style.display === "none") { 
            body.style.display = "block";
            tabs.style.display = "flex";
            btn.innerText = "➖"; 
        } else { 
            body.style.display = "none";
            tabs.style.display = "none";
            btn.innerText = "➕"; 
        }
    },

    makeDraggable: function(element) {
        const header = element.querySelector("#cx-header");
        let isDragging = false, startX, startY, initialLeft, initialTop;

        header.addEventListener("mousedown", (e) => {
            if (e.target.id === "btn-collapse") return;
            isDragging = true; startX = e.clientX; startY = e.clientY;
            const rect = element.getBoundingClientRect(); initialLeft = rect.left; initialTop = rect.top;
            element.style.right = "auto"; element.style.bottom = "auto"; element.style.left = initialLeft + "px"; element.style.top = initialTop + "px";
            e.preventDefault();
        });
        document.addEventListener("mousemove", (e) => {
            if (!isDragging) return;
            element.style.left = (initialLeft + (e.clientX - startX)) + "px"; element.style.top = (initialTop + (e.clientY - startY)) + "px";
        });
        document.addEventListener("mouseup", () => isDragging = false);
    },

    showExportModal: function() {
        if(document.getElementById("cx-modal")) return;
        const div = document.createElement("div"); div.id = "cx-modal";
        div.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:999999999;display:flex;justify-content:center;align-items:center;`;
        div.innerHTML = `<div style="background:#fff;padding:25px;border-radius:10px;width:320px;text-align:center;"><h3 style="margin-top:0;color:#333;">💾 导出题库</h3><input type="text" id="export-name" value="学习通题库" style="width:100%;padding:10px;margin:5px 0 15px;border:1px solid #ddd;border-radius:4px;"><div style="display:flex;gap:10px;"><button id="exp-xls" style="flex:1;padding:12px;background:#217346;color:white;border:none;border-radius:4px;cursor:pointer;">Excel</button><button id="exp-doc" style="flex:1;padding:12px;background:#2b579a;color:white;border:none;border-radius:4px;cursor:pointer;">Word</button></div><button id="exp-close" style="margin-top:20px;background:none;border:1px solid #ddd;padding:8px 20px;color:#666;cursor:pointer;border-radius:20px;">关闭窗口</button></div>`;
        document.body.appendChild(div);
        const handleExport = (type, btnId) => {
            const name = div.querySelector("#export-name").value || "题库";
            if(typeof Scraper !== 'undefined') {
                Scraper.saveFile(type, name);
                const btn = div.querySelector(btnId); const oldText = btn.innerText; btn.innerText = "✅ 已导出";
                setTimeout(() => btn.innerText = oldText, 2000);
            }
        };
        div.querySelector("#exp-xls").onclick = () => handleExport('excel', '#exp-xls');
        div.querySelector("#exp-doc").onclick = () => handleExport('word', '#exp-doc');
        div.querySelector("#exp-close").onclick = () => div.remove();
    },

    handleUpload: function(e) {
        const file = e.target.files[0]; if(!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = new Uint8Array(evt.target.result); const workbook = XLSX.read(data, { type: 'array' });
                const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
                if(json.length > 0 && String(json[0][0]).includes("题目")) json.shift();
                State.set({ [KEYS.QUESTION_BANK]: json }, () => { this.updateState(); alert(`加载成功: ${json.length} 题`); });
            } catch(err) { alert("Excel 解析失败"); }
        };
        reader.readAsArrayBuffer(file);
    },

    updateState: function() {
        State.get(m => {
            const pAnswer = document.querySelector("#panel-answer"), pScrape = document.querySelector("#panel-scrape"), pLearn = document.querySelector("#panel-learn");
            const btnRun = document.querySelector("#btn-run"), btnScrape = document.querySelector("#btn-scrape-toggle"), btnLearn = document.querySelector("#btn-learn-toggle");
            const status = document.querySelector("#cx-status");
            
            const tabLearn = document.querySelector("#tab-learn"), tabScrape = document.querySelector("#tab-scrape"), tabAnswer = document.querySelector("#tab-answer");

            if(!tabLearn) return; // 防御判断，确保元素已渲染

            tabLearn.style.cssText = this.styles.tabBtn; tabScrape.style.cssText = this.styles.tabBtn; tabAnswer.style.cssText = this.styles.tabBtn;

            let isScrapeUI = m[KEYS.IS_SCRAPING];
            let isLearnUI = m[KEYS.IS_LEARN_MODE];
            
            // 默认展示刷课面板
            if (isScrapeUI === undefined && isLearnUI === undefined) { isLearnUI = true; }

            if (isLearnUI) {
                tabLearn.style.cssText = this.styles.tabBtn + this.styles.tabActive;
                pAnswer.style.display = "none"; pScrape.style.display = "none"; pLearn.style.display = "block";
                
                if (m[KEYS.IS_LEARN_RUNNING]) { 
                    btnLearn.innerText = "🛑 停止刷课"; btnLearn.style.background = "#999"; 
                    status.innerText = "🚀 自动排队执行任务中..."; status.style.color = "#9C27B0";
                } else { 
                    btnLearn.innerText = "▶ 一键完成页面任务"; btnLearn.style.background = "#9C27B0"; 
                    status.innerText = "准备就绪"; status.style.color = "#666";
                }
            } else if (isScrapeUI) {
                tabScrape.style.cssText = this.styles.tabBtn + this.styles.tabActive;
                pAnswer.style.display = "none"; pScrape.style.display = "block"; pLearn.style.display = "none";
                
                if (m[KEYS.IS_SCRAPING_RUNNING]) { 
                    status.innerText = "🚀 自动抓取中..."; status.style.color = "#4CAF50"; 
                    btnScrape.innerText = "⏸ 暂停抓取"; btnScrape.style.background = "#FF9800";
                } else { 
                    status.innerText = "准备就绪"; status.style.color = "#666"; 
                    btnScrape.innerText = "▶ 开始自动抓取"; btnScrape.style.background = "#4CAF50";
                }
            } else {
                tabAnswer.style.cssText = this.styles.tabBtn + this.styles.tabActive;
                pAnswer.style.display = "block"; pScrape.style.display = "none"; pLearn.style.display = "none";
                
                if (m[KEYS.IS_ANSWERING]) { 
                    status.innerText = "⚡ 答题中..."; status.style.color = "#E91E63"; 
                    btnRun.innerText = "🛑 停止答题"; btnRun.style.background = "#999";
                } else { 
                    status.innerText = "就绪"; status.style.color = "#666"; 
                    btnRun.innerText = "⚡ 开启自动答题"; btnRun.style.background = "#E91E63";
                }
            }

            if (m[KEYS.QUESTION_BANK] && m[KEYS.QUESTION_BANK].length > 0) document.querySelector("#bank-info").innerText = `📚 题库: ${m[KEYS.QUESTION_BANK].length} 题`;
            if (m[KEYS.SCRAPE_DATA]) document.querySelector("#scrape-info").innerText = `本次已抓取: ${m[KEYS.SCRAPE_DATA].length} 题`;
            if (m[KEYS.ANS_COL_INDEX]) document.querySelector("#col-select").value = m[KEYS.ANS_COL_INDEX];
            if (m[KEYS.VIDEO_SPEED]) document.querySelector("#speed-select").value = m[KEYS.VIDEO_SPEED];
        });
    },

    restoreState: function() { this.updateState(); }
};