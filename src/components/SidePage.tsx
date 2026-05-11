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
  mainOnRight?: boolean   // Men: true (table 1 near main), Women: false (default)
  isolateFirstTable?: boolean // table 1 alone in col 1, aisle gap, then remaining tables
}

const ROWS = 5

export default function SidePage({ sideType, title, emoji, accentClass, mainOnRight = false, isolateFirstTable = false }: Props) {
  const [tables, setTables] = useState<Table[]>([])
  const [mainTable, setMainTable] = useState<Table | null>(null)
  const [guests, setGuests] = useState<Guest[]>([])
  const [activeTable, setActiveTable] = useState<Table | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    const [{ data: t }, { data: main }, { data: g }] = await Promise.all([
      supabase
        .from('tables')
        .select('*')
        .eq('table_type', sideType)
        .order('table_number', { ascending: true }),
      supabase.from('tables').select('*').eq('table_type', 'Main').single(),
      supabase.from('guests').select('*').order('full_name'),
    ])
    if (t) setTables(t)
    if (main) setMainTable(main)
    if (g) setGuests(g)
  }, [supabase, sideType, mainOnRight])

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
  const mainGuests = mainTable ? (guestsByTable[mainTable.id] ?? []) : []

  const MainTableButton = mainTable ? (
    <div className="shrink-0 flex flex-col justify-start pt-2">
      <button
        onClick={() => setActiveTable(mainTable)}
        className="w-32 md:w-44 h-16 md:h-20 rounded-xl border-2 border-amber-400 bg-amber-50 hover:bg-amber-100 hover:shadow-md transition-all flex flex-col items-center justify-center gap-0.5"
      >
        <span className="text-[10px] md:text-xs font-semibold text-amber-600 tracking-widest uppercase">Main Table</span>
        {mainGuests.length > 0 && (
          <span className="text-[10px] md:text-xs text-amber-500">
            {mainGuests.length}/{mainTable.capacity_limit}
          </span>
        )}
      </button>
    </div>
  ) : null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => router.push('/dashboard')}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 text-lg shrink-0"
        >
          ←
        </button>
        <span className="text-xl shrink-0">{emoji}</span>
        <div className="flex-1 min-w-0">
          <h1 className={`font-bold leading-none truncate ${accentClass}`}>{title}</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {totalSeated} seated · {unseated.length} unseated
          </p>
        </div>
      </nav>

      {/* Scrollable canvas */}
      <main className="flex-1 overflow-auto p-4 md:p-8">
        <div className="flex gap-4 md:gap-8 min-w-max">

          {/* Main table on LEFT for Women */}
          {!mainOnRight && MainTableButton}

          {/* Circle grid — rtl on Men so table 1 lands top-right near main table */}
          <div
            style={{
              display: 'grid',
              gridTemplateRows: `repeat(${ROWS}, auto)`,
              gridAutoFlow: 'column',
              gap: '1rem',
              direction: mainOnRight ? 'rtl' : 'ltr',
            }}
          >
            {isolateFirstTable && tables.length > 0 ? (() => {
              const [first, ...rest] = tables
              return [
                // Table 1 alone at top of column 1
                <CircleTable key={first.id} table={first} guests={guestsByTable[first.id] ?? []} onClick={() => setActiveTable(first)} />,
                // Empty rows 2-5 of column 1
                ...Array.from({ length: ROWS - 1 }, (_, i) => <div key={`col1-${i}`} style={{ width: 140, height: 140 }} />),
                // Full blank aisle column
                ...Array.from({ length: ROWS }, (_, i) => <div key={`aisle-${i}`} style={{ width: 140, height: 140 }} />),
                // Remaining tables fill columns normally
                ...rest.map(table => (
                  <CircleTable key={table.id} table={table} guests={guestsByTable[table.id] ?? []} onClick={() => setActiveTable(table)} />
                )),
              ]
            })() : tables.map(table => (
              <CircleTable
                key={table.id}
                table={table}
                guests={guestsByTable[table.id] ?? []}
                onClick={() => setActiveTable(table)}
              />
            ))}
          </div>

          {/* Main table on RIGHT for Men */}
          {mainOnRight && MainTableButton}
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
