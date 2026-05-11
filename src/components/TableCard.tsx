'use client'

import { Guest, Table } from '@/types'

interface Props {
  table: Table
  guests: Guest[]
  selectedGuest: Guest | null
  onAssign: (tableId: string) => void
}

const typeColors = {
  Main: 'border-amber-400 bg-amber-50',
  Women: 'border-rose-300 bg-rose-50',
  Men: 'border-blue-300 bg-blue-50',
}

const typeBadge = {
  Main: 'bg-amber-200 text-amber-800',
  Women: 'bg-rose-200 text-rose-800',
  Men: 'bg-blue-200 text-blue-800',
}

export default function TableCard({ table, guests, selectedGuest, onAssign }: Props) {
  const count = guests.length
  const isFull = count >= table.capacity_limit
  const canAssign = selectedGuest && !isFull && !selectedGuest.table_id

  function handleClick() {
    if (canAssign) onAssign(table.id)
  }

  return (
    <div
      onClick={handleClick}
      className={`relative rounded-xl border-2 p-3 transition-all ${typeColors[table.table_type]} ${
        canAssign
          ? 'cursor-pointer hover:scale-105 hover:shadow-md ring-2 ring-rose-400 ring-offset-1'
          : isFull
          ? 'opacity-75'
          : 'cursor-default'
      }`}
    >
      {/* Table number */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex flex-col">
          <span className="font-bold text-lg leading-none text-gray-800">
            {table.table_number === 0 ? '★' : table.table_number}
          </span>
          <span className={`text-xs px-1 py-0.5 rounded mt-1 font-medium ${typeBadge[table.table_type]}`}>
            {table.table_type}
          </span>
        </div>
        <div className="text-right">
          <span className={`text-sm font-bold ${isFull ? 'text-red-600' : 'text-gray-600'}`}>
            {count}/{table.capacity_limit}
          </span>
          {isFull && (
            <div className="text-xs text-red-500 font-medium">FULL</div>
          )}
        </div>
      </div>

      {/* Occupancy bar */}
      <div className="h-1.5 bg-white rounded-full mb-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isFull ? 'bg-red-500' : 'bg-green-500'}`}
          style={{ width: `${(count / table.capacity_limit) * 100}%` }}
        />
      </div>

      {/* Guest names */}
      <div className="space-y-0.5 min-h-[20px]">
        {guests.slice(0, 6).map(g => (
          <div key={g.id} className="text-xs text-gray-700 truncate leading-tight">
            {g.full_name}
          </div>
        ))}
        {guests.length > 6 && (
          <div className="text-xs text-gray-400 italic">+{guests.length - 6} more</div>
        )}
      </div>

      {canAssign && (
        <div className="absolute inset-0 rounded-xl flex items-center justify-center bg-rose-400/10 pointer-events-none">
          <span className="text-rose-700 font-bold text-xs bg-white/80 px-2 py-1 rounded">Assign here</span>
        </div>
      )}
    </div>
  )
}
