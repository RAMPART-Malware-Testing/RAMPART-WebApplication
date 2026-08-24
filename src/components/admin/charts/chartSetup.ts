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

// Registered once, imported by every admin chart component. chart.js
// tree-shakes unregistered elements out, so every chart type used across
// the admin dashboard (line/bar/doughnut) must be listed here.
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

export const CHART_TEXT_COLOR = 'rgba(226, 232, 240, 0.7)' // slate-200/70
export const CHART_GRID_COLOR = 'rgba(255, 255, 255, 0.06)'

export const CHART_PALETTE = [
  '#22d3ee', // cyan-400
  '#818cf8', // indigo-400
  '#f472b6', // pink-400
  '#fbbf24', // amber-400
  '#34d399', // emerald-400
  '#fb923c', // orange-400
  '#a78bfa', // violet-400
  '#f87171', // red-400
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
