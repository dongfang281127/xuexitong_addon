// utils.js - 基础配置 (v7.0 终极防爆版)

const State = {
    get: (cb) => {
        if (!chrome.runtime?.id) return cb({}); 
        try { chrome.storage.local.get(null, (res) => cb(res || {})); } catch(e) { cb({}); }
    },
    set: (data, cb) => {
        if (!chrome.runtime?.id) return;
        try { chrome.storage.local.set(data, cb); } catch(e) {}
    },
    remove: (keys, cb) => {
        if (!chrome.runtime?.id) return;
        try { chrome.storage.local.remove(keys, cb); } catch(e) {}
    }
};

const KEYS = {
    IS_SCRAPING: "cx_is_scraping",
    IS_SCRAPING_RUNNING: "cx_scraping_run",
    IS_ANSWERING: "cx_is_answering",
    IS_LEARN_MODE: "cx_is_learn_mode",       
    IS_LEARN_RUNNING: "cx_learn_run",        
    VIDEO_SPEED: "cx_video_speed",           
    QUESTION_BANK: "cx_question_bank",
    SCRAPE_DATA: "cx_bulldozer_data",
    ANS_COL_INDEX: "cx_ans_col_index"
};

const Utils = {
    normalizeText: (text) => {
        if (!text) return "";
        return text.replace(/\s+/g, "").replace(/^[0-9]+[\.、]/, "").replace(/【.*?】/g, "").replace(/\[.*?\]/g, "").replace(/\(.*?\)/g, "").replace(/[（].*?[）]/g, "").replace(/[,，。、:：\?？!！]/g, "").trim().toUpperCase();
    },
    flashBorder: (color = "#4CAF50") => {
        if (document.body) {
            const original = document.body.style.border;
            document.body.style.border = `4px solid ${color}`;
            setTimeout(() => { document.body.style.border = original; }, 500);
        }
    }
};