/**
 * utils.js
 * Shared utility functions for the multiply app.
 */

/**
 * Returns a CSS color string for a given progress state.
 *
 * The 5-state scale is:
 *  - Unseen      : no data at all                   → var(--border-color)
 *  - Struggling  : ratio < 0.33                     → var(--danger)      🔴
 *  - Learning    : ratio 0.33–0.65                  → var(--warning)     🟡
 *  - Near-Mastered: ratio 0.65–0.8 (or bucket >= 3) → #fde047            💛
 *  - Mastered    : status === 'mastered'             → var(--success)    🟢
 *
 * @param {object|null} p          - Card object from Store.getCards()[key],
 *                                   shape: { bucket, status, correctCount, incorrectCount, totalReviews }
 * @param {object|null} flashcard  - Optional (same card object) used for bucket fallback when no ratio exists yet.
 * @returns {string} A CSS color value (variable reference or hex string).
 */
export function getProgressColor(p, flashcard = null) {
    // Unseen — no progress data at all
    if (!p) {
        return 'var(--border-color)';
    }

    // Mastered — highest priority check
    if (p.status === 'mastered') {
        return 'var(--success)';
    }

    // Calculate correctness ratio if we have review data
    const total = (p.correctCount || 0) + (p.incorrectCount || 0);
    if (total > 0) {
        const ratio = p.correctCount / total;

        if (ratio >= 0.65) {
            // Near-mastered: doing well but not yet promoted
            return '#d4f700'; // chartreuse-yellow — clearly "almost green" but not green
        } else if (ratio >= 0.33) {
            // Learning: some correct answers
            return 'var(--warning)';
        } else {
            // Struggling: failing more than succeeding
            return 'var(--danger)';
        }
    }

    // No ratio data yet — fall back to flashcard bucket as a signal
    if (flashcard !== null && flashcard.bucket !== undefined) {
        const bucket = flashcard.bucket;
        if (bucket >= 3) return '#d4f700';       // Near-mastered
        if (bucket === 2) return 'var(--warning)'; // Learning
        if (bucket === 1) return 'var(--danger)';  // Struggling (came back from wrong)
    }

    // Seen but no meaningful data yet — treat as "just started"
    return 'var(--warning)';
}
