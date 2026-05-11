'use client'

import type { Guest, Table } from '@/types'

interface Props {
  table: Table
  guests: Guest[]
  onClick: () => void
}

function polarToXY(cx: number, cy: number, r: number, angle: number) {
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  }
}

export default function CircleTable({ table, guests, onClick }: Props) {
  const size = 140
  const cx = size / 2
  const cy = size / 2
  const outerR = size / 2 - 3
  const innerR = size * 0.18
  const cap = table.capacity_limit
  const angleStep = (2 * Math.PI) / cap
  const isFull = guests.length >= cap

  const typeColors = {
    Main: { filled: '#fcd34d', text: '#92400e', border: '#f59e0b' },
    Women: { filled: '#86efac', text: '#166534', border: '#4ade80' },
    Men: { filled: '#93c5fd', text: '#1e3a5f', border: '#60a5fa' },
  }[table.table_type]

  const slices = Array.from({ length: cap }, (_, i) => {
    const guest = guests[i] ?? null
    const startAngle = i * angleStep - Math.PI / 2
    const endAngle = (i + 1) * angleStep - Math.PI / 2
    const midAngle = startAngle + angleStep / 2
    const largeArc = angleStep > Math.PI ? 1 : 0

    const o1 = polarToXY(cx, cy, outerR, startAngle)
    const o2 = polarToXY(cx, cy, outerR, endAngle)
    const i1 = polarToXY(cx, cy, innerR, startAngle)
    const i2 = polarToXY(cx, cy, innerR, endAngle)

    const d = [
      `M ${i1.x.toFixed(2)} ${i1.y.toFixed(2)}`,
      `L ${o1.x.toFixed(2)} ${o1.y.toFixed(2)}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${o2.x.toFixed(2)} ${o2.y.toFixed(2)}`,
      `L ${i2.x.toFixed(2)} ${i2.y.toFixed(2)}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${i1.x.toFixed(2)} ${i1.y.toFixed(2)}`,
      'Z',
    ].join(' ')

    const textR = (outerR + innerR) / 2
    const tp = polarToXY(cx, cy, textR, midAngle)
    const textDeg = (midAngle * 180) / Math.PI + 90
    const firstName = guest ? guest.full_name.split(' ')[0].slice(0, 8) : ''

    return { d, tp, textDeg, guest, firstName }
  })

  return (
    <button
      onClick={onClick}
      className="relative rounded-full hover:scale-105 active:scale-95 transition-transform hover:shadow-lg focus:outline-none"
      style={{ direction: 'ltr', width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="rounded-full"
      >
        {/* Slices */}
        {slices.map(({ d, tp, textDeg, guest, firstName }, i) => (
          <g key={i}>
            <path
              d={d}
              fill={guest ? typeColors.filled : '#f3f4f6'}
              stroke="white"
              strokeWidth="2"
            />
            {guest && (
              <text
                x={tp.x}
                y={tp.y}
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${textDeg}, ${tp.x}, ${tp.y})`}
                fontSize={cap <= 8 ? '9' : '7.5'}
                fontWeight="600"
                fill={typeColors.text}
              >
                {firstName}
              </text>
            )}
          </g>
        ))}

        {/* Outer ring */}
        <circle
          cx={cx}
          cy={cy}
          r={outerR}
          fill="none"
          stroke={isFull ? '#ef4444' : guests.length > 0 ? typeColors.border : '#d1d5db'}
          strokeWidth="2"
        />

        {/* Center circle */}
        <circle cx={cx} cy={cy} r={innerR - 1} fill="white" />

        {/* Table number */}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="15"
          fontWeight="700"
          fill="#111827"
        >
          {table.table_number === 0 ? '★' : table.table_number}
        </text>

        {/* Seat count below number */}
        {guests.length > 0 && (
          <text
            x={cx}
            y={cy + 9}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="7"
            fill={isFull ? '#ef4444' : '#6b7280'}
          >
            {guests.length}/{cap}
          </text>
        )}
      </svg>

      {isFull && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none pointer-events-none">
          FULL
        </span>
      )}
    </button>
  )
}
