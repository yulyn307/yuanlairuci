// ============================================
// 源来如此 — 后端服务 (Node.js + 腾讯云SMS)
// 启动: node index.js  或  npm start
// 端口: 3456 (可设 PORT 环境变量)
// ============================================

const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// CORS（允许前端跨域访问）
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// ==================== 用户数据存储 ====================
const DATA_FILE = path.join(__dirname, 'users.json');

function loadUsers() {
    try {
        if (!fs.existsSync(DATA_FILE)) return {};
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    } catch (e) { return {}; }
}

function saveUsers(users) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
}

// ==================== 验证码管理（内存，5分钟过期）====================
const codeStore = {}; // { phone: { code, expires, tryCount } }

function generateCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

function storeCode(phone, code) {
    codeStore[phone] = {
        code: code,
        expires: Date.now() + 5 * 60 * 1000,
        tryCount: 0,
        sendTime: Date.now()
    };
}

function verifyCode(phone, code) {
    const entry = codeStore[phone];
    if (!entry) return { ok: false, msg: '请先获取验证码' };
    if (Date.now() > entry.expires) {
        delete codeStore[phone];
        return { ok: false, msg: '验证码已过期，请重新获取' };
    }
    entry.tryCount++;
    if (entry.tryCount > 5) {
        delete codeStore[phone];
        return { ok: false, msg: '验证码尝试次数过多，请重新获取' };
    }
    if (entry.code !== code.trim()) {
        return { ok: false, msg: '验证码错误' };
    }
    delete codeStore[phone];
    return { ok: true };
}

// ==================== 腾讯云短信配置 ====================
// 统一配置：通过环境变量或请求体传入
let tcConfig = null; // { secretId, secretKey, appId, signName, templateId }

function getSMSClient() {
    if (!tcConfig) return null;
    const tencentcloud = require('tencentcloud-sdk-nodejs-sms');
    const SmsClient = tencentcloud.sms.v20210111.Client;
    return new SmsClient({
        credential: {
            secretId: tcConfig.secretId,
            secretKey: tcConfig.secretKey
        },
        region: 'ap-guangzhou',
        profile: { httpProfile: { endpoint: 'sms.tencentcloudapi.com' } }
    });
}

// ==================== 静态文件托管（PWA 前端）====================
const staticDir = path.join(__dirname, '..');
app.use(express.static(staticDir, {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript');
        if (filePath.endsWith('.json')) res.setHeader('Content-Type', 'application/json');
    }
}));

// ==================== API 路由 ====================

// POST /api/config — 初始化配置
app.post('/api/config', (req, res) => {
    const { secretId, secretKey, appId, signName, templateId } = req.body;
    if (!secretId || !secretKey || !appId) {
        return res.json({ ok: false, msg: 'secretId, secretKey, appId 为必填项' });
    }
    tcConfig = { secretId, secretKey, appId, signName: signName || '源来如此', templateId: templateId || '' };
    // 测试连接
    try {
        const client = getSMSClient();
        if (!client) return res.json({ ok: false, msg: 'SMS 客户端初始化失败' });
        res.json({ ok: true, msg: '配置已保存' });
    } catch (e) {
        res.json({ ok: false, msg: '配置错误: ' + e.message });
    }
});

// POST /api/sms/send — 发送验证码
app.post('/api/sms/send', (req, res) => {
    const { phone } = req.body;
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
        return res.json({ ok: false, msg: '手机号格式不正确' });
    }

    // 频率限制：60秒内不可重复发送
    const last = codeStore[phone];
    if (last && Date.now() - last.sendTime < 60000) {
        const wait = Math.ceil((60000 - (Date.now() - last.sendTime)) / 1000);
        return res.json({ ok: false, msg: `请 ${wait} 秒后再试` });
    }

    const code = generateCode();

    if (!tcConfig) {
        // 开发模式：无腾讯云配置时，直接返回验证码（控制台可见）
        console.log(`[开发模式] 验证码: ${code} → ${phone}`);
        storeCode(phone, code);
        return res.json({ ok: true, msg: '验证码已发送（开发模式，请查看服务端日志）', devCode: code });
    }

    const client = getSMSClient();
    if (!client) {
        return res.json({ ok: false, msg: '短信服务未配置，请先在 /api/config 设置腾讯云密钥' });
    }

    const params = {
        SmsSdkAppId: tcConfig.appId,
        SignName: tcConfig.signName,
        TemplateId: tcConfig.templateId || '2034893',
        TemplateParamSet: [code, '5'],
        PhoneNumberSet: [`+86${phone}`]
    };

    client.SendSms(params).then(data => {
        if (data.SendStatusSet && data.SendStatusSet[0] && data.SendStatusSet[0].Code === 'Ok') {
            storeCode(phone, code);
            res.json({ ok: true, msg: '验证码已发送' });
        } else {
            const status = data.SendStatusSet?.[0] || {};
            res.json({ ok: false, msg: status.Message || '发送失败' });
        }
    }).catch(err => {
        console.error('[SMS] 发送失败:', err.message);
        res.json({ ok: false, msg: '短信发送失败: ' + (err.message || '未知错误') });
    });
});

// POST /api/auth/login — 验证码登录/注册
app.post('/api/auth/login', (req, res) => {
    const { phone, code } = req.body;
    if (!phone || !code) {
        return res.json({ ok: false, msg: '手机号和验证码不能为空' });
    }

    const result = verifyCode(phone, code);
    if (!result.ok) {
        return res.json({ ok: false, msg: result.msg });
    }

    const users = loadUsers();
    let user = users[phone];

    if (!user) {
        // 新用户注册
        const token = crypto.randomBytes(24).toString('hex');
        user = {
            phone: phone,
            token: token,
            createdAt: new Date().toISOString(),
            progress: {},
            srs: {},
            mastered: [],
            daily: null
        };
        users[phone] = user;
        saveUsers(users);
        return res.json({ ok: true, token: token, isNew: true, msg: '注册并登录成功' });
    }

    // 已有用户，刷新 token
    user.token = crypto.randomBytes(24).toString('hex');
    users[phone] = user;
    saveUsers(users);
    return res.json({ ok: true, token: user.token, isNew: false, msg: '登录成功' });
});

// PUT /api/user/sync — 同步学习数据
app.put('/api/user/sync', (req, res) => {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    const { progress, srs, mastered, daily, libraries, userLibrary, essenceCache, aiConfig } = req.body;

    if (!token) return res.json({ ok: false, msg: '未授权' });

    const users = loadUsers();
    const phone = Object.keys(users).find(k => users[k].token === token);
    if (!phone) return res.json({ ok: false, msg: 'token 无效，请重新登录' });

    const user = users[phone];
    if (progress !== undefined) user.progress = progress;
    if (srs !== undefined) user.srs = srs;
    if (mastered !== undefined) user.mastered = mastered;
    if (daily !== undefined) user.daily = daily;
    if (libraries !== undefined) user.libraries = libraries;
    if (userLibrary !== undefined) user.userLibrary = userLibrary;
    if (essenceCache !== undefined) user.essenceCache = essenceCache;
    if (aiConfig !== undefined) user.aiConfig = aiConfig;
    user.lastSync = new Date().toISOString();

    users[phone] = user;
    saveUsers(users);
    res.json({ ok: true, msg: '同步成功' });
});

// GET /api/user/sync — 拉取学习数据
app.get('/api/user/sync', (req, res) => {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    if (!token) return res.json({ ok: false, msg: '未授权' });

    const users = loadUsers();
    const phone = Object.keys(users).find(k => users[k].token === token);
    if (!phone) return res.json({ ok: false, msg: 'token 无效，请重新登录' });

    const user = users[phone];
    res.json({
        ok: true,
        data: {
            progress: user.progress || {},
            srs: user.srs || {},
            mastered: user.mastered || [],
            daily: user.daily || null,
            libraries: user.libraries || '',
            userLibrary: user.userLibrary || '',
            essenceCache: user.essenceCache || '',
            aiConfig: user.aiConfig || ''
        }
    });
});

// ==================== 启动 ====================
const PORT = process.env.PORT || 3456;
app.listen(PORT, () => {
    console.log(`\n🌉 源来如此后端已启动: http://localhost:${PORT}`);
    console.log('   API:');
    console.log('   POST /api/sms/send      — 发送短信验证码');
    console.log('   POST /api/auth/login    — 验证码登录/注册');
    console.log('   PUT  /api/user/sync     — 上传学习数据');
    console.log('   GET  /api/user/sync     — 拉取学习数据');
    console.log('   POST /api/config        — 配置腾讯云短信');
    console.log(`   ${tcConfig ? '✅ 腾讯云短信已配置' : '⚠️ 未配置腾讯云，使用开发模式（验证码打印到控制台）'}\n`);
});
