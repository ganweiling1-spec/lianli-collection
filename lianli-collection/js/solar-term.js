// ============================================================
// 无色笺 — Solar Term System (节气系统)
// ============================================================

/**
 * 24 solar terms with dates for 2025 (乙巳年) and 2026 (丙午年).
 * Dates are approximate (±1 day); based on Purple Mountain Observatory.
 */
const SOLAR_TERM_DATES = {
    2025: [
        { name: '小寒', date: '2025-01-05', season: 'winter' },
        { name: '大寒', date: '2025-01-20', season: 'winter' },
        { name: '立春', date: '2025-02-03', season: 'spring' },
        { name: '雨水', date: '2025-02-18', season: 'spring' },
        { name: '惊蛰', date: '2025-03-05', season: 'spring' },
        { name: '春分', date: '2025-03-20', season: 'spring' },
        { name: '清明', date: '2025-04-04', season: 'spring' },
        { name: '谷雨', date: '2025-04-20', season: 'spring' },
        { name: '立夏', date: '2025-05-05', season: 'summer' },
        { name: '小满', date: '2025-05-21', season: 'summer' },
        { name: '芒种', date: '2025-06-05', season: 'summer' },
        { name: '夏至', date: '2025-06-21', season: 'summer' },
        { name: '小暑', date: '2025-07-07', season: 'summer' },
        { name: '大暑', date: '2025-07-22', season: 'summer' },
        { name: '立秋', date: '2025-08-07', season: 'autumn' },
        { name: '处暑', date: '2025-08-23', season: 'autumn' },
        { name: '白露', date: '2025-09-07', season: 'autumn' },
        { name: '秋分', date: '2025-09-23', season: 'autumn' },
        { name: '寒露', date: '2025-10-08', season: 'autumn' },
        { name: '霜降', date: '2025-10-23', season: 'autumn' },
        { name: '立冬', date: '2025-11-07', season: 'winter' },
        { name: '小雪', date: '2025-11-22', season: 'winter' },
        { name: '大雪', date: '2025-12-07', season: 'winter' },
        { name: '冬至', date: '2025-12-21', season: 'winter' },
    ],
    2026: [
        { name: '小寒', date: '2026-01-05', season: 'winter' },
        { name: '大寒', date: '2026-01-20', season: 'winter' },
        { name: '立春', date: '2026-02-04', season: 'spring' },
        { name: '雨水', date: '2026-02-18', season: 'spring' },
        { name: '惊蛰', date: '2026-03-05', season: 'spring' },
        { name: '春分', date: '2026-03-20', season: 'spring' },
        { name: '清明', date: '2026-04-05', season: 'spring' },
        { name: '谷雨', date: '2026-04-20', season: 'spring' },
        { name: '立夏', date: '2026-05-05', season: 'summer' },
        { name: '小满', date: '2026-05-21', season: 'summer' },
        { name: '芒种', date: '2026-06-05', season: 'summer' },
        { name: '夏至', date: '2026-06-21', season: 'summer' },
        { name: '小暑', date: '2026-07-07', season: 'summer' },
        { name: '大暑', date: '2026-07-22', season: 'summer' },
        { name: '立秋', date: '2026-08-07', season: 'autumn' },
        { name: '处暑', date: '2026-08-23', season: 'autumn' },
        { name: '白露', date: '2026-09-07', season: 'autumn' },
        { name: '秋分', date: '2026-09-23', season: 'autumn' },
        { name: '寒露', date: '2026-10-08', season: 'autumn' },
        { name: '霜降', date: '2026-10-23', season: 'autumn' },
        { name: '立冬', date: '2026-11-07', season: 'winter' },
        { name: '小雪', date: '2026-11-22', season: 'winter' },
        { name: '大雪', date: '2026-12-07', season: 'winter' },
        { name: '冬至', date: '2026-12-21', season: 'winter' },
    ],
};

/**
 * Classical poem snippets for each solar term.
 * Displayed as easter eggs on term days.
 */
const SOLAR_TERM_POEMS = {
    '立春': { poem: '律回岁晚冰霜少，春到人间草木知', source: '张栻《立春偶成》' },
    '雨水': { poem: '好雨知时节，当春乃发生',         source: '杜甫《春夜喜雨》' },
    '惊蛰': { poem: '微雨众卉新，一雷惊蛰始',         source: '韦应物《观田家》' },
    '春分': { poem: '春分雨脚落声微，柳岸斜风带客归', source: '徐铉《春分日》' },
    '清明': { poem: '清明时节雨纷纷，路上行人欲断魂', source: '杜牧《清明》' },
    '谷雨': { poem: '谷雨如丝复似尘，煮瓶浮蜡正尝新', source: '范成大《晚春田园杂兴》' },
    '立夏': { poem: '绿树阴浓夏日长，楼台倒影入池塘', source: '高骈《山亭夏日》' },
    '小满': { poem: '小满田塍寻草药，农闲莫问动三车', source: '吴藕汀《小满》' },
    '芒种': { poem: '时雨及芒种，四野皆插秧',         source: '陆游《时雨》' },
    '夏至': { poem: '昼晷已云极，宵漏自此长',         source: '韦应物《夏至避暑北池》' },
    '小暑': { poem: '倏忽温风至，因循小暑来',         source: '元稹《咏廿四气诗》' },
    '大暑': { poem: '赤日几时过，清风无处寻',         source: '曾几《大暑》' },
    '立秋': { poem: '乳鸦啼散玉屏空，一枕新凉一扇风', source: '刘翰《立秋》' },
    '处暑': { poem: '处暑无三日，新凉直万金',         source: '苏泂《长江二首》' },
    '白露': { poem: '露从今夜白，月是故乡明',         source: '杜甫《月夜忆舍弟》' },
    '秋分': { poem: '秋分客尚在，竹露夕微微',         source: '杜甫《晚晴》' },
    '寒露': { poem: '袅袅凉风动，凄凄寒露零',         source: '白居易《池上》' },
    '霜降': { poem: '霜降水返壑，风落木归山',         source: '白居易《岁晚》' },
    '立冬': { poem: '冻笔新诗懒写，寒炉美酒时温',     source: '李白《立冬》' },
    '小雪': { poem: '小雪晴沙不作泥，疏帘红日弄朝晖', source: '黄庭坚《春近四绝句》' },
    '大雪': { poem: '积阴成大雪，看处乱霏霏',         source: '元稹《咏廿四气诗》' },
    '冬至': { poem: '天时人事日相催，冬至阳生春又来', source: '杜甫《小至》' },
    '小寒': { poem: '小寒连大吕，欢鹊垒新巢',         source: '元稹《咏廿四气诗》' },
    '大寒': { poem: '大寒雪未消，闭户不能出',         source: '陆游《大寒》' },
};

/**
 * Find the most recent solar term on or before the given date.
 * @param {string|Date} dateInput
 * @returns {{ name: string, season: string, poem: string, poemSource: string } | null}
 */
export function findSolarTerm(dateInput) {
    const targetDate = new Date(dateInput);
    if (isNaN(targetDate.getTime())) return null;

    const targetYear = targetDate.getFullYear();
    let terms = SOLAR_TERM_DATES[targetYear];

    // Fallback to nearest year with data
    if (!terms) {
        const years = Object.keys(SOLAR_TERM_DATES).map(Number);
        const nearestYear = years.reduce((prev, curr) =>
            Math.abs(curr - targetYear) < Math.abs(prev - targetYear) ? curr : prev
        );
        terms = SOLAR_TERM_DATES[nearestYear];
    }

    let result = terms[0];
    for (const term of terms) {
        const termDate = new Date(term.date + 'T00:00:00+08:00');
        if (termDate <= targetDate) {
            result = term;
        } else {
            break;
        }
    }

    const poemData = SOLAR_TERM_POEMS[result.name] || { poem: '', source: '' };
    return {
        name: result.name,
        season: result.season,
        poem: poemData.poem,
        poemSource: poemData.source,
    };
}

/**
 * Check if today is a solar term day.
 * @returns {object | null} Solar term with poem if today matches, null otherwise.
 */
export function getTodaySolarTerm() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
    const year = today.getFullYear();
    const terms = SOLAR_TERM_DATES[year];
    if (!terms) return null;

    for (const term of terms) {
        if (term.date === todayStr) {
            const poemData = SOLAR_TERM_POEMS[term.name];
            return { ...term, poem: poemData?.poem || '', poemSource: poemData?.source || '' };
        }
    }
    return null;
}

/**
 * Generate a human-readable timestamp in "节气 + 时间" format.
 * e.g. "白露前三日，暮食于巷口面馆"
 * @param {string|Date} dateInput
 * @returns {string}
 */
export function formatSolarTermDate(dateInput) {
    const term = findSolarTerm(dateInput);
    if (!term) return '';

    const targetDate = new Date(dateInput);
    // Find the term date to calculate day offset
    const years = Object.keys(SOLAR_TERM_DATES).map(Number);
    let termDate = null;
    for (const year of years) {
        for (const t of SOLAR_TERM_DATES[year]) {
            if (t.name === term.name) {
                const d = new Date(t.date + 'T00:00:00+08:00');
                if (d <= targetDate) {
                    termDate = d;
                }
            }
        }
    }

    if (!termDate) return term.name;

    const diffDays = Math.floor((targetDate - termDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return term.name;
    if (diffDays <= 3) return `${term.name}前${diffDays}日`;
    if (diffDays <= 7) return `${term.name}后`;
    return `${term.name}过${diffDays}日`;
}

/**
 * Map season to a CSS class suffix.
 */
export function getSeasonClass(season) {
    const map = { spring: 'spring', summer: 'summer', autumn: 'autumn', winter: 'winter' };
    return map[season] || '';
}
