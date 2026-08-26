'use client'

import { Doughnut } from 'react-chartjs-2'
import './chartSetup'
import { CHART_PALETTE, CHART_TEXT_COLOR } from './chartSetup'

interface Props {
  labels: string[]
  values: number[]
  colors?: string[]
}

export default function DoughnutBreakdownChart({ labels, values, colors }: Props) {
  const resolvedColors = colors ?? labels.map((_, i) => CHART_PALETTE[i % CHART_PALETTE.length])

  return (
    <Doughnut
      data={{
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: resolvedColors,
            borderColor: '#0f172a',
            borderWidth: 2,
            hoverOffset: 6,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: CHART_TEXT_COLOR, font: { size: 11 }, padding: 12, boxWidth: 10 },
          },
          tooltip: {
            backgroundColor: '#0f172a',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            titleColor: '#fff',
            bodyColor: '#cbd5e1',
            padding: 10,
          },
        },
      }}
    />
  )
}
