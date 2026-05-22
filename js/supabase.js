// ============================================================
// 无色笺 — Supabase Client & API Wrappers
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
    return data; // boolean
}

// --- Moments (展齿苍苔) ---

export async function fetchMoments() {
    const { data, error } = await supabase
        .from('moments')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('recorded_date', { ascending: false });
    if (error) throw error;
    return data;
}

// --- Love Notes (春水温澜) ---

export async function fetchLoveNotes() {
    const { data, error } = await supabase
        .from('love_notes')
        .select('*')
        .order('sort_order', { ascending: true });
    if (error) throw error;
    return data;
}

// --- Habits (冷暖共知) ---

export async function fetchHabits() {
    const { data, error } = await supabase
        .from('habits')
        .select('*')
        .order('sort_order', { ascending: true });
    if (error) throw error;
    return data;
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

// --- Image URL Helper ---

export function getPublicImageUrl(bucket, path) {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

// --- Audio URL Helper ---

export function getPublicAudioUrl(bucket, path) {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}
