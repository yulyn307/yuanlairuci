// ============================================
// 源来如此 — 外部词库动态加载模块
// CET4/CET6 默认自动加载，GRE/TOEFL 按需加载
// ============================================

var EXTERNAL_LIBS = {
    cet4_new: { key: 'cet4_new', name: '四级(CET4)', emoji: '🎓', file: 'data/cet4_new.json', loaded: false, count: 4526, autoLoad: true },
    cet6_new: { key: 'cet6_new', name: '六级(CET6)', emoji: '🎯', file: 'data/cet6_new.json', loaded: false, count: 1150, autoLoad: true },
    gre_ext: { key: 'gre_ext', name: 'GRE(完整)', emoji: '🏛️', file: 'data/gre.json', loaded: false, count: 6049, autoLoad: false },
    toefl: { key: 'toefl', name: '托福(TOEFL)', emoji: '✈️', file: 'data/toefl.json', loaded: false, count: 2123, autoLoad: false }
};

function loadExternalLib(key) {
    var meta = EXTERNAL_LIBS[key];
    if (!meta) return Promise.reject(new Error('Unknown: ' + key));
    if (meta.loaded && WORD_LIBRARIES[key]) return Promise.resolve(WORD_LIBRARIES[key]);

    return fetch(meta.file)
        .then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
        })
        .then(function (lib) {
            WORD_LIBRARIES[key] = lib;
            meta.loaded = true;
            if (typeof rebuildWordsData === 'function') rebuildWordsData();
            return lib;
        })
        .catch(function (err) {
            console.warn('[词库] 加载 ' + key + ' 失败: ' + err.message);
            return null;
        });
}

function loadExternalLibs(keys, callback) {
    var promises = keys.map(function (k) { return loadExternalLib(k); });
    Promise.all(promises).then(function () {
        if (callback) callback();
    }).catch(function () {
        if (callback) callback();
    });
}

// 自动加载标记为 autoLoad 的词库
function autoLoadExternalLibs(callback) {
    var toLoad = [];
    for (var k in EXTERNAL_LIBS) {
        if (EXTERNAL_LIBS[k].autoLoad && !EXTERNAL_LIBS[k].loaded) {
            toLoad.push(k);
        }
    }
    if (toLoad.length > 0) {
        loadExternalLibs(toLoad, callback);
    } else if (callback) {
        callback();
    }
}

// 获取所有可用词库信息（内置 + 外部）
function getAllLibraryInfo() {
    var result = [];
    var seen = {};

    // 内置词库（WORD_LIBRARIES 中的，包括已加载的外部库）
    for (var k in WORD_LIBRARIES) {
        if (!WORD_LIBRARIES.hasOwnProperty(k)) continue;
        var lib = WORD_LIBRARIES[k];
        if (lib && lib.data) {
            seen[k] = true;
            result.push({
                key: k, name: lib.name, emoji: lib.emoji,
                count: lib.data.length, builtin: true, loaded: true
            });
        }
    }

    // 外部词库（尚未加载的）
    for (var ek in EXTERNAL_LIBS) {
        if (seen[ek]) continue; // 已从 WORD_LIBRARIES 中获取
        var m = EXTERNAL_LIBS[ek];
        result.push({
            key: m.key, name: m.name, emoji: m.emoji,
            count: m.count, builtin: false, loaded: false
        });
    }
    return result;
}

// 覆盖 getLibraryKeys / getLibraryInfo
var _origGetKeys = typeof getLibraryKeys === 'function' ? getLibraryKeys : null;
var _origGetInfo = typeof getLibraryInfo === 'function' ? getLibraryInfo : null;

getLibraryKeys = function () {
    var keys = _origGetKeys ? _origGetKeys() : Object.keys(WORD_LIBRARIES);
    for (var k in EXTERNAL_LIBS) {
        if (keys.indexOf(k) === -1) keys.push(k);
    }
    return keys;
};

getLibraryInfo = function (key) {
    if (EXTERNAL_LIBS[key]) {
        var m = EXTERNAL_LIBS[key];
        var lib = WORD_LIBRARIES[key];
        return { key: key, name: m.name, emoji: m.emoji, count: m.count, loaded: !!m.loaded, data: lib ? lib.data : null };
    }
    if (_origGetInfo) return _origGetInfo(key);
    var lib = WORD_LIBRARIES[key];
    return lib ? { key: key, name: lib.name, emoji: lib.emoji, count: lib.data.length, loaded: true, data: lib.data } : null;
};
