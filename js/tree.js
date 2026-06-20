// ============================================
// 源来如此 — 单词关联树模块
// ============================================
function extractRelations(apiResult) {
    const syn = new Set(), ant = new Set();
    if (!apiResult || !apiResult.meanings) return { synonyms: [], antonyms: [] };
    for (const m of apiResult.meanings) {
        if (m.synonyms) m.synonyms.forEach(s => syn.add(s.toLowerCase()));
        if (m.antonyms) m.antonyms.forEach(a => ant.add(a.toLowerCase()));
        if (m.definitions) for (const d of m.definitions) {
            if (d.synonyms) d.synonyms.forEach(s => syn.add(s.toLowerCase()));
            if (d.antonyms) d.antonyms.forEach(a => ant.add(a.toLowerCase()));
        }
    }
    return { synonyms: [...syn].slice(0, 8), antonyms: [...ant].slice(0, 8) };
}
function deriveWordForms(word, apiResult) {
    const entries = [], lower = word.toLowerCase(), pos = new Set();
    if (apiResult && apiResult.meanings) apiResult.meanings.forEach(m => pos.add(m.partOfSpeech));
    const isV = pos.has('verb'), isN = pos.has('noun'), isA = pos.has('adjective'), isAdv = pos.has('adverb');
    const endsE = lower.endsWith('e'), endsAte = lower.endsWith('ate');
    const root = endsE ? lower.slice(0, -1) : lower;

    // 动词屈折 + 派生
    if (isV) {
        entries.push({ word: endsE ? root + 'ing' : lower + 'ing', label: '现在分词' });
        entries.push({ word: endsE ? lower + 'd' : lower + 'ed', label: '过去式' });
        entries.push({ word: (lower.endsWith('s') || lower.endsWith('x') || lower.endsWith('ch') || lower.endsWith('sh')) ? lower + 'es' : lower + 's', label: '三单' });
        // 名词派生：-ate→-ion, 以e结尾→-ation, 否则→-ment
        if (endsAte) entries.push({ word: root + 'ion', label: '名词(行为)' });
        else if (endsE) entries.push({ word: root + 'ation', label: '名词(行为)' });
        else entries.push({ word: lower + 'ment', label: '名词(行为)' });
        // 施动者：-ate→-ator, 普通→-er
        entries.push({ word: endsAte ? root + 'or' : (endsE ? root + 'er' : lower + 'er'), label: '名词(施动者)' });
        // 形容词：-ate→-ative, 普通→-ive/-able
        entries.push({ word: endsAte ? root + 'ive' : (endsE ? root + 'ive' : lower + 'ive'), label: '形容词' });
        if (!endsAte) entries.push({ word: endsE ? root + 'able' : lower + 'able', label: '形容词(可…)' });
    }

    // 名词屈折 + 派生（仅名词）
    if (isN) {
        if (lower.endsWith('s') || lower.endsWith('x') || lower.endsWith('ch') || lower.endsWith('sh')) entries.push({ word: lower + 'es', label: '复数' });
        else if (lower.endsWith('y') && !'aeiou'.includes(lower[lower.length - 2] || '')) entries.push({ word: lower.slice(0, -1) + 'ies', label: '复数' });
        else entries.push({ word: lower + 's', label: '复数' });
        entries.push({ word: lower + 'al', label: '形容词' });
        entries.push({ word: lower + 'ous', label: '形容词' });
        entries.push({ word: lower + 'ful', label: '形容词(充满)' });
        entries.push({ word: lower + 'less', label: '形容词(无)' });
    }

    // 形容词派生（仅纯形容词，排除兼类动词）
    if (isA && !isV) {
        const adjRoot = lower.endsWith('y') && !'aeiou'.includes(lower[lower.length - 2] || '') ? lower.slice(0, -1) + 'i' : (endsE ? root : lower);
        if (lower.length <= 6) {
            entries.push({ word: adjRoot + 'er', label: '比较级' });
            entries.push({ word: adjRoot + 'est', label: '最高级' });
        }
        entries.push({ word: adjRoot + 'ness', label: '名词(性质)' });
        entries.push({ word: lower.endsWith('ic') ? lower + 'ally' : adjRoot + 'ly', label: '副词' });
    }
    if (isAdv) { entries.push({ word: lower + 'ness', label: '名词(性质)' }); }

    const seen = new Set([lower]);
    const result = [];
    for (const e of entries) {
        const w = e.word.toLowerCase();
        if (seen.has(w) || w.length < 3) continue;
        if ((e.label === '比较级' || e.label === '最高级') && lower.length > 6) continue;
        if (w === lower) continue;
        seen.add(w);
        result.push(e);
    }
    return result.slice(0, 8);
}
async function fetchWordTree(word) { try { const r = await lookupWordOnline(word); const { synonyms, antonyms } = extractRelations(r); const f = deriveWordForms(word, r); return { word, apiResult: r, forms: f, synonyms, antonyms } } catch { return { word, apiResult: null, forms: [], synonyms: [], antonyms: [] } } }
const treeCache = {};
async function getWordTreeCached(word) { const k = word.toLowerCase(); if (treeCache[k]) return treeCache[k]; const t = await fetchWordTree(word); treeCache[k] = t; return t }
function clearTreeCache() { for (const k in treeCache) delete treeCache[k] }

// ==================== 在线翻译补全 ====================
const translationCache = {};
const translationPending = {}; // 防止重复请求同一词
const zhTranslationCache = {};  // 中文翻译专用缓存

// 获取中文翻译（优先本地词库 → 在线翻译 API → 在线词典英文释义）
async function getChineseTranslation(word) {
    var lower = word.toLowerCase();

    // 1. 本地词库已有
    var localZh = lookupTranslation(lower);
    if (localZh) return localZh;

    // 2. 静态中文翻译缓存命中
    if (zhTranslationCache[lower]) return zhTranslationCache[lower];

    // 3. MyMemory 免费翻译 API（无需 key，日限 5000 词）
    try {
        var ctrl = new AbortController();
        var timer = setTimeout(function () { ctrl.abort(); }, 3000);
        var r = await fetch('https://api.mymemory.translated.net/get?q=' + encodeURIComponent(word) + '&langpair=en|zh-CN', { signal: ctrl.signal });
        clearTimeout(timer);
        if (r.ok) {
            var d = await r.json();
            if (d.responseData && d.responseData.translatedText) {
                var zh = d.responseData.translatedText;
                // 去掉多余空格，截断过长的
                zh = zh.trim();
                if (zh.length > 20) zh = zh.substring(0, 18) + '…';
                // 如果翻译结果和原文一样（API 失败），忽略
                if (zh.toLowerCase() !== lower && zh !== word) {
                    zhTranslationCache[lower] = zh;
                    return zh;
                }
            }
        }
    } catch (e) { }

    // 4. 降级：Free Dictionary API 英文释义
    try {
        var def2 = await fetchTranslationOnline(word);
        if (def2) {
            zhTranslationCache[lower] = def2;
            return def2;
        }
    } catch (e) { }

    return null;
}

// 批量预加载中文翻译
async function batchLoadTranslations(words) {
    var toFetch = [];
    for (var i = 0; i < words.length; i++) {
        var w = words[i].toLowerCase();
        if (lookupTranslation(w)) continue;
        if (zhTranslationCache[w] || translationCache[w]) continue;
        if (translationPending[w]) continue;
        toFetch.push(w);
    }
    if (toFetch.length === 0) return;
    // 串行请求，每个间隔 150ms，避免触发频率限制
    for (var i = 0; i < toFetch.length; i++) {
        try {
            await getChineseTranslation(toFetch[i]);
        } catch (e) { }
        if (i < toFetch.length - 1) {
            await new Promise(function (resolve) { setTimeout(resolve, 150); });
        }
    }
}

async function fetchTranslationOnline(word) {
    if (translationCache[word]) return translationCache[word];
    if (translationPending[word]) return translationPending[word];
    // 3 秒超时，避免网络卡住整个页面
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3000);
    const promise = (async () => {
        try {
            const r = await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(word), { signal: ctrl.signal });
            if (!r.ok) return null; const d = await r.json(); if (!d[0] || !d[0].meanings) return null;
            for (const m of d[0].meanings) { if (m.definitions && m.definitions.length > 0) { const def = m.definitions[0].definition; translationCache[word] = def.length > 50 ? def.substring(0, 47) + '…' : def; return translationCache[word] } } return null;
        } catch { return null; } finally { clearTimeout(timer); delete translationPending[word]; }
    })();
    translationPending[word] = promise;
    return promise;
}

// ==================== 变形翻译（形态标签版）====================
function deriveFormTranslation(form, rootWord) {
    const rootZh = lookupTranslation(rootWord), lower = form.toLowerCase(), rl = rootWord.toLowerCase();
    let label = null;
    const irreg = { was: '过去式', were: '过去式', been: '过去分词', went: '过去式', gone: '过去分词', did: '过去式', done: '过去分词', had: '过去式/分词', made: '过去式/分词', took: '过去式', taken: '过去分词', came: '过去式', saw: '过去式', seen: '过去分词', gave: '过去式', given: '过去分词', knew: '过去式', known: '过去分词', thought: '过去式/分词', found: '过去式/分词', left: '过去式/分词', felt: '过去式/分词', kept: '过去式/分词', brought: '过去式/分词', bought: '过去式/分词', caught: '过去式/分词', taught: '过去式/分词', sent: '过去式/分词', spent: '过去式/分词', lost: '过去式/分词', met: '过去式/分词', stood: '过去式/分词', won: '过去式/分词', began: '过去式', begun: '过去分词', broke: '过去式', broken: '过去分词', chose: '过去式', chosen: '过去分词', wrote: '过去式', written: '过去分词', drove: '过去式', driven: '过去分词', spoke: '过去式', spoken: '过去分词', stole: '过去式', stolen: '过去分词', flew: '过去式', flown: '过去分词', drew: '过去式', drawn: '过去分词', grew: '过去式', grown: '过去分词', threw: '过去式', thrown: '过去分词', laid: '过去式/分词', paid: '过去式/分词', led: '过去式/分词', sold: '过去式/分词', held: '过去式/分词', fed: '过去式/分词', better: '比较级', best: '最高级', worse: '比较级', worst: '最高级', more: '比较级', most: '最高级', men: '复数', women: '复数', children: '复数', feet: '复数', teeth: '复数', mice: '复数', geese: '复数', lives: '复数', knives: '复数', wives: '复数', leaves: '复数', thieves: '复数' };
    if (irreg[lower]) label = irreg[lower];
    if (!label) { if (lower === rl + 'ing') label = '现在分词'; else if (lower === rl + 'ed') label = '过去式/分词'; else if (lower === rl + 'd' && rl.endsWith('e')) label = '过去式/分词'; else if (rl.endsWith('e') && lower === rl.slice(0, -1) + 'ing') label = '现在分词'; else if (rl.endsWith('e') && lower === rl.slice(0, -1) + 'ed') label = '过去式/分词'; else if (lower === rl + 's') label = '复数/三单'; else if (lower === rl + 'es') label = '复数/三单'; else if (lower.endsWith('ies') && rl.endsWith('y')) label = '复数/三单'; else if (lower === rl + 'er') label = '比较级'; else if (lower === rl + 'est') label = '最高级'; else if (rl.endsWith('e') && lower === rl.slice(0, -1) + 'r') label = '比较级'; else if (rl.endsWith('e') && lower === rl.slice(0, -1) + 'st') label = '最高级'; else if (lower.endsWith('ier')) label = '比较级'; else if (lower.endsWith('iest')) label = '最高级'; else if (lower === rl + 'ly') label = '副词'; else if (lower === rl + 'ness') label = '名词(性质)'; else if (lower === rl + 'ment') label = '名词(行为)'; else if (lower === rl + 'tion' || lower === rl + 'sion') label = '名词(行为)'; else if (lower === rl + 'able' || lower === rl + 'ible') label = '形容词'; else if (lower === rl + 'ful') label = '形容词'; else if (lower === rl + 'less') label = '形容词(否定)'; else if (lower === rl + 'ous') label = '形容词'; else if (lower === rl + 'ive') label = '形容词'; else if (lower === rl + 'al') label = '形容词'; else if (lower === rl + 'ize' || lower === rl + 'ise') label = '动词(使…)'; else if (lower === rl + 'or') label = '名词(施动者)'; else if (lower === rl + 'ist') label = '名词(…者)' }
    if (!label) return null;
    return rootZh ? rootZh + ' · ' + label : label;
}

// ==================== 预热翻译缓存（与主树查询并行） ====================
async function warmUpTranslationCache(rootWord, treeData) {
    if (!treeData) return;
    var allWords = [];
    if (treeData.forms) treeData.forms.forEach(function (f) { allWords.push(typeof f === 'string' ? f : f.word); });
    if (treeData.synonyms) treeData.synonyms.forEach(function (s) { allWords.push(s); });
    if (treeData.antonyms) treeData.antonyms.forEach(function (a) { allWords.push(a); });
    await batchLoadTranslations(allWords);
}

async function fillMissingTranslations(word, tree) {
    var nodes = document.querySelectorAll('.tree-node .tn-zh[data-pending="1"]');
    if (nodes.length === 0) return;
    // 收集仍需翻译的词
    var allWords = [];
    if (tree.forms) tree.forms.forEach(function (f) { allWords.push(typeof f === 'string' ? f : f.word); });
    if (tree.synonyms) tree.synonyms.forEach(function (s) { allWords.push(s); });
    if (tree.antonyms) tree.antonyms.forEach(function (a) { allWords.push(a); });
    await batchLoadTranslations(allWords);
    // 更新 DOM
    nodes.forEach(function (el) {
        var p = el.closest('.tree-node'); if (!p) return;
        var m = p.getAttribute('onclick');
        if (!m) return;
        var match = m.match(/navigateTreeWord\('([^']+)'\)/);
        if (!match) { match = m.match(/treeNavToCard\('([^']+)'\)/); }
        if (!match) return;
        var w = match[1];
        var zh = lookupTranslation(w);
        if (!zh && word) zh = deriveFormTranslation(w, word);
        if (!zh) zh = zhTranslationCache[w.toLowerCase()] || translationCache[w.toLowerCase()];
        if (zh) { el.textContent = zh; el.removeAttribute('data-pending'); el.classList.add('loaded'); }
        else { el.textContent = ''; el.removeAttribute('data-pending'); el.classList.add('no-trans'); }
    });
}