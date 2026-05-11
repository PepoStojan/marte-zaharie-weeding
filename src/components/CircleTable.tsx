'use client'

import type { Guest, Table } from '@/types'

interface Props {
  table: Table
  guests: Guest[]
  onClick: () => void
}

export default function CircleTable({ table, guests, onClick }: Props) {
  const count = guests.length
  const cap = table.capacity_limit
  const pct = count / cap
  const isFull = count >= cap

  const ringColor = isFull
    ? 'border-red-400 bg-red-50'
    : pct >= 0.75
    ? 'border-amber-400 bg-amber-50'
    : {
        Main: 'border-amber-400 bg-amber-50',
        Women: 'border-rose-300 bg-rose-50',
        Men: 'border-blue-300 bg-blue-50',
      }[table.table_type]

  const numberColor = {
    Main: 'text-amber-700',
    Women: 'text-rose-700',
    Men: 'text-blue-700',
  }[table.table_type]

  const hoverRing = isFull
    ? 'hover:border-red-500'
    : {
        Main: 'hover:border-amber-500',
        Women: 'hover:border-rose-500',
        Men: 'hover:border-blue-500',
      }[table.table_type]

  return (
    <button
      onClick={onClick}
      className={`relative w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center transition-all hover:scale-110 hover:shadow-lg ${ringColor} ${hoverRing} active:scale-95`}
      title={`Table ${table.table_number} — ${count}/${cap}`}
    >
      {/* Table number */}
      <span className={`font-bold text-xl leading-none ${numberColor}`}>
        {table.table_number === 0 ? '★' : table.table_number}
      </span>

      {/* Occupancy */}
      <span className={`text-xs mt-0.5 font-medium ${isFull ? 'text-red-600' : 'text-gray-500'}`}>
        {count}/{cap}
      </span>

      {/* Full badge */}
      {isFull && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold px-1 py-0.5 rounded-full leading-none">
          FULL
        </span>
      )}

      {/* Progress arc overlay using conic-gradient */}
      <div
        className="absolute inset-0 rounded-full opacity-20 pointer-events-none"
        style={{
          background: `conic-gradient(${isFull ? '#ef4444' : '#22c55e'} ${pct * 360}deg, transparent ${pct * 360}deg)`,
        }}
      />
    </button>
  )
}
