/**
 * report.js
 * Handles the calculation and rendering of statistics and the heatmap.
 */

import { Store } from '../store.js';

export const ReportComponent = {
    init() {
        this.heatmapContainer = document.getElementById('heatmap-container');
        this.statMastered = document.getElementById('stat-mastered');
        this.statReviews = document.getElementById('stat-total-reviews');
    },

    onMount() {
        this.render();
    },

    render() {
        const progress = Store.getProgress();
        const settings = Store.getSettings();
        const size = settings.gridSize || 12;

        let totalReviews = 0;
        let masteredCount = 0;
        let totalPossible = (size - 1) * (size - 1); // Exclude 1x1... actually total is size*size

        this.heatmapContainer.innerHTML = '';
        const grid = document.createElement('div');

        // CSS Grid styling
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
        grid.style.gap = '2px';
        grid.style.maxWidth = '100%';
        grid.style.aspectRatio = '1 / 1';

        for (let r = 1; r <= size; r++) {
            for (let c = 1; c <= size; c++) {
                const key = `${r}x${c}`;
                const p = progress[key];

                const cell = document.createElement('div');
                cell.style.aspectRatio = '1/1';
                cell.style.borderRadius = '2px';
                cell.style.display = 'flex';
                cell.style.alignItems = 'center';
                cell.style.justifyContent = 'center';
                cell.style.fontSize = 'min(0.8rem, 2vw)';
                cell.style.color = 'var(--text-primary)';
                cell.style.cursor = 'default';
                cell.title = `${r} × ${c}`;
                // Optional: show answer on hover/content
                // cell.textContent = r*c; 

                // Determine color
                if (!p) {
                    cell.style.backgroundColor = 'var(--bg-surface-elevated)';
                    cell.style.border = '1px solid var(--border-color)';
                } else {
                    totalReviews += p.totalReviews;

                    if (p.status === 'mastered') {
                        cell.style.backgroundColor = 'var(--success)';
                        cell.style.color = '#000';
                        masteredCount++;
                    } else {
                        // Calculate ratio
                        const ratio = p.correctCount / (p.correctCount + p.incorrectCount || 1);
                        if (ratio < 0.4) {
                            cell.style.backgroundColor = 'var(--danger)';
                        } else if (ratio < 0.8) {
                            cell.style.backgroundColor = 'var(--warning)';
                            cell.style.color = '#000';
                        } else {
                            // Close to mastered
                            cell.style.backgroundColor = '#fde047'; // yellow
                            cell.style.color = '#000';
                        }
                    }
                }

                grid.appendChild(cell);
            }
        }

        this.heatmapContainer.appendChild(grid);

        // Update top stats
        this.statReviews.textContent = totalReviews;

        // Mastery percentage
        const totalFacts = size * size;
        const percentage = Math.round((masteredCount / totalFacts) * 100) || 0;
        this.statMastered.textContent = `${percentage}%`;
    }
};
