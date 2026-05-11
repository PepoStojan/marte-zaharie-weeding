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
  const isFull = count >= cap
  const hasGuests = count > 0

  const borderColor = isFull
    ? 'border-red-400'
    : hasGuests
    ? {
        Main: 'border-amber-400',
        Women: 'border-rose-400',
        Men: 'border-blue-400',
      }[table.table_type]
    : 'border-gray-300'

  const bgColor = isFull
    ? 'bg-red-50'
    : hasGuests
    ? {
        Main: 'bg-amber-50',
        Women: 'bg-rose-50',
        Men: 'bg-blue-50',
      }[table.table_type]
    : 'bg-white'

  const numberColor = isFull
    ? 'text-red-600'
    : {
        Main: 'text-amber-700',
        Women: 'text-rose-700',
        Men: 'text-blue-700',
      }[table.table_type]

  return (
    <button
      onClick={onClick}
      className={`relative w-28 h-28 rounded-full border-2 flex flex-col items-center justify-center transition-all hover:scale-105 hover:shadow-md active:scale-95 ${borderColor} ${bgColor}`}
    >
      <span className={`font-bold text-3xl leading-none ${numberColor}`}>
        {table.table_number}
      </span>
      {hasGuests && (
        <span className={`text-xs mt-1 font-medium ${isFull ? 'text-red-500' : 'text-gray-400'}`}>
          {count}/{cap}
        </span>
      )}
      {isFull && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
          FULL
        </span>
      )}
    </button>
  )
}
