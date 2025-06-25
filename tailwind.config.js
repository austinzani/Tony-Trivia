/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Electric Blues - Primary Brand
                electric: {
                    50: '#eff6ff',
                    100: '#dbeafe',
                    200: '#bfdbfe',
                    300: '#93c5fd',
                    400: '#60a5fa',
                    500: '#3b82f6',
                    600: '#2563eb',
                    700: '#1d4ed8',
                    800: '#1e40af',
                    900: '#1e3a8a',
                },
                // Vibrant Purples - Secondary
                plasma: {
                    50: '#faf5ff',
                    100: '#f3e8ff',
                    200: '#e9d5ff',
                    300: '#d8b4fe',
                    400: '#c084fc',
                    500: '#a855f7',
                    600: '#9333ea',
                    700: '#7c3aed',
                    800: '#6b21a8',
                    900: '#581c87',
                },
                // Energy Accents
                energy: {
                    orange: '#ff6b35',
                    yellow: '#ffd23f',
                    green: '#06d6a0',
                    red: '#ef476f',
                },
                // Game States
                victory: '#10b981',
                defeat: '#ef4444',
                pending: '#f59e0b',
                neutral: '#6b7280',
                // Legacy colors for compatibility
                primary: {
                    50: '#eff6ff',
                    100: '#dbeafe',
                    500: '#3b82f6',
                    600: '#2563eb',
                    700: '#1d4ed8',
                    900: '#1e3a8a',
                },
                secondary: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    900: '#0f172a',
                },
            },
            fontFamily: {
                sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
                display: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
                mono: ['SF Mono', 'Monaco', 'Cascadia Code', 'monospace'],
            },
            fontSize: {
                'display-xl': ['3.5rem', { lineHeight: '1', fontWeight: '800' }],
                'display-lg': ['2.5rem', { lineHeight: '1.25', fontWeight: '700' }],
                'display-md': ['2rem', { lineHeight: '1.25', fontWeight: '700' }],
            },
            spacing: {
                'xs': '0.25rem',
                'sm': '0.5rem',
                'md': '1rem',
                'lg': '1.5rem',
                'xl': '2rem',
                '2xl': '3rem',
                '3xl': '4rem',
            },
            borderRadius: {
                'game': '0.75rem',
                'card': '1rem',
            },
            boxShadow: {
                'game': '0 4px 20px rgba(0, 0, 0, 0.08)',
                'game-hover': '0 8px 32px rgba(0, 0, 0, 0.12)',
                'electric': '0 4px 12px rgba(59, 130, 246, 0.3)',
                'electric-lg': '0 8px 24px rgba(59, 130, 246, 0.3)',
                'yellow': '0 4px 12px rgba(255, 210, 63, 0.3)',
            },
            animation: {
                'score-count': 'scoreCount 0.6s ease-in-out',
                'badge-reveal': 'badgeReveal 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                'leaderboard-slide': 'leaderboardSlide 0.4s ease-out',
                'badge-glow': 'badgeGlow 2s ease-in-out infinite alternate',
                'skeleton': 'loading 1.5s infinite',
            },
            keyframes: {
                scoreCount: {
                    '0%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.2)' },
                    '100%': { transform: 'scale(1)' },
                },
                badgeReveal: {
                    '0%': {
                        opacity: '0',
                        transform: 'scale(0.5) rotate(-10deg)'
                    },
                    '50%': {
                        opacity: '1',
                        transform: 'scale(1.1) rotate(5deg)'
                    },
                    '100%': {
                        opacity: '1',
                        transform: 'scale(1) rotate(0deg)'
                    },
                },
                leaderboardSlide: {
                    '0%': {
                        opacity: '0',
                        transform: 'translateX(-100%)'
                    },
                    '100%': {
                        opacity: '1',
                        transform: 'translateX(0)'
                    },
                },
                badgeGlow: {
                    '0%': { boxShadow: '0 0 5px rgba(255, 210, 63, 0.5)' },
                    '100%': { boxShadow: '0 0 20px rgba(255, 210, 63, 0.8)' },
                },
                loading: {
                    '0%': { backgroundPosition: '200% 0' },
                    '100%': { backgroundPosition: '-200% 0' },
                },
            },
            transitionTimingFunction: {
                'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            },
        },
    },
    plugins: [
        function({ addUtilities }) {
            const newUtilities = {
                '.pb-safe': {
                    'padding-bottom': 'env(safe-area-inset-bottom)',
                },
                '.pt-safe': {
                    'padding-top': 'env(safe-area-inset-top)',
                },
                '.pl-safe': {
                    'padding-left': 'env(safe-area-inset-left)',
                },
                '.pr-safe': {
                    'padding-right': 'env(safe-area-inset-right)',
                },
                '.p-safe': {
                    'padding-top': 'env(safe-area-inset-top)',
                    'padding-right': 'env(safe-area-inset-right)',
                    'padding-bottom': 'env(safe-area-inset-bottom)',
                    'padding-left': 'env(safe-area-inset-left)',
                },
            }
            addUtilities(newUtilities)
        }
    ],
} 