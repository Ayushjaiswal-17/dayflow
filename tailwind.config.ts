import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        blue: {
          50: '#EAF2FF',
          100: '#D6E6FF',
          500: '#3A86FF',
          600: '#2563EB',
          700: '#1D4ED8',
        },
        purple: {
          50: '#F1EEFF',
          300: '#BDB2FF',
          500: '#8B7FE8',
          600: '#6E61D6',
        },
        pink: {
          50: '#FFF0F4',
          100: '#FFD6E0',
          300: '#FFB3C6',
          400: '#FF8FAB',
        },
        cream: '#FFF4F4',
        ink: {
          100: '#EFEAF3',
          300: '#C7C2D6',
          500: '#6B6580',
          700: '#3F3A52',
          900: '#1F1B2E',
        },
        surface: { 0: '#FFFFFF' },
        success: { 50: '#D1FAE5', 500: '#10B981' },
        warning: { 50: '#FEF3C7', 500: '#F59E0B' },
        danger: { 50: '#FEE2E2', 500: '#EF4444' },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 4px 12px rgba(58,134,255,0.10)',
        'card-lg': '0 8px 24px rgba(58,134,255,0.14)',
        pop: '0 12px 32px rgba(31,27,46,0.16)',
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [],
} satisfies Config
