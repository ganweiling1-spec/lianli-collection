// ============================================================
// 无色笺 — Bamboo Scroll (竹帘横滚)
// ============================================================

import { appState } from './state.js';
import { SCROLL_SNAP_DURATION } from './config.js';
import { $, $$, isTouchDevice, throttle } from './utils.js';

let scrollContainer = null;
let isDragging = false;
let startX = 0;
let startScrollLeft = 0;
let velocity = 0;
let lastX = 0;
let lastTime = 0;
let momentumRaf = null;

export function initBambooScroll() {
    scrollContainer = $('#bamboo-scroll');
    if (!scrollContainer) return;

    const isTouch = isTouchDevice();

    if (isTouch) {
        scrollContainer.addEventListener('touchstart', onDragStart, { passive: false });
        scrollContainer.addEventListener('touchmove', onDragMove, { passive: false });
        scrollContainer.addEventListener('touchend', onDragEnd);
    } else {
        scrollContainer.addEventListener('mousedown', onDragStart);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onDragEnd);
    }

    // Sync dots on scroll
    scrollContainer.addEventListener('scroll', throttle(() => {
        syncActiveDot();
    }, 100), { passive: true });

    // Dot click to navigate
    $$('.space-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            const index = parseInt(dot.dataset.index);
            snapTo(index);
        });
    });

    // Listen for space-changed events (programmatic navigation)
    window.addEventListener('space-changed', (e) => {
        snapTo(e.detail.spaceIndex);
    });
}

function onDragStart(e) {
    isDragging = true;
    startX = e.touches ? e.touches[0].clientX : e.clientX;
    startScrollLeft = scrollContainer.scrollLeft;
    lastX = startX;
    lastTime = Date.now();
    velocity = 0;

    if (momentumRaf) {
        cancelAnimationFrame(momentumRaf);
        momentumRaf = null;
    }
}

function onMouseMove(e) {
    if (!isDragging) return;
    onDragMove(e);
}

function onDragMove(e) {
    if (!isDragging) return;

    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const now = Date.now();
    const dx = x - startX;
    const panelWidth = scrollContainer.clientWidth;

    // Detect if predominantly vertical scroll (let native scroll handle it)
    if (e.touches && Math.abs(x - lastX) < Math.abs(e.touches[0].clientY - (e._lastY || 0))) {
        return;
    }

    if (e.touches && e.cancelable) {
        // Only prevent default for horizontal swipes
        if (Math.abs(dx) > 10) {
            e.preventDefault();
        }
    }

    scrollContainer.scrollLeft = startScrollLeft - dx;

    // Track velocity
    const dt = now - lastTime;
    if (dt > 0) {
        velocity = (x - lastX) / dt;
    }
    lastX = x;
    lastTime = now;

    if (e.touches) {
        e._lastY = e.touches[0].clientY;
    }
}

function onDragEnd() {
    if (!isDragging) return;
    isDragging = false;

    // Apply momentum
    const absVelocity = Math.abs(velocity);
    if (absVelocity > 0.2) {
        const panelWidth = scrollContainer.clientWidth;
        const momentumDistance = velocity * 150;
        const targetScroll = scrollContainer.scrollLeft - momentumDistance;

        // Snap to nearest panel
        const targetIndex = Math.round(targetScroll / panelWidth);
        snapTo(Math.max(0, Math.min(2, targetIndex)));
    }

    // Always snap to nearest on release
    const panelWidth = scrollContainer.clientWidth;
    const nearestIndex = Math.round(scrollContainer.scrollLeft / panelWidth);
    snapTo(Math.max(0, Math.min(2, nearestIndex)));
}

/**
 * Snap to a specific space panel by index.
 */
export function snapTo(index) {
    if (!scrollContainer) return;

    const panelWidth = scrollContainer.clientWidth;
    const targetScroll = index * panelWidth;

    scrollContainer.style.scrollBehavior = 'smooth';
    scrollContainer.scrollLeft = targetScroll;

    // Reset scroll behavior after animation
    setTimeout(() => {
        scrollContainer.style.scrollBehavior = '';
    }, SCROLL_SNAP_DURATION);

    // Update state if needed
    if (appState.currentSpace !== index) {
        appState.currentSpace = index;
    }

    syncActiveDot();
    updateTopPoem(index);
}

function syncActiveDot() {
    const panelWidth = scrollContainer.clientWidth;
    const currentIndex = Math.round(scrollContainer.scrollLeft / panelWidth);

    $$('.space-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === currentIndex);
    });
}

function updateTopPoem(index) {
    const poemText = $('#top-poem-text');
    const poemSubtext = $('#top-poem-subtext');
    if (!poemText) return;

    const poems = [
        '应怜屐齿印苍苔',
        '风乍起，吹皱一池春水',
        '如人饮水，冷暖共知',
    ];
    const subtexts = [
        '展齿苍苔',
        '春水温澜',
        '冷暖共知',
    ];

    // Fade transition
    poemText.style.transition = 'opacity 300ms var(--ease-out-expo)';
    poemText.style.opacity = '0';

    setTimeout(() => {
        poemText.textContent = poems[index] || poems[0];
        poemSubtext.textContent = subtexts[index] || subtexts[0];
        poemText.style.opacity = '1';
    }, 300);
}
