/**
 * i18n.js
 * Handles language dictionaries and translation logic.
 */

const dictionaries = {
    en: {
        app_title: "Multiply",
        nav_grid: "Practice Grid",
        nav_flashcards: "Flashcards",
        nav_report: "Statistics",
        grid_title: "Active Recall Grid",
        grid_subtitle: "Fill in the blanks to test your immediate recall.",
        grid_size_label: "Grid Size:",
        btn_clear_grid: "Clear Table",
        flashcards_title: "Spaced Repetition",
        flashcards_subtitle: "Optimize your long-term memory.",
        label_due: "Review:",
        label_new: "New/Learning:",
        label_focus: "Focus on specific numbers:",
        msg_no_cards: "No cards due for review right now! Great job.",
        btn_study_ahead: "Study New Cards",
        report_title: "Statistics & Progress",
        report_subtitle: "Visualize your mastery of the multiplication tables.",
        stat_mastered: "Mastered Facts",
        stat_reviews: "Total Reviews",
        heatmap_title: "Proficiency Heatmap",
        legend_label: "Needs Work → Mastered",
        settings_title: "Settings",
        settings_language: "Language",
        settings_theme: "Theme",
        theme_dark: "Dark",
        theme_light: "Light",
        danger_zone_desc: "Reset all your progress and spaced repetition data.",
        btn_reset_data: "Reset Data",
        btn_show_answer: "Show Answer",
        btn_again: "Again",
        btn_hard: "Hard",
        btn_good: "Good",
        btn_easy: "Easy",
        grid_placeholder_prefix: "Type",
        settings_lang_auto: "Auto (System)"
    },
    es: {
        app_title: "Multiplica",
        nav_grid: "Matriz de Práctica",
        nav_flashcards: "Tarjetas (Flashcards)",
        nav_report: "Estadísticas",
        grid_title: "Matriz de Recuerdo Activo",
        grid_subtitle: "Llena los espacios en blanco para probar tu memoria inmediata.",
        grid_size_label: "Tamaño:",
        btn_clear_grid: "Limpiar Tabla",
        flashcards_title: "Repetición Espaciada",
        flashcards_subtitle: "Optimiza tu memoria a largo plazo.",
        label_due: "Repasar:",
        label_new: "Nuevas:",
        label_focus: "Enfócate en números específicos:",
        msg_no_cards: "¡No hay tarjetas pendientes ahora mismo! Gran trabajo.",
        btn_study_ahead: "Estudiar Tarjetas Nuevas",
        report_title: "Estadísticas y Progreso",
        report_subtitle: "Visualiza tu dominio de las tablas de multiplicar.",
        stat_mastered: "Operaciones Dominadas",
        stat_reviews: "Repasos Totales",
        heatmap_title: "Mapa de Calor de Competencia",
        legend_label: "Necesita Práctica → Dominado",
        settings_title: "Ajustes",
        settings_language: "Idioma",
        settings_theme: "Tema",
        theme_dark: "Oscuro",
        theme_light: "Claro",
        danger_zone_desc: "Restablecer todo tu progreso y datos de estudio.",
        btn_reset_data: "Restablecer Datos",
        btn_show_answer: "Mostrar Respuesta",
        btn_again: "Repetir",
        btn_hard: "Difícil",
        btn_good: "Bien",
        btn_easy: "Fácil",
        grid_placeholder_prefix: "Escribe",
        settings_lang_auto: "Auto (Sistema)"
    },
    fr: {
        app_title: "Multiplier",
        nav_grid: "Grille de Pratique",
        nav_flashcards: "Cartes Mémoire",
        nav_report: "Statistiques",
        grid_title: "Grille de Rappel Actif",
        grid_subtitle: "Remplissez les blancs pour tester votre mémoire immédiate.",
        grid_size_label: "Taille:",
        btn_clear_grid: "Effacer la Grille",
        flashcards_title: "Répétition Espacée",
        flashcards_subtitle: "Optimisez votre mémoire à long terme.",
        label_due: "Révision:",
        label_new: "Nouveau:",
        label_focus: "Se concentrer sur des nombres spécifiques:",
        msg_no_cards: "Aucune carte à réviser pour le moment ! Bon travail.",
        btn_study_ahead: "Étudier de Nouvelles Cartes",
        report_title: "Statistiques et Progrès",
        report_subtitle: "Visualisez votre maîtrise des tables de multiplication.",
        stat_mastered: "Opérations Maîtrisées",
        stat_reviews: "Révisions Totales",
        heatmap_title: "Carte de Chaleur",
        legend_label: "Besoin de Pratique → Maîtrisé",
        settings_title: "Paramètres",
        settings_language: "Langue",
        settings_theme: "Thème",
        theme_dark: "Sombre",
        theme_light: "Clair",
        danger_zone_desc: "Réinitialiser tous vos progrès.",
        btn_reset_data: "Réinitialiser les Données",
        btn_show_answer: "Afficher",
        btn_again: "À Revoir",
        btn_hard: "Difficile",
        btn_good: "Bien",
        btn_easy: "Facile",
        grid_placeholder_prefix: "Taper",
        settings_lang_auto: "Auto (Système)"
    }
};

let currentLang = 'en';

export const i18n = {
    detectLanguage() {
        const langs = navigator.languages || [navigator.language || 'en'];
        for (const tag of langs) {
            const base = tag.split('-')[0].toLowerCase();
            if (dictionaries[base]) return base;
        }
        return 'en';
    },

    setLanguage(lang) {
        if (dictionaries[lang]) {
            currentLang = lang;
            this.translatePage();
        }
    },

    get(key) {
        const dict = dictionaries[currentLang] || dictionaries['en'];
        return dict[key] || key;
    },

    translatePage() {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = this.get(key);
            if (translation) {
                // If it's a select option or generic element
                el.textContent = translation;
            }
        });
    }
};
