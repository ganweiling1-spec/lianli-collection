// ============================================================
// 无色笺 — Extra Features (v2.1)
// ============================================================

import { appState } from './state.js';
import { showModal } from './modal.js';
import { escapeHTML } from './utils.js';
import { TOGETHER_DATE } from './config.js';

const NIGHT_MODE_KEY = 'lianli_night_mode';
let nightModeActive = false;
let particlesTimer = null;

/* ================================================================
   1. Together Days Counter (动态在一起天数)
   ================================================================ */
export function initCountdown() {
    window.addEventListener('view-changed', (e) => {
        if (e.detail.view === 'main') {
            updateTogetherDays();
            setInterval(updateTogetherDays, 60000);
        }
    });

    window.addEventListener('space-changed', (e) => {
        updateCountdownStyle(e.detail.spaceIndex);
    });
}

function updateTogetherDays() {
    const bar = document.getElementById('countdown-bar');
    if (!bar) return;

    const start = new Date(TOGETHER_DATE);
    const now = new Date();
    const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));

    bar.innerHTML = `<span>我们在一起 <strong>${diffDays}</strong> 天啦</span>`;
    bar.classList.add('countdown-today');
}

function updateCountdownStyle(spaceIndex) {
    const bar = document.getElementById('countdown-bar');
    if (!bar) return;
    // Bar blends with each space's bg — use soft tint per module
    bar.style.background = 'transparent';
    bar.style.borderBottom = '1px solid var(--border-color)';
}

/* ================================================================
   2. Random Memory Popup
   ================================================================ */
let memoryTimer = null;

export function initRandomMemory() {
    window.addEventListener('view-changed', (e) => {
        if (e.detail.view === 'main') {
            scheduleRandomMemory();
        } else {
            if (memoryTimer) clearTimeout(memoryTimer);
        }
    });
}

function scheduleRandomMemory() {
    if (memoryTimer) clearTimeout(memoryTimer);
    if (Math.random() > 0.15) return;
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
        </div>`;

    showModal({
        title: '回忆浮现',
        content,
        buttons: [{ text: '收起', class: 'btn-ghost', callback: () => {} }],
    });
}

/* ================================================================
   3. Falling Particles (落叶/雪花/花瓣)
   ================================================================ */
let particlesLayer = null;

export function initParticles() {
    window.addEventListener('space-changed', (e) => {
        const idx = e.detail.spaceIndex;
        if (idx === 0) startParticles('leaf');      // moments: leaves
        else if (idx === 1) startParticles('petal'); // love notes: petals + willow
        else if (idx === 2) startParticles('snow');  // habits: snow
        else stopParticles();                        // settings: none
    });

    window.addEventListener('view-changed', (e) => {
        if (e.detail.view !== 'main') stopParticles();
    });
}

function startParticles(type) {
    stopParticles();
    particlesLayer = document.createElement('div');
    particlesLayer.className = 'particles-layer';
    document.body.appendChild(particlesLayer);

    // For love notes, also add willow leaves to the space panel
    ensureWillowLeaves(type === 'petal');

    function spawn() {
        if (!particlesLayer) return;
        const el = document.createElement('div');
        el.className = `particle ${type}`;
        el.style.left = Math.random() * 100 + '%';
        el.style.setProperty('--drift', (Math.random() - 0.5) * 200 + 'px');
        el.style.animationDuration = (5 + Math.random() * 8) + 's';
        el.style.animationDelay = Math.random() * 3 + 's';
        el.style.width = (type === 'snow' ? 4 + Math.random() * 8 : 10 + Math.random() * 14) + 'px';
        el.style.height = (type === 'snow' ? 4 + Math.random() * 8 : 12 + Math.random() * 16) + 'px';
        particlesLayer.appendChild(el);

        // Remove after animation
        setTimeout(() => el.remove(), 12000);
    }

    // Spawn particles
    const count = type === 'snow' ? 25 : 12;
    for (let i = 0; i < count; i++) {
        setTimeout(() => spawn(), i * (type === 'snow' ? 200 : 500));
    }

    particlesTimer = setInterval(() => {
        if (particlesLayer && particlesLayer.children.length < (type === 'snow' ? 30 : 15)) {
            spawn();
        }
    }, type === 'snow' ? 800 : 2000);
}

function ensureWillowLeaves(show) {
    const panel = document.getElementById('space-lovenotes');
    if (!panel) return;
    const existing = panel.querySelectorAll('.willow-leaf');
    if (show) {
        if (existing.length === 0) {
            for (let i = 0; i < 5; i++) {
                const leaf = document.createElement('div');
                leaf.className = 'willow-leaf';
                panel.appendChild(leaf);
            }
        }
    } else {
        existing.forEach(l => l.remove());
    }
}

function stopParticles() {
    if (particlesTimer) { clearInterval(particlesTimer); particlesTimer = null; }
    if (particlesLayer) { particlesLayer.remove(); particlesLayer = null; }
    // Remove willow leaves
    const panel = document.getElementById('space-lovenotes');
    if (panel) panel.querySelectorAll('.willow-leaf').forEach(l => l.remove());
}

/* ================================================================
   4. Night Mode (暖黄灯模式)
   ================================================================ */
export function initNightMode() {
    const saved = localStorage.getItem(NIGHT_MODE_KEY);
    if (saved === 'true') { nightModeActive = true; document.body.classList.add('night-mode'); }

    window.addEventListener('view-changed', (e) => {
        if (e.detail.view === 'main') ensureNightModeToggle();
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
}

/* ================================================================
   5. Love Note Generator
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
    { speaker: 'her', content: '朝暮与年岁并往，然后与你行至天光。' },
    { speaker: 'him', content: '既见君子，云胡不喜。' },
    { speaker: 'her', content: '三里清风三里路，步步清风步步你。' },
    { speaker: 'him', content: '山有木兮木有枝，心悦君兮君不知。' },
];

export function getLoveTemplates() { return LOVE_TEMPLATES; }
export function getRandomTemplate() { return LOVE_TEMPLATES[Math.floor(Math.random() * LOVE_TEMPLATES.length)]; }

/* ================================================================
   Init all extras
   ================================================================ */
export function initExtras() {
    initCountdown();
    initRandomMemory();
    initParticles();
    initNightMode();
}
