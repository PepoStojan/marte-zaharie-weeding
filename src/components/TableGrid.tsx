'use client'

import { Guest, Table, TableType } from '@/types'
import TableCard from './TableCard'

interface Props {
  tables: Table[]
  guests: Guest[]
  selectedGuest: Guest | null
  onAssign: (tableId: string) => void
}

export default function TableGrid({ tables, guests, selectedGuest, onAssign }: Props) {
  const guestsByTable = guests.reduce<Record<string, Guest[]>>((acc, g) => {
    if (g.table_id) {
      if (!acc[g.table_id]) acc[g.table_id] = []
      acc[g.table_id].push(g)
    }
    return acc
  }, {})

  const byType = (type: TableType) =>
    tables.filter(t => t.table_type === type).sort((a, b) => a.table_number - b.table_number)

  const mainTables = byType('Main')
  const womenTables = byType('Women')
  const menTables = byType('Men')

  const totalSeated = guests.filter(g => g.table_id).length

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <span className="text-gray-600">Main Table</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-rose-400" />
          <span className="text-gray-600">Women's Side ({womenTables.length} tables)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-400" />
          <span className="text-gray-600">Men's Side ({menTables.length} tables)</span>
        </div>
        <div className="ml-auto font-medium text-gray-700">
          {totalSeated} / {guests.length} seated
        </div>
      </div>

      {/* Main Table */}
      <section>
        <h3 className="text-sm font-semibold text-amber-700 uppercase tracking-wide mb-2">Main Table</h3>
        <div className="grid grid-cols-1 max-w-xs">
          {mainTables.map(table => (
            <TableCard
              key={table.id}
              table={table}
              guests={guestsByTable[table.id] || []}
              selectedGuest={selectedGuest}
              onAssign={onAssign}
            />
          ))}
        </div>
      </section>

      {/* Split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Women's Side */}
        <section>
          <h3 className="text-sm font-semibold text-rose-700 uppercase tracking-wide mb-2">
            Women's Side
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {womenTables.map(table => (
              <TableCard
                key={table.id}
                table={table}
                guests={guestsByTable[table.id] || []}
                selectedGuest={selectedGuest}
                onAssign={onAssign}
              />
            ))}
          </div>
        </section>

        {/* Men's Side */}
        <section>
          <h3 className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-2">
            Men's Side
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {menTables.map(table => (
              <TableCard
                key={table.id}
                table={table}
                guests={guestsByTable[table.id] || []}
                selectedGuest={selectedGuest}
                onAssign={onAssign}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
