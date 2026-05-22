// ============================================================
// 无色笺 — Timeline Renderer
// ============================================================

import { findSolarTerm, getSeasonClass } from './solar-term.js';
import { formatDate, escapeHTML } from './utils.js';
import { getPublicImageUrl } from './supabase.js';

/**
 * Render moments in a vertical timeline layout.
 */
export function renderTimeline(moments, container) {
    if (!moments || moments.length === 0) {
        container.innerHTML = '<div class="empty-state">时间轴上暂无足迹</div>';
        return;
    }

    // Sort by recorded_date ascending for timeline
    const sorted = [...moments].sort((a, b) =>
        new Date(a.recorded_date) - new Date(b.recorded_date)
    );

    let html = '<div class="timeline-track">';
    let lastYear = '';
    let lastMonth = '';

    sorted.forEach((m, i) => {
        const d = new Date(m.recorded_date);
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const term = findSolarTerm(m.recorded_date);
        const isNewYear = year !== lastYear;
        const isNewMonth = month !== lastMonth || isNewYear;
        lastYear = year;
        lastMonth = month;

        // Year divider
        if (isNewYear) {
            html += `<div class="timeline-year">${year}年</div>`;
        }

        // Month marker
        const showDateMarker = isNewMonth || i === 0;
        html += `
            <div class="timeline-entry ${showDateMarker ? 'has-marker' : ''}">
                <div class="timeline-line">
                    <div class="timeline-dot ${term ? getSeasonClass(term.season) : ''}"></div>
                </div>
                <div class="timeline-card">
                    ${showDateMarker ? `<div class="timeline-date">${month}月${d.getDate()}日 · ${term ? term.name : ''}</div>` : ''}
                    <div class="timeline-card-inner">
                        ${m.image_url ? `<div class="timeline-thumb"><img src="${getPublicImageUrl('moments-images', m.image_url)}" alt="" loading="lazy"></div>` : ''}
                        <div class="timeline-text">
                            <p class="timeline-title">${escapeHTML(m.title)}</p>
                            ${m.description ? `<p class="timeline-desc">${escapeHTML(m.description)}</p>` : ''}
                            ${m.location ? `<p class="timeline-loc">${escapeHTML(m.location)}</p>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}
