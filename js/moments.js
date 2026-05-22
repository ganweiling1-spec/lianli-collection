// ============================================================
// 无色笺 — Space 1: 展齿苍苔 (Moments)
// ============================================================

import { fetchMoments, getPublicImageUrl } from './supabase.js';
import { appState } from './state.js';
import { findSolarTerm, getTodaySolarTerm, getSeasonClass } from './solar-term.js';
import { formatDate, escapeHTML } from './utils.js';
import { $ } from './utils.js';

export function initMoments() {
    window.addEventListener('view-changed', (e) => {
        if (e.detail.view === 'main') {
            loadMoments();
        }
    });
}

async function loadMoments() {
    const container = $('#moments-container');
    if (!container) return;

    container.innerHTML = '<div class="loading-state">研墨中...</div>';

    try {
        const data = await fetchMoments();
        appState.moments = data;

        if (!data || data.length === 0) {
            container.innerHTML = '<div class="empty-state">静待足迹<br><span style="font-size:0.875rem;margin-top:0.5rem;display:block;">点击右下墨滴，写下第一个故事</span></div>';
        } else {
            renderMoments(data, container);
        }

        // Check for solar term day special display
        checkSolarTermToday();
    } catch (err) {
        console.error('Failed to load moments:', err);
        container.innerHTML = '<div class="error-state">墨迹未干，稍后再试</div>';
    }
}

function renderMoments(moments, container) {
    const cells = moments.map(m => renderMomentCard(m)).join('');
    container.innerHTML = `<div class="moments-grid">${cells}</div>`;
}

function renderMomentCard(moment) {
    const term = findSolarTerm(moment.recorded_date);
    const seasonClass = term ? getSeasonClass(term.season) : '';
    const imageUrl = getPublicImageUrl('moments-images', moment.image_url);

    const imageHTML = imageUrl
        ? `<div class="polaroid-image"><img src="${imageUrl}" alt="${escapeHTML(moment.title)}" loading="lazy" decoding="async"></div>`
        : `<div class="polaroid-image"><div class="polaroid-image-placeholder">${escapeHTML(moment.title.charAt(0))}</div></div>`;

    return `
        <div class="polaroid-card anim-fade-in-up">
            ${imageHTML}
            <div class="polaroid-caption">
                ${term ? `<span class="polaroid-solar-term ${seasonClass}">${term.name}</span>` : ''}
                <p class="polaroid-title">${escapeHTML(moment.title)}</p>
                ${moment.description ? `<p class="polaroid-description">${escapeHTML(moment.description)}</p>` : ''}
                ${moment.location ? `<p class="polaroid-location">${escapeHTML(moment.location)}</p>` : ''}
                <div class="polaroid-boot-print" title="${term ? term.name : ''}"></div>
            </div>
        </div>
    `;
}

function checkSolarTermToday() {
    const term = getTodaySolarTerm();
    if (term) {
        appState.solarTermToday = term;
        const subtext = $('#top-poem-subtext');
        if (subtext && term.poem) {
            subtext.textContent = `今日${term.name} · ${term.poem}`;
            subtext.classList.add('anim-fade-in-up');
        }
    }
}

// Add button — for V1, decorative with tooltip
export function initMomentsAddButton() {
    const btn = $('#moments-add-btn');
    if (!btn) return;

    btn.addEventListener('click', () => {
        // V1: Show a gentle hint; V2: opens inline form
        const container = $('#moments-container');
        const hint = document.createElement('div');
        hint.className = 'empty-state anim-fade-in-up';
        hint.innerHTML = '在 Supabase Dashboard 中添加新的瞬间<br><span style="font-size:0.75rem;margin-top:0.5rem;display:block;color:var(--text-muted)">进入 moments 表 → 新增行</span>';
        hint.style.position = 'fixed';
        hint.style.bottom = '120px';
        hint.style.left = '50%';
        hint.style.transform = 'translateX(-50%)';
        hint.style.zIndex = 'var(--z-overlay)';
        hint.style.background = 'var(--bg-primary)';
        hint.style.padding = '1rem 1.5rem';
        hint.style.borderRadius = '8px';
        hint.style.boxShadow = 'var(--shadow-float)';
        hint.style.minHeight = 'auto';
        document.body.appendChild(hint);

        setTimeout(() => {
            hint.style.opacity = '0';
            hint.style.transition = 'opacity 500ms';
            hint.addEventListener('transitionend', () => hint.remove());
        }, 3000);
    });
}
