'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Guest, Table } from '@/types'
import GuestList from '@/components/GuestList'
import TableGrid from '@/components/TableGrid'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [guests, setGuests] = useState<Guest[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null)
  const [error, setError] = useState('')
  const [activeView, setActiveView] = useState<'grid' | 'list'>('grid')
  const supabase = createClient()
  const router = useRouter()

  const fetchData = useCallback(async () => {
    const [{ data: guestsData }, { data: tablesData }] = await Promise.all([
      supabase.from('guests').select('*').order('full_name'),
      supabase.from('tables').select('*').order('table_number'),
    ])
    if (guestsData) setGuests(guestsData)
    if (tablesData) setTables(tablesData)
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('realtime-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guests' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, fetchData)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase, fetchData])

  async function handleAssign(tableId: string) {
    if (!selectedGuest) return
    setError('')

    const table = tables.find(t => t.id === tableId)
    const tableGuests = guests.filter(g => g.table_id === tableId)

    if (table && tableGuests.length >= table.capacity_limit) {
      setError(`Table ${table.table_number} is full (${table.capacity_limit}/${table.capacity_limit})`)
      return
    }

    const { error: err } = await supabase
      .from('guests')
      .update({ table_id: tableId })
      .eq('id', selectedGuest.id)

    if (err) {
      setError(err.message)
    } else {
      setSelectedGuest(null)
      fetchData()
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const unseatedCount = guests.filter(g => !g.table_id).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-xl">💍</span>
          <div>
            <h1 className="font-bold text-gray-800 leading-none">Marte & Zaharie</h1>
            <p className="text-xs text-gray-400">Table Planner</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {unseatedCount > 0 && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
              {unseatedCount} unseated
            </span>
          )}
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setActiveView('grid')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                activeView === 'grid' ? 'bg-rose-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Tables
            </button>
            <button
              onClick={() => setActiveView('list')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                activeView === 'list' ? 'bg-rose-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Guests
            </button>
          </div>
          <button
            onClick={signOut}
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            Sign out
          </button>
        </div>
      </nav>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center justify-between">
          <span className="text-sm text-red-700">{error}</span>
          <button onClick={() => setError('')} className="text-red-500 text-lg leading-none">✕</button>
        </div>
      )}

      {/* Main layout — side-by-side on desktop, tabbed on mobile */}
      <div className="flex h-[calc(100vh-57px)]">
        {/* Guest sidebar — always visible on lg */}
        <aside className={`w-full lg:w-80 bg-white border-r border-gray-200 flex flex-col p-4 overflow-hidden ${
          activeView === 'list' ? 'flex' : 'hidden lg:flex'
        }`}>
          <GuestList
            guests={guests}
            tables={tables}
            selectedGuest={selectedGuest}
            onSelectGuest={setSelectedGuest}
            onRefresh={fetchData}
          />
        </aside>

        {/* Table grid — always visible on lg */}
        <main className={`flex-1 overflow-y-auto p-4 lg:p-6 ${
          activeView === 'grid' ? 'block' : 'hidden lg:block'
        }`}>
          {selectedGuest && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-300 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-rose-800">Assigning: </span>
                <span className="text-sm text-rose-700">{selectedGuest.full_name}</span>
              </div>
              <button
                onClick={() => setSelectedGuest(null)}
                className="text-rose-500 hover:text-rose-700 text-sm"
              >
                Cancel
              </button>
            </div>
          )}
          <TableGrid
            tables={tables}
            guests={guests}
            selectedGuest={selectedGuest}
            onAssign={handleAssign}
          />
        </main>
      </div>
    </div>
  )
}
