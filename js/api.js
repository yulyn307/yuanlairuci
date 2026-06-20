// ============================================
// 源来如此 — 在线词典 API & 发音模块
// ============================================

// 使用 Free Dictionary API 查询单词
async function lookupWordOnline(word) {
    try {
        const resp = await fetch(
            `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
        );
        if (!resp.ok) return null;
        const data = await resp.json();
        return data[0] || null;
    } catch {
        return null;
    }
}

// 从 API 结果中提取发音 URL
function extractPhonetics(apiResult) {
    if (!apiResult || !apiResult.phonetics) return { uk: null, us: null };
    const phonetics = apiResult.phonetics;
    let uk = null, us = null;
    // 优先找有 audio 的
    for (const p of phonetics) {
        if (p.audio) {
            if (!uk && (p.audio.includes('-uk') || p.audio.includes('-gb'))) uk = p;
            if (!us && (p.audio.includes('-us'))) us = p;
        }
    }
    // 没区分则看 text 中的音标
    for (const p of phonetics) {
        if (!uk && p.text && p.text.includes('ˈ')) uk = uk || p;
        if (!us && p.text && p.text.includes('ˈ')) us = us || p;
    }
    // 最后兜底
    for (const p of phonetics) {
        if (!uk && p.audio) uk = p;
        if (!us && p.audio) us = p;
    }
    return { uk: uk || phonetics[0] || null, us: us || phonetics[0] || null };
}

// 播放发音：优先使用 API 返回的音频，fallback 到浏览器语音合成
function playPronunciation(word, accent) {
    // accent: 'uk' or 'us'
    const lang = accent === 'uk' ? 'en-GB' : 'en-US';

    // 先尝试用 Web Speech API（更快，不依赖网络）
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // 取消之前的播放
        const utter = new SpeechSynthesisUtterance(word);
        utter.lang = lang;
        utter.rate = 0.85;

        // 尝试匹配对应口音的语音
        const voices = speechSynthesis.getVoices();
        const match = voices.find(v =>
            v.lang.startsWith(lang) && v.name.includes(accent === 'uk' ? 'British' : 'US')
        ) || voices.find(v => v.lang.startsWith(lang));
        if (match) utter.voice = match;

        speechSynthesis.speak(utter);
    }
}

// 使用在线音频 URL 播放（如果提供）
function playAudioUrl(url) {
    if (!url) return false;
    const audio = new Audio(url);
    audio.play().catch(() => { });
    return true;
}

// ==================== 发音缓存 ====================
const phoneticsCache = {};
const phoneticsPending = {};

async function fetchPhoneticsOnline(word) {
    const lower = word.toLowerCase();
    if (phoneticsCache[lower]) return phoneticsCache[lower];
    if (phoneticsPending[lower]) return phoneticsPending[lower];

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3000);
    const promise = (async () => {
        try {
            const r = await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(lower), { signal: ctrl.signal });
            if (!r.ok) return null;
            const d = await r.json();
            if (!d[0] || !d[0].phonetics) return null;
            const phonetics = extractPhonetics(d[0]);

            // 保存有 audio URL 的音标
            const result = {};
            if (phonetics.uk && phonetics.uk.audio) result.uk = phonetics.uk;
            if (phonetics.us && phonetics.us.audio) result.us = phonetics.us;
            // 至少有一个带 audio 的
            if (!result.uk && !result.us) {
                for (const p of d[0].phonetics) {
                    if (p.audio && !result.uk) result.uk = p;
                    else if (p.audio && !result.us) result.us = p;
                }
            }
            phoneticsCache[lower] = result;
            return result;
        } catch { return null; }
        finally { clearTimeout(timer); delete phoneticsPending[lower]; }
    })();
    phoneticsPending[lower] = promise;
    return promise;
}

function getCachedPhonetics(word) {
    return phoneticsCache[word.toLowerCase()] || null;
}

// 搜索单词：先本地再在线
async function searchWord(term) {
    const word = term.trim().toLowerCase();
    if (!word) return null;

    const result = {
        word: word,
        found: false,
        local: null,       // WORDS_DATA 中的匹配
        essence: null,     // ESSENCE_DATA 中的源义释义
        online: null,      // API 返回的完整数据
        phonetics: null,   // 发音数据
    };

    // 1. 查本地词库（遍历所有词库）
    const localZh = lookupTranslation(word);
    const localExplain = lookupExplain(word);
    if (localZh) {
        result.local = { en: word, zh: localZh, explain: localExplain || '' };
        result.found = true;
    }

    // 2. 查源义释义库
    const essenceMatch = getEssence(word);
    if (essenceMatch) {
        result.essence = essenceMatch;
        result.found = true;
    }

    // 3. 在线查询（获取音标 + 发音 + 更多释义）
    const apiResult = await lookupWordOnline(word);
    if (apiResult) {
        result.online = apiResult;
        result.phonetics = extractPhonetics(apiResult);
        result.found = true;
    }

    return result;
}

// 预加载语音列表
if ('speechSynthesis' in window) {
    speechSynthesis.getVoices();
    speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
}
