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

  const accentBg = {
    Main: 'bg-amber-500 hover:bg-amber-600',
    Women: 'bg-rose-500 hover:bg-rose-600',
    Men: 'bg-blue-500 hover:bg-blue-600',
  }[table.table_type]

  const tabActive = {
    Main: 'border-amber-500 text-amber-700',
    Women: 'border-rose-500 text-rose-700',
    Men: 'border-blue-500 text-blue-700',
  }[table.table_type]

  const headerBg = {
    Main: 'bg-amber-50 border-amber-200',
    Women: 'bg-rose-50 border-rose-200',
    Men: 'bg-blue-50 border-blue-200',
  }[table.table_type]

  const headerText = {
    Main: 'text-amber-800',
    Women: 'text-rose-800',
    Men: 'text-blue-800',
  }[table.table_type]

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

  return (
    /* Full-screen on mobile, centered card on desktop */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${headerBg} sm:rounded-t-2xl`}>
          <div>
            <div className={`font-bold text-lg ${headerText}`}>
              {table.table_number === 0 ? 'Main Table ⭐' : `Table ${table.table_number}`}
            </div>
            <div className={`text-sm opacity-70 ${headerText}`}>
              {guests.length} / {table.capacity_limit} seats
              {isFull && <span className="ml-2 font-semibold">· FULL</span>}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/60 text-gray-500 hover:text-gray-800 text-lg">
            ✕
          </button>
        </div>

        {/* Occupancy bar */}
        <div className="h-1 bg-gray-100 shrink-0">
          <div
            className={`h-full transition-all ${isFull ? 'bg-red-400' : 'bg-green-400'}`}
            style={{ width: `${(guests.length / table.capacity_limit) * 100}%` }}
          />
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {/* Seated guests */}
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Seated ({guests.length})
            </div>
            {guests.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No guests yet — add one below</p>
            ) : (
              <div className="space-y-1">
                {guests.map(g => (
                  <div key={g.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <div className="min-w-0">
                      <span className="font-medium text-gray-800 text-sm">{g.full_name}</span>
                      {g.category && (
                        <span className="text-gray-400 text-xs ml-1.5">{g.category}</span>
                      )}
                    </div>
                    <div className="flex gap-3 shrink-0 ml-3">
                      <button
                        onClick={() => removeGuest(g.id)}
                        className="text-gray-400 hover:text-amber-500 text-sm py-1 px-1"
                        title="Unassign"
                      >
                        ↩
                      </button>
                      <button
                        onClick={() => deleteGuest(g.id)}
                        className="text-gray-400 hover:text-red-500 text-sm py-1 px-1"
                        title="Delete guest"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add section */}
          {!isFull && (
            <div className="border-t border-gray-100 pt-4">
              {/* Tabs */}
              <div className="flex border-b border-gray-200 mb-4">
                <button
                  onClick={() => setTab('assign')}
                  className={`flex-1 pb-2.5 text-sm font-medium border-b-2 transition-colors ${
                    tab === 'assign' ? tabActive : 'border-transparent text-gray-400'
                  }`}
                >
                  Assign existing
                </button>
                <button
                  onClick={() => setTab('new')}
                  className={`flex-1 pb-2.5 text-sm font-medium border-b-2 transition-colors ${
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
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 bg-white"
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
                        className={`w-full ${accentBg} disabled:opacity-40 text-white font-semibold py-3 rounded-xl text-sm transition-colors`}
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
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
                  />
                  <input
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    placeholder="Category (e.g. Family Peposki)"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
                  />
                  <button
                    onClick={addNew}
                    disabled={!newName.trim() || loading}
                    className={`w-full ${accentBg} disabled:opacity-40 text-white font-semibold py-3 rounded-xl text-sm transition-colors`}
                  >
                    {loading ? 'Adding…' : 'Add & seat at this table'}
                  </button>
                </div>
              )}

              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
