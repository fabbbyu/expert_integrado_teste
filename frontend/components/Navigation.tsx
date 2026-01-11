'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function Navigation() {
  const pathname = usePathname()
  const { user, signOut, loading } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
  }

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + '/')
  }

  // Não mostrar navegação na página de login ou enquanto carrega
  if (loading || pathname === '/auth/login' || !user) return null

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex space-x-8">
            <Link
              href="/dashboard"
              className={`px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
                isActive('/dashboard')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-900 hover:bg-blue-50 hover:text-blue-700'
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/leads"
              className={`px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
                isActive('/leads')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-900 hover:bg-blue-50 hover:text-blue-700'
              }`}
            >
              Leads
            </Link>
            <Link
              href="/campaigns"
              className={`px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
                isActive('/campaigns')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-900 hover:bg-blue-50 hover:text-blue-700'
              }`}
            >
              Campanhas
            </Link>
            <Link
              href="/workspaces"
              className={`px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
                isActive('/workspaces')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-900 hover:bg-blue-50 hover:text-blue-700'
              }`}
            >
              Workspaces
            </Link>
            <div className="relative group">
              <button
                className={`px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
                  isActive('/settings')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-900 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                Configurações
              </button>
              <div className="absolute left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition">
                <div className="py-1">
                  <Link
                    href="/settings/funnel"
                    className="block px-4 py-2 text-sm text-gray-900 hover:bg-blue-50 hover:text-blue-700 font-medium"
                  >
                    Funil
                  </Link>
                  <Link
                    href="/settings/custom-fields"
                    className="block px-4 py-2 text-sm text-gray-900 hover:bg-blue-50 hover:text-blue-700 font-medium"
                  >
                    Campos Personalizados
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleSignOut}
              className="px-3 py-2 text-sm text-gray-900 hover:text-blue-700 font-semibold transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

