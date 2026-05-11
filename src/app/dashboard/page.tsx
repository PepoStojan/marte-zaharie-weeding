'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-rose-50 flex flex-col">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💍</span>
          <div>
            <h1 className="font-bold text-gray-800 leading-none">Marte & Zaharie</h1>
            <p className="text-xs text-gray-400">Wedding Table Planner</p>
          </div>
        </div>
        <button onClick={signOut} className="text-sm text-gray-500 hover:text-gray-700">
          Sign out
        </button>
      </nav>

      {/* Side picker */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 p-8">
        <h2 className="text-2xl font-bold text-gray-700">Choose a section</h2>

        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl">
          {/* Women's Side */}
          <button
            onClick={() => router.push('/dashboard/women')}
            className="flex-1 bg-white border-2 border-rose-200 hover:border-rose-400 hover:shadow-lg rounded-2xl p-10 flex flex-col items-center gap-4 transition-all group"
          >
            <div className="w-20 h-20 rounded-full bg-rose-100 group-hover:bg-rose-200 flex items-center justify-center text-4xl transition-colors">
              👰
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-rose-700">Women's Side</div>
              <div className="text-sm text-gray-400 mt-1">30 tables</div>
            </div>
          </button>

          {/* Men's Side */}
          <button
            onClick={() => router.push('/dashboard/men')}
            className="flex-1 bg-white border-2 border-blue-200 hover:border-blue-400 hover:shadow-lg rounded-2xl p-10 flex flex-col items-center gap-4 transition-all group"
          >
            <div className="w-20 h-20 rounded-full bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center text-4xl transition-colors">
              🤵
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-blue-700">Men's Side</div>
              <div className="text-sm text-gray-400 mt-1">28 tables</div>
            </div>
          </button>

          {/* Main Table */}
          <button
            onClick={() => router.push('/dashboard/main')}
            className="flex-1 bg-white border-2 border-amber-200 hover:border-amber-400 hover:shadow-lg rounded-2xl p-10 flex flex-col items-center gap-4 transition-all group"
          >
            <div className="w-20 h-20 rounded-full bg-amber-100 group-hover:bg-amber-200 flex items-center justify-center text-4xl transition-colors">
              ⭐
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-amber-700">Main Table</div>
              <div className="text-sm text-gray-400 mt-1">1 table</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
