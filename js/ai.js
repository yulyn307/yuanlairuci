// ============================================
// 源来如此 — AI 源义释义引擎
// 支持 DeepSeek / OpenAI 兼容 API
// ============================================

const AI_CONFIG_KEY = 'yinyu_ai_config';
const AI_CACHE_KEY = 'yinyu_ai_essence_cache';

// 默认配置（用户可在设置中修改）
function getAIConfig() {
    try {
        const raw = localStorage.getItem(AI_CONFIG_KEY);
        if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return {
        provider: 'deepseek',      // 'deepseek' | 'openai' | 'custom'
        apiKey: '',                // 用户填入
        endpoint: 'https://api.deepseek.com/v1/chat/completions',
        model: 'deepseek-chat',
        enabled: false,
    };
}

function saveAIConfig(config) {
    localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(config));
}

// ==================== AI 源义缓存 ====================
function getAICache() {
    try {
        const raw = localStorage.getItem(AI_CACHE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
}

function saveAICache(cache) {
    try {
        // 最多保留 200 条，避免 localStorage 爆满
        const keys = Object.keys(cache);
        if (keys.length > 200) {
            const toRemove = keys.slice(0, keys.length - 200);
            toRemove.forEach(k => delete cache[k]);
        }
        localStorage.setItem(AI_CACHE_KEY, JSON.stringify(cache));
    } catch { /* ignore */ }
}

function getCachedEssence(word) {
    const cache = getAICache();
    return cache[word.toLowerCase()] || null;
}

function saveCachedEssence(word, data) {
    const cache = getAICache();
    cache[word.toLowerCase()] = {
        ...data,
        _cachedAt: Date.now(),
        _source: 'ai',
    };
    saveAICache(cache);
}

// ==================== AI 提示词 ====================
function buildEssencePrompt(word) {
    return `你是一位词汇学专家。请分析英语单词 "${word}" 的源义含义。

这个词可能有多个看似不相关的意思，但所有意思都从同一个「核心意象」衍生出来。
你的任务是找到这个核心源义。

请严格返回以下 JSON 格式（不要输出其他内容）：
{
  "essence": "用一句话概括该词所有义项背后的统一源义（中文，20字以内）",
  "think": "简要说明各个义项如何从这个源义衍生出来（中文，50字以内）",
  "meanings": [
    { "zh": "中文义项1", "en": "English definition 1", "eg": "英文例句", "egZh": "例句中文翻译" },
    { "zh": "中文义项2", "en": "English definition 2", "eg": "英文例句", "egZh": "例句中文翻译" },
    { "zh": "中文义项3", "en": "English definition 3", "eg": "英文例句", "egZh": "例句中文翻译" },
    { "zh": "中文义项4", "en": "English definition 4", "eg": "英文例句", "egZh": "例句中文翻译" },
    { "zh": "中文义项5", "en": "English definition 5", "eg": "英文例句", "egZh": "例句中文翻译" }
  ]
}

要求：
1. 选择该词最常见的 4-5 个义项
2. essence 必须高度凝练，能覆盖所有义项
3. 例句要地道、实用，不要生造
4. 必须是合法的 JSON，不要有多余文字`;
}

// ==================== 调用 AI API ====================
async function callAI(prompt) {
    const config = getAIConfig();
    if (!config.apiKey) {
        throw new Error('NO_API_KEY');
    }

    const endpoint = config.endpoint;
    const model = config.model;

    // 构建请求体（兼容 OpenAI / DeepSeek 格式）
    const body = {
        model: model,
        messages: [
            { role: 'system', content: '你是一位英语词汇学专家，擅长分析单词的源义含义。你只返回合法的 JSON，不输出任何其他内容。' },
            { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1024,
        response_format: { type: 'json_object' },  // DeepSeek 支持 JSON mode
    };

    const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify(body),
    });

    if (!resp.ok) {
        const errText = await resp.text().catch(() => '');
        if (resp.status === 401) throw new Error('INVALID_KEY');
        if (resp.status === 429) throw new Error('RATE_LIMIT');
        throw new Error(`API_ERROR: ${resp.status} ${errText}`);
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('EMPTY_RESPONSE');

    // 解析 JSON（可能被包裹在 ```json ... ``` 中）
    let jsonStr = content.trim();
    const codeMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeMatch) jsonStr = codeMatch[1].trim();

    try {
        const parsed = JSON.parse(jsonStr);
        // 验证必要字段
        if (!parsed.essence || !parsed.meanings || !Array.isArray(parsed.meanings)) {
            throw new Error('INVALID_FORMAT');
        }
        return parsed;
    } catch (e) {
        if (e.message === 'INVALID_FORMAT') throw e;
        throw new Error('PARSE_ERROR');
    }
}

// ==================== 主入口：生成源义释义 ====================
async function generateEssence(word) {
    // 1. 查缓存
    const cached = getCachedEssence(word);
    if (cached) return { ...cached, _fromCache: true };

    // 2. 查配置
    const config = getAIConfig();
    if (!config.enabled || !config.apiKey) {
        throw new Error('AI_NOT_CONFIGURED');
    }

    // 3. 调 AI
    const prompt = buildEssencePrompt(word);
    const result = await callAI(prompt);

    // 4. 存缓存
    saveCachedEssence(word, result);

    return { ...result, _fromCache: false };
}

// ==================== 重新提炼（被踩后触发） ====================
async function refineEssence(word, feedback) {
    const prompt = `之前对单词 "${word}" 的源义释义收到了以下反馈：${feedback}

请重新分析，给出更准确的源义释义。

严格返回以下 JSON：
{
  "essence": "重新提炼的源义（中文，20字以内）",
  "think": "修正后的衍生说明（中文，50字以内）",
  "meanings": [ (同上格式，5个义项) ]
}`;

    const result = await callAI(prompt);
    saveCachedEssence(word, result);
    return result;
}

// ==================== 获取所有 AI 生成的源义词 ====================
function getAllAIEssenceWords() {
    const cache = getAICache();
    return Object.keys(cache);
}
