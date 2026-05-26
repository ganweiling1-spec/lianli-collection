// ============================================================
// 无色笺 — Supabase Client & API Wrappers (v2)
// ============================================================

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Password Verification ---

export async function verifyPassword(password) {
    const { data, error } = await supabase.rpc('verify_password', {
        input_password: password,
    });
    if (error) throw error;
    return data;
}

// --- Generic CRUD ---

export async function fetchAll(table, orderCol = 'sort_order', ascending = true) {
    const { data, error } = await supabase
        .from(table)
        .select('*')
        .order(orderCol, { ascending });
    if (error) throw error;
    return data;
}

export async function insertRecord(table, record) {
    const { data, error } = await supabase
        .from(table)
        .insert(record)
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function updateRecord(table, id, updates) {
    const { data, error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function deleteRecord(table, id) {
    const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);
    if (error) throw error;
}

// --- Specific fetchers (kept for backward compat) ---

export async function fetchMoments() {
    return fetchAll('moments', 'sort_order', true);
}

export async function fetchLoveNotes() {
    return fetchAll('love_notes', 'sort_order', true);
}

export async function fetchHabits() {
    return fetchAll('habits', 'sort_order', true);
}

// --- Voice Play Tracking ---

export async function checkVoicePlayed(noteId) {
    const { data, error } = await supabase.rpc('get_voice_play_count', {
        note_id: noteId,
    });
    if (error) throw error;
    return data > 0;
}

export async function recordVoicePlay(noteId) {
    const { error } = await supabase.rpc('record_voice_play', {
        note_id: noteId,
    });
    if (error) throw error;
}

// --- Scroll Content ---

export async function fetchScrollContent() {
    const { data, error } = await supabase
        .from('scroll_content')
        .select('*')
        .single();
    if (error) throw error;
    return data;
}

// --- Storage: Upload ---

export async function uploadFile(bucket, filePath, file) {
    const form = new FormData();
    form.append('file', file);
    const r = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${filePath}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        body: form,
    });
    if (!r.ok) {
        const text = await r.text();
        throw new Error(text || `Upload failed with status ${r.status}`);
    }
    return await r.json();
}

export async function uploadImage(file) {
    const timestamp = Date.now();
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `moments/${timestamp}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    await uploadFile('moments-images', path, file);
    return path; // return just the storage path
}

export async function uploadAudio(blob) {
    const timestamp = Date.now();
    const path = `voices/${timestamp}_${Math.random().toString(36).slice(2, 8)}.webm`;
    await uploadFile('voice-recordings', path, blob);
    return path; // return just the storage path
}

export async function deleteStorageFile(bucket, path) {
    const r = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });
    if (!r.ok) {
        const text = await r.text();
        throw new Error(text || `Delete failed with status ${r.status}`);
    }
}

// --- URL Helpers ---

export function getPublicImageUrl(bucket, path) {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

export function getPublicAudioUrl(bucket, path) {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

// Export supabase client for direct use
export { supabase };
