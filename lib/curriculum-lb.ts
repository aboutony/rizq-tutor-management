/**
 * Lebanon v1.0 Curriculum Schema — 9-Pillar Master List
 *
 * Country-swappable: Import the appropriate file (curriculum-lb.ts, curriculum-ae.ts, etc.)
 * to load the curriculum specific to each country.
 */

export type SubCategory = {
    id: string;
    label: string;
    /** If true, show a text input when selected ("Please specify") */
    requiresInput?: boolean;
};

export type CurriculumCategory = {
    id: string;
    label: string;
    icon: string;
    /** Maps to the closest lesson_category enum for DB storage */
    dbCategory: 'academic' | 'language' | 'music' | 'fine_arts';
    subcategories: SubCategory[];
};

export const CURRICULUM_SCHEMA: CurriculumCategory[] = [
    // ──────────────────────────────────────
    // 1. General Education
    // ──────────────────────────────────────
    {
        id: 'general_education',
        label: 'General Education',
        icon: '🎓',
        dbCategory: 'academic',
        subcategories: [
            { id: 'ge_primary', label: 'Primary (Cycle 1 & 2)' },
            { id: 'ge_intermediate', label: 'Intermediate (Cycle 3)' },
            { id: 'ge_secondary', label: 'Secondary' },
            { id: 'ge_undergraduate', label: 'Undergraduate / University' },
            { id: 'ge_other', label: 'Other', requiresInput: true },
        ],
    },

    // ──────────────────────────────────────
    // 2. TVET (Technical & Vocational)
    // ──────────────────────────────────────
    {
        id: 'tvet',
        label: 'TVET',
        icon: '🔧',
        dbCategory: 'academic',
        subcategories: [
            { id: 'tvet_cap', label: 'CAP (Certificat d\'Aptitude Professionnelle)' },
            { id: 'tvet_bp', label: 'BP (Brevet Professionnel)' },
            { id: 'tvet_bt', label: 'BT (Baccalauréat Technique)' },
            { id: 'tvet_ts', label: 'TS (Technicien Supérieur)' },
            { id: 'tvet_other', label: 'Other', requiresInput: true },
        ],
    },

    // ──────────────────────────────────────
    // 3. Arts & Creative
    // ──────────────────────────────────────
    {
        id: 'arts_creative',
        label: 'Arts & Creative',
        icon: '🎨',
        dbCategory: 'fine_arts',
        subcategories: [
            { id: 'art_visual', label: 'Visual Arts (Painting, Drawing, Sculpture)' },
            { id: 'art_performing', label: 'Performing Arts (Theater, Dance)' },
            { id: 'art_martial', label: 'Martial Arts' },
            { id: 'art_design', label: 'Design (Graphic, Interior, Fashion)' },
            { id: 'art_photography', label: 'Photography & Film' },
            { id: 'art_other', label: 'Other', requiresInput: true },
        ],
    },

    // ──────────────────────────────────────
    // 4. Sports & Fitness
    // ──────────────────────────────────────
    {
        id: 'sports_fitness',
        label: 'Sports & Fitness',
        icon: '⚽',
        dbCategory: 'fine_arts',
        subcategories: [
            { id: 'sport_team', label: 'Team Sports (Football, Basketball, Volleyball)' },
            { id: 'sport_racket', label: 'Racket Sports (Tennis, Padel, Badminton)' },
            { id: 'sport_aquatic', label: 'Aquatic (Swimming, Diving)' },
            { id: 'sport_fitness', label: 'Fitness & Personal Training' },
            { id: 'sport_yoga', label: 'Yoga & Pilates' },
            { id: 'sport_other', label: 'Other', requiresInput: true },
        ],
    },

    // ──────────────────────────────────────
    // 5. Culinary Arts
    // ──────────────────────────────────────
    {
        id: 'culinary',
        label: 'Culinary Arts',
        icon: '👨‍🍳',
        dbCategory: 'fine_arts',
        subcategories: [
            { id: 'cul_cooking', label: 'Cooking (Lebanese, International)' },
            { id: 'cul_pastry', label: 'Pastry & Baking' },
            { id: 'cul_barista', label: 'Barista & Beverages' },
            { id: 'cul_hospitality', label: 'Hospitality & Service' },
            { id: 'cul_other', label: 'Other', requiresInput: true },
        ],
    },

    // ──────────────────────────────────────
    // 6. Brevet
    // ──────────────────────────────────────
    {
        id: 'brevet',
        label: 'Brevet',
        icon: '📝',
        dbCategory: 'academic',
        subcategories: [
            { id: 'brevet_math', label: 'Mathematics' },
            { id: 'brevet_sciences', label: 'Sciences' },
            { id: 'brevet_arabic', label: 'Arabic Language' },
            { id: 'brevet_french', label: 'French Language' },
            { id: 'brevet_english', label: 'English Language' },
            { id: 'brevet_history', label: 'History & Geography' },
            { id: 'brevet_civics', label: 'Civics' },
            { id: 'brevet_other', label: 'Other', requiresInput: true },
        ],
    },

    // ──────────────────────────────────────
    // 7. Lebanese Baccalaureate
    // ──────────────────────────────────────
    {
        id: 'lebanese_bac',
        label: 'Lebanese Baccalaureate',
        icon: '🏛️',
        dbCategory: 'academic',
        subcategories: [
            { id: 'bac_gs', label: 'GS / SG (Sciences Générales)' },
            { id: 'bac_ls', label: 'LS / SV (Sciences de la Vie)' },
            { id: 'bac_se', label: 'SE / ES (Économie & Sociologie)' },
            { id: 'bac_lh', label: 'LH (Lettres & Humanités)' },
            { id: 'bac_other', label: 'Other', requiresInput: true },
        ],
    },

    // ──────────────────────────────────────
    // 8. Language Learning
    // ──────────────────────────────────────
    {
        id: 'languages',
        label: 'Language Learning',
        icon: '🌐',
        dbCategory: 'language',
        subcategories: [
            { id: 'lang_arabic', label: 'Arabic' },
            { id: 'lang_english', label: 'English' },
            { id: 'lang_french', label: 'French' },
            { id: 'lang_armenian', label: 'Armenian' },
            { id: 'lang_greek', label: 'Greek' },
            { id: 'lang_spanish', label: 'Spanish' },
            { id: 'lang_german', label: 'German' },
            { id: 'lang_italian', label: 'Italian' },
            { id: 'lang_turkish', label: 'Turkish' },
            { id: 'lang_other', label: 'Other', requiresInput: true },
        ],
    },

    // ──────────────────────────────────────
    // 9. Coding & Technology
    // ──────────────────────────────────────
    {
        id: 'coding_tech',
        label: 'Coding & Technology',
        icon: '💻',
        dbCategory: 'academic',
        subcategories: [
            { id: 'tech_programming', label: 'Programming (Python, Java, C++)' },
            { id: 'tech_web', label: 'Web Development (HTML, CSS, JS)' },
            { id: 'tech_mobile', label: 'Mobile Development (iOS, Android)' },
            { id: 'tech_ai', label: 'AI & Machine Learning' },
            { id: 'tech_devops', label: 'DevOps & Cloud' },
            { id: 'tech_data', label: 'Data Science & Analytics' },
            { id: 'tech_other', label: 'Other', requiresInput: true },
        ],
    },
];

/** Helper: Get a category by ID */
export function getCategoryById(id: string): CurriculumCategory | undefined {
    return CURRICULUM_SCHEMA.find((c) => c.id === id);
}
