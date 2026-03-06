/**
 * flashcards.js
 * Handles Spaced Repetition logic and UI.
 */

import { Store } from '../store.js';
import { SM2 } from '../sm2.js';
import { i18n } from '../i18n.js';

export const FlashcardsComponent = {
    init() {
        this.container = document.getElementById('flashcard-container');
        this.dueCountEl = document.getElementById('cards-due-count');
        this.newCountEl = document.getElementById('cards-new-count');
        this.togglesContainer = document.getElementById('flashcard-toggles');

        // Default to all active
        this.activeToggles = new Set([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

        this.lastSeenKey = null;
    },

    onMount() {
        // Called when view becomes active
        this.renderToggles();
        this.loadSession();
    },

    renderToggles() {
        if (!this.togglesContainer) return;
        this.togglesContainer.innerHTML = '';
        const progress = Store.getProgress();

        for (let i = 2; i <= 12; i++) {
            const btn = document.createElement('button');
            btn.className = `toggle-btn ${this.activeToggles.has(i) ? 'active' : ''}`;
            btn.textContent = i;

            // Calculate proficiency overall for this number to color it segment by segment
            let conicStops = [];
            let idx = 0;

            for (let j = 2; j <= 12; j++) {
                const key1 = `${i}x${j}`;
                const key2 = `${j}x${i}`;
                const p1 = progress[key1];
                const p2 = progress[key2];

                let isMastered = false;
                let isLearning = false;

                if (p1 && p1.status === 'mastered') isMastered = true;
                if (p2 && p2.status === 'mastered') isMastered = true;

                if (p1 && p1.status === 'learning') isLearning = true;
                if (p2 && p2.status === 'learning') isLearning = true;

                // Determine segment color
                let color = 'var(--border-color)';
                if (isMastered) color = 'var(--success)';
                else if (isLearning) color = 'var(--warning)';

                let startDeg = (idx * 360) / 11;
                let endDeg = ((idx + 1) * 360) / 11;
                conicStops.push(`${color} ${startDeg}deg ${endDeg}deg`);
                idx++;
            }

            // Apply granular conic gradient
            btn.style.background = `linear-gradient(var(--bg-surface-elevated), var(--bg-surface-elevated)) padding-box, conic-gradient(${conicStops.join(', ')}) border-box`;
            btn.style.borderColor = 'transparent'; // Allows border-box gradient to show through

            btn.addEventListener('click', () => {
                if (this.activeToggles.has(i)) {
                    this.activeToggles.delete(i);
                    btn.classList.remove('active');
                } else {
                    this.activeToggles.add(i);
                    btn.classList.add('active');
                }
                this.loadSession();
            });

            this.togglesContainer.appendChild(btn);
        }
    },

    loadSession() {
        const allCards = Store.getAllFlashcards();
        this.buckets = { 0: [], 1: [], 2: [], 3: [], 4: [] };

        const baseSet = this.activeToggles.size > 0 ? Array.from(this.activeToggles) : [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

        // Ensure all possible cards based on toggles exist in our selection pool
        for (let i of baseSet) {
            for (let j = 2; j <= 12; j++) {
                const keys = [`${i}x${j}`, `${j}x${i}`];
                for (let key of keys) {
                    if (!allCards[key]) {
                        // Create as new (Bucket 0) on the fly
                        allCards[key] = { bucket: 0 };
                    }
                    const bucketValue = allCards[key].bucket !== undefined ? allCards[key].bucket : 0;

                    // Fallback to max bucket
                    const b = bucketValue >= 0 && bucketValue <= 4 ? bucketValue : 4;
                    this.buckets[b].push({ key, ...allCards[key] });
                }
            }
        }

        // De-duplicate in case of keys like 2x2, 3x3 where both variations are identical
        let totalCardsInPlay = 0;
        for (let b = 0; b <= 4; b++) {
            const unique = [];
            const seen = new Set();
            for (let c of this.buckets[b]) {
                if (!seen.has(c.key)) {
                    seen.add(c.key);
                    unique.push(c);
                }
            }
            this.buckets[b] = unique;
            totalCardsInPlay += unique.length;
        }

        this.updateStats();

        if (totalCardsInPlay === 0) {
            this.container.innerHTML = `<p style="text-align:center;">${i18n.get('msg_no_cards')}</p>`;
            return;
        }

        // Weighted Random Selection: B1(Again)=40, B0(New)=30, B2(Hard)=15, B3(Good)=10, B4(Easy)=5
        const weights = { 0: 30, 1: 40, 2: 15, 3: 10, 4: 5 };

        let selectedCard = null;

        // Try to pick a card not matching lastSeenKey, up to 10 attempts
        for (let attempt = 0; attempt < 10; attempt++) {
            let totalWeight = 0;
            const availableBuckets = [];

            for (let b = 0; b <= 4; b++) {
                if (this.buckets[b].length > 0) {
                    totalWeight += weights[b];
                    availableBuckets.push({ bucket: b, weight: weights[b] });
                }
            }

            let random = Math.random() * totalWeight;
            let selectedBucket = availableBuckets[0].bucket;
            for (let ab of availableBuckets) {
                random -= ab.weight;
                if (random <= 0) {
                    selectedBucket = ab.bucket;
                    break;
                }
            }

            const cardsInSelected = this.buckets[selectedBucket];
            const idx = Math.floor(Math.random() * cardsInSelected.length);
            selectedCard = cardsInSelected[idx];

            if (selectedCard.key !== this.lastSeenKey || totalCardsInPlay === 1) {
                break;
            }
        }

        this.lastSeenKey = selectedCard.key;
        this.renderCard(selectedCard);
    },

    updateStats() {
        const newCount = this.buckets[0].length;
        const reviewCount = this.buckets[1].length + this.buckets[2].length;
        this.dueCountEl.textContent = reviewCount;
        this.newCountEl.textContent = newCount;
    },

    renderCard(cardData, isNew) {
        this.currentCard = cardData;

        const [a, b] = cardData.key.split('x');
        const answer = parseInt(a, 10) * parseInt(b, 10);

        this.container.innerHTML = `
            <div class="flashcard-ui card" style="width: 100%; max-width: 500px; text-align: center; padding: 3rem 2rem; margin: 0 auto;">
                <div class="card-question" style="font-size: 4rem; font-weight: 700; margin-bottom: 2rem; display: flex; justify-content: center; align-items: center; white-space: nowrap;">
                    ${a} × ${b}
                    <span id="card-answer-area" class="hidden" style="color: var(--accent-primary); margin-left: 1rem;">= ${answer}</span>
                </div>

                <div style="position: relative; height: 3.5rem;">
                    <div id="card-actions-pre" style="position: absolute; inset: 0; z-index: 2;">
                        <button id="btn-show-ans" class="btn primary" style="width: 100%; height: 100%; font-size: 1.25rem;">${i18n.get('btn_show_answer')}</button>
                    </div>

                    <div id="card-actions-post" class="hidden" style="position: absolute; inset: 0; display: flex; gap: 0.5rem; justify-content: space-between; z-index: 1;">
                        <button class="btn danger rating-btn" data-quality="1" style="flex: 1; height: 100%; font-size:0.9rem; padding: 0.5rem; white-space: pre-line">${i18n.get('btn_again')}</button>
                        <button class="btn secondary rating-btn" data-quality="3" style="flex: 1; height: 100%; font-size:0.9rem; padding: 0.5rem; border-color: var(--warning); color: var(--warning); white-space: pre-line">${i18n.get('btn_hard')}</button>
                        <button class="btn secondary rating-btn" data-quality="4" style="flex: 1; height: 100%; font-size:0.9rem; padding: 0.5rem; border-color: var(--success); color: var(--success); white-space: pre-line">${i18n.get('btn_good')}</button>
                        <button class="btn secondary rating-btn" data-quality="5" style="flex: 1; height: 100%; font-size:0.9rem; padding: 0.5rem; border-color: var(--success); color: var(--success); white-space: pre-line">${i18n.get('btn_easy')}</button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('btn-show-ans').addEventListener('click', () => {
            document.getElementById('card-answer-area').classList.remove('hidden');
            document.getElementById('card-actions-pre').classList.add('hidden');
            document.getElementById('card-actions-post').classList.remove('hidden');
            document.getElementById('card-actions-post').style.display = 'flex';
        });

        document.querySelectorAll('.rating-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const quality = parseInt(e.target.dataset.quality, 10);
                this.handleRating(quality);
            });
        });
    },

    handleRating(quality) {
        let targetBucket = 0;
        if (quality === 1) targetBucket = 1;      // Again
        else if (quality === 3) targetBucket = 2; // Hard
        else if (quality === 4) targetBucket = 3; // Good
        else if (quality === 5) targetBucket = 4; // Easy

        this.currentCard.bucket = targetBucket;

        Store.saveFlashcard(this.currentCard.key, this.currentCard);

        // Save progress for heatmap
        Store.saveProgress(this.currentCard.key, quality >= 4 ? 'correct' : 'incorrect');

        // Update toggles to reflect immediate proficiency change visually
        this.renderToggles();

        // Reload session to get next card
        this.loadSession();
    }
};
