/**
 * report.js
 * Handles the calculation and rendering of statistics and the heatmap.
 */

import { Store } from '../store.js';
import { getProgressColor } from '../utils.js';

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

                // Determine color using shared progress color utility
                if (!p) {
                    cell.style.backgroundColor = 'var(--bg-surface-elevated)';
                    cell.style.border = '1px solid var(--border-color)';
                } else {
                    totalReviews += p.totalReviews;
                    if (p.status === 'mastered') masteredCount++;

                    const color = getProgressColor(p);
                    cell.style.backgroundColor = color;

                    // Dark text on light-colored cells for readability
                    const lightCells = ['#a3e635', 'var(--warning)', 'var(--success)'];
                    cell.style.color = lightCells.includes(color) ? '#000' : 'inherit';
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
