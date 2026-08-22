export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function currencyINR(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n)
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function monthName(monthIndex: number): string {
  return MONTH_NAMES[monthIndex] ?? ''
}

/** "2026-08-22" -> "22 Aug" */
export function shortDate(iso: string): string {
  const [, m, d] = iso.split('-').map(Number)
  return `${String(d).padStart(2, '0')} ${MONTH_NAMES[m - 1]?.slice(0, 3) ?? ''}`
}

/** "2026-08-22" -> "Sat" / weekday number helpers */
export function weekdayShort(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()]
}

export function greetingForHour(hour: number): { text: string; emoji: string } {
  if (hour < 12) return { text: 'Good morning', emoji: '☀️' }
  if (hour < 17) return { text: 'Good afternoon', emoji: '🌤️' }
  return { text: 'Good evening', emoji: '🌆' }
}

export function dateMessage(d: Date): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const day = new Date(d)
  day.setHours(0, 0, 0, 0)
  const diff = Math.round((day.getTime() - today.getTime()) / 86400000)
  if (diff === 0) return `it's ${day.toLocaleDateString('en-US', { weekday: 'long' })}`
  if (diff === 1) return 'the weekend is almost here'
  if (diff > 0 && diff <= 5) return `${diff} days to the weekend`
  return 'have a great day'
}
