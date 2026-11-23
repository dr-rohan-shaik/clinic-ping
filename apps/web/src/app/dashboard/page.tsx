'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const { status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState({
    todayAppointments: 0,
    thisWeekAppointments: 0,
    totalPatients: 0,
    cashBalance: 0,
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/dashboard/stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      }
    }
    fetchStats()
  }, [])

  if (status === 'loading') return null

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#FFEFE6] rounded-2xl p-6 relative overflow-hidden border border-[#FFDEC9]">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back! 👋
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Here's what's happening in your clinic today.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Primary Accent Card */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-medium text-orange-100 uppercase tracking-wider">Total Patients</span>
            <div className="text-3xl font-bold mt-2">{stats.totalPatients}</div>
          </div>
          <div className="text-xs text-orange-100 mt-4 flex items-center gap-1">
            <span>↑ 5</span>
            <span>Increased from last month</span>
          </div>
        </div>

        {/* Secondary Cards */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Today's Appointments</span>
            <div className="text-3xl font-bold text-gray-900 mt-2">{stats.todayAppointments}</div>
          </div>
          <div className="text-xs text-gray-500 mt-4 flex items-center gap-1">
            <span>↑ 6</span>
            <span>Increased from last month</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">This Week</span>
            <div className="text-3xl font-bold text-gray-900 mt-2">{stats.thisWeekAppointments}</div>
          </div>
          <div className="text-xs text-gray-500 mt-4 flex items-center gap-1">
            <span>↑ 2</span>
            <span>Increased from last month</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Cash Balance</span>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              ₹{(stats.cashBalance / 100).toLocaleString('en-IN')}
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-4 flex items-center gap-1">
            <span>↑ 3</span>
            <span>Increased from last month</span>
          </div>
        </div>
      </div>

      {/* Split Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Latest Conversations */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-gray-900">Latest Conversations</h2>
            <button className="text-xs font-medium text-gray-500 hover:text-gray-900">View All &gt;</button>
          </div>
          <div className="space-y-3">
            {/* Mock Item */}
            <div className="p-3 border border-gray-100 rounded-lg flex justify-between items-center bg-gray-50">
              <div>
                <div className="font-semibold text-sm">919876543210</div>
                <div className="text-xs text-gray-500 mt-0.5">Hello, I would like to book an appointment.</div>
              </div>
              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Active</span>
            </div>
          </div>
        </div>

        {/* Right Column: Human Handoff */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col items-center justify-center min-h-[200px] text-center">
          <div className="w-10 h-10 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-2">
            👤
          </div>
          <div className="font-semibold text-sm text-gray-900">No handoff requests</div>
          <div className="text-xs text-gray-500 mt-1 max-w-[250px]">
            Conversations requiring human attention will appear here.
          </div>
        </div>
      </div>
    </div>
  )
}