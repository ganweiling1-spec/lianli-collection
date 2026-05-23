// ============================================================
// 无色笺 — Utility Functions
// ============================================================

/**
 * Debounce a function call.
 */
export function debounce(fn, delay = 300) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

/**
 * Throttle a function call.
 */
export function throttle(fn, limit = 100) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            fn.apply(this, args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}

/**
 * Get element by selector with optional parent.
 */
export function $(selector, parent = document) {
    return parent.querySelector(selector);
}

/**
 * Get all elements by selector.
 */
export function $$(selector, parent = document) {
    return [...parent.querySelectorAll(selector)];
}

/**
 * Format a Date object or ISO string to "YYYY年M月D日".
 */
export function formatDate(dateInput) {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return '';
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

/**
 * Create an HTML element from attributes.
 */
export function createElement(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    for (const [key, val] of Object.entries(attrs)) {
        if (key === 'className') {
            el.className = val;
        } else if (key === 'dataset') {
            Object.assign(el.dataset, val);
        } else if (key.startsWith('on') && typeof val === 'function') {
            el.addEventListener(key.slice(2).toLowerCase(), val);
        } else {
            el.setAttribute(key, val);
        }
    }
    for (const child of children) {
        if (typeof child === 'string') {
            el.appendChild(document.createTextNode(child));
        } else if (child instanceof Node) {
            el.appendChild(child);
        }
    }
    return el;
}

/**
 * Detect if the device supports touch.
 */
export function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Escape HTML to prevent XSS.
 */
export function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
