'use client'

import { useState } from 'react'
import type { Guest, Table } from '@/types'
import { createClient } from '@/lib/supabase/client'

interface Props {
  guests: Guest[]
  tables: Table[]
  dropdownTypes?: Array<'Women' | 'Men' | 'Main'>
  selectedGuest: Guest | null
  onSelectGuest: (guest: Guest | null) => void
  onRefresh: () => void
}

export default function GuestList({ guests, tables, dropdownTypes, selectedGuest, onSelectGuest, onRefresh }: Props) {
  const [newName, setNewName] = useState('')
  const [newTableId, setNewTableId] = useState('')
  const [filter, setFilter] = useState<'all' | 'seated' | 'unseated'>('all')
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const tableById = tables.reduce<Record<string, Table>>((acc, t) => {
    acc[t.id] = t
    return acc
  }, {})

  const filtered = guests.filter(g => {
    if (filter === 'seated' && !g.table_id) return false
    if (filter === 'unseated' && g.table_id) return false
    if (search && !g.full_name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // Group by table: unseated first, then by table type + number
  const unseatedGuests = filtered.filter(g => !g.table_id)
  const seatedGuests = filtered.filter(g => g.table_id)

  const byTable = seatedGuests.reduce<Record<string, Guest[]>>((acc, g) => {
    const key = g.table_id!
    if (!acc[key]) acc[key] = []
    acc[key].push(g)
    return acc
  }, {})

  const sortedTableIds = Object.keys(byTable).sort((a, b) => {
    const ta = tableById[a]
    const tb = tableById[b]
    if (!ta || !tb) return 0
    if (ta.table_type !== tb.table_type) return ta.table_type.localeCompare(tb.table_type)
    return ta.table_number - tb.table_number
  })

  async function addGuest() {
    if (!newName.trim()) return
    setLoading(true)
    await supabase.from('guests').insert({
      full_name: newName.trim(),
      category: '',
      ...(newTableId ? { table_id: newTableId } : {}),
    })
    setNewName('')
    setNewTableId('')
    setAdding(false)
    setLoading(false)
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

  function tableLabel(table: Table) {
    return `Table ${table.table_number === 0 ? '★' : table.table_number} · ${table.table_type}`
  }

  // Sorted tables for the dropdown: Main first, then Women, then Men — filtered by dropdownTypes if provided
  const sortedTables = [...tables]
    .filter(t => !dropdownTypes || dropdownTypes.includes(t.table_type))
    .sort((a, b) => {
      const order = { Main: 0, Women: 1, Men: 2 }
      if (a.table_type !== b.table_type) return order[a.table_type] - order[b.table_type]
      return a.table_number - b.table_number
    })

  function GuestRow({ guest }: { guest: Guest }) {
    const table = guest.table_id ? tableById[guest.table_id] : null
    const isSelected = selectedGuest?.id === guest.id
    return (
      <div
        onClick={() => onSelectGuest(isSelected ? null : guest)}
        className={`flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer text-sm border transition-all ${
          isSelected ? 'border-rose-400 bg-rose-50' : 'border-transparent hover:bg-gray-50'
        }`}
      >
        <div className="min-w-0 flex-1">
          <div className="font-medium text-gray-800 truncate">{guest.full_name}</div>
          {table && (
            <div className="text-xs text-gray-400">{tableLabel(table)}</div>
          )}
        </div>
        <div className="flex items-center gap-1 ml-2 shrink-0">
          {guest.table_id ? (
            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Seated</span>
          ) : (
            <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Open</span>
          )}
          {guest.table_id && (
            <button
              onClick={e => { e.stopPropagation(); unassignGuest(guest.id) }}
              className="text-gray-400 hover:text-amber-600 text-xs px-1"
              title="Unassign"
            >↩</button>
          )}
          <button
            onClick={e => { e.stopPropagation(); removeGuest(guest.id) }}
            className="text-gray-400 hover:text-red-500 text-xs px-1"
            title="Remove"
          >✕</button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-gray-800 text-lg">
          Guests <span className="text-gray-400 font-normal text-sm">({guests.length})</span>
        </h2>
        <button
          onClick={() => setAdding(!adding)}
          className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
        >
          + Add
        </button>
      </div>

      {/* Add guest form */}
      {adding && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 mb-3 space-y-2">
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addGuest()}
            placeholder="Full name *"
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
            autoFocus
          />
          <select
            value={newTableId}
            onChange={e => setNewTableId(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
          >
            <option value="">No table (unseated)</option>
            {sortedTables.map(t => {
              const seated = guests.filter(g => g.table_id === t.id).length
              const full = seated >= t.capacity_limit
              return (
                <option key={t.id} value={t.id} disabled={full}>
                  {tableLabel(t)} — {seated}/{t.capacity_limit}{full ? ' FULL' : ''}
                </option>
              )
            })}
          </select>
          <div className="flex gap-2">
            <button
              onClick={addGuest}
              disabled={loading || !newName.trim()}
              className="flex-1 bg-rose-600 disabled:bg-rose-300 text-white text-xs py-1.5 rounded transition-colors"
            >
              {loading ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => { setAdding(false); setNewName(''); setNewTableId('') }}
              className="flex-1 bg-gray-200 text-gray-700 text-xs py-1.5 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-1 mb-2">
        {(['all', 'unseated', 'seated'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-2 py-1 rounded capitalize transition-colors ${
              filter === f ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search guests…"
        className="border border-gray-300 rounded px-2 py-1.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-rose-400"
      />

      {/* Guest list grouped by table */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">

        {/* Unseated */}
        {unseatedGuests.length > 0 && (
          <div>
            <div className="sticky top-0 bg-white py-1 mb-1">
              <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                Unseated · {unseatedGuests.length}
              </span>
            </div>
            {unseatedGuests.map(g => <GuestRow key={g.id} guest={g} />)}
          </div>
        )}

        {/* Seated, grouped by table */}
        {sortedTableIds.map(tableId => {
          const table = tableById[tableId]
          if (!table) return null
          const pillColors = {
            Women: 'bg-rose-100 text-rose-800 [&>span]:bg-rose-500',
            Men:   'bg-blue-100 text-blue-800 [&>span]:bg-blue-500',
            Main:  'bg-amber-100 text-amber-800 [&>span]:bg-amber-500',
          }[table.table_type]
          return (
            <div key={tableId}>
              <div className="sticky top-0 bg-white py-1 mb-1">
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${pillColors}`}>
                  <span className="w-1.5 h-1.5 rounded-full inline-block" />
                  Table {table.table_number === 0 ? '★' : table.table_number} · {table.table_type} · {byTable[tableId].length}/{table.capacity_limit}
                </span>
              </div>
              {byTable[tableId].map(g => <GuestRow key={g.id} guest={g} />)}
            </div>
          )
        })}

        {filtered.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-8">No guests found</p>
        )}
      </div>

      {/* Selected guest indicator */}
      {selectedGuest && (
        <div className="mt-3 p-2 bg-rose-100 border border-rose-300 rounded-lg text-sm flex items-center justify-between">
          <span>
            <span className="font-medium text-rose-800">{selectedGuest.full_name}</span>
            <span className="text-rose-600 ml-1">— click a table to assign</span>
          </span>
          <button onClick={() => onSelectGuest(null)} className="text-rose-400 hover:text-rose-600 ml-2">✕</button>
        </div>
      )}
    </div>
  )
}
