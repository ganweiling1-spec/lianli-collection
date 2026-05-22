// ============================================================
// 无色笺 — Audio Recording
// ============================================================

import { uploadAudio } from './supabase.js';
import { VOICE_MAX_DURATION } from './config.js';

let mediaRecorder = null;
let audioChunks = [];
let stream = null;

/**
 * Start recording audio from the microphone.
 * @param {function} onStateChange - callback(state: 'recording'|'stopped')
 * @returns {Promise<void>}
 */
export async function startRecording(onStateChange) {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : 'audio/webm';

        mediaRecorder = new MediaRecorder(stream, { mimeType });
        audioChunks = [];

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) audioChunks.push(e.data);
        };

        mediaRecorder.onstart = () => onStateChange?.('recording');

        mediaRecorder.onstop = () => {
            onStateChange?.('stopped');
            stopStream();
        };

        mediaRecorder.start();

        // Auto-stop after max duration
        setTimeout(() => {
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                stopRecording();
            }
        }, VOICE_MAX_DURATION * 1000);
    } catch (err) {
        console.error('Microphone access denied:', err);
        throw new Error('无法访问麦克风');
    }
}

/**
 * Stop recording and return the audio blob + upload URL.
 * @returns {Promise<{blob: Blob, url: string}>}
 */
export async function stopRecording() {
    return new Promise((resolve, reject) => {
        if (!mediaRecorder || mediaRecorder.state === 'inactive') {
            return reject(new Error('没有正在进行的录音'));
        }

        mediaRecorder.onstop = async () => {
            stopStream();
            const blob = new Blob(audioChunks, { type: 'audio/webm' });
            try {
                const url = await uploadAudio(blob);
                resolve({ blob, url });
            } catch (err) {
                reject(err);
            }
        };

        mediaRecorder.stop();
    });
}

function stopStream() {
    if (stream) {
        stream.getTracks().forEach(t => t.stop());
        stream = null;
    }
}

/**
 * Check if recording is active.
 */
export function isRecording() {
    return mediaRecorder && mediaRecorder.state === 'recording';
}

/**
 * Get recording duration in seconds.
 */
export function getRecordingDuration() {
    return audioChunks.length > 0 ? audioChunks.length * 0.1 : 0; // approximate
}
