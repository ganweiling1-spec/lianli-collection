// ============================================================
// 无色笺 — Word Cloud Renderer (heart-shaped)
// ============================================================

export function renderWordCloud(container, notes) {
    const allText = notes.map(n => n.content).join(' ');
    const words = allText
        .replace(/[，。！？、；：""''「」【】《》（）\s,\.!\?;:'"\[\]\(\)\n\r]+/g, ' ')
        .split(' ')
        .filter(w => w.length >= 1);

    if (words.length === 0) {
        container.innerHTML = '<div class="empty-state">词云无字</div>';
        return;
    }

    const freq = {};
    words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
    const entries = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 50);

    const canvas = document.createElement('canvas');
    const size = Math.min(container.clientWidth || 320, 380);
    canvas.width = size * 2;
    canvas.height = size * 2;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    canvas.style.display = 'block';
    canvas.style.margin = '0 auto';
    container.innerHTML = '';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const scale = canvas.width / 3.2;

    const colors = ['#d4756b', '#c45a4a', '#e89090', '#b84a4a', '#f0a0a0', '#d46060', '#e8b0b0'];
    const maxFreq = entries[0][1];
    const minFreq = entries[entries.length - 1][1];

    const placed = [];

    entries.forEach(([word, count]) => {
        const fontSize = 11 + ((count - minFreq) / Math.max(1, maxFreq - minFreq)) * 22;
        ctx.font = `${fontSize}px "Ma Shan Zheng", "KaiTi", serif`;
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        ctx.globalAlpha = 0.55 + (count / maxFreq) * 0.45;

        const metrics = ctx.measureText(word);
        const w = metrics.width + 6;
        const h = fontSize + 4;

        let x, y, placed_ok = false;
        for (let attempt = 0; attempt < 80; attempt++) {
            const rx = (Math.random() - 0.5) * canvas.width * 0.85;
            const ry = (Math.random() - 0.5) * canvas.height * 0.85;

            // Heart: (x²+y²-1)³ - x²y³ ≤ 0
            const hx = rx / scale;
            const hy = ry / scale;
            const val = Math.pow(hx * hx + hy * hy - 1, 3) - hx * hx * hy * hy * hy;
            if (val > 0) continue;

            x = cx + rx - w / 2;
            y = cy + ry - h / 2 + 20;

            const overlaps = placed.some(p =>
                x < p.x + p.w && x + w > p.x && y < p.y + p.h && y + h > p.y
            );
            if (!overlaps) { placed_ok = true; break; }
        }

        if (placed_ok) {
            placed.push({ x, y, w, h });
            ctx.fillText(word, x, y + fontSize * 0.8);
        }
    });
}
