// ============================================================
// 无色笺 — Space 3: 冷暖共知 (Habits)
// ============================================================

import { fetchHabits } from './supabase.js';
import { appState } from './state.js';
import { HABIT_CATEGORIES } from './config.js';
import { escapeHTML, $, createElement } from './utils.js';

export function initHabits() {
    window.addEventListener('view-changed', (e) => {
        if (e.detail.view === 'main') {
            loadHabits();
        }
    });

    // Delegate tap on habit items for expand/collapse
    const container = $('#habits-container');
    if (container) {
        container.addEventListener('click', (e) => {
            const item = e.target.closest('.habit-item');
            if (item) {
                item.classList.toggle('expanded');
            }
        });
    }
}

async function loadHabits() {
    const container = $('#habits-container');
    if (!container) return;

    container.innerHTML = '<div class="loading-state">研墨中...</div>';

    try {
        const data = await fetchHabits();
        appState.habits = data;

        if (!data || data.length === 0) {
            container.innerHTML = '<div class="empty-state">静待了解<br><span style="font-size:0.875rem;margin-top:0.5rem;display:block;">长按添加第一条习惯记录</span></div>';
        } else {
            renderHabits(data, container);
        }
    } catch (err) {
        console.error('Failed to load habits:', err);
        container.innerHTML = '<div class="error-state">墨迹未干，稍后再试</div>';
    }
}

function renderHabits(habits, container) {
    const herHabits = habits.filter(h => h.person === 'her');
    const himHabits = habits.filter(h => h.person === 'him');

    container.innerHTML = `
        <div class="habits-columns">
            <div class="habits-column" id="habits-her">
                <h3 class="habits-column-header">关于她</h3>
                ${herHabits.map(h => renderHabitItem(h)).join('')}
            </div>
            <div class="habits-column" id="habits-him">
                <h3 class="habits-column-header">关于他</h3>
                ${himHabits.map(h => renderHabitItem(h)).join('')}
            </div>
        </div>
    `;
}

function renderHabitItem(habit) {
    const categoryLabel = habit.category || '';
    const iconName = HABIT_CATEGORIES[habit.category] || 'default';

    return `
        <div class="habit-item anim-fade-in-up">
            <span class="habit-icon-svg">${getHabitIconSVG(iconName)}</span>
            <div>
                ${categoryLabel ? `<span class="habit-category-tag">${escapeHTML(categoryLabel)}</span>` : ''}
                <p class="habit-content">${escapeHTML(habit.content)}</p>
                ${habit.note ? `<p class="habit-note">${escapeHTML(habit.note)}</p>` : ''}
            </div>
        </div>
    `;
}

function getHabitIconSVG(iconName) {
    const icons = {
        food:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M7 12h10"/></svg>',
        sleep:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>',
        hobby:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>',
        dislike: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M8 8l8 8M16 8l-8 8"/></svg>',
        habit:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2v20M2 12h20"/><circle cx="12" cy="12" r="3"/></svg>',
        travel:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 00-8 8c0 5.4 8 12 8 12s8-6.6 8-12a8 8 0 00-8-8z"/></svg>',
        default: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/></svg>',
    };
    return icons[iconName] || icons.default;
}
