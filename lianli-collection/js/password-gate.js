// ============================================================
// 无色笺 — Password Gate
// ============================================================

import { verifyPassword } from './supabase.js';
import { appState } from './state.js';
import { MAX_PASSWORD_ATTEMPTS, LOCKOUT_DURATION } from './config.js';
import { $ } from './utils.js';

let attemptCount = 0;
let lockoutUntil = null;

export function initPasswordGate() {
    const input = $('#password-input');
    const button = $('#password-submit');
    const errorEl = $('#gate-error');

    button.addEventListener('click', handleSubmit);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSubmit();
    });

    setTimeout(() => input.focus(), 300);
}

async function handleSubmit() {
    const input = $('#password-input');
    const errorEl = $('#gate-error');
    const password = input.value.trim();

    if (!password) {
        showError('请输入密码');
        return;
    }

    if (lockoutUntil && Date.now() < lockoutUntil) {
        const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
        showError(`请等待 ${remaining} 秒后再试`);
        return;
    }

    try {
        const isValid = await verifyPassword(password);

        if (isValid) {
            appState.persistAuth();
            const gate = $('#password-gate');
            gate.style.animation = 'ink-dissolve 800ms ease-out forwards';

            gate.addEventListener('animationend', () => {
                appState.setView('poem');
            }, { once: true });
        } else {
            attemptCount++;
            shakeInput();
            showError('墨色不对，再试一次');

            if (attemptCount >= MAX_PASSWORD_ATTEMPTS) {
                lockoutUntil = Date.now() + LOCKOUT_DURATION;
                attemptCount = 0;
                showError('墨已干涸，请稍候片刻');
            }
        }
    } catch (err) {
        console.error('Password verification error:', err);
        showError('纸短情长，网络未达。请稍后再试');
    }
}

function shakeInput() {
    const input = $('#password-input');
    input.classList.add('anim-shake');
    input.addEventListener('animationend', () => {
        input.classList.remove('anim-shake');
    }, { once: true });
}

function showError(message) {
    const el = $('#gate-error');
    el.textContent = message;
    el.classList.add('visible');
    if (el._timeout) clearTimeout(el._timeout);
    el._timeout = setTimeout(() => el.classList.remove('visible'), 3000);
}
