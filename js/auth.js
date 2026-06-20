// ============================================
// 源来如此 — 账号认证模块（自建后端版）
// 手机号 + 短信验证码登录
// ============================================

const AUTH_SERVER_KEY = 'yinyu_server_url';
const AUTH_USER_KEY = 'yinyu_current_user';
const AUTH_TOKEN_KEY = 'yinyu_token';
const DEFAULT_SERVER_URL = (function () {
    // 自动检测：手机/其他设备访问时用当前页面同源地址，否则用 localhost
    if (window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        return window.location.origin;
    }
    return 'http://localhost:3456';
})();

// 如果 Netlify 部署（前端在 netlify，后端在 ngrok），尝试使用 ngrok 地址
var _injectedServerUrl = null;
try {
    // 存储在 localStorage 中的服务端地址优先
    var saved = localStorage.getItem(AUTH_SERVER_KEY);
    if (!saved && window.location.hostname && window.location.hostname.includes('netlify.app')) {
        // Netlify 部署自动指向 ngrok（本地电脑需要保持 ngrok 运行）
        _injectedServerUrl = 'https://cupping-taco-copartner.ngrok-free.dev';
        localStorage.setItem(AUTH_SERVER_KEY, _injectedServerUrl);
    }
} catch (e) { }

function getServerUrl() {
    var saved = localStorage.getItem(AUTH_SERVER_KEY);
    return saved || DEFAULT_SERVER_URL;
}

function setServerUrl(url) {
    localStorage.setItem(AUTH_SERVER_KEY, url);
}

function getCurrentUser() {
    try { var r = localStorage.getItem(AUTH_USER_KEY); return r ? JSON.parse(r) : null; }
    catch (e) { return null; }
}

function saveCurrentUser(user) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

function getToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY) || '';
}

function saveToken(token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
}

function clearAuth() {
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem('yinyu_cloud_synced');
    localStorage.removeItem('yinyu_offline_mode');
}

function isLoggedIn() {
    // 离线模式也算已登录
    if (localStorage.getItem('yinyu_offline_mode') === 'on') return true;
    return !!getToken() && !!getCurrentUser();
}

function isOfflineMode() {
    return localStorage.getItem('yinyu_offline_mode') === 'on';
}

function enableOfflineMode() {
    localStorage.setItem('yinyu_offline_mode', 'on');
    // 创建一个本地伪用户
    var offlineUser = {
        phone: '离线用户',
        token: 'offline-token-' + Date.now(),
        createdAt: new Date().toISOString(),
        isOffline: true
    };
    saveCurrentUser(offlineUser);
    localStorage.setItem(AUTH_TOKEN_KEY, offlineUser.token);
    localStorage.setItem('yinyu_cloud_synced', '离线模式（无需服务器）');
}

// ==================== API 请求 ====================
function apiPost(path, body, callback) {
    var url = getServerUrl();
    if (!url) { if (callback) callback({ ok: false, msg: '请先输入服务器地址' }); return; }
    var fullUrl = url.replace(/\/+$/, '') + path;
    var xhr = new XMLHttpRequest();
    xhr.open('POST', fullUrl, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    var t = getToken();
    if (t) xhr.setRequestHeader('Authorization', 'Bearer ' + t);
    xhr.timeout = 5000;
    xhr.onload = function () {
        try { var d = JSON.parse(xhr.responseText); if (callback) callback(d); }
        catch (e) { if (callback) callback({ ok: false, msg: '服务器响应异常' }); }
    };
    xhr.onerror = function () { if (callback) callback({ ok: false, msg: '无法连接服务器（请确认服务器已启动）' }); };
    xhr.ontimeout = function () { if (callback) callback({ ok: false, msg: '连接超时（服务器未响应）' }); };
    xhr.send(JSON.stringify(body || {}));
}

function apiGet(path, callback) {
    var url = getServerUrl();
    if (!url) { if (callback) callback({ ok: false, msg: '请先输入服务器地址' }); return; }
    var fullUrl = url.replace(/\/+$/, '') + path;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', fullUrl, true);
    var t = getToken();
    if (t) xhr.setRequestHeader('Authorization', 'Bearer ' + t);
    xhr.timeout = 5000;
    xhr.onload = function () {
        try { var d = JSON.parse(xhr.responseText); if (callback) callback(d); }
        catch (e) { if (callback) callback({ ok: false, msg: '服务器响应异常' }); }
    };
    xhr.onerror = function () { if (callback) callback({ ok: false, msg: '无法连接服务器' }); };
    xhr.ontimeout = function () { if (callback) callback({ ok: false, msg: '连接超时' }); };
    xhr.send();
}

function apiPut(path, body, callback) {
    var url = getServerUrl();
    if (!url) { if (callback) callback({ ok: false, msg: '请先输入服务器地址' }); return; }
    var fullUrl = url.replace(/\/+$/, '') + path;
    var xhr = new XMLHttpRequest();
    xhr.open('PUT', fullUrl, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    var t = getToken();
    if (t) xhr.setRequestHeader('Authorization', 'Bearer ' + t);
    xhr.timeout = 5000;
    xhr.onload = function () {
        try { var d = JSON.parse(xhr.responseText); if (callback) callback(d); }
        catch (e) { if (callback) callback({ ok: false, msg: '服务器响应异常' }); }
    };
    xhr.onerror = function () { if (callback) callback({ ok: false, msg: '无法连接服务器' }); };
    xhr.ontimeout = function () { if (callback) callback({ ok: false, msg: '连接超时' }); };
    xhr.send(JSON.stringify(body || {}));
}

// ==================== 业务 API ====================
function sendSmsCode(phone, callback) {
    apiPost('/api/sms/send', { phone: phone }, function (res) {
        if (res.ok) callback({ success: true, devCode: res.devCode });
        else callback({ success: false, error: res.msg || '发送失败' });
    });
}

function signIn(phone, code, callback) {
    apiPost('/api/auth/login', { phone: phone, code: code }, function (res) {
        if (res.ok) {
            saveToken(res.token);
            saveCurrentUser({ phone: phone, isNew: res.isNew, loginAt: new Date().toISOString() });
            callback({ success: true, user: getCurrentUser() });
        } else {
            callback({ success: false, error: res.msg || '登录失败' });
        }
    });
}

function signOut() { clearAuth(); }

function testServerConnection(url, callback) {
    var u = (url || getServerUrl()).replace(/\/+$/, '') + '/api/sms/send';
    var xhr = new XMLHttpRequest();
    xhr.open('POST', u, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.timeout = 8000;
    xhr.onload = function () {
        try { var d = JSON.parse(xhr.responseText); callback({ success: true, msg: '服务器连接成功' }); }
        catch (e) { callback({ success: false, error: '响应格式异常' }); }
    };
    xhr.onerror = function () { callback({ success: false, error: '无法连接，请检查地址和端口' }); };
    xhr.ontimeout = function () { callback({ success: false, error: '连接超时' }); };
    xhr.send(JSON.stringify({ phone: '13800138000' }));
}

// ==================== 登录页渲染 ====================
function renderLoginPage() {
    var ct = document.getElementById('login-container');
    if (!ct) return;
    var user = getCurrentUser();
    var token = getToken();

    if (user && token) {
        var offline = isOfflineMode() || (user.isOffline);
        var masked = user.phone || '';
        if (!offline && masked.length > 7) masked = masked.substring(0, 3) + '****' + masked.substring(masked.length - 4);
        if (offline) masked = '📱 离线用户';
        var svr = getServerUrl();
        var offlineBadge = offline ? '<span class="login-offline-badge">离线</span>' : '';
        var syncRow = offline
            ? '<div class="login-offline-hint" style="margin-top:8px">💡 离线模式下所有数据存放在手机本地，学习、查词、AI释义全部可用。可随时切换到在线模式进行云端同步。</div>'
            : ('<div class="login-btn-row">' +
                '<button class="login-btn login-btn-outline" onclick="handleLogout()">退出登录</button>' +
                '<button class="login-btn login-btn-sync" onclick="handleManualSync()">☁️ 手动同步</button>' +
                '</div>' +
                '<div class="login-server-info">☁️ 服务器：<span class="lsv-url">' + svr + '</span> <a href="javascript:void(0)" onclick="handleChangeServer()" style="font-size:11px;color:var(--primary);margin-left:4px">更改</a></div>');
        ct.innerHTML =
            '<div class="login-form-wrap">' +
            '<div class="login-logged-row">' +
            '<div class="login-avatar">' + (offline ? '📱' : '👤') + '</div>' +
            '<div class="login-user-info">' +
            '<span class="login-user-phone">' + masked + offlineBadge + '</span>' +
            '<div class="login-stats" id="login-stats">📊 加载中...</div>' +
            '</div>' +
            '</div>' +
            syncRow +
            '<div class="login-status" id="login-status"></div>' +
            '</div>';
        updateLoginStats();
    } else {
        var svr = getServerUrl();
        ct.innerHTML =
            '<div class="login-form-wrap">' +
            '<div class="login-title">手机号登录</div>' +
            '<p class="login-desc">登录后学习进度自动同步到云端</p>' +
            '<div class="login-field">' +
            '<label class="login-label">手机号</label>' +
            '<input type="tel" id="login-phone" class="login-input" placeholder="请输入手机号" maxlength="11" autocomplete="tel">' +
            '</div>' +
            '<div class="login-field">' +
            '<label class="login-label">验证码</label>' +
            '<div class="login-code-row">' +
            '<input type="text" id="login-code" class="login-input login-code-input" placeholder="验证码" maxlength="6" autocomplete="one-time-code">' +
            '<button class="login-btn login-btn-sms" id="login-sms-btn" onclick="handleSendSms()">获取验证码</button>' +
            '</div>' +
            '</div>' +
            '<button class="login-btn login-btn-submit" onclick="handleLogin()">登 录</button>' +
            '<div class="login-error" id="login-error" style="display:none"></div>' +
            '<div class="login-offline-divider"><span>或</span></div>' +
            '<button class="login-btn login-btn-offline" onclick="handleOfflineLogin()" style="background:var(--bg-light);color:var(--text);border:1px solid var(--bg-light)">📱 离线模式（无需服务器）</button>' +
            '<div class="login-offline-hint">💡 离线模式：所有数据保存在本地手机，无需联网或服务器。学习、查词、AI释义全部可用。</div>' +
            '<div class="login-server-toggle" onclick="var e=document.getElementById(\'login-server-extra\');e.style.display=e.style.display===\'none\'?\'block\':\'none\'">⚙️ 服务器：<span class="lsv-url">' + svr + '</span> <span style="font-size:10px;opacity:0.6">（点击修改）</span></div>' +
            '<div class="login-server-extra" id="login-server-extra" style="display:none">' +
            '<div class="login-field">' +
            '<input type="text" id="login-server-url" class="login-input" placeholder="http://localhost:3456" value="' + svr + '">' +
            '</div>' +
            '<div class="login-server-actions">' +
            '<button class="login-btn login-btn-outline" style="font-size:13px;padding:6px 14px" onclick="handleSaveServerUrl()">💾 保存</button>' +
            '<button class="login-btn login-btn-outline" style="font-size:13px;padding:6px 14px" onclick="handleTestServerConn()">🔌 测试</button>' +
            '</div>' +
            '<div class="login-error" id="login-server-msg" style="display:none;margin-top:4px;font-size:12px"></div>' +
            '</div>' +
            '</div>';
        // 自动检测服务器连接状态
        checkServerStatus();
    }
}

function updateLoginStats() {
    var el = document.getElementById('login-stats');
    if (!el) return;
    var p = loadProgress();
    var total = Object.keys(p).length;
    var s = getSRSData();
    var srsTotal = Object.keys(s).length;
    var synced = localStorage.getItem('yinyu_cloud_synced') || '从未';
    el.innerHTML = '📖 已学 ' + total + ' 词 | 🔄 SRS ' + srsTotal + ' 词<br><span style="font-size:11px;opacity:0.7">☁️ 上次同步: ' + synced + '</span>';
}

// ==================== 事件处理 ====================
var _smsTimer = null;
var _smsCountdown = 0;

function handleSendSms() {
    var phone = (document.getElementById('login-phone').value || '').replace(/\s/g, '');
    var btn = document.getElementById('login-sms-btn');
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) { showLoginError('请输入正确的手机号'); return; }
    if (_smsCountdown > 0) return;
    btn.disabled = true; btn.textContent = '连接中...';
    sendSmsCode(phone, function (res) {
        if (res.success) {
            showLoginError('');
            if (res.devCode) { showLoginError('(开发模式) 验证码: ' + res.devCode); document.getElementById('login-error').style.color = 'var(--success)'; }
            _smsCountdown = 60; btn.textContent = _smsCountdown + 's';
            _smsTimer = setInterval(function () {
                _smsCountdown--;
                if (_smsCountdown <= 0) { clearInterval(_smsTimer); btn.disabled = false; btn.textContent = '获取验证码'; }
                else btn.textContent = _smsCountdown + 's';
            }, 1000);
        } else {
            btn.disabled = false; btn.textContent = '获取验证码';
            // 友好提示：区分服务器未启动和其他错误
            var errMsg = res.error || '发送失败';
            if (errMsg.indexOf('无法连接') !== -1 || errMsg.indexOf('超时') !== -1 || errMsg.indexOf('NetworkError') !== -1) {
                errMsg = '⚠️ 无法连接服务器 — 请确保已启动后端服务（在 server/ 目录下运行 node index.js）';
            }
            showLoginError(errMsg);
        }
    });
}

function handleLogin() {
    var phone = (document.getElementById('login-phone').value || '').replace(/\s/g, '');
    var code = (document.getElementById('login-code').value || '').replace(/\s/g, '');
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) { showLoginError('请输入正确的手机号'); return; }
    if (!code || code.length < 4) { showLoginError('请输入验证码'); return; }
    var sb = document.querySelector('.login-btn-submit');
    if (sb) { sb.disabled = true; sb.textContent = '登录中...'; }
    signIn(phone, code, function (res) {
        if (res.success) {
            showLoginError(''); renderLoginPage();
            if (typeof updateAccountBadge === 'function') updateAccountBadge();
            syncAllFromCloud(function () {
                updateLoginStats();
                if (typeof loadWords === 'function') loadWords();
            });
        } else { if (sb) { sb.disabled = false; sb.textContent = '登 录'; } showLoginError(res.error); }
    });
}

function handleLogout() {
    if (confirm('确定要退出登录吗？\n本地学习数据不会丢失。')) {
        signOut(); renderLoginPage(); showLoginStatus('');
        if (typeof updateAccountBadge === 'function') updateAccountBadge();
    }
}

function handleOfflineLogin() {
    enableOfflineMode();
    renderLoginPage();
    showLoginStatus('✅ 已进入离线模式 — 所有数据保存在本地');
    if (typeof updateAccountBadge === 'function') updateAccountBadge();
    // 刷新学习卡片
    if (typeof loadWords === 'function') loadWords();
}

function handleManualSync() {
    var st = document.getElementById('login-status');
    if (st) { st.style.display = 'block'; st.textContent = '☁️ 正在同步...'; st.className = 'login-status'; }
    syncAllToCloud(function (res) {
        if (st) {
            if (res.ok) {
                st.textContent = '✅ 同步成功 - ' + new Date().toLocaleTimeString('zh-CN');
                st.className = 'login-status login-status-ok';
                updateLoginStats();
            } else { st.textContent = '❌ ' + (res.msg || '同步失败'); st.className = 'login-status login-status-err'; }
        }
    });
}

function showLoginError(msg) {
    var el = document.getElementById('login-error');
    if (!el) return;
    if (msg) { el.style.display = 'block'; el.textContent = msg; el.style.color = ''; }
    else { el.style.display = 'none'; el.textContent = ''; el.style.color = ''; }
}

function showLoginStatus(msg) {
    var el = document.getElementById('login-status');
    if (!el) return;
    el.style.display = msg ? 'block' : 'none';
    if (msg) el.textContent = msg;
}

// ==================== 服务器地址管理（内置在登录表单中）====================
function handleSaveServerUrl() {
    var url = (document.getElementById('login-server-url').value || '').trim();
    if (!url) {
        var msgEl = document.getElementById('login-server-msg');
        if (msgEl) { msgEl.style.display = 'block'; msgEl.textContent = '请输入服务器地址'; msgEl.style.color = 'var(--danger)'; }
        return;
    }
    if (typeof setServerUrl === 'function') setServerUrl(url);
    var msgEl = document.getElementById('login-server-msg');
    if (msgEl) { msgEl.style.display = 'block'; msgEl.textContent = '✅ 地址已保存'; msgEl.style.color = 'var(--success)'; }
    // 更新折叠行显示的 URL
    var svrSpans = document.querySelectorAll('.lsv-url');
    for (var i = 0; i < svrSpans.length; i++) { svrSpans[i].textContent = url; }
}

function handleTestServerConn() {
    var url = (document.getElementById('login-server-url').value || '').trim();
    if (!url) { handleSaveServerUrl(); url = getServerUrl(); }
    if (typeof setServerUrl === 'function') setServerUrl(url);
    var msgEl = document.getElementById('login-server-msg');
    if (msgEl) { msgEl.style.display = 'block'; msgEl.textContent = '🔌 正在测试...'; msgEl.style.color = ''; }
    if (typeof testServerConnection === 'function') {
        testServerConnection(url, function (res) {
            if (msgEl) {
                if (res.success) { msgEl.textContent = '✅ ' + res.msg; msgEl.style.color = 'var(--success)'; }
                else { msgEl.textContent = '❌ ' + res.error; msgEl.style.color = 'var(--danger)'; }
            }
        });
    }
}

function handleChangeServer() {
    // 退出后直接定位到登录表单的服务器设置区域
    var ct = document.getElementById('login-container');
    if (!ct) return;
    // 重新渲染登录页，展开服务器设置
    signOut();
    renderLoginPage();
    if (typeof updateAccountBadge === 'function') updateAccountBadge();
    // 自动展开服务器设置
    setTimeout(function () {
        var extra = document.getElementById('login-server-extra');
        if (extra) extra.style.display = 'block';
    }, 100);
}

// 自动检测服务器连接状态（登录表单加载时）
function checkServerStatus() {
    var url = getServerUrl();
    if (!url) return;
    var statusEl = document.getElementById('login-server-msg');
    if (statusEl) {
        statusEl.style.display = 'block';
        statusEl.textContent = '🔍 正在检测服务器...';
        statusEl.style.color = 'var(--text-muted)';
    }
    if (typeof testServerConnection === 'function') {
        testServerConnection(url, function (res) {
            if (statusEl) {
                if (res.success) {
                    statusEl.textContent = '✅ 服务器在线';
                    statusEl.style.color = 'var(--success)';
                } else {
                    statusEl.textContent = '⚠️ 服务器离线 — 可本地使用，暂不支持登录同步';
                    statusEl.style.color = '#f59e0b';
                }
            }
        });
    }
}
