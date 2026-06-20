// ============================================
// 源来如此 — 单词源义释义库
// 每个单词提炼其所有义项背后的统一源义
// ============================================

const ESSENCE_DATA = {

    "spring": {
        essence: "从静止/隐藏状态中突然涌现、爆发或弹起",
        think: "无论是人跳起、泉水涌出、弹簧弹开，还是春天万物复苏——核心意象都是「从静止到活跃的瞬间迸发」",
        meanings: [
            { zh: "跳跃", en: "to leap or jump suddenly", eg: "He sprang to his feet when the bell rang.", egZh: "铃一响，他猛地跳了起来。" },
            { zh: "弹簧", en: "a coiled device that bounces back", eg: "The old sofa's springs are worn out.", egZh: "旧沙发的弹簧已经坏了。" },
            { zh: "泉水", en: "water welling up from underground", eg: "A crystal spring bubbled among the rocks.", egZh: "一股清澈的泉水在岩石间汩汩涌出。" },
            { zh: "起源/源头", en: "the source or origin of something", eg: "Curiosity is the spring of all discovery.", egZh: "好奇心是一切发现的源泉。" },
            { zh: "春天", en: "the season of renewal and growth", eg: "Cherry blossoms bloom every spring.", egZh: "每年春天樱花盛开。" }
        ]
    },

    "run": {
        essence: "持续、流畅地向前推进或运转",
        think: "人跑步、机器运转、水流淌、企业运营——万变不离「持续向前运动」这一核心",
        meanings: [
            { zh: "奔跑", en: "to move quickly on foot", eg: "She runs five miles every morning.", egZh: "她每天早上跑五英里。" },
            { zh: "经营/运转", en: "to operate or manage", eg: "He runs a small bookstore in town.", egZh: "他在镇上经营一家小书店。" },
            { zh: "流淌", en: "to flow as a liquid", eg: "Tears ran down her cheeks.", egZh: "泪水顺着她的脸颊流下。" },
            { zh: "持续进行", en: "to continue over time", eg: "The contract runs for three years.", egZh: "合同持续三年。" },
            { zh: "竞选", en: "to compete for office", eg: "She decided to run for mayor.", egZh: "她决定竞选市长。" }
        ]
    },

    "break": {
        essence: "从一个完整、连续的状态中分离、中断或超越",
        think: "打碎杯子、工作间隙、打破纪录、分手——源义都是「完整状态被切断或超越」",
        meanings: [
            { zh: "打破/折断", en: "to separate into pieces", eg: "The vase fell and broke into pieces.", egZh: "花瓶掉下来摔成了碎片。" },
            { zh: "休息/间歇", en: "a pause or interruption", eg: "Let's take a coffee break.", egZh: "我们来休息一下，喝杯咖啡。" },
            { zh: "打破(纪录)", en: "to surpass a previous limit", eg: "She broke the world record.", egZh: "她打破了世界纪录。" },
            { zh: "分手/决裂", en: "to end a relationship", eg: "They broke up after five years.", egZh: "他们五年后分手了。" },
            { zh: "破晓", en: "dawn — light breaking through darkness", eg: "Day broke over the mountains.", egZh: "山间破晓了。" }
        ]
    },

    "set": {
        essence: "将某物置于一个确定、固定的状态或位置",
        think: "摆桌子、太阳落山、一套东西、设定目标——共性是「安置到确定状态」",
        meanings: [
            { zh: "放置/摆设", en: "to put in a specific place", eg: "She set the vase on the table.", egZh: "她把花瓶放在桌上。" },
            { zh: "落下(日/月)", en: "to go below the horizon", eg: "The sun sets in the west.", egZh: "太阳从西边落下。" },
            { zh: "一套/一组", en: "a collection of related items", eg: "I bought a set of tools.", egZh: "我买了一套工具。" },
            { zh: "设定/确定", en: "to establish or fix", eg: "They set a date for the wedding.", egZh: "他们确定了婚礼日期。" },
            { zh: "凝固/定型", en: "to become solid or fixed", eg: "The concrete will set overnight.", egZh: "混凝土一夜之间就会凝固。" }
        ]
    },

    "point": {
        essence: "指向、聚焦于某个精确的目标或时刻",
        think: "指尖、要点、时刻、小数点——都是「精准指向某处」",
        meanings: [
            { zh: "指向", en: "to direct toward something", eg: "She pointed at the sign.", egZh: "她指向那个标志。" },
            { zh: "要点/意义", en: "the main idea or purpose", eg: "What's your point?", egZh: "你的重点是什么？" },
            { zh: "时刻/节点", en: "a specific moment in time", eg: "At that point, I gave up.", egZh: "在那一刻，我放弃了。" },
            { zh: "分数/小数点", en: "a unit of scoring or decimal", eg: "We won by three points.", egZh: "我们赢了三分。" },
            { zh: "尖端", en: "the sharp end of something", eg: "The pencil point is broken.", egZh: "铅笔尖断了。" }
        ]
    },

    "light": {
        essence: "使事物变得可见、可感知或减轻负担",
        think: "灯光照亮、点着火、重量轻、浅颜色——都是「消除黑暗/沉重」",
        meanings: [
            { zh: "光/灯光", en: "illumination that makes things visible", eg: "The light was too dim to read.", egZh: "光线太暗，看不了书。" },
            { zh: "点燃", en: "to ignite or start burning", eg: "He lit a match in the dark.", egZh: "他在黑暗中划了一根火柴。" },
            { zh: "轻的", en: "not heavy; easy to lift", eg: "This bag is surprisingly light.", egZh: "这个包出奇地轻。" },
            { zh: "浅色的", en: "pale in color", eg: "She wore a light blue dress.", egZh: "她穿了一条浅蓝色的裙子。" },
            { zh: "轻松的/少量的", en: "not intense or serious", eg: "We had a light lunch.", egZh: "我们吃了一顿简单的午餐。" }
        ]
    },

    "bear": {
        essence: "承受重量、压力或责任，并将其支撑下去",
        think: "负重、忍受、结果实、熊——都是「承载/支撑」的力量",
        meanings: [
            { zh: "承受/忍受", en: "to endure or tolerate", eg: "I can't bear the pain.", egZh: "我无法忍受这种痛苦。" },
            { zh: "承载/支撑", en: "to support weight", eg: "The ice can't bear your weight.", egZh: "冰面承载不了你的重量。" },
            { zh: "结果实", en: "to produce fruit or results", eg: "The tree bears apples every autumn.", egZh: "这棵树每年秋天结苹果。" },
            { zh: "熊", en: "a large heavy mammal", eg: "A brown bear crossed the river.", egZh: "一只棕熊穿过了河流。" },
            { zh: "怀有(感情)", en: "to carry a feeling within", eg: "She bears no resentment.", egZh: "她心中不怀怨恨。" }
        ]
    },

    "strike": {
        essence: "突然、有力地打击或冲击，改变原有状态",
        think: "闪电劈下、罢工抗议、钟声敲响、灵感闪现——都是「猛然一击」",
        meanings: [
            { zh: "打击/碰撞", en: "to hit forcefully", eg: "The ball struck the window.", egZh: "球砸中了窗户。" },
            { zh: "罢工", en: "to refuse to work as protest", eg: "The workers went on strike.", egZh: "工人们罢工了。" },
            { zh: "突然想到", en: "an idea that suddenly occurs", eg: "A thought struck me.", egZh: "我突然想到一个念头。" },
            { zh: "敲响(钟)", en: "to sound by being hit", eg: "The clock struck midnight.", egZh: "钟敲响了午夜十二点。" },
            { zh: "划(火柴)", en: "to ignite by friction", eg: "He struck a match to light the candle.", egZh: "他划了根火柴点燃蜡烛。" }
        ]
    },

    "clear": {
        essence: "去除障碍、杂质或疑惑，使事物变得通透、明确",
        think: "天晴、收拾桌子、解释清楚、洗清罪名——核心是「扫除阻碍→变得通透」",
        meanings: [
            { zh: "晴朗的/清澈的", en: "free from clouds or impurities", eg: "The sky is clear today.", egZh: "今天天空晴朗。" },
            { zh: "清理/清除", en: "to remove unwanted items", eg: "Please clear the table.", egZh: "请把桌子收拾干净。" },
            { zh: "清楚的/明白的", en: "easy to understand", eg: "Is my explanation clear?", egZh: "我的解释清楚吗？" },
            { zh: "洗清(嫌疑)", en: "to prove innocence", eg: "He was cleared of all charges.", egZh: "他被洗清了所有指控。" },
            { zh: "越过/穿过", en: "to pass over without touching", eg: "The horse cleared the fence.", egZh: "那匹马越过了栅栏。" }
        ]
    },

    "hold": {
        essence: "用手、力量或状态将事物保持在某个位置不使其变化",
        think: "握住手、开会、屏住呼吸、货舱——统一是「保持/维持」",
        meanings: [
            { zh: "握住/拿着", en: "to grasp or carry", eg: "She held the baby gently.", egZh: "她轻轻抱着婴儿。" },
            { zh: "容纳/装下", en: "to contain or have capacity", eg: "The room holds 200 people.", egZh: "这个房间能容纳200人。" },
            { zh: "举行(会议)", en: "to organize an event", eg: "We hold a meeting every Monday.", egZh: "我们每周一开会。" },
            { zh: "保持/维持", en: "to remain in a state", eg: "Hold your breath!", egZh: "屏住呼吸！" },
            { zh: "货舱/底舱", en: "a storage area on a ship", eg: "The cargo was stored in the hold.", egZh: "货物存放在货舱里。" }
        ]
    },

    "charge": {
        essence: "赋予能量、责任或价值，使其具备行动的推力",
        think: "充电、负责、收费、冲锋——都是「注入能量/责任→产生行动」",
        meanings: [
            { zh: "充电", en: "to supply with electrical energy", eg: "I need to charge my phone.", egZh: "我需要给手机充电。" },
            { zh: "负责/掌管", en: "to take control or responsibility", eg: "She is in charge of the project.", egZh: "她负责这个项目。" },
            { zh: "收费", en: "to ask for payment", eg: "They charge $10 for delivery.", egZh: "他们收10美元运费。" },
            { zh: "冲锋/猛冲", en: "to rush forward", eg: "The soldiers charged into battle.", egZh: "士兵们冲入战场。" },
            { zh: "指控/控告", en: "to formally accuse", eg: "He was charged with theft.", egZh: "他被指控盗窃。" }
        ]
    },

    "draw": {
        essence: "通过牵引或吸引，将某物从一处引向另一处",
        think: "画画、抽水、吸引注意、得出结论——最底层都是「拉/引出」",
        meanings: [
            { zh: "画/描绘", en: "to make a picture with lines", eg: "She drew a beautiful landscape.", egZh: "她画了一幅美丽的风景。" },
            { zh: "拉/拖", en: "to pull or drag", eg: "He drew the curtains closed.", egZh: "他拉上了窗帘。" },
            { zh: "吸引", en: "to attract attention or interest", eg: "The performance drew a large crowd.", egZh: "演出吸引了大批观众。" },
            { zh: "提取/抽取", en: "to take out from a source", eg: "She drew water from the well.", egZh: "她从井里打水。" },
            { zh: "得出(结论)", en: "to reach a conclusion", eg: "What can we draw from this?", egZh: "我们能从中得出什么结论？" }
        ]
    },

    "stand": {
        essence: "在压力或变化中保持直立、不变、不退让",
        think: "站立、忍受、立场、看台——统一意象是「不倒、不退」",
        meanings: [
            { zh: "站立", en: "to be on one's feet", eg: "She stood by the window.", egZh: "她站在窗边。" },
            { zh: "忍受", en: "to tolerate or endure", eg: "I can't stand the noise.", egZh: "我受不了这种噪音。" },
            { zh: "立场/态度", en: "a firm position or opinion", eg: "What's your stand on this issue?", egZh: "你对这个问题的立场是什么？" },
            { zh: "看台/摊位", en: "a raised structure for spectators", eg: "We sat in the stands.", egZh: "我们坐在看台上。" },
            { zh: "保持不变", en: "to remain in effect", eg: "The offer still stands.", egZh: "这个提议仍然有效。" }
        ]
    },

    "fall": {
        essence: "从高处、稳定状态或清醒状态向下坠落或陷入",
        think: "摔落、坠入爱河、睡着、瀑布——都是「向下/向内的沉降」",
        meanings: [
            { zh: "落下/跌倒", en: "to drop downward", eg: "Leaves fall in autumn.", egZh: "秋天叶子落下。" },
            { zh: "陷入(状态)", en: "to enter a new state", eg: "She fell in love at first sight.", egZh: "她一见钟情。" },
            { zh: "睡着", en: "to go to sleep", eg: "He fell asleep immediately.", egZh: "他立刻就睡着了。" },
            { zh: "瀑布", en: "a waterfall", eg: "Niagara Falls is magnificent.", egZh: "尼亚加拉瀑布非常壮观。" },
            { zh: "下降/减少", en: "to decrease in amount", eg: "Prices fell sharply.", egZh: "价格大幅下跌。" }
        ]
    },

    "fair": {
        essence: "符合某种标准——公平的正义，或视觉上的美好悦目",
        think: "公平裁判、集市交易、好天气、白皙皮肤——暗线是「符合期待的标准」",
        meanings: [
            { zh: "公平的", en: "just and impartial", eg: "That's not fair!", egZh: "那不公平！" },
            { zh: "集市/展览会", en: "a gathering for trade or entertainment", eg: "We visited the county fair.", egZh: "我们去了县里的集市。" },
            { zh: "晴朗的(天气)", en: "pleasant and clear weather", eg: "Fair weather is forecast for tomorrow.", egZh: "预报明天天气晴好。" },
            { zh: "白皙的(皮肤)", en: "light in complexion", eg: "She has fair skin and blue eyes.", egZh: "她有白皙的皮肤和蓝眼睛。" },
            { zh: "相当好的", en: "moderately good", eg: "She has a fair chance of winning.", egZh: "她有相当好的获胜机会。" }
        ]
    },

    "pass": {
        essence: "从一处经过另一处，或从一人传给另一人",
        think: "路过、传递、通过考试、山隘——共同的是「穿过/转移」",
        meanings: [
            { zh: "经过/路过", en: "to go past something", eg: "I pass the library every day.", egZh: "我每天经过图书馆。" },
            { zh: "传递/递给", en: "to hand over; to transfer", eg: "Could you pass the salt?", egZh: "你能把盐递过来吗？" },
            { zh: "通过(考试)", en: "to succeed in a test", eg: "She passed the exam with flying colors.", egZh: "她以优异成绩通过了考试。" },
            { zh: "山隘/关口", en: "a narrow route through mountains", eg: "The army marched through the mountain pass.", egZh: "军队穿过了山隘。" },
            { zh: "消逝/过去", en: "to go by (time)", eg: "Time passes quickly.", egZh: "时间过得飞快。" }
        ]
    },

    "raise": {
        essence: "使某物从低处向高处移动，无论物理、数量还是精神层面",
        think: "举手、养孩子、筹钱、提问题——核心是「往上提升」",
        meanings: [
            { zh: "举起/抬起", en: "to lift to a higher position", eg: "Raise your hand if you know the answer.", egZh: "知道答案的请举手。" },
            { zh: "抚养/养育", en: "to bring up children", eg: "She raised three children alone.", egZh: "她独自抚养了三个孩子。" },
            { zh: "筹集(资金)", en: "to collect money for a purpose", eg: "They raised $10,000 for charity.", egZh: "他们为慈善筹了一万美元。" },
            { zh: "提出(问题)", en: "to bring up a topic", eg: "He raised an important question.", egZh: "他提出了一个重要问题。" },
            { zh: "提高/增加", en: "to increase in amount or level", eg: "The company raised salaries by 5%.", egZh: "公司把工资提高了5%。" }
        ]
    },

    "mark": {
        essence: "在某物上留下可见的痕迹或标识，使其区别于他者",
        think: "做记号、标志性事件、分数、马克——源义都是「留下印记」",
        meanings: [
            { zh: "标记/记号", en: "a visible impression or sign", eg: "He left a mark on the wall.", egZh: "他在墙上留下了一个印记。" },
            { zh: "标志/象征", en: "a sign of something significant", eg: "This day marks a new beginning.", egZh: "这一天标志着一个新的开始。" },
            { zh: "分数/成绩", en: "a grade or score", eg: "She got full marks in math.", egZh: "她数学得了满分。" },
            { zh: "注意/留心", en: "to pay attention to", eg: "Mark my words — he'll succeed.", egZh: "记住我的话——他会成功的。" },
            { zh: "马克(货币)", en: "former German currency", eg: "The Deutsche Mark was replaced by the euro.", egZh: "德国马克被欧元取代了。" }
        ]
    },

    "note": {
        essence: "将值得关注的信息提取、记录并保留下来",
        think: "记笔记、音符、钞票、注意——都是「被标记的重要信息」",
        meanings: [
            { zh: "笔记/记录", en: "a written record of information", eg: "She took careful notes during the lecture.", egZh: "她在讲座中认真做了笔记。" },
            { zh: "音符", en: "a musical sound of a specific pitch", eg: "The first note of the song is C.", egZh: "这首歌的第一个音符是C。" },
            { zh: "钞票", en: "paper money", eg: "He paid with a ten-pound note.", egZh: "他用一张十英镑的钞票付款。" },
            { zh: "注意/留意", en: "to observe carefully", eg: "Note the difference between the two.", egZh: "注意两者之间的区别。" },
            { zh: "便条/短信", en: "a short informal message", eg: "She left a note on the fridge.", egZh: "她在冰箱上留了一张便条。" }
        ]
    },

    "head": {
        essence: "处于最前端、最上方或统领全局的位置",
        think: "头、领导、朝某方向走、河源头——都是「顶端/前端」",
        meanings: [
            { zh: "头/头部", en: "the top part of the body", eg: "She nodded her head.", egZh: "她点了点头。" },
            { zh: "领导/负责人", en: "the person in charge", eg: "He is the head of the department.", egZh: "他是部门负责人。" },
            { zh: "朝…走去", en: "to move toward a direction", eg: "Let's head home.", egZh: "我们回家吧。" },
            { zh: "顶端/前端", en: "the top or front part", eg: "I sat at the head of the table.", egZh: "我坐在桌子的上首。" },
            { zh: "(河)源头", en: "the source of a river", eg: "They explored the head of the Nile.", egZh: "他们探索了尼罗河的源头。" }
        ]
    },

    "cross": {
        essence: "从一边穿过到另一边，或使两条线相交",
        think: "过马路、十字架、交叉、混种——共性是「穿越/交汇」",
        meanings: [
            { zh: "穿过/越过", en: "to go from one side to another", eg: "Look both ways before you cross the street.", egZh: "过马路前要先看两边。" },
            { zh: "十字架", en: "a symbol of Christianity", eg: "She wore a silver cross.", egZh: "她戴着一个银色的十字架。" },
            { zh: "交叉/相交", en: "to intersect", eg: "The two roads cross near the church.", egZh: "两条路在教堂附近交叉。" },
            { zh: "生气的", en: "annoyed or angry", eg: "He was cross about being kept waiting.", egZh: "他因久等而生气了。" },
            { zh: "杂交/混种", en: "to mix breeds or types", eg: "They crossed a horse with a donkey.", egZh: "他们让马和驴杂交。" }
        ]
    },

    "figure": {
        essence: "某个形状、数字或人物，即从背景中辨认出的「轮廓」",
        think: "人影、数字、算出、人物——外延虽广，核心是「可识别的轮廓/形状」",
        meanings: [
            { zh: "数字", en: "a number or amount", eg: "The final figure was surprising.", egZh: "最终的数字令人惊讶。" },
            { zh: "人影/身影", en: "the shape of a person", eg: "A dark figure appeared in the doorway.", egZh: "一个黑影出现在门口。" },
            { zh: "人物/重要角色", en: "an important person", eg: "He is a key figure in politics.", egZh: "他是政界的重要人物。" },
            { zh: "算出/想出", en: "to calculate or understand", eg: "I can't figure out this problem.", egZh: "我弄不明白这个问题。" },
            { zh: "图表/图形", en: "a diagram or illustration", eg: "See Figure 3 for details.", egZh: "详情见图3。" }
        ]
    },

    "sharp": {
        essence: "边缘锋利、变化陡峭、感官敏锐——「高精度、强对比」",
        think: "锋利的刀、急剧的转弯、敏锐的头脑、刺耳的声音——都带有「锐利感」",
        meanings: [
            { zh: "锋利的", en: "having a fine cutting edge", eg: "Be careful — the knife is sharp.", egZh: "小心——这把刀很锋利。" },
            { zh: "急剧的/陡峭的", en: "sudden and steep", eg: "There's a sharp turn ahead.", egZh: "前方有一个急转弯。" },
            { zh: "敏锐的", en: "quick to notice things", eg: "She has a sharp mind.", egZh: "她头脑敏锐。" },
            { zh: "刺耳的/尖的", en: "piercing in sound", eg: "A sharp cry broke the silence.", egZh: "一声尖叫打破了寂静。" },
            { zh: "准点(时间)", en: "exactly at a stated time", eg: "The meeting starts at 3:00 sharp.", egZh: "会议三点整开始。" }
        ]
    },

    "soft": {
        essence: "质感柔软、力度温和、颜色柔和——「低硬度、低对抗」",
        think: "软枕头、轻声说话、软饮料、柔光——源义是「不硬的、温和的」",
        meanings: [
            { zh: "柔软的", en: "not hard; yielding to touch", eg: "The cat has soft fur.", egZh: "这只猫有柔软的毛。" },
            { zh: "轻柔的/温和的", en: "gentle; not forceful", eg: "She spoke in a soft voice.", egZh: "她用轻柔的声音说话。" },
            { zh: "软饮料(无酒精)", en: "a non-alcoholic drink", eg: "Would you like a soft drink?", egZh: "你要来杯软饮料吗？" },
            { zh: "柔和的(光/色)", en: "not bright or harsh", eg: "The room was lit by soft candlelight.", egZh: "房间被柔和的烛光照亮。" },
            { zh: "心软的/宽容的", en: "kind and sympathetic", eg: "He has a soft heart for children.", egZh: "他对孩子们心软。" }
        ]
    },

    "move": {
        essence: "改变位置、状态或情绪——「从A到B的转移」",
        think: "搬东西、搬家、感动、行动——不论物理还是心理，都是「动起来」",
        meanings: [
            { zh: "移动/搬动", en: "to change position", eg: "Help me move this table.", egZh: "帮我搬一下这张桌子。" },
            { zh: "搬家/迁移", en: "to change residence", eg: "We moved to a new city.", egZh: "我们搬到了一个新城市。" },
            { zh: "感动/打动", en: "to affect emotionally", eg: "The story moved me to tears.", egZh: "这个故事让我感动落泪。" },
            { zh: "行动/采取行动", en: "to take action", eg: "It's time to move on this issue.", egZh: "是时候在这个问题上采取行动了。" },
            { zh: "走棋", en: "a turn in a board game", eg: "It's your move.", egZh: "该你走棋了。" }
        ]
    },

    "open": {
        essence: "打破封闭状态，使事物可进入、可获取、可开始",
        think: "开门、开放、坦诚、开业——核心是「从封闭到敞开」",
        meanings: [
            { zh: "打开/开启", en: "to move from closed position", eg: "Could you open the window?", egZh: "你能把窗户打开吗？" },
            { zh: "开放的/公开的", en: "accessible to all", eg: "The park is open to the public.", egZh: "公园对公众开放。" },
            { zh: "坦诚的/坦率的", en: "honest and not hiding anything", eg: "Let's have an open discussion.", egZh: "让我们坦诚地讨论一下。" },
            { zh: "开业/开幕", en: "to start business or an event", eg: "The new store opens next week.", egZh: "新店下周开业。" },
            { zh: "开阔的/空旷的", en: "spacious and unenclosed", eg: "They walked across open fields.", egZh: "他们走过开阔的田野。" }
        ]
    }
};

// ==================== 源义数据辅助函数 ====================

// 获取某个单词的源义数据
function getEssence(word) {
    return ESSENCE_DATA[word.toLowerCase()] || null;
}

// 获取所有有源义释义的单词列表
function getAllEssenceWords() {
    return Object.keys(ESSENCE_DATA);
}

// 获取赞踩数据（持久化到 localStorage）
function getVotes(word) {
    try {
        const raw = localStorage.getItem('yinyu_essence_votes');
        const all = raw ? JSON.parse(raw) : {};
        return all[word] || { up: 0, down: 0 };
    } catch { return { up: 0, down: 0 }; }
}

function saveVotes(word, up, down) {
    try {
        const raw = localStorage.getItem('yinyu_essence_votes');
        const all = raw ? JSON.parse(raw) : {};
        all[word] = { up, down };
        localStorage.setItem('yinyu_essence_votes', JSON.stringify(all));
    } catch { /* ignore */ }
}

function upvoteEssence(word) {
    const v = getVotes(word);
    v.up++;
    saveVotes(word, v.up, v.down);
    return v;
}

function downvoteEssence(word) {
    const v = getVotes(word);
    v.down++;
    saveVotes(word, v.up, v.down);
    return v;
}
