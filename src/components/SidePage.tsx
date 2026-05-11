'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Guest, Table, TableType } from '@/types'
import CircleTable from './CircleTable'
import TableModal from './TableModal'
import GuestList from './GuestList'

interface Props {
  sideType: TableType
  title: string
  emoji: string
  accentClass: string
  mainOnRight?: boolean
  isolateFirstTable?: boolean
}

const ROWS = 5

export default function SidePage({ sideType, title, emoji, accentClass, mainOnRight = false, isolateFirstTable = false }: Props) {
  const [tables, setTables] = useState<Table[]>([])
  const [allTables, setAllTables] = useState<Table[]>([])
  const [mainTable, setMainTable] = useState<Table | null>(null)
  const [guests, setGuests] = useState<Guest[]>([])
  const [activeTable, setActiveTable] = useState<Table | null>(null)
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null)
  const [mobileTab, setMobileTab] = useState<'tables' | 'guests'>('tables')
  const router = useRouter()
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    const [{ data: t }, { data: main }, { data: g }, { data: all }] = await Promise.all([
      supabase.from('tables').select('*').eq('table_type', sideType).order('table_number', { ascending: true }),
      supabase.from('tables').select('*').eq('table_type', 'Main').single(),
      supabase.from('guests').select('*').order('full_name'),
      supabase.from('tables').select('*').order('table_type').order('table_number', { ascending: true }),
    ])
    if (t) setTables(t)
    if (main) setMainTable(main)
    if (g) setGuests(g)
    if (all) setAllTables(all)
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
  const mainGuests = mainTable ? (guestsByTable[mainTable.id] ?? []) : []

  async function handleTableClick(table: Table) {
    if (selectedGuest && !selectedGuest.table_id) {
      const seated = guestsByTable[table.id]?.length ?? 0
      if (seated >= table.capacity_limit) {
        setActiveTable(table)
        return
      }
      await supabase.from('guests').update({ table_id: table.id }).eq('id', selectedGuest.id)
      setSelectedGuest(null)
      fetchData()
      // Switch back to tables tab on mobile after assigning
      setMobileTab('tables')
    } else {
      setActiveTable(table)
    }
  }

  function handleSelectGuest(guest: Guest | null) {
    setSelectedGuest(guest)
    // On mobile, switch to tables tab so user can click a circle
    if (guest && !guest.table_id) setMobileTab('tables')
  }

  const typeColors = {
    Women: { border: 'border-rose-200', bg: 'bg-rose-50', bar: 'bg-rose-400', num: 'text-rose-700' },
    Men:   { border: 'border-blue-200',  bg: 'bg-blue-50',  bar: 'bg-blue-400',  num: 'text-blue-700'  },
    Main:  { border: 'border-amber-300', bg: 'bg-amber-50', bar: 'bg-amber-400', num: 'text-amber-700' },
  }

  function MobileCard({ table }: { table: Table }) {
    const tableGuests = guestsByTable[table.id] ?? []
    const seated = tableGuests.length
    const isFull = seated >= table.capacity_limit
    const canAssign = !!selectedGuest && !selectedGuest.table_id && !isFull
    const colors = typeColors[table.table_type]

    return (
      <button
        onClick={() => handleTableClick(table)}
        className={`w-full text-left rounded-xl border-2 p-3 transition-all active:scale-95 ${colors.border} ${colors.bg} ${
          canAssign ? 'ring-2 ring-rose-400 ring-offset-1 animate-pulse' : ''
        } ${isFull ? 'opacity-70' : 'hover:shadow-md'}`}
      >
        <div className="flex items-start justify-between mb-2">
          <span className={`text-2xl font-black ${colors.num}`}>
            {table.table_number === 0 ? '★' : table.table_number}
          </span>
          <span className={`text-xs font-bold ${isFull ? 'text-red-600' : 'text-gray-500'}`}>
            {seated}/{table.capacity_limit}
            {isFull && <span className="ml-1 text-[10px] bg-red-100 text-red-600 px-1 py-0.5 rounded">FULL</span>}
          </span>
        </div>

        {/* Occupancy bar */}
        <div className="h-1 bg-white/70 rounded-full mb-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isFull ? 'bg-red-400' : colors.bar}`}
            style={{ width: `${(seated / table.capacity_limit) * 100}%` }}
          />
        </div>

        {/* Guest names */}
        <div className="space-y-0.5 min-h-[16px]">
          {tableGuests.slice(0, 5).map(g => (
            <div key={g.id} className="text-xs text-gray-700 truncate leading-tight">{g.full_name}</div>
          ))}
          {tableGuests.length > 5 && (
            <div className="text-xs text-gray-400 italic">+{tableGuests.length - 5} more</div>
          )}
        </div>
      </button>
    )
  }

  const MobileTableGrid = (
    <div className="w-full space-y-4">
      {/* Main table card */}
      {mainTable && (
        <div>
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">Main Table</p>
          <MobileCard table={mainTable} />
        </div>
      )}
      {/* Side tables — 2 column grid */}
      <div>
        <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${accentClass}`}>{title}</p>
        <div className="grid grid-cols-2 gap-3">
          {tables.map(table => <MobileCard key={table.id} table={table} />)}
        </div>
      </div>
    </div>
  )

  const MainTableButton = mainTable ? (
    <div className="shrink-0 flex flex-col justify-start pt-2">
      <button
        onClick={() => handleTableClick(mainTable)}
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

  const TableGrid = (
    <div className="flex gap-4 md:gap-8 min-w-max">
      {!mainOnRight && MainTableButton}

      {isolateFirstTable && tables.length > 0 ? (
        <div className="flex gap-4" style={{ direction: 'ltr' }}>
          <div>
            <CircleTable
              table={tables[0]}
              guests={guestsByTable[tables[0].id] ?? []}
              onClick={() => handleTableClick(tables[0])}
              highlight={!!selectedGuest && !selectedGuest.table_id}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateRows: `repeat(${ROWS}, auto)`, gridAutoFlow: 'column', gap: '1rem' }}>
            {tables.slice(1).map(table => (
              <CircleTable
                key={table.id}
                table={table}
                guests={guestsByTable[table.id] ?? []}
                onClick={() => handleTableClick(table)}
                highlight={!!selectedGuest && !selectedGuest.table_id}
              />
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateRows: `repeat(${ROWS}, auto)`, gridAutoFlow: 'column', gap: '1rem', direction: mainOnRight ? 'rtl' : 'ltr' }}>
          {tables.map(table => (
            <CircleTable
              key={table.id}
              table={table}
              guests={guestsByTable[table.id] ?? []}
              onClick={() => handleTableClick(table)}
              highlight={!!selectedGuest && !selectedGuest.table_id}
            />
          ))}
        </div>
      )}

      {mainOnRight && MainTableButton}
    </div>
  )

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shrink-0 z-10">
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

        {/* Mobile tab toggles */}
        <div className="flex md:hidden gap-1 shrink-0">
          <button
            onClick={() => setMobileTab('tables')}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${mobileTab === 'tables' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            Tables
          </button>
          <button
            onClick={() => setMobileTab('guests')}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${mobileTab === 'guests' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            Guests {guests.length > 0 && <span className="ml-0.5 opacity-60">({guests.length})</span>}
          </button>
        </div>
      </nav>

      {/* Selected guest banner — visible on mobile tables tab */}
      {selectedGuest && mobileTab === 'tables' && (
        <div className="md:hidden bg-rose-50 border-b border-rose-200 px-4 py-2 flex items-center justify-between shrink-0">
          <span className="text-sm text-rose-800">
            <span className="font-semibold">{selectedGuest.full_name}</span> — tap a table to assign
          </span>
          <button onClick={() => setSelectedGuest(null)} className="text-rose-400 hover:text-rose-600 text-lg leading-none">✕</button>
        </div>
      )}

      {/* Body — split panel */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT: table area (hidden when guests tab active on mobile) */}
        <div className={`${mobileTab === 'guests' ? 'hidden' : 'flex'} md:flex flex-1 overflow-auto p-4 md:p-8`}>
          {/* Mobile card grid */}
          <div className="w-full md:hidden">
            {MobileTableGrid}
          </div>
          {/* Desktop circle grid */}
          <div className="hidden md:block">
            {TableGrid}
          </div>
        </div>

        {/* RIGHT: guest list panel */}
        <div className={`${mobileTab === 'tables' ? 'hidden' : 'flex'} md:flex flex-col w-full md:w-80 md:border-l md:border-gray-200 bg-white shrink-0`}>
          <div className="flex-1 overflow-y-auto p-4">
            <GuestList
              guests={guests}
              tables={allTables}
              selectedGuest={selectedGuest}
              onSelectGuest={handleSelectGuest}
              onRefresh={fetchData}
            />
          </div>
        </div>

      </div>

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
