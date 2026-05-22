// ============================================================
// 无色笺 — Extra Features
//  - Anniversary countdown
//  - Random memory popup
//  - JSON export
//  - Night mode
//  - Love note generator
// ============================================================

import { appState } from './state.js';
import { showModal } from './modal.js';
import { escapeHTML } from './utils.js';

const ANNIVERSARY = new Date('2025-05-17');
const NIGHT_MODE_KEY = 'lianli_night_mode';
let nightModeActive = false;

/* ================================================================
   1. Anniversary Countdown
   ================================================================ */
export function initCountdown() {
    window.addEventListener('view-changed', (e) => {
        if (e.detail.view === 'main') {
            updateCountdown();
            // Update every hour
            setInterval(updateCountdown, 3600000);
        }
    });
}

function updateCountdown() {
    const bar = document.getElementById('countdown-bar');
    if (!bar) return;

    const now = new Date();
    // Calculate next anniversary
    let next = new Date(now.getFullYear(), 4, 17); // May 17
    if (now > next) {
        next = new Date(now.getFullYear() + 1, 4, 17);
    }
    const diffDays = Math.ceil((next - now) / (1000 * 60 * 60 * 24));
    const years = next.getFullYear() - 2025;

    if (diffDays === 0) {
        bar.innerHTML = `<span>今天是 ${years} 周年纪念日</span>`;
        bar.classList.add('countdown-today');
    } else {
        bar.innerHTML = `<span>距离 ${years} 周年纪念日还有 <strong>${diffDays}</strong> 天</span>`;
        bar.classList.remove('countdown-today');
    }
}

/* ================================================================
   2. Random Memory Popup
   ================================================================ */
let memoryTimer = null;

export function initRandomMemory() {
    window.addEventListener('view-changed', (e) => {
        if (e.detail.view === 'main') {
            // 15% chance to show a random memory after 5-15 seconds
            scheduleRandomMemory();
        } else {
            if (memoryTimer) clearTimeout(memoryTimer);
        }
    });
}

function scheduleRandomMemory() {
    if (memoryTimer) clearTimeout(memoryTimer);
    if (Math.random() > 0.15) return; // 15% chance

    const delay = 5000 + Math.random() * 10000;
    memoryTimer = setTimeout(showRandomMemory, delay);
}

function showRandomMemory() {
    const moments = appState.moments;
    if (!moments || moments.length === 0) return;

    const moment = moments[Math.floor(Math.random() * moments.length)];
    const imageUrl = moment.image_url
        ? `https://dstvhnsoxbltzloiwbqv.supabase.co/storage/v1/object/public/moments-images/${moment.image_url}`
        : null;

    const content = document.createElement('div');
    content.innerHTML = `
        <div style="text-align:center">
            ${imageUrl ? `<img src="${imageUrl}" style="width:100%;max-height:240px;object-fit:cover;border-radius:8px;margin-bottom:1rem" alt="">` : ''}
            <p style="font-family:var(--font-title);font-size:1.2rem;color:var(--text-primary);margin-bottom:0.5rem">那年今日</p>
            <p style="font-family:var(--font-body);font-size:1rem;color:var(--text-primary)">${escapeHTML(moment.title)}</p>
            ${moment.description ? `<p style="font-size:0.85rem;color:var(--text-secondary);margin-top:0.5rem">${escapeHTML(moment.description)}</p>` : ''}
            <p style="font-size:0.75rem;color:var(--text-muted);margin-top:0.8rem">${moment.recorded_date}</p>
        </div>
    `;

    showModal({
        title: '回忆浮现',
        content,
        buttons: [{ text: '收起', class: 'btn-ghost', callback: () => {} }],
    });
}

/* ================================================================
   3. JSON Export
   ================================================================ */
export function initExport() {
    // Long-press on opening poem or triple-tap on main view brand text
    const poemView = document.getElementById('opening-poem');
    if (poemView) {
        let pressTimer;
        poemView.addEventListener('touchstart', (e) => {
            pressTimer = setTimeout(() => exportAllData(), 2000);
        });
        poemView.addEventListener('touchend', () => clearTimeout(pressTimer));
        poemView.addEventListener('touchmove', () => clearTimeout(pressTimer));
    }

    // Also allow via keyboard shortcut: Ctrl+Shift+E
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'E') {
            e.preventDefault();
            exportAllData();
        }
    });
}

async function exportAllData() {
    const data = {
        version: '2.0',
        exported_at: new Date().toISOString(),
        moments: appState.moments,
        love_notes: appState.loveNotes,
        habits: appState.habits,
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `无色笺_备份_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showModal({
        title: '导出成功',
        content: '<p style="text-align:center;color:var(--text-secondary)">数据已保存为 JSON 文件，可用于备份或迁移。</p>',
        buttons: [{ text: '好的', class: 'btn-primary', callback: () => {} }],
    });
}

/* ================================================================
   4. Night Mode (暖黄灯模式)
   ================================================================ */
export function initNightMode() {
    // Check saved preference
    const saved = localStorage.getItem(NIGHT_MODE_KEY);
    if (saved === 'true') {
        nightModeActive = true;
        document.body.classList.add('night-mode');
    }

    // Add toggle button to main view
    window.addEventListener('view-changed', (e) => {
        if (e.detail.view === 'main') {
            ensureNightModeToggle();
        }
    });
}

function ensureNightModeToggle() {
    if (document.getElementById('night-mode-toggle')) return;

    const btn = document.createElement('button');
    btn.id = 'night-mode-toggle';
    btn.className = 'night-mode-toggle';
    btn.title = '夜间模式';
    btn.innerHTML = nightModeActive
        ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>'
        : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>';

    btn.addEventListener('click', toggleNightMode);
    document.getElementById('main-view').appendChild(btn);
}

function toggleNightMode() {
    nightModeActive = !nightModeActive;
    document.body.classList.toggle('night-mode', nightModeActive);
    localStorage.setItem(NIGHT_MODE_KEY, nightModeActive);

    const btn = document.getElementById('night-mode-toggle');
    if (btn) {
        btn.innerHTML = nightModeActive
            ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>'
            : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>';
    }
}

/* ================================================================
   5. Love Note Generator (情话生成器)
   ================================================================ */
const LOVE_TEMPLATES = [
    { speaker: 'her', content: '今晚月色真美，和你一起看就更美了。' },
    { speaker: 'him', content: '今天看到你笑的样子，就像是春天里第一缕阳光。' },
    { speaker: 'her', content: '你知道吗，每次和你聊天，我的嘴角都不自觉上扬。' },
    { speaker: 'him', content: '有你在身边，连最平凡的日子都变得值得纪念。' },
    { speaker: 'her', content: '世界上最温暖的地方，是你的怀抱。' },
    { speaker: 'him', content: '我想把所有的温柔都留给你一个人。' },
    { speaker: 'her', content: '遇见你，是我这辈子最幸运的事。' },
    { speaker: 'him', content: '你的名字只有两个字，却填满了我的心。' },
    { speaker: 'her', content: '今天的风很温柔，让我想起你吹过我耳边的话语。' },
    { speaker: 'him', content: '朝暮与年岁并往，然后与你行至天光。' },
    { speaker: 'her', content: '只要你在，每天都是好天气。' },
    { speaker: 'him', content: '我目光短浅，眼里只有你。' },
    { speaker: 'her', content: '你是年少的欢喜，也是余生的甜蜜。' },
    { speaker: 'him', content: '晓看天色暮看云，行也思君，坐也思君。' },
    { speaker: 'her', content: '三里清风三里路，步步清风步步你。' },
    { speaker: 'him', content: '既见君子，云胡不喜。' },
    { speaker: 'her', content: '君可知，我心如月，朝朝暮暮，为你圆缺。' },
    { speaker: 'him', content: '山有木兮木有枝，心悦君兮君不知。' },
];

export function getLoveTemplates() {
    return LOVE_TEMPLATES;
}

export function getRandomTemplate() {
    return LOVE_TEMPLATES[Math.floor(Math.random() * LOVE_TEMPLATES.length)];
}

/* ================================================================
   Init all extras
   ================================================================ */
export function initExtras() {
    initCountdown();
    initRandomMemory();
    initExport();
    initNightMode();
}
