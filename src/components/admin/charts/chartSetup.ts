import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
)

export const CHART_TEXT_COLOR = 'rgba(226, 232, 240, 0.7)'
export const CHART_GRID_COLOR = 'rgba(255, 255, 255, 0.06)'

export const CHART_PALETTE = [
  '#22d3ee',
  '#818cf8',
  '#f472b6',
  '#fbbf24',
  '#34d399',
  '#fb923c',
  '#a78bfa',
  '#f87171',
]

export const RISK_LEVEL_COLORS: Record<string, string> = {
  Low: '#34d399',
  Caution: '#fbbf24',
  High: '#fb923c',
  Critical: '#f87171',
  'N/A': '#64748b',
}

export const STATUS_COLORS: Record<string, string> = {
  success: '#34d399',
  processing: '#fbbf24',
  pending: '#38bdf8',
  failed: '#f87171',
  unknown: '#64748b',
}
