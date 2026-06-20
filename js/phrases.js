// ============================================
// 源来如此 — 动词-名词搭配短语库
// ============================================
const PHRASES_MAP = {
    // === 核心动词 ===
    "make": [
        { phrase: "make a decision", meaning: "做决定" },
        { phrase: "make progress", meaning: "取得进步" },
        { phrase: "make a difference", meaning: "有影响；起作用" },
        { phrase: "make an effort", meaning: "努力" },
        { phrase: "make a mistake", meaning: "犯错误" },
        { phrase: "make sense", meaning: "有意义；讲得通" },
        { phrase: "make money", meaning: "赚钱" },
        { phrase: "make friends", meaning: "交朋友" }
    ],
    "take": [
        { phrase: "take action", meaning: "采取行动" },
        { phrase: "take advantage of", meaning: "利用" },
        { phrase: "take care of", meaning: "照顾；处理" },
        { phrase: "take a risk", meaning: "冒险" },
        { phrase: "take responsibility", meaning: "承担责任" },
        { phrase: "take part in", meaning: "参加" },
        { phrase: "take place", meaning: "发生" },
        { phrase: "take measures", meaning: "采取措施" }
    ],
    "have": [
        { phrase: "have an impact on", meaning: "对…有影响" },
        { phrase: "have access to", meaning: "有权使用" },
        { phrase: "have a conversation", meaning: "进行对话" },
        { phrase: "have difficulty", meaning: "有困难" },
        { phrase: "have an effect on", meaning: "对…有效果" },
        { phrase: "have the right to", meaning: "有权…" },
        { phrase: "have a chance", meaning: "有机会" }
    ],
    "give": [
        { phrase: "give advice", meaning: "提供建议" },
        { phrase: "give a presentation", meaning: "做演讲" },
        { phrase: "give priority to", meaning: "优先考虑" },
        { phrase: "give rise to", meaning: "引起；导致" },
        { phrase: "give feedback", meaning: "给予反馈" },
        { phrase: "give evidence", meaning: "提供证据" }
    ],
    "pay": [
        { phrase: "pay attention to", meaning: "注意" },
        { phrase: "pay the price", meaning: "付出代价" },
        { phrase: "pay a visit", meaning: "拜访" },
        { phrase: "pay tribute to", meaning: "向…致敬" }
    ],
    "play": [
        { phrase: "play a role in", meaning: "在…中起作用" },
        { phrase: "play a part", meaning: "扮演角色；起作用" },
        { phrase: "play an important role", meaning: "起重要作用" }
    ],
    "do": [
        { phrase: "do research", meaning: "做研究" },
        { phrase: "do business", meaning: "做生意" },
        { phrase: "do damage to", meaning: "对…造成损害" },
        { phrase: "do one's best", meaning: "尽力" },
        { phrase: "do a favor", meaning: "帮忙" }
    ],
    "keep": [
        { phrase: "keep a balance", meaning: "保持平衡" },
        { phrase: "keep in touch", meaning: "保持联系" },
        { phrase: "keep track of", meaning: "跟踪；记录" },
        { phrase: "keep an eye on", meaning: "留意" },
        { phrase: "keep pace with", meaning: "跟上…的步伐" }
    ],
    "draw": [
        { phrase: "draw a conclusion", meaning: "得出结论" },
        { phrase: "draw attention to", meaning: "引起对…的注意" },
        { phrase: "draw a distinction", meaning: "加以区分" }
    ],
    "raise": [
        { phrase: "raise awareness", meaning: "提高意识" },
        { phrase: "raise a question", meaning: "提出问题" },
        { phrase: "raise funds", meaning: "筹集资金" },
        { phrase: "raise concerns", meaning: "引起担忧" }
    ],
    "meet": [
        { phrase: "meet the needs of", meaning: "满足…的需求" },
        { phrase: "meet the requirements", meaning: "满足要求" },
        { phrase: "meet the deadline", meaning: "赶在截止日期前完成" },
        { phrase: "meet the standards", meaning: "达到标准" }
    ],
    "reach": [
        { phrase: "reach a conclusion", meaning: "得出结论" },
        { phrase: "reach an agreement", meaning: "达成协议" },
        { phrase: "reach a consensus", meaning: "达成共识" },
        { phrase: "reach the peak", meaning: "达到顶峰" }
    ],
    "hold": [
        { phrase: "hold a view", meaning: "持有观点" },
        { phrase: "hold a meeting", meaning: "召开会议" },
        { phrase: "hold responsibility", meaning: "承担责任" },
        { phrase: "hold the key to", meaning: "掌握…的关键" }
    ],
    "set": [
        { phrase: "set a goal", meaning: "设定目标" },
        { phrase: "set an example", meaning: "树立榜样" },
        { phrase: "set standards", meaning: "制定标准" },
        { phrase: "set the stage for", meaning: "为…做好准备" }
    ],
    "carry": [
        { phrase: "carry out research", meaning: "开展研究" },
        { phrase: "carry weight", meaning: "有分量；有影响力" },
        { phrase: "carry responsibility", meaning: "承担责任" }
    ],
    "put": [
        { phrase: "put emphasis on", meaning: "强调" },
        { phrase: "put pressure on", meaning: "给…施加压力" },
        { phrase: "put an end to", meaning: "结束" },
        { phrase: "put into practice", meaning: "付诸实践" }
    ],
    "bring": [
        { phrase: "bring benefits to", meaning: "为…带来好处" },
        { phrase: "bring about change", meaning: "带来改变" },
        { phrase: "bring attention to", meaning: "引起注意" }
    ],
    "break": [
        { phrase: "break the law", meaning: "违法" },
        { phrase: "break the record", meaning: "打破纪录" },
        { phrase: "break a habit", meaning: "改掉习惯" },
        { phrase: "break new ground", meaning: "开辟新天地" }
    ],
    "catch": [
        { phrase: "catch attention", meaning: "引起注意" },
        { phrase: "catch a glimpse of", meaning: "瞥见" },
        { phrase: "catch sight of", meaning: "看见" }
    ],
    "face": [
        { phrase: "face a challenge", meaning: "面对挑战" },
        { phrase: "face difficulties", meaning: "面临困难" },
        { phrase: "face the consequences", meaning: "承担后果" }
    ],
    "express": [
        { phrase: "express concern", meaning: "表达关切" },
        { phrase: "express gratitude", meaning: "表达感激" },
        { phrase: "express an opinion", meaning: "表达观点" }
    ],
    "address": [
        { phrase: "address an issue", meaning: "处理问题" },
        { phrase: "address a problem", meaning: "解决问题" },
        { phrase: "address the needs", meaning: "解决需求" }
    ],
    "pose": [
        { phrase: "pose a threat to", meaning: "对…构成威胁" },
        { phrase: "pose a challenge", meaning: "构成挑战" },
        { phrase: "pose a risk", meaning: "构成风险" }
    ],

    // === 核心名词 ===
    "decision": [
        { phrase: "make a decision", meaning: "做决定" },
        { phrase: "reach a decision", meaning: "做出决定" },
        { phrase: "a tough decision", meaning: "艰难的决定" },
        { phrase: "a final decision", meaning: "最终决定" }
    ],
    "progress": [
        { phrase: "make progress", meaning: "取得进步" },
        { phrase: "significant progress", meaning: "重大进展" },
        { phrase: "in progress", meaning: "进行中" }
    ],
    "effort": [
        { phrase: "make an effort", meaning: "努力" },
        { phrase: "joint effort", meaning: "共同努力" },
        { phrase: "spare no effort", meaning: "不遗余力" }
    ],
    "attention": [
        { phrase: "pay attention to", meaning: "注意" },
        { phrase: "draw attention to", meaning: "引起对…的注意" },
        { phrase: "attract attention", meaning: "吸引注意" }
    ],
    "role": [
        { phrase: "play a role in", meaning: "在…中起作用" },
        { phrase: "play an important role", meaning: "起重要作用" },
        { phrase: "a key role", meaning: "关键角色" }
    ],
    "risk": [
        { phrase: "take a risk", meaning: "冒险" },
        { phrase: "pose a risk", meaning: "构成风险" },
        { phrase: "at risk", meaning: "处于危险中" },
        { phrase: "reduce the risk", meaning: "降低风险" }
    ],
    "advantage": [
        { phrase: "take advantage of", meaning: "利用" },
        { phrase: "have an advantage", meaning: "有优势" },
        { phrase: "competitive advantage", meaning: "竞争优势" }
    ],
    "impact": [
        { phrase: "have an impact on", meaning: "对…有影响" },
        { phrase: "significant impact", meaning: "重大影响" },
        { phrase: "environmental impact", meaning: "环境影响" }
    ],
    "conclusion": [
        { phrase: "draw a conclusion", meaning: "得出结论" },
        { phrase: "reach a conclusion", meaning: "得出结论" },
        { phrase: "in conclusion", meaning: "总之" }
    ],
    "agreement": [
        { phrase: "reach an agreement", meaning: "达成协议" },
        { phrase: "come to an agreement", meaning: "达成一致" },
        { phrase: "in agreement with", meaning: "与…一致" }
    ],
    "emphasis": [
        { phrase: "put emphasis on", meaning: "强调" },
        { phrase: "place emphasis on", meaning: "把重点放在" },
        { phrase: "particular emphasis", meaning: "特别强调" }
    ],
    "challenge": [
        { phrase: "face a challenge", meaning: "面对挑战" },
        { phrase: "pose a challenge", meaning: "构成挑战" },
        { phrase: "meet the challenge", meaning: "迎接挑战" }
    ],
    "measure": [
        { phrase: "take measures", meaning: "采取措施" },
        { phrase: "safety measures", meaning: "安全措施" },
        { phrase: "preventive measures", meaning: "预防措施" }
    ],
    "evidence": [
        { phrase: "provide evidence", meaning: "提供证据" },
        { phrase: "scientific evidence", meaning: "科学证据" },
        { phrase: "in evidence", meaning: "明显的；显而易见的" }
    ],
    "balance": [
        { phrase: "keep a balance", meaning: "保持平衡" },
        { phrase: "strike a balance", meaning: "找到平衡" },
        { phrase: "work-life balance", meaning: "工作生活平衡" }
    ],
    "responsibility": [
        { phrase: "take responsibility", meaning: "承担责任" },
        { phrase: "bear responsibility", meaning: "负责任" },
        { phrase: "social responsibility", meaning: "社会责任" }
    ],
    "solution": [
        { phrase: "find a solution", meaning: "找到解决方案" },
        { phrase: "come up with a solution", meaning: "想出解决方案" }
    ],
    "issue": [
        { phrase: "address an issue", meaning: "处理问题" },
        { phrase: "raise an issue", meaning: "提出问题" },
        { phrase: "a key issue", meaning: "关键问题" }
    ],
    "research": [
        { phrase: "carry out research", meaning: "开展研究" },
        { phrase: "conduct research", meaning: "进行研究" },
        { phrase: "scientific research", meaning: "科学研究" }
    ],
    "awareness": [
        { phrase: "raise awareness", meaning: "提高意识" },
        { phrase: "increase awareness", meaning: "增强意识" },
        { phrase: "public awareness", meaning: "公众意识" }
    ],
    "threat": [
        { phrase: "pose a threat to", meaning: "对…构成威胁" },
        { phrase: "under threat", meaning: "受到威胁" }
    ],

    // === 常用搭配 ===
    "achieve": [
        { phrase: "achieve a goal", meaning: "实现目标" },
        { phrase: "achieve success", meaning: "取得成功" },
        { phrase: "achieve a balance", meaning: "达到平衡" }
    ],
    "provide": [
        { phrase: "provide evidence", meaning: "提供证据" },
        { phrase: "provide support", meaning: "提供支持" },
        { phrase: "provide information", meaning: "提供信息" },
        { phrase: "provide a basis for", meaning: "为…提供基础" }
    ],
    "develop": [
        { phrase: "develop a strategy", meaning: "制定策略" },
        { phrase: "develop skills", meaning: "培养技能" },
        { phrase: "develop an understanding", meaning: "加深理解" }
    ],
    "establish": [
        { phrase: "establish a relationship", meaning: "建立关系" },
        { phrase: "establish standards", meaning: "建立标准" },
        { phrase: "establish a foundation", meaning: "奠定基础" }
    ],
    "maintain": [
        { phrase: "maintain a balance", meaning: "保持平衡" },
        { phrase: "maintain standards", meaning: "维持标准" },
        { phrase: "maintain contact", meaning: "保持联系" }
    ],
    "enhance": [
        { phrase: "enhance the quality of", meaning: "提高…的质量" },
        { phrase: "enhance efficiency", meaning: "提高效率" },
        { phrase: "enhance understanding", meaning: "增进理解" }
    ],
    "promote": [
        { phrase: "promote development", meaning: "促进发展" },
        { phrase: "promote cooperation", meaning: "促进合作" },
        { phrase: "promote understanding", meaning: "促进理解" }
    ],
    "adopt": [
        { phrase: "adopt a policy", meaning: "采取政策" },
        { phrase: "adopt an approach", meaning: "采用方法" },
        { phrase: "adopt measures", meaning: "采取措施" }
    ],
    "implement": [
        { phrase: "implement a plan", meaning: "执行计划" },
        { phrase: "implement policies", meaning: "实施政策" },
        { phrase: "implement measures", meaning: "落实措施" }
    ],
    "gain": [
        { phrase: "gain experience", meaning: "获得经验" },
        { phrase: "gain knowledge", meaning: "获取知识" },
        { phrase: "gain an advantage", meaning: "获得优势" }
    ],
    "overcome": [
        { phrase: "overcome difficulties", meaning: "克服困难" },
        { phrase: "overcome obstacles", meaning: "克服障碍" },
        { phrase: "overcome challenges", meaning: "克服挑战" }
    ],
    "resolve": [
        { phrase: "resolve a problem", meaning: "解决问题" },
        { phrase: "resolve conflicts", meaning: "解决冲突" },
        { phrase: "resolve disputes", meaning: "解决争端" }
    ],
    "undertake": [
        { phrase: "undertake research", meaning: "从事研究" },
        { phrase: "undertake a task", meaning: "承担任务" },
        { phrase: "undertake measures", meaning: "采取措施" }
    ],
    "exercise": [
        { phrase: "exercise caution", meaning: "谨慎行事" },
        { phrase: "exercise control", meaning: "行使控制权" },
        { phrase: "exercise authority", meaning: "行使权力" }
    ],
    "impose": [
        { phrase: "impose restrictions", meaning: "施加限制" },
        { phrase: "impose a burden on", meaning: "给…增加负担" },
        { phrase: "impose a fine", meaning: "处以罚款" }
    ],
    "yield": [
        { phrase: "yield results", meaning: "产生结果" },
        { phrase: "yield benefits", meaning: "产生效益" },
        { phrase: "yield insights", meaning: "带来洞见" }
    ],
    "shed": [
        { phrase: "shed light on", meaning: "阐明；揭示" },
        { phrase: "shed tears", meaning: "流泪" }
    ],
    "bridge": [
        { phrase: "bridge the gap", meaning: "弥合差距" },
        { phrase: "bridge the divide", meaning: "消除分歧" }
    ],
    "foster": [
        { phrase: "foster understanding", meaning: "促进理解" },
        { phrase: "foster cooperation", meaning: "促进合作" },
        { phrase: "foster development", meaning: "促进发展" }
    ],
    "undermine": [
        { phrase: "undermine confidence", meaning: "削弱信心" },
        { phrase: "undermine authority", meaning: "削弱权威" },
        { phrase: "undermine efforts", meaning: "破坏努力" }
    ]
};

// 查询短语
function lookupPhrases(word) {
    const lower = word.toLowerCase();
    return PHRASES_MAP[lower] || PHRASES_MAP[word] || null;
}
