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
 * Call from browser console: import('./js/upload.js').then(m => m.diagnoseStorage())
 */
export async function diagnoseStorage() {
    const SUPABASE_URL = 'https://dstvhnsoxbltzloiwbqv.supabase.co';
    const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzdHZobnNveGJsdHpsb2l3YnF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MTM1MDgsImV4cCI6MjA5NDk4OTUwOH0.m1YcrmhzYhGezLdR3J_q7X7NtvmxfXA8OXyRAp_kexk';

    const results = [];

    // 1. Check Supabase connectivity
    try {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/`, { headers: { apikey: ANON_KEY } });
        results.push(`Supabase 连接: ${r.ok ? 'OK' : 'FAIL (' + r.status + ')'}`);
    } catch (e) {
        results.push(`Supabase 连接: 失败 (${e.message})`);
    }

    // 2. List buckets
    try {
        const r = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
            headers: { Authorization: `Bearer ${ANON_KEY}` }
        });
        const buckets = await r.json();
        results.push(`Storage buckets: ${buckets.length ? buckets.map(b => b.name).join(', ') : '(空 — 需要运行 fix-all-policies.sql)'}`);
    } catch (e) {
        results.push(`Storage buckets: 查询失败 (${e.message})`);
    }

    // 3. Check table RLS
    try {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/moments?select=id&limit=1`, {
            headers: { apikey: ANON_KEY }
        });
        results.push(`表 RLS (moments SELECT): ${r.ok ? 'OK' : 'FAIL (' + r.status + ')'}`);
    } catch (e) {
        results.push(`表 RLS: 查询失败 (${e.message})`);
    }

    return results;
}
