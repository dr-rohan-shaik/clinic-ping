'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Calendar,
  Users,
  CreditCard,
  MessageSquare,
  AlertCircle,
  TrendingUp,
} from 'lucide-react'

interface Stats {
  todayAppointments: number
  thisWeekAppointments: number
  totalPatients: number
  cashBalance: number
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<Stats>({
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

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
      </div>
    )
  }

  if (status === 'unauthenticated' || !session) return null

  const formatCurrency = (paise: number) => {
    const rupees = paise / 100
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(rupees)
  }

  const user = session.user
  const clinicName = user?.clinicName || 'Your Clinic'
  const userInitial = user?.name?.charAt(0).toUpperCase() || 'U'
  const userName = user?.name || 'User'
  const userRole = user?.role || 'receptionist'
  const firstName = userName.split(' ')[0] || 'there'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-600 rounded-lg" />
                <span className="font-bold text-xl text-gray-900 dark:text-white">ClinicPing</span>
              </Link>
              <span className="hidden sm:block text-sm text-gray-500 dark:text-gray-400">{clinicName}</span>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <MessageSquare className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <AlertCircle className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 pl-4 border-l border-gray-200 dark:border-gray-700">
                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                    {userInitial}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{userName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{userRole}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 md:p-8 text-white mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10">
            <h1 className="text-2xl md:text-3xl font-bold">Welcome back, {firstName}! 👋</h1>
            <p className="mt-2 text-orange-100 max-w-2xl">Here's what's happening at <span className="font-medium">{clinicName}</span> today.</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium uppercase tracking-wider">Total Patients</p>
                <p className="text-3xl md:text-4xl font-bold mt-2">{stats.totalPatients}</p>
              </div>
              <Users className="w-12 h-12 text-orange-200" />
            </div>
            <p className="mt-4 text-xs text-orange-100 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> 5% from last month
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wider">Today's Appointments</p>
                <p className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-2">{stats.todayAppointments}</p>
              </div>
              <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600" />
            </div>
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> 6% from last month
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wider">This Week</p>
                <p className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-2">{stats.thisWeekAppointments}</p>
              </div>
              <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600" />
            </div>
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> 2% from last month
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wider">Cash Balance</p>
                <p className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-2">{formatCurrency(stats.cashBalance)}</p>
              </div>
              <CreditCard className="w-12 h-12 text-gray-300 dark:text-gray-600" />
            </div>
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> 3% from last month
            </p>
          </div>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link href="/appointments/new" className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">New Appointment</span>
                </Link>
                <Link href="/patients/new" className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">Add Patient</span>
                </Link>
                <Link href="/cashbook/new" className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">Log Expense</span>
                </Link>
                <Link href="/conversations" className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">Messages</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Today's Appointments</h2>
                <Link href="/appointments" className="text-sm text-orange-600 dark:text-orange-400 hover:underline">View all</Link>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No appointments scheduled for today.
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Conversations</h2>
                <Link href="/conversations" className="text-sm text-orange-600 dark:text-orange-400 hover:underline">View all</Link>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No recent conversations.
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
