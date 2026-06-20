// ============================================
// 源来如此 — 云端数据同步模块（自建后端版）
// ============================================

function getSyncPayload() {
    return {
        progress: loadProgress(),
        srs: getSRSData(),
        mastered: JSON.stringify([...getMasteredWords()]),
        daily: getDailyState(),
        libraries: localStorage.getItem('yinyu_libraries') || '',
        userLibrary: localStorage.getItem('yinyu_user_library') || '',
        essenceCache: localStorage.getItem('yinyu_ai_cache') || '',
        aiConfig: localStorage.getItem('yinyu_ai_config') || '',
        version: Date.now()
    };
}

function syncAllToCloud(callback) {
    if (!isLoggedIn()) {
        if (callback) callback({ ok: false, msg: '未登录' });
        return;
    }
    apiPut('/api/user/sync', getSyncPayload(), function (res) {
        if (res.ok) {
            var now = new Date().toLocaleString('zh-CN');
            localStorage.setItem('yinyu_cloud_synced', now);
        }
        if (callback) callback(res);
    });
}

function syncAllFromCloud(callback) {
    if (!isLoggedIn()) {
        if (callback) callback({ ok: false, msg: '未登录' });
        return;
    }
    apiGet('/api/user/sync', function (res) {
        if (res.ok && res.data) {
            var d = res.data;
            if (d.progress && Object.keys(d.progress).length) {
                var local = loadProgress();
                // 云端数据优先（通常是更新的）
                for (var k in local) { if (!d.progress[k]) d.progress[k] = local[k]; }
                saveProgress(d.progress);
            }
            if (d.srs && Object.keys(d.srs).length) {
                var localSRS = getSRSData();
                for (var k in localSRS) { if (!d.srs[k]) d.srs[k] = localSRS[k]; }
                saveSRSData(d.srs);
            }
            if (d.mastered) {
                try {
                    var cm = JSON.parse(d.mastered);
                    var lm = getMasteredWords();
                    cm.forEach(function (w) { lm.add(w); });
                    saveMasteredWords(lm);
                } catch (e) { }
            }
            if (d.daily) {
                var ld = getDailyState();
                if (!ld || (d.daily.date === new Date().toDateString())) {
                    saveDailyState(d.daily);
                }
            }
            if (d.libraries) localStorage.setItem('yinyu_libraries', d.libraries);
            if (d.userLibrary) localStorage.setItem('yinyu_user_library', d.userLibrary);
            if (d.essenceCache) localStorage.setItem('yinyu_ai_cache', d.essenceCache);
            if (d.aiConfig) localStorage.setItem('yinyu_ai_config', d.aiConfig);

            var now = new Date().toLocaleString('zh-CN');
            localStorage.setItem('yinyu_cloud_synced', now);
        }
        if (callback) callback(res);
    });
}

// 批量同步防抖
var _bulkSyncTimer = null;
function bulkSync() {
    if (!isLoggedIn()) return;
    clearTimeout(_bulkSyncTimer);
    _bulkSyncTimer = setTimeout(function () {
        syncAllToCloud();
    }, 3000);
}

// 自动同步调度
var _autoSyncInterval = null;
function startAutoSync() {
    stopAutoSync();
    _autoSyncInterval = setInterval(function () {
        if (isLoggedIn()) syncAllToCloud();
    }, 60000);
}
function stopAutoSync() {
    if (_autoSyncInterval) { clearInterval(_autoSyncInterval); _autoSyncInterval = null; }
}

// 页面隐藏时同步
document.addEventListener('visibilitychange', function () {
    if (document.hidden && isLoggedIn()) syncAllToCloud();
});
