'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import Link from 'next/link'
import { translateError } from '@/lib/utils/error-translations'

interface Invite {
  id: string
  email: string
  role: string
  created_at: string
  accepted_at: string | null
  invited_by: string
  users: {
    full_name: string | null
  } | null
}

export default function InvitesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const workspaceId = params.id as string
  const [isAdmin, setIsAdmin] = useState(false)
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'member'>('member')

  useEffect(() => {
    if (user && workspaceId) {
      checkAdmin()
      loadInvites()
    }
  }, [user, workspaceId])

  const checkAdmin = async () => {
    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', user?.id)
        .single()

      if (error) throw error
      setIsAdmin(data?.role === 'admin')
    } catch (error) {
      console.error('Erro ao verificar permissões:', error)
    }
  }

  const loadInvites = async () => {
    try {
      const { data: invitesData, error } = await supabase
        .from('workspace_invites')
        .select(`
          id,
          email,
          role,
          created_at,
          accepted_at,
          invited_by
        `)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Buscar dados dos usuários que enviaram convites separadamente
      if (invitesData && invitesData.length > 0) {
        const userIds = invitesData.map((invite: any) => invite.invited_by).filter(Boolean)
        const { data: usersData } = await supabase
          .from('users')
          .select('id, full_name')
          .in('id', userIds)

        // Combinar dados
        const invitesWithUsers = invitesData.map((invite: any) => ({
          ...invite,
          users: usersData?.find((u: any) => u.id === invite.invited_by) || null,
        }))

        setInvites(invitesWithUsers)
      } else {
        setInvites([])
      }
    } catch (error) {
      console.error('Erro ao carregar convites:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setSending(true)
    try {
      // Gerar token único
      const token = crypto.randomUUID()

      // Criar convite (expira em 7 dias)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      const { error } = await supabase
        .from('workspace_invites')
        .insert({
          workspace_id: workspaceId,
          email: email.trim().toLowerCase(),
          role,
          token,
          invited_by: user?.id,
          expires_at: expiresAt.toISOString(),
        })

      if (error) throw error

      // Gerar link do convite
      const inviteLink = `${window.location.origin}/invites/accept?token=${token}`
      
      alert(`Convite criado! Link: ${inviteLink}\n\nCopie este link e envie para ${email}`)
      
      setEmail('')
      setRole('member')
      loadInvites()
    } catch (error: any) {
      console.error('Erro ao enviar convite:', error)
      alert(translateError(error) || 'Erro ao enviar convite. Tente novamente.')
    } finally {
      setSending(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600 font-medium">Carregando...</p>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 text-center">
            <h1 className="text-2xl font-bold mb-4 text-gray-900">Acesso Negado</h1>
            <p className="text-gray-700 mb-4 font-medium">
              Apenas administradores podem gerenciar convites.
            </p>
            <Link href="/workspaces">
              <Button>Voltar para Workspaces</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <Link href="/workspaces" className="text-blue-600 hover:text-blue-700">
            ← Voltar para Workspaces
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 mb-6">
          <h1 className="text-3xl font-bold mb-6 text-gray-900">Convidar Usuários</h1>

          <form onSubmit={sendInvite} className="space-y-4">
            <div>
              <Label htmlFor="email">Email do usuário</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@exemplo.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="role">Papel</Label>
              <Select value={role} onValueChange={(value: 'admin' | 'member') => setRole(value)}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Membro</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={sending}>
              {sending ? 'Enviando...' : 'Enviar Convite'}
            </Button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Convites Enviados</h2>
          {invites.length === 0 ? (
            <p className="text-gray-700 font-medium">Nenhum convite enviado ainda.</p>
          ) : (
            <div className="space-y-3">
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{invite.email}</p>
                    <p className="text-sm text-gray-700 font-medium">
                      {invite.role === 'admin' ? 'Administrador' : 'Membro'} •{' '}
                      {invite.accepted_at
                        ? `Aceito em ${new Date(invite.accepted_at).toLocaleDateString('pt-BR')}`
                        : 'Pendente'}
                    </p>
                  </div>
                  {!invite.accepted_at && (
                    <span className="text-sm text-yellow-600 bg-yellow-50 px-3 py-1 rounded">
                      Pendente
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

