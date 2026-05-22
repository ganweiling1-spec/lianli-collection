// ============================================================
// 无色笺 — Easter Eggs (彩蛋系统)
// ============================================================

import { fetchScrollContent } from './supabase.js';
import { appState } from './state.js';
import { $ } from './utils.js';

const TRIPLE_CLICK_WINDOW = 800; // ms
let clickCount = 0;
let clickTimer = null;
let scrollRevealed = false;

export function initEasterEggs() {
    // Triple-click on top poem bar to reveal scroll
    const poemBar = $('#top-poem-bar');
    if (poemBar) {
        poemBar.addEventListener('click', (e) => {
            handleTopPoemClick(e);
        });
    }

    // Click on overlay to dismiss scroll
    const overlay = $('#hidden-scroll');
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                hideScroll();
            }
        });

        // Also dismiss on click of the scroll paper itself (anywhere on paper)
        const paper = $('#scroll-paper');
        if (paper) {
            paper.addEventListener('click', (e) => {
                e.stopPropagation();
                hideScroll();
            });
        }
    }

    // Load scroll content when entering main view
    window.addEventListener('view-changed', (e) => {
        if (e.detail.view === 'main') {
            preloadScrollContent();
        }
    });
}

function handleTopPoemClick(e) {
    // Prevent triggering when user is interacting with other elements
    if (e.target.closest('.space-dot') || e.target.closest('button')) return;

    clickCount++;
    if (clickTimer) clearTimeout(clickTimer);

    if (clickCount >= 3) {
        clickCount = 0;
        if (!scrollRevealed) {
            revealScroll();
        }
        return;
    }

    clickTimer = setTimeout(() => {
        clickCount = 0;
    }, TRIPLE_CLICK_WINDOW);
}

async function preloadScrollContent() {
    if (appState.scrollContent) return;

    try {
        const data = await fetchScrollContent();
        appState.scrollContent = data;
    } catch (err) {
        // Use fallback content
        appState.scrollContent = {
            title: '岁序无言，纸短情长',
            summary: '春去秋来，冷暖共知。\n愿每一次打开，都像翻开一页未读完的诗。',
            cover_date: '乙巳年 夏',
            seal_text: '无色笺',
        };
    }
}

async function revealScroll() {
    if (scrollRevealed) return;
    scrollRevealed = true;
    appState.isScrollRevealed = true;

    // Ensure content is loaded
    if (!appState.scrollContent) {
        await preloadScrollContent();
    }

    const overlay = $('#hidden-scroll');
    const paper = $('#scroll-paper');
    const textEl = $('#scroll-text');
    const sealEl = paper ? paper.querySelector('.scroll-seal-stamp') : null;

    if (!overlay || !paper || !textEl) return;

    // Populate scroll text
    const content = appState.scrollContent;
    textEl.textContent = content.summary || '';

    // Reset animations
    paper.style.animation = 'none';
    paper.offsetHeight; // reflow
    paper.classList.add('anim-scroll-unfurl');

    // Show overlay
    overlay.classList.add('visible');

    // Trigger seal stamp after unfurl
    paper.addEventListener('animationend', () => {
        if (sealEl) {
            sealEl.style.animation = 'none';
            sealEl.offsetHeight;
            sealEl.classList.add('anim-seal-stamp');
        }
    }, { once: true });
}

function hideScroll() {
    const overlay = $('#hidden-scroll');
    const paper = $('#scroll-paper');

    if (!overlay) return;

    overlay.classList.remove('visible');

    // Reset for next reveal
    setTimeout(() => {
        if (paper) {
            paper.classList.remove('anim-scroll-unfurl');
            const sealEl = paper.querySelector('.scroll-seal-stamp');
            if (sealEl) {
                sealEl.classList.remove('anim-seal-stamp');
            }
        }
    }, 500);

    scrollRevealed = false;
    appState.isScrollRevealed = false;
}
