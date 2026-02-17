// solver.js - 严格模式 (优先匹配文字，杜绝乱选)

const Solver = {
    run: (memory) => {
        const bank = memory[KEYS.QUESTION_BANK] || [];
        const ansColIdx = (memory[KEYS.ANS_COL_INDEX] || 7) - 1; 

        if (bank.length === 0) return;

        const questions = document.querySelectorAll(".questionLi, .singleQuesId");
        if (questions.length === 0) return;

        let successCount = 0;

        questions.forEach((qDiv, index) => {
            if (qDiv.getAttribute("data-cx-solved")) return;
            if (qDiv.querySelector(".fontLabel")) return;

            try {
                // 1. 获取网页题目
                let pageTitle = "";
                const t2 = qDiv.querySelector("h3.mark_name"); 
                if (t2) pageTitle = t2.innerText;
                else return;

                // 2. 匹配 Excel 行
                const cleanPageTitle = Utils.normalizeText(pageTitle);
                const match = bank.find(row => {
                    if (!row[0]) return false;
                    const bankTitle = Utils.normalizeText(String(row[0]));
                    return (bankTitle.includes(cleanPageTitle) || cleanPageTitle.includes(bankTitle)) && cleanPageTitle.length > 2;
                });

                // 3. 执行答题
                if (match) {
                    const answerStr = String(match[ansColIdx] || "").trim();
                    if (answerStr && answerStr !== "undefined") {
                        const success = Solver.clickOptions(qDiv, answerStr, match);
                        if (success) {
                            successCount++;
                            qDiv.setAttribute("data-cx-solved", "true");
                            qDiv.style.background = "#e8f5e9";
                            qDiv.style.border = "2px solid #4CAF50";
                            console.log(`✅ 题号[${index+1}] 匹配成功: ${answerStr}`);
                        }
                    }
                }
            } catch (e) {
                console.error("答题异常:", e);
            }
        });

        if (successCount > 0) {
            try {
                if (window.top && window.top.document.querySelector("#cx-status")) {
                    const el = window.top.document.querySelector("#cx-status");
                    el.innerText = `🤖 考试中: 已填 ${successCount} 题`;
                    el.style.color = "#4CAF50";
                }
            } catch (e) {}
        }
    },

    // 核心修改：构建严格的匹配规则
    clickOptions: (qDiv, answerStr, excelRow) => {
        answerStr = answerStr.toUpperCase();
        let ansList = [];
        
        // 拆分答案
        if (/^[A-Z]+$/.test(answerStr) && !answerStr.includes(",") && !answerStr.includes("、")) {
            ansList = answerStr.split(""); 
        } else {
            ansList = answerStr.split(/[,，、\s]/).filter(s => s);
        }

        // === 第一步：制定“匹配规则” ===
        // 我们不直接去点，而是先生成一组“我要找什么”的规则
        // 规则格式: { type: 'text'|'label', value: '...' }
        
        const matchRules = [];
        // Excel 列映射 (A->1, B->2 ...)
        const letterMap = { 'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5 };

        ansList.forEach(ans => {
            // 检查 Excel 里对应的选项列是否有文字
            let excelText = "";
            if (letterMap[ans] && excelRow[letterMap[ans]]) {
                excelText = String(excelRow[letterMap[ans]]);
                // 去除 "A." 这种前缀
                excelText = excelText.replace(/^[A-Z][\.\s、]*/, "").trim();
            }

            if (excelText && excelText.length > 0) {
                // 重点：如果有文字，只允许按【文字】匹配
                matchRules.push({ type: 'text', value: Utils.normalizeText(excelText) });
            } else {
                // 只有 Excel 这一格完全为空时，才允许按【字母】兜底
                const map = { '√': '正确', '×': '错误', 'TRUE': '正确', 'FALSE': '错误', '对': '正确', '错': '错误' };
                matchRules.push({ type: 'label', value: map[ans] || ans });
            }
        });

        let clicked = false;

        // === 第二步：拿着规则去页面找 ===
        const divs = qDiv.querySelectorAll(".answerBg");
        if (divs.length > 0) {
            divs.forEach(div => {
                const span = div.querySelector(".num_option, .num_option_dx");
                const pDiv = div.querySelector(".answer_p");
                
                // 获取页面上的信息
                let pageLabel = span ? span.getAttribute("data") : "";
                let pageText = "";
                if (pDiv) pageText = Utils.normalizeText(pDiv.innerText);
                else pageText = Utils.normalizeText(div.innerText.replace(pageLabel, ""));

                // 判断是否符合任意一条规则
                const isMatch = matchRules.some(rule => {
                    if (rule.type === 'text') {
                        // 规则是找文字，必须包含文字 (长度>1防误判)
                        return pageText.includes(rule.value) && rule.value.length > 1;
                    } else {
                        // 规则是找字母，严格匹配字母
                        return pageLabel === rule.value;
                    }
                });

                if (isMatch) {
                    const isSelected = span && (span.classList.contains("check_answer") || span.classList.contains("check_answer_dx"));
                    if (!isSelected) {
                        div.click();
                        clicked = true;
                    } else {
                        clicked = true;
                    }
                }
            });
        }
        return clicked;
    }
};