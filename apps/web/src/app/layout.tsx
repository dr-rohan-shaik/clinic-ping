'use client'

import Link from 'next/link'
import {
  LayoutDashboard,
  MessageSquare,
  CheckSquare,
  Send,
  Wand2,
  FileText,
  MessageCircle,
  Settings
} from 'lucide-react'
import { Providers } from './providers'

const NAV_ITEMS = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'Conversations', icon: MessageSquare, href: '/conversations' },
  { name: 'Tasks', icon: CheckSquare, href: '/tasks' },
  { name: 'Messenger', icon: Send, href: '/messenger' },
  { name: 'Skills', icon: Wand2, href: '/skills' },
  { name: 'File Library', icon: FileText, href: '/library' },
  { name: 'Test Chat', icon: MessageCircle, href: '/chat' },
  { name: 'Settings', icon: Settings, href: '/settings' },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="flex h-screen bg-[#F4F4F4] text-gray-900 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col">
              <div className="flex items-center gap-2 mb-8 px-2">
                <div className="w-8 h-8 bg-orange-600 rounded-lg" />
                <span className="font-bold text-xl">ClinicPing</span>
              </div>

              <nav className="flex-1 space-y-1">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-colors"
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-8">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}