'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
export default function PgAdminPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isRedirecting, setIsRedirecting] = useState(true);
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
            return;
        }
        if (status === 'authenticated') {
            // Redirect to pgAdmin service
            window.location.href = 'http://localhost:5050';
        }
        setIsRedirecting(false);
    }, [status, router]);
    if (isRedirecting || status === 'loading') {
        return (<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Redirecting to pgAdmin...</p>
        </div>
      </div>);
    }
    return null;
}
