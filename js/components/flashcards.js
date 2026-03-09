/**
 * flashcards.js
 * Handles Spaced Repetition logic and UI.
 */

import { Store } from '../store.js';
import { SM2 } from '../sm2.js';
import { i18n } from '../i18n.js';
import { getProgressColor } from '../utils.js';

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
        const allCards = Store.getCards();

        for (let i = 2; i <= 12; i++) {
            const btn = document.createElement('button');
            btn.className = `toggle-btn ${this.activeToggles.has(i) ? 'active' : ''}`;
            btn.textContent = i;

            // Build conic gradient: one segment per column j (2–12)
            let conicStops = [];
            let idx = 0;

            for (let j = 2; j <= 12; j++) {
                const key1 = `${i}x${j}`;
                const key2 = `${j}x${i}`;
                const card1 = allCards[key1] || null;
                const card2 = allCards[key2] || null;

                // getProgressColor accepts the unified card object directly
                const color1 = getProgressColor(card1, card1);
                const color2 = getProgressColor(card2, card2);

                // Show the more optimistic state for symmetric pairs (e.g. 3x5 vs 5x3)
                const rank = (c) => {
                    if (c === 'var(--success)') return 4;
                    if (c === '#a3e635') return 3;
                    if (c === 'var(--warning)') return 2;
                    if (c === 'var(--danger)') return 1;
                    return 0; // unseen
                };
                const color = rank(color1) >= rank(color2) ? color1 : color2;

                let startDeg = (idx * 360) / 11;
                let endDeg = ((idx + 1) * 360) / 11;
                conicStops.push(`${color} ${startDeg}deg ${endDeg}deg`);
                idx++;
            }

            // Apply granular conic gradient border
            btn.style.background = `linear-gradient(var(--bg-surface-elevated), var(--bg-surface-elevated)) padding-box, conic-gradient(${conicStops.join(', ')}) border-box`;
            btn.style.borderColor = 'transparent';

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
        const allCards = Store.getCards();
        this.buckets = { 0: [], 1: [], 2: [], 3: [], 4: [] };

        const baseSet = this.activeToggles.size > 0 ? Array.from(this.activeToggles) : [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

        // Ensure all possible cards based on toggles exist in our selection pool
        for (let i of baseSet) {
            for (let j = 2; j <= 12; j++) {
                const keys = [`${i}x${j}`, `${j}x${i}`];
                for (let key of keys) {
                    if (!allCards[key]) {
                        allCards[key] = { bucket: 0 };
                    }
                    const bucketValue = allCards[key].bucket !== undefined ? allCards[key].bucket : 0;
                    const b = bucketValue >= 0 && bucketValue <= 4 ? bucketValue : 4;
                    this.buckets[b].push({ key, ...allCards[key] });
                }
            }
        }

        // De-duplicate (e.g. 2x2, 3x3 where both key variants are identical)
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
        // Single call updates bucket + performance counters + mastery status
        Store.rateCard(this.currentCard.key, quality);

        // Update toggles to reflect immediate proficiency change visually
        this.renderToggles();

        // Reload session to get next card
        this.loadSession();
    }
};
