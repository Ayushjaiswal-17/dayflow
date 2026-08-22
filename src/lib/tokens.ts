// Mirror of tailwind.config.ts palette for contexts that need raw color
// strings (SVG attributes in recharts, gradients on canvas, etc.).
// JSX must never hardcode hex — always import from here.
// Palette = landing page tokens: ember / plasma violet / sulfur / obsidian.

export const CHART_COLORS = {
  blue500: '#FC5000',
  purple300: '#B7AFF5',
  purple500: '#524AE9',
  pink300: '#F5F28E',
  ink100: '#EBEBE7',
  ink500: '#6F6F69',
  ink900: '#070607',
  success500: '#10B981',
  warning500: '#F59E0B',
  danger500: '#EF4444',
} as const

export type ChartColorKey = keyof typeof CHART_COLORS
