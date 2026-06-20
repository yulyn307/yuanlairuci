// ==================== 本地存储管理 ====================

const STORAGE_KEY = 'yinyu_progress';

// 获取所有进度数据
function loadProgress() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

// 保存进度
function saveProgress(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (typeof bulkSync === 'function') bulkSync();
}

// 获取某个单词的进度
function getWordProgress(wordEn) {
    const data = loadProgress();
    return data[wordEn] || { seen: false, quizCorrect: 0, quizTotal: 0 };
}

// 标记单词
function markLearned(wordEn, action) {
    const data = loadProgress();
    if (!data[wordEn]) {
        data[wordEn] = { seen: false, quizCorrect: 0, quizTotal: 0 };
    }

    if (action === 'seen') {
        data[wordEn].seen = true;
    } else if (action === 'quiz-correct') {
        data[wordEn].seen = true;
        data[wordEn].quizCorrect = (data[wordEn].quizCorrect || 0) + 1;
        data[wordEn].quizTotal = (data[wordEn].quizTotal || 0) + 1;
    }

    saveProgress(data);
}

// 获取学习统计
function getStats() {
    const data = loadProgress();
    const entries = Object.values(data);
    return {
        totalSeen: entries.filter(e => e.seen).length,
        totalCorrect: entries.reduce((sum, e) => sum + (e.quizCorrect || 0), 0),
        totalQuiz: entries.reduce((sum, e) => sum + (e.quizTotal || 0), 0),
    };
}

// 重置所有进度
function resetProgress() {
    localStorage.removeItem(STORAGE_KEY);
}
