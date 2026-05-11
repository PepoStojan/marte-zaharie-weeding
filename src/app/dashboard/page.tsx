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
        <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <span className="text-2xl">💍</span>
          <div className="text-left">
            <h1 className="font-bold text-gray-800 leading-none">Marte & Zaharie</h1>
            <p className="text-xs text-gray-400">Wedding Table Planner</p>
          </div>
        </button>
        <button onClick={signOut} className="text-sm text-gray-500 hover:text-gray-700">
          Sign out
        </button>
      </nav>

      {/* Side picker */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 p-8">
        <h2 className="text-2xl font-bold text-gray-700">Choose a section</h2>

        <div className="flex flex-col sm:flex-row gap-8 w-full max-w-2xl">
          {/* Martuly's Side */}
          <button
            onClick={() => router.push('/dashboard/women')}
            className="flex-1 bg-white border-2 border-rose-200 hover:border-rose-400 hover:shadow-xl rounded-3xl p-12 flex flex-col items-center gap-6 transition-all group active:scale-95"
          >
            <div className="w-36 h-36 rounded-full bg-rose-100 overflow-hidden shadow-md group-hover:shadow-rose-200 group-hover:shadow-lg transition-shadow">
              <img src="/martina.png" alt="Martuly" className="w-full h-full object-cover object-top" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-rose-700">Martuly Side</div>
              <div className="text-sm text-gray-400 mt-1">29 tables</div>
            </div>
          </button>

          {/* Zaharie's Side */}
          <button
            onClick={() => router.push('/dashboard/men')}
            className="flex-1 bg-white border-2 border-blue-200 hover:border-blue-400 hover:shadow-xl rounded-3xl p-12 flex flex-col items-center gap-6 transition-all group active:scale-95"
          >
            <div className="w-36 h-36 rounded-full bg-blue-100 overflow-hidden shadow-md group-hover:shadow-blue-200 group-hover:shadow-lg transition-shadow">
              <img src="/zaharie.png" alt="Zaharie" className="w-full h-full object-cover object-top" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-700">Zaharie Side</div>
              <div className="text-sm text-gray-400 mt-1">26 tables</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
