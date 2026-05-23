// ============================================================
// 无色笺 — Settings Module (我的笺)
// ============================================================

import { appState } from './state.js';
import { $ } from './utils.js';

export function initSettings() {
    window.addEventListener('view-changed', (e) => {
        if (e.detail.view === 'main') {
            renderSettings();
        }
    });
}

function renderSettings() {
    const container = $('#settings-container');
    if (!container) return;

    const names = appState.customNames;
    container.innerHTML = `
        <div class="settings-form">
            <h3 class="settings-section-title">你们的称呼</h3>
            <p class="settings-hint">自定义"他"和"她"的显示名称</p>
            <label>她的称呼</label>
            <input type="text" id="setting-her" value="${escapeHTML(names.her)}" maxlength="10" placeholder="她">
            <label>他的称呼</label>
            <input type="text" id="setting-him" value="${escapeHTML(names.him)}" maxlength="10" placeholder="他">
            <button class="settings-save-btn" id="settings-save-names">保存称呼</button>
        </div>
        <div class="settings-form">
            <h3 class="settings-section-title">数据备份</h3>
            <p class="settings-hint">导出所有数据为 JSON 文件</p>
            <button class="settings-save-btn" id="settings-export" style="margin-top:0">导出备份</button>
        </div>
        <div class="settings-form">
            <h3 class="settings-section-title">关于</h3>
            <p class="settings-hint">无色笺 v2 · 为你们的第一个纪念日而写<br>2025年6月8日 — 永远</p>
        </div>
    `;

    container.querySelector('#settings-save-names').addEventListener('click', () => {
        const her = container.querySelector('#setting-her').value.trim() || '她';
        const him = container.querySelector('#setting-him').value.trim() || '他';
        appState.saveCustomNames({ her, him });
        // Trigger re-render of all modules to reflect new names
        window.dispatchEvent(new CustomEvent('view-changed', { detail: { view: 'main' } }));
    });

    container.querySelector('#settings-export').addEventListener('click', () => {
        const data = {
            version: '2.0',
            exported_at: new Date().toISOString(),
            moments: appState.moments,
            love_notes: appState.loveNotes,
            habits: appState.habits,
        };
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `无色笺_备份_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert('导出成功');
    });
}

function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
