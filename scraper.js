// scraper.js - 数据采集与导出核心

const Scraper = {
    // 1. 采集当前页并去重
    run: (memory) => {
        const rawData = Scraper.parsePage();
        if (rawData.length === 0) return;

        const oldData = memory[KEYS.SCRAPE_DATA] || [];
        // 使用 Set 进行去重 (基于题目内容)
        const existingTitles = new Set(oldData.map(item => item[0])); 
        const finalData = [...oldData];
        let newDataCount = 0;

        rawData.forEach(newItem => {
            if (!existingTitles.has(newItem[0])) {
                finalData.push(newItem);
                existingTitles.add(newItem[0]);
                newDataCount++;
            }
        });

        if (newDataCount > 0) {
            State.set({ [KEYS.SCRAPE_DATA]: finalData });
            console.log(`[抓取] 本页新增 ${newDataCount} 题，总库 ${finalData.length} 题`);
            Utils.flashBorder("#FF9800"); // 橙色闪烁
            
            // 实时更新 UI 计数 (如果有)
            if(window.top && window.top.updateScrapeCount) {
                window.top.updateScrapeCount(finalData.length);
            }
        }
    },

    // 2. 解析页面 (兼容各种结构)
    parsePage: () => {
        const list = [];
        const questions = document.querySelectorAll(".TiMu, .questionLi, .singleQuesId");

        questions.forEach(q => {
            // 标题
            let title = "";
            const t1 = q.querySelector(".fontLabel");
            const t2 = q.querySelector("h3.mark_name");
            const t3 = q.querySelector(".Zy_TItle .clearfix");
            if (t1) title = t1.innerText;
            else if (t2) title = t2.innerText;
            else if (t3) title = t3.innerText;
            title = title.replace(/\n/g, "").trim();
            if (!title) return;

            // 选项
            const opts = [];
            q.querySelectorAll("li, .answerBg").forEach(el => {
                let t = el.innerText.replace(/\n/g, "").trim();
                const pDiv = el.querySelector(".answer_p");
                if (pDiv) t = pDiv.innerText.trim();
                else t = t.replace(/^[A-Z][\.\s、]*/, ""); 
                if(t) opts.push(t);
            });
            while(opts.length < 5) opts.push("");

            // 答案
            let ans = "";
            const ansEl = q.querySelector(".myAnswerBx .answerCon, .myAnswer .answerCon");
            if (ansEl) ans = ansEl.innerText.replace("我的答案：", "").replace(/正确答案[:：]/, "").trim();

            // 状态
            let status = "待定";
            if (q.querySelector(".marking_dui") || q.innerText.includes("✅")) status = "正确";
            else if (q.querySelector(".marking_cuo") || q.innerText.includes("❌")) status = "错误";

            list.push([title, ...opts.slice(0,5), ans, status]);
        });
        return list;
    },

    // 3. 导出分发
    saveFile: (format, filename) => {
        State.get(memory => {
            const data = memory[KEYS.SCRAPE_DATA] || [];
            if (data.length === 0) {
                alert("数据为空！请先抓取题目。");
                return;
            }
            if (format === 'excel') Scraper.toExcel(data, filename);
            else if (format === 'word') Scraper.toWord(data, filename);
        });
    },

    toExcel: (data, filename) => {
        try {
            const header = ["题目", "选项A", "选项B", "选项C", "选项D", "选项E", "我的答案", "批阅状态"];
            const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
            XLSX.writeFile(wb, `${filename}.xlsx`);
        } catch (e) { alert("Excel导出失败，请检查插件环境"); }
    },

    toWord: (data, filename) => {
        try {
            let html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'><head><meta charset='utf-8'><title>${filename}</title></head><body>`;
            html += `<h1>${filename}</h1>`;
            data.forEach((row, i) => {
                html += `<p><b>${i+1}. ${row[0]}</b></p>`;
                html += `<ul>`;
                ['A','B','C','D','E'].forEach((label, k) => {
                    if(row[k+1]) html += `<li>${label}. ${row[k+1]}</li>`;
                });
                html += `</ul>`;
                html += `<p style="color:red; margin-bottom:20px;">【答案】${row[6] || "未知"} (${row[7]})</p><br>`;
            });
            html += "</body></html>";
            
            const blob = new Blob([html], { type: 'application/msword' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename}.doc`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (e) { alert("Word导出失败"); }
    }
};