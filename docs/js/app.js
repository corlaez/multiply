/**
 * app.js
 * Main application controller. Wires up components, routing, and UI events.
 */

import { Store } from './store.js';
import { i18n } from './i18n.js';
import { GridComponent } from './components/grid.js';
import { FlashcardsComponent } from './components/flashcards.js';
import { ReportComponent } from './components/report.js';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw-v2.js')
      .then((reg) => console.log('SW registered:', reg))
      .catch((err) => console.log('SW failed:', err));
  });
}

class App {
    constructor() {
        this.currentView = 'grid';

        // DOM Elements
        this.navBtns = document.querySelectorAll('.nav-btn');
        this.views = {
            grid: document.getElementById('view-grid'),
            flashcards: document.getElementById('view-flashcards'),
            report: document.getElementById('view-report')
        };

        this.settingsModal = document.getElementById('settings-modal');
        this.btnSettings = document.getElementById('btn-settings');
        this.btnCloseSettings = document.getElementById('btn-close-settings');

        this.langSelect = document.getElementById('lang-select');
        this.themeSelect = document.getElementById('theme-select');
        this.btnResetData = document.getElementById('btn-reset-data');

        this.init();
    }

    init() {
        // Load initial settings
        const settings = Store.getSettings();

        // Apply Theme
        if (settings.theme === 'light') {
            document.body.classList.replace('theme-dark', 'theme-light');
            this.themeSelect.value = 'light';
        } else {
            this.themeSelect.value = 'dark';
        }

        // Apply Language
        if (settings.language && settings.language !== 'auto') {
            this.langSelect.value = settings.language;
            i18n.setLanguage(settings.language);
        } else {
            this.langSelect.value = 'auto';
            i18n.setLanguage(i18n.detectLanguage());
        }

        // Initialize Components
        GridComponent.init();
        FlashcardsComponent.init();
        ReportComponent.init();

        // Setup Event Listeners
        this.setupEventListeners();

        // Render initial view (restore persisted tab or default to 'grid')
        const savedView = Store.getActiveView();
        this.switchView(savedView);
    }

    setupEventListeners() {
        // Navigation
        this.navBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.switchView(view);
            });
        });

        // Settings Modal
        this.btnSettings.addEventListener('click', () => {
            this.settingsModal.classList.remove('hidden');
        });

        this.btnCloseSettings.addEventListener('click', () => {
            this.settingsModal.classList.add('hidden');
        });

        // Close modal on outside click
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) {
                this.settingsModal.classList.add('hidden');
            }
        });

        // Settings Changes
        this.langSelect.addEventListener('change', (e) => {
            const lang = e.target.value;
            Store.setSettings({ language: lang });
            i18n.setLanguage(lang === 'auto' ? i18n.detectLanguage() : lang);
        });

        this.themeSelect.addEventListener('change', (e) => {
            const theme = e.target.value;
            Store.setSettings({ theme });
            if (theme === 'light') {
                document.body.classList.replace('theme-dark', 'theme-light');
            } else {
                document.body.classList.replace('theme-light', 'theme-dark');
            }
        });

        this.btnResetData.addEventListener('click', () => {
            if (this.btnResetData.dataset.confirm === 'true') {
                Store.resetAllData();
                this.btnResetData.textContent = 'Data Reset!';
                setTimeout(() => window.location.reload(), 500);
            } else {
                this.btnResetData.dataset.confirm = 'true';
                this.btnResetData.textContent = 'Click again to confirm';
                setTimeout(() => {
                    this.btnResetData.dataset.confirm = 'false';
                    this.btnResetData.textContent = i18n.get('btn_reset_data');
                }, 3000);
            }
        });
    }

    switchView(viewName) {
        if (!this.views[viewName]) return;

        // Update nav active state
        this.navBtns.forEach(btn => {
            if (btn.dataset.view === viewName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Hide all views
        Object.values(this.views).forEach(view => {
            view.classList.remove('active');
            view.classList.add('hidden');
        });

        // Show target view
        this.views[viewName].classList.remove('hidden');
        this.views[viewName].classList.add('active');

        this.currentView = viewName;
        Store.setActiveView(viewName);

        // Trigger lifecycle hooks if components define them
        if (viewName === 'flashcards' && typeof FlashcardsComponent.onMount === 'function') {
            FlashcardsComponent.onMount();
        }
        if (viewName === 'report' && typeof ReportComponent.onMount === 'function') {
            ReportComponent.onMount();
        }
    }
}

// Boot application
document.addEventListener('DOMContentLoaded', () => {
    window.MultiplyApp = new App();
});
