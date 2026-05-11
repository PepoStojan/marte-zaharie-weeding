'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Guest, Table, TableType } from '@/types'
import CircleTable from './CircleTable'
import TableModal from './TableModal'

interface Props {
  sideType: TableType
  title: string
  emoji: string
  accentClass: string
}

export default function SidePage({ sideType, title, emoji, accentClass }: Props) {
  const [tables, setTables] = useState<Table[]>([])
  const [guests, setGuests] = useState<Guest[]>([])
  const [activeTable, setActiveTable] = useState<Table | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    const [{ data: t }, { data: g }] = await Promise.all([
      supabase.from('tables').select('*').eq('table_type', sideType).order('table_number'),
      supabase.from('guests').select('*').order('full_name'),
    ])
    if (t) setTables(t)
    if (g) setGuests(g)
  }, [supabase, sideType])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    const channel = supabase
      .channel(`realtime-${sideType}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guests' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, fetchData)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase, sideType, fetchData])

  const guestsByTable = guests.reduce<Record<string, Guest[]>>((acc, g) => {
    if (g.table_id) {
      if (!acc[g.table_id]) acc[g.table_id] = []
      acc[g.table_id].push(g)
    }
    return acc
  }, {})

  const unseated = guests.filter(g => !g.table_id)
  const totalSeated = tables.reduce((sum, t) => sum + (guestsByTable[t.id]?.length ?? 0), 0)
  const totalCap = tables.reduce((sum, t) => sum + t.capacity_limit, 0)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-gray-500 hover:text-gray-800 text-lg leading-none"
        >
          ←
        </button>
        <span className="text-xl">{emoji}</span>
        <div className="flex-1">
          <h1 className={`font-bold leading-none ${accentClass}`}>{title}</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {totalSeated} seated · {unseated.length} unseated · {tables.length} tables
          </p>
        </div>
      </nav>

      {/* Capacity bar */}
      <div className="h-1.5 bg-gray-200">
        <div
          className="h-full bg-green-500 transition-all"
          style={{ width: totalCap ? `${(totalSeated / totalCap) * 100}%` : '0%' }}
        />
      </div>

      {/* Circle grid */}
      <main className="flex-1 p-6">
        <div className="flex flex-wrap gap-5 justify-center">
          {tables.map(table => (
            <CircleTable
              key={table.id}
              table={table}
              guests={guestsByTable[table.id] ?? []}
              onClick={() => setActiveTable(table)}
            />
          ))}
        </div>
      </main>

      {/* Modal */}
      {activeTable && (
        <TableModal
          table={activeTable}
          guests={guestsByTable[activeTable.id] ?? []}
          allUnseated={unseated}
          onClose={() => setActiveTable(null)}
          onRefresh={fetchData}
        />
      )}
    </div>
  )
}
