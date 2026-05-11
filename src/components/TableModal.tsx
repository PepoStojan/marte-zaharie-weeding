'use client'

import { useState } from 'react'
import type { Guest, Table } from '@/types'
import { createClient } from '@/lib/supabase/client'

interface Props {
  table: Table
  guests: Guest[]
  allUnseated: Guest[]
  onClose: () => void
  onRefresh: () => void
}

export default function TableModal({ table, guests, allUnseated, onClose, onRefresh }: Props) {
  const [tab, setTab] = useState<'assign' | 'new'>('assign')
  const [selectedId, setSelectedId] = useState('')
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const isFull = guests.length >= table.capacity_limit

  async function assignExisting() {
    if (!selectedId) return
    setLoading(true)
    setError('')
    const { error: err } = await supabase
      .from('guests')
      .update({ table_id: table.id })
      .eq('id', selectedId)
    if (err) setError(err.message)
    else { setSelectedId(''); onRefresh() }
    setLoading(false)
  }

  async function addNew() {
    if (!newName.trim()) return
    setLoading(true)
    setError('')
    const { error: err } = await supabase
      .from('guests')
      .insert({ full_name: newName.trim(), category: newCategory.trim(), table_id: table.id })
    if (err) setError(err.message)
    else { setNewName(''); setNewCategory(''); onRefresh() }
    setLoading(false)
  }

  async function removeGuest(id: string) {
    await supabase.from('guests').update({ table_id: null }).eq('id', id)
    onRefresh()
  }

  async function deleteGuest(id: string) {
    await supabase.from('guests').delete().eq('id', id)
    onRefresh()
  }

  const typeColor = {
    Main: 'text-amber-700 bg-amber-50 border-amber-200',
    Women: 'text-rose-700 bg-rose-50 border-rose-200',
    Men: 'text-blue-700 bg-blue-50 border-blue-200',
  }[table.table_type]

  const accentBg = {
    Main: 'bg-amber-600 hover:bg-amber-700',
    Women: 'bg-rose-600 hover:bg-rose-700',
    Men: 'bg-blue-600 hover:bg-blue-700',
  }[table.table_type]

  const tabActive = {
    Main: 'border-amber-500 text-amber-700',
    Women: 'border-rose-500 text-rose-700',
    Men: 'border-blue-500 text-blue-700',
  }[table.table_type]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b rounded-t-2xl ${typeColor}`}>
          <div>
            <div className="font-bold text-lg">
              {table.table_number === 0 ? 'Main Table ⭐' : `Table ${table.table_number}`}
            </div>
            <div className="text-sm opacity-70">
              {guests.length} / {table.capacity_limit} seats filled
              {isFull && <span className="ml-2 font-semibold">· FULL</span>}
            </div>
          </div>
          <button onClick={onClose} className="text-xl leading-none opacity-50 hover:opacity-100">✕</button>
        </div>

        {/* Occupancy bar */}
        <div className="h-1.5 bg-gray-100">
          <div
            className={`h-full transition-all ${isFull ? 'bg-red-500' : 'bg-green-500'}`}
            style={{ width: `${(guests.length / table.capacity_limit) * 100}%` }}
          />
        </div>

        {/* Current guests */}
        <div className="px-5 pt-4 pb-2">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Seated guests</div>
          {guests.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No guests yet</p>
          ) : (
            <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
              {guests.map(g => (
                <div key={g.id} className="flex items-center justify-between text-sm py-0.5">
                  <div>
                    <span className="font-medium text-gray-800">{g.full_name}</span>
                    {g.category && <span className="text-gray-400 ml-1.5 text-xs">{g.category}</span>}
                  </div>
                  <div className="flex gap-2 shrink-0 ml-2">
                    <button onClick={() => removeGuest(g.id)} className="text-gray-400 hover:text-amber-600 text-xs" title="Unassign">↩</button>
                    <button onClick={() => deleteGuest(g.id)} className="text-gray-400 hover:text-red-500 text-xs" title="Delete">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add section */}
        {!isFull && (
          <div className="px-5 pb-5 flex-1">
            <div className="border-t border-gray-100 pt-4">
              {/* Tabs */}
              <div className="flex mb-4 border-b border-gray-200">
                <button
                  onClick={() => setTab('assign')}
                  className={`pb-2 text-sm font-medium border-b-2 mr-4 transition-colors ${
                    tab === 'assign' ? tabActive : 'border-transparent text-gray-400'
                  }`}
                >
                  Assign existing
                </button>
                <button
                  onClick={() => setTab('new')}
                  className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                    tab === 'new' ? tabActive : 'border-transparent text-gray-400'
                  }`}
                >
                  Add new guest
                </button>
              </div>

              {tab === 'assign' && (
                <div className="space-y-3">
                  {allUnseated.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No unseated guests</p>
                  ) : (
                    <>
                      <select
                        value={selectedId}
                        onChange={e => setSelectedId(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                      >
                        <option value="">Select a guest…</option>
                        {allUnseated.map(g => (
                          <option key={g.id} value={g.id}>
                            {g.full_name}{g.category ? ` — ${g.category}` : ''}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={assignExisting}
                        disabled={!selectedId || loading}
                        className={`w-full ${accentBg} disabled:opacity-40 text-white font-medium py-2 rounded-lg text-sm transition-colors`}
                      >
                        {loading ? 'Assigning…' : 'Assign to this table'}
                      </button>
                    </>
                  )}
                </div>
              )}

              {tab === 'new' && (
                <div className="space-y-3">
                  <input
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="Full name *"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                  <input
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    placeholder="Category (e.g. Family Peposki)"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                  <button
                    onClick={addNew}
                    disabled={!newName.trim() || loading}
                    className={`w-full ${accentBg} disabled:opacity-40 text-white font-medium py-2 rounded-lg text-sm transition-colors`}
                  >
                    {loading ? 'Adding…' : 'Add & seat at this table'}
                  </button>
                </div>
              )}

              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
