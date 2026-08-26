'use client'

import { Line } from 'react-chartjs-2'
import './chartSetup'
import { CHART_TEXT_COLOR, CHART_GRID_COLOR } from './chartSetup'

export default function UploadTrendChart({ data }: { data: { date: string; count: number }[] }) {
  const labels = data.map((d) =>
    new Date(d.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
  )

  return (
    <Line
      data={{
        labels,
        datasets: [
          {
            label: 'ไฟล์ที่อัปโหลด',
            data: data.map((d) => d.count),
            borderColor: '#22d3ee',
            backgroundColor: 'rgba(34, 211, 238, 0.12)',
            fill: true,
            tension: 0.35,
            pointRadius: 3,
            pointBackgroundColor: '#22d3ee',
            pointBorderColor: '#0f172a',
            pointBorderWidth: 2,
          },
        ],
      }}
      options={{
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
            ticks: { color: CHART_TEXT_COLOR, font: { size: 11 } },
            grid: { color: 'transparent' },
          },
          y: {
            beginAtZero: true,
            ticks: { color: CHART_TEXT_COLOR, font: { size: 11 }, precision: 0 },
            grid: { color: CHART_GRID_COLOR },
          },
        },
      }}
    />
  )
}
