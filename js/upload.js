// ============================================================
// 无色笺 — Upload Utilities
// ============================================================

import { uploadImage, uploadAudio } from './supabase.js';

/**
 * Open file picker for images, return selected file + preview.
 */
export function pickImage() {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/jpeg,image/png,image/webp,image/avif';
        input.onchange = () => {
            const file = input.files[0];
            if (!file) return reject(new Error('No file selected'));
            if (file.size > 10 * 1024 * 1024) {
                return reject(new Error('图片不能超过 10MB'));
            }
            const previewUrl = URL.createObjectURL(file);
            resolve({ file, previewUrl });
        };
        input.click();
    });
}

/**
 * Upload image to Supabase and return the storage path.
 */
export async function handleImageUpload(file, onProgress) {
    onProgress?.('uploading');
    const path = await uploadImage(file);
    onProgress?.('done');
    return path;
}

/**
 * Convert a blob to a data URL (for audio preview).
 */
export function blobToDataURL(blob) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
    });
}

/**
 * Diagnostic: check if Supabase storage is properly configured.
 * Call from browser console: import('./js/upload.js').then(m => m.diagnoseStorage().then(r => console.log(r.join('\n'))))
 */
export async function diagnoseStorage() {
    const SUPABASE_URL = 'https://dstvhnsoxbltzloiwbqv.supabase.co';
    const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzdHZobnNveGJsdHpsb2l3YnF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MTM1MDgsImV4cCI6MjA5NDk4OTUwOH0.m1YcrmhzYhGezLdR3J_q7X7NtvmxfXA8OXyRAp_kexk';

    const log = (...args) => { results.push(args.join(' ')); console.log(...args); };
    const results = [];
    let bucketName = null;

    // === 1. Supabase connectivity ===
    log('━━━ 1. Supabase 连接 ━━━');
    try {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/`, { headers: { apikey: ANON_KEY } });
        log(`  REST API: ${r.ok ? 'OK ✓' : 'FAIL ✗ (' + r.status + ')'}`);
    } catch (e) {
        log(`  REST API: 失败 ✗ (${e.message})`);
    }

    // === 2. List buckets ===
    log('━━━ 2. Storage Buckets ━━━');
    try {
        const r = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
            headers: { Authorization: `Bearer ${ANON_KEY}` }
        });
        if (r.ok) {
            const buckets = await r.json();
            if (buckets.length) {
                for (const b of buckets) {
                    log(`  ${b.name}: public=${b.public}, owner=${b.owner || '(none)'}, file_size_limit=${b.file_size_limit || '(none)'}`);
                    if (b.name === 'moments-images' || b.name === 'voice-recordings') {
                        bucketName = b.name;
                    }
                }
                if (!buckets.find(b => b.name === 'moments-images')) {
                    log('  ⚠ moments-images bucket 不存在！');
                }
                if (!buckets.find(b => b.name === 'voice-recordings')) {
                    log('  ⚠ voice-recordings bucket 不存在！');
                }
            } else {
                log('  ⚠ 没有任何 bucket！需要运行 fix-all-policies.sql');
            }
        } else {
            log(`  列出 buckets 失败: ${r.status} ${await r.text()}`);
        }
    } catch (e) {
        log(`  列出 buckets 失败: ${e.message}`);
    }

    // === 3. Check table RLS (SELECT) ===
    log('━━━ 3. 表 RLS (SELECT) ━━━');
    const tables = ['moments', 'love_notes', 'habits'];
    for (const table of tables) {
        try {
            const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=id&limit=1`, {
                headers: { apikey: ANON_KEY }
            });
            log(`  ${table} SELECT: ${r.ok ? 'OK ✓' : 'FAIL ✗ (' + r.status + ')'}`);
        } catch (e) {
            log(`  ${table} SELECT: 失败 ✗ (${e.message})`);
        }
    }

    // === 4. Check table RLS (INSERT) ===
    log('━━━ 4. 表 RLS (INSERT) ━━━');
    for (const table of tables) {
        try {
            const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
                method: 'POST',
                headers: { apikey: ANON_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
                body: JSON.stringify({ title: '__diagnostic_test__', content: '__test__', speaker: 'her', recorded_date: '2025-01-01' }),
            });
            const text = await r.text();
            if (r.ok || r.status === 201) {
                log(`  ${table} INSERT: OK ✓ (可能需要手动删除测试记录)`);
            } else {
                log(`  ${table} INSERT: FAIL ✗ (${r.status}) — ${text.slice(0, 120)}`);
            }
        } catch (e) {
            log(`  ${table} INSERT: 失败 ✗ (${e.message})`);
        }
    }

    // === 5. Storage upload test ===
    log('━━━ 5. Storage 上传测试 ━━━');
    if (!bucketName && !(bucketName = 'moments-images')) {
        // Try with explicit bucket name
    }
    const testBucket = 'moments-images';
    const testBlob = new Blob(['test'], { type: 'image/png' });
    const testFile = new File([testBlob], 'diagnostic-test.png', { type: 'image/png' });
    const testPath = `_diagnostic_/${Date.now()}.png`;

    try {
        const form = new FormData();
        form.append('file', testFile);
        const r = await fetch(`${SUPABASE_URL}/storage/v1/object/${testBucket}/${testPath}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${ANON_KEY}` },
            body: form,
        });
        if (r.ok) {
            log(`  ${testBucket} 上传测试: OK ✓`);
            log(`  → 公开访问: ${SUPABASE_URL}/storage/v1/object/public/${testBucket}/${testPath}`);
            // Cleanup
            await fetch(`${SUPABASE_URL}/storage/v1/object/${testBucket}/${testPath}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${ANON_KEY}` },
            });
            log('  → 测试文件已清理');
        } else {
            const err = await r.text();
            log(`  ${testBucket} 上传测试: FAIL ✗ (${r.status}) — ${err.slice(0, 200)}`);
        }
    } catch (e) {
        log(`  ${testBucket} 上传测试: 失败 ✗ (${e.message})`);
    }

    // === 6. Public access check ===
    log('━━━ 6. Bucket 公开访问 ━━━');
    for (const name of ['moments-images', 'voice-recordings']) {
        try {
            const r = await fetch(`${SUPABASE_URL}/storage/v1/bucket/${name}`, {
                headers: { Authorization: `Bearer ${ANON_KEY}` }
            });
            if (r.ok) {
                const info = await r.json();
                log(`  ${name}: public=${info.public}, 文件数=${info.bytes ? '有数据' : '(未知)'}`);
            } else {
                log(`  ${name}: 获取信息失败 (${r.status})`);
            }
        } catch (e) {
            log(`  ${name}: 请求失败 (${e.message})`);
        }
    }

    log('━━━ 诊断完成 ━━━');
    log('如果上传测试 FAIL，确认已在 Supabase SQL Editor 中运行了:');
    log('  supabase/fix-all-policies.sql');
    log('文件路径: ' + (typeof window !== 'undefined' ? window.location.origin : '') + '/supabase/fix-all-policies.sql');

    return results;
}
