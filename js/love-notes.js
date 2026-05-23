// ============================================================
// 无色笺 — Space 2: 春水温澜 (Love Notes)
// ============================================================

import { fetchLoveNotes, insertRecord, updateRecord, deleteRecord, checkVoicePlayed, recordVoicePlay, getPublicAudioUrl } from './supabase.js';
import { appState } from './state.js';
import { VOICE_MAX_DURATION } from './config.js';
import { formatDate, escapeHTML, $ } from './utils.js';
import { renderWordCloud } from './wordcloud.js';
import { showModal, confirmDialog } from './modal.js';
import { startRecording, stopRecording, isRecording } from './audio-record.js';
import { getRandomTemplate } from './extras.js';

let audioContext = null;

export function initLoveNotes() {
    window.addEventListener('view-changed', (e) => {
        if (e.detail.view === 'main') {
            loadLoveNotes();
        }
    });

    const addBtn = $('#lovenotes-add-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => openNoteForm());
    }
}

async function loadLoveNotes() {
    const container = $('#lovenotes-container');
    if (!container) return;

    container.innerHTML = '<div class="loading-state">研墨中...</div>';

    try {
        const data = await fetchLoveNotes();
        appState.loveNotes = data;

        for (const note of data) {
            if (note.has_voice) {
                try {
                    const played = await checkVoicePlayed(note.id);
                    if (played) appState.markVoicePlayed(note.id);
                } catch (e) { /* ignore */ }
            }
        }

        renderCurrentView();
    } catch (err) {
        console.error('Failed to load love notes:', err);
        container.innerHTML = '<div class="error-state">墨迹未干，稍后再试</div>';
    }
}

function renderCurrentView() {
    const container = $('#lovenotes-container');
    const data = appState.loveNotes;

    if (!data || data.length === 0) {
        container.innerHTML = '<div class="empty-state">静待风起<br><span style="font-size:0.875rem;margin-top:0.5rem;display:block;">点击右下墨滴，写下第一句情话</span></div>';
        return;
    }

    switch (appState.loveNoteDisplayMode) {
        case 'sticky': renderSticky(data, container); break;
        case 'letter': renderLetter(data, container); break;
        case 'cloud':  renderWordCloud(container, data); break;
        default:       renderList(data, container); break;
    }

    renderModeToggle();
}

/* ---------- Mode toggle ---------- */
function renderModeToggle() {
    const spaceHeader = document.querySelector('#space-lovenotes .space-header');
    if (!spaceHeader) return;

    const existing = spaceHeader.querySelector('.display-mode-toggle');
    if (existing) existing.remove();

    const toggle = document.createElement('div');
    toggle.className = 'display-mode-toggle';
    const modes = [
        { key: 'list',   label: '列表' },
        { key: 'sticky', label: '便利贴' },
        { key: 'letter', label: '信纸' },
        { key: 'cloud',  label: '词云' },
    ];
    toggle.innerHTML = modes.map(m =>
        `<button class="display-mode-btn ${appState.loveNoteDisplayMode === m.key ? 'active' : ''}" data-mode="${m.key}">${m.label}</button>`
    ).join('');
    toggle.addEventListener('click', (e) => {
        const btn = e.target.closest('.display-mode-btn');
        if (!btn) return;
        appState.loveNoteDisplayMode = btn.dataset.mode;
        renderCurrentView();
    });
    spaceHeader.appendChild(toggle);
}

/* ---------- List mode (default) ---------- */
function renderList(notes, container) {
    const items = notes.map(n => {
        const speakerLabel = appState.getSpeakerName(n.speaker);
        const speakerClass = n.speaker === 'her' ? 'her' : 'him';
        return `
            <div class="note-list-item" data-id="${n.id}">
                <div class="note-list-main">
                    <span class="note-list-speaker ${speakerClass}">${speakerLabel}</span>
                    <span class="note-list-content">${escapeHTML(n.content)}</span>
                </div>
                <div class="note-list-meta">
                    <span class="note-list-date">${formatDate(n.created_at)}</span>
                    ${n.has_voice ? renderVoiceIcon(n) : ''}
                    <span class="note-list-actions" data-actions="${n.id}">
                        <button class="card-action-btn" data-action="edit-note" data-id="${n.id}">编</button>
                        <button class="card-action-btn btn-delete" data-action="delete-note" data-id="${n.id}">删</button>
                    </span>
                </div>
            </div>
        `;
    }).join('');
    container.innerHTML = `<div class="note-list">${items}</div>`;
    attachVoiceListeners(notes);
    attachNoteActions(container);
    attachListItemClick(container);
}

function attachListItemClick(container) {
    container.querySelectorAll('.note-list-item').forEach(item => {
        item.addEventListener('click', () => {
            const actions = item.querySelector('.note-list-actions');
            if (actions) actions.classList.toggle('visible');
        });
    });
}

/* ---------- Sticky mode ---------- */
function renderSticky(notes, container) {
    const items = notes.map((n, i) => `
        <div class="sticky-note" data-id="${n.id}">
            <span class="sticky-pin"></span>
            <span>${escapeHTML(n.content.length > 30 ? n.content.slice(0, 30) + '...' : n.content)}</span>
        </div>
    `).join('');
    container.innerHTML = `<div class="sticky-grid">${items}</div>`;
    // Click sticky to see full + edit
    container.addEventListener('click', (e) => {
        const sticky = e.target.closest('.sticky-note');
        if (!sticky) return;
        const id = sticky.dataset.id;
        const note = appState.loveNotes.find(n => n.id == id);
        if (note) openNoteForm(note);
    });
}

/* ---------- Letter mode ---------- */
function renderLetter(notes, container) {
    const items = notes.map(n => `
        <div class="letter-card" data-id="${n.id}">
            ${n.title ? `<div class="letter-title">${escapeHTML(n.title)}</div>` : ''}
            <div class="letter-body">${escapeHTML(n.content)}</div>
            <div class="letter-date">${formatDate(n.created_at)} · ${appState.getSpeakerName(n.speaker)} ${n.has_voice ? renderVoiceIcon(n) : ''}</div>
            <div class="card-actions">
                <button class="card-action-btn" data-action="edit-note" data-id="${n.id}">编辑</button>
                <button class="card-action-btn btn-delete" data-action="delete-note" data-id="${n.id}">删除</button>
            </div>
        </div>
    `).join('');
    container.innerHTML = `<div class="letter-list">${items}</div>`;
    attachVoiceListeners(notes);
    attachNoteActions(container);
}

function renderVoiceIcon(note) {
    const played = note.has_voice && appState.isVoicePlayed(note.id);
    const playedClass = played ? 'played' : 'unplayed';
    return `
        <span class="note-voice ${playedClass}" data-note-id="${note.id}" title="${played ? '已听过' : '点击倾听'}" style="cursor:pointer;display:inline-flex;align-items:center;margin:0 4px">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M3 18v-6a9 9 0 0118 0v6"/>
                <path d="M6 15.5A2.5 2.5 0 018.5 13h1a.5.5 0 01.5.5v5a.5.5 0 01-.5.5h-1A2.5 2.5 0 016 16.5v-1z"/>
                <path d="M14 15.5a2.5 2.5 0 012.5-2.5h1a.5.5 0 01.5.5v5a.5.5 0 01-.5.5h-1a2.5 2.5 0 01-2.5-2.5v-1z"/>
            </svg>
        </span>
    `;
}

function attachVoiceListeners(notes) {
    for (const note of notes) {
        if (note.has_voice && !appState.isVoicePlayed(note.id)) {
            const voiceBtn = document.querySelector(`.note-voice[data-note-id="${note.id}"]`);
            if (voiceBtn) {
                voiceBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    playVoice(note);
                });
            }
        }
    }
}

function attachNoteActions(container) {
    container.addEventListener('click', async (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const id = btn.dataset.id;
        const note = appState.loveNotes.find(n => n.id == id);
        if (!note) return;

        if (btn.dataset.action === 'edit-note') {
            openNoteForm(note);
        } else if (btn.dataset.action === 'delete-note') {
            const confirmed = await confirmDialog('删除情话', '此情话将被永久删除。');
            if (confirmed) {
                try {
                    await deleteRecord('love_notes', id);
                    appState.loveNotes = appState.loveNotes.filter(n => n.id != id);
                    renderCurrentView();
                } catch (err) {
                    console.error('Delete failed:', err);
                    alert('删除失败，请重试');
                }
            }
        }
    });
}

async function playVoice(note) {
    const voiceUrl = getPublicAudioUrl('voice-recordings', note.voice_url);
    if (!voiceUrl) return;

    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        const response = await fetch(voiceUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start();
        setTimeout(() => {
            try { source.stop(); } catch (e) { /* already stopped */ }
        }, VOICE_MAX_DURATION * 1000);

        try { await recordVoicePlay(note.id); } catch (e) { /* ignore */ }
        appState.markVoicePlayed(note.id);

        const voiceIcon = document.querySelector(`.note-voice[data-note-id="${note.id}"]`);
        if (voiceIcon) {
            voiceIcon.classList.remove('unplayed');
            voiceIcon.classList.add('played');
        }
    } catch (err) {
        console.error('Voice playback error:', err);
    }
}

/* ---------- Add/Edit form ---------- */
function openNoteForm(existing = null) {
    const isEdit = !!existing;
    let voiceBlob = null;
    let voiceUrl = existing?.voice_url || null;

    const content = document.createElement('div');
    content.innerHTML = `
        <label>说话的人</label>
        <select id="note-speaker">
            <option value="her" ${existing?.speaker === 'her' ? 'selected' : ''}>${appState.getSpeakerName('her')}</option>
            <option value="him" ${existing?.speaker === 'him' ? 'selected' : ''}>${appState.getSpeakerName('him')}</option>
        </select>
        <label>日期</label>
        <input type="date" id="note-date" value="${existing?.created_at ? existing.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10)}">
        <label>标题（可选，信纸模式使用）</label>
        <input type="text" id="note-title" value="${escapeHTML(existing?.title || '')}" maxlength="50" placeholder="给这段话取个标题">
        <label>内容</label>
        <textarea id="note-content" maxlength="500" placeholder="写下想说的话...">${escapeHTML(existing?.content || '')}</textarea>
        <div class="template-hints" style="margin-top:var(--space-2)">
            <span style="font-size:0.7rem;color:var(--text-muted)">情话灵感：</span>
            <button class="template-chip" type="button" data-template="random">随机一句</button>
            <button class="template-chip" type="button" data-template="moon">月色</button>
            <button class="template-chip" type="button" data-template="miss">思念</button>
            <button class="template-chip" type="button" data-template="classic">古典</button>
        </div>
        <label>语音（可选，最长${VOICE_MAX_DURATION}秒）</label>
        <div class="modal-voice-area">
            <button class="modal-voice-btn" id="voice-record-btn" type="button">
                <span class="recording-dot"></span>
                <span id="voice-btn-text">${voiceUrl ? '重新录音' : '点击录音'}</span>
            </button>
            ${voiceUrl ? '<span style="font-size:0.7rem;color:var(--text-muted)">已有录音</span>' : ''}
            <audio id="voice-preview" controls style="display:none;width:100%;margin-top:4px"></audio>
        </div>
    `;

    // Bind template chips
    const templates = {
        moon: { content: '今晚月色真美，和你一起看就更美了。' },
        miss: { content: '晓看天色暮看云，行也思君，坐也思君。' },
        classic: { content: '既见君子，云胡不喜。' },
    };
    content.querySelectorAll('.template-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const key = chip.dataset.template;
            const t = key === 'random' ? getRandomTemplate() : templates[key];
            if (t) {
                content.querySelector('#note-content').value = t.content;
                content.querySelector('#note-speaker').value = t.speaker || 'her';
            }
        });
    });

    // Bind voice record
    const voiceBtn = content.querySelector('#voice-record-btn');
    const voiceBtnText = content.querySelector('#voice-btn-text');
    const voicePreview = content.querySelector('#voice-preview');
    voiceBtn.addEventListener('click', async () => {
        if (isRecording()) {
            try {
                const result = await stopRecording();
                voiceBlob = result.blob;
                voiceUrl = result.url;
                voiceBtn.classList.remove('recording');
                voiceBtnText.textContent = '重新录音';
                // Show preview
                const dataUrl = await blobToDataURL(result.blob);
                voicePreview.src = dataUrl;
                voicePreview.style.display = 'block';
            } catch (err) {
                console.error('Stop recording failed:', err);
            }
        } else {
            try {
                await startRecording((state) => {
                    if (state === 'recording') {
                        voiceBtn.classList.add('recording');
                        voiceBtnText.textContent = '录音中...';
                    }
                });
            } catch (err) {
                alert('无法访问麦克风，请检查权限');
            }
        }
    });

    showModal({
        title: isEdit ? '编辑情话' : '添加情话',
        content,
        buttons: [
            { text: '取消', class: 'btn-ghost', callback: () => {
                if (isRecording()) stopRecording().catch(() => {});
            }},
            {
                text: isEdit ? '保存' : '添加',
                class: 'btn-primary',
                callback: async () => {
                    const speaker = content.querySelector('#note-speaker').value;
                    const title = content.querySelector('#note-title').value.trim();
                    const noteDate = content.querySelector('#note-date').value;
                    const noteContent = content.querySelector('#note-content').value.trim();

                    if (!noteContent) {
                        alert('请至少写点什么吧');
                        return;
                    }

                    const record = {
                        speaker,
                        title: title || null,
                        content: noteContent,
                        created_at: noteDate ? new Date(noteDate + 'T00:00:00+08:00').toISOString() : new Date().toISOString(),
                        has_voice: !!voiceUrl,
                        voice_url: voiceUrl,
                    };

                    try {
                        if (isEdit) {
                            await updateRecord('love_notes', existing.id, record);
                            const idx = appState.loveNotes.findIndex(n => n.id == existing.id);
                            if (idx >= 0) appState.loveNotes[idx] = { ...appState.loveNotes[idx], ...record };
                        } else {
                            const created = await insertRecord('love_notes', record);
                            appState.loveNotes.push(created);
                        }
                        renderCurrentView();
                    } catch (err) {
                        console.error('Save failed:', err);
                        if (err.message && (err.message.includes('row-level security') || err.message.includes('rls'))) {
                            alert('权限不足：请在 Supabase SQL Editor 中运行 supabase/fix-all-policies.sql');
                        } else {
                            alert('保存失败，请重试');
                        }
                    }
                },
            },
        ],
    });
}

// Import on demand to avoid circular deps
import { blobToDataURL } from './upload.js';
