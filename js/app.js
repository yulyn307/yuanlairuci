/* ============================================
   源来如此 — 英语单词学习 PWA
   ============================================ */

const WORDS_PER_PAGE = 10;

// ==================== 应用状态 ====================
const state = {
    words: [],
    currentIndex: 0,
    mode: 'learn',            // 'learn' | 'list' | 'essence' | 'settings'
    listPage: 0,
    searchResult: null,
    currEssenceWord: null,
    activeLibraries: null,
};

// ==================== 三合一学习状态 ====================
const learnState = {
    dailyWords: [],           // 今日25词 [{word,type,...}]
    dailyDone: 0,             // 已完成数（SRS 记录）
    beyondDaily: false,       // 超出25词后不再增长进度条
    cardsSinceQuiz: 0,        // 累计翻了几张卡片
    quizWord: null,           // 当前测试的正确答案词对象
    quizOptions: [],          // [{en,zh,explain}]
    quizType: 'zh2en',        // 'zh2en' 或 'en2zh'
    quizWrongAnswer: null,    // 用户选错的选项
};

// ==================== 初始化 ====================
function init() {
    loadWords();
    loadProgress();

    // 处理 PWA 快捷方式 hash (#search)
    if (window.location.hash === '#search') {
        switchTab('essence');
        var input = document.getElementById('search-input');
        if (input) setTimeout(function () { input.focus(); }, 400);
    } else {
        switchTab('learn');
    }

    // 检测 standalone 模式，添加 body class 用于特殊样式
    if (window.matchMedia('(display-mode: standalone)').matches) {
        document.body.classList.add('pwa-standalone');
    }

    // 自动加载外部词库（CET4 + CET6），然后刷新
    if (typeof autoLoadExternalLibs === 'function') {
        autoLoadExternalLibs(function () {
            loadWords();
        });
    }

    // 如果已登录，自动从云端拉取数据
    if (typeof isLoggedIn === 'function' && isLoggedIn()) {
        if (typeof syncAllFromCloud === 'function') {
            syncAllFromCloud(function () {
                loadWords();
                loadProgress();
            });
        }
        if (typeof startAutoSync === 'function') startAutoSync();
    }
}

function loadWords() {
    const selectedLibs = getSelectedLibraries();
    const merged = []; const seen = new Set();
    const order = ['cet4_new', 'cet6_new', 'senior', 'ielts', 'gre', 'gre_ext', 'toefl', 'business', 'academic', 'daily', 'technology'];
    const levelMap = { cet4_new: 1, senior: 1, cet6_new: 2, ielts: 2, gre: 3, gre_ext: 3, toefl: 3, business: 2, academic: 3, daily: 1, technology: 2 };

    for (const key of order) {
        if (selectedLibs && selectedLibs.length > 0 && !selectedLibs.includes(key)) continue;
        const lib = WORD_LIBRARIES[key];
        if (!lib) continue;
        for (const w of lib.data) {
            if (!seen.has(w.en.toLowerCase())) {
                seen.add(w.en.toLowerCase());
                merged.push({ en: w.en, zh: w.zh, explain: w.explain || '', level: levelMap[key] || 1 });
            }
        }
    }
    for (const w of getUserLibrary()) {
        if (!seen.has(w.en.toLowerCase())) {
            seen.add(w.en.toLowerCase());
            merged.push({ en: w.en, zh: w.zh, explain: w.explain || '', level: w.level || 1 });
        }
    }
    state.words = merged.length > 0 ? merged : [...WORDS_DATA];
    state.currentIndex = 0;
}

// ==================== 词库选择持久化 ====================
function getSelectedLibraries() {
    try {
        const raw = localStorage.getItem('yinyu_libraries');
        return raw ? JSON.parse(raw) : null; // null = 全部
    } catch { return null; }
}

function saveSelectedLibraries(keys) {
    if (!keys || keys.length === 0) {
        localStorage.removeItem('yinyu_libraries');
    } else {
        localStorage.setItem('yinyu_libraries', JSON.stringify(keys));
    }
}

// ==================== 用户自定义词库（未收录词保存）====================
function getUserLibrary() {
    try {
        const raw = localStorage.getItem('yinyu_user_library');
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

function saveUserLibrary(lib) {
    localStorage.setItem('yinyu_user_library', JSON.stringify(lib));
}

// 将未收录词添加到用户词库
function addToUserLibrary(en, zh, explain, level) {
    const lib = getUserLibrary();
    // 去重
    const exist = lib.find(w => w.en.toLowerCase() === en.toLowerCase());
    if (!exist) {
        lib.push({ en, zh, explain: explain || '', level: level || 1, fromSearch: true });
        saveUserLibrary(lib);
    } else {
        // 更新释义
        exist.zh = zh;
        if (explain) exist.explain = explain;
        saveUserLibrary(lib);
    }
    // 同步到 state.words
    mergeUserLibrary();
    renderWordList();
    updateStudyProgress();
}

// 将用户词库合并到 state.words 末尾
function mergeUserLibrary() {
    const userLib = getUserLibrary();
    const allWords = state.words.length > 0 ? state.words : (() => {
        const m = []; const s = new Set();
        const order = ['cet4_new', 'cet6_new', 'senior', 'ielts', 'gre', 'toefl', 'business', 'academic', 'daily', 'technology'];
        const levelMap = { cet4_new: 1, senior: 1, cet6_new: 2, ielts: 2, gre: 3, toefl: 3, business: 2, academic: 3, daily: 1, technology: 2 };
        const selectedLibs = getSelectedLibraries();
        for (const key of order) {
            if (selectedLibs && selectedLibs.length > 0 && !selectedLibs.includes(key)) continue;
            const lib = WORD_LIBRARIES[key];
            if (!lib) continue;
            for (const w of lib.data) {
                if (!s.has(w.en.toLowerCase())) { s.add(w.en.toLowerCase()); m.push({ en: w.en, zh: w.zh, explain: w.explain || '', level: levelMap[key] || 1 }); }
            }
        }
        return m.length > 0 ? m : [...WORDS_DATA];
    })();
    const seen = new Set(allWords.map(w => w.en.toLowerCase()));
    for (const w of userLib) {
        if (!seen.has(w.en.toLowerCase())) {
            seen.add(w.en.toLowerCase());
            allWords.push({ en: w.en, zh: w.zh, explain: w.explain || '', level: w.level || 1 });
        }
    }
    state.words = allWords;
}

function registerSW() {
    // Service Worker 在 index.html 中注册
}

// ==================== 页面切换 ====================
function switchTab(tab) {
    state.mode = tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const targetBtn = document.querySelector(`[data-tab="${tab}"]`);
    if (targetBtn) targetBtn.classList.add('active');
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('search-result').style.display = 'none';

    if (tab === 'learn') {
        document.getElementById('page-learn').classList.add('active');
        startLearn();
    } else if (tab === 'detail') {
        document.getElementById('page-detail').classList.add('active');
        renderDetailPage();
    } else if (tab === 'essence') {
        document.getElementById('page-essence').classList.add('active');
        showEssenceList();
    } else if (tab === 'settings') {
        document.getElementById('page-settings').classList.add('active');
        loadSettings();
    }
}

// ==================== 设置卡片折叠 ====================
function toggleSettingsCard(id) {
    var card = document.getElementById(id);
    var body = document.getElementById(id + '-body');
    var arrow = document.getElementById(id + '-arrow');
    if (!card || !body) return;
    var isOpen = body.style.display !== 'none';
    if (isOpen) {
        body.style.display = 'none';
        card.classList.remove('sc-open');
    } else {
        // 手风琴：先折叠所有其他卡片
        var allCards = document.querySelectorAll('.settings-card');
        for (var i = 0; i < allCards.length; i++) {
            var c = allCards[i];
            if (c.id !== id) {
                c.classList.remove('sc-open');
                var cb = document.getElementById(c.id + '-body');
                if (cb) cb.style.display = 'none';
            }
        }
        body.style.display = 'block';
        card.classList.add('sc-open');
        // 特殊处理：展开账号卡片时刷新登录UI
        if (id === 'sc-account' && typeof renderLoginPage === 'function') renderLoginPage();
    }
}

// ============================================
// 三合一学习流程：卡片记忆 → 穿插测试 → 纠错对比
// ============================================

const QUIZ_INTERVAL = 3; // 每3张卡片插入1次测试

// 获取当前学习目标词
function getLearnTargetWord() {
    const daily = getDailyWords();
    if (!daily || !daily.words || daily.words.length === 0) return null;
    const idx = Math.min(learnState.dailyDone, daily.words.length - 1);
    return daily.words[idx];
}

// 根据 word 字符串获取完整词信息
function resolveWordInfo(wordStr) {
    if (!wordStr) return null;
    const lower = wordStr.toLowerCase();
    // 查所有词库
    for (const key of Object.keys(WORD_LIBRARIES || {})) {
        const lib = WORD_LIBRARIES[key];
        if (!lib || !lib.data) continue;
        const found = lib.data.find(w => w.en.toLowerCase() === lower);
        if (found) return {
            en: found.en, zh: found.zh || '', explain: found.explain || '',
            level: ({ cet4_new: 1, senior: 1, cet6_new: 2, ielts: 2, gre: 3, gre_ext: 3, toefl: 3, business: 2, academic: 3, daily: 1, technology: 2 })[key] || 1,
            phrases: found.phrases || (typeof lookupPhrases === 'function' ? lookupPhrases(wordStr) : null) || null
        };
    }
    if (typeof getUserLibrary === 'function') {
        const found = getUserLibrary().find(w => w.en.toLowerCase() === lower);
        if (found) return { en: found.en, zh: found.zh || '', explain: found.explain || '', level: found.level || 1, phrases: found.phrases || (typeof lookupPhrases === 'function' ? lookupPhrases(wordStr) : null) || null };
    }
    return { en: wordStr, zh: '', explain: '', level: 1, phrases: (typeof lookupPhrases === 'function' ? lookupPhrases(wordStr) : null) || null };
}

// ==================== 主入口 ====================
function startLearn() {
    const daily = getDailyWords();
    if (!daily || !daily.words || daily.words.length === 0) {
        // 没有可用词
        document.getElementById('learn-flashcard-view').style.display = 'none';
        document.getElementById('learn-quiz-view').style.display = 'none';
        document.getElementById('learn-compare-view').style.display = 'none';
        document.getElementById('learn-card-actions').style.display = 'none';
        document.getElementById('learn-stats-text').textContent = '🎉 全部完成';
        document.getElementById('learn-progress-fill').style.width = '100%';
        document.getElementById('learn-progress-fill').textContent = '完成';
        document.getElementById('learn-footer').style.display = 'none';
        return;
    }

    learnState.dailyWords = daily.words;
    learnState.dailyDone = Object.keys(daily.completed || {}).length;
    learnState.beyondDaily = false;
    learnState.cardsSinceQuiz = 0;

    document.getElementById('learn-footer').style.display = 'flex';
    showFlashcardView();
}

// ==================== 阶段一：翻转卡片 ====================
function showFlashcardView() {
    document.getElementById('learn-flashcard-view').style.display = 'block';
    document.getElementById('learn-quiz-view').style.display = 'none';
    document.getElementById('learn-compare-view').style.display = 'none';
    document.getElementById('learn-card-actions').style.display = 'none';
    document.getElementById('learn-mode-badge').textContent = '📖 记忆';

    const daily = getDailyWords();
    if (!daily || !daily.words) return;

    // 找下一个未完成的词
    const completed = daily.completed || {};
    let targetIdx = -1;
    for (let i = 0; i < daily.words.length; i++) {
        const w = daily.words[i];
        if (!completed[w.word.toLowerCase()]) { targetIdx = i; break; }
    }
    if (targetIdx < 0) {
        // 全部完成
        if (!learnState.beyondDaily) {
            learnState.beyondDaily = true;
        }
        // 随机选一个来巩固
        const randomWord = daily.words[Math.floor(Math.random() * daily.words.length)];
        const info = resolveWordInfo(randomWord.word);
        renderFlashcardDOM(info);
    } else {
        const wordObj = daily.words[targetIdx];
        const info = resolveWordInfo(wordObj.word);
        renderFlashcardDOM(info);
    }
    updateLearnProgress();
    updateMasterBtnState();
}

function renderFlashcardDOM(info) {
    if (!info) return;
    document.getElementById('card-en').textContent = info.en;
    document.getElementById('card-zh').textContent = info.zh;
    document.getElementById('card-explain').textContent = info.explain || lookupExplain(info.en.toLowerCase()) || '';
    document.getElementById('card-level').textContent = 'Lv.' + info.level;
    const card = document.getElementById('flashcard');
    card.classList.remove('flipped');

    // 加载发音数据
    loadCardPhonetics(info.en);
}

// ==================== 发音功能 ====================
var currentPhonetics = null;

async function loadCardPhonetics(word) {
    currentPhonetics = null;
    const cached = getCachedPhonetics(word);
    if (cached) {
        currentPhonetics = cached;
        updatePronButtons(!!cached.uk, !!cached.us);
    } else {
        updatePronButtons(false, false);
        fetchPhoneticsOnline(word).then(phon => {
            if (phon && document.getElementById('card-en').textContent.toLowerCase() === word.toLowerCase()) {
                currentPhonetics = phon;
                updatePronButtons(!!phon.uk, !!phon.us);
            }
        });
    }
}

function updatePronButtons(hasUk, hasUs) {
    var ukBtn = document.getElementById('pron-uk');
    var usBtn = document.getElementById('pron-us');
    if (ukBtn) ukBtn.style.opacity = hasUk ? '1' : '0.4';
    if (usBtn) usBtn.style.opacity = hasUs ? '1' : '0.4';
}

function playCardPron(accent) {
    var word = document.getElementById('card-en').textContent;
    if (!word) return;

    // 优先用 API 音频 URL
    if (currentPhonetics) {
        var phon = accent === 'uk' ? currentPhonetics.uk : currentPhonetics.us;
        if (phon && phon.audio) {
            if (playAudioUrl(phon.audio)) return;
        }
    }
    // fallback 到浏览器 TTS
    playPronunciation(word, accent);
}

function flipCard() {
    const card = document.getElementById('flashcard');
    const flipped = card.classList.toggle('flipped');
    // 翻到背面后显示操作按钮
    const actions = document.getElementById('learn-card-actions');
    if (flipped) {
        actions.style.display = 'flex';
    }
}

function handleCardRemember() {
    // 记录复习（如果这个词是目标词）
    const daily = getDailyWords();
    if (!daily || !daily.words) return;
    const completed = daily.completed || {};
    for (let i = 0; i < daily.words.length; i++) {
        const w = daily.words[i];
        if (!completed[w.word.toLowerCase()]) {
            completeDailyWord(w.word);
            if (!learnState.beyondDaily) learnState.dailyDone++;
            break;
        }
    }
    // 如果全部完成了，也做 SRS 记录
    const en = document.getElementById('card-en').textContent;
    if (en) recordReview(en);

    learnState.cardsSinceQuiz++;

    // 判断是否插入测试
    if (learnState.cardsSinceQuiz >= QUIZ_INTERVAL) {
        learnState.cardsSinceQuiz = 0;
        showQuizView();
    } else {
        showFlashcardView();
    }
}

function handleCardForgot() {
    // 没记住不记录完成，只记录看到过
    const en = document.getElementById('card-en').textContent;
    if (en) markLearned(en, 'seen');
    learnState.cardsSinceQuiz++;
    if (learnState.cardsSinceQuiz >= QUIZ_INTERVAL) {
        learnState.cardsSinceQuiz = 0;
        showQuizView();
    } else {
        showFlashcardView();
    }
}

// ==================== 阶段二：ABCD 测试题 ====================
function showQuizView() {
    document.getElementById('learn-flashcard-view').style.display = 'none';
    document.getElementById('learn-quiz-view').style.display = 'block';
    document.getElementById('learn-compare-view').style.display = 'none';
    document.getElementById('learn-mode-badge').textContent = '🎯 测试';

    const daily = getDailyWords();
    if (!daily || !daily.words) return;

    // 优先选已学过的词作为测试目标
    const completed = daily.completed || {};
    const learnedWords = daily.words.filter(w => completed[w.word.toLowerCase()]);
    const allWords = learnedWords.length >= 2 ? learnedWords : daily.words;

    // 随机选一个正确答案
    const correctWord = allWords[Math.floor(Math.random() * allWords.length)];
    const correctInfo = resolveWordInfo(correctWord.word);
    learnState.quizWord = correctInfo;

    // 随机决定测试方向
    learnState.quizType = Math.random() < 0.5 ? 'zh2en' : 'en2zh';

    // 生成3个干扰项
    const distractors = [];
    const allAvailable = getAllAvailableWords ? getAllAvailableWords() : state.words;
    for (let attempts = 0; attempts < 50 && distractors.length < 3; attempts++) {
        const r = allAvailable[Math.floor(Math.random() * allAvailable.length)];
        const rLower = (r.en || r.word || '').toLowerCase();
        if (rLower !== correctWord.word.toLowerCase() && !distractors.find(d => (d.en || d.word || '').toLowerCase() === rLower)) {
            distractors.push(r);
        }
    }

    const options = [correctInfo, ...distractors.map(d => resolveWordInfo(d.en || d.word))];
    // 打乱
    for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
    }
    learnState.quizOptions = options;
    learnState.quizWrongAnswer = null;

    // 渲染题目
    document.getElementById('learn-quiz-prompt').textContent =
        learnState.quizType === 'zh2en'
            ? `"${correctInfo.zh}" 对应的英文是？`
            : `"${correctInfo.en}" 的中文意思是？`;

    const optsEl = document.getElementById('learn-quiz-options');
    const labels = ['A', 'B', 'C', 'D'];
    optsEl.innerHTML = options.map((o, i) => `
        <button class="learn-quiz-opt" onclick="handleQuizAnswer(${i})">
            <span class="lqo-label">${labels[i]}</span>
            <span class="lqo-text">${learnState.quizType === 'zh2en' ? o.en : o.zh}</span>
        </button>
    `).join('');

    document.getElementById('learn-quiz-feedback').innerHTML = '';
    document.getElementById('learn-quiz-next').style.display = 'none';
    updateLearnProgress();
}

function handleQuizAnswer(selectedIdx) {
    const correct = learnState.quizWord;
    const selected = learnState.quizOptions[selectedIdx];
    const isCorrect = (learnState.quizType === 'zh2en')
        ? selected.en.toLowerCase() === correct.en.toLowerCase()
        : selected.zh === correct.zh;

    // 禁用所有按钮
    const btns = document.querySelectorAll('.learn-quiz-opt');
    btns.forEach(b => b.disabled = true);

    // 高亮正确/错误
    btns.forEach((b, i) => {
        const opt = learnState.quizOptions[i];
        const optIsCorrect = (learnState.quizType === 'zh2en')
            ? opt.en.toLowerCase() === correct.en.toLowerCase()
            : opt.zh === correct.zh;
        if (optIsCorrect) b.classList.add('correct');
        if (i === selectedIdx && !isCorrect) b.classList.add('wrong');
    });

    if (isCorrect) {
        document.getElementById('learn-quiz-feedback').innerHTML = '✅ 正确！已完全掌握';
        completeDailyWord(correct.en);
        markAsMastered(correct.en);
        if (!learnState.beyondDaily) learnState.dailyDone++;
        document.getElementById('learn-quiz-next').style.display = 'inline-block';
        document.getElementById('learn-quiz-next').textContent = '继续 ▶';
    } else {
        document.getElementById('learn-quiz-feedback').innerHTML = '❌ 错误！看看两词的区别';
        learnState.quizWrongAnswer = selected;
        document.getElementById('learn-quiz-next').style.display = 'inline-block';
        document.getElementById('learn-quiz-next').textContent = '查看对比 →';
    }
    updateLearnProgress();
}

function handleQuizNext() {
    if (learnState.quizWrongAnswer) {
        // 显示对比页
        showCompareView();
    } else {
        showFlashcardView();
    }
}

// ==================== 阶段三：纠错对比 ====================
function showCompareView() {
    document.getElementById('learn-flashcard-view').style.display = 'none';
    document.getElementById('learn-quiz-view').style.display = 'none';
    document.getElementById('learn-compare-view').style.display = 'block';
    document.getElementById('learn-mode-badge').textContent = '🔍 辨析';

    const correct = learnState.quizWord;
    const wrong = learnState.quizWrongAnswer;

    document.getElementById('compare-correct-en').textContent = correct.en;
    document.getElementById('compare-correct-zh').textContent = correct.zh;
    document.getElementById('compare-correct-explain').textContent = correct.explain || '';

    document.getElementById('compare-wrong-en').textContent = wrong.en;
    document.getElementById('compare-wrong-zh').textContent = wrong.zh;
    document.getElementById('compare-wrong-explain').textContent = wrong.explain || '';

    // 生成差异说明
    const diff = [];
    if (correct.en && wrong.en && correct.en !== wrong.en) {
        diff.push(`"${correct.en}" ${correct.zh ? '意为「' + correct.zh + '」' : ''}，而 "${wrong.en}" ${wrong.zh ? '意为「' + wrong.zh + '」' : ''}。`);
    }
    if (correct.explain && wrong.explain) {
        diff.push(`📖 "${correct.en}": ${correct.explain}`);
        diff.push(`📖 "${wrong.en}": ${wrong.explain}`);
    }
    document.getElementById('compare-diff').innerHTML = diff.map(d => `<p>${d}</p>`).join('');
}

function handleCompareBack() {
    // 标记正确词为已学
    const correct = learnState.quizWord;
    if (correct) {
        completeDailyWord(correct.en);
        if (!learnState.beyondDaily) learnState.dailyDone++;
    }
    learnState.quizWrongAnswer = null;
    learnState.cardsSinceQuiz = 0;
    showFlashcardView();
}

// ==================== 已掌握 ====================
var _dailyActiveTab = 'today';

function switchDailyTab(tab) {
    _dailyActiveTab = tab;
    showTodayTab();
    if (tab === 'mastered') renderMasteredList();
    else renderDailyPanel();
}

function showTodayTab() {
    var isToday = _dailyActiveTab === 'today';
    document.getElementById('dp-tab-today').classList.toggle('active', isToday);
    document.getElementById('dp-tab-mastered').classList.toggle('active', !isToday);
    document.getElementById('dp-list').style.display = isToday ? 'block' : 'none';
    document.getElementById('dp-mastered-list').style.display = isToday ? 'none' : 'block';
}

function updateMasterBtnState() {
    var btn = document.getElementById('master-btn');
    if (!btn) return;
    var en = document.getElementById('card-en').textContent;
    if (!en) return;
    var mastered = getMasteredWords();
    if (mastered.has(en.toLowerCase())) {
        btn.textContent = '🔄 取消掌握';
        btn.style.opacity = '0.7';
    } else {
        btn.textContent = '✅ 已完全掌握';
        btn.style.opacity = '1';
    }
}

function handleMasterCurrent() {
    var en = document.getElementById('card-en').textContent;
    if (!en) return;
    var lower = en.toLowerCase();
    var mastered = getMasteredWords();
    if (mastered.has(lower)) {
        mastered.delete(lower); saveMasteredWords(mastered);
        showFlashcardView();
    } else {
        markAsMastered(en);
        showFlashcardView();
    }
    updateMasterBtnState();
    renderDailyPanel();
}

// ==================== 关联树 ====================
function getCurrentLearnWord() {
    const en = document.getElementById('card-en').textContent;
    return en || 'abandon';
}

async function toggleTreeView() {
    const treeView = document.getElementById('learn-tree-view');
    const cardView = document.getElementById('learn-flashcard-view');
    const quizView = document.getElementById('learn-quiz-view');
    const compareView = document.getElementById('learn-compare-view');
    const toggleBtn = document.getElementById('tree-toggle-btn');

    if (treeView.style.display === 'block') {
        hideTreeView();
        return;
    }

    // 隐藏其他视图
    cardView.style.display = 'none';
    quizView.style.display = 'none';
    compareView.style.display = 'none';
    treeView.style.display = 'block';
    toggleBtn.textContent = '📇 返回卡片';
    document.getElementById('learn-mode-badge').textContent = '🌳 关联';

    await loadWordTree();
}

function hideTreeView() {
    document.getElementById('learn-tree-view').style.display = 'none';
    document.getElementById('learn-flashcard-view').style.display = 'block';
    document.getElementById('tree-toggle-btn').textContent = '🌳 关联树';
    document.getElementById('learn-mode-badge').textContent = '📖 记忆';
}

async function loadWordTree() {
    const word = getCurrentLearnWord();
    document.getElementById('tree-loading').style.display = 'block';
    document.getElementById('tree-content').innerHTML = '';
    const tree = await getWordTreeCached(word);
    await warmUpTranslationCache(word, tree);
    renderWordTree(word, tree);
    fillMissingTranslations(word, tree);
}

function renderWordTree(word, tree) {
    document.getElementById('tree-loading').style.display = 'none';
    var hasForms = tree.forms && tree.forms.length > 0;
    var hasSynonyms = tree.synonyms && tree.synonyms.length > 0;
    var hasAntonyms = tree.antonyms && tree.antonyms.length > 0;

    if (!hasForms && !hasSynonyms && !hasAntonyms) {
        document.getElementById('tree-content').innerHTML = '<div class="tree-empty"><p>😕 在线词典未收录「' + word + '」的关联数据</p><p class="tree-empty-sub">试试搜索其他单词，或检查网络连接</p></div>';
        return;
    }

    var rootTranslation = lookupTranslation(word) || '';
    var html = '<div class="tree-graph radial"><div class="tree-core"><div class="tree-core-word">' + word + '</div>' + (rootTranslation ? '<div class="tree-core-zh">' + rootTranslation + '</div>' : '') + '</div><div class="tree-radial-branches">';

    if (hasForms) {
        html += '<div class="tree-sector sector-forms"><div class="sector-label">📝 词形变换</div><div class="sector-nodes">';
        tree.forms.forEach(function (f) {
            var fw = typeof f === 'string' ? f : f.word;
            var zh = lookupTranslation(fw) || deriveFormTranslation(fw, word) || zhTranslationCache[fw.toLowerCase()] || translationCache[fw.toLowerCase()] || '';
            html += '<span class="tree-node node-form double-border" onclick="treeNavToCard(\'' + fw.replace(/'/g, "\\'") + '\')"><span class="tn-en">' + fw + '</span><span class="tn-zh' + (zh ? '' : '" data-pending="1') + '">' + (zh || '…') + '</span></span>';
        });
        html += '</div></div>';
    }
    if (hasSynonyms) {
        html += '<div class="tree-sector sector-synonyms"><div class="sector-label">🟢 近义词</div><div class="sector-nodes">';
        tree.synonyms.forEach(function (s) {
            var zh = lookupTranslation(s) || zhTranslationCache[s.toLowerCase()] || translationCache[s.toLowerCase()] || '';
            html += '<span class="tree-node node-synonym rounded-rect" onclick="treeNavToCard(\'' + s.replace(/'/g, "\\'") + '\')"><span class="tn-en">' + s + '</span><span class="tn-zh' + (zh ? '' : '" data-pending="1') + '">' + (zh || '…') + '</span></span>';
        });
        html += '</div></div>';
    }
    if (hasAntonyms) {
        html += '<div class="tree-sector sector-antonyms"><div class="sector-label">🔴 反义词</div><div class="sector-nodes">';
        tree.antonyms.forEach(function (a) {
            var zh = lookupTranslation(a) || zhTranslationCache[a.toLowerCase()] || translationCache[a.toLowerCase()] || '';
            html += '<span class="tree-node node-antonym star-box" onclick="treeNavToCard(\'' + a.replace(/'/g, "\\'") + '\')"><span class="tn-en">' + a + '</span><span class="tn-zh' + (zh ? '' : '" data-pending="1') + '">' + (zh || '…') + '</span></span>';
        });
        html += '</div></div>';
    }
    html += '</div></div>';
    document.getElementById('tree-content').innerHTML = html;
}

function treeNavToCard(newWord) {
    // 退出树，更新卡片为此词，回到卡片视图
    const info = resolveWordInfo(newWord);
    if (info) {
        document.getElementById('card-en').textContent = info.en;
        document.getElementById('card-zh').textContent = info.zh;
        document.getElementById('card-explain').textContent = info.explain || '';
        document.getElementById('card-level').textContent = 'Lv.' + info.level;
    }
    const card = document.getElementById('flashcard');
    card.classList.remove('flipped');
    hideTreeView();
    recordReview(newWord);
    if (!info.zh && typeof performSearch === 'function') {
        document.getElementById('search-input').value = newWord;
        performSearch();
    }
}

// ==================== 详细页（当前学习词的完整释义） ====================
var _detailWord = '';

async function renderDetailPage() {
    var container = document.getElementById('detail-container');
    _detailWord = document.getElementById('card-en').textContent;
    if (!_detailWord) { container.innerHTML = '<p class="detail-empty">请先在学习页选择一个单词</p>'; return; }

    container.innerHTML = '<div class="search-loading">🔍 正在查询「' + _detailWord + '」…</div>';

    var result = await searchWord(_detailWord);
    var info = resolveWordInfo(_detailWord);
    var aiCached = getCachedEssence(_detailWord);
    var word = _detailWord;

    // 发音
    var cachedPhon = getCachedPhonetics(word);
    var phoneticHtml = '';
    if (cachedPhon) {
        phoneticHtml = '<span class="dt-phonetics">';
        if (cachedPhon.uk && cachedPhon.uk.text) phoneticHtml += '<span class="dt-phon-text">英 /' + cachedPhon.uk.text.replace(/\//g, '') + '/</span>';
        if (cachedPhon.us && cachedPhon.us.text) phoneticHtml += '<span class="dt-phon-text">美 /' + cachedPhon.us.text.replace(/\//g, '') + '/</span>';
        phoneticHtml += '<button class="dt-pron-btn" onclick="event.stopPropagation();playCardPron(\'uk\')" title="英式发音">🇬🇧</button>';
        phoneticHtml += '<button class="dt-pron-btn" onclick="event.stopPropagation();playCardPron(\'us\')" title="美式发音">🇺🇸</button>';
        phoneticHtml += '</span>';
    } else {
        phoneticHtml = '<span class="dt-phonetics"><button class="dt-pron-btn" onclick="event.stopPropagation();playCardPron(\'us\')" title="美式发音">🇺🇸</button><button class="dt-pron-btn" onclick="event.stopPropagation();playCardPron(\'uk\')" title="英式发音">🇬🇧</button></span>';
        fetchPhoneticsOnline(word).then(function () { renderDetailPage(); });
    }

    // 本地释义
    var localHtml = '';
    if (info && info.zh) {
        var srsRec = getSRSRecord(word);
        var reviewInfo = srsRec ? ' · L' + srsRec.level : '';
        localHtml = '<div class="dt-local-def"><span class="dt-lv-badge">Lv.' + info.level + reviewInfo + '</span>' + info.zh + '</div>';
    }

    // 源义入口
    var hasLocalEssence = getEssence(word);
    var essenceLink = '';
    if (hasLocalEssence) {
        essenceLink = '<div class="dt-essence-link" onclick="switchTab(\'essence\');showEssenceDetail(\'' + word + '\')">💡 查看源义释义 →</div>';
    } else if (aiCached) {
        essenceLink = '<div class="dt-essence-link ai" onclick="switchTab(\'essence\');showAIEssenceDetail(\'' + word + '\')">🤖 查看 AI 源义释义 →</div>';
    }

    // 词形变换
    var formsHtml = '';
    if (info && info.en) {
        try {
            var tree = await getWordTreeCached(word);
            if (tree && tree.forms && tree.forms.length > 0) {
                formsHtml = '<div class="dt-forms"><span class="dt-forms-label">📝 词形变换</span><div class="dt-form-tags">';
                tree.forms.forEach(function (f) {
                    var fw = typeof f === 'string' ? f : f.word;
                    formsHtml += '<span class="dt-form-tag" onclick="event.stopPropagation();quickSearch(\'' + fw + '\')">' + fw + '</span>';
                });
                formsHtml += '</div></div>';
            }
        } catch (e) { }
    }

    // 本地短语（动词-名词搭配）
    var localPhrasesBlock = '';
    if (info && info.phrases && info.phrases.length) {
        localPhrasesBlock = '<div class="dt-section">📎 常见搭配</div><div class="dt-phrases">';
        info.phrases.slice(0, 8).forEach(function (p) {
            var text = p.phrase;
            if (p.meaning) text += ' <span class="dt-phrase-meaning">' + p.meaning + '</span>';
            localPhrasesBlock += '<span class="dt-phrase" onclick="event.stopPropagation();quickSearch(\'' + (p.phrase || '').replace(/'/g, "\\'") + '\')">' + text + '</span>';
        });
        localPhrasesBlock += '</div>';
    }

    // 在线释义（含短语）
    var onlineHtml = '';
    if (result && result.online && result.online.meanings) {
        var meanings = result.online.meanings.slice(0, 6);
        onlineHtml = '<div class="dt-section">在线词典</div>';

        meanings.forEach(function (m) {
            // 词性标签
            var posLabel = m.partOfSpeech ? '<span class="dt-pos">' + m.partOfSpeech + '</span>' : '';

            // 释义列表
            var defsList = '';
            if (m.definitions && m.definitions.length) {
                defsList = '<ol class="dt-defs">';
                m.definitions.slice(0, 3).forEach(function (d) {
                    var rawDef = d.definition || '';
                    var defBody = makeSentenceClickable(rawDef) + addCNGlossLine(rawDef);

                    var extras = '';
                    if (d.example) extras += '<span class="dt-eg">📖 ' + makeSentenceClickable(d.example) + '</span>' + addCNGlossLine(d.example);
                    if (d.synonyms && d.synonyms.length) extras += '<span class="dt-eg-tags">近义：' + d.synonyms.slice(0, 4).join(' · ') + '</span>';
                    if (d.antonyms && d.antonyms.length) extras += '<span class="dt-eg-tags">反义：' + d.antonyms.slice(0, 4).join(' · ') + '</span>';

                    defsList += '<li>' + defBody + extras + '</li>';
                });
                defsList += '</ol>';
            }

            // 短语/习语（来自 API meaning 层级）
            var phrasesHtml = '';
            if (m.phrases && m.phrases.length) {
                phrasesHtml = '<div class="dt-phrases">';
                m.phrases.slice(0, 5).forEach(function (ph) {
                    phrasesHtml += '<span class="dt-phrase" onclick="event.stopPropagation();quickSearch(\'' + ph.phrase + '\')">' + ph.phrase + '</span>';
                });
                phrasesHtml += '</div>';
            }

            onlineHtml += '<div class="dt-meaning">' + posLabel + (posLabel ? ' ' : '') + defsList + phrasesHtml + '</div>';
        });
    }

    // 从 API 原始 JSON 提取短语（多种可能位置）
    if (result && result.online) {
        var raw = result.online;
        var allPhrases = [];
        // 位置1: 顶层 phrases
        if (raw.phrases && raw.phrases.length) {
            raw.phrases.forEach(function (p) { allPhrases.push({ phrase: p.phrase || p.word || p, meaning: p.meaning || '' }); });
        }
        // 位置2: meaning 级别
        if (raw.meanings) {
            raw.meanings.forEach(function (m) {
                if (m.phrases) {
                    m.phrases.forEach(function (p) { allPhrases.push({ phrase: p.phrase || p.word || p, meaning: p.meaning || '' }); });
                }
            });
        }
        // 位置3: definition 级别 (Free Dictionary API 的 "phrases" 字段)
        if (raw.meanings) {
            raw.meanings.forEach(function (m) {
                if (m.definitions) {
                    m.definitions.forEach(function (d) {
                        if (d.phrases) {
                            d.phrases.forEach(function (p) { allPhrases.push({ phrase: p.phrase || p.word || p || '', meaning: '' }); });
                        }
                    });
                }
            });
        }
    }

    // 去重并渲染短语
    var phrasesBlock = '';
    var seenPhrases = {};
    var uniquePhrases = [];
    for (var pi = 0; pi < allPhrases.length; pi++) {
        var key = (allPhrases[pi].phrase || '').toLowerCase();
        if (key && !seenPhrases[key]) { seenPhrases[key] = true; uniquePhrases.push(allPhrases[pi]); }
    }
    if (uniquePhrases.length > 0) {
        phrasesBlock = '<div class="dt-section">常见短语</div><div class="dt-phrases">';
        uniquePhrases.slice(0, 10).forEach(function (p) {
            phrasesBlock += '<span class="dt-phrase" onclick="event.stopPropagation();quickSearch(\'' + (p.phrase || '').replace(/'/g, "\\\\'") + '\')">' + p.phrase + '</span>';
        });
        phrasesBlock += '</div>';
    }

    container.innerHTML =
        '<div class="detail-card">' +
        '<div class="dt-sticky-header">' +
        '<div class="dt-head">' +
        '<span class="dt-word">' + word + '</span>' +
        phoneticHtml +
        cnTransBtnHTML() +
        '</div>' +
        localHtml +
        formsHtml +
        essenceLink +
        localPhrasesBlock +
        '</div>' +
        '<div class="dt-scroll-body">' +
        onlineHtml +
        phrasesBlock +
        (!onlineHtml && !phrasesBlock ? '<div class="dt-empty">😕 在线词典暂无该词数据</div>' : '') +
        '<button class="dt-back-btn" onclick="switchTab(\'learn\')">← 返回学习</button>' +
        '</div>' +
        '</div>';
    resolveCNPlaceholders();
}

// ==================== 更新进度条 ====================
function updateLearnProgress() {
    const daily = getDailyWords();
    if (!daily || !daily.words) return;
    const total = daily.words.length;
    const done = learnState.beyondDaily ? total : Math.min(learnState.dailyDone, total);
    const pct = total > 0 ? Math.round(done / total * 100) : 0;
    document.getElementById('learn-progress-fill').style.width = pct + '%';
    document.getElementById('learn-progress-fill').textContent = learnState.beyondDaily ? `25/25  ✅` : `${done}/${total}`;
    document.getElementById('learn-stats-text').textContent = learnState.beyondDaily
        ? '📚 今日完成！继续巩固中…'
        : `📚 今日 ${done}/${total}`;

    const currentWord = getLearnTargetWord();
    if (currentWord) {
        document.getElementById('learn-review-badge').textContent =
            currentWord.type === 'review' ? '🔄 复习' : '🆕 新词';
    }

    // 同步更新滑动面板
    renderDailyPanel();
}

// ==================== 每日单词滑动面板 ====================
function openDailyPanel() {
    document.getElementById('daily-panel').classList.add('open');
    document.getElementById('daily-panel-overlay').classList.add('open');
    document.getElementById('swipe-hint').classList.add('hidden');
    _dailyActiveTab = 'today';
    showTodayTab();
    renderDailyPanel();
}

function closeDailyPanel() {
    document.getElementById('daily-panel').classList.remove('open');
    document.getElementById('daily-panel-overlay').classList.remove('open');
    document.getElementById('swipe-hint').classList.remove('hidden');
}

function renderDailyPanel() {
    const daily = getDailyState();
    const listEl = document.getElementById('dp-list');
    if (!daily || !daily.words || daily.words.length === 0) {
        listEl.innerHTML = '<div class="dp-empty">暂无单词</div>';
        return;
    }
    const completed = daily.completed || {};
    const mastered = getMasteredWords();

    listEl.innerHTML = daily.words.map((w, i) => {
        const lower = w.word.toLowerCase();
        const isDone = !!completed[lower];
        const isMastered = mastered.has(lower);
        const info = resolveWordInfo(w.word);
        const label = w.type === 'review' ? '🔄' : '🆕';
        return `
        <div class="dp-item ${isDone ? 'done' : ''} ${isMastered ? 'mastered' : ''}"
             onclick="jumpToDailyWord('${w.word.replace(/'/g, "\\'")}')">
            <span class="dp-num">${i + 1}</span>
            <span class="dp-label">${label}</span>
            <span class="dp-en">${w.word}</span>
            <span class="dp-zh">${info.zh}</span>
            <span class="dp-check">${isDone ? '✅' : isMastered ? '👁' : ''}</span>
        </div>`;
    }).join('');
    // 更新掌握按钮状态
    updateMasterBtnState();
}

function renderMasteredList() {
    var listEl = document.getElementById('dp-mastered-list');
    var mastered = getMasteredWords();
    if (mastered.size === 0) {
        listEl.innerHTML = '<div class="dp-empty">暂无已掌握单词<br><small>通过每日测试或点击下方按钮即可标记</small></div>';
        return;
    }
    var words = [];
    mastered.forEach(function (w) {
        var info = resolveWordInfo(w);
        words.push({ word: w, zh: info.zh, en: info.en });
    });
    listEl.innerHTML = words.map(function (item) {
        return (
            '<div class="dp-item mastered-item" onclick="unmasterWord(\'' + item.word.replace(/'/g, "\\\\'") + '\')">' +
            '<span class="dp-en">' + item.en + '</span>' +
            '<span class="dp-zh">' + item.zh + '</span>' +
            '<span class="dp-check" style="color:var(--success)">✅</span>' +
            '</div>'
        );
    }).join('');
}

function unmasterWord(word) {
    var mastered = getMasteredWords();
    mastered.delete(word.toLowerCase());
    saveMasteredWords(mastered);
    renderMasteredList();
    renderDailyPanel();
    updateMasterBtnState();
}

function jumpToDailyWord(word) {
    closeDailyPanel();
    const info = resolveWordInfo(word);
    if (info) {
        document.getElementById('card-en').textContent = info.en;
        document.getElementById('card-zh').textContent = info.zh;
        document.getElementById('card-explain').textContent = info.explain || '';
        document.getElementById('card-level').textContent = 'Lv.' + info.level;
        document.getElementById('flashcard').classList.remove('flipped');
        document.getElementById('learn-card-actions').style.display = 'none';
        // 确保在卡片视图
        document.getElementById('learn-flashcard-view').style.display = 'block';
        document.getElementById('learn-quiz-view').style.display = 'none';
        document.getElementById('learn-compare-view').style.display = 'none';
        document.getElementById('learn-tree-view').style.display = 'none';
        document.getElementById('learn-mode-badge').textContent = '📖 记忆';
    }
}

// ==================== 触摸滑动检测 ====================
(function initSwipe() {
    var touchStartX = 0;
    var touchStartY = 0;
    document.addEventListener('touchstart', function (e) {
        if (state.mode !== 'learn') return;
        // 不在面板内或已打开时忽略
        if (e.target.closest('#daily-panel')) return;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchend', function (e) {
        if (state.mode !== 'learn') return;
        if (!touchStartX) return;
        var dx = (e.changedTouches[0].clientX - touchStartX);
        var dy = (e.changedTouches[0].clientY - touchStartY);
        // 左滑超过 60px 且横向大于纵向
        if (dx < -60 && Math.abs(dx) > Math.abs(dy) * 1.2) {
            openDailyPanel();
        }
        touchStartX = 0;
    });
})();

// ==================== flipCard 兼容 ====================
// (defined above in showFlashcardView section)

// ==================== 单词列表 ====================
function renderWordList() {
    const start = state.listPage * WORDS_PER_PAGE;
    const pageWords = state.words.slice(start, start + WORDS_PER_PAGE);
    const totalPages = Math.ceil(state.words.length / WORDS_PER_PAGE);

    const tbody = document.getElementById('word-table-body');
    tbody.innerHTML = pageWords.map((w, i) => {
        const prog = getWordProgress(w.en);
        const explain = (w.explain || lookupExplain(w.en) || '');
        const explainShort = explain.length > 35 ? explain.substring(0, 32) + '…' : explain;
        return `
      <tr>
        <td>${start + i + 1}</td>
        <td class="word-en" onclick="quickSearch('${w.en}')" title="点击查词">${w.en}</td>
        <td>${w.zh}</td>
        <td class="word-explain-cell">${explainShort}</td>
        <td><span class="level-badge level-${w.level}">Lv.${w.level}</span></td>
        <td>${prog.seen ? '✅' : '⬜'} ${prog.quizCorrect > 0 ? `🎯×${prog.quizCorrect}` : ''}</td>
      </tr>
    `;
    }).join('');

    document.getElementById('list-page-info').textContent =
        `${state.listPage + 1} / ${Math.max(totalPages, 1)}`;

    document.getElementById('list-prev').disabled = state.listPage === 0;
    document.getElementById('list-next').disabled = state.listPage >= totalPages - 1;
}

function listPrevPage() {
    if (state.listPage > 0) {
        state.listPage--;
        renderWordList();
    }
}

function listNextPage() {
    const totalPages = Math.ceil(state.words.length / WORDS_PER_PAGE);
    if (state.listPage < totalPages - 1) {
        state.listPage++;
        renderWordList();
    }
}

// ==================== 辅助函数 ====================
// 将英文句子中的每个单词转为可点击查词
function makeSentenceClickable(sentence) {
    if (!sentence) return '';
    // 保留标点，只给单词加点击
    return sentence.replace(/([a-zA-Z]+(?:'[a-zA-Z]+)?)/g, (match, word) => {
        return `<span class="clickable-word" onclick="event.stopPropagation();quickSearch('${word}')" title="点击查「${word}」">${word}</span>`;
    });
}

// 快速搜索（从任意位置触发）
function quickSearch(term) {
    document.getElementById('search-input').value = term;
    // 滚动到搜索框
    document.getElementById('search-input').scrollIntoView({ behavior: 'smooth' });
    performSearch();
}

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

// ==================== 键盘事件 ====================
document.addEventListener('keydown', e => {
    if (state.mode !== 'learn') return;
    if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault(); flipCard();
    } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const flipped = document.getElementById('flashcard').classList.contains('flipped');
        if (flipped) handleCardRemember();
        else flipCard();
    } else if (e.key === 'ArrowLeft') {
        e.preventDefault(); handleCardForgot();
    }
});

// ==================== 中译切换 ====================
function isCNTransEnabled() {
    return localStorage.getItem('yinyu_cn_trans') === 'on';
}
function toggleCNTrans() {
    var current = isCNTransEnabled();
    localStorage.setItem('yinyu_cn_trans', current ? 'off' : 'on');
    // 刷新当前页
    if (state.mode === 'detail') renderDetailPage();
    if (state.mode === 'essence' && document.getElementById('essence-detail-view').style.display !== 'none') {
        var word = state.currEssenceWord;
        if (word) { var e = getEssence(word) || getCachedEssence(word); if (e) showEssenceDetail(word); else showAIEssenceDetail(word); }
    }
    if (state.mode === 'essence') essenceSearch();
}
function updateCNTransBtn() {
    var btns = document.querySelectorAll('.cn-trans-btn');
    var on = isCNTransEnabled();
    for (var i = 0; i < btns.length; i++) {
        btns[i].textContent = on ? '中 🔛' : '中 🔘';
        btns[i].classList.toggle('on', on);
    }
}

// ---------- 整句英→中翻译（MyMemory 免费 API + 本地缓存）----------
var _sentCNCache = {};

function _loadSentCNCache() {
    try { var r = localStorage.getItem('yinyu_sent_cn_cache'); if (r) _sentCNCache = JSON.parse(r); } catch (e) { _sentCNCache = {}; }
}
function _saveSentCNCache() {
    try { localStorage.setItem('yinyu_sent_cn_cache', JSON.stringify(_sentCNCache)); } catch (e) { }
}
_loadSentCNCache();

async function translateSentenceEN2CN(text) {
    if (!text || text.length < 2) return '';
    var key = text.toLowerCase().trim();
    if (_sentCNCache[key]) return _sentCNCache[key];
    try {
        var url = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(text) + '&langpair=en|zh-CN';
        var resp = await fetch(url);
        var data = await resp.json();
        var cn = (data.responseData && data.responseData.translatedText) || '';
        // 去掉 MyMemory 有时附加的无关内容
        cn = cn.replace(/&#39;/g, '\'').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
        if (cn && cn !== text) {
            _sentCNCache[key] = cn;
            _saveSentCNCache();
        }
        return cn;
    } catch (e) { return ''; }
}

// 为英文释义添加整句中文翻译（同步：缓存命中直接返回；否则返回占位符）
function addCNGlossLine(englishText) {
    if (!isCNTransEnabled() || !englishText) return '';
    var key = englishText.toLowerCase().trim();
    if (_sentCNCache[key]) {
        return '<span class="cn-gloss-line">📝 ' + _sentCNCache[key].replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</span>';
    }
    // 占位：稍后由 resolveCNPlaceholders() 异步填充
    return '<span class="cn-gloss-line cn-pending" data-en="' + englishText.replace(/"/g, '&quot;') + '">🔄 翻译中…</span>';
}

// 批量解析页面中所有待翻译的占位符
async function resolveCNPlaceholders() {
    if (!isCNTransEnabled()) return;
    var pending = document.querySelectorAll('.cn-pending');
    if (!pending.length) return;

    // 收集去重文本
    var texts = [];
    var seen = {};
    for (var i = 0; i < pending.length; i++) {
        var en = pending[i].getAttribute('data-en');
        if (en && !seen[en.toLowerCase()]) {
            seen[en.toLowerCase()] = true;
            texts.push(en);
        }
    }

    // 3 个一批并发请求
    var batchSize = 3;
    for (var j = 0; j < texts.length; j += batchSize) {
        var batch = texts.slice(j, j + batchSize);
        var promises = batch.map(function (t) { return translateSentenceEN2CN(t); });
        await Promise.all(promises);
    }

    // 更新 DOM
    for (var k = 0; k < pending.length; k++) {
        var span = pending[k];
        var en = span.getAttribute('data-en');
        var key = (en || '').toLowerCase().trim();
        var cn = _sentCNCache[key];
        if (cn) {
            span.textContent = '📝 ' + cn;
        } else {
            span.textContent = '';
        }
        span.classList.remove('cn-pending');
    }
}

// 构建中译切换按钮HTML
function cnTransBtnHTML() {
    var on = isCNTransEnabled();
    return '<button class="cn-trans-btn' + (on ? ' on' : '') + '" onclick="event.stopPropagation();toggleCNTrans()" title="切换在线词典中文翻译">中 ' + (on ? '🔛' : '🔘') + '</button>';
}

// ==================== 单词搜索 ====================
// 记录最后一次源义搜索
var _lastEssenceWord = '';
var _essenceCycleIndex = 0;
var _essenceCycleTimer = null;

async function performSearch() {
    const input = document.getElementById('search-input');
    const term = input.value.trim();
    if (!term) return;

    _lastEssenceWord = term;
    localStorage.setItem('yinyu_last_essence', term);

    // 直接跳转到源义页（essenceSearch 由 showEssenceList 触发）
    switchTab('essence');
}

// 源义页搜索入口：停止轮播，触发实际搜索
function essenceSearch() {
    stopEssenceCycle();
    _doEssenceSearch();
}

// ==================== 搜索渲染 ====================
// 从 _lastEssenceWord 读取，渲染搜索结果卡片
async function _doEssenceSearch() {
    var term = _lastEssenceWord;
    if (!term) return;

    // 收起所有展开列表，恢复底部按钮
    document.getElementById('essence-expanded-list').style.display = 'none';
    document.getElementById('ai-essence-expanded-list').style.display = 'none';
    var bars = document.getElementById('essence-bottom-bars');
    if (bars) bars.style.display = 'block';

    // 搜索时隐藏底部栏
    var bars = document.getElementById('essence-bottom-bars');
    if (bars) bars.style.display = 'none';

    var card = document.getElementById('essence-result-card');
    var empty = document.getElementById('essence-empty-state');
    if (empty) empty.style.display = 'none';
    card.style.display = 'block';
    card.innerHTML = '<div class="search-loading">🔍 正在查询…</div>';
    card.scrollIntoView({ behavior: 'smooth' });

    var result = await searchWord(term);
    var word = result ? result.word : term.toLowerCase();
    var aiCached = getCachedEssence(word);
    var hasLocalEssence = result && result.essence;
    var hasAIEssence = !!aiCached;

    // 发音区域
    var phoneticHtml = '';
    if (result && result.phonetics) {
        var uk = result.phonetics.uk, us = result.phonetics.us;
        phoneticHtml = '<div class="phonetic-row">';
        if (uk && uk.text) {
            phoneticHtml += '<span class="phonetic-label">🇬🇧 英</span><span class="phonetic-text">' + uk.text + '</span><button class="pron-btn" onclick="playPronunciation(\'' + word + '\',\'uk\')">🔊</button>';
        }
        if (us && us.text) {
            phoneticHtml += '<span class="phonetic-label">🇺🇸 美</span><span class="phonetic-text">' + us.text + '</span><button class="pron-btn" onclick="playPronunciation(\'' + word + '\',\'us\')">🔊</button>';
        }
        if ((!uk || !uk.text) && (!us || !us.text)) {
            phoneticHtml += '<button class="pron-btn" onclick="playPronunciation(\'' + word + '\',\'uk\')">🇬🇧🔊</button><button class="pron-btn" onclick="playPronunciation(\'' + word + '\',\'us\')">🇺🇸🔊</button>';
        }
        phoneticHtml += '</div>';
    }
    if (!phoneticHtml) {
        phoneticHtml = '<div class="phonetic-row"><button class="pron-btn" onclick="playPronunciation(\'' + word + '\',\'uk\')">🇬🇧🔊</button><button class="pron-btn" onclick="playPronunciation(\'' + word + '\',\'us\')">🇺🇸🔊</button></div>';
    }

    var localHtml = '';
    if (result && result.local) {
        localHtml = '<div class="search-def"><span class="badge-lv">Lv.' + (result.local.level || 1) + '</span> ' + result.local.zh + '</div>';
    }

    // 源义入口（详情页跳转）
    var essenceLink = '';
    if (hasLocalEssence) {
        essenceLink = '<div class="essence-link-card" onclick="showEssenceDetail(\'' + word + '\')"><span class="essence-icon">💡</span><span>查看「' + word + '」的源义释义</span><span class="essence-arrow">→</span></div>';
    } else if (hasAIEssence) {
        essenceLink = '<div class="essence-link-card ai-source" onclick="showAIEssenceDetail(\'' + word + '\')"><span class="essence-icon">🤖</span><span>查看 AI 生成的「' + word + '」源义释义</span><span class="essence-arrow">→</span></div>';
    }

    var aiGenBtn = '';
    if (!hasAIEssence && !hasLocalEssence) {
        var aiConfig = getAIConfig();
        if (aiConfig.enabled && aiConfig.apiKey) {
            aiGenBtn = '<div class="ai-generate-box inline"><button class="ai-generate-btn" onclick="aiGenerateAndShow(\'' + word + '\')">✨ AI 分析源义含义</button></div>';
        } else {
            aiGenBtn = '<div class="ai-generate-box inline"><button class="ai-generate-btn outline small" onclick="switchTab(\'settings\')">⚙️ 配置 AI 以获取源义释义</button></div>';
        }
    }

    var onlineHtml = '';
    if (result && result.online && result.online.meanings) {
        onlineHtml = result.online.meanings.slice(0, 3).map(function (m) {
            var defs = m.definitions.slice(0, 3).map(function (d) {
                var defBody = makeSentenceClickable(d.definition || '') + addCNGlossLine(d.definition || '');
                var eg = d.example ? '<br><span class="eg">📖 ' + makeSentenceClickable(d.example) + '</span>' + addCNGlossLine(d.example) : '';
                return '<li>' + defBody + eg + '</li>';
            }).join('');
            return '<div class="online-meaning"><span class="pos-tag">' + m.partOfSpeech + '</span><ul>' + defs + '</ul></div>';
        }).join('');
    }

    if (!result || (!result.found && !hasAIEssence)) {
        var aiConfig2 = getAIConfig();
        var aiReady = aiConfig2.enabled && aiConfig2.apiKey;
        card.innerHTML =
            '<div class="search-card">' +
            '<div class="search-word-row"><span class="search-word">' + word + '</span></div>' +
            '<div class="search-notfound">😕 未收录 "' + word + '"</div>' +
            (aiReady
                ? '<div class="ai-generate-box"><button class="ai-generate-btn" onclick="aiGenerateAndShow(\'' + word + '\')">✨ AI 生成源义释义</button></div>'
                : '<div class="ai-generate-box"><button class="ai-generate-btn outline" onclick="switchTab(\'settings\')">⚙️ 去配置 AI</button></div>') +
            '</div>';
        return;
    }

    card.innerHTML =
        '<div class="search-card">' +
        '<div class="sr-sticky-header">' +
        '<div class="search-word-row"><span class="search-word">' + word + '</span>' + phoneticHtml + cnTransBtnHTML() + '</div>' +
        localHtml + essenceLink + aiGenBtn +
        '</div>' +
        '<div class="sr-scroll-body">' +
        (onlineHtml ? '<div class="online-section-label">—— 在线词典 ——</div>' + onlineHtml : '') +
        buildSaveToLibrarySection(word, result) +
        '</div>' +
        '</div>';
    resolveCNPlaceholders();
}

// ==================== 收录到词库 ====================
function buildSaveToLibrarySection(word, result) {
    const isInLocal = result && result.local;
    const isInUser = getUserLibrary().some(w => w.en.toLowerCase() === word.toLowerCase());
    if (isInLocal) return ''; // 已在精选词库中

    // 从搜索结果中提取中文释义
    let zh = '';
    if (result && result.local) zh = result.local.zh;
    else if (result && result.online && result.online.meanings) {
        const defs = result.online.meanings.flatMap(m => m.definitions).filter(d => d.definition);
        if (defs.length > 0) zh = defs[0].definition.substring(0, 20);
    }
    if (!zh) zh = word;

    const explainSource = lookupExplain(word) || '';
    const savedText = isInUser ? '✅ 已收录' : '📥 收录到词库';
    const savedClass = isInUser ? 'saved' : '';

    return `
      <div class="save-to-lib-section">
        <div class="save-to-lib-row">
          <select id="save-lib-level" class="save-lib-select">
            <option value="1">基础 (Lv.1)</option>
            <option value="2" selected>进阶 (Lv.2)</option>
          </select>
          <button class="save-to-lib-btn ${savedClass}" onclick="handleSaveToLibrary('${word.replace(/'/g, "\\'")}', '${zh.replace(/'/g, "\\'")}', '${(explainSource || '').replace(/'/g, "\\'")}')">${savedText}</button>
        </div>
        <div class="save-to-lib-hint">收录后可在学习卡片和词库列表中查看</div>
      </div>`;
}

// 处理"收录到词库"点击
function handleSaveToLibrary(en, zh, explain) {
    const levelSelect = document.getElementById('save-lib-level');
    const level = levelSelect ? parseInt(levelSelect.value) || 2 : 2;
    addToUserLibrary(en, zh, explain || '', level);
    // 更新按钮状态
    const btn = document.querySelector('.save-to-lib-btn');
    if (btn) {
        btn.textContent = '✅ 已收录';
        btn.classList.add('saved');
        btn.onclick = null;
    }
    // 更新学习卡片
    renderStudyCard();
}

// ==================== AI 生成 & 展示 ====================
async function aiGenerateAndShow(word) {
    const resultDiv = document.getElementById('search-result');
    resultDiv.innerHTML = `
    <div class="search-card">
      <div class="search-loading">🤖 AI 正在分析「${word}」的源义含义…<br><small>可能需要几秒钟</small></div>
    </div>`;

    try {
        const essence = await generateEssence(word);
        // 隐藏搜索卡片，直接跳转到源义页
        resultDiv.style.display = 'none';
        switchTab('essence');
        showAIEssenceDetail(word);
    } catch (e) {
        let errMsg = '生成失败，请稍后重试。';
        if (e.message === 'AI_NOT_CONFIGURED') errMsg = '请先在「⚙️ 设置」中配置 AI API Key。';
        else if (e.message === 'INVALID_KEY') errMsg = '❌ API Key 无效，请检查设置。';
        else if (e.message === 'RATE_LIMIT') errMsg = '⏳ API 请求过于频繁，请稍后再试。';
        else if (e.message === 'PARSE_ERROR') errMsg = '⚠️ AI 返回格式异常，请重试。';
        else if (e.message === 'EMPTY_RESPONSE') errMsg = '⚠️ AI 返回为空，请重试。';
        else if (e.message === 'INVALID_FORMAT') errMsg = '⚠️ AI 返回数据不完整，请重试。';
        resultDiv.innerHTML = `
      <div class="search-card">
        <div class="search-notfound">${errMsg}</div>
        <button class="search-close-btn" onclick="document.getElementById('search-result').style.display='none'">✕ 关闭</button>
      </div>`;
    }
}

// ==================== AI 源义详情展示 ====================
function showAIEssenceDetail(word) {
    const e = getCachedEssence(word);
    if (!e) return;
    state.currEssenceWord = word;

    document.getElementById('essence-list-view').style.display = 'none';
    document.getElementById('essence-detail-view').style.display = '';

    const votes = getVotes(word);
    const score = votes.up - votes.down;
    const scoreLabel = score > 0 ? `👍 可信度: ${Math.min(100, 50 + score * 5)}%` :
        score < 0 ? `⚠️ 争议中` : '📊 尚无评价';
    const isContested = votes.down > votes.up && (votes.up + votes.down) >= 3;

    renderEssenceDetailHTML(word, e, votes, scoreLabel, isContested, true);
}

// 通用的源义详情渲染
function renderEssenceDetailHTML(word, e, votes, scoreLabel, isContested, isAI) {
    // 顶部粘性栏：退后按钮 + 单词 + 发音 + 源义 + 为何如此
    var pronHtml = (isAI ? '<span class="ai-badge" style="margin-left:6px">🤖 AI 生成</span> ' : '') +
        '<button class="pron-btn pron-btn-sm" onclick="playPronunciation(\'' + word + '\',\'us\')" title="美式发音">🇺🇸</button>' +
        '<button class="pron-btn pron-btn-sm" onclick="playPronunciation(\'' + word + '\',\'uk\')" title="英式发音">🇬🇧</button>';

    // 构建 bar 内容（保留后退按钮）
    var bar = document.getElementById('ed-sticky-bar');
    bar.innerHTML =
        '<button class="essence-back-btn" onclick="showEssenceList()">← 返回</button>' +
        '<span class="ed-word-inline">' + word + '</span>' +
        '<span class="ed-pron-inline">' + pronHtml + '</span>' +
        '<div class="ed-sticky-essence-text">💡 ' + e.essence + '</div>' +
        '<div class="ed-sticky-think-text">🧠 ' + e.think + '</div>';

    const meaningsHtml = e.meanings.map((m, i) => `
    <div class="meaning-item">
      <div class="meaning-num">${i + 1}</div>
      <div class="meaning-content">
        <div class="meaning-zh">${m.zh} <span class="meaning-en">${m.en}</span></div>
        <div class="meaning-eg">📖 ${makeSentenceClickable(m.eg)}</div>
        <div class="meaning-egzh">　　${m.egZh}</div>
      </div>
    </div>
  `).join('');

    document.getElementById('essence-detail').innerHTML = `
    <div class="essence-detail-card">
      ${isContested ? '<div class="ed-contested-badge">⚠️ 该释义存在争议，正在重新提炼…</div>' : ''}
      
      <div class="ed-meanings-title">📚 释义拆解与例句</div>
      <div class="ed-meanings">${meaningsHtml}</div>
      
      <div class="ed-vote-section">
        <div class="ed-score">${scoreLabel}</div>
        <div class="ed-vote-hint">这个源义提炼准确吗？</div>
        <div class="ed-vote-btns">
          <button class="vote-btn vote-up" id="vote-up-btn" onclick="handleUpvote('${word}')">👍 赞 <span class="vote-count">${votes.up}</span></button>
          <button class="vote-btn vote-down" id="vote-down-btn" onclick="handleDownvote('${word}')">👎 踩 <span class="vote-count">${votes.down}</span></button>
        </div>
        ${isAI ? `
          <div class="refine-btn-wrap">
            <button class="refine-btn" onclick="aiRefineEssence('${word}')">🔄 AI 重新提炼</button>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// ==================== 设置页 ====================
function loadSettings() {
    const config = getAIConfig();
    document.getElementById('ai-provider').value = config.provider || 'deepseek';
    document.getElementById('ai-apikey').value = config.apiKey || '';
    document.getElementById('ai-endpoint').value = config.endpoint || '';
    document.getElementById('ai-model').value = config.model || '';
    onProviderChange();

    // 更新账号徽章
    updateAccountBadge();

    // 渲染词库选择
    renderLibraryGrid();

    // 缓存数量
    const cache = getAICache();
    document.getElementById('cache-count').textContent = `已缓存 ${Object.keys(cache).length} 个单词`;
    document.getElementById('settings-status').style.display = 'none';

    // 所有卡片初始折叠
    document.querySelectorAll('.sc-body').forEach(function (b) { b.style.display = 'none'; });
    document.querySelectorAll('.settings-card').forEach(function (c) { c.classList.remove('sc-open'); });
}

function updateAccountBadge() {
    var badge = document.getElementById('sc-account-badge');
    if (!badge) return;
    if (typeof isLoggedIn === 'function' && isLoggedIn()) {
        var user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
        var phone = user ? user.phone : '';
        var masked = phone.length > 7 ? phone.substring(0, 3) + '****' + phone.substring(phone.length - 4) : phone;
        badge.textContent = '已登录 · ' + masked;
        badge.style.color = 'var(--success)';
    } else {
        badge.textContent = '未登录';
        badge.style.color = 'var(--text-muted)';
    }
}

// ==================== 词库选择 ====================
function renderLibraryGrid() {
    const grid = document.getElementById('lib-grid');
    const selected = getSelectedLibraries(); // null = 全部
    const allSelected = selected === null;
    const keys = (typeof getAllLibraryInfo === 'function') ? getAllLibraryInfo() : getLibraryKeys().map(function (k) { return getLibraryInfo(k); });

    grid.innerHTML = keys.map(function (info) {
        const key = info.key || info;
        const libInfo = typeof info === 'object' ? info : getLibraryInfo(key);
        if (!libInfo) return '';
        // GitHub 词库默认不选中（需用户手动勾选后加载）
        const isGitHub = !libInfo.builtin && !libInfo.loaded;
        const checked = isGitHub ? (selected && selected.indexOf(key) !== -1) : (allSelected || (selected && selected.indexOf(key) !== -1));
        const needsLoad = !libInfo.loaded;
        return (
            '<label class="lib-checkbox ' + (checked ? 'checked' : '') + '">' +
            '<input type="checkbox" value="' + key + '" ' + (checked ? 'checked' : '') + ' onchange="this.parentElement.classList.toggle(\'checked\',this.checked);updateLibStatus()">' +
            '<span class="lib-check-icon">' + (checked ? '✅' : '☐') + '</span>' +
            '<span class="lib-emoji">' + (libInfo.emoji || '📚') + '</span>' +
            '<span class="lib-name">' + (libInfo.name || key) + '</span>' +
            '<span class="lib-count">' + (libInfo.count || '?') + '词</span>' +
            (needsLoad ? '<span class="lib-loading-tag">⏳ 需加载</span>' : '') +
            '</label>'
        );
    }).join('');
    updateLibStatus();
}

function updateLibStatus() {
    const checks = document.querySelectorAll('#lib-grid input[type=checkbox]');
    const all = checks.length;
    const checked = document.querySelectorAll('#lib-grid input[type=checkbox]:checked').length;
    document.getElementById('lib-status').textContent =
        checked === 0 ? '未选择任何词库（将使用全部）' :
            checked === all ? '已全选' : '已选 ' + checked + '/' + all;
}

function saveLibrarySelection() {
    const checks = document.querySelectorAll('#lib-grid input[type=checkbox]');
    const allCount = checks.length;
    const selected = [];
    checks.forEach(function (c) { if (c.checked) selected.push(c.value); });

    // 检查是否有外部词库需要加载
    var externalKeys = selected.filter(function (k) {
        return (typeof EXTERNAL_LIBS !== 'undefined') && !!EXTERNAL_LIBS[k] && !EXTERNAL_LIBS[k].loaded;
    });

    if (externalKeys.length > 0) {
        document.getElementById('lib-status').textContent = '⏳ 正在加载词库数据...';
        if (typeof loadExternalLibs === 'function') {
            loadExternalLibs(externalKeys, function () {
                finalizeLibrarySave(selected, allCount);
            });
        } else {
            finalizeLibrarySave(selected, allCount);
        }
    } else {
        finalizeLibrarySave(selected, allCount);
    }
}

function finalizeLibrarySave(selected, allCount) {
    if (selected.length === 0 || selected.length === allCount) {
        saveSelectedLibraries(null); // 全部
    } else {
        saveSelectedLibraries(selected);
    }
    loadWords();
    renderStudyCard();
    renderWordList();
    showSettingsStatus('✅ 词库已更新', 'success');
    // 重新渲染词库网格（更新加载状态）
    renderLibraryGrid();
}

function onProviderChange() {
    const provider = document.getElementById('ai-provider').value;
    const isCustom = provider === 'custom';
    document.getElementById('field-endpoint').style.display = isCustom ? 'block' : 'none';
    document.getElementById('field-model').style.display = isCustom ? 'block' : 'none';

    if (provider === 'deepseek') {
        document.getElementById('ai-endpoint').value = 'https://api.deepseek.com/v1/chat/completions';
        document.getElementById('ai-model').value = 'deepseek-chat';
    }
}

function saveSettings() {
    const config = {
        provider: document.getElementById('ai-provider').value,
        apiKey: document.getElementById('ai-apikey').value.trim(),
        endpoint: document.getElementById('ai-endpoint').value.trim(),
        model: document.getElementById('ai-model').value.trim(),
        enabled: true,
    };
    saveAIConfig(config);

    const status = document.getElementById('settings-status');
    status.style.display = 'block';
    status.innerHTML = '<span class="status-ok">✅ 配置已保存</span>';
    status.className = 'settings-status success';
    setTimeout(() => { status.style.display = 'none'; }, 2000);
}

async function testAIConnection() {
    const config = getAIConfig();
    if (!config.apiKey) {
        showSettingsStatus('❌ 请先填写 API Key', 'error');
        return;
    }

    const status = document.getElementById('settings-status');
    status.style.display = 'block';
    status.innerHTML = '🔌 正在测试连接…';
    status.className = 'settings-status';

    try {
        // 用一个简单词测试
        const result = await generateEssence('hello');
        if (result) {
            showSettingsStatus('✅ 连接成功！AI 引擎已就绪。', 'success');
        }
    } catch (e) {
        let msg = '连接失败';
        if (e.message === 'INVALID_KEY') msg = '❌ API Key 无效，请检查';
        else if (e.message === 'RATE_LIMIT') msg = '⏳ 请求太频繁，请稍后再试';
        else msg = `❌ 连接失败: ${e.message}`;
        showSettingsStatus(msg, 'error');
    }
}

function showSettingsStatus(msg, type) {
    const status = document.getElementById('settings-status');
    status.style.display = 'block';
    status.innerHTML = msg;
    status.className = 'settings-status ' + (type || '');
}

function clearAICache() {
    localStorage.removeItem(AI_CACHE_KEY);
    document.getElementById('cache-count').textContent = '已缓存 0 个单词';
    showSettingsStatus('🗑️ AI 缓存已清空', 'success');
}

// ==================== AI 重新提炼 ====================
async function aiRefineEssence(word) {
    const detail = document.getElementById('essence-detail');
    detail.innerHTML = '<div class="search-loading" style="padding:40px">🤖 AI 正在重新提炼「' + word + '」的源义…</div>';

    try {
        const votes = getVotes(word);
        const feedback = `赞 ${votes.up} 次，踩 ${votes.down} 次。用户认为之前的释义不够准确。`;
        const result = await refineEssence(word, feedback);
        showAIEssenceDetail(word);
    } catch (e) {
        detail.innerHTML = '<div class="search-notfound" style="padding:40px">⚠️ 提炼失败，请稍后重试。<br><button class="essence-back-btn" onclick="showEssenceList()">← 返回列表</button></div>';
    }
}

// ==================== 源义释义页 ====================
function showEssenceList() {
    document.getElementById('essence-list-view').style.display = 'block';
    document.getElementById('essence-detail-view').style.display = 'none';
    document.getElementById('essence-expanded-list').style.display = 'none';
    document.getElementById('ai-essence-expanded-list').style.display = 'none';
    var bars = document.getElementById('essence-bottom-bars');
    if (bars) bars.style.display = 'block';
    state.currEssenceWord = null;
    renderEssenceGrid();
    renderAIEssenceGrid();

    // 恢复上次搜索内容，否则启动轮播
    var saved = localStorage.getItem('yinyu_last_essence') || '';
    var bars = document.getElementById('essence-bottom-bars');
    if (saved) {
        _lastEssenceWord = saved;
        if (bars) bars.style.display = 'none';
        essenceSearch();
    } else {
        if (bars) bars.style.display = 'block';
        startEssenceCycle();
    }
}

// 轮播精选词库
function startEssenceCycle() {
    stopEssenceCycle();
    var words = getAllEssenceWords();
    if (!words || words.length === 0) {
        document.getElementById('essence-empty-state').style.display = 'block';
        document.getElementById('essence-cycle-hint').innerHTML = '<p class="essence-intro">🔍 使用顶部搜索栏搜索任意单词，即可查看源义释义</p>';
        return;
    }
    _essenceCycleIndex = 0;
    showCycleWord();
    _essenceCycleTimer = setInterval(function () {
        _essenceCycleIndex = (_essenceCycleIndex + 1) % words.length;
        showCycleWord();
    }, 4000);
}

function stopEssenceCycle() {
    if (_essenceCycleTimer) { clearInterval(_essenceCycleTimer); _essenceCycleTimer = null; }
}

// 轮播显示单个词
function showCycleWord() {
    var words = getAllEssenceWords();
    if (!words || words.length === 0) return;
    var w = words[_essenceCycleIndex];
    var e = getEssence(w);
    var hint = document.getElementById('essence-cycle-hint');
    if (hint) {
        hint.innerHTML =
            '<div class="essence-cycle-card" onclick="essenceSearchFromLib(\'' + w + '\')">' +
            '<span class="ecc-word">' + w + '</span>' +
            '<span class="ecc-essence">' + (e ? e.essence : '') + '</span>' +
            '<span style="font-size:12px;opacity:0.5">点击查看源义 ← 顶部搜索栏输入任意单词</span>' +
            '</div>';
    }
}

// 从词库点击 -> 搜索
function essenceSearchFromLib(word) {
    _lastEssenceWord = word;
    localStorage.setItem('yinyu_last_essence', word);
    essenceSearch();
}

// 切换精选词库展开/收起（与主内容区互换）
function toggleEssenceLibrary() {
    var expanded = document.getElementById('essence-expanded-list');
    var bars = document.getElementById('essence-bottom-bars');
    if (!expanded) return;

    if (expanded.style.display === 'block') {
        expanded.style.display = 'none';
        if (bars) bars.style.display = 'block';
        restoreEssenceMainContent();
    } else {
        stopEssenceCycle();
        document.getElementById('essence-empty-state').style.display = 'none';
        document.getElementById('essence-result-card').style.display = 'none';
        document.getElementById('ai-essence-expanded-list').style.display = 'none';
        expanded.style.display = 'block';
        if (bars) bars.style.display = 'none';
    }
}

// 恢复主内容（轮播 或 上次搜索结果）
function restoreEssenceMainContent() {
    var saved = localStorage.getItem('yinyu_last_essence') || '';
    var bars = document.getElementById('essence-bottom-bars');
    if (saved && document.getElementById('essence-result-card').innerHTML) {
        document.getElementById('essence-result-card').style.display = 'block';
        document.getElementById('essence-empty-state').style.display = 'none';
        if (bars) bars.style.display = 'none';
    } else {
        document.getElementById('essence-empty-state').style.display = 'block';
        document.getElementById('essence-result-card').style.display = 'none';
        if (bars) bars.style.display = 'block';
        if (!_essenceCycleTimer) startEssenceCycle();
    }
}

// 切换 AI 词库展开/收起
function toggleAIEssence() {
    var expanded = document.getElementById('ai-essence-expanded-list');
    var bars = document.getElementById('essence-bottom-bars');
    if (!expanded) return;

    if (expanded.style.display === 'block') {
        expanded.style.display = 'none';
        if (bars) bars.style.display = 'block';
        restoreEssenceMainContent();
    } else {
        stopEssenceCycle();
        document.getElementById('essence-empty-state').style.display = 'none';
        document.getElementById('essence-result-card').style.display = 'none';
        document.getElementById('essence-expanded-list').style.display = 'none';
        expanded.style.display = 'block';
        if (bars) bars.style.display = 'none';
    }
}

function renderEssenceGrid() {
    var words = getAllEssenceWords();
    var list = document.getElementById('essence-word-list');
    var countLabel = document.getElementById('essence-toggle-count');
    if (countLabel) countLabel.textContent = words.length + ' 词';

    list.innerHTML = words.map(function (w) {
        var e = getEssence(w);
        return (
            '<div class="essence-word-card" onclick="essenceSearchFromLib(\'' + w + '\')">' +
            '<span class="ewc-word">' + w + '</span>' +
            '<span class="ewc-essence">' + e.essence + '</span>' +
            '<span class="ewc-arrow">→</span>' +
            '</div>'
        );
    }).join('');
}

function renderAIEssenceGrid() {
    var aiWords = getAllAIEssenceWords();
    var section = document.getElementById('ai-essence-section');
    var list = document.getElementById('ai-essence-word-list');
    var emptyHint = document.getElementById('essence-empty-ai');
    var countLabel = document.getElementById('ai-essence-count');

    if (aiWords.length === 0) {
        section.style.display = 'none';
        if (emptyHint) emptyHint.style.display = 'block';
        return;
    }

    section.style.display = 'block';
    if (emptyHint) emptyHint.style.display = 'none';
    if (countLabel) countLabel.textContent = aiWords.length + ' 词';

    list.innerHTML = aiWords.map(function (w) {
        var e = getCachedEssence(w);
        return (
            '<div class="essence-word-card ai-card" onclick="essenceSearchFromLib(\'' + w + '\')">' +
            '<span class="ewc-word">' + w + ' <span class="ai-mini-badge">🤖</span></span>' +
            '<span class="ewc-essence">' + (e ? e.essence : '') + '</span>' +
            '<span class="ewc-arrow">→</span>' +
            '</div>'
        );
    }).join('');
}

function showEssenceDetail(word) {
    const e = getEssence(word);
    if (!e) return;
    state.currEssenceWord = word;

    document.getElementById('essence-list-view').style.display = 'none';
    document.getElementById('essence-detail-view').style.display = '';

    const votes = getVotes(word);
    const score = votes.up - votes.down;
    const total = votes.up + votes.down;
    const scoreLabel = score > 0 ? `👍 可信度: ${Math.min(100, 50 + score * 5)}%` :
        score < 0 ? `⚠️ 争议中 (${-score} 人质疑)` : '📊 尚无评价';
    const isContested = votes.down > votes.up && total >= 3;

    renderEssenceDetailHTML(word, e, votes, scoreLabel, isContested, false);
}

function handleUpvote(word) {
    const v = upvoteEssence(word);
    // 动画反馈
    const btn = document.getElementById('vote-up-btn');
    btn.classList.add('voted');
    setTimeout(() => btn.classList.remove('voted'), 600);
    // 更新显示
    showEssenceDetail(word);
}

function handleDownvote(word) {
    const v = downvoteEssence(word);
    const btn = document.getElementById('vote-down-btn');
    btn.classList.add('voted');
    setTimeout(() => btn.classList.remove('voted'), 600);
    showEssenceDetail(word);
    // 踩数超过阈值 -> 重新提炼
    if (v.down > v.up && v.down >= 3) {
        setTimeout(() => {
            const e = getEssence(word);
            if (e && !e._refining) {
                e._refining = true;
                showEssenceDetail(word);
            }
        }, 1000);
    }
}

// ==================== 批量导入：从文本提取单词 ====================
// 常见英语停用词（虚词、代词、助动词等，不需要学习）
const STOP_WORDS = new Set([
    'a', 'an', 'the', 'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'will', 'would',
    'shall', 'should', 'can', 'could', 'may', 'might', 'must', 'ought',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
    'my', 'your', 'his', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs',
    'this', 'that', 'these', 'those', 'each', 'every', 'all', 'both', 'few', 'many',
    'some', 'any', 'no', 'not', 'nor', 'so', 'such', 'very', 'too', 'just', 'only',
    'and', 'but', 'or', 'if', 'when', 'where', 'how', 'what', 'which', 'who', 'whom',
    'whose', 'why', 'than', 'then', 'also', 'as', 'at', 'by', 'for', 'from', 'in',
    'into', 'of', 'on', 'onto', 'to', 'with', 'without', 'about', 'above', 'after',
    'before', 'between', 'during', 'over', 'under', 'up', 'down', 'out', 'off',
    'here', 'there', 'now', 'yet', 'still', 'even', 'ever', 'never', 'always',
    'ago', 'already', 'almost', 'enough', 'quite', 'rather', 'since', 'until',
    'while', 'again', 'once', 'twice', 'more', 'most', 'other', 'else', 'own',
    'same', 'one', 'two', 'three', 'first', 'last', 'next', 'much', 'well',
    'really', 'actually', 'because', 'through', 'though', 'although', 'whether',
    'mr', 'mrs', 'ms', 'dr', 'etc', 'eg', 'ie', 'vs', 'per', 'like',
]);

async function extractAndImport() {
    const textarea = document.getElementById('import-textarea');
    const text = textarea.value.trim();
    if (!text) {
        alert('请先在文本框中粘贴英文文本');
        return;
    }

    const resultDiv = document.getElementById('import-result');
    const progressDiv = document.getElementById('import-progress');
    const summaryDiv = document.getElementById('import-summary');

    resultDiv.style.display = 'block';
    progressDiv.textContent = '🔍 正在提取单词…';
    summaryDiv.innerHTML = '';

    // 1. 提取英文单词（仅字母，长度>=2）
    const rawWords = text.match(/\b[a-zA-Z]{2,}\b/g) || [];
    if (rawWords.length === 0) {
        progressDiv.textContent = '⚠️ 未检测到英文单词';
        return;
    }

    // 2. 转小写、去停用词、去重
    const uniqueWords = [];
    const seen = new Set();
    for (const w of rawWords) {
        const lower = w.toLowerCase();
        if (STOP_WORDS.has(lower)) continue;
        if (seen.has(lower)) continue;
        seen.add(lower);
        uniqueWords.push(lower);
    }

    // 3. 按长度排序（短词优先，常用词通常较短）
    uniqueWords.sort((a, b) => a.length - b.length || a.localeCompare(b));

    progressDiv.textContent = `📝 提取到 ${uniqueWords.length} 个不重复单词，正在查释义…`;

    // 4. 分批处理（每批最多5个并发在线查询，避免被 API 限流）
    const CONCURRENCY = 5;
    let newCount = 0, skipCount = 0, failCount = 0;
    const newWords = [];
    const skippedWords = [];
    const failedWords = [];

    // 先检查本地词库和用户词库中已存在的
    const localKnown = new Set();
    for (const lib of Object.values(WORD_LIBRARIES)) {
        for (const w of lib.data) localKnown.add(w.en.toLowerCase());
    }
    for (const w of getUserLibrary()) localKnown.add(w.en.toLowerCase());

    for (let i = 0; i < uniqueWords.length; i += CONCURRENCY) {
        const batch = uniqueWords.slice(i, i + CONCURRENCY);
        const results = await Promise.all(batch.map(async (word) => {
            // 已在词库中
            if (localKnown.has(word)) {
                return { word, status: 'skip' };
            }
            // 查在线释义
            try {
                const apiResult = await searchWord(word);
                if (apiResult && apiResult.local) {
                    // 在线查到且本地词库有
                    return { word, status: 'skip', zh: apiResult.local.zh };
                }
                if (apiResult && apiResult.online) {
                    // 从在线 API 提取释义
                    const meaning = apiResult.online.meanings;
                    let zh = '', explain = '';
                    if (meaning && meaning.length > 0 && meaning[0].definitions && meaning[0].definitions.length > 0) {
                        explain = meaning[0].definitions[0].definition || '';
                        // 尝试用中文词性名作为默认释义
                        const pos = meaning[0].partOfSpeech || '';
                        zh = explain ? explain.substring(0, 30) : pos;
                    }
                    return { word, status: 'new', zh, explain };
                }
                // API 无结果，标记为失败
                return { word, status: 'fail' };
            } catch {
                return { word, status: 'fail' };
            }
        }));

        // 处理结果
        for (const r of results) {
            if (r.status === 'skip') {
                skipCount++;
                skippedWords.push(r.word);
            } else if (r.status === 'new') {
                newCount++;
                newWords.push(r.word);
                addToUserLibrary(r.word, r.zh || r.word, r.explain || '', 1);
            } else {
                failCount++;
                failedWords.push(r.word);
                // 即使没有释义也加入词库（只有英文）
                addToUserLibrary(r.word, '(待补充)', '', 1);
            }
        }

        // 更新进度
        const done = Math.min(i + CONCURRENCY, uniqueWords.length);
        progressDiv.textContent = `⏳ 处理中 ${done}/${uniqueWords.length} … 新增 ${newCount}，跳过 ${skipCount}`;
    }

    // 5. 重新加载词库
    loadWords();
    renderStudyCard();
    renderWordList();

    // 6. 显示结果
    progressDiv.textContent = `✅ 导入完成！`;
    let summaryHTML = `
        <span class="count-new">🆕 新增 ${newCount} 个</span> &nbsp;
        <span class="count-skip">⏭️ 跳过 ${skipCount} 个（已存在）</span>
    `;
    if (failCount > 0) {
        summaryHTML += ` &nbsp; <span class="count-fail">⚠️ 未查到 ${failCount} 个</span>`;
    }

    if (newWords.length > 0) {
        summaryHTML += `<div class="import-word-tags">`;
        for (const w of newWords) {
            summaryHTML += `<span class="import-word-tag new">${w} ✨</span>`;
        }
        summaryHTML += `</div>`;
    }
    if (failedWords.length > 0 && failedWords.length <= 10) {
        summaryHTML += `<div class="import-word-tags" style="margin-top:6px">`;
        summaryHTML += `<span style="font-size:12px;color:var(--text-muted)">未查到释义：</span>`;
        for (const w of failedWords) {
            summaryHTML += `<span class="import-word-tag skip">${w}</span>`;
        }
        summaryHTML += `</div>`;
    }

    summaryDiv.innerHTML = summaryHTML;

    // 清空文本框
    textarea.value = '';
}

// ==================== 启动 ====================
document.addEventListener('DOMContentLoaded', () => {
    init();
    // 点击页面其他区域关闭搜索结果
    document.addEventListener('click', e => {
        const sr = document.getElementById('search-result');
        const si = document.getElementById('search-input');
        if (sr.style.display !== 'none' && !e.target.closest('.search-bar-wrap')) {
            sr.style.display = 'none';
        }
    });
});
