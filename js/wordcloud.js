// ============================================================
// 无色笺 — Word Cloud Renderer
// ============================================================

/**
 * Simple word cloud using Canvas.
 * Extracts words, sizes by frequency, renders with random colors.
 */
export function renderWordCloud(container, notes) {
    // Collect all words
    const allText = notes.map(n => n.content).join(' ');
    const words = allText
        .replace(/[，。！？、；：""''「」【】《》（）\s,\.!\?;:'"\[\]\(\)\n\r]+/g, ' ')
        .split(' ')
        .filter(w => w.length >= 1)
        .slice(0, 80);

    if (words.length === 0) {
        container.innerHTML = '<div class="empty-state">词云无字<br><span style="font-size:0.75rem">添加更多情话来生成词云</span></div>';
        return;
    }

    // Count frequencies
    const freq = {};
    words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
    const entries = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 50);

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = container.clientWidth || 320;
    canvas.height = Math.min(400, entries.length * 18 + 100);
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    container.innerHTML = '';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const colors = ['#c45a4a', '#3a3a3a', '#7a9e6b', '#b8844a', '#5a7a9e', '#9e7a6b', '#4a7a9e'];
    const maxFreq = entries[0][1];
    const minFreq = entries[entries.length - 1][1];

    // Simple placement: random positions, avoid overlap
    const placed = [];
    entries.forEach(([word, count]) => {
        const size = 12 + ((count - minFreq) / Math.max(1, maxFreq - minFreq)) * 28;
        ctx.font = `${size}px "Ma Shan Zheng", "KaiTi", serif`;
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        ctx.globalAlpha = 0.5 + (count / maxFreq) * 0.5;

        // Try to place without overlap
        let x, y, attempts = 0;
        const metrics = ctx.measureText(word);
        const w = metrics.width + 8;
        const h = size + 4;
        do {
            x = Math.random() * (canvas.width - w);
            y = Math.random() * (canvas.height - h) + h;
            attempts++;
        } while (attempts < 50 && placed.some(p =>
            x < p.x + p.w && x + w > p.x && y < p.y + p.h && y + h > p.y
        ));

        placed.push({ x, y, w, h, word });
        ctx.fillText(word, x + 4, y);
    });
}
