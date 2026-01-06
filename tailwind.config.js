/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './composables/**/*.{js,ts}',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue',
  ],
  theme: {
    extend: {
      colors: {
        // Cool slate foundation - professional, trustworthy
        surface: {
          'DEFAULT': '#ffffff',
          'secondary': '#f8fafc',
          'tertiary': '#f1f5f9',
          'dark': '#0f172a',
          'dark-secondary': '#1e293b',
          'dark-tertiary': '#334155',
        },
        // Refined border colors
        border: {
          'DEFAULT': 'rgba(15, 23, 42, 0.08)',
          'strong': 'rgba(15, 23, 42, 0.12)',
          'subtle': 'rgba(15, 23, 42, 0.05)',
          'dark': 'rgba(248, 250, 252, 0.08)',
          'dark-strong': 'rgba(248, 250, 252, 0.12)',
          'dark-subtle': 'rgba(248, 250, 252, 0.05)',
        },
        // Emerald as primary accent (profit/growth - natural for poker)
        accent: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        // Semantic: Success (green - for profits)
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        // Semantic: Danger (red - for losses)
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        // Semantic: Warning (amber)
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        // Typography hierarchy
        foreground: {
          'DEFAULT': '#0f172a',
          'secondary': '#475569',
          'muted': '#64748b',
          'faint': '#94a3b8',
          'dark': '#f8fafc',
          'dark-secondary': '#cbd5e1',
          'dark-muted': '#94a3b8',
          'dark-faint': '#64748b',
        },
      },
      screens: {
        xs: '475px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Monaco', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }], // 11px
        'xs': ['0.75rem', { lineHeight: '1rem' }], // 12px
        'sm': ['0.8125rem', { lineHeight: '1.25rem' }], // 13px
        'base': ['0.875rem', { lineHeight: '1.5rem' }], // 14px
        'lg': ['1rem', { lineHeight: '1.5rem' }], // 16px
        'xl': ['1.125rem', { lineHeight: '1.75rem' }], // 18px
        '2xl': ['1.5rem', { lineHeight: '2rem' }], // 24px
        '3xl': ['2rem', { lineHeight: '2.5rem' }], // 32px
      },
      letterSpacing: {
        tighter: '-0.02em',
        tight: '-0.01em',
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '10px',
        xl: '12px',
      },
      boxShadow: {
        // Subtle single shadow approach
        'xs': '0 1px 2px rgba(15, 23, 42, 0.04)',
        'sm': '0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)',
        'DEFAULT': '0 2px 4px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)',
        'md': '0 4px 6px rgba(15, 23, 42, 0.05), 0 2px 4px rgba(15, 23, 42, 0.04)',
        // Dark mode shadows
        'dark-xs': '0 1px 2px rgba(0, 0, 0, 0.2)',
        'dark-sm': '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)',
        'dark-DEFAULT': '0 2px 4px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)',
      },
      spacing: {
        4.5: '1.125rem', // 18px
        13: '3.25rem', // 52px
        15: '3.75rem', // 60px
        18: '4.5rem', // 72px
      },
      animation: {
        'fade-in': 'fadeIn 150ms cubic-bezier(0.25, 1, 0.5, 1)',
        'slide-up': 'slideUp 200ms cubic-bezier(0.25, 1, 0.5, 1)',
        'slide-down': 'slideDown 200ms cubic-bezier(0.25, 1, 0.5, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};
