// main.js - 逻辑控制 (防崩溃版)

(function() {
    // 1. 尝试注入 UI (加装保险丝，UI报错不影响答题)
    try {
        if (window.self === window.top) {
            if(typeof UI !== 'undefined' && UI.inject) {
                UI.inject();
            }
        }
    } catch (e) {
        console.error("UI注入失败，但不影响核心功能:", e);
    }

    let isProcessing = false;

    // 2. 核心循环 (独立运行)
    setInterval(() => {
        if (typeof State === 'undefined') return;

        State.get((memory) => {
            // --- 模式 A: 抓取 ---
            if (memory[KEYS.IS_SCRAPING] && memory[KEYS.IS_SCRAPING_RUNNING]) {
                if (isProcessing) return;

                if (typeof Scraper !== 'undefined') {
                    Scraper.run(memory);
                    isProcessing = true;
                    setTimeout(() => {
                        State.get(curr => {
                            if (curr[KEYS.IS_SCRAPING_RUNNING] && typeof Pagination !== 'undefined') {
                                const hasNext = Pagination.next();
                                if (!hasNext) console.log("翻页结束");
                            }
                            isProcessing = false;
                        });
                    }, 3000);
                }
            }

            // --- 模式 B: 答题 ---
            if (memory[KEYS.IS_ANSWERING]) {
                if (typeof Solver !== 'undefined') {
                    // 这里不需要 UI，直接运行
                    Solver.run(memory);
                }
            }
        });
    }, 2000);
})();