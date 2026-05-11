'use client'

import { useState } from 'react'
import type { Guest, Table } from '@/types'
import { createClient } from '@/lib/supabase/client'

interface Props {
  guests: Guest[]
  tables: Table[]
  selectedGuest: Guest | null
  onSelectGuest: (guest: Guest | null) => void
  onRefresh: () => void
}

export default function GuestList({ guests, tables, selectedGuest, onSelectGuest, onRefresh }: Props) {
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [filter, setFilter] = useState<'all' | 'seated' | 'unseated'>('all')
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const filtered = guests.filter(g => {
    if (filter === 'seated' && !g.table_id) return false
    if (filter === 'unseated' && g.table_id) return false
    if (search && !g.full_name.toLowerCase().includes(search.toLowerCase()) &&
        !g.category.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const grouped = filtered.reduce<Record<string, Guest[]>>((acc, g) => {
    const key = g.category || 'Uncategorized'
    if (!acc[key]) acc[key] = []
    acc[key].push(g)
    return acc
  }, {})

  async function addGuest() {
    if (!newName.trim()) return
    setLoading(true)
    await supabase.from('guests').insert({ full_name: newName.trim(), category: newCategory.trim() })
    setNewName('')
    setNewCategory('')
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

  const tableById = tables.reduce<Record<string, Table>>((acc, t) => {
    acc[t.id] = t
    return acc
  }, {})

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
            placeholder="Full name *"
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
          />
          <input
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            placeholder="Category (e.g. Family Peposki)"
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
          />
          <div className="flex gap-2">
            <button
              onClick={addGuest}
              disabled={loading || !newName.trim()}
              className="flex-1 bg-rose-600 disabled:bg-rose-300 text-white text-xs py-1.5 rounded transition-colors"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => setAdding(false)}
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
        placeholder="Search guests..."
        className="border border-gray-300 rounded px-2 py-1.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-rose-400"
      />

      {/* Guest list grouped by category */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {Object.keys(grouped).sort().map(category => (
          <div key={category}>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 sticky top-0 bg-white py-0.5">
              {category} ({grouped[category].length})
            </div>
            {grouped[category].map(guest => {
              const table = guest.table_id ? tableById[guest.table_id] : null
              const isSelected = selectedGuest?.id === guest.id
              return (
                <div
                  key={guest.id}
                  onClick={() => onSelectGuest(isSelected ? null : guest)}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-sm border transition-all ${
                    isSelected
                      ? 'border-rose-400 bg-rose-50'
                      : 'border-transparent hover:bg-gray-50'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-medium text-gray-800 truncate">{guest.full_name}</div>
                    {table && (
                      <div className="text-xs text-gray-500">
                        Table {table.table_number} · {table.table_type}
                      </div>
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
                      >
                        ↩
                      </button>
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); removeGuest(guest.id) }}
                      className="text-gray-400 hover:text-red-500 text-xs px-1"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
        {Object.keys(grouped).length === 0 && (
          <p className="text-gray-400 text-sm text-center py-8">No guests found</p>
        )}
      </div>

      {/* Selected guest indicator */}
      {selectedGuest && (
        <div className="mt-3 p-2 bg-rose-100 border border-rose-300 rounded-lg text-sm">
          <span className="font-medium text-rose-800">{selectedGuest.full_name}</span>
          <span className="text-rose-600 ml-1">— click a table to assign</span>
        </div>
      )}
    </div>
  )
}

