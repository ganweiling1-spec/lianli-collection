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

    // Sync tab bar on scroll
    scrollContainer.addEventListener('scroll', throttle(() => {
        syncActiveTab();
    }, 100), { passive: true });

    // Bottom tab bar click to navigate
    $$('.tab-item').forEach(tab => {
        tab.addEventListener('click', () => {
            const index = parseInt(tab.dataset.space);
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

    setTimeout(() => {
        scrollContainer.style.scrollBehavior = '';
    }, SCROLL_SNAP_DURATION);

    if (appState.currentSpace !== index) {
        appState.currentSpace = index;
    }

    syncActiveTab();
}

function syncActiveTab() {
    if (!scrollContainer) return;
    const panelWidth = scrollContainer.clientWidth;
    const currentIndex = Math.round(scrollContainer.scrollLeft / panelWidth);

    $$('.tab-item').forEach((tab, i) => {
        tab.classList.toggle('active', i === currentIndex);
    });

    // Show/hide FAB buttons based on current space
    const fabs = document.querySelectorAll('.ink-drop-fab');
    fabs.forEach((fab, i) => {
        const spacePanel = fab.closest('.space-panel');
        if (spacePanel) {
            const spaceIndex = parseInt(spacePanel.dataset.space);
            fab.style.display = spaceIndex === currentIndex ? '' : 'none';
        }
    });
}
