// ============================================================
// 无色笺 — Space 3: 冷暖共知 (Habits)
// ============================================================

import { fetchHabits, insertRecord, updateRecord, deleteRecord } from './supabase.js';
import { appState } from './state.js';
import { HABIT_CATEGORIES } from './config.js';
import { escapeHTML, $ } from './utils.js';
import { showModal, confirmDialog } from './modal.js';

export function initHabits() {
    window.addEventListener('view-changed', (e) => {
        if (e.detail.view === 'main') {
            loadHabits();
        }
    });

    // Delegate card actions
    const container = $('#habits-container');
    if (container) {
        container.addEventListener('click', async (e) => {
            const actionBtn = e.target.closest('[data-action]');
            if (!actionBtn) return;

            const id = actionBtn.dataset.id;
            const habit = appState.habits.find(h => h.id == id);
            if (!habit) return;

            if (actionBtn.dataset.action === 'edit-habit') {
                openHabitForm(habit);
            } else if (actionBtn.dataset.action === 'delete-habit') {
                const confirmed = await confirmDialog('删除习惯', '此条目将被永久删除。');
                if (confirmed) {
                    try {
                        await deleteRecord('habits', id);
                        appState.habits = appState.habits.filter(h => h.id != id);
                        renderHabitsView();
                    } catch (err) {
                        console.error('Delete failed:', err);
                        alert('删除失败，请重试');
                    }
                }
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
        renderHabitsView();
    } catch (err) {
        console.error('Failed to load habits:', err);
        container.innerHTML = '<div class="error-state">墨迹未干，稍后再试</div>';
    }
}

function renderHabitsView() {
    const container = $('#habits-container');
    const habits = appState.habits;

    if (!habits || habits.length === 0) {
        container.innerHTML = '<div class="empty-state">静待了解<br><span style="font-size:0.875rem;margin-top:0.5rem;display:block;">点击右下墨滴，记录第一条</span></div>';
        return;
    }

    const herHabits = habits.filter(h => h.person === 'her');
    const himHabits = habits.filter(h => h.person === 'him');

    container.innerHTML = `
        <div class="habits-columns">
            <div class="habits-column" id="habits-her">
                <h3 class="habits-column-header">关于${appState.getSpeakerName('her')}</h3>
                ${herHabits.map(h => renderHabitItem(h)).join('')}
            </div>
            <div class="habits-column" id="habits-him">
                <h3 class="habits-column-header">关于${appState.getSpeakerName('him')}</h3>
                ${himHabits.map(h => renderHabitItem(h)).join('')}
            </div>
        </div>
    `;
}

function renderHabitItem(habit) {
    const categoryLabel = habit.category || '';
    const iconName = HABIT_CATEGORIES[habit.category] || 'default';

    return `
        <div class="habit-item anim-fade-in-up" data-id="${habit.id}">
            <span class="habit-icon-svg">${getHabitIconSVG(iconName)}</span>
            <div class="habit-item-body">
                ${categoryLabel ? `<span class="habit-category-tag">${escapeHTML(categoryLabel)}</span>` : ''}
                <p class="habit-content">${escapeHTML(habit.content)}</p>
                ${habit.note ? `<p class="habit-note">${escapeHTML(habit.note)}</p>` : ''}
            </div>
            <div class="habit-item-actions">
                <button class="card-action-btn" data-action="edit-habit" data-id="${habit.id}">编</button>
                <button class="card-action-btn btn-delete" data-action="delete-habit" data-id="${habit.id}">删</button>
            </div>
        </div>
    `;
}

/* ---------- Add/Edit form ---------- */
function openHabitForm(existing = null) {
    const isEdit = !!existing;
    const categories = ['饮食', '睡眠', '爱好', '心愿', '习惯', '雷区', '出行', '其他'];

    const content = document.createElement('div');
    content.innerHTML = `
        <label>对象</label>
        <select id="habit-person">
            <option value="her" ${existing?.person === 'her' ? 'selected' : ''}>${appState.getSpeakerName('her')}</option>
            <option value="him" ${existing?.person === 'him' ? 'selected' : ''}>${appState.getSpeakerName('him')}</option>
        </select>
        <label>分类</label>
        <select id="habit-category">
            <option value="">-- 选择分类 --</option>
            ${categories.map(c => `<option value="${c}" ${existing?.category === c ? 'selected' : ''}>${c}</option>`).join('')}
        </select>
        <label>内容</label>
        <textarea id="habit-content" maxlength="300" placeholder="记录习惯、喜好或雷区...">${escapeHTML(existing?.content || '')}</textarea>
        <label>备注（可选）</label>
        <input type="text" id="habit-note" value="${escapeHTML(existing?.note || '')}" maxlength="200" placeholder="补充说明">
    `;

    showModal({
        title: isEdit ? '编辑习惯' : '添加习惯',
        content,
        buttons: [
            { text: '取消', class: 'btn-ghost', callback: () => {} },
            {
                text: isEdit ? '保存' : '添加',
                class: 'btn-primary',
                callback: async () => {
                    const person = content.querySelector('#habit-person').value;
                    const category = content.querySelector('#habit-category').value || null;
                    const habitContent = content.querySelector('#habit-content').value.trim();
                    const note = content.querySelector('#habit-note').value.trim() || null;

                    if (!habitContent) {
                        alert('请填写内容');
                        return;
                    }

                    const record = { person, category, content: habitContent, note };

                    try {
                        if (isEdit) {
                            await updateRecord('habits', existing.id, record);
                            const idx = appState.habits.findIndex(h => h.id == existing.id);
                            if (idx >= 0) appState.habits[idx] = { ...appState.habits[idx], ...record };
                        } else {
                            const created = await insertRecord('habits', record);
                            appState.habits.push(created);
                        }
                        renderHabitsView();
                    } catch (err) {
                        console.error('Save failed:', err);
                        alert('保存失败，请重试');
                    }
                },
            },
        ],
    });
}

/* ---------- FAB button ---------- */
export function initHabitsAddButton() {
    // Use inline FAB in the habits space
    const spacePanel = $('#space-habits');
    if (!spacePanel) return;

    // Check if FAB already exists
    if ($('#habits-add-btn')) return;

    const fab = document.createElement('button');
    fab.id = 'habits-add-btn';
    fab.className = 'ink-drop-fab';
    fab.title = '添加习惯';
    fab.textContent = '+';
    fab.addEventListener('click', () => openHabitForm());
    spacePanel.appendChild(fab);
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
