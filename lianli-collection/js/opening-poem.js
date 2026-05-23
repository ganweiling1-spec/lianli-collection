// ============================================================
// 无色笺 — Opening Poem Transition
// ============================================================

import { appState } from './state.js';
import { POEM_DISPLAY_DURATION, POEM_LINE_DELAY } from './config.js';
import { $$ } from './utils.js';

let poemTimer = null;

export function initOpeningPoem() {
    window.addEventListener('view-changed', (e) => {
        if (e.detail.view === 'poem') {
            startPoemSequence();
        }
    });
}

function startPoemSequence() {
    const poemView = document.querySelector('#opening-poem');
    const lines = $$('.poem-line-main, .poem-line-source', poemView);

    // Stage 1: Fade in lines sequentially
    lines.forEach((line, i) => {
        line.style.opacity = '0';
        line.style.animation = 'none';
        line.offsetHeight; // force reflow
        line.style.animation = `poem-fade-in 800ms var(--ease-out-expo) forwards`;
        line.style.animationDelay = `${i * POEM_LINE_DELAY}ms`;
    });

    const totalFadeIn = (lines.length - 1) * POEM_LINE_DELAY + 800;

    // Stage 2: Hold, then dissolve
    poemTimer = setTimeout(() => {
        poemView.style.animation = 'poem-curtain-dissolve 600ms var(--ease-out-expo) forwards';

        poemView.addEventListener('animationend', () => {
            appState.isPoemViewed = true;
            appState.setView('main');
        }, { once: true });
    }, totalFadeIn + POEM_DISPLAY_DURATION - 600);

    // Safety fallback
    setTimeout(() => {
        if (appState.currentView === 'poem') {
            appState.isPoemViewed = true;
            appState.setView('main');
        }
    }, totalFadeIn + POEM_DISPLAY_DURATION + 1000);
}
