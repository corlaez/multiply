/**
 * store.js
 * Handles data persistence in localStorage.
 *
 * Data shape (v2):
 *   cards[key]: { bucket, status, totalReviews, correctCount, incorrectCount }
 *
 * Migration: v1 data (separate `flashcards` + `progress` keys) is merged on first load.
 */

const STORAGE_KEY = 'multiply_app_data';

const defaultState = {
    version: 2,
    settings: {
        theme: 'dark',
        language: null,
        gridSize: 12
    },
    // Unified card records: scheduling + performance in one place
    // { '3x4': { bucket, status, totalReviews, correctCount, incorrectCount } }
    cards: {}
};

/**
 * Validates and retrieves the state from localStorage.
 * Migrates v1 data (separate flashcards + progress) into v2 (unified cards).
 */
function getState() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            const parsed = JSON.parse(data);

            // --- v1 → v2 migration ---
            if (!parsed.cards && (parsed.flashcards || parsed.progress)) {
                parsed.cards = {};
                const fc = parsed.flashcards || {};
                const pr = parsed.progress || {};
                const allKeys = new Set([...Object.keys(fc), ...Object.keys(pr)]);
                for (const key of allKeys) {
                    parsed.cards[key] = {
                        bucket: fc[key]?.bucket ?? 0,
                        status: pr[key]?.status ?? 'new',
                        totalReviews: pr[key]?.totalReviews ?? 0,
                        correctCount: pr[key]?.correctCount ?? 0,
                        incorrectCount: pr[key]?.incorrectCount ?? 0,
                    };
                }
                delete parsed.flashcards;
                delete parsed.progress;
                parsed.version = 2;
                // Persist migration immediately
                saveState({ ...defaultState, ...parsed });
            }

            return { ...defaultState, ...parsed };
        }
    } catch (e) {
        console.error("Error reading from localStorage:", e);
    }
    return JSON.parse(JSON.stringify(defaultState));
}

/**
 * Saves the given state to localStorage.
 */
function saveState(state) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        console.error("Error writing to localStorage:", e);
    }
}

export const Store = {
    get() {
        return getState();
    },

    setSettings(newSettings) {
        const state = getState();
        state.settings = { ...state.settings, ...newSettings };
        saveState(state);
    },

    getSettings() {
        return getState().settings;
    },

    // -------------------------------------------------------------------------
    // Unified card API
    // -------------------------------------------------------------------------

    /**
     * Returns all card records keyed by fact key (e.g. '3x4').
     * Each record: { bucket, status, totalReviews, correctCount, incorrectCount }
     */
    getCards() {
        return getState().cards;
    },

    /**
     * Returns the card record for a single fact key, or null if unseen.
     */
    getCard(factKey) {
        return getState().cards[factKey] || null;
    },

    /**
     * Merges the provided data into the card record for factKey.
     * Use this to update the bucket directly (e.g. after rating).
     */
    saveCard(factKey, data) {
        const state = getState();
        state.cards[factKey] = { ...(state.cards[factKey] || {}), ...data };
        saveState(state);
    },

    /**
     * Records a rating result for a fact key.
     * Updates bucket (scheduling) and correctCount/incorrectCount/status (performance).
     *
     * @param {string} factKey   - e.g. '3x4'
     * @param {number} quality   - 1=Again, 3=Hard, 4=Good, 5=Easy
     */
    rateCard(factKey, quality) {
        const state = getState();
        if (!state.cards[factKey]) {
            state.cards[factKey] = {
                bucket: 0, status: 'new', totalReviews: 0, correctCount: 0, incorrectCount: 0
            };
        }

        const card = state.cards[factKey];

        // Update scheduling bucket
        if (quality === 1) card.bucket = 1; // Again
        else if (quality === 3) card.bucket = 2; // Hard
        else if (quality === 4) card.bucket = 3; // Good
        else if (quality === 5) card.bucket = 4; // Easy

        // Update performance counters
        card.totalReviews += 1;
        const isCorrect = quality >= 4;
        if (isCorrect) {
            card.correctCount += 1;
        } else {
            card.incorrectCount += 1;
        }

        // Mastery heuristic: 5+ correct answers with >80% accuracy
        if (card.correctCount > 5 &&
            (card.correctCount / (card.correctCount + card.incorrectCount)) > 0.8) {
            card.status = 'mastered';
        } else {
            card.status = 'learning';
        }

        saveState(state);
        return card;
    },

    // -------------------------------------------------------------------------
    // UI state persistence
    // -------------------------------------------------------------------------

    getActiveView() {
        return getState().activeView || 'flashcards';
    },

    setActiveView(viewName) {
        const state = getState();
        state.activeView = viewName;
        saveState(state);
    },

    getActiveToggles() {
        const state = getState();
        return state.activeToggles || null;
    },

    setActiveToggles(arr) {
        const state = getState();
        state.activeToggles = arr;
        saveState(state);
    },

    getGridValues() {
        return getState().gridValues || {};
    },

    setGridValue(row, col, value) {
        const state = getState();
        if (!state.gridValues) state.gridValues = {};
        const key = `${row}x${col}`;
        if (value === '' || value == null) {
            delete state.gridValues[key];
        } else {
            state.gridValues[key] = value;
        }
        saveState(state);
    },

    clearGridValues() {
        const state = getState();
        state.gridValues = {};
        saveState(state);
    },

    resetAllData() {
        localStorage.removeItem(STORAGE_KEY);
    }
};
