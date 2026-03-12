/**
 * grid.js
 * Handles the logic for the Active Recall Grid (Empty Tables).
 */

import { Store } from '../store.js';
import { i18n } from '../i18n.js';

export const GridComponent = {
    init() {
        this.container = document.getElementById('grid-container');
        this.btnGenerate = document.getElementById('btn-generate-grid');

        this.btnGenerate.addEventListener('click', () => {
            Store.clearGridValues();
            this.renderGrid(12);
        });

        // Initialize empty grid on load
        this.renderGrid(12);
    },

    renderGrid(size) {
        this.container.innerHTML = '';
        const table = document.createElement('table');
        table.className = 'practice-grid';

        // Styling via JS for simplicity, though CSS classes are ideal
        table.style.borderSpacing = '0';
        table.style.margin = '0 auto';

        // Header row
        const headerRow = document.createElement('tr');
        const emptyTh = document.createElement('th');
        emptyTh.textContent = '×';
        emptyTh.style.padding = '0.5rem';
        emptyTh.style.backgroundColor = 'var(--bg-surface-elevated)';
        emptyTh.style.border = '1px solid var(--border-color)';
        headerRow.appendChild(emptyTh);

        for (let i = 1; i <= size; i++) {
            const th = document.createElement('th');
            th.textContent = i;
            th.style.padding = '0.5rem';
            th.style.backgroundColor = 'var(--bg-surface-elevated)';
            th.style.border = '1px solid var(--border-color)';
            headerRow.appendChild(th);
        }
        table.appendChild(headerRow);

        // Grid body
        for (let row = 1; row <= size; row++) {
            const tr = document.createElement('tr');

            // Row header
            const th = document.createElement('th');
            th.textContent = row;
            th.style.padding = '0.5rem';
            th.style.backgroundColor = 'var(--bg-surface-elevated)';
            th.style.border = '1px solid var(--border-color)';
            tr.appendChild(th);

            for (let col = 1; col <= size; col++) {
                const td = document.createElement('td');
                td.style.padding = '0.25rem';
                td.style.border = '1px solid var(--border-color)';

                const input = document.createElement('input');
                input.type = 'number';
                input.inputmode='numeric';
                input.pattern='[0-9]*';
                input.className = 'grid-input';
                // Inline styles for input
                input.style.width = '3rem';
                input.style.height = '3rem';
                input.style.textAlign = 'center';
                input.style.fontSize = '1.1rem';
                input.style.border = 'none';
                input.style.backgroundColor = 'transparent';
                input.style.color = 'var(--text-primary)';
                input.style.outline = 'none';

                // Keep placeholder minimal
                // input.placeholder = i18n.get('grid_placeholder_prefix');

                input.dataset.row = row;
                input.dataset.col = col;

                input.addEventListener('input', (e) => this.handleInput(e, row, col));

                td.appendChild(input);
                tr.appendChild(td);
            }
            table.appendChild(tr);
        }

        this.container.appendChild(table);

        // Restore persisted grid values
        const saved = Store.getGridValues();
        for (const [key, value] of Object.entries(saved)) {
            const [r, c] = key.split('x').map(Number);
            const input = table.querySelector(`input[data-row="${r}"][data-col="${c}"]`);
            if (input && value) {
                input.value = value;
                const expected = r * c;
                const val = parseInt(value, 10);
                if (val === expected) {
                    input.style.backgroundColor = 'rgba(74, 222, 128, 0.2)';
                    input.style.color = 'var(--success)';
                    input.readOnly = true;
                } else {
                    const expectedStr = expected.toString();
                    if (value.length >= expectedStr.length) {
                        input.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                        input.style.color = 'var(--danger)';
                    }
                }
            }
        }
    },

    focusNextInput(current) {
        const inputs = Array.from(this.container.querySelectorAll('.grid-input'));
        const idx = inputs.indexOf(current);
        for (let i = idx + 1; i < inputs.length; i++) {
            if (!inputs[i].readOnly) {
                inputs[i].focus();
                return;
            }
        }
    },

    handleInput(e, row, col) {
        const expected = row * col;
        const val = parseInt(e.target.value, 10);
        const factKey = `${row}x${col}`;

        if (!e.target.value) {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.color = 'var(--text-primary)';
            Store.setGridValue(row, col, '');
            return;
        }

        Store.setGridValue(row, col, e.target.value);

        if (val === expected) {
            e.target.style.backgroundColor = 'rgba(74, 222, 128, 0.2)'; // Success light
            e.target.style.color = 'var(--success)';
            e.target.readOnly = true; // Lock it in
            Store.rateCard(factKey, 4); // quality 4 = Good (correct)
            this.focusNextInput(e.target);
        } else {
            // Only turn red if length matches or user presses enter? 
            // For now, let's just make it slightly red if typed
            const expectedStr = expected.toString();
            if (e.target.value.length >= expectedStr.length) {
                e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                e.target.style.color = 'var(--danger)';
                e.target.select();
            }
        }
    }
};
