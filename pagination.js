// pagination.js - 强力自动翻页

const Pagination = {
    next: () => {
        // 1. 优先尝试标准 ID 和 Class (命中率 90%)
        const selectors = [
            "#prevNextFocusNext",       // 最常见的下一页 ID
            ".jb_btn.jb_btn_92.fs14.next", // 旧版按钮
            ".next",                    // 通用 class
            "a#next",                   // 某些阅读页
            ".prev_next.next",          // 某些作业页
            ".nodeItem.r"               // 某些章节导航
        ];

        let btn = null;
        for (let sel of selectors) {
            btn = document.querySelector(sel);
            if (btn && btn.offsetParent !== null) { // 必须是可见的
                console.log(`>>> [翻页] 通过选择器找到按钮: ${sel}`);
                btn.click();
                return true;
            }
        }

        // 2. 暴力文本搜索 (命中率 99% - 解决疑难杂症)
        // 遍历页面所有可能有点击事件的元素
        const candidates = document.querySelectorAll("a, span, div, li, button");
        
        for (let el of candidates) {
            // 只看可见元素
            if (el.offsetParent === null) continue;
            
            const text = (el.innerText || "").trim();
            // 关键词匹配
            if (text === "下一章" || text === "下一节" || text === "Next" || text.includes("下一章") && text.length < 10) {
                console.log(`>>> [翻页] 通过文本找到按钮: [${text}]`);
                el.click();
                return true;
            }
        }

        // 3. 尝试跨框架查找 (针对 iframe 情况)
        // 如果当前是在 iframe 里，且没找到按钮，尝试告诉父窗口去翻页（仅限同源）
        try {
            if (window.self !== window.top && window.parent && window.parent.document) {
                const parentBtn = window.parent.document.querySelector("#prevNextFocusNext");
                if (parentBtn) {
                    console.log(">>> [翻页] 在父窗口找到按钮，尝试点击...");
                    parentBtn.click();
                    return true;
                }
            }
        } catch (e) {
            // 跨域访问受限，忽略
        }

        console.log(">>> [翻页] 当前页面未找到下一页按钮 (可能已是最后一页)");
        return false;
    }
};