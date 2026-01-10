'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { translateError } from '@/lib/utils/error-translations'

export default function AcceptInvitePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [workspaceName, setWorkspaceName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (token) {
      loadInviteInfo()
    } else {
      setError('Token de convite não fornecido')
      setLoading(false)
    }
  }, [token])

  const loadInviteInfo = async () => {
    try {
      // Buscar informações do convite (sem aceitar ainda)
      const { data, error: inviteError } = await supabase
        .from('workspace_invites')
        .select(`
          id,
          workspace_id,
          email,
          expires_at,
          accepted_at,
          workspaces (
            name
          )
        `)
        .eq('token', token)
        .single()

      if (inviteError) throw inviteError

      if (!data) {
        setError('Convite não encontrado')
        return
      }

      if (data.accepted_at) {
        setError('Este convite já foi aceito')
        return
      }

      if (new Date(data.expires_at) < new Date()) {
        setError('Este convite expirou')
        return
      }

      setWorkspaceName(data.workspaces?.name || 'Workspace')
    } catch (error: any) {
      console.error('Erro ao carregar convite:', error)
      setError(translateError(error) || 'Erro ao carregar informações do convite')
    } finally {
      setLoading(false)
    }
  }

  const acceptInvite = async () => {
    if (!user) {
      router.push(`/auth/login?redirect=/invites/accept?token=${token}`)
      return
    }

    if (!token) return

    setAccepting(true)
    try {
      // Chamar função do banco para aceitar convite
      const { data, error: acceptError } = await supabase.rpc('accept_invite', {
        invite_token: token,
      })

      if (acceptError) throw acceptError

      // Criar perfil do usuário se não existir
      await supabase
        .from('users')
        .upsert({
          id: user.id,
          full_name: user.email?.split('@')[0] || '',
        })

      alert('Convite aceito com sucesso!')
      router.push('/workspaces')
    } catch (error: any) {
      console.error('Erro ao aceitar convite:', error)
      setError(translateError(error) || 'Erro ao aceitar convite. Tente novamente.')
    } finally {
      setAccepting(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 text-center">
            <h1 className="text-2xl font-bold mb-4 text-red-600">Erro</h1>
            <p className="text-gray-800 mb-6 font-semibold">{error}</p>
            <Link href="/workspaces">
              <Button>Voltar para Workspaces</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 text-center">
            <h1 className="text-2xl font-bold mb-4 text-gray-900">Faça login para aceitar o convite</h1>
            <p className="text-gray-700 mb-6 font-medium">
              Você precisa estar logado para aceitar o convite para o workspace{' '}
              <strong>{workspaceName}</strong>.
            </p>
            <Link href={`/auth/login?redirect=/invites/accept?token=${token}`}>
              <Button>Fazer Login</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-900">Aceitar Convite</h1>
          <p className="text-gray-600 mb-6">
            Você foi convidado para participar do workspace <strong>{workspaceName}</strong>.
          </p>
          <div className="space-y-3">
            <Button onClick={acceptInvite} disabled={accepting} className="w-full">
              {accepting ? 'Aceitando...' : 'Aceitar Convite'}
            </Button>
            <Link href="/workspaces">
              <Button variant="outline" className="w-full">
                Cancelar
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

