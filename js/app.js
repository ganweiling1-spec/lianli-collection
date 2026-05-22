// ============================================================
// 无色笺 — App Orchestrator (主控)
// ============================================================

import { appState } from './state.js';
import { initPasswordGate } from './password-gate.js';
import { initOpeningPoem } from './opening-poem.js';
import { initBambooScroll } from './bamboo-scroll.js';
import { initMoments, initMomentsAddButton } from './moments.js';
import { initLoveNotes } from './love-notes.js';
import { initHabits } from './habits.js';
import { initEasterEggs } from './easter-eggs.js';
import { $ } from './utils.js';

/**
 * Bootstrap the application.
 */
function init() {
    // Initialize all modules (they register event listeners)
    initPasswordGate();
    initOpeningPoem();
    initBambooScroll();
    initMoments();
    initLoveNotes();
    initHabits();
    initEasterEggs();

    // Initial view routing
    if (appState.checkExistingAuth()) {
        // Already authenticated — go directly to poem then main
        appState.setView('poem');
    } else {
        // Not authenticated — show password gate
        showView('password');
    }

    // View transition handler
    window.addEventListener('view-changed', (e) => {
        showView(e.detail.view);
    });

    // Init add buttons after main view is active
    window.addEventListener('view-changed', (e) => {
        if (e.detail.view === 'main') {
            initMomentsAddButton();
            initLoveNotesAddButton();
        }
    });

    // Prevent accidental right-click save (per PRD privacy requirement)
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
    });
}

/**
 * Show a specific view, hide others.
 */
function showView(viewName) {
    const views = {
        password: $('#password-gate'),
        poem: $('#opening-poem'),
        main: $('#main-view'),
    };

    for (const [name, el] of Object.entries(views)) {
        if (!el) continue;
        if (name === viewName) {
            el.classList.add('active');
            // Reset any inline animation styles from previous transitions
            el.style.animation = '';
        } else {
            el.classList.remove('active');
        }
    }

    // Special case: when showing main view from poem, ensure poem fades
    if (viewName === 'main') {
        const poemView = views.poem;
        if (poemView) {
            poemView.classList.remove('active');
        }
    }
}

// Love notes add button
function initLoveNotesAddButton() {
    const btn = $('#lovenotes-add-btn');
    if (!btn) return;

    btn.addEventListener('click', () => {
        const hint = document.createElement('div');
        hint.className = 'empty-state anim-fade-in-up';
        hint.innerHTML = '在 Supabase Dashboard 中添加新的情话<br><span style="font-size:0.75rem;margin-top:0.5rem;display:block;color:var(--text-muted)">进入 love_notes 表 → 新增行</span>';
        hint.style.cssText = `
            position: fixed;
            bottom: 120px;
            left: 50%;
            transform: translateX(-50%);
            z-index: var(--z-overlay);
            background: var(--bg-primary);
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: var(--shadow-float);
            min-height: auto;
        `;
        document.body.appendChild(hint);

        setTimeout(() => {
            hint.style.opacity = '0';
            hint.style.transition = 'opacity 500ms';
            hint.addEventListener('transitionend', () => hint.remove());
        }, 3000);
    });
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
