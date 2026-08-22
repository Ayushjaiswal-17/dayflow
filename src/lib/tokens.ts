// Mirror of tailwind.config.ts palette for contexts that need raw color
// strings (SVG attributes in recharts, gradients on canvas, etc.).
// JSX must never hardcode hex — always import from here.

export const CHART_COLORS = {
  blue500: '#3A86FF',
  purple300: '#BDB2FF',
  purple500: '#8B7FE8',
  pink300: '#FFB3C6',
  ink100: '#EFEAF3',
  ink500: '#6B6580',
  ink900: '#1F1B2E',
  success500: '#10B981',
  warning500: '#F59E0B',
  danger500: '#EF4444',
} as const

export type ChartColorKey = keyof typeof CHART_COLORS
