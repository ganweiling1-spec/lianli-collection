// ============================================================
// 无色笺 — Modal Dialog Component
// ============================================================

export function showModal({ title = '', content = '', buttons = [], closeOnBackdrop = true }) {
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

    const body = overlay.querySelector('.modal-body');
    if (typeof content === 'string') {
        body.innerHTML = content;
    } else {
        body.appendChild(content);
    }

    const actions = overlay.querySelector('.modal-actions');
    buttons.forEach(btn => {
        const el = document.createElement('button');
        el.className = `modal-btn ${btn.class || ''}`;
        el.textContent = btn.text;
        el.addEventListener('click', async () => {
            if (btn.callback) {
                try { await btn.callback(); } catch (e) { console.error('Modal callback error:', e); }
            }
            closeModal();
        });
        actions.appendChild(el);
    });

    if (closeOnBackdrop) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });
    }

    document.body.appendChild(overlay);
    return overlay;
}

export function closeModal() {
    const existing = document.querySelector('.modal-overlay');
    if (existing) {
        existing.style.opacity = '0';
        existing.style.transition = 'opacity 200ms';
        setTimeout(() => existing.remove(), 200);
    }
}

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
