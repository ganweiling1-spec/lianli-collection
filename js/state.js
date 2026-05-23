// ============================================================
// 无色笺 — AppState Singleton
// ============================================================

import { AUTH_SESSION_KEY, SPACE_CONFIG, DEFAULT_NAMES } from './config.js';

class AppState {
    constructor() {
        this.currentView = 'password';  // 'password' | 'poem' | 'main'
        this.currentSpace = 0;          // 0, 1, 2
        this.isAuthenticated = false;
        this.isPoemViewed = false;
        this.isScrollRevealed = false;

        // Voice play tracking (loaded from Supabase on init)
        this.voicePlayedMap = {};

        // Solar term info for today (if applicable)
        this.solarTermToday = null;

        // Data caches
        this.moments = [];
        this.loveNotes = [];
        this.habits = [];
        this.scrollContent = null;

        // Display modes
        this.momentsDisplayMode = 'grid';    // 'grid' | 'timeline'
        this.loveNoteDisplayMode = 'list';   // 'list' | 'sticky' | 'letter' | 'cloud'

        // Custom names
        this.customNames = { her: '她', him: '他' };
        this.loadCustomNames();
    }

    /**
     * Check sessionStorage for existing authentication.
     * @returns {boolean}
     */
    checkExistingAuth() {
        const auth = sessionStorage.getItem(AUTH_SESSION_KEY);
        if (auth === 'true') {
            this.isAuthenticated = true;
            return true;
        }
        return false;
    }

    /**
     * Persist authentication to sessionStorage.
     */
    persistAuth() {
        sessionStorage.setItem(AUTH_SESSION_KEY, 'true');
        this.isAuthenticated = true;
    }

    /**
     * Clear authentication (for logout / password change).
     */
    clearAuth() {
        sessionStorage.removeItem(AUTH_SESSION_KEY);
        this.isAuthenticated = false;
        this.isPoemViewed = false;
    }

    /**
     * Transition to a new view.
     * @param {'password' | 'poem' | 'main'} viewName
     */
    setView(viewName) {
        this.currentView = viewName;

        // Dispatch custom event for modules to react
        window.dispatchEvent(new CustomEvent('view-changed', {
            detail: { view: viewName },
        }));
    }

    /**
     * Switch to a different space within the main view.
     * @param {number} index - 0, 1, or 2
     */
    setSpace(index) {
        if (index === this.currentSpace) return;
        this.currentSpace = index;

        window.dispatchEvent(new CustomEvent('space-changed', {
            detail: { spaceIndex: index },
        }));
    }

    /**
     * Get config for the current space.
     */
    getCurrentSpaceConfig() {
        return SPACE_CONFIG[this.currentSpace] || SPACE_CONFIG[0];
    }

    /**
     * Load custom names from localStorage.
     */
    loadCustomNames() {
        try {
            const saved = localStorage.getItem('lianli_names');
            if (saved) this.customNames = JSON.parse(saved);
        } catch (e) {
            this.customNames = { ...DEFAULT_NAMES };
        }
    }

    /**
     * Save custom names to localStorage.
     */
    saveCustomNames(names) {
        this.customNames = { ...names };
        localStorage.setItem('lianli_names', JSON.stringify(this.customNames));
    }

    /**
     * Get display name for a speaker.
     */
    getSpeakerName(speaker) {
        return this.customNames[speaker] || DEFAULT_NAMES[speaker] || speaker;
    }

    /**
     * Mark a voice note as played (in-memory).
     */
    markVoicePlayed(noteId) {
        this.voicePlayedMap[noteId] = true;
    }

    /**
     * Check if a voice note has been played.
     */
    isVoicePlayed(noteId) {
        return !!this.voicePlayedMap[noteId];
    }
}

// Export singleton instance
export const appState = new AppState();
