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

const PeopleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
  </svg>
)

const PersonIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
)

const colors = {
  Women: {
    accent: 'bg-rose-600 hover:bg-rose-700',
    accentText: 'text-rose-600',
    tabUnderline: 'border-rose-600',
    ring: 'focus:ring-rose-300',
    emptyCard: 'border-rose-200 bg-rose-50',
    emptyIcon: 'bg-rose-100 text-rose-500',
  },
  Men: {
    accent: 'bg-blue-600 hover:bg-blue-700',
    accentText: 'text-blue-600',
    tabUnderline: 'border-blue-600',
    ring: 'focus:ring-blue-300',
    emptyCard: 'border-blue-200 bg-blue-50',
    emptyIcon: 'bg-blue-100 text-blue-500',
  },
  Main: {
    accent: 'bg-amber-600 hover:bg-amber-700',
    accentText: 'text-amber-600',
    tabUnderline: 'border-amber-600',
    ring: 'focus:ring-amber-300',
    emptyCard: 'border-amber-200 bg-amber-50',
    emptyIcon: 'bg-amber-100 text-amber-500',
  },
}

export default function TableModal({ table, guests, allUnseated, onClose, onRefresh }: Props) {
  const [tab, setTab] = useState<'assign' | 'new'>('assign')
  const [search, setSearch] = useState('')
  const [newName, setNewName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const isFull = guests.length >= table.capacity_limit
  const c = colors[table.table_type] ?? colors.Women

  const filteredUnseated = allUnseated.filter(g =>
    !search || g.full_name.toLowerCase().includes(search.toLowerCase())
  )

  async function assignGuest(id: string) {
    setLoading(true)
    setError('')
    const { error: err } = await supabase.from('guests').update({ table_id: table.id }).eq('id', id)
    if (err) setError(err.message)
    else { setSearch(''); onRefresh() }
    setLoading(false)
  }

  async function addNew() {
    if (!newName.trim()) return
    setLoading(true)
    setError('')
    const { error: err } = await supabase
      .from('guests')
      .insert({ full_name: newName.trim(), category: '', side: table.table_type, table_id: table.id })
    if (err) setError(err.message)
    else { setNewName(''); onRefresh() }
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
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Modal header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100 shrink-0">
          <div>
            <div className="font-bold text-gray-900 text-base">
              {table.table_number === 0 ? 'Main Table ⭐' : `Table ${table.table_number}`}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              {guests.length} / {table.capacity_limit} seats{isFull ? ' · FULL' : ''}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 text-lg transition-colors"
          >
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

          {/* SEATED section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <PeopleIcon className={`w-4 h-4 ${c.accentText}`} />
              <span className={`text-xs font-bold uppercase tracking-widest ${c.accentText}`}>
                Seated ({guests.length})
              </span>
            </div>

            {guests.length === 0 ? (
              <div className={`border border-dashed rounded-2xl px-4 py-4 flex items-center gap-4 ${c.emptyCard}`}>
                <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${c.emptyIcon}`}>
                  <PeopleIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-gray-800 text-sm">No guests seated yet</div>
                  <div className="text-gray-400 text-xs mt-0.5">Add guests to start seating this table.</div>
                </div>
              </div>
            ) : (
              <div className="space-y-0.5">
                {guests.map(g => (
                  <div key={g.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="font-medium text-gray-800 text-sm truncate">{g.full_name}</span>
                    <div className="flex gap-1 shrink-0 ml-3">
                      <button
                        onClick={() => removeGuest(g.id)}
                        className="text-gray-400 hover:text-amber-500 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Unassign"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                      </button>
                      <button
                        onClick={() => deleteGuest(g.id)}
                        className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Delete"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tab bar + content */}
          {!isFull && (
            <div>
              {/* Tab row */}
              <div className="flex items-end gap-3 border-b border-gray-200 mb-4">
                {/* Assign existing — underline tab */}
                <button
                  onClick={() => setTab('assign')}
                  className={`flex items-center gap-1.5 pb-2.5 text-sm font-semibold border-b-2 transition-colors flex-1 ${
                    tab === 'assign'
                      ? `${c.tabUnderline} ${c.accentText}`
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <PeopleIcon className="w-4 h-4" />
                  Assign existing
                </button>

                {/* Add new guest — pill button */}
                <button
                  onClick={() => setTab('new')}
                  className={`flex items-center gap-1.5 mb-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors shrink-0 ${
                    tab === 'new'
                      ? `${c.accent} text-white`
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Add new guest
                </button>
              </div>

              {/* Assign existing panel */}
              {tab === 'assign' && (
                <div className="space-y-3">
                  {/* Search */}
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search unseated guests..."
                      className={`w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${c.ring} bg-white`}
                    />
                  </div>

                  {/* Unseated list or empty state */}
                  {filteredUnseated.length === 0 ? (
                    <div className="border border-dashed border-gray-200 rounded-2xl py-8 flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <PersonIcon className="w-6 h-6 text-gray-400" />
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-gray-700 text-sm">No unseated guests</div>
                        <div className="text-gray-400 text-xs mt-0.5">All guests are already seated.</div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-0.5 max-h-44 overflow-y-auto">
                      {filteredUnseated.map(g => (
                        <button
                          key={g.id}
                          onClick={() => assignGuest(g.id)}
                          disabled={loading}
                          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 text-left transition-colors group"
                        >
                          <span className="font-medium text-gray-800 text-sm truncate">{g.full_name}</span>
                          <span className={`text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2 ${c.accentText}`}>
                            Assign →
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Add new guest panel */}
              {tab === 'new' && (
                <div className="space-y-3">
                  <input
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addNew()}
                    placeholder="Full name *"
                    autoFocus
                    className={`w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 ${c.ring}`}
                  />
                  <button
                    onClick={addNew}
                    disabled={!newName.trim() || loading}
                    className={`w-full ${c.accent} disabled:opacity-40 text-white font-semibold py-3 rounded-xl text-sm transition-colors`}
                  >
                    {loading ? 'Adding…' : 'Add & seat at this table'}
                  </button>
                </div>
              )}

              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>
          )}

          {isFull && (
            <div className="text-center py-3 text-sm text-red-500 font-semibold">
              This table is full
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
