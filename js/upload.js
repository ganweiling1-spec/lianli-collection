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
 * Upload image to Supabase and return the public URL.
 */
export async function handleImageUpload(file, onProgress) {
    onProgress?.('uploading');
    const url = await uploadImage(file);
    onProgress?.('done');
    return url;
}

/**
 * Create a data URL from a blob (for audio preview).
 */
export function blobToDataURL(blob) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
    });
}
