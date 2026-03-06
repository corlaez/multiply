/**
 * store.js
 * Handles data persistence in localStorage.
 */

const STORAGE_KEY = 'multiply_app_data';

const defaultState = {
    version: 1,
    settings: {
        theme: 'dark',
        language: 'en',
        gridSize: 12
    },
    // Progress for reports/stats { '3x4': { status: 'mastered', ... } }
    progress: {},
    // Spaced repetition flashcards data
    flashcards: {}
};

/**
 * Validates and retrieves the state from localStorage.
 */
function getState() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            // Handle future migrations here based on parsed.version
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

    getFlashcard(factKey) {
        const state = getState();
        return state.flashcards[factKey] || null;
    },

    saveFlashcard(factKey, cardData) {
        const state = getState();
        state.flashcards[factKey] = cardData;
        saveState(state);
    },

    getAllFlashcards() {
        return getState().flashcards;
    },

    saveProgress(factKey, status, extraData = {}) {
        const state = getState();
        if (!state.progress[factKey]) {
            state.progress[factKey] = {
                status: 'new', // new, learning, mastered
                totalReviews: 0,
                correctCount: 0,
                incorrectCount: 0
            };
        }

        const p = state.progress[factKey];
        p.totalReviews += 1;
        if (status === 'correct') {
            p.correctCount += 1;
        } else {
            p.incorrectCount += 1;
        }

        // Simple mastery heuristic for heatmap: 
        // 5 consecutive correct or high ratio
        if (p.correctCount > 5 && (p.correctCount / (p.correctCount + p.incorrectCount)) > 0.8) {
            p.status = 'mastered';
        } else {
            p.status = 'learning';
        }

        saveState(state);
    },

    getProgress() {
        return getState().progress;
    },

    resetAllData() {
        localStorage.removeItem(STORAGE_KEY);
    }
};
