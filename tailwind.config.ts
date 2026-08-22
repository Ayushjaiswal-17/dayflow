import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Caldera palette shared by the landing page and authenticated product.
        blue: {
          50: '#FFF1EA',
          100: '#FFE0D1',
          500: '#FC5000',
          600: '#E04800',
          700: '#C23F00',
        },
        // Secondary — landing "plasma violet" (#524ae9)
        purple: {
          50: '#EFEDFD',
          100: '#DFDBFA',
          300: '#B7AFF5',
          500: '#524AE9',
          600: '#443DD4',
        },
        // Tertiary highlight — landing "sulfur" (#f5f28e)
        pink: {
          50: '#FEFBDC',
          100: '#FBF6BC',
          300: '#F5F28E',
          400: '#EEE862',
        },
        cream: '#E2E2DF',
        ink: {
          100: '#EBEBE7',
          300: '#C9C9C4',
          500: '#6F6F69',
          700: '#3D3D38',
          900: '#070607',
        },
        surface: { 0: '#F7F6F2' },
        success: { 50: '#D1FAE5', 500: '#10B981' },
        warning: { 50: '#FEF3C7', 500: '#F59E0B' },
        danger: { 50: '#FEE2E2', 500: '#EF4444' },
      },
      fontFamily: {
        sans: [
          'DM Sans',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        display: ['Roboto Condensed', 'Arial Narrow', 'Impact', 'sans-serif'],
      },
      boxShadow: {
        card: 'none',
        'card-lg': 'none',
        pop: 'none',
      },
      borderRadius: {
        xl: '12px',
        '2xl': '40px',
      },
    },
  },
  plugins: [],
} satisfies Config
