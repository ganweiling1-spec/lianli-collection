// ============================================================
// 无色笺 — Modal Dialog Component
// ============================================================

/**
 * Show a modal dialog.
 * @param {object} options
 * @param {string} options.title - modal title
 * @param {string|HTMLElement} options.content - body content
 * @param {Array<{text:string, class:string, callback:function}>} options.buttons
 * @param {boolean} options.closeOnBackdrop - dismiss on backdrop click
 * @returns {HTMLElement} the modal element
 */
export function showModal({ title = '', content = '', buttons = [], closeOnBackdrop = true }) {
    // Remove any existing modal
    closeModal();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay anim-fade-in-up';
    overlay.innerHTML = `
        <div class="modal-sheet">
            ${title ? `<h3 class="modal-title">${title}</h3>` : ''}
            <div class="modal-body"></div>
            <div class="modal-actions"></div>
        </div>
    `;

    // Set content
    const body = overlay.querySelector('.modal-body');
    if (typeof content === 'string') {
        body.innerHTML = content;
    } else {
        body.appendChild(content);
    }

    // Set buttons
    const actions = overlay.querySelector('.modal-actions');
    buttons.forEach(btn => {
        const el = document.createElement('button');
        el.className = `modal-btn ${btn.class || ''}`;
        el.textContent = btn.text;
        el.addEventListener('click', () => {
            btn.callback?.();
            closeModal();
        });
        actions.appendChild(el);
    });

    // Backdrop click
    if (closeOnBackdrop) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });
    }

    document.body.appendChild(overlay);
    return overlay;
}

/**
 * Close and remove the current modal.
 */
export function closeModal() {
    const existing = document.querySelector('.modal-overlay');
    if (existing) {
        existing.style.opacity = '0';
        existing.style.transition = 'opacity 200ms';
        setTimeout(() => existing.remove(), 200);
    }
}

/**
 * Show a confirmation dialog.
 * @returns {Promise<boolean>}
 */
export function confirmDialog(title, message) {
    return new Promise((resolve) => {
        showModal({
            title,
            content: `<p style="text-align:center;color:var(--text-secondary)">${message}</p>`,
            buttons: [
                { text: '取消', class: 'btn-ghost', callback: () => resolve(false) },
                { text: '确认', class: 'btn-danger', callback: () => resolve(true) },
            ],
        });
    });
}
