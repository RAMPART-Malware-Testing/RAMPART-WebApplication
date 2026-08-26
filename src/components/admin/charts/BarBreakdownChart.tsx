'use client'

import { Bar } from 'react-chartjs-2'
import './chartSetup'
import { CHART_PALETTE, CHART_TEXT_COLOR, CHART_GRID_COLOR } from './chartSetup'

interface Props {
  labels: string[]
  values: number[]
  colors?: string[]
  horizontal?: boolean
}

export default function BarBreakdownChart({ labels, values, colors, horizontal }: Props) {
  const resolvedColors = colors ?? labels.map((_, i) => CHART_PALETTE[i % CHART_PALETTE.length])

  return (
    <Bar
      data={{
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: resolvedColors,
            borderRadius: 6,
            maxBarThickness: 36,
          },
        ],
      }}
      options={{
        indexAxis: horizontal ? 'y' : 'x',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0f172a',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            titleColor: '#fff',
            bodyColor: '#cbd5e1',
            padding: 10,
          },
        },
        scales: {
          x: {
            beginAtZero: !horizontal,
            ticks: { color: CHART_TEXT_COLOR, font: { size: 11 }, precision: horizontal ? undefined : 0 },
            grid: { color: horizontal ? CHART_GRID_COLOR : 'transparent' },
          },
          y: {
            beginAtZero: horizontal,
            ticks: { color: CHART_TEXT_COLOR, font: { size: 11 }, precision: horizontal ? 0 : undefined },
            grid: { color: horizontal ? 'transparent' : CHART_GRID_COLOR },
          },
        },
      }}
    />
  )
}
