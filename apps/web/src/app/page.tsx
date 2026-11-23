import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <Link href="/auth/signin" className="inline-flex items-center">
          <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 mx-auto">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </Link>
        <h1 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">ClinicPing</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Multi-clinic SaaS for Indian clinics</p>
        <div className="mt-8">
          <Link
            href="/auth/signin"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-orange-600 hover:bg-orange-700 transition-colors"
          >
            Sign in to Dashboard
          </Link>
        </div>
        <div className="mt-12 text-sm text-gray-500 dark:text-gray-400">
          <p>Demo credentials:</p>
          <p className="font-mono text-xs mt-1">admin@demo.clinic / dev-password-change-me</p>
        </div>
      </div>
    </main>
  )
}
