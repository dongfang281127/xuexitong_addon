// utils.js - 基础配置

const State = {
    get: (cb) => chrome.storage.local.get(null, (res) => cb(res || {})),
    set: (data, cb) => chrome.storage.local.set(data, cb),
    // 新增：强制移除特定数据
    remove: (keys, cb) => chrome.storage.local.remove(keys, cb)
};

const KEYS = {
    IS_SCRAPING: "cx_is_scraping",          // 是否在抓取模式界面
    IS_SCRAPING_RUNNING: "cx_scraping_run", // 🔴 新增：是否点击了开始按钮
    IS_ANSWERING: "cx_is_answering",
    QUESTION_BANK: "cx_question_bank",
    SCRAPE_DATA: "cx_bulldozer_data",
    ANS_COL_INDEX: "cx_ans_col_index"
};

const Utils = {
    normalizeText: (text) => {
        if (!text) return "";
        return text
            .replace(/\s+/g, "")
            .replace(/^[0-9]+[\.、]/, "")
            .replace(/【.*?】/g, "")
            .replace(/\[.*?\]/g, "")
            .replace(/\(.*?\)/g, "")
            .replace(/[（].*?[）]/g, "")
            .replace(/[,，。、:：\?？!！]/g, "")
            .trim()
            .toUpperCase();
    },

    flashBorder: (color = "#4CAF50") => {
        if (document.body) {
            const original = document.body.style.border;
            document.body.style.border = `4px solid ${color}`;
            setTimeout(() => {
                document.body.style.border = original;
            }, 500);
        }
    }
};