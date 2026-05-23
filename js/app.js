// ============================================================
// 无色笺 — App Orchestrator (主控)
// ============================================================

import { appState } from './state.js';
import { initPasswordGate } from './password-gate.js';
import { initOpeningPoem } from './opening-poem.js';
import { initBambooScroll } from './bamboo-scroll.js';
import { initMoments, initMomentsCardActions } from './moments.js';
import { initLoveNotes } from './love-notes.js';
import { initHabits, initHabitsAddButton } from './habits.js';
import { initEasterEggs } from './easter-eggs.js';
import { initExtras } from './extras.js';
import { initSettings } from './settings.js';
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
    initMomentsCardActions();
    initLoveNotes();
    initHabits();
    initEasterEggs();
    initSettings();
    initExtras();

    // Initial view routing
    if (appState.checkExistingAuth()) {
        appState.setView('poem');
    } else {
        showView('password');
    }

    // View transition handler
    window.addEventListener('view-changed', (e) => {
        showView(e.detail.view);
    });

    // Init dynamic UI elements after main view is active
    window.addEventListener('view-changed', (e) => {
        if (e.detail.view === 'main') {
            initHabitsAddButton();
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
            el.style.animation = '';
        } else {
            el.classList.remove('active');
        }
    }

    // When showing main view from poem, ensure poem fades
    if (viewName === 'main') {
        const poemView = views.poem;
        if (poemView) {
            poemView.classList.remove('active');
        }
    }
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
