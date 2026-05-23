// ============================================================
// 无色笺 — Configuration & Constants
// ============================================================

// Supabase credentials (REPLACE with your project values)
export const SUPABASE_URL = 'https://dstvhnsoxbltzloiwbqv.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzdHZobnNveGJsdHpsb2l3YnF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MTM1MDgsImV4cCI6MjA5NDk4OTUwOH0.m1YcrmhzYhGezLdR3J_q7X7NtvmxfXA8OXyRAp_kexk';

// Session storage key
export const AUTH_SESSION_KEY = 'lianli_auth';

// Password gate
export const MAX_PASSWORD_ATTEMPTS = 5;
export const LOCKOUT_DURATION = 60000; // 1 minute

// Timing
export const POEM_DISPLAY_DURATION = 3000;
export const POEM_LINE_DELAY = 400;
export const SCROLL_SNAP_DURATION = 400;
export const INK_DROP_DURATION = 600;
export const VOICE_MAX_DURATION = 5; // seconds

// Color palette (exported for JS usage in canvas/SVG generation)
export const COLOR = {
    PAPER:     '#f5f0e8',
    PINK:      '#e8d5d0',
    INK:       '#3a3a3a',
    BLUE:      '#d4e4ed',
    VERMILION: '#c45a4a',
};

// Anniversary
export const TOGETHER_DATE = '2025-06-08';

// Custom names (editable in settings)
export const DEFAULT_NAMES = { her: '她', him: '他' };

// Space titles and poems
export const SPACE_CONFIG = [
    {
        id: 'moments',
        name: '展齿苍苔',
        poem: '应怜屐齿印苍苔',
        source: '叶绍翁《游园不值》',
    },
    {
        id: 'lovenotes',
        name: '春水温澜',
        poem: '风乍起，吹皱一池春水',
        source: '冯延巳《谒金门》',
    },
    {
        id: 'habits',
        name: '冷暖共知',
        poem: '如人饮水，冷暖共知',
        source: '',
    },
    {
        id: 'settings',
        name: '我的笺',
        poem: '此情深处，红笺为无色',
        source: '',
    },
];

// Habit category icons map to SVG filenames in assets/icons/
export const HABIT_CATEGORIES = {
    '饮食':   'food',
    '睡眠':   'sleep',
    '心愿':   'hobby',
    '雷区':   'dislike',
    '习惯':   'habit',
    '爱好':   'hobby',
    '出行':   'travel',
    '默认':   'default',
};
