'use client'

import { useState } from 'react'
import type { Guest, Table, TableType } from '@/types'
import { createClient } from '@/lib/supabase/client'

interface Props {
  guests: Guest[]
  tables: Table[]
  sideType: TableType
  dropdownTypes?: Array<'Women' | 'Men' | 'Main'>
  selectedGuest: Guest | null
  onSelectGuest: (guest: Guest | null) => void
  onRefresh: () => void
}

const scheme = {
  Women: {
    btn: 'bg-rose-600 hover:bg-rose-700',
    filterActive: 'bg-rose-600 text-white border-transparent',
    ring: 'focus:ring-rose-300',
    numBg: 'bg-rose-500',
    typeColor: 'text-rose-600',
    groupBg: 'bg-rose-50 border-rose-100',
    icon: 'bg-rose-100',
  },
  Men: {
    btn: 'bg-blue-600 hover:bg-blue-700',
    filterActive: 'bg-blue-600 text-white border-transparent',
    ring: 'focus:ring-blue-300',
    numBg: 'bg-blue-500',
    typeColor: 'text-blue-600',
    groupBg: 'bg-blue-50 border-blue-100',
    icon: 'bg-blue-100',
  },
  Main: {
    btn: 'bg-amber-500 hover:bg-amber-600',
    filterActive: 'bg-amber-500 text-white border-transparent',
    ring: 'focus:ring-amber-300',
    numBg: 'bg-amber-500',
    typeColor: 'text-amber-600',
    groupBg: 'bg-amber-50 border-amber-100',
    icon: 'bg-amber-100',
  },
}

const typeNumBg: Record<string, string> = {
  Main: 'bg-amber-500',
  Women: 'bg-rose-500',
  Men: 'bg-blue-500',
}

const typeGroupBg: Record<string, string> = {
  Main: 'bg-amber-50 border-amber-100',
  Women: 'bg-rose-50 border-rose-100',
  Men: 'bg-blue-50 border-blue-100',
}

const typeColor: Record<string, string> = {
  Main: 'text-amber-600',
  Women: 'text-rose-600',
  Men: 'text-blue-600',
}

export default function GuestList({ guests, tables, sideType, dropdownTypes, selectedGuest, onSelectGuest, onRefresh }: Props) {
  const [newName, setNewName] = useState('')
  const [newTableId, setNewTableId] = useState('')
  const [filter, setFilter] = useState<'all' | 'unseated' | 'seated'>('all')
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState(false)
  const [loading, setLoading] = useState(false)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const supabase = createClient()

  const c = scheme[sideType] ?? scheme.Women

  const tableById = tables.reduce<Record<string, Table>>((acc, t) => { acc[t.id] = t; return acc }, {})

  const validTableIds = new Set(
    tables.filter(t => !dropdownTypes || dropdownTypes.includes(t.table_type)).map(t => t.id)
  )

  const filtered = guests.filter(g => {
    const isSeated = !!g.table_id && validTableIds.has(g.table_id)
    if (filter === 'seated' && !isSeated) return false
    if (filter === 'unseated' && isSeated) return false
    if (search && !g.full_name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const unseatedGuests = filtered.filter(g => !g.table_id || !validTableIds.has(g.table_id))
  const seatedGuests = filtered.filter(g => g.table_id && validTableIds.has(g.table_id))

  const byTable = seatedGuests.reduce<Record<string, Guest[]>>((acc, g) => {
    const key = g.table_id!
    if (!acc[key]) acc[key] = []
    acc[key].push(g)
    return acc
  }, {})

  const sortedTableIds = Object.keys(byTable).sort((a, b) => {
    const ta = tableById[a], tb = tableById[b]
    if (!ta || !tb) return 0
    const order = { Main: 0, Women: 1, Men: 2 }
    if (ta.table_type !== tb.table_type) return order[ta.table_type] - order[tb.table_type]
    return ta.table_number - tb.table_number
  })

  const sortedTables = [...tables]
    .filter(t => !dropdownTypes || dropdownTypes.includes(t.table_type))
    .sort((a, b) => {
      const order = { Main: 0, Women: 1, Men: 2 }
      if (a.table_type !== b.table_type) return order[a.table_type] - order[b.table_type]
      return a.table_number - b.table_number
    })

  function tableLabel(t: Table) {
    return `Table ${t.table_number === 0 ? '★' : t.table_number} · ${t.table_type}`
  }

  function toggleCollapse(key: string) {
    setCollapsed(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n })
  }

  async function addGuest() {
    if (!newName.trim()) return
    setLoading(true)
    await supabase.from('guests').insert({ full_name: newName.trim(), category: '', side: sideType, ...(newTableId ? { table_id: newTableId } : {}) })
    setNewName(''); setNewTableId(''); setAdding(false); setLoading(false)
    onRefresh()
  }

  async function removeGuest(id: string) {
    await supabase.from('guests').delete().eq('id', id)
    if (selectedGuest?.id === id) onSelectGuest(null)
    onRefresh()
  }

  async function unassignGuest(id: string) {
    await supabase.from('guests').update({ table_id: null }).eq('id', id)
    onRefresh()
  }

  function GuestRow({ guest, index }: { guest: Guest; index: number }) {
    const table = guest.table_id ? tableById[guest.table_id] : null
    const isSelected = selectedGuest?.id === guest.id
    return (
      <div
        onClick={() => onSelectGuest(isSelected ? null : guest)}
        className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors border-t border-gray-100 ${isSelected ? 'bg-rose-50' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}
      >
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-gray-900 text-sm truncate">{guest.full_name}</div>
          {table && <div className="text-xs text-gray-400 mt-0.5">{tableLabel(table)}</div>}
        </div>
        <div className="flex items-center gap-1.5 ml-3 shrink-0">
          {guest.table_id ? (
            <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap">
              Seated <span>✓</span>
            </span>
          ) : (
            <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full whitespace-nowrap">Open</span>
          )}
          {guest.table_id && (
            <button onClick={e => { e.stopPropagation(); unassignGuest(guest.id) }} className="text-gray-400 hover:text-amber-600 transition-colors p-1 rounded hover:bg-gray-100" title="Unassign">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
            </button>
          )}
          <button onClick={e => { e.stopPropagation(); removeGuest(guest.id) }} className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-gray-100" title="Remove">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>
    )
  }

  let groupIndex = 0

  return (
    <div className="flex flex-col h-full gap-3">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-gray-900 text-xl">Guests</h2>
            <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">{guests.length}</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Manage and organize your guests</p>
        </div>
        <button onClick={() => setAdding(!adding)} className={`${c.btn} text-white text-sm font-semibold px-3 py-2 rounded-xl transition-colors flex items-center gap-1 whitespace-nowrap`}>
          + Add Guest
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
          <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addGuest()} placeholder="Full name *" autoFocus className={`w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${c.ring} bg-white`} />
          <select value={newTableId} onChange={e => setNewTableId(e.target.value)} className={`w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${c.ring} bg-white`}>
            <option value="">No table (unseated)</option>
            {sortedTables.map(t => {
              const seated = guests.filter(g => g.table_id === t.id).length
              const full = seated >= t.capacity_limit
              return <option key={t.id} value={t.id} disabled={full}>{tableLabel(t)} — {seated}/{t.capacity_limit}{full ? ' FULL' : ''}</option>
            })}
          </select>
          <div className="flex gap-2">
            <button onClick={addGuest} disabled={loading || !newName.trim()} className={`flex-1 ${c.btn} disabled:opacity-40 text-white text-sm py-2 rounded-lg font-medium`}>{loading ? 'Saving…' : 'Save'}</button>
            <button onClick={() => { setAdding(false); setNewName(''); setNewTableId('') }} className="flex-1 bg-gray-200 text-gray-700 text-sm py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'unseated', 'seated'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`text-sm px-3 py-1.5 rounded-lg font-medium capitalize transition-colors border ${filter === f ? c.filterActive : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search guests..." className={`w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 ${c.ring} bg-white`} />
      </div>

      {/* Groups */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">

        {unseatedGuests.length > 0 && (() => {
          const isCollapsed = collapsed.has('unseated')
          return (
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <button onClick={() => toggleCollapse('unseated')} className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                <span className="font-semibold text-gray-700 text-sm flex-1 text-left">Unseated · {unseatedGuests.length}</span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {!isCollapsed && unseatedGuests.map((g, i) => <GuestRow key={g.id} guest={g} index={i} />)}
            </div>
          )
        })()}

        {sortedTableIds.map(tableId => {
          const table = tableById[tableId]
          if (!table) return null
          const tableGuests = byTable[tableId]
          const isCollapsed = collapsed.has(tableId)
          const stripColor = { Women: 'bg-rose-300', Men: 'bg-blue-300', Main: 'bg-amber-300' }[table.table_type] ?? 'bg-gray-300'
          return (
            <div key={tableId} className={`rounded-xl border border-gray-200 overflow-hidden`}>
              <button onClick={() => toggleCollapse(tableId)} className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                <span className={`w-1 h-6 rounded-full shrink-0 ${stripColor}`} />
                <span className="font-semibold text-gray-800 text-sm flex-1 text-left">
                  Table {table.table_number === 0 ? '★' : table.table_number}
                  <span className="text-gray-400 font-normal ml-2">{tableGuests.length} / {table.capacity_limit}</span>
                </span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {!isCollapsed && tableGuests.map((g, i) => <GuestRow key={g.id} guest={g} index={i} />)}
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-3xl mb-2">👥</div>
            <p className="text-sm">No guests found</p>
          </div>
        )}
      </div>

      {/* Selected guest banner */}
      {selectedGuest && (
        <div className={`p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-sm flex items-center justify-between shrink-0`}>
          <span><span className="font-semibold text-rose-800">{selectedGuest.full_name}</span><span className="text-rose-500 ml-1">— click a table to assign</span></span>
          <button onClick={() => onSelectGuest(null)} className="text-rose-400 hover:text-rose-600 ml-2">✕</button>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 ${c.icon} rounded-full flex items-center justify-center text-base`}>👥</div>
          <div>
            <div className="font-semibold text-gray-900 text-sm">Total Guests</div>
            <div className="text-xs text-gray-400">Across all tables</div>
          </div>
        </div>
        <span className="bg-violet-600 text-white font-bold text-lg px-3 py-1 rounded-xl min-w-[2.5rem] text-center">{guests.length}</span>
      </div>

    </div>
  )
}
