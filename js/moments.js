// ============================================================
// 无色笺 — Space 1: 展齿苍苔 (Moments)
// ============================================================

import { fetchMoments, insertRecord, updateRecord, deleteRecord, getPublicImageUrl } from './supabase.js';
import { appState } from './state.js';
import { findSolarTerm, getTodaySolarTerm, getSeasonClass } from './solar-term.js';
import { formatDate, escapeHTML, $ } from './utils.js';
import { renderTimeline } from './timeline.js';
import { showModal, closeModal, confirmDialog } from './modal.js';
import { pickImage, handleImageUpload } from './upload.js';

export function initMoments() {
    window.addEventListener('view-changed', (e) => {
        if (e.detail.view === 'main') {
            loadMoments();
        }
    });

    // Add button opens upload form
    const addBtn = $('#moments-add-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => openMomentForm());
    }
}

async function loadMoments() {
    const container = $('#moments-container');
    if (!container) return;

    container.innerHTML = '<div class="loading-state">研墨中...</div>';

    try {
        const data = await fetchMoments();
        appState.moments = data;
        renderCurrentView();
        checkSolarTermToday();
    } catch (err) {
        console.error('Failed to load moments:', err);
        container.innerHTML = '<div class="error-state">墨迹未干，稍后再试</div>';
    }
}

function renderCurrentView() {
    const container = $('#moments-container');
    const data = appState.moments;

    if (!data || data.length === 0) {
        container.innerHTML = '<div class="empty-state">静待足迹<br><span style="font-size:0.875rem;margin-top:0.5rem;display:block;">点击右下墨滴，写下第一个故事</span></div>';
        return;
    }

    if (appState.momentsDisplayMode === 'timeline') {
        renderTimeline(data, container);
    } else {
        renderGrid(data, container);
    }

    // Attach display mode toggle
    renderModeToggle();
}

function renderGrid(moments, container) {
    const cells = moments.map(m => renderMomentCard(m)).join('');
    container.innerHTML = `<div class="moments-grid">${cells}</div>`;
}

function renderMomentCard(moment) {
    const term = findSolarTerm(moment.recorded_date);
    const seasonClass = term ? getSeasonClass(term.season) : '';
    const imageUrl = moment.image_url ? getPublicImageUrl('moments-images', moment.image_url) : null;

    const imageHTML = imageUrl
        ? `<div class="polaroid-image"><img src="${imageUrl}" alt="${escapeHTML(moment.title)}" loading="lazy" decoding="async"></div>`
        : `<div class="polaroid-image"><div class="polaroid-image-placeholder">${escapeHTML(moment.title.charAt(0))}</div></div>`;

    return `
        <div class="polaroid-card anim-fade-in-up" data-id="${moment.id}">
            ${imageHTML}
            <div class="polaroid-caption">
                ${term ? `<span class="polaroid-solar-term ${seasonClass}">${term.name}</span>` : ''}
                <p class="polaroid-title">${escapeHTML(moment.title)}</p>
                ${moment.description ? `<p class="polaroid-description">${escapeHTML(moment.description)}</p>` : ''}
                ${moment.location ? `<p class="polaroid-location">${escapeHTML(moment.location)}</p>` : ''}
                <div class="card-actions">
                    <button class="card-action-btn" data-action="edit" data-id="${moment.id}">编辑</button>
                    <button class="card-action-btn btn-delete" data-action="delete" data-id="${moment.id}">删除</button>
                </div>
                <div class="polaroid-boot-print" title="${term ? term.name : ''}"></div>
            </div>
        </div>
    `;
}

/* ---------- Display mode toggle ---------- */
function renderModeToggle() {
    const spaceHeader = document.querySelector('#space-moments .space-header');
    if (!spaceHeader) return;

    // Remove existing toggle
    const existing = spaceHeader.querySelector('.display-mode-toggle');
    if (existing) existing.remove();

    const toggle = document.createElement('div');
    toggle.className = 'display-mode-toggle';
    const modes = [
        { key: 'grid', label: '拍立得' },
        { key: 'timeline', label: '时间线' },
    ];
    toggle.innerHTML = modes.map(m =>
        `<button class="display-mode-btn ${appState.momentsDisplayMode === m.key ? 'active' : ''}" data-mode="${m.key}">${m.label}</button>`
    ).join('');
    toggle.addEventListener('click', (e) => {
        const btn = e.target.closest('.display-mode-btn');
        if (!btn) return;
        appState.momentsDisplayMode = btn.dataset.mode;
        renderCurrentView();
    });
    spaceHeader.appendChild(toggle);
}

/* ---------- Card actions (edit/delete delegation) ---------- */
export function initMomentsCardActions() {
    const container = $('#moments-container');
    if (!container) return;

    container.addEventListener('click', async (e) => {
        const actionBtn = e.target.closest('[data-action]');
        if (!actionBtn) return;

        const id = actionBtn.dataset.id;
        const action = actionBtn.dataset.action;
        const moment = appState.moments.find(m => m.id == id);
        if (!moment) return;

        if (action === 'edit') {
            openMomentForm(moment);
        } else if (action === 'delete') {
            const confirmed = await confirmDialog('删除足迹', '此足迹将被永久删除，无法找回。');
            if (confirmed) {
                try {
                    await deleteRecord('moments', id);
                    appState.moments = appState.moments.filter(m => m.id != id);
                    renderCurrentView();
                } catch (err) {
                    console.error('Delete failed:', err);
                    alert('删除失败，请重试');
                }
            }
        }
    });
}

/* ---------- Add/Edit form ---------- */
function openMomentForm(existing = null) {
    const isEdit = !!existing;
    let imageFile = null;
    let imagePreviewUrl = existing?.image_url ? getPublicImageUrl('moments-images', existing.image_url) : null;

    const content = document.createElement('div');

    // Image upload area
    const imageUploadHTML = `
        <label>照片</label>
        <div class="modal-image-upload" id="moment-image-upload">
            ${imagePreviewUrl
                ? `<img src="${imagePreviewUrl}" alt="">`
                : `<div class="upload-placeholder">点击上传照片<br><span style="font-size:0.7rem">JPG/PNG/WebP, ≤10MB</span></div>`
            }
        </div>
        <label>标题</label>
        <input type="text" id="moment-title" value="${escapeHTML(existing?.title || '')}" maxlength="100" placeholder="给这个瞬间取个名字">
        <label>日期</label>
        <input type="date" id="moment-date" value="${existing?.recorded_date || ''}">
        <label>描述（可选）</label>
        <textarea id="moment-desc" maxlength="500" placeholder="记录此刻的心情...">${escapeHTML(existing?.description || '')}</textarea>
        <label>地点（可选）</label>
        <input type="text" id="moment-location" value="${escapeHTML(existing?.location || '')}" maxlength="100" placeholder="在哪里？">
    `;
    content.innerHTML = imageUploadHTML;

    // Bind image upload click
    const imageUpload = content.querySelector('#moment-image-upload');
    imageUpload.addEventListener('click', async () => {
        try {
            const { file, previewUrl } = await pickImage();
            imageFile = file;
            imagePreviewUrl = previewUrl;
            imageUpload.innerHTML = `<img src="${previewUrl}" alt="">`;
        } catch (e) {
            // user cancelled
        }
    });

    showModal({
        title: isEdit ? '编辑足迹' : '添加新的足迹',
        content,
        buttons: [
            { text: '取消', class: 'btn-ghost', callback: () => {} },
            {
                text: isEdit ? '保存' : '添加',
                class: 'btn-primary',
                callback: async () => {
                    const title = content.querySelector('#moment-title').value.trim();
                    const date = content.querySelector('#moment-date').value;
                    const desc = content.querySelector('#moment-desc').value.trim();
                    const location = content.querySelector('#moment-location').value.trim();

                    if (!title || !date) {
                        alert('请至少填写标题和日期');
                        return;
                    }

                    // Upload image if new one selected
                    let imagePath = existing?.image_url || null;
                    if (imageFile) {
                        try {
                            imagePath = await handleImageUpload(imageFile);
                        } catch (err) {
                            alert('图片上传失败，请重试');
                            return;
                        }
                    }

                    const record = {
                        title,
                        recorded_date: date,
                        description: desc || null,
                        location: location || null,
                        image_url: imagePath,
                    };

                    try {
                        if (isEdit) {
                            await updateRecord('moments', existing.id, record);
                            const idx = appState.moments.findIndex(m => m.id == existing.id);
                            if (idx >= 0) appState.moments[idx] = { ...appState.moments[idx], ...record };
                        } else {
                            const created = await insertRecord('moments', record);
                            appState.moments.push(created);
                        }
                        renderCurrentView();
                    } catch (err) {
                        console.error('Save failed:', err);
                        alert('保存失败，请重试');
                    }
                },
            },
        ],
    });
}

/* ---------- Solar term check ---------- */
function checkSolarTermToday() {
    const term = getTodaySolarTerm();
    if (term) {
        appState.solarTermToday = term;
        const header = document.querySelector('#space-moments .space-poem');
        if (header && term.poem) {
            header.textContent = `今日${term.name} · ${term.poem}`;
            header.classList.add('anim-fade-in-up');
        }
    }
}
