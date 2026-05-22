// ============================================================
// 无色笺 — Space 2: 春水温澜 (Love Notes)
// ============================================================

import { fetchLoveNotes, checkVoicePlayed, recordVoicePlay, getPublicAudioUrl } from './supabase.js';
import { appState } from './state.js';
import { VOICE_MAX_DURATION } from './config.js';
import { formatDate, escapeHTML, $ } from './utils.js';

let audioContext = null;

export function initLoveNotes() {
    window.addEventListener('view-changed', (e) => {
        if (e.detail.view === 'main') {
            loadLoveNotes();
        }
    });
}

async function loadLoveNotes() {
    const container = $('#lovenotes-container');
    if (!container) return;

    container.innerHTML = '<div class="loading-state">研墨中...</div>';

    try {
        const data = await fetchLoveNotes();
        appState.loveNotes = data;

        // Check voice play status for all notes
        for (const note of data) {
            if (note.has_voice) {
                try {
                    const played = await checkVoicePlayed(note.id);
                    if (played) {
                        appState.markVoicePlayed(note.id);
                    }
                } catch (e) {
                    // If check fails, assume unplayed
                }
            }
        }

        if (!data || data.length === 0) {
            container.innerHTML = '<div class="empty-state">静待风起<br><span style="font-size:0.875rem;margin-top:0.5rem;display:block;">点击右下墨滴，写下第一句情话</span></div>';
        } else {
            renderLoveNotes(data, container);
        }
    } catch (err) {
        console.error('Failed to load love notes:', err);
        container.innerHTML = '<div class="error-state">墨迹未干，稍后再试</div>';
    }
}

function renderLoveNotes(notes, container) {
    const cells = notes.map(n => renderChimeNote(n)).join('');
    container.innerHTML = `<div class="lovenotes-list">${cells}</div>`;

    // Attach voice listeners after render
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

function renderChimeNote(note) {
    const speakerClass = note.speaker === 'her' ? 'speaker-her' : 'speaker-him';
    const played = note.has_voice && appState.isVoicePlayed(note.id);

    let voiceHTML = '';
    if (note.has_voice) {
        const playedClass = played ? 'played' : 'unplayed';
        voiceHTML = `
            <div class="note-voice ${playedClass}" data-note-id="${note.id}" title="${played ? '已听过' : '点击倾听'}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M3 18v-6a9 9 0 0118 0v6"/>
                    <path d="M6 15.5A2.5 2.5 0 018.5 13h1a.5.5 0 01.5.5v5a.5.5 0 01-.5.5h-1A2.5 2.5 0 016 16.5v-1z"/>
                    <path d="M14 15.5a2.5 2.5 0 012.5-2.5h1a.5.5 0 01.5.5v5a.5.5 0 01-.5.5h-1a2.5 2.5 0 01-2.5-2.5v-1z"/>
                </svg>
            </div>
        `;
    }

    return `
        <div class="chime-note ${speakerClass} anim-fade-in-up">
            <p class="note-content">${escapeHTML(note.content)}</p>
            <p class="note-date">${formatDate(note.created_at)}</p>
            ${voiceHTML}
        </div>
    `;
}

async function playVoice(note) {
    const voiceUrl = getPublicAudioUrl('voice-recordings', note.voice_url);
    if (!voiceUrl) return;

    try {
        // Initialize audio context on first user interaction
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        const response = await fetch(voiceUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);

        // Limit to VOICE_MAX_DURATION seconds
        source.start();
        setTimeout(() => {
            try { source.stop(); } catch (e) { /* already stopped */ }
        }, VOICE_MAX_DURATION * 1000);

        // Mark as played after playback starts
        try {
            await recordVoicePlay(note.id);
        } catch (e) {
            // Still mark locally even if server fails
        }
        appState.markVoicePlayed(note.id);

        // Animate icon disappearance
        const voiceIcon = document.querySelector(`.note-voice[data-note-id="${note.id}"]`);
        if (voiceIcon) {
            voiceIcon.classList.remove('unplayed');
            voiceIcon.classList.add('played', 'anim-voice-disappear');
        }
    } catch (err) {
        console.error('Voice playback error:', err);
    }
}
