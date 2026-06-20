// ============================================
// 源来如此 — 艾宾浩斯间隔复习系统 (SRS) + 每日25词
// ============================================

const SRS_KEY = 'yinyu_srs';
const MASTERED_KEY = 'yinyu_mastered';
const DAILY_STATE_KEY = 'yinyu_daily_state';
const DAILY_COUNT = 25;
const EBBINGHAUS_INTERVALS = [1, 2, 4, 7, 15, 30];

// ==================== 工具 ====================
function _shuffle(arr) {
    if (!arr || !Array.isArray(arr)) return [];
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// ==================== SRS 数据 ====================
function getSRSData() {
    try { const r = localStorage.getItem(SRS_KEY); return r ? JSON.parse(r) : {}; }
    catch { return {}; }
}
function saveSRSData(d) { localStorage.setItem(SRS_KEY, JSON.stringify(d)); if (typeof bulkSync === 'function') bulkSync(); }

function getMasteredWords() {
    try { const r = localStorage.getItem(MASTERED_KEY); return r ? new Set(JSON.parse(r)) : new Set(); }
    catch { return new Set(); }
}
function saveMasteredWords(s) { localStorage.setItem(MASTERED_KEY, JSON.stringify([...s])); if (typeof bulkSync === 'function') bulkSync(); }

function getDailyState() {
    try {
        const r = localStorage.getItem(DAILY_STATE_KEY);
        if (!r) return null;
        const d = JSON.parse(r);
        if (d.date !== new Date().toDateString()) return null;
        return d;
    } catch { return null; }
}
function saveDailyState(s) {
    localStorage.setItem(DAILY_STATE_KEY, JSON.stringify({ ...s, date: new Date().toDateString() }));
    if (typeof bulkSync === 'function') bulkSync();
}

// ==================== SRS 操作 ====================
function getSRSRecord(word) {
    const d = getSRSData();
    return d[word.toLowerCase()] || null;
}

function recordReview(word) {
    const lower = word.toLowerCase();
    const data = getSRSData();
    const now = Date.now();
    if (!data[lower]) {
        data[lower] = { level: 1, nextReview: now + EBBINGHAUS_INTERVALS[0] * 86400000, reviewCount: 1, lastReview: now };
    } else {
        const rec = data[lower];
        rec.level = Math.min(rec.level + 1, EBBINGHAUS_INTERVALS.length + 1);
        rec.reviewCount = (rec.reviewCount || 0) + 1;
        rec.lastReview = now;
        const idx = Math.min(rec.level - 1, EBBINGHAUS_INTERVALS.length - 1);
        rec.nextReview = now + EBBINGHAUS_INTERVALS[idx] * 86400000;
    }
    saveSRSData(data);
}

function markAsMastered(word) {
    const lower = word.toLowerCase();
    const m = getMasteredWords(); m.add(lower); saveMasteredWords(m);
    const srs = getSRSData(); delete srs[lower]; saveSRSData(srs);
    const daily = getDailyState();
    if (daily && daily.words) {
        daily.words = daily.words.filter(function (w) { return w.word !== lower; });
        if (daily.completed) delete daily.completed[lower];
        saveDailyState(daily);
    }
}

function isWordMastered(word) {
    return getMasteredWords().has(word.toLowerCase());
}

// ==================== 获取可用词 ====================
function getAllAvailableWords() {
    var result = [];
    var seen = new Set();
    var selectedLibs = (typeof getSelectedLibraries === 'function') ? getSelectedLibraries() : null;
    var order = ['cet4', 'senior', 'cet6', 'postgraduate', 'ielts', 'gre', 'business', 'academic', 'daily', 'technology'];

    for (var ki = 0; ki < order.length; ki++) {
        var key = order[ki];
        if (selectedLibs && selectedLibs.length > 0 && selectedLibs.indexOf(key) === -1) continue;
        var lib = WORD_LIBRARIES && WORD_LIBRARIES[key];
        if (!lib || !lib.data) continue;
        for (var wi = 0; wi < lib.data.length; wi++) {
            var w = lib.data[wi];
            var lower = (w.en || '').toLowerCase();
            if (lower && !seen.has(lower)) {
                seen.add(lower);
                result.push({ en: lower, zh: w.zh || '', explain: w.explain || '', library: key });
            }
        }
    }
    if (typeof getUserLibrary === 'function') {
        var ul = getUserLibrary();
        for (var ui = 0; ui < ul.length; ui++) {
            var uw = ul[ui];
            var ulower = (uw.en || '').toLowerCase();
            if (ulower && !seen.has(ulower)) {
                seen.add(ulower);
                result.push({ en: ulower, zh: uw.zh || '', explain: uw.explain || '', library: 'user' });
            }
        }
    }
    return result;
}

// ==================== 每日25词分配 ====================
function getDailyWords() {
    var daily = getDailyState();
    if (!daily) daily = allocateDailyWords();
    return daily;
}

function allocateDailyWords() {
    var now = Date.now();
    var today = new Date().toDateString();
    var srs = getSRSData();
    var mastered = getMasteredWords();

    var allAvailable = getAllAvailableWords();
    if (!allAvailable.length) {
        return { date: today, words: [], completed: {}, totalNew: 0, totalReview: 0 };
    }

    var availableSet = new Set();
    for (var ai = 0; ai < allAvailable.length; ai++) {
        availableSet.add(allAvailable[ai].en);
    }

    // 到期复习词
    var dueReviews = [];
    var srsKeys = Object.keys(srs);
    for (var si = 0; si < srsKeys.length; si++) {
        var word = srsKeys[si];
        var rec = srs[word];
        var lower = word.toLowerCase();
        if (mastered.has(lower)) continue;
        if (!availableSet.has(lower)) continue;
        if (rec.nextReview <= now) {
            dueReviews.push({ word: lower, type: 'review', level: rec.level, priority: rec.level });
        }
    }
    dueReviews.sort(function (a, b) { return a.priority - b.priority; });

    // 新词
    var inSRS = new Set(srsKeys);
    var newWords = [];
    for (var ni = 0; ni < allAvailable.length; ni++) {
        var aw = allAvailable[ni];
        var lower = aw.en;
        if (mastered.has(lower) || inSRS.has(lower)) continue;
        newWords.push({ word: lower, type: 'new', level: 0 });
    }

    if (!dueReviews.length && !newWords.length) {
        return { date: today, words: [], completed: {}, totalNew: 0, totalReview: 0 };
    }

    var maxReviews = Math.floor(DAILY_COUNT * 0.6);
    var selectedReviews = dueReviews.slice(0, maxReviews);
    var remaining = DAILY_COUNT - selectedReviews.length;

    var shuffledNew = [];
    if (newWords && newWords.length) {
        shuffledNew = _shuffle(newWords);
        if (!shuffledNew || !Array.isArray(shuffledNew)) shuffledNew = [];
    }
    var selectedNew = shuffledNew.slice(0, Math.max(remaining, Math.floor(DAILY_COUNT * 0.4)));

    var combined = selectedReviews.concat(selectedNew);
    if (combined.length < DAILY_COUNT && dueReviews.length > selectedReviews.length) {
        var extra = dueReviews.slice(selectedReviews.length, selectedReviews.length + (DAILY_COUNT - combined.length));
        combined = combined.concat(extra);
    }

    var finalWords = [];
    var shuffled = _shuffle(combined);
    if (shuffled && Array.isArray(shuffled)) {
        finalWords = shuffled.slice(0, DAILY_COUNT);
    }

    var daily = {
        date: today,
        words: finalWords,
        completed: {},
        totalNew: selectedNew.length,
        totalReview: 0
    };
    for (var fi = 0; fi < finalWords.length; fi++) {
        if (finalWords[fi].type === 'review') daily.totalReview++;
    }
    saveDailyState(daily);
    return daily;
}

// ==================== 每日学习状态 ====================
function completeDailyWord(word) {
    var lower = word.toLowerCase();
    var daily = getDailyState();
    if (!daily) return;
    daily.completed = daily.completed || {};
    daily.completed[lower] = true;
    saveDailyState(daily);
    recordReview(lower);
}

function getDailyProgress() {
    var daily = getDailyState();
    if (!daily || !daily.words) return { total: 0, completed: 0, newCount: 0, reviewCount: 0 };
    var total = daily.words.length;
    var completed = Object.keys(daily.completed || {}).length;
    return {
        total: total,
        completed: completed,
        newCount: daily.totalNew || 0,
        reviewCount: daily.totalReview || 0
    };
}

function getDailyWordList() {
    var daily = getDailyState();
    if (!daily || !daily.words) return [];
    var mastered = getMasteredWords();
    var result = [];
    for (var i = 0; i < daily.words.length; i++) {
        var w = daily.words[i];
        if (!w || !w.word) continue;
        if (mastered.has(w.word.toLowerCase())) continue;
        var info = lookupWordInfo(w.word);
        result.push({
            word: w.word, type: w.type, level: w.level,
            en: w.word, zh: info.zh, explain: info.explain,
            library: info.library,
            completed: !!((daily.completed || {})[w.word.toLowerCase()])
        });
    }
    return result;
}

function lookupWordInfo(word) {
    var lower = word.toLowerCase();
    var keys = Object.keys(WORD_LIBRARIES || {});
    var levelMap = { cet4: 1, senior: 1, cet6: 2, postgraduate: 2, ielts: 2, gre: 3, business: 2, academic: 3, daily: 1, technology: 2 };
    for (var ki = 0; ki < keys.length; ki++) {
        var key = keys[ki];
        var lib = WORD_LIBRARIES[key];
        if (!lib || !lib.data) continue;
        for (var wi = 0; wi < lib.data.length; wi++) {
            if (lib.data[wi].en.toLowerCase() === lower) {
                return {
                    zh: lib.data[wi].zh || '',
                    explain: lib.data[wi].explain || '',
                    library: key,
                    level: levelMap[key] || 1
                };
            }
        }
    }
    if (typeof getUserLibrary === 'function') {
        var ul = getUserLibrary();
        for (var ui = 0; ui < ul.length; ui++) {
            if (ul[ui].en.toLowerCase() === lower) {
                return { zh: ul[ui].zh || '', explain: ul[ui].explain || '', library: 'user', level: ul[ui].level || 1 };
            }
        }
    }
    return { zh: '', explain: '', library: 'unknown', level: 1 };
}

function getSRSStats() {
    var srs = getSRSData();
    var mastered = getMasteredWords();
    var entries = Object.values(srs);
    var due = 0;
    var now = Date.now();
    for (var i = 0; i < entries.length; i++) {
        if (entries[i].nextReview <= now) due++;
    }
    return {
        totalLearning: entries.length,
        mastered: mastered.size,
        dueToday: due
    };
}
