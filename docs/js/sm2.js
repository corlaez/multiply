/**
 * sm2.js
 * Implementation of SuperMemo-2 algorithm for spaced repetition.
 */

// Quality score from user:
// 0: Complete blackout (Hard/Failed)
// 1: Incorrect response, but remembered upon seeing answer (Hard/Failed)
// 2: Incorrect response; answer seemed easy to recall (Hard/Failed)
// 3: Correct response recalled with serious difficulty (Hard/Passed - pass threshold)
// 4: Correct response after a hesitation (Good/Passed)
// 5: Perfect response (Easy/Passed)

export const SM2 = {
    /**
     * Calculate the new state of a card after a review.
     * @param {number} quality - User rating 0-5
     * @param {object} card - Current card state { repetitions, easiness, interval, nextDate }
     * @returns {object} The new card state
     */
    review(quality, card = null) {
        let repetitions = 0;
        let easiness = 2.5;
        let interval = 1;

        if (card) {
            repetitions = card.repetitions || 0;
            easiness = card.easiness || 2.5;
            interval = card.interval || 1;
        }

        if (quality >= 3) {
            // Correct response
            if (repetitions === 0) {
                interval = 1;
            } else if (repetitions === 1) {
                interval = 6;
            } else {
                interval = Math.round(interval * easiness);
            }
            repetitions += 1;
        } else {
            // Incorrect response
            repetitions = 0;
            interval = 1;
        }

        // Adjust easiness factor (EF)
        // EF:=EF+(0.1-(5-q)*(0.08-(5-q)*0.02))
        easiness = easiness + (0.1 - (5 - quality) * (0.08 - (5 - quality) * 0.02));

        // Ensure EF is never lower than 1.3
        if (easiness < 1.3) {
            easiness = 1.3;
        }

        // Calculate next review date
        const nextDate = new Date();
        if (quality < 3) {
            // Failed/Again: repeat in 1 minute
            nextDate.setMinutes(nextDate.getMinutes() + 1);
        } else {
            // Passed: schedule in days
            nextDate.setDate(nextDate.getDate() + interval);
            // Set to midnight to avoid time-of-day edge cases for day intervals
            nextDate.setHours(0, 0, 0, 0);
        }

        return {
            repetitions,
            easiness,
            interval,
            nextDate: nextDate.toISOString(),
            lastReviewDate: new Date().toISOString()
        };
    },

    /**
     * Utility to check if a card is due.
     */
    isDue(card) {
        if (!card || !card.nextDate) return true;
        const now = new Date();
        const due = new Date(card.nextDate);
        return now >= due;
    }
};
